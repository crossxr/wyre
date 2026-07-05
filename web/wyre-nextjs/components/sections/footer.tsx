"use client"

import React, { useState } from 'react'

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert(`Thank you for subscribing to the Wyre newsletter: ${email}`)
    setEmail('')
  }

  return (
    <footer className="footer" style={{ borderTop: 'none', paddingTop: '120px' }}>
      <div className="container flex flex-col">
        {/* Top Header Row: Branding (Left) & Landscape Banner (Right) */}
        <div className="flex flex-col md:flex-row justify-between items-start w-full gap-8" style={{ marginBottom: '80px' }}>
          {/* Left: Logo, Tagline & Socials */}
          <div className="flex flex-col gap-4 w-full md:w-1/4">
            {/* Logo + Text */}
            <div className="flex items-center gap-4">
              <img src="/logo/logo.svg" alt="Wyre Logo" className="w-16 h-16 select-none" />
              <span className="text-white font-semibold text-2xl font-inter tracking-tight">Wyre</span>
            </div>
            {/* Tagline */}
            <p className="text-slate-400 text-sm font-mono leading-relaxed mt-2">
              An ultra-high-performance, zero-dependency Go web engine.
            </p>
            {/* Social Icons */}
            <div className="flex gap-5 text-[#2563eb] text-xl mt-2">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" title="GitHub">
                <i className="hn hn-github"></i>
              </a>
              <a href="#discord" className="hover:text-white transition-colors" title="Discord">
                <i className="hn hn-discord"></i>
              </a>
              <a href="#x" className="hover:text-white transition-colors" title="X">
                <i className="hn hn-x"></i>
              </a>
              <a href="#instagram" className="hover:text-white transition-colors" title="Instagram">
                <i className="hn hn-instagram"></i>
              </a>
            </div>
          </div>
          {/* Right: Landscape Image */}
          <div className="w-full md:w-3/4 flex justify-end">
            <img
              src="https://ucarecdn.com/7bf97b22-7d0f-499f-8216-d84b146cc461/-/preview/1000x333/"
              alt="Wyre Landscape"
              className="w-full h-auto select-none opacity-25 rounded-xl"
            />
          </div>
        </div>

        {/* Upper Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8" style={{ paddingBottom: '120px' }}>
          {/* Column 1: Products */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[#6798ff] font-semibold text-base tracking-wider uppercase" style={{ fontFamily: 'var(--font-mondwest)' }}>Products</h3>
            <ul className="flex flex-col gap-3">
              <li>
                <a href="#features" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  Core
                </a>
              </li>
              <li>
                <a href="#streaming" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  Stream
                </a>
              </li>
              <li>
                <a href="#transform" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  Distributed
                </a>
              </li>
              <li>
                <a href="#cloud" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  Wyre Cloud™
                </a>
              </li>
              <li>
                <a href="#sandbox" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  Sandbox
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Capabilities */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[#6798ff] font-semibold text-base tracking-wider uppercase" style={{ fontFamily: 'var(--font-mondwest)' }}>Capabilities</h3>
            <ul className="flex flex-col gap-3">
              <li>
                <a href="#features" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  Prefix Trie Router
                </a>
              </li>
              <li>
                <a href="#features" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  Memory Recycling Pool
                </a>
              </li>
              <li>
                <a href="#streaming" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  SSE & Backpressure
                </a>
              </li>
              <li>
                <a href="#sandbox" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  Concurrency Limiters
                </a>
              </li>
              <li>
                <a href="#sandbox" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  Socket Hijacking
                </a>
              </li>
              <li>
                <a href="#sandbox" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  MCP Transport
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[#6798ff] font-semibold text-base tracking-wider uppercase" style={{ fontFamily: 'var(--font-mondwest)' }}>Resources</h3>
            <ul className="flex flex-col gap-3">
              <li>
                <a href="#sandbox" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#changelog" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  Changelog
                </a>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  GitHub Repository
                </a>
              </li>
              <li>
                <a href="#support" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  Support Desk
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="flex flex-col gap-4 lg:pl-4">
            <h3 className="text-white font-medium text-base leading-snug">
              Sign up for our newsletter to stay up to date
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full mt-1">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-10 rounded-lg bg-[#161618] border border-[#27272a] text-white placeholder-slate-500 font-inter text-sm focus:outline-none focus:border-[#6798ff] hover:border-[#3f3f46] hover:bg-[#27272a]/20 transition-all"
                style={{ paddingLeft: '24px', paddingRight: '16px' }}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn-primary h-10 px-5 text-sm cursor-pointer"
                >
                  Subscribe
                </button>
              </div>
            </form>

          </div>
        </div>



        {/* Bottom Row */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <i className="hn hn-life-hacking text-cyan-400 animate-pulse text-sm" style={{ filter: 'drop-shadow(0 0 4px rgba(34,211,238,0.8))' }}></i>
            <span>All systems operational</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-mono text-slate-500">
            <a href="#privacy" className="hover:text-[#6798ff] transition-colors duration-200">Privacy policy</a>
            <a href="#terms" className="hover:text-[#6798ff] transition-colors duration-200">Terms of service</a>
            <span className="text-slate-600">© 2026 Wyre Engine Inc.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
