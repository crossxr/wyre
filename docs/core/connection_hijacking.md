# Connection Hijacking

Wyre supports connection hijacking, allowing handlers to take full ownership of the raw TCP network socket stream (`net.Conn`). This enables you to bypass the standard HTTP request-response flow and upgrade connections to full-duplex protocols such as WebSockets or custom socket protocols.

## The Hijacker Interface

Wyre's custom `ResponseWriter` implements a standard-compatible `Hijacker` interface:

```go
type Hijacker interface {
    Hijack() (net.Conn, *bufio.ReadWriter, error)
}
```

Calling `Hijack()` signals to Wyre's server engine that the socket ownership has been transferred to the handler. Once hijacked, the server loop ceases standard HTTP processing for this connection (such as writing chunks, flushing, or tracking idle timeouts) and delegates the connection close responsibility entirely to the handler code.

## How to Hijack a Connection

To hijack a connection in a route handler, type-assert the response writer to `wyre.Hijacker` and call `Hijack()`.

### Code Example: Upgrading to a Custom Socket Protocol

The following example demonstrates how to hijack an incoming request connection and write custom TCP frames back to the client:

```go
package main

import (
    "fmt"
    "io"
    "log"
    "net"
    "wyre"
)

func main() {
    router := wyre.NewRouter()
    router.HandleFunc("GET", "/custom-socket", socketUpgradeHandler)

    server := wyre.NewWithConfig(wyre.DefaultConfig("127.0.0.1:8080"))
    server.ListenAndServe()
}

func socketUpgradeHandler(w *wyre.ResponseWriter, r *wyre.Request) {
    // 1. Hijack the underlying TCP connection
    conn, rw, err := w.Hijack()
    if err != nil {
        log.Printf("Hijacking failed: %v", err)
        return
    }
    
    // Crucial: The handler is now responsible for closing the socket connection.
    defer conn.Close()

    // 2. Write custom HTTP response upgrade headers
    rw.WriteString("HTTP/1.1 101 Switching Protocols\r\n")
    rw.WriteString("Upgrade: custom-protocol\r\n")
    rw.WriteString("Connection: Upgrade\r\n\r\n")
    rw.Flush()

    // 3. Enter a custom bi-directional data loop
    buf := make([]byte, 1024)
    for {
        n, err := conn.Read(buf)
        if err != nil {
            if err != io.EOF {
                log.Printf("Socket read error: %v", err)
            }
            break
        }
        
        // Echo input back with decoration
        input := string(buf[:n])
        fmt.Fprintf(rw, "Echo: %s", input)
        rw.Flush()
    }
}
```
