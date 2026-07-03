package server

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"strconv"
	"strings"
)

const (
	maxRequestLineSize = 8 * 1024  // 8KB
	maxHeaderSize      = 16 * 1024 // 16KB total headers
	maxHeaderCount     = 100
	maxBodySize        = 10 * 1024 * 1024 // 10MB default cap
	maxChunkSize       = 8 * 1024 * 1024  // 8MB per chunk
)

var (
	ErrRequestLineTooLong = errors.New("request line too long")
	ErrHeaderTooLong      = errors.New("headers too large")
	ErrTooManyHeaders     = errors.New("too many headers")
	ErrMalformedRequest   = errors.New("malformed request")
	ErrSmugglingAttempt   = errors.New("conflicting Content-Length/Transfer-Encoding")
	ErrBodyTooLarge       = errors.New("body exceeds max size")
	ErrInvalidChunkSize   = errors.New("invalid chunk size")
	ErrInvalidContentLen  = errors.New("invalid Content-Length")
)

type Request struct {
	Method     string
	Target     string
	Proto      string
	Headers    map[string][]string
	Body       io.Reader
	RemoteAddr string
}

func (r *Request) Header(key string) string {
	vals := r.Headers[strings.ToLower(key)]
	if len(vals) == 0 {
		return ""
	}
	return vals[0]
}

// readLine reads a single CRLF-terminated line, stripping the CRLF.
func readLine(r *bufio.Reader, maxSize int) (string, error) {
	line, err := r.ReadString('\n')
	if err != nil {
		return "", err
	}
	if len(line) > maxSize {
		return "", ErrRequestLineTooLong
	}
	if !strings.HasSuffix(line, "\r\n") {
		return "", ErrMalformedRequest
	}
	return line[:len(line)-2], nil
}

func parseRequestLine(line string) (method, target, proto string, err error) {
	parts := strings.SplitN(line, " ", 3)
	if len(parts) != 3 {
		return "", "", "", ErrMalformedRequest
	}
	method, target, proto = parts[0], parts[1], parts[2]

	if method == "" || target == "" {
		return "", "", "", ErrMalformedRequest
	}
	if proto != "HTTP/1.1" && proto != "HTTP/1.0" {
		return "", "", "", fmt.Errorf("%w: unsupported proto %q", ErrMalformedRequest, proto)
	}
	return method, target, proto, nil
}

func parseHeaders(r *bufio.Reader) (map[string][]string, error) {
	headers := make(map[string][]string)
	totalSize := 0
	count := 0

	for {
		line, err := readLine(r, maxHeaderSize)
		if err != nil {
			return nil, err
		}
		if line == "" {
			break // blank line = end of headers
		}

		totalSize += len(line)
		if totalSize > maxHeaderSize {
			return nil, ErrHeaderTooLong
		}
		count++
		if count > maxHeaderCount {
			return nil, ErrTooManyHeaders
		}

		key, val, err := parseHeaderLine(line)
		if err != nil {
			return nil, err
		}
		headers[key] = append(headers[key], val)
	}
	return headers, nil
}

func parseHeaderLine(line string) (key, val string, err error) {
	idx := strings.IndexByte(line, ':')
	if idx < 0 {
		return "", "", ErrMalformedRequest
	}
	key = strings.TrimSpace(line[:idx])
	val = strings.TrimSpace(line[idx+1:])
	if key == "" {
		return "", "", ErrMalformedRequest
	}
	if strings.ContainsAny(key, " \t") {
		return "", "", ErrMalformedRequest
	}
	return strings.ToLower(key), val, nil
}

