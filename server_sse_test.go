package wyre

import (
	"bufio"
	"context"
	"io"
	"net"
	"strconv"
	"strings"
	"testing"
	"time"
)

func TestSSEHeadersAndStreaming(t *testing.T) {
	// Start a local server with a handler
	router := NewRouter()
	router.HandleFunc("GET", "/stream", func(w *ResponseWriter, r *Request) {
		stream, err := NewSSEStream(w, r)
		if err != nil {
			t.Errorf("failed to create SSE stream: %v", err)
			return
		}

		err = stream.Send(SSEEvent{
			ID:    "1",
			Event: "test-event",
			Data:  []byte("hello\nworld"),
		})
		if err != nil {
			t.Errorf("failed to send event: %v", err)
		}
	})

	cfg := DefaultConfig("127.0.0.1:0")
	cfg.Handler = router
	server := NewWithConfig(cfg)

	// Start server in background
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

	// Client connection
	addr := listener.Addr().String()
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		t.Fatalf("failed to dial: %v", err)
	}
	defer conn.Close()

	// Send request
	reqStr := "GET /stream HTTP/1.1\r\nHost: localhost\r\nConnection: keep-alive\r\n\r\n"
	_, err = conn.Write([]byte(reqStr))
	if err != nil {
		t.Fatalf("failed to write request: %v", err)
	}

	reader := bufio.NewReader(conn)

	// Read headers
	var headers []string
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			t.Fatalf("failed to read header: %v", err)
		}
		if line == "\r\n" {
			break
		}
		headers = append(headers, strings.ToLower(line))
	}

	// Validate headers
	hasContentType := false
	hasTransferEncoding := false
	for _, h := range headers {
		if strings.HasPrefix(h, "content-type: text/event-stream") {
			hasContentType = true
		}
		if strings.HasPrefix(h, "transfer-encoding: chunked") {
			hasTransferEncoding = true
		}
	}

	if !hasContentType {
		t.Errorf("missing content-type text/event-stream")
	}
	if !hasTransferEncoding {
		t.Errorf("missing transfer-encoding chunked")
	}

	// Read chunk size
	sizeLine, err := reader.ReadString('\n')
	if err != nil {
		t.Fatalf("failed to read chunk size: %v", err)
	}
	sizeLine = strings.TrimSpace(sizeLine)
	if sizeLine == "" {
		t.Fatalf("empty chunk size")
	}

	// Read chunk content dynamically based on chunk size
	chunkSize, err := strconv.ParseInt(sizeLine, 16, 64)
	if err != nil {
		t.Fatalf("failed to parse chunk size %q: %v", sizeLine, err)
	}

	content := make([]byte, chunkSize)
	n, err := io.ReadFull(reader, content)
	if err != nil {
		t.Fatalf("failed to read chunk data of size %d: %v", chunkSize, err)
	}
	
	eventData := string(content[:n])
	if !strings.Contains(eventData, "id: 1") || !strings.Contains(eventData, "event: test-event") || !strings.Contains(eventData, "data: hello") || !strings.Contains(eventData, "data: world") {
		t.Errorf("event formatting incorrect: %q", eventData)
	}
}

func TestSSEClientDisconnectContextCancel(t *testing.T) {
	ctxChan := make(chan context.Context, 1)

	router := NewRouter()
	router.HandleFunc("GET", "/stream", func(w *ResponseWriter, r *Request) {
		stream, err := NewSSEStream(w, r)
		if err != nil {
			t.Errorf("failed to create SSE stream: %v", err)
			return
		}

		ctxChan <- r.Context()

		// Keep writing to trigger detection/cancellation or block waiting for disconnect
		for {
			select {
			case <-r.Context().Done():
				return
			case <-time.After(10 * time.Millisecond):
				_ = stream.Send(SSEEvent{Data: []byte("keepalive")})
			}
		}
	})

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
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		t.Fatalf("failed to dial: %v", err)
	}

	reqStr := "GET /stream HTTP/1.1\r\nHost: localhost\r\nConnection: keep-alive\r\n\r\n"
	_, _ = conn.Write([]byte(reqStr))

	// Wait for handler to start and get context
	var requestCtx context.Context
	select {
	case requestCtx = <-ctxChan:
	case <-time.After(2 * time.Second):
		t.Fatalf("handler did not start in time")
	}

	// Verify context is NOT canceled yet
	if requestCtx.Err() != nil {
		t.Fatalf("context canceled prematurely: %v", requestCtx.Err())
	}

	// Close client connection abruptly
	conn.Close()

	// Verify context is canceled shortly after
	select {
	case <-requestCtx.Done():
		// Success!
	case <-time.After(2 * time.Second):
		t.Errorf("context was not canceled after client disconnect")
	}
}

func TestProxyStreaming(t *testing.T) {
	mockData := "proxy-streamed-chunk-1-data;proxy-streamed-chunk-2-data;"
	srcReader := strings.NewReader(mockData)

	router := NewRouter()
	router.HandleFunc("GET", "/proxy", func(w *ResponseWriter, r *Request) {
		w.Header().Set("Content-Type", "text/plain")
		_, err := w.ProxyStream(r.Context(), srcReader)
		if err != nil {
			t.Errorf("ProxyStream failed: %v", err)
		}
	})

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
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		t.Fatalf("failed to dial: %v", err)
	}
	defer conn.Close()

	// Send request
	reqStr := "GET /proxy HTTP/1.1\r\nHost: localhost\r\nConnection: keep-alive\r\n\r\n"
	_, err = conn.Write([]byte(reqStr))
	if err != nil {
		t.Fatalf("failed to write request: %v", err)
	}

	reader := bufio.NewReader(conn)

	// Read headers
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			t.Fatalf("failed to read header: %v", err)
		}
		if line == "\r\n" {
			break
		}
	}

	// Read chunk size
	sizeLine, err := reader.ReadString('\n')
	if err != nil {
		t.Fatalf("failed to read chunk size: %v", err)
	}
	sizeLine = strings.TrimSpace(sizeLine)
	
	chunkSize, err := strconv.ParseInt(sizeLine, 16, 64)
	if err != nil {
		t.Fatalf("failed to parse chunk size %q: %v", sizeLine, err)
	}

	// Read content
	content := make([]byte, chunkSize)
	_, err = io.ReadFull(reader, content)
	if err != nil {
		t.Fatalf("failed to read chunk content: %v", err)
	}

	if string(content) != mockData {
		t.Errorf("expected %q, got %q", mockData, string(content))
	}
}

