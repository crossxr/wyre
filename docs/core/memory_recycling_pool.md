# Memory Recycling Pool

To achieve near-zero garbage collection (GC) pressure and sustain high-throughput request loads, Wyre integrates an automatic memory recycling pool for request payload buffers and metadata.

## Overview

In traditional Go web frameworks, new request objects, maps, and byte slices are allocated on the heap for every single incoming HTTP request. Under heavy load, this pattern places massive pressure on Go's runtime Garbage Collector, causing latency spikes and CPU cycles spent on cleanup.

Wyre solves this problem by utilizing recycled `Request` objects. Once a request lifecycle ends, Wyre automatically resets the fields and returns the memory blocks back to the pool to be reused for subsequent requests.

## How it Works Under the Hood

The recycling mechanism operates transparently. When a connection is accepted:
1. **Acquisition**: Wyre fetches a recycled `Request` object from the internal pool.
2. **Execution**: The incoming request data is parsed, populated into the struct, and dispatched to your handler.
3. **Release & Reset**: After your handler finishes writing the response, the server releases the request object back to the pool. During release, all internal maps and fields are cleared:
   - Header and parameter maps are cleared of their entries but retain their memory capacity.
   - Body buffers smaller than 64KB are cleared and reused; larger buffers are discarded to prevent long-term memory bloat.

## Safe Usage Guidelines

Because request structures are pooled and recycled, developers must follow these simple rules to avoid data corruption or race conditions:

### 1. Do Not Retain References Beyond Handler Lifetime
Once your handler function returns, the `*wyre.Request` object and its buffer slices (such as `r.rawBody`) are recycled. You must not access the request or any of its fields after the handler returns.

### 2. Copy Data for Asynchronous Processing
If you spin up background goroutines that need to read request data (like headers, body contents, or query strings) after the handler has completed, you **must copy** that data to new variables beforehand.

**Incorrect (Potential Race Condition / Corrupted Data):**
```go
func myHandler(w *wyre.ResponseWriter, r *wyre.Request) {
    // DO NOT DO THIS: The request object will be recycled 
    // while the goroutine is reading it.
    go func() {
        processPayload(r.rawBody) 
    }()
    
    w.WriteFixedBody(202, "text/plain", []byte("Accepted"))
}
```

**Correct (Safe Copying):**
```go
func myHandler(w *wyre.ResponseWriter, r *wyre.Request) {
    // Create a local copy of the body bytes
    bodyCopy := make([]byte, len(r.rawBody))
    copy(bodyCopy, r.rawBody)

    go func() {
        processPayload(bodyCopy) // Safe to read anytime
    }()
    
    w.WriteFixedBody(202, "text/plain", []byte("Accepted"))
}
```
