import React from 'react'

export const EquipSection: React.FC = () => {
  return (
    <section id="equip" className="equip-section">
      <div className="container equip-container">
        <h2 className="equip-headline">
          <span className="responsive-nowrap">Equip <img src="/icon-server.png" alt="server icon" className="equip-server-icon" /> every backend </span>
          <br className="desktop-only-br" />
          <span className="responsive-nowrap">with high-speed <img src="/icon-bolt.png" alt="bolt icon" className="equip-bolt-icon" /> <span className="pixel-word">streaming</span></span>
        </h2>
        <p className="equip-description">
          Go network applications suffer from framework abstraction overhead, slow reflection-based serializing, and connection drops under load. Wyre unifies raw socket performance, zero-copy streams, and robust recovery middleware into one standalone, agent-ready runtime—delivering microsecond response latencies for modern distributed applications.
        </p>
        <div className="equip-ctas">
          <button className="btn-primary-white">Contact sales</button>
          <button className="btn-secondary-dark">Try Wyre free</button>
        </div>
      </div>
    </section>
  )
}
