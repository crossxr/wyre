import React from 'react'
import { PixelUpArrow } from '@/components/ui/pixel-up-arrow'

export const TransformSection: React.FC = () => {
  return (
    <section className="transform-section">
      <div className="container transform-container">
        {/* Headline */}
        <h2 className="transform-headline">
          <span className="responsive-nowrap">Wyre transforms <img src="/icon-bytes.png" alt="bytes icon" className="inline-icon-img" /> <span className="pixel-word">raw socket bytes </span></span>
          <br className="desktop-only-br" />
          <span className="responsive-nowrap">into agent-ready streaming <img src="/icon-star.png" alt="star icon" className="inline-icon-img star-icon-img" /> pipelines </span>
          <br className="desktop-only-br" />
          automatically, across your whole distributed stack.
        </h2>

        {/* Stats Row */}
        <div className="stats-row-custom">
          {/* Stat 1 */}
          <div className="stat-card-custom">
            <div className="stat-number-wrapper">
              <PixelUpArrow />
              <span className="stat-number-custom">10x</span>
            </div>
            <h4 className="stat-title-custom">Throughput performance</h4>
            <p className="stat-desc-custom">
              Sub-microsecond Trie routing and sync.Pool connection recycling deliver more than ten times the concurrency of traditional net/http wrappers.
            </p>
          </div>

          {/* Stat 2 */}
          <div className="stat-card-custom">
            <div className="stat-number-wrapper">
              <PixelUpArrow />
              <span className="stat-number-custom">90%</span>
            </div>
            <h4 className="stat-title-custom">Streaming memory savings</h4>
            <p className="stat-desc-custom">
              Zero-copy LLM proxying and SSE backpressure prevent buffer bloat on slow client connections, reducing active memory consumption by 90%.
            </p>
          </div>

          {/* Stat 3 */}
          <div className="stat-card-custom">
            <div className="stat-number-wrapper">
              <PixelUpArrow />
              <span className="stat-number-custom">99.99%</span>
            </div>
            <h4 className="stat-title-custom">Operational resilience</h4>
            <p className="stat-desc-custom">
              Graceful connection draining, hot config reload, and pluggable CRDT rate limiters guarantee absolute high availability under heavy burst load.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
