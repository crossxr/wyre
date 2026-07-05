# Server-Sent Events (SSE) with Backpressure

Wyre includes native, first-class support for Server-Sent Events (SSE), optimized for real-time LLM token-streaming and server-to-client notifications.

## The Power of TCP Backpressure

In typical web frameworks, streaming outputs (like LLM text tokens) to client browsers requires buffering data in the server's application memory if the client is slow (e.g., on a poor network connection). Under high concurrency, these buffers accumulate on the heap, frequently causing the server to run Out-of-Memory (OOM) and crash.

Wyre avoids this by utilizing direct socket-level backpressure. Writes to the client block the execution goroutine once the client's TCP receive window is full. This blocks your token-generation loop naturally, matching the generation speed to the client's network speed without consuming extra server memory.

---

## Connection Lifecycle & Early Disconnects

Wyre continuously monitors connection health. If a client closes their browser tab or disconnects mid-stream, Wyre instantly cancels the HTTP request context (`r.Context()`). 

By checking `r.Context().Done()` in your streaming loops, you can halt expensive downstream AI API requests or database operations the instant a client leaves, preventing wasted resources and costs.

---

## Server-Sent Events API

Wyre handles the Event-Source handshakes and protocol framing via the `SSEStream` wrapper.

### Structures & Functions

1. **`wyre.NewSSEStream(w, r)`**: Upgrades the connection, writes standard `text/event-stream` headers, disables connection write timeouts, and initializes the stream.
2. **`wyre.SSEEvent`**: The message structure to write:
   ```go
   type SSEEvent struct {
       ID    string
       Event string
       Data  []byte
       Retry string
   }
   ```
3. **`stream.Send(event)`**: Encodes the event and flushes it immediately down the TCP socket.

---

## Usage Example

The following route handler upgrades the connection to SSE, monitors context cancellation, and streams message chunks:

```go
package main

import (
    "fmt"
    "time"
    "wyre"
)

func main() {
    router := wyre.NewRouter()
    router.HandleFunc("GET", "/stream-tokens", streamTokensHandler)

    server := wyre.NewWithConfig(wyre.DefaultConfig("127.0.0.1:8080"))
    server.ListenAndServe()
}

func streamTokensHandler(w *wyre.ResponseWriter, r *wyre.Request) {
    // 1. Upgrade the request to an SSE Stream
    stream, err := wyre.NewSSEStream(w, r)
    if err != nil {
        return
    }

    // 2. Retrieve request context to monitor disconnects
    ctx := r.Context()

    for i := 1; i <= 10; i++ {
        select {
        case <-ctx.Done():
            // Client closed the tab: abort processing and save LLM token costs!
            fmt.Println("Client disconnected early. Aborting...")
            return
        default:
        }

        // Simulate token generation delay
        time.Sleep(100 * time.Millisecond)

        // 3. Send token payload
        token := fmt.Sprintf("Token chunk %d", i)
        err := stream.Send(wyre.SSEEvent{
            ID:    fmt.Sprintf("evt_%d", i),
            Event: "token",
            Data:  []byte(token),
        })
        if err != nil {
            // Write failed because connection broke
            fmt.Printf("Stream write error: %v\n", err)
            return
        }
    }

    // 4. Send terminating stream event
    _ = stream.Send(wyre.SSEEvent{
        Event: "done",
        Data:  []byte("[DONE]"),
    })
}
```
