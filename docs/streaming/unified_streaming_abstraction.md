# Unified Streaming Abstraction

Wyre defines a single, unified `Stream` interface that abstracts HTTP chunked responses, Server-Sent Events (SSE), and raw hijacked connections (e.g., for WebSockets or custom protocols).

## Overview

When building AI agents that stream data (such as LLM tokens), you may want to support different delivery transports depending on how the client connects (e.g., standard HTTP chunked transfer-encoding for simple proxy curl calls, SSE for browser EventSource clients, or raw hijacked WebSockets for full-duplex agents).

Without a unified model, you would have to duplicate your token-generation loops to write to different writer structures.

Wyre solves this by exposing a single [Stream](file:///c:/projects/oun/stream.go#L20) interface. Any handler can generate data and send it using the same method, regardless of the transport protocol.

---

## Core API

The streaming model is defined in [stream.go](file:///c:/projects/oun/stream.go):

```go
type StreamType int

const (
	StreamChunked StreamType = iota
	StreamSSE
	StreamHijacked
)

type Stream interface {
	// WritePayload writes the raw text/binary payload and flushes immediately.
	WritePayload(data []byte) error

	// Type returns the transport type of the stream.
	Type() StreamType

	// Context returns the context associated with the stream for cancellation check.
	Context() context.Context
}
```

### Implementations

1. **[ChunkedStream](file:///c:/projects/oun/stream.go#L32):** Writes standard HTTP/1.1 chunked chunks.
2. **[SSEStream](file:///c:/projects/oun/sse.go#L18):** Prepend `data: ` formatting to each line and sends as a formatted SSE event chunk.
3. **[HijackedStream](file:///c:/projects/oun/stream.go#L76):** Writes directly to raw TCP socket connection buffers.

---

## Usage Example

The following code illustrates how a single token generation routine can feed any Wyre `Stream` implementation:

```go
package main

import (
	"context"
	"fmt"
	"time"
	"wyre"
)

// GenerateTokens is transport-agnostic and processes any Stream interface
func GenerateTokens(stream wyre.Stream) error {
	ctx := stream.Context()

	for i := 1; i <= 5; i++ {
		select {
		case <-ctx.Done():
			return ctx.Err() // Client disconnected early
		default:
		}

		time.Sleep(100 * time.Millisecond) // Simulate LLM processing
		payload := []byte(fmt.Sprintf("token-%d ", i))

		if err := stream.WritePayload(payload); err != nil {
			return err // Write failed (disconnect)
		}
	}
	return nil
}

func sseHandler(w *wyre.ResponseWriter, r *wyre.Request) {
	stream, err := wyre.NewSSEStream(w, r)
	if err != nil {
		return
	}
	_ = GenerateTokens(stream)
}

func chunkedHandler(w *wyre.ResponseWriter, r *wyre.Request) {
	stream, err := wyre.NewChunkedStream(w, r)
	if err != nil {
		return
	}
	_ = GenerateTokens(stream)
}
```
