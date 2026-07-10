"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAlternativeLogo, setShowAlternativeLogo] = useState(false);

  // Alternating Logo Interval
  useEffect(() => {
    const interval = setInterval(() => {
      setShowAlternativeLogo(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
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
            <Link href="/docs" className="nav-pill">Documentation</Link>
            <button className="nav-pill">Enterprise</button>
            <button className="nav-pill">Customers</button>
            <button className="nav-pill">Pricing</button>
          </nav>
        </div>

        <div className="nav-cta-group" style={{ gap: '8px' }}>
          <a 
            href="https://github.com/crossxr/wyre" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-primary" 
            style={{ 
              backgroundColor: '#ffffff', 
              color: '#000000', 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            GitHub
          </a>
        </div>

        <button className="mobile-menu-toggle-btn" onClick={() => setMobileMenuOpen(true)}>
          Menu
        </button>
      </div>

      {/* Pure CSS mobile menu */}
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
            <Link href="/docs" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Documentation</Link>
            <a href="#enterprise" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Enterprise</a>
            <a href="#customers" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Customers</a>
            <a href="#pricing" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
          </nav>
          <div className="mobile-menu-cta-group">
            <a 
              href="https://github.com/crossxr/wyre" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-primary-white" 
              style={{ 
                width: '100%', 
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textDecoration: 'none'
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
