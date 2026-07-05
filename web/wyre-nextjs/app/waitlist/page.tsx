"use client"

import { useState } from 'react'

export default function Waitlist() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setStatus(null)

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong.')
      }

      setStatus({ type: 'success', message: data.message || "YOU'RE ON THE LIST." })
      setEmail('')
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Failed to join waitlist.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#ffffff',
      fontFamily: 'var(--font-inter)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '24px'
    }}>
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          opacity: 0.35,
          pointerEvents: 'none',
        }}
      >
        <source src="https://ucarecdn.com/3682ecf0-f747-4df2-9505-1f76b302bc94/adaptive_video/" type="video/mp4" />
      </video>

      {/* Radial Gradient Overlay for contrast and readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 100%)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Main Container Card */}
      <div className="waitlist-card" style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '480px',
        backgroundColor: '#0a0a0c',
        border: '1px solid #1e1e1e',
        borderRadius: '16px',
        padding: '40px 32px',
        boxShadow: '0 0 40px rgba(0, 68, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          <img src="/logo/logo.svg" alt="Wyre" style={{ width: '32px', height: '32px' }} />
          <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '18px', letterSpacing: '-0.3px' }}>Wyre</span>
          <span style={{ color: '#0044ff', fontFamily: "'Pixelify Sans', 'VT323', monospace", fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>WAITLIST</span>
        </div>

        {status?.type === 'success' ? (
          /* Success Screen */
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', margin: '20px 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0, 68, 255, 0.1)',
              border: '1px solid #0044ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 15px rgba(0, 68, 255, 0.3)', color: '#0044ff', fontSize: '24px'
            }}>
              <i className="hn hn-refresh-solid"></i>
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-mondwest)', fontSize: '28px', color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '8px' }}>
                ACCESS GRANTED
              </h2>
              <p style={{ fontSize: '14px', color: '#a1a1aa', lineHeight: '1.6' }}>
                You have successfully joined the waitlist. We will notify you at your email address as soon as developer invite slots open up.
              </p>
            </div>
            <div style={{
              fontFamily: "'Pixelify Sans', 'VT323', monospace", fontSize: '12px', color: '#0044ff',
              background: 'rgba(0, 68, 255, 0.05)', padding: '6px 12px', border: '1px dotted rgba(0, 68, 255, 0.3)',
              borderRadius: '4px', marginTop: '8px'
            }}>
              STATUS: QUEUED FOR DEPLOYMENT
            </div>
          </div>
        ) : (
          /* Form Screen */
          <>
            <h1 style={{ fontFamily: 'var(--font-mondwest)', fontSize: '32px', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.8px', marginBottom: '12px' }}>
              High-Speed Go Web Engine
            </h1>
            <p style={{ fontSize: '14px', color: '#a1a1aa', lineHeight: '1.6', marginBottom: '32px' }}>
              Wyre is a zero-dependency, ultra-fast Go framework designed for real-time AI tool-calling, SSE streaming with backpressure, and zero-GC memory recycling.
            </p>

            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 16px',
                    borderRadius: '8px',
                    backgroundColor: '#161618',
                    border: '1px solid #27272a',
                    color: '#ffffff',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                  className="waitlist-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: '1px solid #0044ff',
                  color: '#ffffff',
                  fontFamily: 'var(--font-jetbrains-mono)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                className="waitlist-submit"
              >
                {loading ? (
                  'PROCESSING...'
                ) : (
                  <>
                    <img src="/logo/logomark.png" alt="Wyre Logomark" style={{ height: '30px', width: 'auto', objectFit: 'contain' }} />
                    <span>REQUEST EARLY ACCESS</span>
                  </>
                )}
              </button>

              {status?.type === 'error' && (
                <div style={{
                  color: '#ef4444', fontSize: '12px', background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px', textAlign: 'left',
                  lineHeight: '1.4'
                }}>
                  {status.message}
                </div>
              )}
            </form>
          </>
        )}

        {/* Divider */}
        <div style={{ width: '100%', height: '1px', background: '#1e1e1e', margin: '32px 0 24px 0' }}></div>

        {/* Social Icons & Links */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: '#71717a', fontSize: '18px', transition: 'color 0.2s ease', display: 'flex', alignItems: 'center' }} className="social-link">
            <i className="hn hn-github"></i>
          </a>
          <a href="https://discord.com" target="_blank" rel="noopener noreferrer" style={{ color: '#71717a', fontSize: '18px', transition: 'color 0.2s ease', display: 'flex', alignItems: 'center' }} className="social-link">
            <i className="hn hn-discord"></i>
          </a>
        </div>
      </div>

      <style>{`
        .waitlist-input:focus {
          border-color: #0044ff !important;
          box-shadow: 0 0 12px rgba(0, 68, 255, 0.25) !important;
        }
        .waitlist-submit:hover {
          background-color: #0044ff !important;
          box-shadow: 0 0 15px rgba(0, 68, 255, 0.4) !important;
        }
        .social-link:hover {
          color: #0044ff !important;
        }
      `}</style>
    </div>
  )
}
