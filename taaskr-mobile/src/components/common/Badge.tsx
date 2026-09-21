import React from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
  style,
  textStyle,
}) => {
  const { isDark } = useTheme();

  const getVariantStyles = (): { bg: string; border: string; text: string } => {
    switch (variant) {
      case 'success':
        return {
          bg: tokens.colors.status.successBg,
          border: 'rgba(16, 185, 129, 0.3)',
          text: tokens.colors.status.success,
        };
      case 'warning':
        return {
          bg: tokens.colors.status.warningBg,
          border: 'rgba(245, 158, 11, 0.3)',
          text: tokens.colors.brand.primary,
        };
      case 'error':
        return {
          bg: tokens.colors.status.errorBg,
          border: 'rgba(239, 68, 68, 0.3)',
          text: tokens.colors.status.error,
        };
      case 'info':
        return {
          bg: tokens.colors.status.infoBg,
          border: 'rgba(59, 130, 246, 0.3)',
          text: tokens.colors.status.info,
        };
      case 'neutral':
      default:
        return {
          bg: isDark ? tokens.colors.dark.bgSubtle : tokens.colors.light.bgSubtle,
          border: isDark ? tokens.colors.dark.borderSubtle : tokens.colors.light.borderSubtle,
          text: isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary,
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <View style={[
      styles.container,
      { backgroundColor: vStyles.bg, borderColor: vStyles.border },
      style,
    ]}>
      {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
      <Text style={[styles.text, { color: vStyles.text }, textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radii.pill,
    borderWidth: 1,
  },
  iconWrapper: {
    marginRight: 4,
  },
  text: {
    fontSize: tokens.typography.caption.fontSize,
    lineHeight: tokens.typography.caption.lineHeight,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
