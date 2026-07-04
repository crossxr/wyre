# REST Utilities & Middleware

Wyre provides basic REST JSON request/response helpers, built-in panic recovery, and Cross-Origin Resource Sharing (CORS) support.

## Overview

REST utility methods are integrated directly into the request and response models, while request lifecycle features are structured as middleware function chains.

## Implementation Details

### 1. JSON & Body Helpers
- **Read JSON:** Handlers can parse JSON request bodies directly via [ReadJSON](file:///c:/projects/oun/request.go#L98) on `Request`:
  ```go
  func (r *Request) ReadJSON(dst interface{}) error {
      return json.Unmarshal(r.rawBody, dst)
  }
  ```
- **Write JSON:** Handlers can render JSON responses using [WriteJSON](file:///c:/projects/oun/response.go#L214) on `ResponseWriter`. It marshals the interface, sets the `Content-Type: application/json` header, automatically calculates and sets `Content-Length`, and writes it to the socket buffer.
- **Write Fixed Body:** Handlers can send pre-buffered or plain-text payloads using [WriteFixedBody](file:///c:/projects/oun/response.go#L190).

### 2. CORS Middleware
The CORS middleware is defined in [middleware.go](file:///c:/projects/oun/middleware.go#L16). It maps allowed origins, methods, and headers, writes the CORS headers to the response wrapper, and handles HTTP `OPTIONS` preflight requests immediately by returning a `204 No Content` status.

### 3. Panic Recovery
Panic protection is handled at two distinct layers for maximum production safety:
- **`Recovery()` Middleware:** A standard middleware [Recovery](file:///c:/projects/oun/middleware.go#L38) recovers from panic, prints a debug stack trace, and sends a `500 Internal Server Error` response back.
- **Built-in Server Dispatch Recovery:** For safety against custom handler setups that omit the recovery middleware, the server's request dispatcher in [dispatch](file:///c:/projects/oun/server.go#L288) implements an internal panic recovery deferred function to prevent the active TCP worker thread from crashing the entire program.

---

## Implementation Status & Missing Elements

- **Status:** **Partially Implemented**. Basic helpers and panic/CORS middlewares are provided.
- **Missing Elements / Limitations:**
  - **No Query Parameter Parser:** There is no helper method on `Request` to parse query parameters (e.g. `?name=val`) into a structured map or retrieve keys easily; handlers must parse `r.RawQuery` manually.
  - **No Group/Sub-Router Middlewares:** Middlewares can only be configured globally on the router (`rt.Use`). There is no support for path-prefix specific middlewares or route groups with independent middleware chains.
  - **No Validation Utilities:** There are no built-in utilities for request validation (e.g. schema binding or input sanitization).
