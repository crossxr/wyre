import React from 'react'

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand block */}
          <div className="footer-brand-col">
            <div className="footer-logo-wrap">
              <div className="footer-logo-pill">
                <img src="/logo/logo.svg" alt="Wyre Logo" className="footer-logo-img" />
              </div>
              <span className="footer-brand-name">Wyre</span>
            </div>
            <p className="footer-brand-desc">
              Serve with sockets, not frameworks. An ultra-high-performance, zero-dependency Go web engine built for agent-ready streaming pipelines.
            </p>
            {/* Status Indicator */}
            <div className="footer-status-pill">
              <span className="status-dot"></span>
              <span className="status-text">All systems operational</span>
            </div>
          </div>

          {/* Column 1: Navigation */}
          <div className="footer-col">
            <span className="footer-col-title">Navigation</span>
            <div className="footer-links">
              <a href="#hero" className="footer-link">Overview</a>
              <a href="#transform" className="footer-link">Performance</a>
              <a href="#equip" className="footer-link">Specifications</a>
              <a href="#features" className="footer-link">Core Engine</a>
              <a href="#streaming" className="footer-link">Streaming</a>
              <a href="#sandbox" className="footer-link">Code Sandbox</a>
              <a href="#testimonials" className="footer-link">Testimonials</a>
            </div>
          </div>

          {/* Column 2: Capabilities */}
          <div className="footer-col">
            <span className="footer-col-title">Capabilities</span>
            <div className="footer-links">
              <a href="#features" className="footer-link">Prefix Trie Router</a>
              <a href="#features" className="footer-link">Memory Recycling Pool</a>
              <a href="#streaming" className="footer-link">SSE & Backpressure</a>
              <a href="#sandbox" className="footer-link">Concurrency Limiters</a>
              <a href="#sandbox" className="footer-link">Socket Hijacking</a>
              <a href="#sandbox" className="footer-link">MCP Transport</a>
            </div>
          </div>

          {/* Column 3: Resources */}
          <div className="footer-col">
            <span className="footer-col-title">Resources</span>
            <div className="footer-links">
              <a href="#sandbox" className="footer-link">API Reference</a>
              <a href="#changelog" className="footer-link">Changelog</a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub Repository</a>
              <a href="#support" className="footer-link">Support Desk</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-copy">
            © 2026 Wyre Engine Inc. Built on Dovetail Design Standards.
          </span>
          <div className="footer-social">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-social-link">
              <i className="hn hn-github-solid"></i> GitHub
            </a>
            <span>·</span>
            <a href="#discord" className="footer-social-link">
              <i className="hn hn-discord"></i> Discord
            </a>
            <span>·</span>
            <a href="#twitter" className="footer-social-link">
              <i className="hn hn-twitter"></i> Twitter
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
