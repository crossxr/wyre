import React from 'react'

export const Hero: React.FC = () => {
  return (
    <section id="hero" className="hero-section" style={{ paddingBottom: '0px' }}>
      <div className="container">
        <div className="hero-centered">
          {/* G2 / Capterra ratings */}
          <div className="ratings-row">
            <div className="rating-item">
              <span className="stars">★★★★★</span>
              <span>4.5/5 G2</span>
            </div>
            <div className="rating-item">
              <span className="stars">★★★★★</span>
              <span>4.6/5 CAPTERRA</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="hero-headline-custom">
            <span className="headline-line">Serve with sockets,</span><br />
            <span className="headline-line">not <span className="vibes-wrapper"><img src="/hero-vibes-icon.webp" alt="frameworks cap" className="vibes-icon" /><span className="vibes-text">frameworks</span></span></span>
          </h1>

          {/* Description */}
          <p className="hero-description-custom">
            A zero-dependency, high-performance Go web engine. Build raw socket HTTP/1.1 and HTTPS servers with deterministic Trie routing, connection hijacking, and automatic memory pooling.
          </p>

          {/* CTAs */}
          <div className="hero-ctas">
            <button className="btn-primary-white">Contact sales</button>
            <button className="btn-secondary-dark">Try Wyre free</button>
          </div>
        </div>
      </div>
    </section>
  )
}
