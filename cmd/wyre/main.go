package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/crossxr/wyre/internal/server"
)

func main() {
	router := server.NewRouter()

	router.HandleFunc("GET", "/", func(w *server.ResponseWriter, r *server.Request) {
		w.WriteFixedBody(200, "text/plain", []byte("wyre is alive\n"))
	})

	router.HandleFunc("GET", "/hello", func(w *server.ResponseWriter, r *server.Request) {
		w.Header().Set("X-Powered-By", "wyre")
		w.WriteFixedBody(200, "text/plain", []byte("hello from wyre\n"))
	})

	router.HandleFunc("GET", "/hello/:name", func(w *server.ResponseWriter, r *server.Request) {
		name := r.Param("name")
		w.Header().Set("X-Powered-By", "wyre")
		w.WriteFixedBody(200, "text/plain", []byte("hello "+name+"\n"))
	})

	cfg := server.DefaultConfig(":8080")
	cfg.Handler = router

	srv := server.NewWithConfig(cfg)

	errCh := make(chan error, 1)
	go func() {
		errCh <- srv.ListenAndServe()
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-errCh:
		if err != nil {
			log.Fatalf("server error: %v", err)
		}
	case sig := <-sigCh:
		log.Printf("received %v, shutting down gracefully...", sig)
		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			log.Printf("shutdown error: %v", err)
		}
		log.Println("shutdown complete")
	}
}
