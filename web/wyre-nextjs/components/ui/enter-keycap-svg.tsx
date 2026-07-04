import React from 'react'

export const EnterKeycapSvg: React.FC = () => (
  <svg
    className="inline-icon-img"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{
      width: '76px',
      height: '76px',
      display: 'inline-block',
      verticalAlign: 'middle',
      margin: '0 8px 0 8px',
      transform: 'translateY(-4px)'
    }}
  >
    <rect x="2" y="2" width="20" height="20" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="2" />
    <rect x="4" y="4" width="16" height="13" rx="2" fill="#f4f4f5" />
    <text x="12" y="12" fill="#71717a" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">ENTER</text>
    <path d="M16 14h-6v-3" stroke="#71717a" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
