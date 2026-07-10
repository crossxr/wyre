package wyre

import (
	"time"
)

// ErrorContract represents a machine-parseable structured error response.
// This allows AI agents to understand exactly why a request failed, whether
// they can retry, and how long they should wait before doing so.
type ErrorContract struct {
	Code          string            `json:"code"`
	Message       string            `json:"message"`
	Retryable     bool              `json:"retryable"`
	BackoffHintMs int64             `json:"backoff_hint_ms,omitempty"`
	Details       map[string]string `json:"details,omitempty"`
}

// WriteErrorContract writes a structured JSON error response.
func (w *ResponseWriter) WriteErrorContract(statusCode int, code string, msg string, retryable bool, backoffHint time.Duration) error {
	w.header.Set("Content-Type", "application/json")

	var backoffMs int64
	if backoffHint > 0 {
		backoffMs = int64(backoffHint / time.Millisecond)
	}

	contract := ErrorContract{
		Code:          code,
		Message:       msg,
		Retryable:     retryable,
		BackoffHintMs: backoffMs,
	}

	return w.WriteJSON(statusCode, contract)
}
