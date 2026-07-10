# Structured Error Contracts

AI agents process and resolve errors programmatically. When a request fails, generic HTML pages or unstructured text strings are hard to parse and act upon. 

Wyre solves this by implementing standardized, machine-parseable structured error contracts for all default framework actions and middlewares (such as rate limits, load shedding, queue timeouts, and uncaught panic recoveries).

## The ErrorContract Schema

Every structured error response returns a JSON payload matching the following Go definition:

```go
type ErrorContract struct {
    Code          string            `json:"code"`
    Message       string            `json:"message"`
    Retryable     bool              `json:"retryable"`
    BackoffHintMs int64             `json:"backoff_hint_ms,omitempty"`
    Details       map[string]string `json:"details,omitempty"`
}
```

- `code`: A machine-parseable token identifying the error category.
- `message`: A human-readable description of the error.
- `retryable`: A boolean telling the agent if it is safe/recommended to retry the request.
- `backoff_hint_ms`: A recommended wait duration (in milliseconds) before the agent retries.

## Framework Middleware Errors

The following structured error codes are returned by Wyre's core middlewares:

### 1. Concurrency Limiter
- **Status Code**: `429 Too Many Requests`
- **Code**: `concurrency_limit_reached`
- **Retryable**: `true`
- **Backoff Hint**: `5000` (5 seconds)
- **Returned when**: The active concurrency slot limit is fully saturated and the waiting queue is full.

### 2. Adaptive Limiter / Load Shedder
- **Status Code**: `429 Too Many Requests`
- **Code**: `adaptive_limit_reached`
- **Retryable**: `true`
- **Backoff Hint**: `5000` (5 seconds)
- **Returned when**: The dynamically calculated Vegas queue limit is exceeded.

### 3. Queue Timeout
- **Status Code**: `503 Service Unavailable`
- **Code**: `request_queue_timeout`
- **Retryable**: `true`
- **Backoff Hint**: `10000` (10 seconds)
- **Returned when**: A request waits in the limiter queue longer than the configured timeout duration.

### 4. Recovery Middleware
- **Status Code**: `500 Internal Server Error`
- **Code**: `internal_server_error`
- **Retryable**: `false`
- **Returned when**: An uncaught panic occurs inside a route handler.

## Writing Custom Errors

You can leverage this standardized error contract in your custom handlers using the ResponseWriter's `WriteErrorContract` helper method:

```go
func getUserHandler(w *wyre.ResponseWriter, r *wyre.Request) {
    id := r.Param("id")
    user, err := db.FindUser(id)
    
    if err == db.ErrNotFound {
        w.WriteErrorContract(
            404, 
            "user_not_found", 
            "User with the requested ID was not found", 
            false, // Do not retry
            0,
        )
        return
    }
    
    if err == db.ErrConnectionFailed {
        w.WriteErrorContract(
            503, 
            "db_connection_failed", 
            "Database connection failed transiently", 
            true, // Safe to retry
            2 * time.Second, // Suggest backing off for 2 seconds
        )
        return
    }

    w.WriteJSON(200, user)
}
```
