package wyre

import (
	"bufio"
	"bytes"
	"testing"
)

func FuzzParseRequest(f *testing.F) {
	// Seed some standard valid inputs
	f.Add([]byte("GET / HTTP/1.1\r\nHost: localhost\r\n\r\n"))
	f.Add([]byte("POST /users HTTP/1.1\r\nHost: localhost\r\nContent-Length: 5\r\n\r\nhello"))
	f.Add([]byte("GET /hello?name=wyre HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n"))
	f.Add([]byte("POST /chunked HTTP/1.1\r\nHost: localhost\r\nTransfer-Encoding: chunked\r\n\r\n4\r\nwiki\r\n5\r\npedia\r\n0\r\n\r\n"))

	f.Fuzz(func(t *testing.T, data []byte) {
		r := bufio.NewReader(bytes.NewReader(data))
		req, err := ParseRequest(r)
		if err == nil {
			if req == nil {
				t.Fatal("ParseRequest returned nil error but nil request")
			}
			// Access fields to ensure no nil-pointers or panics occur when accessing parsed fields
			_ = req.Method
			_ = req.Target
			_ = req.Path
			_ = req.RawQuery
			_ = req.Proto
			_ = req.Headers
			_ = req.Param("nonexistent")
			_ = req.Header("host")
			_ = req.BodyBytes()

			// Release request back to pool
			ReleaseRequest(req)
		}
	})
}
