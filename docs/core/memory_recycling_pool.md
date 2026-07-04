# Memory Recycling Pool

Wyre implements a memory recycling pool using standard library `sync.Pool` to achieve near-zero GC pressure for request payloads and metadata allocation.

## Overview

Allocating new structures on every incoming request is one of the main causes of garbage collection (GC) pauses in high-throughput HTTP servers. To mitigate this, Wyre uses pooled `Request` objects in [request.go](file:///c:/projects/oun/request.go), allowing structures to be reused across connections.

## Implementation Details

### 1. The Request Pool
The request pool is defined as a package-level variable [requestPool](file:///c:/projects/oun/request.go#L47):
```go
var requestPool = sync.Pool{
    New: func() interface{} {
        return &Request{
            Headers: make(map[string][]string),
            params:  make(map[string]string),
        }
    },
}
```

### 2. Allocation & Retrieval
- Handlers or server routines fetch a recycled `Request` object using [AcquireRequest](file:///c:/projects/oun/request.go#L56).
- The parsing process populates this acquired struct in [ParseRequest](file:///c:/projects/oun/request.go#L338).

### 3. Cleanup & Recycling
To prevent memory leaks and data pollution between requests:
- When a request cycle finishes in [handleConn](file:///c:/projects/oun/server.go#L277), it calls [ReleaseRequest](file:///c:/projects/oun/request.go#L60).
- This triggers the [Reset](file:///c:/projects/oun/request.go#L65) method, which:
  - Wipes scalar fields (e.g., `Method`, `Path`, `Proto`, `RemoteAddr`).
  - Clears `Headers` and path `params` maps by deleting keys while preserving map capacity.
  - Recycles the `rawBody` slice: If the capacity of the body buffer exceeds `64KB`, it is set to `nil` to allow GC to clean up very large payloads and prevent memory bloat. If it is under `64KB`, the slice is truncated via `rawBody[:0]` and retained for subsequent requests.

---

## Implementation Status & Missing Elements

- **Status:** **Partially Implemented** (strictly for request handling objects).
- **Missing Elements / Limitations:**
  - **No ResponseWriter Pooling:** A new `ResponseWriter` instance is allocated via `newResponseWriter` for every single request.
  - **No bufio Reader/Writer Pooling:** New `bufio.Reader` and `bufio.Writer` instances are allocated per connection (e.g., `bufio.NewReader(conn)`) instead of using recycled reader/writer pools.
