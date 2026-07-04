package wyre

import (
	"bytes"
	"io"
	"net/http"
)

type stdResponseWriterWrapper struct {
	w *ResponseWriter
}

func (s *stdResponseWriterWrapper) Header() http.Header {
	return http.Header(s.w.Header())
}

func (s *stdResponseWriterWrapper) Write(p []byte) (int, error) {
	return s.w.Write(p)
}

func (s *stdResponseWriterWrapper) WriteHeader(statusCode int) {
	s.w.WriteHeader(statusCode)
}

var _ http.ResponseWriter = (*stdResponseWriterWrapper)(nil)

// FromHTTPHandler wraps a standard http.Handler to be used as a wyre Handler.
func FromHTTPHandler(h http.Handler) Handler {
	return HandlerFunc(func(w *ResponseWriter, r *Request) {
		stdW := &stdResponseWriterWrapper{w: w}

		var body io.Reader
		if len(r.rawBody) > 0 {
			body = bytes.NewReader(r.rawBody)
		} else {
			body = http_EmptyReader{}
		}

		stdReq, err := http.NewRequestWithContext(r.Context(), r.Method, r.Target, body)
		if err != nil {
			w.WriteFixedBody(500, "text/plain", []byte("internal server error"))
			return
		}
		stdReq.RemoteAddr = r.RemoteAddr
		stdReq.Header = http.Header(r.Headers)

		h.ServeHTTP(stdW, stdReq)
	})
}
