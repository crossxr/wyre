package wyre

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
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

func TestJSONHelpers(t *testing.T) {
	router := NewRouter()
	type userReq struct {
		Name string `json:"name"`
	}
	type userResp struct {
		Greeting string `json:"greeting"`
	}

	router.HandleFunc("POST", "/json", func(w *ResponseWriter, r *Request) {
		var req userReq
		if err := r.ReadJSON(&req); err != nil {
			w.WriteFixedBody(400, "text/plain", []byte("bad request"))
			return
		}
		w.WriteJSON(201, userResp{Greeting: "hello " + req.Name})
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

	jsonBytes, _ := json.Marshal(userReq{Name: "wyre"})
	resp, err := client.Post("http://"+addr+"/json", "application/json", bytes.NewReader(jsonBytes))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 201 {
		t.Errorf("expected 201, got %d", resp.StatusCode)
	}
	if !strings.Contains(resp.Header.Get("Content-Type"), "application/json") {
		t.Errorf("expected Content-Type application/json, got %q", resp.Header.Get("Content-Type"))
	}
	var res userResp
	json.NewDecoder(resp.Body).Decode(&res)
	if res.Greeting != "hello wyre" {
		t.Errorf("expected greeting 'hello wyre', got %q", res.Greeting)
	}
}

func TestFileServer(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "static-*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpDir)

	filePath := filepath.Join(tmpDir, "static", "test.txt")
	os.MkdirAll(filepath.Dir(filePath), 0755)
	os.WriteFile(filePath, []byte("static file content"), 0644)

	router := NewRouter()
	router.Handle("GET", "/static/:filename", FileServer(tmpDir))

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

	resp, err := client.Get("http://" + addr + "/static/test.txt")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}
	body, _ := io.ReadAll(resp.Body)
	if string(body) != "static file content" {
		t.Errorf("expected 'static file content', got %q", body)
	}
}

func TestCORSAndRecoveryMiddlewares(t *testing.T) {
	router := NewRouter()

	router.Use(Recovery())
	router.Use(CORS(CORSConfig{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST"},
		AllowedHeaders: []string{"Content-Type"},
	}))

	router.HandleFunc("GET", "/panic", func(w *ResponseWriter, r *Request) {
		panic("something went wrong")
	})

	router.HandleFunc("GET", "/ok", func(w *ResponseWriter, r *Request) {
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

	// 1. Test CORS
	resp, err := client.Get("http://" + addr + "/ok")
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.Header.Get("Access-Control-Allow-Origin") != "*" {
		t.Errorf("expected Access-Control-Allow-Origin: *, got %q", resp.Header.Get("Access-Control-Allow-Origin"))
	}

	// 2. Test Recovery
	resp2, err := client.Get("http://" + addr + "/panic")
	if err != nil {
		t.Fatal(err)
	}
	defer resp2.Body.Close()
	if resp2.StatusCode != 500 {
		t.Errorf("expected 500 on panic, got %d", resp2.StatusCode)
	}

	var errContract ErrorContract
	if err := json.NewDecoder(resp2.Body).Decode(&errContract); err != nil {
		t.Errorf("failed to decode structured error contract from panic recovery: %v", err)
	} else {
		if errContract.Code != "internal_server_error" {
			t.Errorf("expected error code 'internal_server_error', got %q", errContract.Code)
		}
		if errContract.Retryable {
			t.Errorf("expected panic error to not be retryable")
		}
	}
}

func TestRouterCapabilityDiscovery(t *testing.T) {
	router := NewRouter()

	router.HandleFunc("GET", "/users/:id", func(w *ResponseWriter, r *Request) {},
		WithDescription("Retrieve a user profile"),
		WithParam("id", "The ID of the user"),
	)

	type QueryBody struct {
		Term string `json:"term"`
	}

	router.HandleFunc("POST", "/search", func(w *ResponseWriter, r *Request) {},
		WithDescription("Search entities"),
		WithInputSchema(QueryBody{Term: "test"}),
	)

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

	resp, err := client.Get("http://" + addr + "/.well-known/agent-capabilities")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	contentType := resp.Header.Get("Content-Type")
	if !strings.Contains(contentType, "application/json") {
		t.Errorf("expected application/json content type, got %q", contentType)
	}

	var result struct {
		Server    map[string]string `json:"server"`
		Endpoints []RouteInfo       `json:"endpoints"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		t.Fatal(err)
	}

	if result.Server["name"] != "wyre" {
		t.Errorf("expected server name 'wyre', got %q", result.Server["name"])
	}

	if len(result.Endpoints) != 2 {
		t.Fatalf("expected 2 endpoints, got %d", len(result.Endpoints))
	}

	foundUsers := false
	foundSearch := false

	for _, ep := range result.Endpoints {
		if ep.Path == "/users/:id" {
			foundUsers = true
			if ep.Method != "GET" {
				t.Errorf("expected GET method, got %q", ep.Method)
			}
			if ep.Description != "Retrieve a user profile" {
				t.Errorf("expected description, got %q", ep.Description)
			}
			if ep.Parameters["id"] != "The ID of the user" {
				t.Errorf("expected parameter description, got %q", ep.Parameters["id"])
			}
		} else if ep.Path == "/search" {
			foundSearch = true
			if ep.Method != "POST" {
				t.Errorf("expected POST method, got %q", ep.Method)
			}
			if ep.Description != "Search entities" {
				t.Errorf("expected description, got %q", ep.Description)
			}
			schemaMap, ok := ep.InputSchema.(map[string]interface{})
			if !ok {
				t.Errorf("expected input schema to be mapped, got %T", ep.InputSchema)
			} else if schemaMap["term"] != "test" {
				t.Errorf("expected schema field 'term' = 'test', got %v", schemaMap["term"])
			}
		}
	}

	if !foundUsers || !foundSearch {
		t.Errorf("did not find expected endpoints: users=%t, search=%t", foundUsers, foundSearch)
	}
}

func TestRouterDisableDiscovery(t *testing.T) {
	router := NewRouter()
	router.DisableDiscovery()

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

	resp, err := client.Get("http://" + addr + "/.well-known/agent-capabilities")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 404 {
		t.Errorf("expected status 404, got %d", resp.StatusCode)
	}
}

