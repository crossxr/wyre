package server

import (
	"bufio"
	"io"
	"log"
	"net"
)

type Server struct {
	addr string
}

func New(addr string) *Server {
	return &Server{addr: addr}
}

func (s *Server) ListenAndServe() error {
	ln, err := net.Listen("tcp", s.addr)
	if err != nil {
		return err
	}
	defer ln.Close()

	log.Printf("oun listening on %s", s.addr)

	for {
		conn, err := ln.Accept()
		if err != nil {
			log.Printf("accept error: %v", err)
			continue
		}
		go s.handleConn(conn)
	}
}

func (s *Server) handleConn(conn net.Conn) {
	defer conn.Close()
	reader := bufio.NewReader(conn)

	req, err := ParseRequest(reader)
	if err != nil {
		log.Printf("parse error from %s: %v", conn.RemoteAddr(), err)
		WriteError(conn, mapParseErrorToStatus(err))
		return
	}
	req.RemoteAddr = conn.RemoteAddr().String()

	bodyBytes, err := io.ReadAll(req.Body)
	if err != nil {
		log.Printf("body read error from %s: %v", conn.RemoteAddr(), err)
		WriteError(conn, 400)
		return
	}

	log.Printf("%s %s %s (%d headers, %d body bytes)",
		req.Method, req.Target, req.Proto, len(req.Headers), len(bodyBytes))

	// Part 5 wires real routing/handlers in here. For now: echo a fixed 200.
	bw := bufio.NewWriter(conn)
	w := newResponseWriter(conn, bw)
	w.WriteFixedBody(200, "text/plain", []byte("oun: request received\n"))
	w.Flush()
}

func mapParseErrorToStatus(err error) int {
	switch err {
	case ErrRequestLineTooLong, ErrHeaderTooLong:
		return 431
	case ErrTooManyHeaders:
		return 431
	case ErrSmugglingAttempt:
		return 400
	case ErrBodyTooLarge:
		return 413
	case ErrInvalidChunkSize, ErrInvalidContentLen, ErrMalformedRequest:
		return 400
	default:
		return 400
	}
}
