package wyre

import (
	"sync"
	"time"
)

type queuedRequest struct {
	wait    chan struct{}
	mu      sync.Mutex
	expired bool
}

// ConcurrencyLimiter returns a middleware that limits the number of concurrent requests
// allowed to execute the wrapped handler. Excess requests are queued up to queueLimit.
// If the queue is full, requests are rejected immediately with 429 Too Many Requests.
// If a request waits in the queue longer than queueTimeout, it is rejected with 503 Service Unavailable.
func ConcurrencyLimiter(maxConcurrent int, queueLimit int, queueTimeout time.Duration) Middleware {
	sem := make(chan struct{}, maxConcurrent)
	queue := make(chan *queuedRequest, queueLimit)

	releaseSlot := func() {
		for {
			select {
			case req := <-queue:
				req.mu.Lock()
				if req.expired {
					req.mu.Unlock()
					continue
				}
				close(req.wait)
				req.mu.Unlock()
				return // passed slot to next queued request
			default:
				<-sem // release slot back to sem
				return
			}
		}
	}

	return func(next Handler) Handler {
		return HandlerFunc(func(w *ResponseWriter, r *Request) {
			ctx := r.Context()

			// 1. Try to acquire slot immediately
			select {
			case sem <- struct{}{}:
				defer releaseSlot()
				next.ServeHTTP(w, r)
				return
			default:
			}

			// 2. Queue is full?
			req := &queuedRequest{wait: make(chan struct{})}
			select {
			case queue <- req:
				// Successfully queued
			default:
				w.Header().Set("Retry-After", "5")
				w.WriteFixedBody(429, "text/plain", []byte("429 Too Many Requests - Concurrency limit reached\n"))
				return
			}

			// 3. Wait in queue
			var timer *time.Timer
			var timeoutChan <-chan time.Time
			if queueTimeout > 0 {
				timer = time.NewTimer(queueTimeout)
				timeoutChan = timer.C
				defer timer.Stop()
			}

			select {
			case <-req.wait:
				// Successfully acquired slot from a finishing request
				defer releaseSlot()
				next.ServeHTTP(w, r)
				return
			case <-ctx.Done():
				req.mu.Lock()
				req.expired = true
				req.mu.Unlock()
				return
			case <-timeoutChan:
				req.mu.Lock()
				req.expired = true
				req.mu.Unlock()
				w.Header().Set("Retry-After", "10")
				w.WriteFixedBody(503, "text/plain", []byte("503 Service Unavailable - Request queue timeout\n"))
				return
			}
		})
	}
}
