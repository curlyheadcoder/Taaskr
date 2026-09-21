// Taaskr Mobile Design Tokens
// Centralized token system for spacing, typography, colors, radii, and elevations.

export const tokens = {
  // Color Palette
  colors: {
    brand: {
      primary: '#F59E0B',        // Electric Amber Accent
      primaryHover: '#D97706',
      primaryLight: '#FBBF24',
      primaryMuted: 'rgba(245, 158, 11, 0.12)',
      onPrimary: '#000000',
    },
    accent: {
      indigo: '#6366F1',
      blue: '#3B82F6',
      emerald: '#10B981',
      cyan: '#06B6D4',
      crimson: '#EF4444',
    },
    // Dark Theme Semantic Roles
    dark: {
      bgPage: '#0B0F17',
      bgSurface: '#131B2E',
      bgElevated: '#1E293B',
      bgSubtle: '#1F2937',
      borderSubtle: 'rgba(255, 255, 255, 0.08)',
      borderMedium: 'rgba(255, 255, 255, 0.16)',
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
    },
    // Light Theme Semantic Roles
    light: {
      bgPage: '#F8FAFC',
      bgSurface: '#FFFFFF',
      bgElevated: '#F1F5F9',
      bgSubtle: '#E2E8F0',
      borderSubtle: 'rgba(15, 23, 42, 0.08)',
      borderMedium: 'rgba(15, 23, 42, 0.16)',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#94A3B8',
    },
    // Status Colors
    status: {
      success: '#10B981',
      successBg: 'rgba(16, 185, 129, 0.12)',
      warning: '#F59E0B',
      warningBg: 'rgba(245, 158, 11, 0.12)',
      error: '#EF4444',
      errorBg: 'rgba(239, 68, 68, 0.12)',
      info: '#3B82F6',
      infoBg: 'rgba(59, 130, 246, 0.12)',
      neutral: '#64748B',
      neutralBg: 'rgba(100, 116, 139, 0.12)',
    }
  },

  // Typography Hierarchy
  typography: {
    display: { fontSize: 32, lineHeight: 38, fontWeight: '800' as const },
    h1: { fontSize: 24, lineHeight: 30, fontWeight: '800' as const },
    h2: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
    h3: { fontSize: 16, lineHeight: 22, fontWeight: '700' as const },
    bodyLg: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
    body: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
    bodySm: { fontSize: 12, lineHeight: 18, fontWeight: '400' as const },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
    button: { fontSize: 15, lineHeight: 20, fontWeight: '700' as const },
  },

  // Spacing Scale
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
  },

  // Radius Tokens
  radii: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    pill: 9999,
  },

  // Elevation / Shadows
  elevation: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    }
  }
};

export type Tokens = typeof tokens;
