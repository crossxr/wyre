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

const EnterKeycapSvg = () => (
  <svg
    className="inline-icon-img"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{
      width: '76px',
      height: '76px',
      display: 'inline-block',
      verticalAlign: 'middle',
      margin: '0 8px 0 8px',
      transform: 'translateY(-4px)'
    }}
  >
    <rect x="2" y="2" width="20" height="20" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="2" />
    <rect x="4" y="4" width="16" height="13" rx="2" fill="#f4f4f5" />
    <text x="12" y="12" fill="#71717a" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">ENTER</text>
    <path d="M16 14h-6v-3" stroke="#71717a" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const BlueLightningSvg = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{
      color: '#2979ff',
      width: '64px',
      height: '64px',
      display: 'inline-block',
      verticalAlign: 'middle',
      margin: '0 6px 0 6px',
      transform: 'translateY(-4px)'
    }}
  >
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
)

const RouterMockup = () => (
  <div className="visual-mockup-router" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px', fontFamily: 'var(--font-jetbrains-mono)' }}>
    {/* Route Segments Path Highlight */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', background: '#161618', padding: '8px 16px', borderRadius: '6px', border: '1px solid #27272a' }}>
      <span style={{ color: '#888' }}>GET</span>
      <span style={{ color: '#fff' }}>/users/</span>
      <span style={{ color: '#6798ff', fontWeight: 'bold' }}>:id</span>
      <span style={{ color: '#888' }}>&rarr;</span>
      <span style={{ color: '#67ffb1' }}>Match</span>
    </div>

    {/* Node Tree Graphic */}
    <div style={{ position: 'relative', width: '280px', height: '100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {/* Root Node */}
      <div style={{ zIndex: 2, background: '#1e1e1e', border: '1px solid #333', color: '#888', padding: '6px 12px', borderRadius: '4px', fontSize: '11px' }}>
        /
      </div>

      {/* SVG Connecting Lines */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
        <path d="M40 50 L110 25" stroke="#333" strokeWidth="2" fill="none" />
        <path d="M40 50 L110 75" stroke="#6798ff" strokeWidth="2" strokeDasharray="4" fill="none" />
        <path d="M190 75 L240 75" stroke="#6798ff" strokeWidth="2" fill="none" />
      </svg>

      {/* Level 1 Nodes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', zIndex: 2 }}>
        <div style={{ background: '#1e1e1e', border: '1px solid #333', color: '#888', padding: '6px 12px', borderRadius: '4px', fontSize: '11px' }}>
          posts
        </div>
        <div style={{ background: '#1e1e1e', border: '1px solid #6798ff', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', boxShadow: '0 0 10px rgba(103, 152, 255, 0.15)' }}>
          users
        </div>
      </div>

      {/* Level 2 Parameter Node */}
      <div style={{ zIndex: 2 }}>
        <div style={{ background: 'rgba(103, 152, 255, 0.1)', border: '1px dashed #6798ff', color: '#6798ff', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
          :id (Param)
        </div>
      </div>
    </div>
  </div>
);

const MemoryPoolMockup = () => (
  <div className="visual-mockup-memory" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px', fontFamily: 'var(--font-jetbrains-mono)', padding: '0 24px' }}>
    {/* Allocation Headers */}
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888' }}>
      <span>BUFFER ALLOCATION (sync.Pool)</span>
      <span style={{ color: '#67ffb1', fontWeight: 'bold' }}>ACTIVE RECYCLING</span>
    </div>

    {/* Progress Bar 1 */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
        <span style={{ color: '#aaa' }}>GC Heap Allocations</span>
        <span style={{ color: '#ff67b1' }}>0 bytes (Zero-Alloc)</span>
      </div>
      <div style={{ width: '100%', height: '8px', background: '#161618', borderRadius: '4px', border: '1px solid #27272a', overflow: 'hidden' }}>
        <div style={{ width: '2%', height: '100%', background: '#ff67b1' }} />
      </div>
    </div>

    {/* Progress Bar 2 */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
        <span style={{ color: '#aaa' }}>Recycled Headers & Buffers</span>
        <span style={{ color: '#67ffb1' }}>100% Recycled</span>
      </div>
      <div style={{ width: '100%', height: '8px', background: '#161618', borderRadius: '4px', border: '1px solid #27272a', overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '100%', background: '#67ffb1', boxShadow: '0 0 8px rgba(103, 255, 177, 0.3)' }} />
      </div>
    </div>

    {/* Pool Stats Footer */}
    <div style={{ display: 'flex', gap: '16px', fontSize: '11px', borderTop: '1px solid #1e1e1e', paddingTop: '12px' }}>
      <div>
        <span style={{ color: '#888', display: 'block' }}>POOL SIZE</span>
        <span style={{ color: '#fff', fontWeight: 'bold' }}>4,096 Items</span>
      </div>
      <div>
        <span style={{ color: '#888', display: 'block' }}>RECYCLE LATENCY</span>
        <span style={{ color: '#fff', fontWeight: 'bold' }}>&lt; 5ns</span>
      </div>
    </div>
  </div>
);

const SocketArchMockup = () => (
  <div className="visual-mockup-socket" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px', fontFamily: 'var(--font-jetbrains-mono)', padding: '0 24px', fontSize: '11px' }}>
    {/* Connection Monitor Headers */}
    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', borderBottom: '1px solid #1e1e1e', paddingBottom: '8px' }}>
      <span>TCP LISTENER [SOCKET_LAYER]</span>
      <span style={{ color: '#6798ff' }}>ADDR: :8080</span>
    </div>

    {/* Mock Console Logs */}
    <div style={{ background: '#161618', padding: '12px', borderRadius: '6px', border: '1px solid #27272a', display: 'flex', flexDirection: 'column', gap: '6px', color: '#aaa', fontSize: '10px', textAlign: 'left' }}>
      <div><span style={{ color: '#6798ff' }}>[INFO]</span> binding raw tcp listener on :8080</div>
      <div><span style={{ color: '#67ffb1' }}>[CONN]</span> accepted remote_addr: 192.168.1.42:50422</div>
      <div><span style={{ color: '#67ffb1' }}>[CONN]</span> dispatching tcp stream to serve()</div>
      <div style={{ color: '#ffb167' }}><span style={{ color: '#6798ff' }}>[SHUT]</span> listener closed, waiting for draining...</div>
    </div>

    {/* Connection limits status */}
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
      <span style={{ color: '#888' }}>CONCURRENT LIMIT: 10,000</span>
      <span style={{ color: '#67ffb1' }}>GRACEFUL SHUTDOWN: READY</span>
    </div>
  </div>
);

const ConnectionHijackMockup = () => (
  <div className="visual-mockup-hijack" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px', fontFamily: 'var(--font-jetbrains-mono)', padding: '0 24px', fontSize: '11px' }}>
    {/* Protocol Handshake headers */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#161618', padding: '10px 14px', borderRadius: '6px', border: '1px solid #27272a', textAlign: 'left' }}>
      <div style={{ color: '#6798ff', fontWeight: 'bold' }}>HTTP/1.1 101 Switching Protocols</div>
      <div style={{ color: '#888' }}>Upgrade: websocket</div>
      <div style={{ color: '#888' }}>Connection: Upgrade</div>
    </div>

    {/* Flow Arrow Graphic */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px' }}>
      <span style={{ background: '#1e1e1e', padding: '4px 8px', borderRadius: '4px', color: '#aaa', border: '1px solid #333' }}>Wyre Router</span>
      <span style={{ color: '#67ffb1', fontWeight: 'bold', fontSize: '12px' }}>&mdash;&mdash; Hijack() &mdash;&rarr;</span>
      <span style={{ background: 'rgba(103, 255, 177, 0.1)', padding: '4px 8px', borderRadius: '4px', color: '#67ffb1', border: '1px dashed #67ffb1' }}>Raw TCP Conn</span>
    </div>

    {/* Message below */}
    <div style={{ color: '#888', fontSize: '10px', textAlign: 'center' }}>
      Thread ownership handed over to custom protocol daemon
    </div>
  </div>
);

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAlternativeLogo, setShowAlternativeLogo] = useState(false);
  // Preloader States
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [preloaderActive, setPreloaderActive] = useState(true);
  const [preloaderVisible, setPreloaderVisible] = useState(true);

  // Code Playground States
  const [activeDevTab, setActiveDevTab] = useState<'start-server' | 'middleware' | 'json-helpers'>('start-server');

  // Alternating Logo Interval
  useEffect(() => {
    const interval = setInterval(() => {
      setShowAlternativeLogo(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Preloader Increment Loop (Guaranteed 1000ms duration for progress, then smooth transition)
  useEffect(() => {
    let animationFrameId: number;
    let fadeTimer: any;
    let disableTimer: any;
    
    const duration = 1000; // Exact duration in ms for counter to reach 100%
    const startTime = performance.now();

    const updateProgress = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(100, Math.floor((elapsed / duration) * 100));
      
      setLoadingProgress(progress);

      if (progress < 100) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        fadeTimer = setTimeout(() => {
          setPreloaderVisible(false);
        }, 80);
        
        disableTimer = setTimeout(() => {
          setPreloaderActive(false);
        }, 700);
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (fadeTimer) clearTimeout(fadeTimer);
      if (disableTimer) clearTimeout(disableTimer);
    };
  }, []);

  // Body scroll lock effect
  useEffect(() => {
    if (preloaderActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      window.scrollTo(0, 0);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [preloaderActive]);

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
      {preloaderActive && (
        <div className={`preloader-overlay ${!preloaderVisible ? 'fade-out' : ''}`}>
          <div className="preloader-logo-group">
            <div className="preloader-logo-row">
              <img src="/logo/logo.svg" className="preloader-logo-img" alt="Wyre Logo" />
              <span className="preloader-logo-text">wyre</span>
            </div>
            <div className="preloader-counter">{loadingProgress}%</div>
          </div>
        </div>
      )}
      <div className={`page-reveal-wrapper ${!preloaderVisible ? 'revealed' : ''}`}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="logo-container">
              <div className="nav-pill" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', padding: 0, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', width: '24px', height: '24px' }}>
                  <img src="/logo/logo.svg" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: showAlternativeLogo ? 0 : 1, transition: 'opacity 0.8s ease-in-out' }} alt="Wyre Logo" />
                  <img src="/logo/logomark.png" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: showAlternativeLogo ? 1 : 0, transition: 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out', transform: showAlternativeLogo ? 'scale(2)' : 'scale(1)', transformOrigin: 'center' }} alt="Wyre Logomark" />
                </div>
              </div>
            </div>

            <nav className="nav-links" style={{ gap: '8px' }}>
              <button className="nav-pill">Product</button>
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

          <button className="mobile-menu-toggle-btn" onClick={() => setMobileMenuOpen(true)}>
            Menu
          </button>
        </div>

        <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-header">
            <div className="logo-container">
              <div className="nav-pill" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', padding: 0 }}>
                <img src="/logo/logo.svg" style={{ width: '20px', height: '20px', objectFit: 'contain' }} alt="Wyre Logo" />
              </div>
            </div>
            <button className="mobile-menu-close-btn" onClick={() => setMobileMenuOpen(false)}>
              Close
            </button>
          </div>
          <div className="mobile-menu-body">
            <nav className="mobile-menu-links">
              <a href="#product" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Product</a>
              <a href="#solutions" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Solutions</a>
              <a href="#resources" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Resources</a>
              <a href="#enterprise" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Enterprise</a>
              <a href="#customers" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Customers</a>
              <a href="#pricing" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            </nav>
            <div className="mobile-menu-cta-group">
              <a href="#login" className="mobile-menu-login-link" onClick={() => setMobileMenuOpen(false)}>Log in</a>
              <button className="btn-primary-white" style={{ width: '100%', padding: '16px 24px' }}>Contact sales</button>
            </div>
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
            <span className="responsive-nowrap">Wyre transforms <img src="/icon-bytes.png" alt="bytes icon" className="inline-icon-img" /> <span className="pixel-word">raw socket bytes </span></span>
            <br className="desktop-only-br" />
            <span className="responsive-nowrap">into agent-ready streaming <img src="/icon-star.png" alt="star icon" className="inline-icon-img star-icon-img" /> pipelines </span>
            <br className="desktop-only-br" />
            automatically, across your whole distributed stack.
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

      {/* Equip every backend section */}
      <section className="equip-section">
        <div className="container equip-container">
          <h2 className="equip-headline">
            <span className="responsive-nowrap">Equip <img src="/icon-server.png" alt="server icon" className="equip-server-icon" /> every backend </span>
            <br className="desktop-only-br" />
            <span className="responsive-nowrap">with high-speed <img src="/icon-bolt.png" alt="bolt icon" className="equip-bolt-icon" /> <span className="pixel-word">streaming</span></span>
          </h2>
          <p className="equip-description">
            Go network applications suffer from framework abstraction overhead, slow reflection-based serializing, and connection drops under load. Wyre unifies raw socket performance, zero-copy streams, and robust recovery middleware into one standalone, agent-ready runtime—delivering microsecond response latencies for modern distributed applications.
          </p>
          <div className="equip-ctas">
            <button className="btn-primary-white">Contact sales</button>
            <button className="btn-secondary-dark">Try Wyre free</button>
          </div>
        </div>
      </section>

      {/* Core Section (Analyze 02 Layout style) */}
      <section className="features-section">
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="features-header-layout">
            <div>
              <h2 className="section-headline-superscript">
                Core<span className="superscript">01</span>
              </h2>
              <h3 className="features-subtitle">Low-level TCP engine built for speed</h3>
              <p className="features-desc">
                Wyre compiles directly against the raw Go runtime to process network connections directly on the OS socket layer. By bypassing slow wrappers and standard HTTP daemons, it achieves microsecond route dispatch latencies.
              </p>
              <div className="features-ctas">
                <button className="btn-primary-white">Contact sales</button>
                <button className="btn-secondary-dark">Try Wyre free</button>
              </div>
            </div>
          </div>

          <div className="premium-features-grid core-grid">
            {/* Feature 1: Prefix Trie Router */}
            <div className="premium-feature-card card-short">
              <div className="premium-feature-visual-wrapper">
                <img src="/features/prefix_router.png" alt="Prefix Trie Router Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              </div>
              <div className="premium-feature-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <i className="hn hn-merge" style={{ color: '#0044ff', fontSize: '24px', flexShrink: 0 }}></i>
                  <h4 className="premium-feature-title" style={{ margin: 0 }}>Prefix Trie Router</h4>
                </div>
                <p className="premium-feature-description">
                  Dynamic segment-based prefix tree routing. It matches requests in $O(L)$ time based on path segments rather than route count, and supports backtracking and URL parameters.
                </p>
                <a href="#prefix-trie-router" className="feature-learn-more">
                  Learn more <span className="arrow">&rarr;</span>
                </a>
              </div>
            </div>

            {/* Feature 2: Memory Recycling Pool */}
            <div className="premium-feature-card card-tall">
              <div className="premium-feature-visual-wrapper">
                <img src="/features/memory_recycling.png" alt="Memory Recycling Pool Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              </div>
              <div className="premium-feature-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <i className="hn hn-refresh-solid" style={{ color: '#0044ff', fontSize: '24px', flexShrink: 0 }}></i>
                  <h4 className="premium-feature-title" style={{ margin: 0 }}>Memory Recycling Pool</h4>
                </div>
                <p className="premium-feature-description">
                  Recycles header slices, requests, and connection buffers through Go `sync.Pool` allocations. Prevents garbage collection overhead, achieving near-zero heap memory allocations.
                </p>
                <a href="#memory-recycling-pool" className="feature-learn-more">
                  Learn more <span className="arrow">&rarr;</span>
                </a>
              </div>
            </div>

            {/* Feature 3: Raw Socket Architecture */}
            <div className="premium-feature-card card-tall">
              <div className="premium-feature-visual-wrapper">
                <img src="/features/socket_architcture.png" alt="Raw Socket Architecture Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              </div>
              <div className="premium-feature-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <i className="hn hn-sitemap" style={{ color: '#0044ff', fontSize: '24px', flexShrink: 0 }}></i>
                  <h4 className="premium-feature-title" style={{ margin: 0 }}>Raw Socket Architecture</h4>
                </div>
                <p className="premium-feature-description">
                  TCP streams accepted and handled directly on the operating system socket layer. Uses low-level connection pooling and timeouts without wrapping Go net/http libraries.
                </p>
                <a href="#raw-socket-architecture" className="feature-learn-more">
                  Learn more <span className="arrow">&rarr;</span>
                </a>
              </div>
            </div>

            {/* Feature 4: Connection Hijacking */}
            <div className="premium-feature-card card-short">
              <div className="premium-feature-visual-wrapper">
                <img src="/features/hijacking.png" alt="Connection Hijacking Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              </div>
              <div className="premium-feature-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <i className="hn hn-chart-network-solid" style={{ color: '#0044ff', fontSize: '24px', flexShrink: 0 }}></i>
                  <h4 className="premium-feature-title" style={{ margin: 0 }}>Connection Hijacking</h4>
                </div>
                <p className="premium-feature-description">
                  Enables hand-off of raw socket descriptors from HTTP parser handlers to down-stream protocols like WebSockets via the custom `Hijack()` method. Handlers take 100% control of the active connection read/write streams.
                </p>
                <a href="#connection-hijacking" className="feature-learn-more">
                  Learn more <span className="arrow">&rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Streaming Section (Analyze 02 Layout style) */}
      <section className="features-section" style={{ borderTop: 'none' }}>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="features-header-layout">
            <div>
              <h2 className="section-headline-superscript">
                Stream<span className="superscript">02</span>
              </h2>
              <h3 className="features-subtitle">Equip every backend with high-speed streaming</h3>
              <p className="features-desc">
                Go network applications suffer from framework abstraction overhead, slow reflection-based serializing, and connection drops under load. Wyre unifies raw socket performance, zero-copy streams, and robust recovery middleware into one standalone, agent-ready runtime—delivering microsecond response latencies for modern distributed applications.
              </p>
              <div className="features-ctas">
                <button className="btn-primary-white">Contact sales</button>
                <button className="btn-secondary-dark">Try Wyre free</button>
              </div>
            </div>
          </div>

          <div className="premium-features-grid streaming-features-grid">
            {/* Feature 1: SSE with Backpressure */}
            <div className="premium-feature-card card-tall">
              <div className="premium-feature-visual-wrapper">
                <img src="/features/sse_backpressure.png" alt="SSE with Backpressure Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              </div>
              <div className="premium-feature-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <i className="hn hn-rss" style={{ color: '#0044ff', fontSize: '24px', flexShrink: 0 }}></i>
                  <h4 className="premium-feature-title" style={{ margin: 0 }}>SSE with Backpressure</h4>
                </div>
                <p className="premium-feature-description">
                  Native Server-Sent Events implementation. Token-stream support that won't balloon memory on slow clients.
                </p>
                <a href="#sse-with-backpressure" className="feature-learn-more">
                  Learn more <span className="arrow">&rarr;</span>
                </a>
              </div>
            </div>

            {/* Feature 2: Unified Streaming Abstraction */}
            <div className="premium-feature-card card-tall">
              <div className="premium-feature-visual-wrapper">
                <img src="/features/unified_streming.png" alt="Unified Streaming Abstraction Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              </div>
              <div className="premium-feature-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <i className="hn hn-sitemap" style={{ color: '#0044ff', fontSize: '24px', flexShrink: 0 }}></i>
                  <h4 className="premium-feature-title" style={{ margin: 0 }}>Unified Streaming Abstraction</h4>
                </div>
                <p className="premium-feature-description">
                  One model across Server-Sent Events, HTTP chunked transfer-encoding, and hijacked TCP connections.
                </p>
                <a href="#unified-stream-abstraction" className="feature-learn-more">
                  Learn more <span className="arrow">&rarr;</span>
                </a>
              </div>
            </div>

            {/* Feature 3: MCP Streamable HTTP Transport */}
            <div className="premium-feature-card card-tall">
              <div className="premium-feature-visual-wrapper">
                <img src="/features/mcp_transport.png" alt="MCP Streamable Transport Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              </div>
              <div className="premium-feature-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <i className="hn hn-open-ai" style={{ color: '#0044ff', fontSize: '24px', flexShrink: 0 }}></i>
                  <h4 className="premium-feature-title" style={{ margin: 0 }}>MCP Streamable Transport</h4>
                </div>
                <p className="premium-feature-description">
                  Model Context Protocol HTTP SSE server transport. Native JSON-RPC framing and session handling for MCP servers.
                </p>
                <a href="#mcp-http-transport" className="feature-learn-more">
                  Learn more <span className="arrow">&rarr;</span>
                </a>
              </div>
            </div>

            {/* Feature 4: Per-Route Concurrency Limiters */}
            <div className="premium-feature-card card-short">
              <div className="premium-feature-visual-wrapper">
                <img src="/features/route_limiter.png" alt="Per-Route Concurrency Limiters Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              </div>
              <div className="premium-feature-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <i className="hn hn-chart-network-solid" style={{ color: '#0044ff', fontSize: '24px', flexShrink: 0 }}></i>
                  <h4 className="premium-feature-title" style={{ margin: 0 }}>Per-Route Concurrency Limiters</h4>
                </div>
                <p className="premium-feature-description">
                  Built-in middleware to throttle and queue request bursts. Controls highly parallel, resource-heavy tool-call traffic.
                </p>
                <a href="#concurrency-controls" className="feature-learn-more">
                  Learn more <span className="arrow">&rarr;</span>
                </a>
              </div>
            </div>

            {/* Feature 5: Adaptive Load Shedding */}
            <div className="premium-feature-card card-short">
              <div className="premium-feature-visual-wrapper">
                <img src="/features/adaptive_load.png" alt="Adaptive Load Shedding Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              </div>
              <div className="premium-feature-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <i className="hn hn-refresh-solid" style={{ color: '#0044ff', fontSize: '24px', flexShrink: 0 }}></i>
                  <h4 className="premium-feature-title" style={{ margin: 0 }}>Adaptive Load Shedding</h4>
                </div>
                <p className="premium-feature-description">
                  degrade gracefully under burst instead of dropping connections. Automatically drops non-critical requests to preserve active streams.
                </p>
                <a href="#adaptive-load-shedding" className="feature-learn-more">
                  Learn more <span className="arrow">&rarr;</span>
                </a>
              </div>
            </div>

            {/* Feature 6: Idempotency-Key Middleware */}
            <div className="premium-feature-card card-tall">
              <div className="premium-feature-visual-wrapper">
                <img src="/features/idempotency.png" alt="Idempotency-Key Middleware Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              </div>
              <div className="premium-feature-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <i className="hn hn-merge-solid" style={{ color: '#0044ff', fontSize: '24px', flexShrink: 0 }}></i>
                  <h4 className="premium-feature-title" style={{ margin: 0 }}>Idempotency-Key Middleware</h4>
                </div>
                <p className="premium-feature-description">
                  Safe execution wrapper for tool calls. Guard against aggressive agent retries or flaky connections without duplicate state transitions.
                </p>
                <a href="#idempotency-key" className="feature-learn-more">
                  Learn more <span className="arrow">&rarr;</span>
                </a>
              </div>
            </div>

            {/* Feature 7: Circuit Breakers & Retries */}
            <div className="premium-feature-card card-tall">
              <div className="premium-feature-visual-wrapper">
                <img src="/features/circuit-breaker.png" alt="Circuit Breakers & Retries Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              </div>
              <div className="premium-feature-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <i className="hn hn-viewblocks" style={{ color: '#0044ff', fontSize: '24px', flexShrink: 0 }}></i>
                  <h4 className="premium-feature-title" style={{ margin: 0 }}>Circuit Breakers & Retries</h4>
                </div>
                <p className="premium-feature-description">
                  Resilience models for outbound LLM and tool connections. Protects backend services with automatic exponential backoff and connection pooling.
                </p>
                <a href="#circuit-breakers" className="feature-learn-more">
                  Learn more <span className="arrow">&rarr;</span>
                </a>
              </div>
            </div>

            {/* Feature 8: Agent-Aware Tracing */}
            <div className="premium-feature-card card-short">
              <div className="premium-feature-visual-wrapper">
                <img src="/features/agent-tracing.png" alt="Agent-Aware Tracing Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              </div>
              <div className="premium-feature-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <i className="hn hn-mistral" style={{ color: '#0044ff', fontSize: '24px', flexShrink: 0 }}></i>
                  <h4 className="premium-feature-title" style={{ margin: 0 }}>Agent-Aware Tracing</h4>
                </div>
                <p className="premium-feature-description">
                  Correlation IDs across multi-hop tool chains. Allows real-time inspection of active planning loops and distributed message flows.
                </p>
                <a href="#agent-tracing" className="feature-learn-more">
                  Learn more <span className="arrow">&rarr;</span>
                </a>
              </div>
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
    </div>
  )
}
