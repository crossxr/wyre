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
				w.WriteErrorContract(429, "concurrency_limit_reached", "429 Too Many Requests - Concurrency limit reached", true, 5*time.Second)
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
				w.WriteErrorContract(503, "request_queue_timeout", "503 Service Unavailable - Request queue timeout", true, 10*time.Second)
				return
			}
		})
	}
}

// AdaptiveLimiterConfig holds configuration options for the AdaptiveLimiter middleware.
type AdaptiveLimiterConfig struct {
	MinLimit     int
	MaxLimit     int
	InitialLimit int
	Alpha        float64
	Beta         float64
	QueueLimit   int
	QueueTimeout time.Duration
	RTTWindow    time.Duration
}

// DefaultAdaptiveLimiterConfig returns the default configuration for AdaptiveLimiter.
func DefaultAdaptiveLimiterConfig() AdaptiveLimiterConfig {
	return AdaptiveLimiterConfig{
		MinLimit:     2,
		MaxLimit:     100,
		InitialLimit: 10,
		Alpha:        3.0,
		Beta:         6.0,
		QueueLimit:   50,
		QueueTimeout: 5 * time.Second,
		RTTWindow:    10 * time.Second,
	}
}

type adaptiveLimiter struct {
	mu           sync.Mutex
	minLimit     int
	maxLimit     int
	currentLimit float64
	alpha        float64
	beta         float64

	active       int
	queue        []*queuedRequest
	queueLimit   int
	queueTimeout time.Duration

	minRTT      time.Duration
	minRTTReset time.Time
	rttWindow   time.Duration
}

func (l *adaptiveLimiter) acquire() (bool, chan struct{}, *queuedRequest) {
	l.mu.Lock()
	defer l.mu.Unlock()

	if float64(l.active) < l.currentLimit {
		l.active++
		return true, nil, nil
	}

	if len(l.queue) >= l.queueLimit {
		return false, nil, nil
	}

	req := &queuedRequest{wait: make(chan struct{})}
	l.queue = append(l.queue, req)
	return true, req.wait, req
}

func (l *adaptiveLimiter) cancel(req *queuedRequest) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	req.mu.Lock()
	defer req.mu.Unlock()

	if req.expired { // already marked/processed (either timed out, cancelled, or activated)
		return false
	}
	req.expired = true

	for i, r := range l.queue {
		if r == req {
			l.queue = append(l.queue[:i], l.queue[i+1:]...)
			break
		}
	}
	return true
}

func (l *adaptiveLimiter) release(rtt time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()

	l.active--

	if rtt > 0 {
		if l.minRTT == 0 || rtt < l.minRTT {
			l.minRTT = rtt
		}

		if l.rttWindow > 0 && time.Since(l.minRTTReset) > l.rttWindow {
			l.minRTT = rtt
			l.minRTTReset = time.Now()
		}

		queueSize := l.currentLimit * (1.0 - float64(l.minRTT)/float64(rtt))

		if queueSize < l.alpha {
			l.currentLimit += 1.0
			if l.currentLimit > float64(l.maxLimit) {
				l.currentLimit = float64(l.maxLimit)
			}
		} else if queueSize > l.beta {
			l.currentLimit -= 1.0
			if l.currentLimit < float64(l.minLimit) {
				l.currentLimit = float64(l.minLimit)
			}
		}
	}

	l.processQueue()
}

func (l *adaptiveLimiter) processQueue() {
	for float64(l.active) < l.currentLimit && len(l.queue) > 0 {
		req := l.queue[0]
		l.queue = l.queue[1:]

		req.mu.Lock()
		if req.expired {
			req.mu.Unlock()
			continue
		}
		req.expired = true // mark as processed so cancel cannot double-process
		close(req.wait)
		req.mu.Unlock()

		l.active++
	}
}

// AdaptiveLimiter returns a middleware that dynamically limits the number of concurrent
// requests allowed to execute the wrapped handler based on latency feedback (using Vegas congestion control).
// If the limit is reached, requests are queued up to QueueLimit. If the queue is full, new requests
// are rejected immediately with 429 Too Many Requests. If a request waits in the queue longer than
// QueueTimeout, it is rejected with 503 Service Unavailable.
func AdaptiveLimiter(cfg AdaptiveLimiterConfig) Middleware {
	if cfg.MinLimit <= 0 {
		cfg.MinLimit = 1
	}
	if cfg.MaxLimit < cfg.MinLimit {
		cfg.MaxLimit = cfg.MinLimit
	}
	if cfg.InitialLimit < cfg.MinLimit {
		cfg.InitialLimit = cfg.MinLimit
	}
	if cfg.InitialLimit > cfg.MaxLimit {
		cfg.InitialLimit = cfg.MaxLimit
	}
	if cfg.Alpha <= 0 {
		cfg.Alpha = 2.0
	}
	if cfg.Beta <= cfg.Alpha {
		cfg.Beta = cfg.Alpha + 2.0
	}

	limiter := &adaptiveLimiter{
		minLimit:     cfg.MinLimit,
		maxLimit:     cfg.MaxLimit,
		currentLimit: float64(cfg.InitialLimit),
		alpha:        cfg.Alpha,
		beta:         cfg.Beta,
		queueLimit:   cfg.QueueLimit,
		queueTimeout: cfg.QueueTimeout,
		rttWindow:    cfg.RTTWindow,
		minRTTReset:  time.Now(),
	}

	return func(next Handler) Handler {
		return HandlerFunc(func(w *ResponseWriter, r *Request) {
			ctx := r.Context()

			acquired, waitChan, req := limiter.acquire()
			if !acquired {
				w.Header().Set("Retry-After", "5")
				w.WriteErrorContract(429, "adaptive_limit_reached", "429 Too Many Requests - Adaptive limit reached", true, 5*time.Second)
				return
			}

			if waitChan != nil {
				var timer *time.Timer
				var timeoutChan <-chan time.Time
				if cfg.QueueTimeout > 0 {
					timer = time.NewTimer(cfg.QueueTimeout)
					timeoutChan = timer.C
					defer timer.Stop()
				}

				select {
				case <-waitChan:
					// Acquired slot
				case <-ctx.Done():
					if limiter.cancel(req) {
						return
					}
				case <-timeoutChan:
					if limiter.cancel(req) {
						w.Header().Set("Retry-After", "10")
						w.WriteErrorContract(503, "request_queue_timeout", "503 Service Unavailable - Request queue timeout", true, 10*time.Second)
						return
					}
				}
			}

			startTime := time.Now()
			defer func() {
				rtt := time.Since(startTime)
				limiter.release(rtt)
			}()

			next.ServeHTTP(w, r)
		})
	}
}