// resolveBodyReader inspects Content-Length / Transfer-Encoding and returns
// the correctly bounded body reader. This is the primary smuggling defense point.
func resolveBodyReader(r *bufio.Reader, headers map[string][]string) (io.Reader, error) {
	_, hasCL := headers["content-length"]
	teVals, hasTE := headers["transfer-encoding"]

	if hasCL && hasTE {
		return nil, ErrSmugglingAttempt
	}

	if hasTE {
		te := strings.ToLower(strings.TrimSpace(teVals[len(teVals)-1]))
		if te != "chunked" {
			return nil, fmt.Errorf("%w: unsupported transfer-encoding %q", ErrMalformedRequest, te)
		}
		return newChunkedReader(r), nil
	}

	if hasCL {
		clVals := headers["content-length"]
		// Reject multiple Content-Length headers unless all identical (smuggling defense)
		first := clVals[0]
		for _, v := range clVals[1:] {
			if v != first {
				return nil, ErrSmugglingAttempt
			}
		}
		n, err := strconv.ParseInt(first, 10, 64)
		if err != nil || n < 0 {
			return nil, ErrInvalidContentLen
		}
		if n > maxBodySize {
			return nil, ErrBodyTooLarge
		}
		if n == 0 {
			return http_EmptyReader{}, nil
		}
		return io.LimitReader(r, n), nil
	}

	// No body declared
	return http_EmptyReader{}, nil
}

type http_EmptyReader struct{}

func (http_EmptyReader) Read(p []byte) (int, error) { return 0, io.EOF }

// chunkedReader implements io.Reader for Transfer-Encoding: chunked (RFC 7230 §4.1)
type chunkedReader struct {
	r         *bufio.Reader
	remaining int64 // bytes left in current chunk
	done      bool
	err       error
}

func newChunkedReader(r *bufio.Reader) *chunkedReader {
	return &chunkedReader{r: r}
}

func (cr *chunkedReader) Read(p []byte) (int, error) {
	if cr.err != nil {
		return 0, cr.err
	}
	if cr.done {
		return 0, io.EOF
	}

	if cr.remaining == 0 {
		size, err := cr.readChunkSize()
		if err != nil {
			cr.err = err
			return 0, err
		}
		if size == 0 {
			// final chunk: consume trailing headers (if any) + final CRLF
			if err := cr.consumeTrailer(); err != nil {
				cr.err = err
				return 0, err
			}
			cr.done = true
			return 0, io.EOF
		}
		cr.remaining = size
	}

	readSize := int64(len(p))
	if readSize > cr.remaining {
		readSize = cr.remaining
	}
	n, err := cr.r.Read(p[:readSize])
	cr.remaining -= int64(n)

	if err != nil {
		cr.err = err
		return n, err
	}

	if cr.remaining == 0 {
		// consume trailing CRLF after chunk data
		if _, err := readLine(cr.r, 2); err != nil {
			cr.err = err
			return n, err
		}
	}

	return n, nil
}

func (cr *chunkedReader) readChunkSize() (int64, error) {
	line, err := readLine(cr.r, 64) // chunk-size lines are short
	if err != nil {
		return 0, err
	}
	// strip chunk extensions (";name=value") if present
	if idx := strings.IndexByte(line, ';'); idx >= 0 {
		line = line[:idx]
	}
	line = strings.TrimSpace(line)
	if line == "" {
		return 0, ErrInvalidChunkSize
	}
	size, err := strconv.ParseInt(line, 16, 64)
	if err != nil || size < 0 {
		return 0, ErrInvalidChunkSize
	}
	if size > maxChunkSize {
		return 0, ErrBodyTooLarge
	}
	return size, nil
}

func (cr *chunkedReader) consumeTrailer() error {
	for {
		line, err := readLine(cr.r, maxHeaderSize)
		if err != nil {
			return err
		}
		if line == "" {
			return nil // end of trailer section
		}
		// trailers parsed but discarded (not exposed to handlers in this version)
	}
}

func ParseRequest(r *bufio.Reader) (*Request, error) {
	line, err := readLine(r, maxRequestLineSize)
	if err != nil {
		return nil, err
	}

	method, target, proto, err := parseRequestLine(line)
	if err != nil {
		return nil, err
	}

	headers, err := parseHeaders(r)
	if err != nil {
		return nil, err
	}

	body, err := resolveBodyReader(r, headers)
	if err != nil {
		return nil, err
	}

	return &Request{
		Method:  method,
		Target:  target,
		Proto:   proto,
		Headers: headers,
		Body:    body,
	}, nil
}
