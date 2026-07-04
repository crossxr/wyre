import React from 'react'

export const TestimonialSection: React.FC = () => {
  return (
    <section
      id="testimonials"
      className="py-24 md:py-36 relative z-10"
      style={{
        background: 'linear-gradient(to right, rgba(0, 0, 0, 0) 0%, #000000 20%, #000000 65%, rgba(0, 0, 0, 0.9) 85%, rgba(0, 0, 0, 0) 100%)'
      }}
    >
      <div className="container flex flex-col md:flex-row items-start md:items-center justify-between gap-10 md:gap-16">
        {/* Testimonial Quote & Attribution (Left Side) */}
        <div className="flex-1 max-w-[800px]">
          <blockquote className="text-white text-xl md:text-2xl leading-relaxed font-normal tracking-[-0.5px]" style={{ fontFamily: 'var(--font-inter)' }}>
            &ldquo;Wyre replaced our entire HTTP middleware stack with a single binary. Zero-copy streaming cut our p99 tail latencies by 8x, and the deterministic Trie router eliminated every routing ambiguity we had in production.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3" style={{ marginTop: '48px' }}>
            <span className="text-white text-xs font-semibold uppercase tracking-[1.5px]" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>Daniel Roe</span>
            <span className="text-[#313131] text-xs">|</span>
            <span className="text-[#7c7c7c] text-xs uppercase tracking-[1.5px]" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>Principal Infrastructure Engineer, Bluesky</span>
          </div>
        </div>

        {/* Overlapping Circles (Right Side) */}
        <div className="flex-shrink-0 flex items-center select-none">
          {/* Left Circle - Contains the single icon */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#141414] border border-[#1e1e1e] flex items-center justify-center relative z-10 shadow-xl">
            <i className="hn hn-bluesky text-white text-3xl md:text-4xl"></i>
          </div>
          {/* Right Circle - Contains the Bluesky brand name */}
          <div
            className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#0085ff] border border-[#1e1e1e] flex items-center justify-center relative -ml-6 md:-ml-8 z-0 overflow-hidden shadow-xl"
            style={{
              backgroundImage: 'radial-gradient(circle at center, #0085ff 0%, #0055d4 100%)'
            }}
          >
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:6px_6px] pointer-events-none"></div>
            <span className="text-white font-bold text-xs md:text-sm tracking-tight relative z-10" style={{ fontFamily: 'var(--font-inter)' }}>
              bluesky
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
