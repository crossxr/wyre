package wyre

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"strconv"
	"strings"
	"sync"
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
	429: "Too Many Requests",
	431: "Request Header Fields Too Large",
	500: "Internal Server Error",
	501: "Not Implemented",
	503: "Service Unavailable",
	505: "HTTP Version Not Supported",
}

func StatusText(code int) string {
	if t, ok := statusText[code]; ok {
		return t
	}
	return "Unknown Status"
}

// Header is a case-insensitive multi-value header map, modeled after
// net/http.Header so handlers written against wyre feel familiar.
type Header map[string][]string

func (h Header) Set(key, value string) {
	h[strings.ToLower(key)] = []string{value}
}

func (h Header) Add(key, value string) {
	k := strings.ToLower(key)
	h[k] = append(h[k], value)
}

func (h Header) Get(key string) string {
	vals := h[strings.ToLower(key)]
	if len(vals) == 0 {
		return ""
	}
	return vals[0]
}

func (h Header) Del(key string) {
	delete(h, strings.ToLower(key))
}

// ResponseWriter is the handler-facing API for writing a response.
// It enforces header-before-body ordering and tracks write state so
// a connection can never end up with a malformed response on the wire.
type ResponseWriter struct {
	conn         net.Conn
	br           *bufio.Reader
	bw           *bufio.Writer
	header       Header
	statusCode   int
	wroteHeader  bool
	bytesWritten int64
	chunked      bool
	hijacked     bool
	onHijack     func()
	onWrite      func([]byte)
}

func newResponseWriter(conn net.Conn, br *bufio.Reader, bw *bufio.Writer) *ResponseWriter {
	return &ResponseWriter{
		conn:   conn,
		br:     br,
		bw:     bw,
		header: make(Header),
	}
}

// Header returns the header map for direct mutation before WriteHeader is called.
func (w *ResponseWriter) Header() Header {
	return w.header
}

// Hijacker is the interface that allows a handler to hijack the connection.
type Hijacker interface {
	Hijack() (net.Conn, *bufio.ReadWriter, error)
}

func (w *ResponseWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	if w.hijacked {
		return nil, nil, fmt.Errorf("wyre: connection already hijacked")
	}
	w.hijacked = true
	if w.onHijack != nil {
		w.onHijack()
	}
	rw := bufio.NewReadWriter(w.br, w.bw)
	return w.conn, rw, nil
}

// WriteHeader sends the status line + headers. Must be called at most once,
// before any call to Write. If not called explicitly, Write will call it
// with 200 on first use.
func (w *ResponseWriter) WriteHeader(code int) error {
	if w.hijacked {
		return fmt.Errorf("wyre: connection already hijacked")
	}
	if w.wroteHeader {
		return fmt.Errorf("wyre: WriteHeader called twice")
	}
	w.wroteHeader = true
	w.statusCode = code

	hasCL := w.header.Get("Content-Length") != ""
	hasTE := w.header.Get("Transfer-Encoding") != ""
	hasBody := true
	if code >= 100 && code < 200 || code == 204 || code == 304 {
		hasBody = false
	}
	if hasBody && !hasCL && !hasTE {
		w.header.Set("Transfer-Encoding", "chunked")
		w.chunked = true
	}

	if _, err := fmt.Fprintf(w.bw, "HTTP/1.1 %d %s\r\n", code, StatusText(code)); err != nil {
		return err
	}

	for key, vals := range w.header {
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
	if w.hijacked {
		return 0, fmt.Errorf("wyre: connection already hijacked")
	}
	if len(p) == 0 {
		return 0, nil
	}
	if w.onWrite != nil {
		w.onWrite(p)
	}
	if !w.wroteHeader {
		if err := w.WriteHeader(200); err != nil {
			return 0, err
		}
	}
	if w.chunked {
		if _, err := fmt.Fprintf(w.bw, "%x\r\n", len(p)); err != nil {
			return 0, err
		}
		n, err := w.bw.Write(p)
		if err != nil {
			return n, err
		}
		if _, err := w.bw.WriteString("\r\n"); err != nil {
			return n, err
		}
		w.bytesWritten += int64(n)
		return n, nil
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
	w.header.Set("Content-Type", contentType)
	w.header.Set("Content-Length", strconv.Itoa(len(body)))
	if err := w.WriteHeader(code); err != nil {
		return err
	}
	_, err := w.Write(body)
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

func (w *ResponseWriter) WriteJSON(code int, v interface{}) error {
	w.header.Set("Content-Type", "application/json")
	body, err := json.Marshal(v)
	if err != nil {
		return err
	}
	w.header.Set("Content-Length", strconv.Itoa(len(body)))
	if err := w.WriteHeader(code); err != nil {
		return err
	}
	_, err = w.Write(body)
	return err
}

var _ io.Writer = (*ResponseWriter)(nil)

var proxyBufferPool = sync.Pool{
	New: func() interface{} {
		b := make([]byte, 4096)
		return &b
	},
}

// ProxyStream reads from src and writes to the response directly, flushing each read chunk immediately.
// This is optimal for piping LLM stream responses without buffering them in memory.
func (w *ResponseWriter) ProxyStream(ctx context.Context, src io.Reader) (int64, error) {
	if w.hijacked {
		return 0, fmt.Errorf("wyre: connection already hijacked")
	}

	if !w.wroteHeader {
		w.Header().Set("Content-Type", "application/octet-stream")
		if err := w.WriteHeader(200); err != nil {
			return 0, err
		}
	}

	bufPtr := proxyBufferPool.Get().(*[]byte)
	defer proxyBufferPool.Put(bufPtr)
	buf := *bufPtr

	var total int64
	for {
		select {
		case <-ctx.Done():
			return total, ctx.Err()
		default:
		}

		n, err := src.Read(buf)
		if n > 0 {
			nw, writeErr := w.Write(buf[:n])
			if writeErr != nil {
				return total, writeErr
			}
			total += int64(nw)

			if flushErr := w.Flush(); flushErr != nil {
				return total, flushErr
			}
		}

		if err != nil {
			if err == io.EOF {
				return total, nil
			}
			return total, err
		}
	}
}
