import React from 'react'

export const KpiStatsSection: React.FC = () => {
  return (
    <section className="stats-section">
      <div className="container stats-grid">
        <div className="stat-block">
          <span className="stat-number">0 bytes</span>
          <span className="stat-label">Extra Dependencies</span>
          <span className="stat-desc">Compiled directly against the raw Go runtime.</span>
        </div>

        <div className="stat-block">
          <span className="stat-number">O(L)</span>
          <span className="stat-label">Route Search Time</span>
          <span className="stat-desc">Lookup latency depends on path depth, not route counts.</span>
        </div>

        <div className="stat-block">
          <span className="stat-number">&lt; 100ns</span>
          <span className="stat-label">Handler Dispatch Latency</span>
          <span className="stat-desc">Instant thread scheduling and zero reflection overhead.</span>
        </div>
      </div>
    </section>
  )
}
