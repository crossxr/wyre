# Connection Hijacking

Wyre provides support for connection hijacking, giving handlers full control over the raw `net.Conn` socket stream. This allows the connection to be upgraded to WebSockets or custom full-duplex protocols.

## Overview

Connection hijacking allows a handler to take ownership of the underlying TCP network socket, decoupling it from the standard HTTP request-response flow. 

## Implementation Details

### 1. The Hijacker Interface
The custom [ResponseWriter](file:///c:/projects/oun/response.go#L71) implements the standard-like [Hijacker](file:///c:/projects/oun/response.go#L98) interface:
```go
type Hijacker interface {
    Hijack() (net.Conn, *bufio.ReadWriter, error)
}
```

### 2. Hijacking the Connection
When a handler calls [Hijack](file:///c:/projects/oun/response.go#L102):
- The `ResponseWriter` checks if it was already hijacked.
- It sets `w.hijacked = true`.
- It returns the raw `net.Conn` along with the buffered reader/writer:
  ```go
  w.hijacked = true
  rw := bufio.NewReadWriter(w.br, w.bw)
  return w.conn, rw, nil
  ```

### 3. Server-Side Handoff Coordination
Within the server connection loop [handleConn](file:///c:/projects/oun/server.go#L198):
- A deferred cleanup function is scheduled to automatically close the socket connection.
- After running the handler dispatcher, the loop inspects whether hijacking occurred:
  ```go
  s.dispatch(w, req)

  if w.hijacked {
      hijacked = true
      return
  }
  ```
- If hijacked, the server loop marks `hijacked = true` locally and returns immediately. This prevents the server loop from writing standard terminating chunks, flushing, looping for keep-alive, or invoking the deferred connection closure. The socket is cleanly handed off to the handler.

---

## Implementation Status & Missing Elements

- **Status:** **Fully Implemented**. The socket handoff protocol works identically to Go's standard library.
- **Missing Elements:** None.
