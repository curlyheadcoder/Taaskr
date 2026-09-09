import React from 'react';

/**
 * TaaskrLogo Component
 * Multi-Persona geometric monogram supporting distinct visual brand variants
 * for Consumer (User), Partner Pro (Provider), and Operations (Admin).
 * 
 * @param {number} size - Dimension in pixels (default 28)
 * @param {boolean} withText - Whether to show the "Taaskr" brand text
 * @param {string} textSize - Font size of brand text (e.g. '1.25rem')
 * @param {string} variant - 'auto' | 'user' | 'provider' | 'admin' (default 'auto')
 * @param {boolean} animated - Adds subtle hover glow effect
 * @param {string} className - Optional container class
 * @param {object} style - Inline style overrides
 */
export default function TaaskrLogo({
  size = 28,
  withText = false,
  textSize = '1.25rem',
  variant = 'auto',
  animated = true,
  className = '',
  style = {}
}) {
  // Resolve effective persona
  let effectiveVariant = variant;
  if (effectiveVariant === 'auto' && typeof document !== 'undefined') {
    if (document.body.classList.contains('theme-provider')) {
      effectiveVariant = 'provider';
    } else if (document.body.classList.contains('theme-admin')) {
      effectiveVariant = 'admin';
    } else {
      effectiveVariant = 'user';
    }
  }

  // Palette configuration based on Persona
  let brandConfig = {
    name: 'user',
    label: '',
    primary: '#F59E0B',
    primaryLight: '#FDE68A',
    primaryDark: '#D97706',
    glow: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    badgeBorder: 'rgba(245, 158, 11, 0.35)',
    badgeColor: '#F59E0B',
    tagText: ''
  };

  if (effectiveVariant === 'provider') {
    brandConfig = {
      name: 'provider',
      label: 'Pro',
      primary: '#10B981',
      primaryLight: '#6EE7B7',
      primaryDark: '#059669',
      glow: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.14)',
      badgeBorder: 'rgba(16, 185, 129, 0.4)',
      badgeColor: '#10B981',
      tagText: 'PRO'
    };
  } else if (effectiveVariant === 'admin') {
    brandConfig = {
      name: 'admin',
      label: 'Operations',
      primary: '#6366F1',
      primaryLight: '#A5B4FC',
      primaryDark: '#4F46E5',
      glow: '#6366F1',
      badgeBg: 'rgba(99, 102, 241, 0.14)',
      badgeBorder: 'rgba(99, 102, 241, 0.4)',
      badgeColor: '#818CF8',
      tagText: 'OPS'
    };
  }

  const idPrefix = `${brandConfig.name}-${size}`;

  return (
    <div 
      className={`taaskr-brand-logo logo-${brandConfig.name} ${className}`}
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
            e.currentTarget.style.filter = `drop-shadow(0 0 10px ${brandConfig.glow})`;
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
            <linearGradient id={`bgGrad-${idPrefix}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E2235" />
              <stop offset="50%" stopColor="#141724" />
              <stop offset="100%" stopColor="#0B0D14" />
            </linearGradient>

            <linearGradient id={`accentMain-${idPrefix}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={brandConfig.primaryLight} />
              <stop offset="40%" stopColor={brandConfig.primary} />
              <stop offset="100%" stopColor={brandConfig.primaryDark} />
            </linearGradient>

            <linearGradient id={`accentStem-${idPrefix}`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={brandConfig.primaryDark} />
              <stop offset="60%" stopColor={brandConfig.primary} />
              <stop offset="100%" stopColor={brandConfig.primaryLight} />
            </linearGradient>

            <linearGradient id={`borderGrad-${idPrefix}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={brandConfig.primary} stopOpacity="0.8" />
              <stop offset="50%" stopColor="#4B5563" stopOpacity="0.25" />
              <stop offset="100%" stopColor={brandConfig.primary} stopOpacity="0.5" />
            </linearGradient>

            <filter id={`glowFilter-${idPrefix}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor={brandConfig.glow} floodOpacity="0.55" />
            </filter>
          </defs>

          {/* Shield Squircle Outline & Glass Container */}
          <rect 
            x="4" 
            y="4" 
            width="92" 
            height="92" 
            rx="24" 
            fill={`url(#bgGrad-${idPrefix})`} 
            stroke={`url(#borderGrad-${idPrefix})`} 
            strokeWidth="2.5" 
          />

          {/* Ambient Core Glow */}
          <circle cx="50" cy="50" r="26" fill={brandConfig.primary} opacity="0.16" />

          {/* Dynamic Modern 'T' Monogram */}
          <g filter={`url(#glowFilter-${idPrefix})`}>
            {/* Top Bar of T */}
            <path 
              d="M 22 28 C 22 25.5 24 23.5 26.5 23.5 L 73.5 23.5 C 76 23.5 78 25.5 78 28 L 78 33.5 C 78 35.5 76.5 37 74.5 37 L 57.5 37 L 57.5 44 L 42.5 44 L 42.5 37 L 25.5 37 C 23.5 37 22 35.5 22 33.5 Z" 
              fill={`url(#accentMain-${idPrefix})`} 
            />

            {/* Stem with Angular Velocity Cut */}
            <path 
              d="M 42.5 42 L 57.5 42 L 57.5 59 C 57.5 61 56.5 62.5 54.8 63.5 L 35 76 C 33.2 77.2 30.8 76.2 30.8 74 L 30.8 68 C 30.8 66.5 31.6 65.2 32.8 64.4 L 42.5 58 Z" 
              fill={`url(#accentStem-${idPrefix})`} 
            />

            {/* Velocity Task Check Arrow */}
            <path 
              d="M 49 54 L 69.5 72.5 C 71 73.8 73.5 73 73.5 71 L 73.5 64 C 73.5 62.6 72.8 61.4 71.8 60.5 L 56 46.5 Z" 
              fill={`url(#accentMain-${idPrefix})`} 
            />

            {/* Precise Polish Accent Dot */}
            <circle cx="73" cy="28.5" r="2.5" fill="#FFFFFF" opacity="0.95" />
          </g>
        </svg>
      </div>

      {withText && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
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
              color: brandConfig.primary, 
              fontSize: '0.85em', 
              fontWeight: 900 
            }}>•</span>
          </span>

          {brandConfig.tagText && (
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              padding: '0.12rem 0.45rem',
              borderRadius: '6px',
              backgroundColor: brandConfig.badgeBg,
              border: `1px solid ${brandConfig.badgeBorder}`,
              color: brandConfig.badgeColor,
              textTransform: 'uppercase',
              lineHeight: 1.2
            }}>
              {brandConfig.tagText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
