package wyre

import (
	"context"
	"errors"
	"net/http"
	"sync"
	"testing"
	"time"
)

type mockRoundTripper struct {
	mu        sync.Mutex
	callCount int
	handler   func(req *http.Request) (*http.Response, error)
}

func (m *mockRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.callCount++
	return m.handler(req)
}

func TestResilienceRetries(t *testing.T) {
	// Mock returns 500 twice, then 200
	calls := 0
	mock := &mockRoundTripper{
		handler: func(req *http.Request) (*http.Response, error) {
			calls++
			if calls < 3 {
				return &http.Response{StatusCode: 500, Body: http.NoBody}, nil
			}
			return &http.Response{StatusCode: 200, Body: http.NoBody}, nil
		},
	}

	rt := NewResilientRoundTripper(ResilientConfig{
		RoundTripper:   mock,
		MaxRetries:     3,
		InitialBackoff: 1 * time.Millisecond,
		MaxBackoff:     5 * time.Millisecond,
	})

	req, _ := http.NewRequestWithContext(context.Background(), "GET", "http://example.com", nil)
	resp, err := rt.RoundTrip(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		t.Errorf("expected status 200, got %d", resp.StatusCode)
	}
	if calls != 3 {
		t.Errorf("expected 3 total calls (initial + 2 retries), got %d", calls)
	}
}

func TestResilienceCircuitBreakerTripping(t *testing.T) {
	// Mock constantly returns 500
	mock := &mockRoundTripper{
		handler: func(req *http.Request) (*http.Response, error) {
			return &http.Response{StatusCode: 500, Body: http.NoBody}, nil
		},
	}

	cb := NewCircuitBreaker(CircuitBreakerConfig{
		FailureThreshold: 2,
		Cooldown:         50 * time.Millisecond,
	})

	rt := NewResilientRoundTripper(ResilientConfig{
		RoundTripper:   mock,
		CircuitBreaker: cb,
		MaxRetries:     -1, // disable retries to easily observe breaker tripping
	})

	req, _ := http.NewRequestWithContext(context.Background(), "GET", "http://example.com", nil)

	// Call 1: fails, breaker remains Closed (failures=1)
	_, _ = rt.RoundTrip(req)
	if cb.State() != StateClosed {
		t.Errorf("expected Closed state, got %v", cb.State())
	}

	// Call 2: fails, breaker trips Open (failures=2)
	_, _ = rt.RoundTrip(req)
	if cb.State() != StateOpen {
		t.Errorf("expected Open state, got %v", cb.State())
	}

	// Call 3: should fail immediately with ErrCircuitOpen without hitting transport
	mock.mu.Lock()
	mock.callCount = 0
	mock.mu.Unlock()

	_, err := rt.RoundTrip(req)
	if !errors.Is(err, ErrCircuitOpen) {
		t.Errorf("expected ErrCircuitOpen, got %v", err)
	}
	if mock.callCount != 0 {
		t.Errorf("expected 0 calls to transport while open, got %d", mock.callCount)
	}
}

func TestResilienceCircuitBreakerRecovery(t *testing.T) {
	// Mock starts failing, then succeeds
	succeed := false
	mock := &mockRoundTripper{
		handler: func(req *http.Request) (*http.Response, error) {
			if succeed {
				return &http.Response{StatusCode: 200, Body: http.NoBody}, nil
			}
			return &http.Response{StatusCode: 500, Body: http.NoBody}, nil
		},
	}

	cb := NewCircuitBreaker(CircuitBreakerConfig{
		FailureThreshold: 1,
		Cooldown:         10 * time.Millisecond,
		SuccessThreshold: 2,
	})

	rt := NewResilientRoundTripper(ResilientConfig{
		RoundTripper:   mock,
		CircuitBreaker: cb,
		MaxRetries:     -1,
	})

	req, _ := http.NewRequestWithContext(context.Background(), "GET", "http://example.com", nil)

	// Call 1: fails, trips Open
	_, _ = rt.RoundTrip(req)
	if cb.State() != StateOpen {
		t.Fatalf("expected Open state, got %v", cb.State())
	}

	// Wait for cooldown
	time.Sleep(15 * time.Millisecond)

	succeed = true

	// Call 2: should transition to Half-Open and succeed (successes=1)
	resp, err := rt.RoundTrip(req)
	if err != nil || resp.StatusCode != 200 {
		t.Fatalf("expected success, got err=%v code=%d", err, resp.StatusCode)
	}
	resp.Body.Close()
	if cb.State() != StateHalfOpen {
		t.Errorf("expected Half-Open state, got %v", cb.State())
	}

	// Call 3: success (successes=2 >= SuccessThreshold), should close the breaker
	resp, err = rt.RoundTrip(req)
	if err != nil {
		t.Fatalf("expected success, got err=%v", err)
	}
	resp.Body.Close()
	if cb.State() != StateClosed {
		t.Errorf("expected Closed state, got %v", cb.State())
	}
}

func TestResilienceRateLimiting(t *testing.T) {
	// Mock returns 429, then 200
	calls := 0
	mock := &mockRoundTripper{
		handler: func(req *http.Request) (*http.Response, error) {
			calls++
			if calls == 1 {
				return &http.Response{StatusCode: 429, Body: http.NoBody}, nil
			}
			return &http.Response{StatusCode: 200, Body: http.NoBody}, nil
		},
	}

	cb := NewCircuitBreaker(CircuitBreakerConfig{
		FailureThreshold: 1, // small threshold
	})

	rt := NewResilientRoundTripper(ResilientConfig{
		RoundTripper:   mock,
		CircuitBreaker: cb,
		MaxRetries:     1,
		InitialBackoff: 1 * time.Millisecond,
	})

	req, _ := http.NewRequestWithContext(context.Background(), "GET", "http://example.com", nil)
	resp, err := rt.RoundTrip(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	resp.Body.Close()

	if cb.State() != StateClosed {
		t.Errorf("expected breaker to remain Closed during rate limiting, got %v", cb.State())
	}
	if calls != 2 {
		t.Errorf("expected 2 calls, got %d", calls)
	}
}
