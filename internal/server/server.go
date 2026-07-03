package server

import (
	"bufio"
	"context"
	"errors"
	"io"
	"log"
	"net"
	"strings"
	"sync"
	"time"
)

type Config struct {
	Addr               string
	ReadTimeout        time.Duration
	WriteTimeout       time.Duration
	IdleTimeout        time.Duration
	MaxRequestsPerConn int
	MaxConnections     int // 0 = unlimited
	Handler            Handler
}

func DefaultConfig(addr string) Config {
	return Config{
		Addr:               addr,
		ReadTimeout:        10 * time.Second,
		WriteTimeout:       10 * time.Second,
		IdleTimeout:        60 * time.Second,
		MaxRequestsPerConn: 1000,
		MaxConnections:     10000,
	}
}

type Server struct {
	cfg Config
	ln  net.Listener

	mu      sync.Mutex
	conns   map[net.Conn]struct{}
	closing bool
	sem     chan struct{} // nil if MaxConnections == 0
	wg      sync.WaitGroup
}

func New(addr string) *Server {
	return &Server{cfg: DefaultConfig(addr)}
}

func NewWithConfig(cfg Config) *Server {
	if cfg.Handler == nil {
		cfg.Handler = NewRouter()
	}
	s := &Server{cfg: cfg, conns: make(map[net.Conn]struct{})}
	if cfg.MaxConnections > 0 {
		s.sem = make(chan struct{}, cfg.MaxConnections)
	}
	return s
}

func (s *Server) ListenAndServe() error {
	if s.cfg.Handler == nil {
		s.cfg.Handler = NewRouter()
	}
	if s.conns == nil {
		s.conns = make(map[net.Conn]struct{})
	}
	if s.cfg.MaxConnections > 0 && s.sem == nil {
		s.sem = make(chan struct{}, s.cfg.MaxConnections)
	}

	ln, err := net.Listen("tcp", s.cfg.Addr)
	if err != nil {
		return err
	}
	s.ln = ln
	defer ln.Close()

	log.Printf("wyre listening on %s", s.cfg.Addr)

	for {
		conn, err := ln.Accept()
		if err != nil {
			s.mu.Lock()
			closing := s.closing
			s.mu.Unlock()
			if closing {
				return nil // expected: Shutdown() closed the listener
			}
			log.Printf("accept error: %v", err)
			continue
		}

		if s.sem != nil {
			select {
			case s.sem <- struct{}{}:
			default:
				// at capacity: reject immediately rather than queueing
				// unboundedly in memory
				WriteError(conn, 503)
				conn.Close()
				continue
			}
		}

		s.trackConn(conn, true)
		s.wg.Add(1)
		go func() {
			defer s.wg.Done()
			defer func() {
				if s.sem != nil {
					<-s.sem
				}
			}()
			defer s.trackConn(conn, false)
			s.handleConn(conn)
		}()
	}
}

func (s *Server) trackConn(conn net.Conn, add bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if add {
		s.conns[conn] = struct{}{}
	} else {
		delete(s.conns, conn)
	}
}

// Shutdown stops accepting new connections and waits for in-flight
// connections to finish, up to ctx's deadline. Connections still open
// when ctx is done are forcibly closed.
func (s *Server) Shutdown(ctx context.Context) error {
	s.mu.Lock()
	s.closing = true
	if s.ln != nil {
		s.ln.Close()
	}
	s.mu.Unlock()

	done := make(chan struct{})
	go func() {
		s.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		return nil
	case <-ctx.Done():
		s.mu.Lock()
		for c := range s.conns {
			c.Close()
		}
		s.mu.Unlock()
		return ctx.Err()
	}
}

func (s *Server) handleConn(conn net.Conn) {
	defer conn.Close()
	reader := bufio.NewReader(conn)

	requestCount := 0

	for {
		if s.cfg.MaxRequestsPerConn > 0 && requestCount >= s.cfg.MaxRequestsPerConn {
			return
		}

		conn.SetReadDeadline(time.Now().Add(s.cfg.IdleTimeout))
		if _, err := reader.Peek(1); err != nil {
			return
		}

		conn.SetReadDeadline(time.Now().Add(s.cfg.ReadTimeout))

		req, err := ParseRequest(reader)
		if err != nil {
			log.Printf("parse error from %s: %v", conn.RemoteAddr(), err)
			conn.SetWriteDeadline(time.Now().Add(s.cfg.WriteTimeout))
			WriteError(conn, mapParseErrorToStatus(err))
			return
		}
		req.RemoteAddr = conn.RemoteAddr().String()
		requestCount++

		bodyBytes, err := io.ReadAll(req.Body)
		if err != nil {
			log.Printf("body read error from %s: %v", conn.RemoteAddr(), err)
			conn.SetWriteDeadline(time.Now().Add(s.cfg.WriteTimeout))
			WriteError(conn, 400)
			return
		}
		req.Body = nil
		req.rawBody = bodyBytes

		keepAlive := shouldKeepAlive(req)

		conn.SetWriteDeadline(time.Now().Add(s.cfg.WriteTimeout))
		bw := bufio.NewWriter(conn)
		w := newResponseWriter(conn, bw)

		if !keepAlive {
			w.header.Set("Connection", "close")
		}

		s.dispatch(w, req)

		if !w.wroteHeader {
			w.WriteHeader(200)
		}
		if err := w.Flush(); err != nil {
			log.Printf("flush error to %s: %v", conn.RemoteAddr(), err)
			return
		}

		if !keepAlive {
			return
		}
	}
}

// dispatch runs the handler with panic recovery so a bug in one handler
// can't take down the goroutine (and thus silently drop the connection
// without a response). This is a production-safety requirement, not optional.
func (s *Server) dispatch(w *ResponseWriter, req *Request) {
	defer func() {
		if rec := recover(); rec != nil {
			log.Printf("panic in handler for %s %s: %v", req.Method, req.Path, rec)
			if !w.wroteHeader {
				w.WriteFixedBody(500, "text/plain", []byte("500 internal server error\n"))
			}
		}
	}()
	s.cfg.Handler.ServeHTTP(w, req)
}

func shouldKeepAlive(req *Request) bool {
	connHeader := strings.ToLower(req.Header("connection"))
	tokens := strings.Split(connHeader, ",")
	has := func(want string) bool {
		for _, t := range tokens {
			if strings.TrimSpace(t) == want {
				return true
			}
		}
		return false
	}

	if req.Proto == "HTTP/1.0" {
		return has("keep-alive")
	}
	return !has("close")
}

func mapParseErrorToStatus(err error) int {
	switch {
	case errors.Is(err, ErrRequestLineTooLong), errors.Is(err, ErrHeaderTooLong), errors.Is(err, ErrTooManyHeaders):
		return 431
	case errors.Is(err, ErrSmugglingAttempt):
		return 400
	case errors.Is(err, ErrBodyTooLarge):
		return 413
	case errors.Is(err, ErrMissingHost), errors.Is(err, ErrInvalidChunkSize), errors.Is(err, ErrInvalidContentLen), errors.Is(err, ErrMalformedRequest):
		return 400
	default:
		return 400
	}
}
