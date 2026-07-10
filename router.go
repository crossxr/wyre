package wyre

import (
	"strings"
	"sync"
)

type Handler interface {
	ServeHTTP(w *ResponseWriter, r *Request)
}

type HandlerFunc func(w *ResponseWriter, r *Request)

func (f HandlerFunc) ServeHTTP(w *ResponseWriter, r *Request) {
	f(w, r)
}

type node struct {
	segment  string
	isParam  bool
	handlers map[string]Handler
	children []*node
}

func (n *node) insert(segments []string, method string, handler Handler) {
	if len(segments) == 0 {
		n.handlers[method] = handler
		return
	}

	seg := segments[0]
	isParam := strings.HasPrefix(seg, ":")
	var paramName string
	if isParam {
		paramName = seg[1:]
	} else {
		paramName = seg
	}

	var child *node
	for _, c := range n.children {
		if c.isParam == isParam && c.segment == paramName {
			child = c
			break
		}
	}

	if child == nil {
		child = &node{
			segment:  paramName,
			isParam:  isParam,
			handlers: make(map[string]Handler),
		}
		n.children = append(n.children, child)
	}

	child.insert(segments[1:], method, handler)
}

func (n *node) match(segments []string, params map[string]string) (handlers map[string]Handler, matchedParams map[string]string) {
	if len(segments) == 0 {
		if len(n.handlers) > 0 {
			return n.handlers, params
		}
		return nil, nil
	}

	seg := segments[0]

	// 1. Static match first
	for _, child := range n.children {
		if !child.isParam && child.segment == seg {
			if h, p := child.match(segments[1:], params); h != nil {
				return h, p
			}
		}
	}

	// 2. Wildcard/Param match next (backtracking)
	for _, child := range n.children {
		if child.isParam {
			newParams := make(map[string]string, len(params)+1)
			for k, v := range params {
				newParams[k] = v
			}
			newParams[child.segment] = seg
			if h, p := child.match(segments[1:], newParams); h != nil {
				return h, p
			}
		}
	}

	return nil, nil
}

type Middleware func(Handler) Handler

type RouteInfo struct {
	Path        string            `json:"path"`
	Method      string            `json:"method"`
	Description string            `json:"description,omitempty"`
	Parameters  map[string]string `json:"parameters,omitempty"`
	InputSchema interface{}       `json:"input_schema,omitempty"`
}

type RouteOption func(*RouteInfo)

func WithDescription(desc string) RouteOption {
	return func(r *RouteInfo) {
		r.Description = desc
	}
}

func WithParam(name, desc string) RouteOption {
	return func(r *RouteInfo) {
		if r.Parameters == nil {
			r.Parameters = make(map[string]string)
		}
		r.Parameters[name] = desc
	}
}

func WithInputSchema(schema interface{}) RouteOption {
	return func(r *RouteInfo) {
		r.InputSchema = schema
	}
}

type Router struct {
	root             *node
	middlewares      []Middleware
	notFound         Handler
	methodNotAllowed Handler
	routes           []RouteInfo
	disableDiscovery bool
	mu               sync.RWMutex
}

func NewRouter() *Router {
	r := &Router{
		root: &node{
			handlers: make(map[string]Handler),
		},
		notFound: HandlerFunc(func(w *ResponseWriter, r *Request) {
			w.WriteFixedBody(404, "text/plain", []byte("404 not found\n"))
		}),
		methodNotAllowed: HandlerFunc(func(w *ResponseWriter, r *Request) {
			w.WriteFixedBody(405, "text/plain", []byte("405 method not allowed\n"))
		}),
	}

	// Auto-register capabilities discovery endpoint
	r.HandleFunc("GET", "/.well-known/agent-capabilities", r.handleCapabilities)

	return r
}

func (rt *Router) Handle(method, path string, h Handler, opts ...RouteOption) {
	method = strings.ToUpper(method)
	segs := splitPath(path)
	rt.root.insert(segs, method, h)

	// Skip the discovery endpoint itself to avoid noise
	if path == "/.well-known/agent-capabilities" {
		return
	}

	info := RouteInfo{
		Path:   path,
		Method: method,
	}
	for _, opt := range opts {
		opt(&info)
	}

	rt.mu.Lock()
	rt.routes = append(rt.routes, info)
	rt.mu.Unlock()
}

func (rt *Router) HandleFunc(method, path string, f func(w *ResponseWriter, r *Request), opts ...RouteOption) {
	rt.Handle(method, path, HandlerFunc(f), opts...)
}

func (rt *Router) Use(mw Middleware) {
	rt.middlewares = append(rt.middlewares, mw)
}

func (rt *Router) NotFound(h Handler)         { rt.notFound = h }
func (rt *Router) MethodNotAllowed(h Handler) { rt.methodNotAllowed = h }

func splitPath(path string) []string {
	path = strings.Trim(path, "/")
	if path == "" {
		return []string{}
	}
	return strings.Split(path, "/")
}

func (rt *Router) ServeHTTP(w *ResponseWriter, r *Request) {
	if r.Path == "/.well-known/agent-capabilities" {
		rt.mu.RLock()
		disabled := rt.disableDiscovery
		rt.mu.RUnlock()
		if disabled {
			rt.notFound.ServeHTTP(w, r)
			return
		}
	}

	reqSegs := splitPath(r.Path)

	handlers, params := rt.root.match(reqSegs, nil)

	var finalHandler Handler

	if handlers != nil {
		if h, ok := handlers[r.Method]; ok {
			r.params = params
			finalHandler = h
		} else {
			finalHandler = rt.methodNotAllowed
		}
	} else {
		finalHandler = rt.notFound
	}

	// Wrap finalHandler in middlewares (in reverse order so the first registered runs first)
	for i := len(rt.middlewares) - 1; i >= 0; i-- {
		finalHandler = rt.middlewares[i](finalHandler)
	}

	finalHandler.ServeHTTP(w, r)
}

func (rt *Router) DisableDiscovery() {
	rt.mu.Lock()
	defer rt.mu.Unlock()
	rt.disableDiscovery = true
}

func (rt *Router) handleCapabilities(w *ResponseWriter, r *Request) {
	rt.mu.RLock()
	routes := make([]RouteInfo, len(rt.routes))
	copy(routes, rt.routes)
	rt.mu.RUnlock()

	resp := struct {
		Server    map[string]string `json:"server"`
		Endpoints []RouteInfo       `json:"endpoints"`
	}{
		Server: map[string]string{
			"name":    "wyre",
			"version": "0.1.0",
		},
		Endpoints: routes,
	}
	w.WriteJSON(200, resp)
}
