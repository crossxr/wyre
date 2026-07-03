package server

import (
	"bufio"
	"errors"
	"fmt"
	"strings"
)

const (
	maxRequestLineSize = 8 * 1024  // 8KB
	maxHeaderSize      = 16 * 1024 // 16KB total headers
	maxHeaderCount     = 100
)

var (
	ErrRequestLineTooLong = errors.New("request line too long")
	ErrHeaderTooLong      = errors.New("headers too large")
	ErrTooManyHeaders     = errors.New("too many headers")
	ErrMalformedRequest   = errors.New("malformed request")
)

type Request struct {
	Method     string
	Target     string
	Proto      string
	Headers    map[string][]string
	RemoteAddr string
}

// readLine reads a single CRLF-terminated line, stripping the CRLF.
// Rejects bare LF (not spec-compliant but common in the wild; we choose strict).
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
	// header names: no whitespace before colon (RFC 7230 §3.2.4, smuggling defense)
	if strings.ContainsAny(key, " \t") {
		return "", "", ErrMalformedRequest
	}
	return strings.ToLower(key), val, nil
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

	return &Request{
		Method:  method,
		Target:  target,
		Proto:   proto,
		Headers: headers,
	}, nil
}
