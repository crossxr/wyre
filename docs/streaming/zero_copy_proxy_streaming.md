# Zero-Copy Proxy Streaming

Wyre provides a zero-allocation, zero-delay proxy streaming utility. It is designed to pipe data from upstream sources (such as an LLM provider's API) directly to downstream clients with maximum performance and minimal latency.

## Why Proxy Streaming Efficiency Matters

When building API gateways or middle-tier proxy services for LLMs (e.g., Anthropic, OpenAI, or a self-hosted vLLM runner), your server acts as a relay: reading chunks from the upstream response stream and writing them back to the client.

If using typical standard copy buffers:
1. Every client connection allocates a temporary buffer (often 32KB).
2. High concurrent request volumes lead to massive heap allocations, causing garbage collector (GC) spikes.
3. The server buffers chunks of data before flushing, which introduces latency.

Wyre's `ProxyStream` resolves these issues:
- **Recycled Buffers**: Pulls pre-allocated buffers from an internal `sync.Pool`. Buffers are returned to the pool immediately once the stream terminates, resulting in zero heap allocations for streaming buffers.
- **Real-Time Flushes**: Writes and flushes data chunks immediately to the client socket as soon as they are read from the upstream source, ensuring real-time latency for small payloads (like individual text tokens).
- **Client-Disconnect Aware**: Monitors the request context on every chunk iteration. If the client closes the connection, the relay loop stops instantly.

---

## The ProxyStream API

To proxy an upstream body, invoke `ProxyStream` on your `ResponseWriter`:

```go
func (w *ResponseWriter) ProxyStream(ctx context.Context, src io.Reader) (int64, error)
```

This reads from the source reader `src` and streams it down the response socket until `io.EOF` is reached or the context is cancelled.

---

## Usage Example

The following example demonstrates a Wyre API gateway handler that proxies a streaming chat completion request from an upstream LLM service:

```go
package main

import (
    "context"
    "fmt"
    "net/http"
    "wyre"
)

func main() {
    router := wyre.NewRouter()
    router.HandleFunc("POST", "/v1/chat/completions", proxyLLMHandler)

    server := wyre.NewWithConfig(wyre.DefaultConfig("127.0.0.1:8080"))
    server.ListenAndServe()
}

func proxyLLMHandler(w *wyre.ResponseWriter, r *wyre.Request) {
    ctx := r.Context()

    // 1. Prepare outbound request to upstream LLM API
    req, err := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/chat/completions", r.Body)
    if err != nil {
        w.WriteFixedBody(500, "text/plain", []byte("Internal Server Error"))
        return
    }
    req.Header.Set("Authorization", "Bearer "+"YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")

    // 2. Execute outbound request
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        w.WriteFixedBody(502, "text/plain", []byte("Bad Gateway"))
        return
    }
    defer resp.Body.Close()

    // 3. Forward the content type header to the client
    w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))

    // 4. Stream the response directly to the client with zero allocation and zero delay
    _, err = w.ProxyStream(ctx, resp.Body)
    if err != nil {
        fmt.Printf("Proxy stream terminated: %v\n", err)
    }
}
```
