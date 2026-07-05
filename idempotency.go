package wyre

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"sync"
	"time"
)

// IdempotencyRecord represents the stored state and response of an idempotent request.
type IdempotencyRecord struct {
	Key          string              `json:"key"`
	Method       string              `json:"method"`
	Path         string              `json:"path"`
	RequestHash  string              `json:"request_hash"`
	Status       int                 `json:"status"`
	Headers      map[string][]string `json:"headers"`
	ResponseBody []byte              `json:"response_body"`
	InFlight     bool                `json:"in_flight"`
	CreatedAt    time.Time           `json:"created_at"`
}

// IdempotencyStore defines the storage interface for caching idempotency records.
type IdempotencyStore interface {
	Get(ctx context.Context, key string) (*IdempotencyRecord, error)
	Set(ctx context.Context, key string, rec *IdempotencyRecord, ttl time.Duration) error
	Delete(ctx context.Context, key string) error
}

// InMemoryIdempotencyStore is a thread-safe, in-memory implementation of IdempotencyStore.
type InMemoryIdempotencyStore struct {
	mu      sync.RWMutex
	records map[string]inMemoryRecord
	ttl     time.Duration
}

type inMemoryRecord struct {
	rec    *IdempotencyRecord
	expiry time.Time
}

// NewInMemoryIdempotencyStore creates a new InMemoryIdempotencyStore with automatic expiration cleanup.
func NewInMemoryIdempotencyStore(ttl time.Duration, cleanupInterval time.Duration) *InMemoryIdempotencyStore {
	store := &InMemoryIdempotencyStore{
		records: make(map[string]inMemoryRecord),
		ttl:     ttl,
	}

	if cleanupInterval > 0 {
		go store.startJanitor(cleanupInterval)
	}

	return store
}

// Get retrieves a record from the in-memory store.
func (s *InMemoryIdempotencyStore) Get(ctx context.Context, key string) (*IdempotencyRecord, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	item, ok := s.records[key]
	if !ok || time.Now().After(item.expiry) {
		return nil, nil
	}
	return item.rec, nil
}

// Set stores a record in the in-memory store.
func (s *InMemoryIdempotencyStore) Set(ctx context.Context, key string, rec *IdempotencyRecord, ttl time.Duration) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if ttl <= 0 {
		ttl = s.ttl
	}

	s.records[key] = inMemoryRecord{
		rec:    rec,
		expiry: time.Now().Add(ttl),
	}
	return nil
}

// Delete removes a record from the in-memory store.
func (s *InMemoryIdempotencyStore) Delete(ctx context.Context, key string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.records, key)
	return nil
}

func (s *InMemoryIdempotencyStore) startJanitor(interval time.Duration) {
	ticker := time.NewTicker(interval)
	for range ticker.C {
		s.cleanup()
	}
}

func (s *InMemoryIdempotencyStore) cleanup() {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	for k, item := range s.records {
		if now.After(item.expiry) {
			delete(s.records, k)
		}
	}
}

// IdempotencyConfig holds options for configuring the IdempotencyKey middleware.
type IdempotencyConfig struct {
	Store         IdempotencyStore
	TTL           time.Duration
	HeaderName    string // e.g. "Idempotency-Key" or "X-Idempotency-Key"
	DisableSafety bool   // If true, doesn't verify body hashes match for spends
}

// DefaultIdempotencyConfig returns a default config using an in-memory store.
func DefaultIdempotencyConfig() IdempotencyConfig {
	return IdempotencyConfig{
		Store:      NewInMemoryIdempotencyStore(24*time.Hour, 10*time.Minute),
		TTL:        24 * time.Hour,
		HeaderName: "Idempotency-Key",
	}
}

