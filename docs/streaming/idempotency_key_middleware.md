# Idempotency Key Middleware

Wyre provides a production-ready, industry-standard `IdempotencyKey` middleware. This middleware guarantees that mutating HTTP requests (`POST`, `PUT`, `PATCH`, `DELETE`) are safely executed exactly once. It is designed to be resilient against network errors and aggressive retries from clients or autonomous AI agents without triggering duplicate actions (e.g. duplicate payments, double database insertions).

## Why Idempotency is Critical for AI Agents

Unlike human users, autonomous AI agents operate in loops and make automated calls. Under network stress, transient errors, or latency spikes, agents will aggressively retry mutating requests. Without idempotency protection:
1. **Double Operations**: A retry might execute a transaction twice (e.g. charge a customer twice).
2. **Race Conditions**: Concurrent retries might process in parallel, leading to corrupted data state.

Wyre's `IdempotencyKey` middleware solves this by enforcing in-flight locking and response replay.

### How it Works
1. **Extraction**: The middleware extracts the `Idempotency-Key` header (or a custom header you specify) from the incoming request.
2. **In-Flight Lock**: Before executing the handler, the middleware marks the key as `In-Flight` in the store. If a concurrent duplicate request arrives with the same key, it is rejected immediately with a `409 Conflict` (along with a `Retry-After: 2` header). This protects your system against race conditions and concurrent retry storms.
3. **Payload Signature Verification**: To prevent developers from accidentally reusing spent keys for different operations, the middleware hashes the request body (SHA-256). If a duplicate request arrives for a spent key but has a different path, method, or request body, the request is rejected with `400 Bad Request`.
4. **Cache & Replay**: Successful responses (HTTP status < 500) are cached. When a duplicate request arrives for a spent key, the cached status code, headers, and body are replayed immediately, along with an `Idempotency-Replay: true` header, completely bypassing handler execution.
5. **Fail-Safe Release**: If the handler panics or returns a server error (status >= 500), the middleware automatically removes the key from the store so that the client can retry.

## The Idempotency Key API

Initialize the idempotency middleware with custom configuration:

```go
func IdempotencyKey(cfg IdempotencyConfig) Middleware
```

### Configuration Options

| Property | Type | Description | Default |
|---|---|---|---|
| `Store` | `IdempotencyStore` | Cache backend for storing idempotency records. | In-Memory Store |
| `TTL` | `time.Duration` | Retention duration for idempotency keys. | `24 * time.Hour` |
| `HeaderName` | `string` | The HTTP request header name containing the unique key. | `"Idempotency-Key"` |
| `DisableSafety` | `bool` | If true, disables body hash mismatch checks for spent keys. | `false` |

Get default configuration settings:

```go
func DefaultIdempotencyConfig() IdempotencyConfig
```

## Storage Backends

To support clustered deployments, you can implement the `IdempotencyStore` interface:

```go
type IdempotencyStore interface {
    Get(ctx context.Context, key string) (*IdempotencyRecord, error)
    Set(ctx context.Context, key string, rec *IdempotencyRecord, ttl time.Duration) error
    Delete(ctx context.Context, key string) error
}
```

### In-Memory Store
Wyre bundles a high-performance, thread-safe in-memory store with automatic expired key cleanup:

```go
func NewInMemoryIdempotencyStore(ttl time.Duration, cleanupInterval time.Duration) *InMemoryIdempotencyStore
```

### Redis Store Example
Below is an example of implementing the `IdempotencyStore` using a Redis client:

```go
package main

import (
    "context"
    "encoding/json"
    "time"
    "github.com/redis/go-redis/v9"
    "wyre"
)

type RedisStore struct {
    rdb *redis.Client
}

func (s *RedisStore) Get(ctx context.Context, key string) (*wyre.IdempotencyRecord, error) {
    val, err := s.rdb.Get(ctx, "idemp:"+key).Result()
    if err == redis.Nil {
        return nil, nil
    }
    if err != nil {
        return nil, err
    }
    var rec wyre.IdempotencyRecord
    err = json.Unmarshal([]byte(val), &rec)
    return &rec, err
}

func (s *RedisStore) Set(ctx context.Context, key string, rec *wyre.IdempotencyRecord, ttl time.Duration) error {
    data, err := json.Marshal(rec)
    if err != nil {
        return err
    }
    return s.rdb.Set(ctx, "idemp:"+key, data, ttl).Err()
}

func (s *RedisStore) Delete(ctx context.Context, key string) error {
    return s.rdb.Del(ctx, "idemp:"+key).Err()
}
```

## Usage Example

```go
package main

import (
    "time"
    "wyre"
)

func main() {
    router := wyre.NewRouter()

    // 1. Configure the idempotency middleware
    store := wyre.NewInMemoryIdempotencyStore(24 * time.Hour, 10 * time.Minute)
    config := wyre.IdempotencyConfig{
        Store:      store,
        TTL:        24 * time.Hour,
        HeaderName: "Idempotency-Key",
    }
    idempotency := wyre.IdempotencyKey(config)

    // 2. Wrap mutating routes
    router.Handle("POST", "/api/payments", idempotency(wyre.HandlerFunc(paymentHandler)))

    server := wyre.NewWithConfig(wyre.DefaultConfig("127.0.0.1:8080"))
    server.ListenAndServe()
}

func paymentHandler(w *wyre.ResponseWriter, r *wyre.Request) {
    // Process payment here
    w.WriteFixedBody(201, "application/json", []byte(`{"status":"success","transaction_id":"txn_789"}`))
}
```
