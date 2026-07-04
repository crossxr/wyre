package wyre

import (
	"bytes"
	"context"
	"fmt"
	"time"
)

// SSEEvent represents a single Server-Sent Event frame.
type SSEEvent struct {
	ID    string
	Event string
	Data  []byte
	Retry time.Duration
}

// SSEStream represents an active Server-Sent Event stream.
type SSEStream struct {
	w   *ResponseWriter
	ctx context.Context
}

// NewSSEStream upgrades the response connection to an SSE stream.
// It sets the correct Event Stream headers, clears the write deadline, and immediately flushes the headers.
func NewSSEStream(w *ResponseWriter, r *Request) (*SSEStream, error) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Content-Type-Options", "nosniff")

	// Disable default write deadline for the connection to support long-lived streams.
	if err := w.conn.SetWriteDeadline(time.Time{}); err != nil {
		return nil, fmt.Errorf("wyre: failed to clear write deadline: %w", err)
	}

	if err := w.WriteHeader(200); err != nil {
		return nil, err
	}
	if err := w.Flush(); err != nil {
		return nil, err
	}

	return &SSEStream{
		w:   w,
		ctx: r.Context(),
	}, nil
}

// Send formats and sends an event to the client in a single write operation.
// This implements backpressure because the write blocks when the client is slow,
// blocking the caller and preventing memory bloating.
func (s *SSEStream) Send(event SSEEvent) error {
	select {
	case <-s.ctx.Done():
		return s.ctx.Err()
	default:
	}

	var buf bytes.Buffer

	if event.ID != "" {
		buf.WriteString("id: ")
		buf.WriteString(event.ID)
		buf.WriteByte('\n')
	}
	if event.Event != "" {
		buf.WriteString("event: ")
		buf.WriteString(event.Event)
		buf.WriteByte('\n')
	}
	if event.Retry > 0 {
		buf.WriteString(fmt.Sprintf("retry: %d\n", event.Retry/time.Millisecond))
	}

	// SSE format requires prepending "data: " to each line of the payload.
	if len(event.Data) > 0 {
		lines := bytes.Split(event.Data, []byte{'\n'})
		for _, line := range lines {
			// Strip trailing carriage return if CRLF is present.
			line = bytes.TrimSuffix(line, []byte{'\r'})
			buf.WriteString("data: ")
			buf.Write(line)
			buf.WriteByte('\n')
		}
	}

	buf.WriteByte('\n')

	// Write entire event to ResponseWriter in one call (making it one chunk if chunked).
	if _, err := s.w.Write(buf.Bytes()); err != nil {
		return err
	}

	// Flush immediately to push to network.
	if err := s.w.Flush(); err != nil {
		return err
	}

	return nil
}

// WritePayload writes data as a default event to satisfy the Stream interface.
func (s *SSEStream) WritePayload(data []byte) error {
	return s.Send(SSEEvent{
		Data: data,
	})
}

// Type returns StreamSSE.
func (s *SSEStream) Type() StreamType {
	return StreamSSE
}

// Context returns the stream context.
func (s *SSEStream) Context() context.Context {
	return s.ctx
}

// Verify SSEStream satisfies Stream interface
var _ Stream = (*SSEStream)(nil)
