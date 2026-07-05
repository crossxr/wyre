# Standard Library Compatibility

Wyre provides one-way compatibility wrapper utilities to help you integrate standard Go `net/http` handlers and libraries. This allows you to migrate legacy components gradually or reuse existing third-party packages (such as metrics exporters, health checks, or file servers).

## The Compatibility Adapter

Wyre exposes the `FromHTTPHandler` adapter function, which wraps standard library `http.Handler` instances and converts them to Wyre-compatible `wyre.Handler` instances.

```go
func FromHTTPHandler(h http.Handler) Handler
```

When wrapped:
- Wyre maps the incoming custom `wyre.Request` parameters and headers to a standard `*http.Request`.
- It executes the standard handler's `ServeHTTP` method using an adapted `http.ResponseWriter` wrapper.
- All headers, status codes, and bodies written by the standard handler are transparently redirected back to Wyre's response buffers.

## Usage Examples

### 1. Integrating standard `http.HandlerFunc`

You can wrap standard helper handler functions directly and attach them to a Wyre router path:

```go
package main

import (
    "net/http"
    "wyre"
)

func main() {
    router := wyre.NewRouter()

    // 1. Define a standard library HTTP handler
    stdHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "text/plain")
        w.WriteHeader(http.StatusOK)
        w.Write([]byte("Hello from standard net/http!"))
    })

    // 2. Wrap and register it in the Wyre router
    router.Handle("GET", "/legacy", wyre.FromHTTPHandler(stdHandler))

    server := wyre.NewWithConfig(wyre.DefaultConfig("127.0.0.1:8080"))
    server.ListenAndServe()
}
```

### 2. Serving Static Files (using standard `http.FileServer`)

You can easily mount standard Go file handlers to serve directories of static assets:

```go
package main

import (
    "net/http"
    "wyre"
)

func main() {
    router := wyre.NewRouter()

    // Create standard file server
    fileServer := http.FileServer(http.Dir("./public"))

    // Mount it using the compatibility adapter
    router.Handle("GET", "/static/:filename", wyre.FromHTTPHandler(fileServer))

    server := wyre.NewWithConfig(wyre.DefaultConfig("127.0.0.1:8080"))
    server.ListenAndServe()
}
```

---

## Limitations & Trade-offs

> [!WARNING]
> While compatibility adapters are useful for migration and reusing external packages, they introduce minor trade-offs:
> 1. **Allocation Overhead**: Translating requests creates a new `*http.Request` instance per invocation, bypassing the performance benefits of Wyre's Request recycling pool.
> 2. **Interface Promotion Limitations**: The standard writer wrapper does not forward internal standard interfaces like `http.Hijacker` or `http.Flusher`. Therefore, third-party standard libraries that attempt to type-assert the writer (e.g. standard WebSocket upgraders) will fail when wrapped. For raw socket hijacking, use Wyre's native [Connection Hijacking](connection-hijacking) APIs directly.
