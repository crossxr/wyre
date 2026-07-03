package wyre

import (
	"log"
	"runtime/debug"
	"strings"
)

type CORSConfig struct {
	AllowedOrigins []string
	AllowedMethods []string
	AllowedHeaders []string
}

// CORS returns a middleware that sets Cross-Origin Resource Sharing headers.
func CORS(cfg CORSConfig) Middleware {
	origins := strings.Join(cfg.AllowedOrigins, ", ")
	methods := strings.Join(cfg.AllowedMethods, ", ")
	headers := strings.Join(cfg.AllowedHeaders, ", ")

	return func(next Handler) Handler {
		return HandlerFunc(func(w *ResponseWriter, r *Request) {
			w.Header().Set("Access-Control-Allow-Origin", origins)
			w.Header().Set("Access-Control-Allow-Methods", methods)
			w.Header().Set("Access-Control-Allow-Headers", headers)

			if r.Method == "OPTIONS" {
				w.WriteHeader(204)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// Recovery returns a middleware that recovers from panics and logs stack traces.
func Recovery() Middleware {
	return func(next Handler) Handler {
		return HandlerFunc(func(w *ResponseWriter, r *Request) {
			defer func() {
				if rec := recover(); rec != nil {
					log.Printf("PANIC recovered in handler: %v\nStack trace:\n%s", rec, debug.Stack())
					if !w.wroteHeader {
						w.WriteFixedBody(500, "text/plain", []byte("Internal Server Error"))
					}
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}
