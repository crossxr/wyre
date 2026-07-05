package wyre

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"net"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

func TestIdempotencyKeyBasic(t *testing.T) {
	router := NewRouter()
	store := NewInMemoryIdempotencyStore(10*time.Second, 1*time.Second)
	cfgLimiter := DefaultIdempotencyConfig()
	cfgLimiter.Store = store
	middleware := IdempotencyKey(cfgLimiter)

	var executionCount int32

	router.Handle("POST", "/payment", middleware(HandlerFunc(func(w *ResponseWriter, r *Request) {
		atomic.AddInt32(&executionCount, 1)
		w.Header().Set("Content-Type", "application/json")
		w.WriteFixedBody(201, "application/json", []byte(`{"status":"success","amount":100}`))
	})))

	cfg := DefaultConfig("127.0.0.1:0")
	cfg.Handler = router
	server := NewWithConfig(cfg)

	listener, err := net.Listen("tcp", server.cfg.Addr)
	if err != nil {
		t.Fatalf("failed to listen: %v", err)
	}
	server.ln = listener
	server.conns = make(map[net.Conn]struct{})

	go func() {
		_ = server.serve()
	}()
	defer server.Shutdown(context.Background())
	addr := listener.Addr().String()

	sendReq := func(key string, body string) string {
		conn, err := net.Dial("tcp", addr)
		if err != nil {
			return err.Error()
		}
		defer conn.Close()
		reqLine := fmt.Sprintf("POST /payment HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\nContent-Length: %d\r\n", len(body))
		if key != "" {
			reqLine += "Idempotency-Key: " + key + "\r\n"
		}
		reqLine += "\r\n" + body
		_, _ = conn.Write([]byte(reqLine))
		rdr := bufio.NewReader(conn)
		respBytes, _ := io.ReadAll(rdr)
		return string(respBytes)
	}

	// 1. Initial request (should execute handler)
	resp1 := sendReq("key-1", `{"card":"1234"}`)
	if !strings.Contains(resp1, "201 Created") {
		t.Errorf("expected 201 Created, got: %q", resp1)
	}
	if !strings.Contains(resp1, `{"status":"success","amount":100}`) {
		t.Errorf("expected correct body, got: %q", resp1)
	}
	if strings.Contains(resp1, "Idempotency-Replay") {
		t.Errorf("initial request should not contain Idempotency-Replay header")
	}

	// 2. Replay request with same key (should replay cached response)
	resp2 := sendReq("key-1", `{"card":"1234"}`)
	if !strings.Contains(resp2, "201 Created") {
		t.Errorf("expected 201 Created on replay, got: %q", resp2)
	}
	if !strings.Contains(resp2, "idempotency-replay: true") {
		t.Errorf("expected Idempotency-Replay header, got: %q", resp2)
	}

	// Verify execution count is exactly 1
	if count := atomic.LoadInt32(&executionCount); count != 1 {
		t.Errorf("expected handler execution count to be 1, got %d", count)
	}

	// 3. Mismatch request with same key but different body (should return 400)
	resp3 := sendReq("key-1", `{"card":"9999"}`)
	if !strings.Contains(resp3, "400 Bad Request") {
		t.Errorf("expected 400 Bad Request on parameter mismatch, got: %q", resp3)
	}
	if !strings.Contains(resp3, "Idempotency key spent with different parameters") {
		t.Errorf("expected mismatch message, got: %q", resp3)
	}
}

func TestIdempotencyKeyInFlight(t *testing.T) {
	router := NewRouter()
	store := NewInMemoryIdempotencyStore(10*time.Second, 1*time.Second)
	cfgLimiter := DefaultIdempotencyConfig()
	cfgLimiter.Store = store
	middleware := IdempotencyKey(cfgLimiter)

	var inFlightBarrier = make(chan struct{})

	router.Handle("POST", "/charge", middleware(HandlerFunc(func(w *ResponseWriter, r *Request) {
		<-inFlightBarrier // block execution to simulate slow process
		w.WriteFixedBody(200, "text/plain", []byte("charged"))
	})))

	cfg := DefaultConfig("127.0.0.1:0")
	cfg.Handler = router
	server := NewWithConfig(cfg)

	listener, err := net.Listen("tcp", server.cfg.Addr)
	if err != nil {
		t.Fatalf("failed to listen: %v", err)
	}
	server.ln = listener
	server.conns = make(map[net.Conn]struct{})

	go func() {
		_ = server.serve()
	}()
	defer server.Shutdown(context.Background())
	addr := listener.Addr().String()

	sendReq := func(key string) string {
		conn, err := net.Dial("tcp", addr)
		if err != nil {
			return err.Error()
		}
		defer conn.Close()
		reqLine := "POST /charge HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\nContent-Length: 0\r\n"
		if key != "" {
			reqLine += "Idempotency-Key: " + key + "\r\n"
		}
		reqLine += "\r\n"
		_, _ = conn.Write([]byte(reqLine))
		rdr := bufio.NewReader(conn)
		respBytes, _ := io.ReadAll(rdr)
		return string(respBytes)
	}

	results := make(chan string, 2)

	// Start first request (blocks)
	go func() {
		results <- sendReq("key-in-flight")
	}()

	// Ensure first request is in-flight and locked
	time.Sleep(10 * time.Millisecond)

	// Start concurrent second request (should fail with 409)
	go func() {
		results <- sendReq("key-in-flight")
	}()

	// Read conflict response
	respConflict := <-results
	if !strings.Contains(respConflict, "409 Conflict") {
		t.Errorf("expected 409 Conflict for concurrent request, got: %q", respConflict)
	}

	// Release first request
	close(inFlightBarrier)

	// Read first request response
	respSuccess := <-results
	if !strings.Contains(respSuccess, "200 OK") {
		t.Errorf("expected first request to succeed, got: %q", respSuccess)
	}
}

