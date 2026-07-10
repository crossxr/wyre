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
        <div className="equip-ctas" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <a 
            href="https://github.com/crossxr/wyre" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-primary-white" 
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none'
            }}
          >
            <i className="hn hn-github" style={{ fontSize: '18px' }}></i>
            GitHub
          </a>
          <a 
            href="https://discord.gg/BuYJxsKj" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-secondary-dark" 
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none'
            }}
          >
            <i className="hn hn-discord" style={{ fontSize: '18px' }}></i>
            Discord
          </a>
        </div>
      </div>
    </section>
  )
}
