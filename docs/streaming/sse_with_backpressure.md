# Server-Sent Events (SSE) with Backpressure

Wyre includes native, first-class Server-Sent Events (SSE) streaming support designed for high-performance LLM token-streaming and real-time agentic workloads.

## Why Backpressure Matters for Agent Streams

In the age of LLM token streams, servers frequently pipe outputs directly from upstream providers (like OpenAI, Anthropic, or local runners) to web clients. 

If a client is slow (e.g., on a cellular connection, or parsing tokens slowly in browser JS) and the server doesn't enforce backpressure:
1. The server will read tokens from the LLM provider as fast as possible.
2. The server will buffer those tokens in-memory waiting for the client to read them.
3. **Result:** Server memory consumption balloons dynamically with the number of slow concurrent clients, eventually leading to Out-Of-Memory (OOM) crashes.

**Wyre solves this** by leveraging raw TCP socket blocking. Since Wyre operates directly on [net.Conn](file:///c:/projects/oun/server.go), writing and flushing data blocks the handler goroutine if the client's TCP receive window is full. This blocks the token generation loop, naturally pacing the upstream data generator to the client's actual speed without buffering in memory.

---

## Core Components

- **[SSEEvent](file:///c:/projects/oun/sse.go#L9):** Represents an individual SSE message structure.
- **[SSEStream](file:///c:/projects/oun/sse.go#L18):** Manages the active stream lifecycle, handles headers, clears deadlines, and pushes events.
- **Client Disconnect Context:** Wyre automatically listens for client socket closures in the background, canceling the request's `context.Context` immediately. This allows handlers to cancel expensive downstream API calls or database operations the instant a client drops.

---

## Usage Example

The following example shows how to upgrade a request to an `SSEStream`, handle connection context cancellation, and push token frames.

```go
package main

import (
	"fmt"
	"time"
	"wyre"
)

func streamTokensHandler(w *wyre.ResponseWriter, r *wyre.Request) {
	// Upgrade connection to SSE Stream
	stream, err := wyre.NewSSEStream(w, r)
	if err != nil {
		return
	}

	// Retrieve request context for cancel propagation
	ctx := r.Context()

	// Simulate generating LLM tokens
	for i := 1; i <= 10; i++ {
		select {
		case <-ctx.Done():
			// Client disconnected; stop generating tokens and save LLM costs
			fmt.Println("Client disconnected early!")
			return
		default:
		}

		// Simulate token generation delay
		time.Sleep(100 * time.Millisecond)

		token := fmt.Sprintf("Token chunk %d", i)
		err := stream.Send(wyre.SSEEvent{
			ID:    fmt.Sprintf("%d", i),
			Event: "message",
			Data:  []byte(token),
		})
		if err != nil {
			// Write failed (connection broken)
			fmt.Printf("Stream write error: %v\n", err)
			return
		}
	}

	// Stream finished
	_ = stream.Send(wyre.SSEEvent{
		Event: "done",
		Data:  []byte("[DONE]"),
	})
}
```

---

## Technical Mechanics

1. **Header Handshake:** [NewSSEStream](file:///c:/projects/oun/sse.go#L25) sets `Content-Type: text/event-stream` and related caching controls, then flushes them to the client immediately.
2. **Deadline Reset:** Since the server sets default write timeouts (e.g., 10 seconds), `NewSSEStream` disables the connection write deadline to allow streams to live indefinitely.
3. **Single Chunk Writes:** To avoid protocol overhead from fragmented HTTP chunking, [Send](file:///c:/projects/oun/sse.go#L53) aggregates the ID, Event, Retry, and multi-line data payloads into a single memory block, writing it as one HTTP chunk on the wire.
4. **Client Disconnect Monitor:** During handler dispatch in [server.go](file:///c:/projects/oun/server.go), a background reader checks for incoming TCP disconnect markers (`io.EOF` / reset) and cancels the request context. This monitor is dynamically disabled during connection hijacking to prevent interference.
