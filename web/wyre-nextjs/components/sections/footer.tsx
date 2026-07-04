import React from 'react'

export const Footer: React.FC = () => {
  return (
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
  )
}
