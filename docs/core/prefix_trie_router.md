# Prefix Trie Router

Wyre contains a custom segment-based prefix trie router that provides deterministic, priority-based route matching with dynamic parameter support.

## Overview

The router implementation is located in [router.go](file:///c:/projects/oun/router.go). It represents paths as a hierarchy of segments, allowing efficient routing lookups that scale with the depth of the URI path rather than the total number of registered routes.

## Implementation Details

### 1. Data Structure
The router is backed by a tree of `node` structs defined in [router.go](file:///c:/projects/oun/router.go#L17):
```go
type node struct {
    segment  string
    isParam  bool
    handlers map[string]Handler
    children []*node
}
```

### 2. Deterministic & Priority-Based Matching
When matching incoming requests, the router implements the following priority in its [match](file:///c:/projects/oun/router.go#L59) method:
1. **Static Match First:** It loops through all non-parameter child nodes first to see if any static segment matches exactly.
2. **Dynamic Parameter Match Second:** If no static match succeeds, it attempts to match parameter nodes (segments starting with `:` in the route definition).
3. **Backtracking:** If a path segment matches a child node but subsequent segments fail to match, the matching algorithm backtracks to evaluate other potential matching paths.

### 3. Parameter Capture
For dynamic segments (e.g., `/users/:id`), the segment key is stored in the node's `segment` field. During matching, the parameter name and parsed path segment are captured in a temporary map and subsequently injected into `r.params` in [ServeHTTP](file:///c:/projects/oun/router.go#L143). Handlers can retrieve this using `r.Param("key")` (see [Param](file:///c:/projects/oun/request.go#L88)).

### 4. Middleware Wrapping
The [Router](file:///c:/projects/oun/router.go#L97) supports global middlewares. When dispatching, it wraps the final matched handler in the middleware chain in reverse order so that the first middleware registered runs first:
```go
for i := len(rt.middlewares) - 1; i >= 0; i-- {
    finalHandler = rt.middlewares[i](finalHandler)
}
```

---

## Implementation Status & Missing Elements

- **Status:** **Partially Implemented**. The router supports static segments, segment parameters, deterministic priority matching, and backtracking.
- **Missing Elements:**
  - **No Wildcard/Catch-All Support:** There is no wildcard matching (e.g. `*` or `*filepath` to match arbitrary sub-paths or multiple path segments). All paths are split strictly on `/` boundaries, meaning each dynamic segment can only match exactly one path segment.
  - **No Regular Expressions:** The router does not support regex constraints on segments.
