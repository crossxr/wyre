package wyre

import (
	"bufio"
	"context"
	"fmt"
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

func TestUnifiedStreaming(t *testing.T) {
	router := NewRouter()
	
	// Helper token stream generator that operates purely on Stream interface
	streamTokens := func(s Stream) error {
		return s.WritePayload([]byte("hello unified stream"))
	}

	router.HandleFunc("GET", "/chunked", func(w *ResponseWriter, r *Request) {
		stream, err := NewChunkedStream(w, r)
		if err != nil {
			t.Errorf("failed to create chunked stream: %v", err)
			return
		}
		if stream.Type() != StreamChunked {
			t.Errorf("expected StreamChunked type, got %d", stream.Type())
		}
		_ = streamTokens(stream)
	})

	router.HandleFunc("GET", "/sse", func(w *ResponseWriter, r *Request) {
		stream, err := NewSSEStream(w, r)
		if err != nil {
			t.Errorf("failed to create sse stream: %v", err)
			return
		}
		if stream.Type() != StreamSSE {
			t.Errorf("expected StreamSSE type, got %d", stream.Type())
		}
		_ = streamTokens(stream)
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

	// 1. Validate Chunked Stream via Interface
	conn1, err := net.Dial("tcp", addr)
	if err != nil {
		t.Fatal(err)
	}
	_, _ = conn1.Write([]byte("GET /chunked HTTP/1.1\r\nHost: localhost\r\nConnection: keep-alive\r\n\r\n"))
	r1 := bufio.NewReader(conn1)
	
	// skip headers
	for {
		line, _ := r1.ReadString('\n')
		if line == "\r\n" {
			break
		}
	}
	// read size and content
	sizeLine, _ := r1.ReadString('\n')
	sz, _ := strconv.ParseInt(strings.TrimSpace(sizeLine), 16, 64)
	chunkBytes := make([]byte, sz)
	_, _ = io.ReadFull(r1, chunkBytes)
	if string(chunkBytes) != "hello unified stream" {
		t.Errorf("expected 'hello unified stream', got %q", chunkBytes)
	}
	conn1.Close()

	// 2. Validate SSE Stream via Interface
	conn2, err := net.Dial("tcp", addr)
	if err != nil {
		t.Fatal(err)
	}
	_, _ = conn2.Write([]byte("GET /sse HTTP/1.1\r\nHost: localhost\r\nConnection: keep-alive\r\n\r\n"))
	r2 := bufio.NewReader(conn2)
	
	// skip headers
	for {
		line, _ := r2.ReadString('\n')
		if line == "\r\n" {
			break
		}
	}
	// read size and content
	sizeLine2, _ := r2.ReadString('\n')
	sz2, _ := strconv.ParseInt(strings.TrimSpace(sizeLine2), 16, 64)
	chunkBytes2 := make([]byte, sz2)
	_, _ = io.ReadFull(r2, chunkBytes2)
	if !strings.Contains(string(chunkBytes2), "data: hello unified stream") {
		t.Errorf("expected SSE event containing 'data: hello unified stream', got %q", chunkBytes2)
	}
	conn2.Close()
}

func TestMCPTransport(t *testing.T) {
	router := NewRouter()
	mcp := NewMCPHandler()

	mcp.OnMessage(func(session *MCPSession, msg *JSONRPCMessage) {
		if msg.Method == "ping" {
			reply, _ := NewJSONRPCResponse(msg.ID, "pong")
			_ = session.Send(reply)
		}
	})

	router.HandleFunc("GET", "/sse", mcp.HandleSSE)
	router.HandleFunc("POST", "/message", mcp.HandleMessage)

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

	// 1. Establish SSE Client Connection
	connSSE, err := net.Dial("tcp", addr)
	if err != nil {
		t.Fatalf("failed to connect to sse: %v", err)
	}
	defer connSSE.Close()

	_, _ = connSSE.Write([]byte("GET /sse HTTP/1.1\r\nHost: localhost\r\nConnection: keep-alive\r\n\r\n"))
	rSSE := bufio.NewReader(connSSE)

	// skip headers
	for {
		line, _ := rSSE.ReadString('\n')
		if line == "\r\n" {
			break
		}
	}

	// read first SSE event: endpoint
	sizeLine, _ := rSSE.ReadString('\n')
	sz, _ := strconv.ParseInt(strings.TrimSpace(sizeLine), 16, 64)
	endpointBytes := make([]byte, sz)
	_, _ = io.ReadFull(rSSE, endpointBytes)
	endpointEvent := string(endpointBytes)
	if !strings.Contains(endpointEvent, "event: endpoint") || !strings.Contains(endpointEvent, "data: /message?sessionId=sess_") {
		t.Fatalf("expected endpoint event handshake, got: %q", endpointEvent)
	}

	// Extract session ID from event
	// data: /message?sessionId=sess_12345
	lines := strings.Split(endpointEvent, "\n")
	var sessionId string
	for _, l := range lines {
		if strings.HasPrefix(l, "data: ") {
			dataVal := strings.TrimPrefix(l, "data: ")
			sessionId = getQueryParam(strings.Split(dataVal, "?")[1], "sessionId")
		}
	}

	if sessionId == "" {
		t.Fatalf("session ID not found in handshake: %q", endpointEvent)
	}

	// Read trailing newline of the first chunk
	_, _ = rSSE.ReadString('\n')

	// 2. Client POSTs standard JSON-RPC command
	connPOST, err := net.Dial("tcp", addr)
	if err != nil {
		t.Fatalf("failed to connect for post: %v", err)
	}
	defer connPOST.Close()

	postBody := `{"jsonrpc":"2.0","id":1,"method":"ping"}`
	reqStr := fmt.Sprintf("POST /message?sessionId=%s HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: %d\r\nConnection: close\r\n\r\n%s", sessionId, len(postBody), postBody)
	_, _ = connPOST.Write([]byte(reqStr))

	rPOST := bufio.NewReader(connPOST)
	statusLine, _ := rPOST.ReadString('\n')
	if !strings.Contains(statusLine, "202 Accepted") {
		t.Errorf("expected 202 status on message post, got: %q", statusLine)
	}

	// 3. SSE Client receives response
	sizeLine2, _ := rSSE.ReadString('\n')
	sz2, _ := strconv.ParseInt(strings.TrimSpace(sizeLine2), 16, 64)
	replyBytes := make([]byte, sz2)
	_, _ = io.ReadFull(rSSE, replyBytes)

	replyEvent := string(replyBytes)
	if !strings.Contains(replyEvent, "event: message") || !strings.Contains(replyEvent, `"result":"pong"`) {
		t.Errorf("expected JSON-RPC reply containing pong, got: %q", replyEvent)
	}
}



