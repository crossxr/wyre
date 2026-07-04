# Raw Socket Architecture

Wyre implements a raw socket architecture where TCP connections are accepted, handled, and processed directly at the OS layer using Go's standard `net` package, without any wrapping or reliance on Go's `net/http` server implementation.

## Overview

The core networking loop resides in [server.go](file:///c:/projects/oun/server.go). The HTTP server functions as a low-level TCP daemon that manages raw network streams directly.

## Implementation Details

### 1. Direct Socket Listening
The server starts listening by binding directly to the TCP socket:
```go
ln, err := net.Listen("tcp", s.cfg.Addr)
```
See the [ListenAndServe](file:///c:/projects/oun/server.go#L63) implementation.

### 2. Connection Lifecycle Management
The main event loop accepts incoming connections and tracks them in a thread-safe map to support graceful shutdowns:
- **Acceptance:** Accepted connections are processed in a new goroutine (see [serve](file:///c:/projects/oun/server.go#L117)).
- **Tracking:** Connections are added and removed from the active connections tracking map using [trackConn](file:///c:/projects/oun/server.go#L158).
- **Graceful Shutdown:** The [Shutdown](file:///c:/projects/oun/server.go#L171) method closes the listener to reject new connections and waits for active connections to finish or forces them closed if the context deadline is reached.

### 3. Flow Control & Production Safety
To avoid server crashes or excessive resource consumption on the host OS:
- **Connection Limiter:** An optional semaphore (`chan struct{}`) limits maximum concurrent active connections. If at capacity, incoming connections are rejected immediately with a `503 Service Unavailable` response via [WriteError](file:///c:/projects/oun/response.go#L202) and closed.
- **Deadlines:** Connection read/write/idle timeouts are manually enforced on the raw socket via `conn.SetReadDeadline` and `conn.SetWriteDeadline` (see [handleConn](file:///c:/projects/oun/server.go#L198)).
- **Keep-Alive Limits:** The server keeps track of requests handled per connection and exits the processing loop when `MaxRequestsPerConn` is reached.

### 4. Custom HTTP Parsing
Rather than delegating HTTP parsing to Go's standard library, Wyre uses its own parser in [request.go](file:///c:/projects/oun/request.go):
- **Request Line:** Decoded line-by-line using [readLine](file:///c:/projects/oun/request.go#L110) and split to parse the method, target, and protocol (e.g., HTTP/1.1).
- **Header Parsing:** Headers are parsed sequentially up to security thresholds to prevent Slowloris or buffer-overflow style exploits (e.g., maximum headers limit).
- **Body Parsing:** Handled via content-length limits or chunked transfer-encoding readers.

---

## Implementation Status & Missing Elements

- **Status:** **Fully Implemented**. Wyre communicates with the operating system directly using standard raw TCP sockets (`net.Conn`) and handles all protocol parsing manually.
- **Missing Elements:** None. The core server engine is 100% independent of `net/http`'s server implementation.
