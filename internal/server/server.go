package server

import (
	"bufio"
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
		return
	}
	req.RemoteAddr = conn.RemoteAddr().String()

	log.Printf("%s %s %s (%d headers)", req.Method, req.Target, req.Proto, len(req.Headers))
}