// IdempotencyKey returns a middleware that guarantees idempotency for mutating requests.
// It tracks in-flight status to prevent race conditions on agent retries and caches successful
// responses for playback.
func IdempotencyKey(cfg IdempotencyConfig) Middleware {
	if cfg.Store == nil {
		cfg.Store = NewInMemoryIdempotencyStore(24*time.Hour, 10*time.Minute)
	}
	if cfg.TTL <= 0 {
		cfg.TTL = 24 * time.Hour
	}
	if cfg.HeaderName == "" {
		cfg.HeaderName = "Idempotency-Key"
	}

	return func(next Handler) Handler {
		return HandlerFunc(func(w *ResponseWriter, r *Request) {
			// 1. Bypass non-mutating requests (only POST, PUT, PATCH, DELETE are idempotent-tracked)
			if r.Method != "POST" && r.Method != "PUT" && r.Method != "PATCH" && r.Method != "DELETE" {
				next.ServeHTTP(w, r)
				return
			}

			key := r.Header(cfg.HeaderName)
			if key == "" {
				// No key provided, execute handler normally
				next.ServeHTTP(w, r)
				return
			}

			ctx := r.Context()

			// Calculate request payload hash for request safety validation
			hasher := sha256.New()
			hasher.Write(r.rawBody)
			reqHash := hex.EncodeToString(hasher.Sum(nil))

			// Check if key exists in the store
			rec, err := cfg.Store.Get(ctx, key)
			if err != nil {
				// If store fails, return internal error to be safe
				w.WriteFixedBody(500, "text/plain", []byte("500 Internal Server Error - Idempotency store error\n"))
				return
			}

			if rec != nil {
				// We have a match! Let's check in-flight status
				if rec.InFlight {
					// Request is still processing! Return 409 Conflict.
					w.Header().Set("Retry-After", "2")
					w.WriteFixedBody(409, "text/plain", []byte("409 Conflict - In-flight request with same idempotency key is already processing\n"))
					return
				}

				// Key is already spent. Check parameters match if safety check is enabled.
				if !cfg.DisableSafety {
					if rec.Method != r.Method || rec.Path != r.Path || rec.RequestHash != reqHash {
						w.WriteFixedBody(400, "text/plain", []byte("400 Bad Request - Idempotency key spent with different parameters\n"))
						return
					}
				}

				// Replay cached response
				for k, vals := range rec.Headers {
					for _, val := range vals {
						w.Header().Add(k, val)
					}
				}
				w.Header().Set("Idempotency-Replay", "true")
				w.WriteFixedBody(rec.Status, w.Header().Get("Content-Type"), rec.ResponseBody)
				return
			}

			// First request: mark key as In-Flight
			inFlightRec := &IdempotencyRecord{
				Key:         key,
				Method:      r.Method,
				Path:        r.Path,
				RequestHash: reqHash,
				InFlight:    true,
				CreatedAt:   time.Now(),
			}

			if err := cfg.Store.Set(ctx, key, inFlightRec, cfg.TTL); err != nil {
				w.WriteFixedBody(500, "text/plain", []byte("500 Internal Server Error - Idempotency store write error\n"))
				return
			}

			// Clean up in-flight state if the request is not completed (e.g. panics, 5xx server errors, etc)
			var processed bool
			defer func() {
				if !processed {
					_ = cfg.Store.Delete(ctx, key)
				}
			}()

			// Capture response body written by handler
			var capturedBody []byte
			var capturedBodyMu sync.Mutex
			w.onWrite = func(p []byte) {
				capturedBodyMu.Lock()
				capturedBody = append(capturedBody, p...)
				capturedBodyMu.Unlock()
			}

			// Execute handler
			next.ServeHTTP(w, r)

			// Read response info
			status := w.statusCode
			if status == 0 {
				status = 200 // default status
			}

			// Stripe and industry standard best practice: Only cache complete response if status is not transient 5xx error.
			if status >= 500 {
				return // defer cleanup deletes key
			}

			// Convert Header map (which is map[string][]string) to regular map
			headers := make(map[string][]string)
			for k, v := range w.Header() {
				// Skip Connection and transient headers
				if k == "connection" || k == "transfer-encoding" || k == "content-length" {
					continue
				}
				headers[k] = v
			}

			// Finalize the record with response data and set InFlight = false
			finalRec := &IdempotencyRecord{
				Key:          key,
				Method:       r.Method,
				Path:         r.Path,
				RequestHash:  reqHash,
				Status:       status,
				Headers:      headers,
				ResponseBody: capturedBody,
				InFlight:     false,
				CreatedAt:    time.Now(),
			}

			// Save to store
			if err := cfg.Store.Set(ctx, key, finalRec, cfg.TTL); err == nil {
				processed = true
			}
		})
	}
}
