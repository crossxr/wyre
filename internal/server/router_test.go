package server

import (
	"context"
	"io"
	"net"
	"net/http"
	"testing"
)

func TestRouterTrieMatching(t *testing.T) {
	router := NewRouter()

	router.HandleFunc("GET", "/", func(w *ResponseWriter, r *Request) {
		w.WriteFixedBody(200, "text/plain", []byte("root"))
	})

	router.HandleFunc("GET", "/users", func(w *ResponseWriter, r *Request) {
		w.WriteFixedBody(200, "text/plain", []byte("users"))
	})

	router.HandleFunc("GET", "/users/settings", func(w *ResponseWriter, r *Request) {
		w.WriteFixedBody(200, "text/plain", []byte("settings"))
	})

	router.HandleFunc("GET", "/users/:id", func(w *ResponseWriter, r *Request) {
		w.WriteFixedBody(200, "text/plain", []byte("user:"+r.Param("id")))
	})

	router.HandleFunc("GET", "/users/:id/posts/:post_id", func(w *ResponseWriter, r *Request) {
		w.WriteFixedBody(200, "text/plain", []byte("user:"+r.Param("id")+" post:"+r.Param("post_id")))
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

	client := &http.Client{
		Transport: &http.Transport{
			DisableKeepAlives: true,
		},
	}

	tests := []struct {
		path           string
		expectedStatus int
		expectedBody   string
	}{
		{"/", 200, "root"},
		{"/users", 200, "users"},
		{"/users/settings", 200, "settings"},
		{"/users/123", 200, "user:123"},
		{"/users/123/posts/456", 200, "user:123 post:456"},
		{"/users/settings/posts/789", 200, "user:settings post:789"}, // Backtracks and matches param :id
		{"/unknown", 404, "404 not found\n"},
	}

	for _, tc := range tests {
		resp, err := client.Get("http://" + addr + tc.path)
		if err != nil {
			t.Errorf("failed request for %s: %v", tc.path, err)
			continue
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		if resp.StatusCode != tc.expectedStatus {
			t.Errorf("for %s: expected status %d, got %d", tc.path, tc.expectedStatus, resp.StatusCode)
		}
		if string(body) != tc.expectedBody {
			t.Errorf("for %s: expected body %q, got %q", tc.path, tc.expectedBody, body)
		}
	}
}

func TestRouterMethodNotAllowed(t *testing.T) {
	router := NewRouter()
	router.HandleFunc("GET", "/users", func(w *ResponseWriter, r *Request) {
		w.WriteFixedBody(200, "text/plain", []byte("users"))
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

	client := &http.Client{
		Transport: &http.Transport{
			DisableKeepAlives: true,
		},
	}

	resp, err := client.Post("http://"+addr+"/users", "text/plain", nil)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 405 {
		t.Errorf("expected status 405, got %d", resp.StatusCode)
	}
	body, _ := io.ReadAll(resp.Body)
	if string(body) != "405 method not allowed\n" {
		t.Errorf("expected 405 body, got %q", body)
	}
}

func TestRouterMiddleware(t *testing.T) {
	router := NewRouter()

	// Middleware 1: Appends "A" to X-Test header
	router.Use(func(next Handler) Handler {
		return HandlerFunc(func(w *ResponseWriter, r *Request) {
			w.Header().Add("X-Test", "A")
			next.ServeHTTP(w, r)
		})
	})

	// Middleware 2: Appends "B" to X-Test header
	router.Use(func(next Handler) Handler {
		return HandlerFunc(func(w *ResponseWriter, r *Request) {
			w.Header().Add("X-Test", "B")
			next.ServeHTTP(w, r)
		})
	})

	router.HandleFunc("GET", "/test", func(w *ResponseWriter, r *Request) {
		w.WriteFixedBody(200, "text/plain", []byte("ok"))
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

	client := &http.Client{
		Transport: &http.Transport{
			DisableKeepAlives: true,
		},
	}

	resp, err := client.Get("http://" + addr + "/test")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	vals := resp.Header["X-Test"]
	if len(vals) != 2 || vals[0] != "A" || vals[1] != "B" {
		t.Errorf("expected header X-Test: [A, B] in that order, got %v", vals)
	}
}

func TestRouterCompatWrapper(t *testing.T) {
	router := NewRouter()

	// Wrap standard handler
	stdHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Compat", "yes")
		w.WriteHeader(200)
		w.Write([]byte("compat body"))
	})

	router.Handle("GET", "/compat", FromHTTPHandler(stdHandler))

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

	client := &http.Client{
		Transport: &http.Transport{
			DisableKeepAlives: true,
		},
	}

	resp, err := client.Get("http://" + addr + "/compat")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}
	if resp.Header.Get("X-Compat") != "yes" {
		t.Errorf("expected X-Compat: yes, got %q", resp.Header.Get("X-Compat"))
	}
	body, _ := io.ReadAll(resp.Body)
	if string(body) != "compat body" {
		t.Errorf("expected 'compat body', got %q", body)
	}
}
