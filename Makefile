.PHONY: build run test clean

build:
	go build -o bin/wyre ./cmd/wyre

run:
	go run ./cmd/wyre

test:
	go test -v ./...

clean:
	go clean
	rm -rf bin
