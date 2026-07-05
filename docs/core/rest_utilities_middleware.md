# REST Utilities & Middleware

Wyre provides built-in utilities to simplify JSON serialization/deserialization and raw payload handling, along with essential middlewares to handle panic recovery and Cross-Origin Resource Sharing (CORS).

## JSON & Body Helpers

Wyre includes helper methods on the request and response objects to streamline data exchanges.

### 1. Reading JSON Payloads (`r.ReadJSON`)

You can parse an incoming JSON request body directly into a destination struct using `r.ReadJSON(dst)`.

```go
type CreateUserRequest struct {
    Name  string `json:"name"`
    Email string `json:"email"`
}

func createUserHandler(w *wyre.ResponseWriter, r *wyre.Request) {
    var req CreateUserRequest
    if err := r.ReadJSON(&req); err != nil {
        w.WriteFixedBody(400, "text/plain", []byte("Invalid JSON payload"))
        return
    }
    
    // Process user creation...
}
```

### 2. Writing JSON Responses (`w.WriteJSON`)

You can serialize any Go value to JSON and write it directly to the response socket using `w.WriteJSON(status, data)`. This automatically marshals the data, sets `Content-Type: application/json`, and calculates the `Content-Length`.

```go
type UserResponse struct {
    ID   string `json:"id"`
    Name string `json:"name"`
}

func getUserHandler(w *wyre.ResponseWriter, r *wyre.Request) {
    resp := UserResponse{
        ID:   "usr_123",
        Name: "Alice",
    }
    
    w.WriteJSON(200, resp)
}
```

### 3. Writing Fixed Body Responses (`w.WriteFixedBody`)

If you want to send pre-buffered data, HTML, or raw strings without chunked streaming overhead, use `w.WriteFixedBody(status, contentType, bodyBytes)`. This writes the exact length of the payload on the socket in a single write call.

```go
w.WriteFixedBody(200, "text/html", []byte("<h1>Welcome!</h1>"))
```

---

## Built-In Middlewares

Wyre bundles key middlewares to secure and control request lifecycles.

### 1. Recovery Middleware (`wyre.Recovery()`)

The `Recovery()` middleware recovers from runtime panics occurring inside your handler stack. It logs the stack trace and responds to the client with a `500 Internal Server Error` instead of crashing the server process.

```go
router := wyre.NewRouter()
router.Use(wyre.Recovery())
```

### 2. CORS Middleware (`wyre.CORS()`)

The `CORS()` middleware handles Cross-Origin Resource Sharing headers for browser compatibility. It maps standard allowed origins, headers, and methods, and responds to browser preflight `OPTIONS` requests automatically with `204 No Content`.

```go
router := wyre.NewRouter()
router.Use(wyre.CORS())
```
