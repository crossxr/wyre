# Installation

Getting started with Wyre is straightforward. Since Wyre is a zero-dependency Go module, it installs quickly and doesn't pollute your project with nested dependencies.

## Prerequisites

- **Go version**: Go 1.21 or higher is recommended.
- **Environment**: Any standard OS (Linux, macOS, Windows).

## Adding Wyre to Your Project

First, initialize your Go module if you haven't already:

```bash
go mod init my-awesome-app
```

Then, add Wyre as a dependency to your module:

```bash
go get github.com/crossxr/wyre
```

This will download the Wyre library and add it to your `go.mod` file.

## Basic Usage

Create a file named `main.go` and paste the following code to run your first Wyre-powered HTTP server:

```go
package main

import (
    "log"
    "wyre"
)

func main() {
    // Create the router
    router := wyre.NewRouter()

    // Define a basic route
    router.HandleFunc("GET", "/", func(w *wyre.ResponseWriter, r *wyre.Request) {
        w.WriteFixedBody(200, "text/plain", []byte("Welcome to Wyre!"))
    })

    // Start listening and serving
    log.Println("Starting Wyre server on :8080...")
    server := wyre.NewWithConfig(wyre.DefaultConfig("127.0.0.1:8080"))
    if err := server.ListenAndServe(); err != nil {
        log.Fatalf("Server failed: %v", err)
    }
}
```

Run the application:

```bash
go run main.go
```

Verify that it works:

```bash
curl http://127.0.0.1:8080/
# Output: Welcome to Wyre!
```
