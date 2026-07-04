package wyre

import (
	"bufio"
	"context"
	"fmt"
	"net"
)

// StreamType defines the transport mechanism of a stream.
type StreamType int

const (
	StreamChunked StreamType = iota
	StreamSSE
	StreamHijacked
)

// Stream represents a unified streaming interface across multiple underlying transports.
type Stream interface {
	// WritePayload writes the raw binary payload to the connection and flushes it immediately.
	WritePayload(data []byte) error

	// Type returns the transport type of the stream.
	Type() StreamType

	// Context returns the context associated with the stream, allowing cancellation checks.
	Context() context.Context
}

// ChunkedStream implements Stream for HTTP/1.1 chunked encoding.
type ChunkedStream struct {
	w   *ResponseWriter
	ctx context.Context
}

// NewChunkedStream creates a new ChunkedStream. It initializes headers if not already written.
func NewChunkedStream(w *ResponseWriter, r *Request) (*ChunkedStream, error) {
	if w.hijacked {
		return nil, fmt.Errorf("wyre: connection already hijacked")
	}
	if !w.wroteHeader {
		w.Header().Set("Content-Type", "application/octet-stream")
		if err := w.WriteHeader(200); err != nil {
			return nil, err
		}
	}
	return &ChunkedStream{
		w:   w,
		ctx: r.Context(),
	}, nil
}

// WritePayload writes data as a single HTTP chunk and flushes the socket.
func (s *ChunkedStream) WritePayload(data []byte) error {
	select {
	case <-s.ctx.Done():
		return s.ctx.Err()
	default:
	}

	if _, err := s.w.Write(data); err != nil {
		return err
	}
	return s.w.Flush()
}

// Type returns StreamChunked.
func (s *ChunkedStream) Type() StreamType {
	return StreamChunked
}

// Context returns the request context.
func (s *ChunkedStream) Context() context.Context {
	return s.ctx
}

// HijackedStream implements Stream for raw TCP connections.
type HijackedStream struct {
	conn net.Conn
	rw   *bufio.ReadWriter
	ctx  context.Context
}

// NewHijackedStream creates a new HijackedStream wrapping a hijacked raw socket.
func NewHijackedStream(conn net.Conn, rw *bufio.ReadWriter, ctx context.Context) *HijackedStream {
	return &HijackedStream{
		conn: conn,
		rw:   rw,
		ctx:  ctx,
	}
}

// WritePayload writes data directly to the raw socket and flushes the buffer.
func (s *HijackedStream) WritePayload(data []byte) error {
	select {
	case <-s.ctx.Done():
		return s.ctx.Err()
	default:
	}

	if _, err := s.rw.Write(data); err != nil {
		return err
	}
	return s.rw.Flush()
}

// Type returns StreamHijacked.
func (s *HijackedStream) Type() StreamType {
	return StreamHijacked
}

// Context returns the connection context.
func (s *HijackedStream) Context() context.Context {
	return s.ctx
}

// Verify interfaces are satisfied
var _ Stream = (*ChunkedStream)(nil)
var _ Stream = (*HijackedStream)(nil)
