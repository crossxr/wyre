# Wyre — High Performance Go HTTP/S Sockets Server

Wyre is a lightweight, zero-dependency HTTP/1.1 and HTTPS web engine for Go. Built directly on raw TCP sockets, it provides low-level control, deterministic prefix Trie routing, and automatic memory pooling to serve high-throughput workloads with near-zero heap allocations.

## Features

- **Raw Socket Architecture**: Handles TCP connections directly at the OS layer without wrapping standard library network servers.
- **TLS Integration**: Secure connections out of the box using Go's `crypto/tls` module.
- **Deterministic Prefix Trie Router**: High-speed, priority-based route matching with wildcards (e.g. `/users/:id`), path segment parameters, and automatic backtracking.
- **Memory Recycling Pool**: Uses a synchronized request pool (`sync.Pool`) for connection objects and header maps, minimizing garbage collection pressure.
- **Chunked Transfer Encoding**: Stream responses dynamically via automatic `Transfer-Encoding: chunked` writes when no `Content-Length` is defined.
- **Connection Hijacking**: Take complete control of raw socket connections (`net.Conn`) using standard `ResponseWriter.Hijack()`, ideal for WebSockets or custom protocols.
- **REST Utilities & Middleware**: Built-in JSON serialization helpers, pre-flight `CORS`, and robust stack-tracing panic `Recovery` middlewares.
- **Standard Library Compatibility**: Translate standard `http.Handler` chains into Wyre-ready handlers using the `FromHTTPHandler` wrapper.

---

## Installation

```bash
go get github.com/crossxr/wyre
```

---

## Quick Start

### 1. Basic Server Setup

Configure, register routes, and launch a secure TLS listener:

```go
package main

import (
	"context"
	"log"
	"github.com/crossxr/wyre"
)

func main() {
	router := wyre.NewRouter()

	// Direct parameters routing
	router.HandleFunc("GET", "/hello/:name", func(w *wyre.ResponseWriter, r *wyre.Request) {
		name := r.Param("name")
		w.WriteFixedBody(200, "text/plain", []byte("Hello, " + name + "\n"))
	})

	cfg := wyre.DefaultConfig(":8080")
	cfg.Handler = router

	srv := wyre.NewWithConfig(cfg)
	log.Fatal(srv.ListenAndServeTLS("cert.pem", "key.pem"))
}
```

### 2. JSON REST Handlers

Use built-in JSON utilities for body decoding and response formatting:

```go
type Request struct {
	Query string `json:"query"`
}

type Response struct {
	Status string   `json:"status"`
	Items  []string `json:"items"`
}

router.HandleFunc("POST", "/search", func(w *wyre.ResponseWriter, r *wyre.Request) {
	var req Request
	if err := r.ReadJSON(&req); err != nil {
		w.WriteFixedBody(400, "text/plain", []byte("Invalid JSON"))
		return
	}

	res := Response{
		Status: "success",
		Items:  []string{"match-1", "match-2"},
	}
	w.WriteJSON(200, res)
})
```

### 3. Middleware Chains

Register global middleware wrappers like `CORS` and stack-tracing `Recovery`:

```go
router := wyre.NewRouter()

// Recover from handler panics and log stack traces
router.Use(wyre.Recovery())

// Enable global Cross-Origin resource sharing
router.Use(wyre.CORS(wyre.CORSConfig{
	AllowedOrigins: []string{"*"},
	AllowedMethods: []string{"GET", "POST", "OPTIONS"},
	AllowedHeaders: []string{"Content-Type", "Authorization"},
}))
```

### 4. Serving Static Files

Use the built-in, directory-traversal protected static files handler:

```go
// Map static file directory
router.Handle("GET", "/static/:filename", wyre.FileServer("./public"))
```

---

## Core Architecture Design

### Prefix Trie Routing Hierarchy
Wyre matches routes using a Radix/Trie matching structure (`*node`). Priority is given to static segments, followed by dynamic parameter segments, and dynamic wildcard catch-alls. If a route matches but the method is unsupported, it returns `405 Method Not Allowed`.

```
/
├── api
│   └── v1
│       ├── users (GET, POST)
│       └── users
│           └── :id (GET, DELETE)   <-- Wildcard Parameter
└── static
    └── *                           <-- Wildcard Catch-All
```

### Connection Hijacking
Wyre supports standard hijacking to hand over connection ownership directly to handlers (e.g. for upgrading to WebSockets):

```go
router.HandleFunc("GET", "/ws", func(w *wyre.ResponseWriter, r *wyre.Request) {
	conn, bufrw, err := w.Hijack()
	if err != nil {
		return
	}
	defer conn.Close()

	// Control connection loop directly
	bufrw.WriteString("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n\r\n")
	bufrw.Flush()
})
```
