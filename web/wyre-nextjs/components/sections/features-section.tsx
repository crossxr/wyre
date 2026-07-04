import React from 'react'

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="features-section">
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
              <img src="https://ucarecdn.com/de31f587-74a7-41a1-b226-873663dacb4d/-/preview/1000x666/" alt="Prefix Trie Router Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
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
              <img src="https://ucarecdn.com/1df9d717-5a90-4c44-8c86-0916aa72e4fd/-/preview/1000x666/" alt="Memory Recycling Pool Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
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
              <img src="https://ucarecdn.com/1c96f94a-6a37-4a73-a4bc-9b0a1430008c/-/preview/1000x666/" alt="Raw Socket Architecture Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
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
              <img src="https://ucarecdn.com/4d5f24f7-c4aa-4ed4-bf09-653ffae51b6e/-/preview/1000x666/" alt="Connection Hijacking Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
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
  )
}
