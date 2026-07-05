# Adaptive Concurrency Limiter & Load Shedding

Wyre includes an adaptive concurrency limiting and load shedding middleware. Unlike static rate or concurrency limiters that require constant manual tuning, Wyre's adaptive limiter dynamically adjusts the allowed concurrency threshold in response to real-time latency feedback. This ensures that your system degrades gracefully under high-traffic bursts instead of dropping TCP connections or overloading downstream databases.

## Why Adaptive Concurrency is Critical

In modern microservices and AI-agent environments, static concurrency limits are fragile:
- **Too Low**: You waste server resources and reject requests even when the backend is completely healthy.
- **Too High**: Under sudden spikes or when backend dependencies (databases, upstream LLM APIs) slow down, requests pile up, leading to memory bloat, high CPU, and cascading timeouts.

Wyre solves this by implementing an adaptive limiter based on the **Vegas congestion control** algorithm (similar to Netflix's `concurrency-limits` library).

### How it Works
1. **Latency Measurement**: The limiter measures the Round-Trip Time (RTT) / execution latency of every request.
2. **Baseline Minimum RTT (`minRTT`)**: The limiter tracks the minimum latency observed over a configured time window (`RTTWindow`). This represents the baseline response time of a healthy, unloaded system.
3. **Queue Size Estimation**: Under Little's Law, if the current latency (`currentRTT`) starts rising relative to the base latency (`minRTT`), it indicates queue buildup inside the application or database. The estimated queue size is calculated as:
   $$\text{QueueSize} = \text{Limit} \times \left(1 - \frac{\text{minRTT}}{\text{currentRTT}}\right)$$
4. **Adaptive Limit Adjustments**:
   - **Under-Utilized (`QueueSize < Alpha`)**: If the estimated queue is small, the server has spare capacity. The limit is increased additively (`Limit = Limit + 1`).
   - **Overloaded (`QueueSize > Beta`)**: If the queue is growing, the system is congested. The limit is decreased (`Limit = Limit - 1`) to prevent cascading failures.
   - **Stable**: If the queue size is between `Alpha` and `Beta`, the limit remains unchanged.

## The Adaptive Limiter API

Initialize the adaptive limiter middleware with a custom configuration:

```go
func AdaptiveLimiter(cfg AdaptiveLimiterConfig) Middleware
```

### Configuration Options

| Property | Type | Description | Default |
|---|---|---|---|
| `MinLimit` | `int` | The lower bound for the dynamic concurrency limit. | `2` |
| `MaxLimit` | `int` | The upper bound for the dynamic concurrency limit. | `100` |
| `InitialLimit` | `int` | The initial limit when the server starts. | `10` |
| `Alpha` | `float64` | Threshold queue size below which the limit is increased. | `3.0` |
| `Beta` | `float64` | Threshold queue size above which the limit is decreased. | `6.0` |
| `QueueLimit` | `int` | Maximum requests that can wait in the backlog queue before returning 429. | `50` |
| `QueueTimeout` | `time.Duration` | Maximum duration a request can wait in the queue before timing out with 503. | `5 * time.Second` |
| `RTTWindow` | `time.Duration` | Time window after which the base `minRTT` resets to adapt to changing baselines. | `10 * time.Second` |

Get default configuration settings:

```go
func DefaultAdaptiveLimiterConfig() AdaptiveLimiterConfig
```

## Usage Example

The following example demonstrates how to wrap a heavy endpoint with the adaptive limiter:

```go
package main

import (
    "time"
    "wyre"
)

func main() {
    router := wyre.NewRouter()

    // 1. Get default adaptive configuration
    config := wyre.DefaultAdaptiveLimiterConfig()
    config.MinLimit = 5
    config.MaxLimit = 50
    config.QueueLimit = 20
    config.QueueTimeout = 2 * time.Second

    // 2. Instantiate middleware
    adaptiveShedder := wyre.AdaptiveLimiter(config)

    // 3. Register route with adaptive load shedding
    router.Handle("POST", "/api/heavy-calculation", adaptiveShedder(wyre.HandlerFunc(heavyHandler)))

    server := wyre.NewWithConfig(wyre.DefaultConfig("127.0.0.1:8080"))
    server.ListenAndServe()
}

func heavyHandler(w *wyre.ResponseWriter, r *wyre.Request) {
    // Simulated heavy database or vector search
    time.Sleep(500 * time.Millisecond)
    w.WriteFixedBody(200, "text/plain", []byte("Success"))
}
```
