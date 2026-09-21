import { tokens } from './tokens';

// Taaskr Mobile Theme Colors (Linked to Centralized Tokens)

export const colors = {
  // Brand & Primary Colors
  primary: tokens.colors.brand.primary,        // Electric Amber Accent
  primaryDark: tokens.colors.brand.primaryHover,
  primaryLight: tokens.colors.brand.primaryLight,
  primarySubtle: tokens.colors.brand.primaryMuted,

  // Secondary Accents
  accentIndigo: tokens.colors.accent.indigo,
  accentBlue: tokens.colors.accent.blue,
  accentEmerald: tokens.colors.accent.emerald,

  // Dark Mode Palette
  dark: {
    bgPage: tokens.colors.dark.bgPage,
    bgCard: tokens.colors.dark.bgSurface,
    bgSubtle: tokens.colors.dark.bgSubtle,
    borderLight: tokens.colors.dark.borderMedium,
    borderSubtle: tokens.colors.dark.borderSubtle,
    textMain: tokens.colors.dark.textPrimary,
    textMuted: tokens.colors.dark.textSecondary,
    textSubtle: tokens.colors.dark.textMuted,
  },

  // Light Mode Palette
  light: {
    bgPage: tokens.colors.light.bgPage,
    bgCard: tokens.colors.light.bgSurface,
    bgSubtle: tokens.colors.light.bgSubtle,
    borderLight: tokens.colors.light.borderMedium,
    borderSubtle: tokens.colors.light.borderSubtle,
    textMain: tokens.colors.light.textPrimary,
    textMuted: tokens.colors.light.textSecondary,
    textSubtle: tokens.colors.light.textMuted,
  },

  // Status Badge Colors
  status: {
    success: tokens.colors.status.success,
    successBg: tokens.colors.status.successBg,
    warning: tokens.colors.status.warning,
    warningBg: tokens.colors.status.warningBg,
    error: tokens.colors.status.error,
    errorBg: tokens.colors.status.errorBg,
    info: tokens.colors.status.info,
    infoBg: tokens.colors.status.infoBg,
  }
};

