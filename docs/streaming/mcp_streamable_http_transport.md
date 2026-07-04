# Model Context Protocol (MCP) Streamable HTTP Transport

Wyre features native support for the Model Context Protocol (MCP) Streamable HTTP transport, allowing Go developers to build and host high-performance tool, prompt, and context servers for AI clients (like Claude Desktop or custom agents).

## Overview

The Model Context Protocol (MCP) defines a client-server architecture to provide context/tools to LLM agents. While stdio is common for local servers, **HTTP SSE Transport** is the standard protocol for remote or distributed deployments.

The HTTP SSE transport lifecycle consists of two parts:
1. **GET `/sse`:** The client opens a persistent SSE connection. The server responds by assigning a unique `sessionId` and pushing a relative endpoint registration event:
   ```
   event: endpoint
   data: /message?sessionId=<sessionId>
   ```
2. **POST `/message`:** The client posts a JSON-RPC 2.0 message to `/message?sessionId=<sessionId>`. The server acknowledges the receipt with `202 Accepted` immediately, processes the message asynchronously, and pushes the reply back over the established SSE connection as a `message` event.

---

## Core Components

The implementation is located in [mcp.go](file:///c:/projects/oun/mcp.go):

- **[JSONRPCMessage](file:///c:/projects/oun/mcp.go#L12):** Standard model representing request, response, and notification JSON-RPC 2.0 payloads.
- **[MCPSession](file:///c:/projects/oun/mcp.go#L59):** Represents an individual client session, containing a reference to the active `SSEStream` and exposing a thread-safe `Send(msg)` method to push JSON-RPC responses.
- **[MCPHandler](file:///c:/projects/oun/mcp.go#L77):** The central controller that registers sessions, tracks maps, handles SSE handshakes, and routes incoming messages to matching sessions.

---

## Usage Example

The following code illustrates how to build a basic MCP server using Wyre:

```go
package main

import (
	"encoding/json"
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

		if msg.Method == "tools/list" {
			// Respond with list of available tools
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
		} else {
			// Unimplemented method error
			errResp := wyre.NewJSONRPCError(msg.ID, -32601, "Method not found", nil)
			_ = session.Send(errResp)
		}
	})

	// 3. Register endpoints on the router
	router.HandleFunc("GET", "/sse", mcp.HandleSSE)
	router.HandleFunc("POST", "/message", mcp.HandleMessage)

	server := wyre.NewWithConfig(wyre.DefaultConfig("127.0.0.1:8080"))
	server.ListenAndServe()
}
```
