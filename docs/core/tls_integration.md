# TLS Integration

Wyre provides native support for secure HTTPS connections via the standard library's `crypto/tls` package. Setting up a secure endpoint is seamless and requires minimal configuration.

## Setting Up an HTTPS Server

To start an HTTPS server, load a certificate and key pair and execute `ListenAndServeTLS` on your server instance:

```go
package main

import (
    "log"
    "wyre"
)

func main() {
    router := wyre.NewRouter()
    
    // Register basic routes
    router.HandleFunc("GET", "/", func(w *wyre.ResponseWriter, r *wyre.Request) {
        w.WriteFixedBody(200, "text/plain", []byte("Hello securely over HTTPS!"))
    })

    // Create default configuration
    config := wyre.DefaultConfig("0.0.0.0:443")
    server := wyre.NewWithConfig(config)

    // Load cert/key files and start serving
    log.Println("Starting secure HTTPS server on :443...")
    certPath := "./certs/server.crt"
    keyPath  := "./certs/server.key"
    
    if err := server.ListenAndServeTLS(certPath, keyPath); err != nil {
        log.Fatalf("HTTPS server failed: %v", err)
    }
}
```

## How TLS Works in Wyre

Wyre integrates TLS directly into its raw socket architecture:
1. **Transparent Listener Wrapper**: The standard TCP network listener is wrapped in a `tls.Listener` inside the `ListenAndServeTLS` routine.
2. **Identical Handler execution**: Because the wrapped connection implements standard Go `net.Conn`, all subsequent request parsing, routing, and response writing function identically to standard HTTP. Your handlers don't need code modifications to run over TLS.
