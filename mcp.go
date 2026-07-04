package wyre

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"
)

// JSONRPCMessage represents a standard JSON-RPC 2.0 message.
type JSONRPCMessage struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      interface{}     `json:"id,omitempty"` // string, float64, or null
	Method  string          `json:"method,omitempty"`
	Params  json.RawMessage `json:"params,omitempty"`
	Result  json.RawMessage `json:"result,omitempty"`
	Error   *JSONRPCError   `json:"error,omitempty"`
}

// JSONRPCError represents a standard JSON-RPC 2.0 error block.
type JSONRPCError struct {
	Code    int             `json:"code"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data,omitempty"`
}

// NewJSONRPCResponse creates a successful JSON-RPC 2.0 response.
func NewJSONRPCResponse(id interface{}, result interface{}) (*JSONRPCMessage, error) {
	resBytes, err := json.Marshal(result)
	if err != nil {
		return nil, err
	}
	return &JSONRPCMessage{
		JSONRPC: "2.0",
		ID:      id,
		Result:  resBytes,
	}, nil
}

// NewJSONRPCError creates an error JSON-RPC 2.0 response.
func NewJSONRPCError(id interface{}, code int, message string, data interface{}) *JSONRPCMessage {
	var dataBytes json.RawMessage
	if data != nil {
		dataBytes, _ = json.Marshal(data)
	}
	return &JSONRPCMessage{
		JSONRPC: "2.0",
		ID:      id,
		Error: &JSONRPCError{
			Code:    code,
			Message: message,
			Data:    dataBytes,
		},
	}
}

// MCPSession represents a single client connection session.
type MCPSession struct {
	ID        string
	SSE       *SSEStream
	CreatedAt time.Time
}

// Send sends a JSON-RPC message to the client over the SSE stream.
func (s *MCPSession) Send(msg *JSONRPCMessage) error {
	payload, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	return s.SSE.Send(SSEEvent{
		Event: "message",
		Data:  payload,
	})
}

// MCPHandler coordinates Model Context Protocol (MCP) HTTP transport sessions.
type MCPHandler struct {
	mu           sync.RWMutex
	sessions     map[string]*MCPSession
	onConnect    func(session *MCPSession)
	onDisconnect func(session *MCPSession)
	onMessage    func(session *MCPSession, msg *JSONRPCMessage)
}

// NewMCPHandler creates a new MCPHandler coordinating sessions.
func NewMCPHandler() *MCPHandler {
	return &MCPHandler{
		sessions: make(map[string]*MCPSession),
	}
}

// OnConnect registers a callback invoked when a client opens the /sse stream.
func (h *MCPHandler) OnConnect(cb func(session *MCPSession)) {
	h.onConnect = cb
}

// OnDisconnect registers a callback invoked when a client's /sse stream is closed.
func (h *MCPHandler) OnDisconnect(cb func(session *MCPSession)) {
	h.onDisconnect = cb
}

// OnMessage registers a callback for handling incoming client requests or notifications.
func (h *MCPHandler) OnMessage(cb func(session *MCPSession, msg *JSONRPCMessage)) {
	h.onMessage = cb
}

// HandleSSE handles the GET /sse endpoint, performing the initial MCP handshake.
func (h *MCPHandler) HandleSSE(w *ResponseWriter, r *Request) {
	stream, err := NewSSEStream(w, r)
	if err != nil {
		return
	}

	// Generate a unique session ID
	sessionId := fmt.Sprintf("sess_%d", time.Now().UnixNano())

	session := &MCPSession{
		ID:        sessionId,
		SSE:       stream,
		CreatedAt: time.Now(),
	}

	h.mu.Lock()
	h.sessions[sessionId] = session
	h.mu.Unlock()

	defer func() {
		h.mu.Lock()
		delete(h.sessions, sessionId)
		h.mu.Unlock()
		if h.onDisconnect != nil {
			h.onDisconnect(session)
		}
	}()

	if h.onConnect != nil {
		h.onConnect(session)
	}

	// MCP spec: Send the endpoint location as an SSE event "endpoint" containing the relative message post URL.
	endpointEvent := SSEEvent{
		Event: "endpoint",
		Data:  []byte(fmt.Sprintf("/message?sessionId=%s", sessionId)),
	}
	if err := stream.Send(endpointEvent); err != nil {
		return
	}

	// Keep stream connection open
	<-r.Context().Done()
}

// HandleMessage handles the POST /message endpoint, routing incoming payloads to the session.
func (h *MCPHandler) HandleMessage(w *ResponseWriter, r *Request) {
	if r.Method != "POST" {
		w.WriteFixedBody(405, "text/plain", []byte("Method Not Allowed"))
		return
	}

	sessionId := r.Param("sessionId")
	if sessionId == "" {
		sessionId = getQueryParam(r.RawQuery, "sessionId")
	}

	if sessionId == "" {
		w.WriteFixedBody(400, "text/plain", []byte("Missing sessionId"))
		return
	}

	h.mu.RLock()
	session, ok := h.sessions[sessionId]
	h.mu.RUnlock()

	if !ok {
		w.WriteFixedBody(404, "text/plain", []byte("Session Not Found"))
		return
	}

	var msg JSONRPCMessage
	if err := r.ReadJSON(&msg); err != nil {
		w.WriteFixedBody(400, "text/plain", []byte("Invalid JSON-RPC payload"))
		return
	}

	if h.onMessage != nil {
		h.onMessage(session, &msg)
	}

	// MCP spec: POST messages return HTTP 202 immediately, as responses are pushed over SSE channel.
	w.WriteHeader(202)
}

func getQueryParam(query, key string) string {
	parts := strings.Split(query, "&")
	for _, p := range parts {
		pair := strings.SplitN(p, "=", 2)
		if len(pair) == 2 && pair[0] == key {
			return pair[1]
		}
	}
	return ""
}
