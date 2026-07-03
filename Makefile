.PHONY: build run test clean

build:
	go build -o bin/oun ./cmd/oun

run:
	go run ./cmd/oun

test:
	go test -v ./...

clean:
	go clean
	rm -rf bin
