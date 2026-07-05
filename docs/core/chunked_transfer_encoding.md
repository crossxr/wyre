# Chunked Transfer Encoding

Wyre supports HTTP/1.1 chunked transfer encoding out of the box. This applies to both parsing incoming chunked request bodies and automatically streaming outgoing response payloads.

## What is Chunked Transfer Encoding?

In HTTP/1.1, chunked transfer encoding allows servers to begin sending dynamically generated content to clients before knowing the final payload size. By omitting the `Content-Length` header and specifying `Transfer-Encoding: chunked`, data is transferred as a series of chunks, each prefixed by its size. This is particularly useful for real-time streaming APIs.

## Inbound Request Decoding

If a client sends an HTTP request with the header `Transfer-Encoding: chunked` (e.g. streaming an upload), Wyre automatically parses and merges the chunked stream transparently. Your handlers can read the request payload as usual without worrying about the underlying chunk structures.

> [!WARNING]
> To protect your server from Denial of Service (DoS) attacks, Wyre limits the size of individual incoming chunks. If a single chunk exceeds 8MB, the request will be terminated and an error will be returned.

## Automatic Outbound Response Streaming

When writing handlers in Wyre, you do not need to manually configure chunked headers to stream data. 

### How it works:
1. **Detection**: If your handler writes content to a response but does not explicitly set a `Content-Length` or a `Transfer-Encoding` header, Wyre automatically applies `Transfer-Encoding: chunked` to the response.
2. **Chunk Generation**: Every invocation of `w.Write(p)` writes `p` as a distinct chunk on the socket.
3. **Stream Termination**: When your handler function finishes execution, Wyre automatically writes the terminating empty chunk (`0\r\n\r\n`) to close the connection stream cleanly.

### Example: Chunked Data Stream

The following example shows how to stream a sequence of messages back to a client:

```go
package main

import (
    "fmt"
    "time"
    "wyre"
)

func main() {
    router := wyre.NewRouter()
    router.HandleFunc("GET", "/stream", streamHandler)

    server := wyre.NewWithConfig(wyre.DefaultConfig("127.0.0.1:8080"))
    server.ListenAndServe()
}

func streamHandler(w *wyre.ResponseWriter, r *wyre.Request) {
    // Setting Content-Type, leaving Content-Length unset triggers chunked encoding
    w.Header().Set("Content-Type", "text/plain")

    for i := 1; i <= 5; i++ {
        // Write the data chunk
        fmt.Fprintf(w, "Chunk number %d\n", i)
        w.Flush() // Flush chunk immediately to the client socket

        time.Sleep(500 * time.Millisecond)
    }
}
```
