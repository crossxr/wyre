package main

import (
	"log"

	"github.com/crossxr/oun/internal/server"
)

func main() {
	srv := server.New(":8080")
	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
