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
          <a href="#login" className="login-link">Log in</a>
          <button className="btn-primary" style={{ backgroundColor: '#ffffff', color: '#000000', fontWeight: 600 }}>Contact sales</button>
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
            <a href="#login" className="mobile-menu-login-link" onClick={() => setMobileMenuOpen(false)}>Log in</a>
            <button className="btn-primary-white" style={{ width: '100%', padding: '16px 24px' }}>Contact sales</button>
          </div>
        </div>
      </div>
    </header>
  )
}
