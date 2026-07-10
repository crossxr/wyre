"use client"

import React from 'react'

export const AgentDiscoverySection: React.FC = () => {
  return (
    <section id="agent-discovery" className="features-section" style={{ borderTop: 'none', borderBottom: 'none' }}>
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        
        {/* Section Header */}
        <div className="features-header-layout">
          <div>
            <h2 className="section-headline-superscript">
              Discovery<span className="superscript">03</span>
            </h2>
            <h3 className="features-subtitle">Agent-Ready Protocols</h3>
            <p className="features-desc">
              LLM agents don't browse websites—they read endpoint descriptors and handle rate-limiting feedback loop-by-loop. Wyre acts as an agent-ready server gateway out of the box, standardizing how capabilities are announced and how errors are triaged.
            </p>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="premium-features-grid core-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          
          {/* Card 1: /.well-known/agent-capabilities */}
          <div className="premium-feature-card card-tall" style={{ gridColumn: 'auto', gridRow: 'auto' }}>
            <div className="premium-feature-visual-wrapper">
              <img src="https://pub-333e6f54888f402495030dfdde337d75.r2.dev/agent_discovery.png" alt="Capability Discovery Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
            </div>
            
            <div className="premium-feature-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <i className="hn hn-sitemap" style={{ color: '#0044ff', fontSize: '24px', flexShrink: 0 }}></i>
                <h4 className="premium-feature-title" style={{ margin: 0 }}>Capability Auto-Discovery</h4>
              </div>
              <p className="premium-feature-description">
                Auto-exposes routes, descriptions, path parameters, and query structures under a standardized JSON endpoint.
              </p>
              <a href="/docs" className="feature-learn-more">
                Learn more <span className="arrow">&rarr;</span>
              </a>
            </div>
          </div>

          {/* Card 2: Standardized Error Contracts */}
          <div className="premium-feature-card card-tall" style={{ gridColumn: 'auto', gridRow: 'auto' }}>
            <div className="premium-feature-visual-wrapper">
              <img src="https://pub-333e6f54888f402495030dfdde337d75.r2.dev/errors.png" alt="Structured Error Contracts Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
            </div>
            
            <div className="premium-feature-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <i className="hn hn-refresh-solid" style={{ color: '#ff6767', fontSize: '24px', flexShrink: 0 }}></i>
                <h4 className="premium-feature-title" style={{ margin: 0 }}>Structured Error Contracts</h4>
              </div>
              <p className="premium-feature-description">
                Enables built-in limiters, shedders, and recoveries to return machine-actionable retry status codes and backoff hints.
              </p>
              <a href="/docs" className="feature-learn-more">
                Learn more <span className="arrow">&rarr;</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
