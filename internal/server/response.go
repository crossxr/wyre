package server

import (
	"bufio"
	"fmt"
	"io"
	"net"
	"strconv"
)

var statusText = map[int]string{
	200: "OK",
	201: "Created",
	202: "Accepted",
	204: "No Content",
	301: "Moved Permanently",
	302: "Found",
	304: "Not Modified",
	400: "Bad Request",
	401: "Unauthorized",
	403: "Forbidden",
	404: "Not Found",
	405: "Method Not Allowed",
	408: "Request Timeout",
	411: "Length Required",
	413: "Payload Too Large",
	414: "URI Too Long",
	431: "Request Header Fields Too Large",
	500: "Internal Server Error",
	501: "Not Implemented",
	505: "HTTP Version Not Supported",
}

func StatusText(code int) string {
	if t, ok := statusText[code]; ok {
		return t
	}
	return "Unknown Status"
}

// ResponseWriter is the handler-facing API for writing a response.
// It enforces header-before-body ordering and tracks write state so
// a connection can never end up with a malformed response on the wire.
type ResponseWriter struct {
	conn         net.Conn
	bw           *bufio.Writer
	headers      map[string][]string
	statusCode   int
	wroteHeader  bool
	bytesWritten int64
}

func newResponseWriter(conn net.Conn, bw *bufio.Writer) *ResponseWriter {
	return &ResponseWriter{
		conn:    conn,
		bw:      bw,
		headers: make(map[string][]string),
	}
}

func (w *ResponseWriter) SetHeader(key, value string) {
	if w.wroteHeader {
		return // too late, headers already flushed
	}
	w.headers[key] = []string{value}
}

func (w *ResponseWriter) AddHeader(key, value string) {
	if w.wroteHeader {
		return
	}
	w.headers[key] = append(w.headers[key], value)
}

// WriteHeader sends the status line + headers. Must be called at most once,
// before any call to Write. If not called explicitly, Write will call it
// with 200 on first use.
func (w *ResponseWriter) WriteHeader(code int) error {
	if w.wroteHeader {
		return fmt.Errorf("oun: WriteHeader called twice")
	}
	w.wroteHeader = true
	w.statusCode = code

	if _, err := fmt.Fprintf(w.bw, "HTTP/1.1 %d %s\r\n", code, StatusText(code)); err != nil {
		return err
	}

	for key, vals := range w.headers {
		for _, v := range vals {
			if _, err := fmt.Fprintf(w.bw, "%s: %s\r\n", key, v); err != nil {
				return err
			}
		}
	}

	if _, err := w.bw.WriteString("\r\n"); err != nil {
		return err
	}
	return nil
}

func (w *ResponseWriter) Write(p []byte) (int, error) {
	if !w.wroteHeader {
		if err := w.WriteHeader(200); err != nil {
			return 0, err
		}
	}
	n, err := w.bw.Write(p)
	w.bytesWritten += int64(n)
	return n, err
}

func (w *ResponseWriter) Flush() error {
	return w.bw.Flush()
}

// WriteFixedBody is the common case: known-length body, sets Content-Length
// automatically and writes headers + body in one call.
func (w *ResponseWriter) WriteFixedBody(code int, contentType string, body []byte) error {
	w.SetHeader("Content-Type", contentType)
	w.SetHeader("Content-Length", strconv.Itoa(len(body)))
	if err := w.WriteHeader(code); err != nil {
		return err
	}
	_, err := w.bw.Write(body)
	return err
}

// WriteError writes a minimal plaintext error response. Used by the server
// itself for parse failures, before any handler runs.
func WriteError(conn net.Conn, code int) {
	bw := bufio.NewWriter(conn)
	body := fmt.Sprintf("%d %s\n", code, StatusText(code))
	fmt.Fprintf(bw, "HTTP/1.1 %d %s\r\n", code, StatusText(code))
	fmt.Fprintf(bw, "Content-Type: text/plain\r\n")
	fmt.Fprintf(bw, "Content-Length: %d\r\n", len(body))
	fmt.Fprintf(bw, "Connection: close\r\n")
	bw.WriteString("\r\n")
	bw.WriteString(body)
	bw.Flush()
}

var _ io.Writer = (*ResponseWriter)(nil)
