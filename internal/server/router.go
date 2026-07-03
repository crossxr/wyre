package server

import (
	"strings"
)

type Handler interface {
	ServeHTTP(w *ResponseWriter, r *Request)
}

type HandlerFunc func(w *ResponseWriter, r *Request)

func (f HandlerFunc) ServeHTTP(w *ResponseWriter, r *Request) {
	f(w, r)
}

type route struct {
	segments []string // e.g. ["users", ":id"]
	handler  Handler
}

// Router dispatches by method + path, supporting ":param" segments.
// Matching is O(routes) per request — fine at the scale a single-process
// Go server handles; revisit with a trie if route count gets large (100s+).
type Router struct {
	routes           map[string][]route // method -> routes
	notFound         Handler
	methodNotAllowed Handler
}

func NewRouter() *Router {
	return &Router{
		routes: make(map[string][]route),
		notFound: HandlerFunc(func(w *ResponseWriter, r *Request) {
			w.WriteFixedBody(404, "text/plain", []byte("404 not found\n"))
		}),
		methodNotAllowed: HandlerFunc(func(w *ResponseWriter, r *Request) {
			w.WriteFixedBody(405, "text/plain", []byte("405 method not allowed\n"))
		}),
	}
}

func (rt *Router) Handle(method, path string, h Handler) {
	method = strings.ToUpper(method)
	segs := splitPath(path)
	rt.routes[method] = append(rt.routes[method], route{segments: segs, handler: h})
}

func (rt *Router) HandleFunc(method, path string, f func(w *ResponseWriter, r *Request)) {
	rt.Handle(method, path, HandlerFunc(f))
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

func matchRoute(routeSegs, reqSegs []string) (params map[string]string, ok bool) {
	if len(routeSegs) != len(reqSegs) {
		return nil, false
	}
	params = make(map[string]string)
	for i, rs := range routeSegs {
		if strings.HasPrefix(rs, ":") {
			params[rs[1:]] = reqSegs[i]
			continue
		}
		if rs != reqSegs[i] {
			return nil, false
		}
	}
	return params, true
}

func (rt *Router) ServeHTTP(w *ResponseWriter, r *Request) {
	reqSegs := splitPath(r.Path)

	// First pass: find a path match on any method, so we can distinguish
	// 404 (no route at all) from 405 (route exists, wrong method).
	pathMatchedAnyMethod := false

	for method, routes := range rt.routes {
		for _, rt := range routes {
			params, ok := matchRoute(rt.segments, reqSegs)
			if !ok {
				continue
			}
			pathMatchedAnyMethod = true
			if method == r.Method {
				r.params = params
				rt.handler.ServeHTTP(w, r)
				return
			}
		}
	}

	if pathMatchedAnyMethod {
		rt.methodNotAllowed.ServeHTTP(w, r)
		return
	}
	rt.notFound.ServeHTTP(w, r)
}
