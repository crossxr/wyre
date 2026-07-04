# Zero-copy Proxy Streaming

Wyre provides a zero-allocation, zero-delay proxy streaming utility designed to pipe data from upstream sources (such as an LLM provider's API) directly to downstream clients.

## Overview

When building API gateways or middle tier proxy services for LLMs (e.g., Anthropic, OpenAI, or a self-hosted vLLM instance), servers must read chunks from the upstream response stream and write them back to the client.

If using typical buffer copy implementations:
1. Every connection allocates a temporary copy buffer (often 32KB).
2. The server buffers chunks of data before flushing, which adds latency.
3. High concurrent request volumes lead to massive heap allocations, causing garbage collector spikes.

Wyre's [ProxyStream](file:///c:/projects/oun/response.go#L243) method resolves these issues by using recycled buffers from a `sync.Pool` and performing zero-delay flushes immediately after every read operation.

---

## Technical Mechanics

1. **Recycled Buffers:** It pulls a `4KB` buffer from a package-level [proxyBufferPool](file:///c:/projects/oun/response.go#L235). This buffer is returned to the pool as soon as the stream ends.
2. **Context-Aware Loops:** The stream loop monitors the request's context (`ctx.Done()`) on every iteration. If the client drops the request or the timeout expires, the loop terminates immediately.
3. **Immediate Flushes:** It writes data chunks to the client socket as soon as they are read from the upstream source, followed by an immediate call to `w.Flush()`. This maintains real-time latency for small payloads (e.g., individual tokens) rather than wait-buffering.

---

## Usage Example

The following example shows how to write a Wyre gateway handler that proxies a streaming chat completion call from an upstream service:

```go
package main

import (
	"context"
	"fmt"
	"net/http"
	"wyre"
)

func proxyLLMHandler(w *wyre.ResponseWriter, r *wyre.Request) {
	ctx := r.Context()

	// Make outbound request to upstream LLM API
	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/chat/completions", r.Body)
	if err != nil {
		w.WriteFixedBody(500, "text/plain", []byte("Internal Server Error"))
		return
	}
	req.Header.Set("Authorization", "Bearer " + "YOUR_API_KEY")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		w.WriteFixedBody(502, "text/plain", []byte("Bad Gateway"))
		return
	}
	defer resp.Body.Close()

	// Set headers corresponding to the upstream response type
	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))

	// Stream the response directly to the client with zero allocation/delay
	_, err = w.ProxyStream(ctx, resp.Body)
	if err != nil {
		fmt.Printf("Proxy stream terminated with error: %v\n", err)
	}
}
```
