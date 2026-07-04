# Standard Library Compatibility

Wyre provides one-way compatibility wrapper utilities in [compat.go](file:///c:/projects/oun/compat.go) to integrate existing Go standard library HTTP handler chains.

## Overview

To avoid rewriting legacy routing logic, middleware, or file servers when migrating to Wyre, the framework exposes adapter wrappers to transform standard `http.Handler` instances into Wyre-compatible handlers.

## Implementation Details

### 1. The Writer Adapter
To satisfy the standard `http.ResponseWriter` interface, Wyre uses an adapter struct `stdResponseWriterWrapper` in [compat.go](file:///c:/projects/oun/compat.go#L10):
```go
type stdResponseWriterWrapper struct {
    w *ResponseWriter
}
```
This wrapper redirects the standard `Header()`, `Write()`, and `WriteHeader()` calls directly to the custom [ResponseWriter](file:///c:/projects/oun/response.go#L71).

### 2. Handler Adapter
The [FromHTTPHandler](file:///c:/projects/oun/compat.go#L29) wrapper function bridges standard handlers into the framework:
- **Request Translation:** It reads the pre-buffered request body and constructs a standard library `*http.Request` with `http.NewRequestWithContext`.
- **Metadata Mapping:** It copies the request method, target path, remote address, and headers.
- **Dispatch:** It executes `h.ServeHTTP(stdW, stdReq)` transparently.

This allows handlers or third-party middlewares built using the signature `func(http.ResponseWriter, *http.Request)` to execute within Wyre's pipeline.

---

## Implementation Status & Missing Elements

- **Status:** **Partially Implemented**. Standard Go handlers can be adapted to run inside Wyre.
- **Missing Elements / Limitations:**
  - **No Reverse Adapter (`ToHTTPHandler`):** Wyre does not provide a way to adapt a `wyre.Handler` to be served by standard libraries (e.g. `http.ListenAndServe` or standard HTTP routers). You cannot easily mount a Wyre application inside a standard Go HTTP stack.
  - **No Wrapper Interface Promotion:** The `stdResponseWriterWrapper` does not implement or forward optional standard interfaces like `http.Flusher`, `http.Hijacker`, or `http.Pusher`. Therefore, third-party libraries that type-assert the writer (e.g., standard WebSocket libraries trying to type-assert to `http.Hijacker`) will fail when run inside `FromHTTPHandler`, even though Wyre's underlying `ResponseWriter` natively supports a custom `Hijack()` method.
  - **Memory Overhead in Translation:** Because `FromHTTPHandler` has to allocate a standard `*http.Request` and wrap headers/bodies, it incurs allocation overhead, bypassing the optimization benefits of the Request reuse pool.
