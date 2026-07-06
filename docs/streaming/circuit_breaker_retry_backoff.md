# Outbound Resilience: Circuit Breaker & Retry-Backoff

Wyre provides native resilience tools for outbound network calls (such as queries to LLM providers or remote databases/vector tools) to shield your web application from transient network drops and downstream rate limits.

## The Need for Outbound Resilience in Agentic Systems

AI agents make heavy use of outbound HTTP requests. A single tool-execution path might invoke multiple API endpoints, run vector searches, and generate chat completions.

If a downstream API (e.g., Anthropic, OpenAI, or a third-party API tool) becomes slow, times out, or rate-limits the server:
1. Goroutines pile up on the server waiting for blocking HTTP requests, depleting thread resources.
2. The server keeps sending requests to an already overloaded downstream server, prolonging its recovery.

Wyre solves this at the outbound client transport layer with a built-in [CircuitBreaker](file:///c:/projects/oun/resilience.go#L37) and a jittered exponential retry mechanism. By wrapping Go's standard `http.RoundTripper` in a [ResilientRoundTripper](file:///c:/projects/oun/resilience.go#L125), you inject production-grade fault tolerance transparently into any Go client SDK.

---

## Circuit Breaker State Machine

The Circuit Breaker tracks consecutive execution outcomes and transitions between three states:

| State | Behavior |
| :--- | :--- |
| **Closed** | Normal operation. Requests flow to the network. If consecutive failures exceed the threshold, the circuit trips to **Open**. |
| **Open** | Downstream is unhealthy. All requests fail fast immediately with `wyre.ErrCircuitOpen` without hitting the network, saving CPU and time. After a cooldown duration, the circuit enters **Half-Open**. |
| **Half-Open** | Trial phase. A small number of requests are sent to the network. If any request fails, the breaker trips back to **Open**. If the success threshold is met, the breaker resets to **Closed**. |

---

## Outbound API

All resilience utilities are located in [resilience.go](file:///c:/projects/oun/resilience.go).

### Key Structs & Methods

1. **`wyre.NewCircuitBreaker(cfg)`**: Instantiates a Circuit Breaker with thresholds:
   ```go
   type CircuitBreakerConfig struct {
       FailureThreshold int           // Default: 5 consecutive failures to trip Open
       Cooldown         time.Duration // Default: 5 seconds cooldown before Half-Open
       SuccessThreshold int           // Default: 2 consecutive successes to Close
   }
   ```
2. **`wyre.NewResilientRoundTripper(cfg)`**: Wraps any standard `http.RoundTripper` (like `http.DefaultTransport`) with retry and circuit breaker logic:
   ```go
   type ResilientConfig struct {
       RoundTripper   http.RoundTripper
       CircuitBreaker *CircuitBreaker
       MaxRetries     int           // Default: 3 retries
       InitialBackoff time.Duration // Default: 100ms
       MaxBackoff     time.Duration // Default: 2s
   }
   ```

### Intelligent Retry & Rate Limit Handling
- **Jittered Backoff:** Retries apply exponential backoff (e.g., 100ms -> 200ms -> 400ms) with a randomized "Full Jitter" offset. This prevents the "thundering herd" problem where all concurrent retrying agents hit the upstream server at the exact same millisecond.
- **HTTP 429 Handling:** If a downstream server returns an HTTP `429 Too Many Requests`, the roundtripper pauses and retries with backoff, but does **not** increment the circuit breaker's failure counter. This prevents rate-limit events from incorrectly tripping the breaker for other downstream calls.

---

## Usage Example

The following example shows how to wrap Go's standard `http.Client` with the resilient roundtripper and execute an outbound LLM request:

```go
package main

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"time"
	"wyre"
)

func main() {
	// Configure the Circuit Breaker
	cb := wyre.NewCircuitBreaker(wyre.CircuitBreakerConfig{
		FailureThreshold: 3,
		Cooldown:         10 * time.Second,
		SuccessThreshold: 2,
	})

	// Wrap the default transport with retries and the circuit breaker
	resilientTransport := wyre.NewResilientRoundTripper(wyre.ResilientConfig{
		RoundTripper:   http.DefaultTransport,
		CircuitBreaker: cb,
		MaxRetries:     3,
		InitialBackoff: 100 * time.Millisecond,
		MaxBackoff:     1 * time.Second,
	})

	// Create http.Client using the resilient transport
	client := &http.Client{
		Transport: resilientTransport,
		Timeout:   5 * time.Second,
	}

	// Prepare outbound call
	req, _ := http.NewRequestWithContext(context.Background(), "POST", "https://api.openai.com/v1/chat/completions", nil)

	// Execute call
	resp, err := client.Do(req)
	if err != nil {
		if err == wyre.ErrCircuitOpen {
			fmt.Println("Request blocked: Circuit is OPEN!")
			return
		}
		fmt.Printf("Outbound call failed: %v\n", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Response: %s\n", string(body))
}
```
