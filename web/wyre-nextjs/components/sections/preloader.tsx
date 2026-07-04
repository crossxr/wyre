import React from 'react'

interface PreloaderProps {
  active: boolean
  visible: boolean
  progress: number
}

export const Preloader: React.FC<PreloaderProps> = ({ active, visible, progress }) => {
  if (!active) return null;

  return (
    <div className={`preloader-overlay ${!visible ? 'fade-out' : ''}`}>
      <div className="preloader-logo-group">
        <div className="preloader-logo-row">
          <img src="/logo/logo.svg" className="preloader-logo-img" alt="Wyre Logo" />
          <span className="preloader-logo-text">wyre</span>
        </div>
        <div className="preloader-counter">{progress}%</div>
      </div>
    </div>
  )
}
