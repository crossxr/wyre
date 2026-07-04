import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FlickeringGrid } from '@/components/ui/flickering-grid'

interface CodePreviewProps {
  onShowFull: () => void
}

const CodePreview: React.FC<CodePreviewProps> = ({ onShowFull }) => {
  return (
    <div 
      className="relative w-full rounded-xl bg-[#060608] border border-[#1c1c1f] overflow-hidden h-[120px] md:h-[140px] select-none group cursor-pointer"
      onClick={onShowFull}
    >
      {/* Nested blue-only flickering grid inside the preview card */}
      <FlickeringGrid
        squareSize={4}
        gridGap={6}
        flickerChance={0.35}
        color="rgb(0, 85, 255)"
        maxOpacity={0.25}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}
      />
      {/* Background overlay to keep grid contrast high */}
      <div className="absolute inset-0 bg-black/10 z-[1] pointer-events-none" />

      {/* Button styled exactly like .nav-pill */}
      <button 
        className="nav-pill absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 shadow-md select-none"
        onClick={(e) => {
          e.stopPropagation()
          onShowFull()
        }}
      >
        Show code
      </button>
    </div>
  )
}

interface GridItem {
  filename: string
  code: string
  icon: string
  title: string
  description: string
}

export const DevSandbox: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<GridItem | null>(null)
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent background scrolling when modal is active
  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedItem])

  const gridItems: GridItem[] = [
    {
      filename: 'router.go',
      code: `package main

import (
	"fmt"
	"github.com/crossxr/wyre"
)

func main() {
	router := wyre.NewRouter()

	// Dynamic segment routing with priority-based matching
	router.HandleFunc("GET", "/users/:id", func(w *wyre.ResponseWriter, r *wyre.Request) {
		id := r.Param("id")
		w.WriteFixedBody(200, "text/plain", []byte(fmt.Sprintf("User ID: %s", id)))
	})

	srv := wyre.NewWithConfig(wyre.DefaultConfig(":8080"))
	srv.cfg.Handler = router
	srv.ListenAndServe()
}`,
      icon: 'hn hn-sitemap',
      title: 'Trie Routing',
      description: 'Define routes with parameters. Wyre matches routes instantly with O(L) complexity, independent of the total route count.'
    },
    {
      filename: 'hijack.go',
      code: `package main

import (
	"github.com/crossxr/wyre"
)

func main() {
	router := wyre.NewRouter()

	router.HandleFunc("GET", "/ws", func(w *wyre.ResponseWriter, r *wyre.Request) {
		// Take control of the raw TCP socket (net.Conn)
		conn, bufrw, err := w.Hijack()
		if err != nil {
			return
		}
		defer conn.Close()

		// Write custom headers and bypass standard HTTP pipeline
		bufrw.WriteString("HTTP/1.1 101 Switching Protocols\\r\\n")
		bufrw.WriteString("Upgrade: websocket\\r\\n")
		bufrw.WriteString("Connection: Upgrade\\r\\n\\r\\n")
		bufrw.Flush()

		// Serve custom full-duplex protocol directly
		for {
			line, err := bufrw.ReadString('\\n')
			if err != nil {
				break
			}
			bufrw.WriteString("Echo: " + line)
			bufrw.Flush()
		}
	})

	srv := wyre.NewWithConfig(wyre.DefaultConfig(":8080"))
	srv.ListenAndServe()
}`,
      icon: 'hn hn-merge-solid',
      title: 'Connection Hijacking',
      description: 'Take full control of the raw TCP socket. Hijack the connection to perform custom WebSockets or raw TCP streaming without overhead.'
    },
    {
      filename: 'pool.go',
      code: `package main

import (
	"github.com/crossxr/wyre"
)

func main() {
	router := wyre.NewRouter()

	router.HandleFunc("POST", "/agents/process", func(w *wyre.ResponseWriter, r *wyre.Request) {
		// Wyre recycles Request structures, map keys, and raw buffers internally.
		// There is zero heap allocations during the request lifecycle.
		w.WriteJSON(200, map[string]string{"status": "processed"})
	})

	// Configure connection limits to optimize the sync.Pool allocation overhead
	cfg := wyre.DefaultConfig(":8080")
	cfg.MaxConnections = 10000
	cfg.Handler = router

	srv := wyre.NewWithConfig(cfg)
	srv.ListenAndServe()
}`,
      icon: 'hn hn-refresh',
      title: 'Memory Pooling',
      description: 'Recycle request and response buffers using sync.Pool. Reduce garbage collection overhead and scale with zero memory leaks.'
    },
    {
      filename: 'sse.go',
      code: `package main

import (
	"time"
	"github.com/crossxr/wyre"
)

func main() {
	router := wyre.NewRouter()

	router.HandleFunc("GET", "/events", func(w *wyre.ResponseWriter, r *wyre.Request) {
		// Upgrade standard ResponseWriter to a Server-Sent Events stream
		stream, err := wyre.NewSSEStream(w, r)
		if err != nil {
			return
		}

		ctx := r.Context()
		for i := 0; i < 50; i++ {
			select {
			case <-ctx.Done():
				// Client disconnected; abort heavy work / LLM token generation immediately
				return
			default:
			}

			// Stream token chunks. TCP socket blocks when client buffer is full,
			// automatically pacing LLM generation speed to client read rate.
			stream.Send(wyre.SSEEvent{
				ID:    "evt_1",
				Event: "token",
				Data:  []byte("Agent event payload"),
			})
			time.Sleep(100 * time.Millisecond)
		}
	})

	srv := wyre.NewWithConfig(wyre.DefaultConfig(":8080"))
	srv.ListenAndServe()
}`,
      icon: 'hn hn-rss',
      title: 'SSE Backpressure',
      description: 'Stream real-time server-sent events with active flow control. Buffer writes and throttle slow clients dynamically to prevent memory bloat.'
    },
    {
      filename: 'concurrency.go',
      code: `package main

import (
	"time"
	"github.com/crossxr/wyre"
)

func main() {
	router := wyre.NewRouter()

	// Limit to 2 concurrent calls, queue up to 10 extra requests, and timeout queued tasks at 5s
	heavySearchLimiter := wyre.ConcurrencyLimiter(2, 10, 5*time.Second)

	router.Handle("POST", "/tools/heavy-search", heavySearchLimiter(wyre.HandlerFunc(searchHandler)))

	srv := wyre.NewWithConfig(wyre.DefaultConfig(":8080"))
	srv.cfg.Handler = router
	srv.ListenAndServe()
}

func searchHandler(w *wyre.ResponseWriter, r *wyre.Request) {
	time.Sleep(1 * time.Second) // Heavy vector search
	w.WriteFixedBody(200, "text/plain", []byte("Search Results"))
}`,
      icon: 'hn hn-chart-network-solid',
      title: 'Per-Route Concurrency Limiters',
      description: 'Built-in middleware to throttle and queue request bursts. Controls highly parallel, resource-heavy tool-call traffic.'
    },
    {
      filename: 'mcp.go',
      code: `package main

import (
	"github.com/crossxr/wyre"
)

func main() {
	router := wyre.NewRouter()
	mcp := wyre.NewMCPHandler()

	// Set up handlers matching Model Context Protocol HTTP SSE specification
	mcp.OnConnect(func(sess *wyre.MCPSession) {
		println("MCP client connected:", sess.ID)
	})

	mcp.OnMessage(func(sess *wyre.MCPSession, msg *wyre.JSONRPCMessage) {
		// Handle incoming JSON-RPC calls from AI Agents
		if msg.Method == "tools/list" {
			res, _ := wyre.NewJSONRPCResponse(msg.ID, map[string]interface{}{"tools": []string{}})
			sess.Send(res)
		}
	})

	// Register endpoints conforming to standard MCP spec
	router.HandleFunc("GET", "/sse", mcp.HandleSSE)
	router.HandleFunc("POST", "/message", mcp.HandleMessage)

	srv := wyre.NewWithConfig(wyre.DefaultConfig(":8080"))
	srv.cfg.Handler = router
	srv.ListenAndServe()
}`,
      icon: 'hn hn-open-ai',
      title: 'MCP Streamable Transport',
      description: 'Model Context Protocol HTTP SSE server transport. Native JSON-RPC framing and session handling for MCP servers.'
    }
  ]

  return (
    <section 
      id="sandbox"
      className="pb-20 md:pb-28 relative z-10 overflow-hidden bg-black border-b border-[#1e1e1e]"
      style={{ paddingTop: '140px' }}
    >
      {/* Background Flickering Grid */}
      <FlickeringGrid
        squareSize={4}
        gridGap={6}
        flickerChance={0.3}
        color="rgb(103, 152, 255)"
        maxOpacity={0.12}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}
      />
      {/* Gradient overlays to fade the grid smoothly on left, top, and bottom edges */}
      <div 
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(to right, #000000 0%, #000000 40%, rgba(0, 0, 0, 0.85) 65%, rgba(0, 0, 0, 0) 100%), linear-gradient(to bottom, #000000 0%, transparent 15%, transparent 85%, #000000 100%)'
        }}
      />
      
      <div className="container relative z-10 flex flex-col gap-16">
        {/* Section Header */}
        <div className="max-w-[900px]">
          <h2 
            className="text-white text-[28px] md:text-[56px] font-semibold leading-[1.35] md:leading-[1.25] tracking-[-1px] md:tracking-[-2px] select-text"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Your <img src="/img-brain.png" className="inline-block align-middle select-none object-contain mx-1 md:mx-2 translate-y-[-2px] md:translate-y-[-4px] h-[34px] md:h-[76px] w-auto" alt="brain" /> developer-first runtime engine, secure, compliant, and ready to scale <img src="/img-globe.png" className="inline-block align-middle select-none object-contain mx-1 md:mx-2 translate-y-[-2px] md:translate-y-[-4px] h-[34px] md:h-[76px] w-auto" alt="globe" /> <span style={{ fontFamily: "'PP Mondwest', serif" }} className="font-normal text-[32px] md:text-[68px] inline-block align-baseline tracking-normal">org-wide</span>
          </h2>
          <p className="text-[#8e8e93] text-base md:text-lg leading-relaxed mt-6 max-w-[800px]">
            Wyre is built for organizations where performance, low latency, and control aren&apos;t optional. Deterministic Trie routing, connection hijacking, and automatic memory pooling are table stakes—but what sets Wyre apart is how it lets your team build highly scalable systems without trading away development velocity.
          </p>
        </div>

        {/* Accordion Stack (Starts below header) */}
        <div className="w-full flex flex-col gap-6 max-w-[900px]">
          {gridItems.map((item, index) => {
            const isActive = activeIndex === index
            return (
              <div key={index} className="flex flex-col pb-2 transition-all">
                {/* Accordion Header */}
                <div 
                  className="flex items-center gap-4 cursor-pointer select-none py-2 group"
                  onClick={() => setActiveIndex(isActive ? -1 : index)}
                >
                  <i 
                    className={`${item.icon} text-3xl md:text-5xl transition-colors duration-200`}
                    style={{ color: isActive ? '#0085ff' : '#454545' }}
                  ></i>
                  <span 
                    className="text-3xl md:text-5xl transition-colors duration-200 group-hover:text-white"
                    style={{ 
                      fontFamily: "'PP Mondwest', serif",
                      color: isActive ? '#ffffff' : '#454545'
                    }}
                  >
                    {item.title}
                  </span>
                </div>

                {/* Accordion Body */}
                {isActive && (
                  <div className="pl-10 md:pl-[64px] flex flex-col gap-4 mt-2">
                    <p className="text-[#8e8e93] text-sm md:text-base leading-relaxed max-w-[600px] font-sans">
                      {item.description}
                    </p>
                    <CodePreview onShowFull={() => setSelectedItem(item)} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Centered Code Zoom Modal */}
      {mounted && selectedItem && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm select-text"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            padding: '16px', // Padding around the whole modal on mobile
          }}
        >
          <div 
            className="w-full max-w-[1000px] max-h-[80vh] h-full rounded-2xl bg-[#0044ff] text-white flex flex-col relative shadow-2xl border border-white/10"
            style={{
              width: '100%',
              maxWidth: '1000px',
              maxHeight: '80vh',
              height: '100%',
              borderRadius: '16px',
              backgroundColor: '#0044ff',
              color: '#ffffff',
              padding: '20px', // Inner padding of the modal dialog
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            {/* Modal Header */}
            <div 
              className="flex items-center justify-between w-full select-none"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                userSelect: 'none',
                marginBottom: '16px',
              }}
            >
              <div className="flex items-center gap-3">
                <i className={selectedItem.icon} style={{ fontSize: '24px' }}></i>
                <span className="font-semibold text-lg md:text-xl tracking-tight">{selectedItem.title}</span>
              </div>
              <button 
                className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer text-lg md:text-xl"
                onClick={() => setSelectedItem(null)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                ✕
              </button>
            </div>

            {/* Code Block Area */}
            <div 
              className="flex-1 min-h-0 w-full flex items-center justify-center"
              style={{
                flex: 1,
                minHeight: 0,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '4px',
              }}
            >
              <pre 
                className="font-mono text-left select-all h-full w-full bg-black/15 rounded-xl border border-white/10 overflow-auto"
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  textAlign: 'left',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre',
                  userSelect: 'all',
                  height: '100%',
                  width: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.15)',
                  padding: '16px', // Inner padding of code block
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  overflow: 'auto',
                }}
              >
                {selectedItem.code}
              </pre>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  )
}
