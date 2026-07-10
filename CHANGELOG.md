# Changelog

All notable changes to the Wyre project will be documented in this file.

## [0.1.0] - 2026-07-10

### Added
- **Core Raw Socket Engine**: Ultra-low-latency TCP server compiling directly against raw OS network sockets. Includes configurable connection pool, connection timeout limits, and raw read/write buffer handling.
- **Radix/Trie Routing System**: High-performance segment-based prefix tree router that matches routes in $O(L)$ time. Supports wildcard matching, segment backtracking, and dynamic path parameter binding.
- **net/http Compatibility Layer**: The `FromHTTPHandler` adapter allows standard library `http.Handler` instances (e.g., custom routers, standard handlers) to run directly on top of the raw Wyre TCP engine.
- **Memory Recycling Pool**: Reusable memory buffers, request/response structs, and header slices managed via `sync.Pool` to achieve near-zero heap allocations on performance-sensitive paths.
- **Connection Hijacking**: Native `Hijack()` API to grab underlying raw socket descriptors and transition TCP streams to other protocols (e.g., WebSockets, custom TCP streams).
- **Server-Sent Events (SSE) Engine**: Dynamic SSE streaming framework with write-backpressure checks to prevent memory ballooning when dealing with slow clients during token generation.
- **Concurrency Limiters**: Individual per-route limits that block or queue requests using a token-bucket mechanism once a threshold is crossed.
- **Vegas Adaptive Load Shedder**: Middleware that monitors request queue times and system capacity, dynamically adjusting maximum concurrent limits to prevent server thrashing.
- **Idempotency-Key Deduplication**: Request deduplication middleware that stores write execution signatures in memory to avoid repeating expensive state changes.
- **Outbound Resilience Client**: Custom HTTP round-tripper featuring jittered exponential backoffs, circuit breakers, and connection failure handling for outbound LLM and tool calls.
- **Agent Capabilities Auto-Discovery**: Automatic spec generator registered under `GET /.well-known/agent-capabilities` exposing all active endpoints, parameter schemes, descriptions, and input schemas to external AI agents. Can be disabled with `.DisableDiscovery()`.
- **Structured Error Contracts**: Machine-actionable JSON error payloads (`ErrorContract` consisting of `code`, `message`, `retryable`, and `backoff_hint_ms`) returned by default from rate limiters, load shedders, and panic recovery middleware.
- **CORS Handling Middleware**: Clean cross-origin resource sharing support with preflight handling, methods, headers, and credentials config.
- **Panic Recovery Middleware**: Captures unhandled handler panics, returns a structured 500 JSON error contract, and prevents the core TCP engine from crashing.
