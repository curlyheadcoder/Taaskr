import React from 'react';

/**
 * TaaskrLogo Component
 * Premium geometric monogram with warm amber and obsidian theme styling.
 * 
 * @param {number} size - Dimension in pixels (default 28)
 * @param {boolean} withText - Whether to show the "Taaskr" brand text
 * @param {string} textSize - Font size of brand text (e.g. '1.25rem')
 * @param {boolean} animated - Adds subtle hover glow effect
 * @param {string} className - Optional container class
 * @param {object} style - Inline style overrides
 */
export default function TaaskrLogo({
  size = 28,
  withText = false,
  textSize = '1.25rem',
  animated = true,
  className = '',
  style = {}
}) {
  return (
    <div 
      className={`taaskr-brand-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.6rem',
        userSelect: 'none',
        ...style
      }}
    >
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: animated ? 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), filter 0.25s ease' : 'none',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          if (animated) {
            e.currentTarget.style.transform = 'scale(1.06) rotate(1deg)';
            e.currentTarget.style.filter = 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.6))';
          }
        }}
        onMouseLeave={(e) => {
          if (animated) {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
            e.currentTarget.style.filter = 'none';
          }
        }}
      >
        <svg 
          viewBox="0 0 100 100" 
          width="100%" 
          height="100%" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}
        >
          <defs>
            <linearGradient id={`bgGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E2235" />
              <stop offset="50%" stopColor="#141724" />
              <stop offset="100%" stopColor="#0B0D14" />
            </linearGradient>

            <linearGradient id={`amberGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            <linearGradient id={`accentGrad-${size}`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#B45309" />
              <stop offset="60%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#FEF08A" />
            </linearGradient>

            <linearGradient id={`borderGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#4B5563" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.45" />
            </linearGradient>

            <filter id={`amberGlow-${size}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="#F59E0B" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Shield Squircle Outline & Glass Container */}
          <rect 
            x="4" 
            y="4" 
            width="92" 
            height="92" 
            rx="24" 
            fill={`url(#bgGrad-${size})`} 
            stroke={`url(#borderGrad-${size})`} 
            strokeWidth="2.5" 
          />

          {/* Amber Ambient Core */}
          <circle cx="50" cy="50" r="26" fill="#F59E0B" opacity="0.15" />

          {/* Dynamic Modern 'T' Monogram */}
          <g filter={`url(#amberGlow-${size})`}>
            {/* Top Bar of T */}
            <path 
              d="M 22 28 C 22 25.5 24 23.5 26.5 23.5 L 73.5 23.5 C 76 23.5 78 25.5 78 28 L 78 33.5 C 78 35.5 76.5 37 74.5 37 L 57.5 37 L 57.5 44 L 42.5 44 L 42.5 37 L 25.5 37 C 23.5 37 22 35.5 22 33.5 Z" 
              fill={`url(#amberGrad-${size})`} 
            />

            {/* Stem with Angular Cut */}
            <path 
              d="M 42.5 42 L 57.5 42 L 57.5 59 C 57.5 61 56.5 62.5 54.8 63.5 L 35 76 C 33.2 77.2 30.8 76.2 30.8 74 L 30.8 68 C 30.8 66.5 31.6 65.2 32.8 64.4 L 42.5 58 Z" 
              fill={`url(#accentGrad-${size})`} 
            />

            {/* Velocity Task Check Arrow */}
            <path 
              d="M 49 54 L 69.5 72.5 C 71 73.8 73.5 73 73.5 71 L 73.5 64 C 73.5 62.6 72.8 61.4 71.8 60.5 L 56 46.5 Z" 
              fill={`url(#amberGrad-${size})`} 
            />

            {/* Precise Polish Accent Dot */}
            <circle cx="73" cy="28.5" r="2.5" fill="#FFFFFF" opacity="0.95" />
          </g>
        </svg>
      </div>

      {withText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: textSize,
            fontWeight: 800,
            color: 'var(--text-main)',
            letterSpacing: '-0.035em',
            lineHeight: 1.1,
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            <span>Taaskr</span>
            <span style={{ 
              color: 'var(--primary)', 
              fontSize: '0.85em', 
              fontWeight: 900 
            }}>•</span>
          </span>
        </div>
      )}
    </div>
  );
}
