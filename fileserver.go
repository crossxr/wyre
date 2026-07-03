package wyre

import (
	"io"
	"mime"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// FileServer returns a handler that serves static files from the given root directory.
func FileServer(root string) Handler {
	return HandlerFunc(func(w *ResponseWriter, r *Request) {
		cleanPath := filepath.Clean(r.Path)
		relPath := strings.TrimPrefix(cleanPath, "/")
		fullPath := filepath.Join(root, relPath)

		absRoot, err := filepath.Abs(root)
		if err != nil {
			w.WriteFixedBody(500, "text/plain", []byte("Internal Server Error"))
			return
		}
		absPath, err := filepath.Abs(fullPath)
		if err != nil {
			w.WriteFixedBody(404, "text/plain", []byte("Not Found"))
			return
		}
		if !strings.HasPrefix(absPath, absRoot) {
			w.WriteFixedBody(403, "text/plain", []byte("Forbidden"))
			return
		}

		info, err := os.Stat(absPath)
		if err != nil {
			if os.IsNotExist(err) {
				w.WriteFixedBody(404, "text/plain", []byte("Not Found"))
			} else {
				w.WriteFixedBody(500, "text/plain", []byte("Internal Server Error"))
			}
			return
		}

		if info.IsDir() {
			w.WriteFixedBody(403, "text/plain", []byte("Directory listing forbidden"))
			return
		}

		file, err := os.Open(absPath)
		if err != nil {
			w.WriteFixedBody(500, "text/plain", []byte("Internal Server Error"))
			return
		}
		defer file.Close()

		ext := filepath.Ext(absPath)
		contentType := mime.TypeByExtension(ext)
		if contentType == "" {
			contentType = "application/octet-stream"
		}

		w.Header().Set("Content-Type", contentType)
		w.Header().Set("Content-Length", strconv.FormatInt(info.Size(), 10))

		if err := w.WriteHeader(200); err != nil {
			return
		}

		io.Copy(w, file)
	})
}
