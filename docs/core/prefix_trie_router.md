# Prefix Trie Router

Wyre features a segment-based prefix trie router that provides deterministic, priority-based route matching with dynamic path parameters and middleware support. The router is designed to scale efficiently with the depth of the URI path rather than the total number of registered routes.

## Routing Basics

To use the routing system, create a new router instance and register handlers for specific HTTP methods and path patterns.

```go
package main

import (
    "wyre"
)

func main() {
    router := wyre.NewRouter()

    // Match exact static paths
    router.HandleFunc("GET", "/api/v1/status", statusHandler)
    router.HandleFunc("POST", "/api/v1/data", dataHandler)
}

func statusHandler(w *wyre.ResponseWriter, r *wyre.Request) {
    w.WriteFixedBody(200, "text/plain", []byte("OK"))
}

func dataHandler(w *wyre.ResponseWriter, r *wyre.Request) {
    // Process post request
}
```

## Route Matching Priority

Wyre evaluates path matches deterministically using the following segment priority:
1. **Static Match**: Evaluates if any static segment matches exactly.
2. **Dynamic Parameter Match**: Evaluates dynamic path segments (e.g., `:id`).
3. **Backtracking**: If a path match fails midway, the router automatically backtracks to evaluate other potential routing paths.

## Path Parameters

You can define dynamic path parameters by prefixing a segment with a colon (`:`). Handlers can retrieve captured parameter values using the `r.Param("key")` method.

```go
router.HandleFunc("GET", "/users/:userId/orders/:orderId", func(w *wyre.ResponseWriter, r *wyre.Request) {
    userID := r.Param("userId")
    orderID := r.Param("orderId")
    
    response := "User: " + userID + ", Order: " + orderID
    w.WriteFixedBody(200, "text/plain", []byte(response))
})
```

> [!NOTE]
> All paths are evaluated strictly on segment boundaries (split by `/`). A dynamic segment matches exactly one path segment.

## Middlewares

You can register global middlewares to wrap your route handlers. Middlewares execute in the order they are registered.

```go
router := wyre.NewRouter()

// Register global middlewares
router.Use(wyre.Recovery())
router.Use(wyre.CORS())

// You can also wrap specific handlers manually
router.Handle("POST", "/admin", adminOnlyMiddleware(wyre.HandlerFunc(adminHandler)))
```
