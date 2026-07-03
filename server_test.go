package wyre

import (
	"bufio"
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"io"
	"math/big"
	"net"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"
)

func generateTempCert(t *testing.T) (certFile, keyFile string, cleanup func()) {
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}

	template := x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject: pkix.Name{
			Organization: []string{"Wyre Test"},
		},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().Add(1 * time.Hour),
		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
		IPAddresses:           []net.IP{net.ParseIP("127.0.0.1")},
	}

	derBytes, err := x509.CreateCertificate(rand.Reader, &template, &template, &priv.PublicKey, priv)
	if err != nil {
		t.Fatal(err)
	}

	certOut, err := os.CreateTemp("", "cert*.pem")
	if err != nil {
		t.Fatal(err)
	}
	defer certOut.Close()
	pem.Encode(certOut, &pem.Block{Type: "CERTIFICATE", Bytes: derBytes})

	keyOut, err := os.CreateTemp("", "key*.pem")
	if err != nil {
		t.Fatal(err)
	}
	defer keyOut.Close()
	privBytes, err := x509.MarshalPKCS8PrivateKey(priv)
	if err != nil {
		t.Fatal(err)
	}
	pem.Encode(keyOut, &pem.Block{Type: "PRIVATE KEY", Bytes: privBytes})

	return certOut.Name(), keyOut.Name(), func() {
		os.Remove(certOut.Name())
		os.Remove(keyOut.Name())
	}
}

func TestServerBasicAndChunked(t *testing.T) {
	router := NewRouter()
	router.HandleFunc("GET", "/fixed", func(w *ResponseWriter, r *Request) {
		w.WriteFixedBody(200, "text/plain", []byte("hello fixed"))
	})

	router.HandleFunc("GET", "/chunked", func(w *ResponseWriter, r *Request) {
		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte("chunk1 "))
		w.Write([]byte("chunk2"))
	})

	cfg := DefaultConfig("127.0.0.1:0")
	cfg.Handler = router
	srv := NewWithConfig(cfg)

	// Start listener manually to capture the dynamic port
	ln, err := net.Listen("tcp", cfg.Addr)
	if err != nil {
		t.Fatal(err)
	}
	srv.ln = ln
	addr := ln.Addr().String()

	errCh := make(chan error, 1)
	go func() {
		errCh <- srv.serve()
	}()

	defer srv.Shutdown(context.Background())

	client := &http.Client{
		Transport: &http.Transport{
			DisableKeepAlives: true,
		},
	}

	// 1. Test Fixed Response
	resp, err := client.Get("http://" + addr + "/fixed")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}
	body, _ := io.ReadAll(resp.Body)
	if string(body) != "hello fixed" {
		t.Errorf("expected 'hello fixed', got %q", body)
	}
	if resp.ContentLength != int64(len("hello fixed")) {
		t.Errorf("expected Content-Length %d, got %d", len("hello fixed"), resp.ContentLength)
	}

	// 2. Test Chunked Response
	resp2, err := client.Get("http://" + addr + "/chunked")
	if err != nil {
		t.Fatal(err)
	}
	defer resp2.Body.Close()

	if resp2.StatusCode != 200 {
		t.Errorf("expected 200, got %d", resp2.StatusCode)
	}
	foundChunked := false
	for _, te := range resp2.TransferEncoding {
		if te == "chunked" {
			foundChunked = true
			break
		}
	}
	if !foundChunked {
		t.Errorf("expected Transfer-Encoding: chunked, got %v", resp2.TransferEncoding)
	}
	body2, _ := io.ReadAll(resp2.Body)
	if string(body2) != "chunk1 chunk2" {
		t.Errorf("expected 'chunk1 chunk2', got %q", body2)
	}
}

func TestServerHijack(t *testing.T) {
	router := NewRouter()
	router.HandleFunc("GET", "/hijack", func(w *ResponseWriter, r *Request) {
		hj, ok := interface{}(w).(Hijacker)
		if !ok {
			w.WriteFixedBody(500, "text/plain", []byte("hijack not supported"))
			return
		}
		conn, rw, err := hj.Hijack()
		if err != nil {
			return
		}
		defer conn.Close()

		// Write custom raw data directly
		rw.WriteString("HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\n\r\nraw-hijacked-data")
		rw.Flush()
	})

	cfg := DefaultConfig("127.0.0.1:0")
	cfg.Handler = router
	srv := NewWithConfig(cfg)

	ln, err := net.Listen("tcp", cfg.Addr)
	if err != nil {
		t.Fatal(err)
	}
	srv.ln = ln
	addr := ln.Addr().String()

	go srv.serve()
	defer srv.Shutdown(context.Background())

	conn, err := net.Dial("tcp", addr)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()

	// Send raw request
	fmt.Fprintf(conn, "GET /hijack HTTP/1.1\r\nHosT: localhost\r\n\r\n")

	// Read response
	reader := bufio.NewReader(conn)
	line, err := reader.ReadString('\n')
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(line, "101 Switching Protocols") {
		t.Fatalf("expected 101 Switching Protocols, got %q", line)
	}

	// Skip headers
	for {
		l, err := reader.ReadString('\n')
		if err != nil {
			t.Fatal(err)
		}
		if l == "\r\n" {
			break
		}
	}

	buf := make([]byte, 17)
	_, err = io.ReadFull(reader, buf)
	if err != nil {
		t.Fatal(err)
	}
	if string(buf) != "raw-hijacked-data" {
		t.Errorf("expected 'raw-hijacked-data', got %q", buf)
	}
}

func TestServerTLS(t *testing.T) {
	certFile, keyFile, cleanup := generateTempCert(t)
	defer cleanup()

	router := NewRouter()
	router.HandleFunc("GET", "/secure", func(w *ResponseWriter, r *Request) {
		w.WriteFixedBody(200, "text/plain", []byte("secure hello"))
	})

	cfg := DefaultConfig("127.0.0.1:0")
	cfg.Handler = router
	srv := NewWithConfig(cfg)

	// Since ListenAndServeTLS calls net.Listen, we start it directly but we need to find the port.
	// We can start it using a channel to signal when srv.ln is created, or just run ListenAndServeTLS in a goroutine and wait.
	// Actually, let's just listen ourselves and wrap it, or let ListenAndServeTLS run on a fixed port.
	// To avoid port collisions, we can start it using 127.0.0.1:0, but how do we get the port?
	// We can modify srv.cfg.Addr in ListenAndServeTLS? No, net.Listen("tcp", s.cfg.Addr) resolves :0 and assigns it to s.ln.
	// So we can poll s.ln until it is not nil!
	errCh := make(chan error, 1)
	go func() {
		errCh <- srv.ListenAndServeTLS(certFile, keyFile)
	}()

	// Wait for srv.ln to be populated
	var addr string
	for i := 0; i < 50; i++ {
		srv.mu.Lock()
		ln := srv.ln
		srv.mu.Unlock()
		if ln != nil {
			addr = ln.Addr().String()
			break
		}
		time.Sleep(50 * time.Millisecond)
	}

	if addr == "" {
		t.Fatal("timeout waiting for listener to start")
	}

	// Create a client that trusts the self-signed cert
	tr := &http.Transport{
		TLSClientConfig:   &tls.Config{InsecureSkipVerify: true},
		DisableKeepAlives: true,
	}
	client := &http.Client{Transport: tr}

	defer srv.Shutdown(context.Background())

	resp, err := client.Get("https://" + addr + "/secure")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}
	body, _ := io.ReadAll(resp.Body)
	if string(body) != "secure hello" {
		t.Errorf("expected 'secure hello', got %q", body)
	}
}
