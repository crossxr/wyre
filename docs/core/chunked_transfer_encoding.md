# Chunked Transfer Encoding

Wyre supports automatic Chunked Transfer Encoding for both inbound request stream decoding and outbound response streaming.

## Overview

HTTP/1.1 chunked transfer encoding allows servers to stream dynamically generated content to clients without knowing the final payload size in advance. By omitting the `Content-Length` header, the data is sent in a series of chunks with explicit size boundaries.

## Implementation Details

### 1. Inbound Request Decoding
When the client sends a request with the header `Transfer-Encoding: chunked`:
- The request resolver initializes a [chunkedReader](file:///c:/projects/oun/request.go#L246) in [resolveBodyReader](file:///c:/projects/oun/request.go#L202).
- The `chunkedReader` parses the hex-encoded size of each chunk using [readChunkSize](file:///c:/projects/oun/request.go#L304), reads the raw bytes, consumes the trailing CRLF, and processes potential trailers.
- If a single chunk exceeds `maxChunkSize` (8MB), an error is returned to prevent denial-of-service vector attacks.

### 2. Automatic Outbound Response Streaming
When the server sends responses to clients:
- **Detection:** In [WriteHeader](file:///c:/projects/oun/response.go#L114), Wyre checks if the response code allows a body (e.g., status is not 204 or 304). If the handler does not explicitly set `Content-Length` or `Transfer-Encoding`, Wyre automatically sets `Transfer-Encoding: chunked` and enables chunked response mode (`w.chunked = true`).
- **Chunk Generation:** Each invocation of `Write(p)` formats the chunk on the wire as:
  ```
  <hex-length-of-p>\r\n
  <p-bytes>\r\n
  ```
- **Terminating Chunk:** When the handler completes execution, the server checks if chunked encoding was active. If so, it appends the terminating empty chunk (`0\r\n\r\n`) to close the stream (see [handleConn](file:///c:/projects/oun/server.go#L263)).

---

## Implementation Status & Missing Elements

- **Status:** **Fully Implemented**. Both decoding chunked request bodies and automatic streaming/encoding of chunked responses are supported out of the box.
- **Missing Elements:** None.