func TestIdempotencyKeyServerErrorRetry(t *testing.T) {
	router := NewRouter()
	store := NewInMemoryIdempotencyStore(10*time.Second, 1*time.Second)
	cfgLimiter := DefaultIdempotencyConfig()
	cfgLimiter.Store = store
	middleware := IdempotencyKey(cfgLimiter)

	var shouldFail int32 = 1

	router.Handle("POST", "/refund", middleware(HandlerFunc(func(w *ResponseWriter, r *Request) {
		if atomic.LoadInt32(&shouldFail) == 1 {
			w.WriteFixedBody(500, "text/plain", []byte("database down"))
			return
		}
		w.WriteFixedBody(200, "text/plain", []byte("refunded"))
	})))

	cfg := DefaultConfig("127.0.0.1:0")
	cfg.Handler = router
	server := NewWithConfig(cfg)

	listener, err := net.Listen("tcp", server.cfg.Addr)
	if err != nil {
		t.Fatalf("failed to listen: %v", err)
	}
	server.ln = listener
	server.conns = make(map[net.Conn]struct{})

	go func() {
		_ = server.serve()
	}()
	defer server.Shutdown(context.Background())
	addr := listener.Addr().String()

	sendReq := func(key string) string {
		conn, err := net.Dial("tcp", addr)
		if err != nil {
			return err.Error()
		}
		defer conn.Close()
		reqLine := "POST /refund HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\nContent-Length: 0\r\n"
		if key != "" {
			reqLine += "Idempotency-Key: " + key + "\r\n"
		}
		reqLine += "\r\n"
		_, _ = conn.Write([]byte(reqLine))
		rdr := bufio.NewReader(conn)
		respBytes, _ := io.ReadAll(rdr)
		return string(respBytes)
	}

	// 1. First request fails with 500
	resp1 := sendReq("key-retry")
	if !strings.Contains(resp1, "500 Internal Server Error") {
		t.Errorf("expected 500 error, got: %q", resp1)
	}

	// Toggle failure off
	atomic.StoreInt32(&shouldFail, 0)

	// 2. Second request with same key should retry and succeed (not cached 500)
	resp2 := sendReq("key-retry")
	if !strings.Contains(resp2, "200 OK") {
		t.Errorf("expected 200 OK after retry, got: %q", resp2)
	}
	if strings.Contains(resp2, "Idempotency-Replay") {
		t.Errorf("retried successful response should not show Replay header")
	}
}

func TestIdempotencyKeyPanicRecovery(t *testing.T) {
	router := NewRouter()
	store := NewInMemoryIdempotencyStore(10*time.Second, 1*time.Second)
	cfgLimiter := DefaultIdempotencyConfig()
	cfgLimiter.Store = store
	middleware := IdempotencyKey(cfgLimiter)

	var shouldPanic int32 = 1

	router.Handle("POST", "/panic-test", Recovery()(middleware(HandlerFunc(func(w *ResponseWriter, r *Request) {
		if atomic.LoadInt32(&shouldPanic) == 1 {
			panic("something exploded")
		}
		w.WriteFixedBody(200, "text/plain", []byte("recovered"))
	}))))

	cfg := DefaultConfig("127.0.0.1:0")
	cfg.Handler = router
	server := NewWithConfig(cfg)

	listener, err := net.Listen("tcp", server.cfg.Addr)
	if err != nil {
		t.Fatalf("failed to listen: %v", err)
	}
	server.ln = listener
	server.conns = make(map[net.Conn]struct{})

	go func() {
		_ = server.serve()
	}()
	defer server.Shutdown(context.Background())
	addr := listener.Addr().String()

	sendReq := func(key string) string {
		conn, err := net.Dial("tcp", addr)
		if err != nil {
			return err.Error()
		}
		defer conn.Close()
		reqLine := "POST /panic-test HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\nContent-Length: 0\r\n"
		if key != "" {
			reqLine += "Idempotency-Key: " + key + "\r\n"
		}
		reqLine += "\r\n"
		_, _ = conn.Write([]byte(reqLine))
		rdr := bufio.NewReader(conn)
		respBytes, _ := io.ReadAll(rdr)
		return string(respBytes)
	}

	// 1. Request crashes (panic)
	resp1 := sendReq("key-panic")
	if !strings.Contains(resp1, "500 Internal Server Error") {
		t.Errorf("expected 500 error from recovery, got: %q", resp1)
	}

	// Toggle panic off
	atomic.StoreInt32(&shouldPanic, 0)

	// 2. Second request with same key should succeed (key cleared from store on panic)
	resp2 := sendReq("key-panic")
	if !strings.Contains(resp2, "200 OK") {
		t.Errorf("expected 200 OK after panic retry, got: %q", resp2)
	}
}
