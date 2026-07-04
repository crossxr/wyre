import { useState, useEffect } from 'react'
import { FlickeringGrid } from "@/components/ui/flickering-grid"


const PixelUpArrow = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="29" 
    fill="none" 
    viewBox="0 0 32 39" 
    aria-hidden="true" 
    style={{ marginRight: '6px', flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', transform: 'translateY(-2px)' }}
  >
    <path fill="#0044FF" d="M19.2 0v6.4h-6.4V0zM19.2 6.4v6.4h-6.4V6.4zM25.6 6.4v6.4h-6.4V6.4zM32 12.8v6.4h-6.4v-6.4z"></path>
    <path fill="#0044FF" d="M12.8 6.4v6.4H6.4V6.4zM6.4 12.8v6.4H0v-6.4zM19.2 12.8v6.4h-6.4v-6.4z"></path>
    <path fill="#0044FF" d="M19.2 19.2v6.4h-6.4v-6.4zM19.2 32v6.4h-6.4V32z"></path>
  </svg>
)

export default function App() {
  // Simulator States
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [path, setPath] = useState<'/' | '/hello/:name' | '/json' | '/panic'>('/');
  const [paramName, setParamName] = useState<string>('agent-antigravity');
  const [jsonName, setJsonName] = useState<string>('wyre');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Terminal & Response output states
  const [clientRequest, setClientRequest] = useState<string>('');
  const [serverLog, setServerLog] = useState<string>('');
  const [serverResponse, setServerResponse] = useState<string>('');

  // Chart data state
  const [chartData, setChartData] = useState<ChartBarData[]>([
    { label: '08:00', height: 40, colorClass: 'bar-indigo' },
    { label: '10:00', height: 65, colorClass: 'bar-magenta' },
    { label: '12:00', height: 85, colorClass: 'bar-orange' },
    { label: '14:00', height: 50, colorClass: 'bar-green' },
    { label: '16:00', height: 35, colorClass: 'bar-indigo' },
    { label: '18:00', height: 75, colorClass: 'bar-magenta' },
    { label: '20:00', height: 90, colorClass: 'bar-orange' },
    { label: '22:00', height: 60, colorClass: 'bar-green' },
  ]);

  // Code Playground States
  const [activeDevTab, setActiveDevTab] = useState<'start-server' | 'middleware' | 'json-helpers'>('start-server');

  // Sync request parameters on tab changes
  useEffect(() => {
    if (path === '/') {
      setMethod('GET');
    } else if (path === '/hello/:name') {
      setMethod('GET');
    } else if (path === '/json') {
      setMethod('POST');
    } else if (path === '/panic') {
      setMethod('GET');
    }
  }, [path]);

  // Handle mock execution
  const handleExecuteRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    setIsProcessing(true);

    // 1. Generate Request Bytes
    let reqPath = path as string;
    let reqBody = '';
    if (path === '/hello/:name') {
      reqPath = `/hello/${paramName}`;
    } else if (path === '/json') {
      reqBody = JSON.stringify({ name: jsonName });
    }

    const reqLines = [
      `${method} ${reqPath} HTTP/1.1`,
      `Host: localhost:8080`,
      `User-Agent: wyre-client/1.0`,
      `Accept: */*`,
    ];
    if (reqBody) {
      reqLines.push(`Content-Type: application/json`);
      reqLines.push(`Content-Length: ${reqBody.length}`);
      reqLines.push(``);
      reqLines.push(reqBody);
    } else {
      reqLines.push(``);
    }
    setClientRequest(reqLines.join('\n'));

    // 2. Animate Server Processing
    setServerLog('Connecting to 127.0.0.1:8080...\n[wyre] Accepted connection.');
    setServerResponse('Waiting for response...');

    setTimeout(() => {
      // Server Logs
      const timeStr = new Date().toTimeString().split(' ')[0];
      const logLines = [
        `[wyre] ${timeStr} - Accepted connection from 127.0.0.1:58432`,
      ];

      if (path === '/') {
        logLines.push(`[wyre] ${timeStr} - GET / (matched static route)`);
      } else if (path === '/hello/:name') {
        logLines.push(`[wyre] ${timeStr} - GET /hello/:name (matched param: name="${paramName}")`);
      } else if (path === '/json') {
        logLines.push(`[wyre] ${timeStr} - POST /json (matched static route)`);
        logLines.push(`[wyre] ${timeStr} - ReadJSON: decoded name="${jsonName}"`);
      } else if (path === '/panic') {
        logLines.push(`[wyre] ${timeStr} - GET /panic (matched static route)`);
        logLines.push(`[wyre] ${timeStr} - PANIC recovered in handler: something went wrong`);
      }
      setServerLog(logLines.join('\n'));

      // Response bytes
      let status = '200 OK';
      let contentType = 'text/plain';
      let resHeaders: string[] = [];
      let resBody = '';

      if (path === '/') {
        resBody = 'wyre is alive\n';
        resHeaders = [
          `Content-Type: ${contentType}`,
          `Content-Length: ${resBody.length}`,
        ];
      } else if (path === '/hello/:name') {
        resBody = `hello ${paramName}\n`;
        resHeaders = [
          `Content-Type: ${contentType}`,
          `Transfer-Encoding: chunked`,
          `X-Powered-By: wyre`,
        ];
      } else if (path === '/json') {
        contentType = 'application/json';
        resBody = JSON.stringify({ greeting: `hello ${jsonName}` });
        resHeaders = [
          `Content-Type: ${contentType}`,
          `Content-Length: ${resBody.length}`,
        ];
        status = '201 Created';
      } else if (path === '/panic') {
        resBody = 'Internal Server Error';
        resHeaders = [
          `Content-Type: ${contentType}`,
          `Content-Length: ${resBody.length}`,
          `Connection: close`,
        ];
        status = '500 Internal Server Error';
      }

      const dateStr = new Date().toUTCString();
      const respLines = [
        `HTTP/1.1 ${status}`,
        `Date: ${dateStr}`,
        `Server: wyre`,
        ...resHeaders,
        ``,
      ];

      // Formulate body representation
      if (resHeaders.some(h => h.includes('chunked'))) {
        // format as chunks
        const chunks = [
          `${resBody.length.toString(16)}`,
          `${resBody.trim()}`,
          `0`,
          ``,
          ``,
        ];
        respLines.push(chunks.join('\r\n'));
      } else {
        respLines.push(resBody);
      }

      setServerResponse(respLines.join('\n'));

      // Boost analytics bar height
      setChartData(prev =>
        prev.map(bar => ({
          ...bar,
          height: Math.min(100, bar.height + Math.floor(Math.random() * 12)),
        }))
      );

      setIsProcessing(false);
    }, 1000);
  };

  const getCodeSnippet = () => {
    if (activeDevTab === 'start-server') {
      return `package main

import (
	"context"
	"log"
	"github.com/crossxr/wyre"
)

func main() {
	router := wyre.NewRouter()

	router.HandleFunc("GET", "/", func(w *wyre.ResponseWriter, r *wyre.Request) {
		w.WriteFixedBody(200, "text/plain", []byte("wyre is alive"))
	})

	cfg := wyre.DefaultConfig(":8080")
	cfg.Handler = router

	srv := wyre.NewWithConfig(cfg)
	log.Fatal(srv.ListenAndServeTLS("cert.pem", "key.pem"))
}`;
    }

    if (activeDevTab === 'middleware') {
      return `// Register robust security and metrics middlewares
router := wyre.NewRouter()

router.Use(wyre.Recovery())

router.Use(wyre.CORS(wyre.CORSConfig{
	AllowedOrigins: []string{"*"},
	AllowedMethods: []string{"GET", "POST", "OPTIONS"},
	AllowedHeaders: []string{"Content-Type", "Authorization"},
}))`;
    }

    return `// Using built-in JSON marshalling helpers
type User struct {
	Name string \`json:"name"\`
}

type Greeting struct {
	Msg string \`json:"msg"\`
}

router.HandleFunc("POST", "/json", func(w *wyre.ResponseWriter, r *wyre.Request) {
	var user User
	if err := r.ReadJSON(&user); err != nil {
		w.WriteFixedBody(400, "text/plain", []byte("bad json"))
		return
	}

	w.WriteJSON(201, Greeting{Msg: "hello " + user.Name})
})`;
  };

  return (
    <div className="blueprint-grid" style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
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
      {/* Promo Announcement Banner */}
      <div className="promo-banner" style={{ background: '#2979ff', color: '#ffffff', fontWeight: 600 }}>
        <span className="badge" style={{ background: '#ffffff', color: '#2979ff' }}>NEW</span>
        <span>Wyre HTTP Server v1.0.0 Standalone release is live!</span>
        <a href="#developers" style={{ color: '#ffffff', textDecoration: 'underline', marginLeft: '8px' }}>Get started now &rarr;</a>
      </div>

      {/* Global Header */}
      <header className="header">
        <div className="container header-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div className="logo-container">
              <span className="logo-spark" />
              <span>wyre</span>
            </div>

            <nav className="nav-links" style={{ gap: '8px' }}>
              <button className="nav-pill active">Product</button>
              <button className="nav-pill">Solutions</button>
              <button className="nav-pill">Resources</button>
              <button className="nav-pill">Enterprise</button>
              <button className="nav-pill">Customers</button>
              <button className="nav-pill">Pricing</button>
            </nav>
          </div>

          <div className="nav-cta-group" style={{ gap: '8px' }}>
            <a href="#login" className="login-link">Log in</a>
            <button className="btn-primary" style={{ backgroundColor: '#ffffff', color: '#000000', fontWeight: 600 }}>Contact sales</button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section" style={{ paddingBottom: '0px' }}>
        <div className="container">
          <div className="hero-centered">
            {/* G2 / Capterra ratings */}
            <div className="ratings-row">
              <div className="rating-item">
                <span className="stars">★★★★★</span>
                <span>4.5/5 G2</span>
              </div>
              <div className="rating-item">
                <span className="stars">★★★★★</span>
                <span>4.6/5 CAPTERRA</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="hero-headline-custom">
              Serve with sockets,<br />
              not <span className="vibes-wrapper"><img src="/hero-vibes-icon.webp" alt="frameworks cap" className="vibes-icon" /><span className="vibes-text">frameworks</span></span>
            </h1>

            {/* Description */}
            <p className="hero-description-custom">
              A zero-dependency, high-performance Go web engine. Build raw socket HTTP/1.1 and HTTPS servers with deterministic Trie routing, connection hijacking, and automatic memory pooling.
            </p>

            {/* CTAs */}
            <div className="hero-ctas">
              <button className="btn-primary-white">Contact sales</button>
              <button className="btn-secondary-dark">Try Wyre free</button>
            </div>

            {/* Company Logos Strip is removed */}
          </div>
        </div>
      </section>

      {/* Wyre Transformations & Stats Section */}
      <section className="transform-section">
        <div className="container transform-container">
          {/* Headline */}
          <h2 className="transform-headline">
            Wyre transforms <img src="/icon-bytes.png" alt="bytes icon" className="inline-icon-img" /> <span className="pixel-word">raw socket bytes</span> into agent-ready <img src="/icon-star.png" alt="star icon" className="inline-icon-img star-icon-img" /> streaming pipelines automatically, across your whole distributed stack.
          </h2>

          {/* Stats Row */}
          <div className="stats-row-custom">
            {/* Stat 1 */}
            <div className="stat-card-custom">
              <div className="stat-number-wrapper">
                <PixelUpArrow />
                <span className="stat-number-custom">10x</span>
              </div>
              <h4 className="stat-title-custom">Throughput performance</h4>
              <p className="stat-desc-custom">
                Sub-microsecond Trie routing and sync.Pool connection recycling deliver more than ten times the concurrency of traditional net/http wrappers.
              </p>
            </div>

            {/* Stat 2 */}
            <div className="stat-card-custom">
              <div className="stat-number-wrapper">
                <PixelUpArrow />
                <span className="stat-number-custom">90%</span>
              </div>
              <h4 className="stat-title-custom">Streaming memory savings</h4>
              <p className="stat-desc-custom">
                Zero-copy LLM proxying and SSE backpressure prevent buffer bloat on slow client connections, reducing active memory consumption by 90%.
              </p>
            </div>

            {/* Stat 3 */}
            <div className="stat-card-custom">
              <div className="stat-number-wrapper">
                <PixelUpArrow />
                <span className="stat-number-custom">99.99%</span>
              </div>
              <h4 className="stat-title-custom">Operational resilience</h4>
              <p className="stat-desc-custom">
                Graceful connection draining, hot config reload, and pluggable CRDT rate limiters guarantee absolute high availability under heavy burst load.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow section-eyebrow">Engine Spec</span>
            <h2 className="heading-lg section-title">Zero-dependency, high-speed sockets.</h2>
            <p className="body-text">
              Wyre handles low-level server operations directly on the operating system socket layer without relying on standard frameworks or slow helpers.
            </p>
          </div>

          <div className="features-grid">
            {/* Feature 1 */}
            <div className="card feature-card">
              <div className="feature-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="feature-title-block">
                <h3 className="heading-sm">High-Speed Trie Router</h3>
              </div>
              <p className="body-sm">
                Deterministic $O(L)$ prefix route mapping with wildcards, parameters, backtracking, and explicit routing hierarchy for zero-magic routing logic.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card feature-card">
              <div className="feature-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="feature-title-block">
                <h3 className="heading-sm">Automatic Request Pooling</h3>
              </div>
              <p className="body-sm">
                Integrates `sync.Pool` memory allocation recycling for request header lists, minimizing GC pressure and allocating near-zero heap memory.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card feature-card">
              <div className="feature-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 12h20M12 2v20" />
                </svg>
              </div>
              <div className="feature-title-block">
                <h3 className="heading-sm">Connection Hijacking</h3>
              </div>
              <p className="body-sm">
                Full socket hand-off support via standard `Hijack()` method. Handlers can take complete ownership of connections for raw protocols or WebSockets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Stats Section */}
      <section className="stats-section">
        <div className="container stats-grid">
          <div className="stat-block">
            <span className="stat-number">0 bytes</span>
            <span className="stat-label">Extra Dependencies</span>
            <span className="stat-desc">Compiled directly against the raw Go runtime.</span>
          </div>

          <div className="stat-block">
            <span className="stat-number">O(L)</span>
            <span className="stat-label">Route Search Time</span>
            <span className="stat-desc">Lookup latency depends on path depth, not route counts.</span>
          </div>

          <div className="stat-block">
            <span className="stat-number">&lt; 100ns</span>
            <span className="stat-label">Handler Dispatch Latency</span>
            <span className="stat-desc">Instant thread scheduling and zero reflection overhead.</span>
          </div>
        </div>
      </section>

      {/* Interactive Developer Sandbox section */}
      <section className="dev-section" id="developers">
        <div className="container dev-layout">
          <div className="dev-info">
            <span className="eyebrow section-eyebrow">Interactive APIs</span>
            <h2 className="heading-lg section-title">Code-first server setup.</h2>
            <p className="body-text">
              Wyre provides clean, explicit, self-documenting APIs so that human developers and AI agents can build and deploy with confidence.
            </p>

            <div className="dev-tabs">
              <div 
                onClick={() => setActiveDevTab('start-server')}
                className={`dev-tab-item ${activeDevTab === 'start-server' ? 'active' : ''}`}
              >
                <span className="dev-tab-name" style={{ fontSize: '14px', fontWeight: 'bold' }}>Start Server (TLS)</span>
              </div>

              <div 
                onClick={() => setActiveDevTab('middleware')}
                className={`dev-tab-item ${activeDevTab === 'middleware' ? 'active' : ''}`}
              >
                <span className="dev-tab-name" style={{ fontSize: '14px', fontWeight: 'bold' }}>Recovery & CORS Middleware</span>
              </div>

              <div 
                onClick={() => setActiveDevTab('json-helpers')}
                className={`dev-tab-item ${activeDevTab === 'json-helpers' ? 'active' : ''}`}
              >
                <span className="dev-tab-name" style={{ fontSize: '14px', fontWeight: 'bold' }}>JSON Marshalling Helpers</span>
              </div>
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="card dev-code-card">
            <div className="code-card-header">
              <span className="font-mono text-caption" style={{ color: 'var(--color-ash)', textTransform: 'uppercase' }}>
                GO SOURCE CODE
              </span>
            </div>

            <div className="code-block-wrapper">
              <pre className="code-block" style={{ margin: 0 }}>
                <code style={{ fontSize: '13px', lineHeight: 1.5, color: '#e0e0e0' }}>
                  {getCodeSnippet()}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <span className="footer-col-title">Platform</span>
              <div className="footer-links">
                <a href="#tls" className="footer-link">TLS termination</a>
                <a href="#chunked" className="footer-link">Chunked responses</a>
                <a href="#hijack" className="footer-link">Socket hijack</a>
                <a href="#pooling" className="footer-link">Request pooling</a>
              </div>
            </div>

            <div className="footer-col">
              <span className="footer-col-title">Framework</span>
              <div className="footer-links">
                <a href="#trie" className="footer-link">Trie router</a>
                <a href="#middleware" className="footer-link">Middlewares</a>
                <a href="#json" className="footer-link">JSON helpers</a>
                <a href="#fileserver" className="footer-link">Static FileServer</a>
              </div>
            </div>

            <div className="footer-col">
              <span className="footer-col-title">Resources</span>
              <div className="footer-links">
                <a href="#docs" className="footer-link">API Reference</a>
                <a href="#changelog" className="footer-link">Changelog</a>
                <a href="#support" className="footer-link">Support</a>
              </div>
            </div>

            <div className="footer-col">
              <span className="footer-col-title">Contact</span>
              <div className="footer-links">
                <a href="#sales" className="footer-link">Talk to Sales</a>
                <a href="#github" className="footer-link">GitHub Repo</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span className="footer-copy">
              © 2026 Wyre Engine Inc. Built on Dovetail Design Standards.
            </span>
            <div className="footer-social">
              <a href="#github">GitHub</a>
              <span>·</span>
              <a href="#discord">Discord</a>
              <span>·</span>
              <a href="#twitter">Twitter (X)</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
