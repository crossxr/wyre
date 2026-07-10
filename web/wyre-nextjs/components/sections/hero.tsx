"use client"

import React, { useState } from 'react'
import Link from 'next/link'

export const Hero: React.FC = () => {
  const [copied, setCopied] = useState(false)
  const installCmd = "go get github.com/crossxr/wyre"

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(installCmd)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <section id="hero" className="hero-section" style={{ paddingBottom: '0px' }}>
      <div className="container">
        <div className="hero-centered">


          {/* Headline */}
          <h1 className="hero-headline-custom">
            <span className="headline-line">Serve with sockets,</span><br />
            <span className="headline-line">not <span className="vibes-wrapper"><img src="/hero-vibes-icon.webp" alt="frameworks cap" className="vibes-icon" /><span className="vibes-text">frameworks</span></span></span>
          </h1>

          {/* Description */}
          <p className="hero-description-custom">
            A agemt-native, net/http-compatible web engine with capability auto-discovery, structured error contracts, and raw-socket performance — built for servers that talk to agents, not just browsers.
          </p>

          {/* CTAs */}
          <div className="hero-ctas flex flex-col md:flex-row items-center justify-center gap-4 w-full">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(20, 20, 20, 0.6)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(103, 152, 255, 0.25)',
                borderRadius: '8px',
                padding: '0 18px',
                height: '48px',
                boxSizing: 'border-box',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: '14px',
                color: '#ffffff',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                width: '100%',
                maxWidth: '420px',
                justifyContent: 'space-between',
                transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', userSelect: 'all' }}>
                <span style={{ color: 'var(--color-soft-indigo)', userSelect: 'none' }}>$</span>
                <span>{installCmd}</span>
              </div>
              <button
                onClick={handleCopy}
                style={{
                  background: 'none',
                  border: 'none',
                  color: copied ? 'var(--color-soft-indigo)' : 'var(--color-mist)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-inter), sans-serif',
                  fontSize: '12px',
                  fontWeight: 500,
                  transition: 'color 0.2s ease',
                  outline: 'none',
                }}
                title="Copy to clipboard"
              >
                {copied ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span style={{ fontSize: '11px', color: '#6798ff' }}>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </>
                )}
              </button>
            </div>

            <Link
              href="/docs"
              className="btn-primary-white w-full md:w-auto"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textDecoration: 'none',
                padding: '0 24px',
                height: '48px',
                boxSizing: 'border-box',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#000000',
                backgroundColor: '#ffffff',
                transition: 'opacity 0.2s, transform 0.1s ease',
                maxWidth: '420px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateY(-0.5px)' }}>
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
              Read Documentation
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

