import React from 'react'

export const StreamingSection: React.FC = () => {
  return (
    <section id="streaming" className="features-section" style={{ borderTop: 'none', borderBottom: 'none' }}>
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
              <img src="https://ucarecdn.com/1848cf83-74b6-492e-8d5f-36b2a542ae48/-/preview/1000x666/" alt="SSE with Backpressure Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
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
              <img src="https://ucarecdn.com/ca61296c-529f-44fb-abe5-1985e799404b/-/preview/1000x666/" alt="Unified Streaming Abstraction Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
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
              <img src="https://ucarecdn.com/60dba302-f762-4576-a57b-a2a3d669ed88/-/preview/1000x666/" alt="MCP Streamable Transport Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
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
              <img src="https://ucarecdn.com/1a79c7e1-406d-4b92-bacd-90ce36006748/-/preview/1000x666/" alt="Per-Route Concurrency Limiters Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
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
              <img src="https://ucarecdn.com/77f1abfd-ffdf-451d-819d-db7a27feb8b7/-/preview/1000x666/" alt="Adaptive Load Shedding Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
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
              <img src="https://ucarecdn.com/b3a6faf6-6b57-4f19-b691-d45928fb05a2/-/preview/1000x666/" alt="Idempotency-Key Middleware Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
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
              <img src="https://ucarecdn.com/56507764-085b-49d5-bdbe-41e5c235a86f/-/preview/1000x666/" alt="Circuit Breakers & Retries Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
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
              <img src="https://ucarecdn.com/8a369b87-504c-460e-b386-33e56ba01978/-/preview/1000x666/" alt="Agent-Aware Tracing Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
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
  )
}
