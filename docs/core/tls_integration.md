# TLS Integration

Wyre provides native secure connections via standard `crypto/tls` out of the box.

## Overview

The TLS implementation is integrated into the raw socket architecture in [server.go](file:///c:/projects/oun/server.go). By wrapping the raw listener, TLS acts transparently to the connection handler, providing encrypted communications without changing the request parser or response dispatch logic.

## Implementation Details

### 1. TLS Listener Creation
The [ListenAndServeTLS](file:///c:/projects/oun/server.go#L86) method initializes the TLS listener:
- **Load Certificates:** It loads the X.509 certificate and key pair using standard Go:
  ```go
  cert, err := tls.LoadX509KeyPair(certFile, keyFile)
  ```
- **Configuration:** It initializes a basic standard library `*tls.Config`:
  ```go
  tlsCfg := &tls.Config{
      Certificates: []tls.Certificate{cert},
  }
  ```
- **Wrapping Listener:** It starts a standard TCP listener and then wraps it in a TLS listener:
  ```go
  ln, err := net.Listen("tcp", s.cfg.Addr)
  ...
  s.ln = tls.NewListener(ln, tlsCfg)
  ```

### 2. Transparent Connection Processing
Because `tls.NewListener` wraps the underlying raw TCP connection in a `tls.Conn` (which implements the standard `net.Conn` interface), all subsequent read/write operations within [handleConn](file:///c:/projects/oun/server.go#L198) and [ParseRequest](file:///c:/projects/oun/request.go#L338) remain identical whether the connection is raw TCP or TLS-secured.

---

## Implementation Status & Missing Elements

- **Status:** **Fully Implemented** for basic secure servers.
- **Missing Elements / Limitations:**
  - **No Custom `*tls.Config` Injection:** The `Config` struct does not expose configuration properties to tune TLS versions (e.g., forcing TLS 1.3), configure cipher suites, or specify Client Certification Authorities (mutual TLS / mTLS).
  - **No Dynamic Certificate Reloading:** Certificates are loaded once during server initialization. In a production environment with rotating certificates, the server would have to be restarted or modified to dynamically load certificates.
