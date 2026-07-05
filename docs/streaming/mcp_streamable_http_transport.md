# Model Context Protocol (MCP) Streamable HTTP Transport

Wyre includes native, first-class support for the Model Context Protocol (MCP) Streamable HTTP transport. This allows you to easily build and host high-performance tool, prompt, and context servers for AI clients (such as Claude Desktop or custom agents) using HTTP SSE transport.

## What is MCP HTTP SSE Transport?

The Model Context Protocol (MCP) defines an open standard client-server architecture for providing data, prompts, and tool definitions to LLM agents. While stdio is common for local servers, the HTTP SSE (Server-Sent Events) transport is the standard for hosting remote, distributed, or cloud-deployed MCP servers.

The HTTP SSE transport protocol works in two phases:
1. **Connection (GET `/sse`)**: The client opens a persistent SSE connection. Wyre registers a unique `sessionId`, issues a connection registration event specifying where to send subsequent client messages (e.g. `/message?sessionId=<id>`), and keeps the stream open.
2. **Execution (POST `/message?sessionId=<id>`)**: The client posts JSON-RPC 2.0 requests to the `/message` endpoint. The server processes them and pushes responses back over the active SSE stream.

## Core API

Wyre handles session tracking and handshakes via the `wyre.MCPHandler`:

- **`wyre.NewMCPHandler()`**: Initializes a new handler.
- **`mcp.OnConnect(func(session *wyre.MCPSession))`**: Callback invoked when a new client session starts.
- **`mcp.OnMessage(func(session *wyre.MCPSession, msg *wyre.JSONRPCMessage))`**: Callback invoked when a client sends a message. Use `session.Send(reply)` to write responses.
- **`mcp.HandleSSE` and `mcp.HandleMessage`**: Endpoint handlers registered on the router to manage connection and execution requests.

## Usage Example

The following code illustrates how to build a basic MCP server that registers a custom `get_weather` tool:

```go
package main

import (
    "fmt"
    "wyre"
)

func main() {
    router := wyre.NewRouter()
    mcp := wyre.NewMCPHandler()

    // 1. Listen for new client connections
    mcp.OnConnect(func(session *wyre.MCPSession) {
        fmt.Printf("MCP Session %s connected\n", session.ID)
    })

    // 2. Process incoming JSON-RPC tool/prompt queries
    mcp.OnMessage(func(session *wyre.MCPSession, msg *wyre.JSONRPCMessage) {
        fmt.Printf("Received message %s with method %q\n", msg.ID, msg.Method)

        // Handle list tools query
        if msg.Method == "tools/list" {
            result := map[string]interface{}{
                "tools": []map[string]string{
                    {
                        "name":        "get_weather",
                        "description": "Get current weather in a city",
                    },
                },
            }
            response, _ := wyre.NewJSONRPCResponse(msg.ID, result)
            _ = session.Send(response)
            return
        }

        // Handle tool execution query
        if msg.Method == "tools/call" {
            // Process tool execution logic...
            result := map[string]interface{}{
                "content": []map[string]string{
                    {
                        "type": "text",
                        "text": "Sunny, 72°F",
                    },
                },
            }
            response, _ := wyre.NewJSONRPCResponse(msg.ID, result)
            _ = session.Send(response)
            return
        }

        // Send standard Method Not Found error for unsupported queries
        errResp := wyre.NewJSONRPCError(msg.ID, -32601, "Method not found", nil)
        _ = session.Send(errResp)
    })

    // 3. Register standard MCP endpoints on the router
    router.HandleFunc("GET", "/sse", mcp.HandleSSE)
    router.HandleFunc("POST", "/message", mcp.HandleMessage)

    // 4. Start the server
    server := wyre.NewWithConfig(wyre.DefaultConfig("127.0.0.1:8080"))
    server.ListenAndServe()
}
```
