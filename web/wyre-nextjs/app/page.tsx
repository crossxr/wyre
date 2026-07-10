"use client"

import { useState, useEffect } from 'react'
import { FlickeringGrid } from '@/components/ui/flickering-grid'
import { Preloader } from '@/components/sections/preloader'
import { Header } from '@/components/sections/header'
import { Hero } from '@/components/sections/hero'
import { TransformSection } from '@/components/sections/transform-section'
import { EquipSection } from '@/components/sections/equip-section'
import { FeaturesSection } from '@/components/sections/features-section'
import { StreamingSection } from '@/components/sections/streaming-section'
import { TestimonialSection } from '@/components/sections/testimonial-section'
import { AgentDiscoverySection } from '@/components/sections/agent-discovery'
import { DevSandbox } from '@/components/sections/dev-sandbox'
import { Footer } from '@/components/sections/footer'

export default function Home() {
  // Preloader States
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [preloaderActive, setPreloaderActive] = useState(true);
  const [preloaderVisible, setPreloaderVisible] = useState(true);

  // Preloader Increment Loop (Guaranteed 1000ms duration for progress, then smooth transition)
  useEffect(() => {
    let animationFrameId: number;
    let fadeTimer: NodeJS.Timeout;
    let disableTimer: NodeJS.Timeout;

    const duration = 1000; // Exact duration in ms for counter to reach 100%
    const startTime = performance.now();

    const updateProgress = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(100, Math.floor((elapsed / duration) * 100));

      setLoadingProgress(progress);

      if (progress < 100) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        fadeTimer = setTimeout(() => {
          setPreloaderVisible(false);
        }, 80);

        disableTimer = setTimeout(() => {
          setPreloaderActive(false);
        }, 700);
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (fadeTimer) clearTimeout(fadeTimer);
      if (disableTimer) clearTimeout(disableTimer);
    };
  }, []);

  // Body scroll lock effect
  useEffect(() => {
    if (preloaderActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      window.scrollTo(0, 0);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [preloaderActive]);

  return (
    <div className="blueprint-grid" style={{ minHeight: '100vh', position: 'relative' }}>
      <Preloader active={preloaderActive} visible={preloaderVisible} progress={loadingProgress} />

      <div className={`page-reveal-wrapper ${!preloaderVisible ? 'revealed' : ''}`}>
        <FlickeringGrid
          squareSize={4}
          gridGap={6}
          flickerChance={0.3}
          color="rgb(103, 152, 255)"
          maxOpacity={0.12}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            pointerEvents: 'none',
            overflow: 'hidden'
          }}
        />

        {/* Promo Announcement Banner */}
        <div className="promo-banner" style={{ background: '#2979ff', color: '#ffffff', fontWeight: 600 }}>
          <span className="badge" style={{ background: '#ffffff', color: '#2979ff' }}>NEW</span>
          <span>Wyre v1.0.0 Standalone release is live!</span>
          <a href="#developers" style={{ color: '#ffffff', textDecoration: 'underline', marginLeft: '8px' }}>Get started &rarr;</a>
        </div>

        <Header />
        <Hero />
        <TransformSection />
        <EquipSection />
        <FeaturesSection />
        <StreamingSection />
        <AgentDiscoverySection />
        <TestimonialSection />
        <DevSandbox />
        <Footer />
      </div>
    </div>
  )
}
