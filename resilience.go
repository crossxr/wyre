package wyre

import (
	"errors"
	"math/rand"
	"net/http"
	"sync"
	"time"
)

// CircuitState defines the state of the circuit breaker.
type CircuitState int

const (
	StateClosed CircuitState = iota
	StateOpen
	StateHalfOpen
)

func (s CircuitState) String() string {
	switch s {
	case StateClosed:
		return "Closed"
	case StateOpen:
		return "Open"
	case StateHalfOpen:
		return "Half-Open"
	default:
		return "Unknown"
	}
}

var ErrCircuitOpen = errors.New("circuit breaker is open - request blocked")

// CircuitBreakerConfig configures the circuit breaker.
type CircuitBreakerConfig struct {
	FailureThreshold int           // Number of consecutive failures before tripping
	Cooldown         time.Duration // Time to wait in Open state before trying again (transitioning to Half-Open)
	SuccessThreshold int           // Number of consecutive successes required in Half-Open state to Close
}

// CircuitBreaker implements the circuit breaker pattern.
type CircuitBreaker struct {
	cfg   CircuitBreakerConfig
	mu    sync.Mutex
	state CircuitState
	
	consecutiveFailures int
	consecutiveSuccesses int
	lastStateChange      time.Time
}

// NewCircuitBreaker creates a new CircuitBreaker.
func NewCircuitBreaker(cfg CircuitBreakerConfig) *CircuitBreaker {
	if cfg.FailureThreshold <= 0 {
		cfg.FailureThreshold = 5
	}
	if cfg.Cooldown <= 0 {
		cfg.Cooldown = 5 * time.Second
	}
	if cfg.SuccessThreshold <= 0 {
		cfg.SuccessThreshold = 2
	}
	return &CircuitBreaker{
		cfg:             cfg,
		state:           StateClosed,
		lastStateChange: time.Now(),
	}
}

// Allow checks if the request is permitted through the circuit breaker.
// It handles open timeout transition to Half-Open.
func (cb *CircuitBreaker) Allow() bool {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	now := time.Now()
	if cb.state == StateOpen {
		if now.Sub(cb.lastStateChange) >= cb.cfg.Cooldown {
			cb.state = StateHalfOpen
			cb.lastStateChange = now
			cb.consecutiveSuccesses = 0
			return true
		}
		return false
	}
	return true
}

// RecordSuccess registers a successful execution, potentially closing the breaker.
func (cb *CircuitBreaker) RecordSuccess() {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	cb.consecutiveFailures = 0
	if cb.state == StateHalfOpen {
		cb.consecutiveSuccesses++
		if cb.consecutiveSuccesses >= cb.cfg.SuccessThreshold {
			cb.state = StateClosed
			cb.lastStateChange = time.Now()
		}
	}
}

// RecordFailure registers a failed execution, potentially opening the breaker.
func (cb *CircuitBreaker) RecordFailure() {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	cb.consecutiveSuccesses = 0
	if cb.state == StateClosed {
		cb.consecutiveFailures++
		if cb.consecutiveFailures >= cb.cfg.FailureThreshold {
			cb.state = StateOpen
			cb.lastStateChange = time.Now()
		}
	} else if cb.state == StateHalfOpen {
		cb.state = StateOpen
		cb.lastStateChange = time.Now()
	}
}

// State returns the current state of the circuit breaker.
func (cb *CircuitBreaker) State() CircuitState {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	return cb.state
}

// ResilientRoundTripper wraps an existing http.RoundTripper with retries and a circuit breaker.
type ResilientRoundTripper struct {
	next           http.RoundTripper
	cb             *CircuitBreaker
	maxRetries     int
	initialBackoff time.Duration
	maxBackoff     time.Duration
}

// ResilientConfig configures the ResilientRoundTripper.
type ResilientConfig struct {
	RoundTripper   http.RoundTripper
	CircuitBreaker *CircuitBreaker
	MaxRetries     int
	InitialBackoff time.Duration
	MaxBackoff     time.Duration
}

// NewResilientRoundTripper creates a new ResilientRoundTripper wrapper.
func NewResilientRoundTripper(cfg ResilientConfig) *ResilientRoundTripper {
	if cfg.RoundTripper == nil {
		cfg.RoundTripper = http.DefaultTransport
	}
	if cfg.CircuitBreaker == nil {
		cfg.CircuitBreaker = NewCircuitBreaker(CircuitBreakerConfig{})
	}
	maxRetries := 3
	if cfg.MaxRetries > 0 {
		maxRetries = cfg.MaxRetries
	} else if cfg.MaxRetries < 0 {
		maxRetries = 0
	}
	if cfg.InitialBackoff <= 0 {
		cfg.InitialBackoff = 100 * time.Millisecond
	}
	if cfg.MaxBackoff <= 0 {
		cfg.MaxBackoff = 2 * time.Second
	}
	return &ResilientRoundTripper{
		next:           cfg.RoundTripper,
		cb:             cfg.CircuitBreaker,
		maxRetries:     maxRetries,
		initialBackoff: cfg.InitialBackoff,
		maxBackoff:     cfg.MaxBackoff,
	}
}

// RoundTrip executes the request, wrapping it with retries and circuit breaker protection.
func (rt *ResilientRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	if !rt.cb.Allow() {
		return nil, ErrCircuitOpen
	}

	var lastErr error
	var resp *http.Response
	backoff := rt.initialBackoff
	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	for attempt := 0; attempt <= rt.maxRetries; attempt++ {
		if err := req.Context().Err(); err != nil {
			return nil, err
		}

		if attempt > 0 {
			halfBackoff := int64(backoff / 2)
			var jitter time.Duration
			if halfBackoff > 0 {
				jitter = time.Duration(r.Int63n(halfBackoff))
			}
			sleepTime := backoff/2 + jitter
			
			select {
			case <-req.Context().Done():
				return nil, req.Context().Err()
			case <-time.After(sleepTime):
			}
			backoff *= 2
			if backoff > rt.maxBackoff {
				backoff = rt.maxBackoff
			}
		}

		resp, lastErr = rt.next.RoundTrip(req)
		
		isFailure := false
		shouldRetry := false

		if lastErr != nil {
			isFailure = true
			shouldRetry = true
		} else {
			if resp.StatusCode >= 500 {
				isFailure = true
				shouldRetry = true
			} else if resp.StatusCode == 429 {
				shouldRetry = true
			}
		}

		if isFailure {
			rt.cb.RecordFailure()
		} else {
			rt.cb.RecordSuccess()
		}

		if !shouldRetry {
			return resp, lastErr
		}

		if resp != nil && resp.Body != nil {
			resp.Body.Close()
		}
	}

	return resp, lastErr
}
