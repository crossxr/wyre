# Unified Streaming Abstraction

Wyre defines a single, unified `Stream` interface that abstracts HTTP chunked responses, Server-Sent Events (SSE), and raw hijacked connections (WebSockets or custom socket protocols).

## The Streaming Abstraction Benefit

When building AI applications that stream data (such as LLM tokens), you may want to support multiple delivery protocols depending on how the client initiates the connection:
- **HTTP Chunked Streaming**: For standard console `curl` requests or simple API calls.
- **Server-Sent Events (SSE)**: For browser-based UI clients via `EventSource`.
- **Hijacked TCP Stream**: For custom socket protocols or bi-directional agents.

Without a unified interface, you would have to duplicate your token generation and execution logic to write to different writer structures. 

Wyre resolves this by exposing a single `Stream` interface. You can write your core token generation loops to execute against this interface once, and serve it over any transport.

---

## The Stream Interface

The streaming interface is defined as:

```go
type StreamType int

const (
    StreamChunked StreamType = iota
    StreamSSE
    StreamHijacked
)

type Stream interface {
    // WritePayload writes the raw text/binary payload and flushes it immediately.
    WritePayload(data []byte) error

    // Type returns the transport type of the stream.
    Type() StreamType

    // Context returns the context associated with the stream for cancellation checks.
    Context() context.Context
}
```

### Stream Types
1. **`ChunkedStream`**: Sends standard HTTP/1.1 chunked data chunks.
2. **`SSEStream`**: Automatically formats data into structured `data: <payload>` lines and writes them as SSE frames.
3. **`HijackedStream`**: Writes bytes directly to the raw, hijacked socket buffer.

---

## Usage Example

The following example illustrates how a single token generation routine can serve both SSE and standard chunked HTTP endpoints:

```go
package main

import (
    "context"
    "fmt"
    "time"
    "wyre"
)

func main() {
    router := wyre.NewRouter()
    
    // Register different endpoints that share the same stream generator logic
    router.HandleFunc("GET", "/stream/sse", sseHandler)
    router.HandleFunc("GET", "/stream/chunked", chunkedHandler)

    server := wyre.NewWithConfig(wyre.DefaultConfig("127.0.0.1:8080"))
    server.ListenAndServe()
}

// GenerateTokens is transport-agnostic and writes directly to the Stream interface
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

        // Write payload to whatever stream transport is active
        if err := stream.WritePayload(payload); err != nil {
            return err // Write failed (socket disconnected)
        }
    }
    return nil
}

func sseHandler(w *wyre.ResponseWriter, r *wyre.Request) {
    // Upgrade connection to SSE Stream
    stream, err := wyre.NewSSEStream(w, r)
    if err != nil {
        return
    }
    _ = GenerateTokens(stream)
}

func chunkedHandler(w *wyre.ResponseWriter, r *wyre.Request) {
    // Upgrade connection to Chunked Stream
    stream, err := wyre.NewChunkedStream(w, r)
    if err != nil {
        return
    }
    _ = GenerateTokens(stream)
}
```
