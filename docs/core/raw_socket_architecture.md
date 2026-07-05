# Raw Socket Architecture

Wyre is designed to run directly on top of Go's native TCP network socket listener (`net.Listen`), bypassing the standard library's `net/http` package entirely. This architecture provides low-level control, minimized memory allocations, and optimized request lifecycles.

## Architecture Benefits

By managing TCP connection loops and custom protocol parsing at the socket level, Wyre delivers several key advantages:

1. **Minimized Allocations**: Avoids standard HTTP server structure overheads. Request metadata and bodies are recycled using internal pooling, keeping garbage collection (GC) pressure extremely low.
2. **Explicit Concurrency Control**: A connection semaphore manages maximum parallel connections at the socket level, rejecting overloaded traffic before it consumes server system resources.
3. **Optimized Socket Lifecycles**: Connection keep-alive timeouts and request-count thresholds are enforced on the TCP connection directly, ensuring quick resource reclamation.

## Configuring the Server

When initializing a Wyre server, you can supply custom configuration values using the `wyre.Config` struct.

### Configuration Properties

| Property | Type | Description | Default |
|---|---|---|---|
| `Addr` | `string` | The IP and port to bind to (e.g., `"127.0.0.1:8080"`). | *Required* |
| `ReadTimeout` | `time.Duration` | The maximum duration for reading the entire request. | `10 * time.Second` |
| `WriteTimeout` | `time.Duration` | The maximum duration before timing out writes of the response. | `10 * time.Second` |
| `IdleTimeout` | `time.Duration` | The maximum amount of time to wait for the next request on a keep-alive connection. | `60 * time.Second` |
| `MaxRequestsPerConn` | `int` | The maximum number of requests to serve on a single keep-alive TCP connection before closing it. | `1000` |
| `MaxConnections` | `int` | The maximum number of concurrent active TCP connections. When exceeded, incoming connections are rejected with a 503 error. Set to `0` for unlimited. | `10000` |
| `Handler` | `wyre.Handler` | The router or request handler instance. | `nil` (Uses Router if created) |

---

### Example: Custom Server Setup

The following example shows how to initialize and configure a Wyre server with custom timeouts and connection limits:

```go
package main

import (
    "time"
    "wyre"
)

func main() {
    router := wyre.NewRouter()
    router.HandleFunc("GET", "/", func(w *wyre.ResponseWriter, r *wyre.Request) {
        w.WriteFixedBody(200, "text/plain", []byte("Hello from a highly customized server!"))
    })

    // Setup custom server configurations
    config := wyre.Config{
        Addr:               "0.0.0.0:8080",
        ReadTimeout:        5 * time.Second,
        WriteTimeout:       5 * time.Second,
        IdleTimeout:        30 * time.Second,
        MaxRequestsPerConn: 500,
        MaxConnections:     2500, // Limit concurrency to protect resources
        Handler:            router,
    }

    // Launch the server
    server := wyre.NewWithConfig(config)
    server.ListenAndServe()
}
```

## Graceful Shutdown

Wyre supports graceful shutdowns. Calling `Shutdown(ctx)` stops the server from accepting new TCP connections, finishes outstanding active request lifecycles, and terminates cleanly when all active requests are finished or when the context deadline is reached.

```go
// Create server context
ctx, cancel := context.WithTimeout(context.Background(), 10 * time.Second)
defer cancel()

// Gracefully shutdown the server
if err := server.Shutdown(ctx); err != nil {
    log.Fatalf("Graceful shutdown failed: %v", err)
}
```
