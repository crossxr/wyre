# Agent Capabilities & Route Discovery

Wyre is designed to serve AI agents and LLM tools natively. To facilitate autonomous execution, Wyre provides an auto-discovery endpoint that exposes your API routes, parameters, and input schemas in a structured, machine-parseable JSON format.

## Capability Discovery Endpoint

By default, every Wyre router registers a special endpoint:
`GET /.well-known/agent-capabilities`

This endpoint returns a JSON payload detailing all active endpoints, their parameters, and descriptions.

```json
{
  "server": {
    "name": "wyre",
    "version": "0.1.0"
  },
  "endpoints": [
    {
      "path": "/users/:id",
      "method": "GET",
      "description": "Fetch a user profile by ID",
      "parameters": {
        "id": "The unique identifier of the user"
      }
    }
  ]
}
```

## Registering Route Metadata

To make your routes discoverable, pass metadata options when calling `Handle` or `HandleFunc`. Wyre provides simple, composable `RouteOption` builders:

- `WithDescription(desc string)`: Explains what the route does.
- `WithParam(name, desc string)`: Documents a path or query parameter.
- `WithInputSchema(schema interface{})`: Defines the expected input schema (such as a structural JSON schema representation or sample struct).

### Example Setup

```go
package main

import (
    "wyre"
)

type SearchRequest struct {
    Query string `json:"query"`
    Limit int    `json:"limit"`
}

func main() {
    router := wyre.NewRouter()

    // Register a route with description and parameters
    router.HandleFunc("GET", "/users/:id", getUserHandler,
        wyre.WithDescription("Retrieve a user's details by their database ID"),
        wyre.WithParam("id", "The database ID of the user"),
    )

    // Register a route with a structured input schema for JSON requests
    router.HandleFunc("POST", "/search", searchHandler,
        wyre.WithDescription("Search the knowledge base"),
        wyre.WithInputSchema(SearchRequest{
            Query: "search query string",
            Limit: 10,
        }),
    )

    server := wyre.NewWithConfig(wyre.DefaultConfig(":8080"))
    server.ListenAndServe()
}
```

## Disabling Discovery

If you do not want to expose the capabilities discovery endpoint to clients (for example, in production environments where strict access controls are needed), you can disable it:

```go
router := wyre.NewRouter()
router.DisableDiscovery()
```

When disabled, requests to `GET /.well-known/agent-capabilities` will yield a `404 Not Found` response.
