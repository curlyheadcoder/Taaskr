import React from 'react';
import { 
  StyleSheet, Text, TouchableOpacity, ActivityIndicator, 
  ViewStyle, TextStyle, StyleProp, View 
} from 'react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const { isDark } = useTheme();

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: tokens.colors.brand.primary,
            borderWidth: 0,
          },
          text: {
            color: tokens.colors.brand.onPrimary,
            fontWeight: '700',
          },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: isDark ? tokens.colors.dark.bgSubtle : tokens.colors.light.bgSubtle,
            borderWidth: 0,
          },
          text: {
            color: isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary,
            fontWeight: '600',
          },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: isDark ? tokens.colors.dark.borderMedium : tokens.colors.light.borderMedium,
          },
          text: {
            color: isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary,
            fontWeight: '600',
          },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 0,
          },
          text: {
            color: tokens.colors.brand.primary,
            fontWeight: '600',
          },
        };
      case 'danger':
        return {
          container: {
            backgroundColor: tokens.colors.status.errorBg,
            borderWidth: 1,
            borderColor: tokens.colors.status.error,
          },
          text: {
            color: tokens.colors.status.error,
            fontWeight: '700',
          },
        };
      default:
        return {
          container: { backgroundColor: tokens.colors.brand.primary },
          text: { color: '#000', fontWeight: '700' },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            height: 36,
            paddingHorizontal: tokens.spacing.md,
            borderRadius: tokens.radii.sm,
          },
          text: {
            fontSize: tokens.typography.bodySm.fontSize,
            lineHeight: tokens.typography.bodySm.lineHeight,
          },
        };
      case 'lg':
        return {
          container: {
            height: 52,
            paddingHorizontal: tokens.spacing.xl,
            borderRadius: tokens.radii.md,
          },
          text: {
            fontSize: tokens.typography.button.fontSize,
            lineHeight: tokens.typography.button.lineHeight,
          },
        };
      case 'md':
      default:
        return {
          container: {
            height: 44,
            paddingHorizontal: tokens.spacing.lg,
            borderRadius: tokens.radii.md,
          },
          text: {
            fontSize: tokens.typography.body.fontSize,
            lineHeight: tokens.typography.body.lineHeight,
          },
        };
    }
  };

  const variantStyle = getVariantStyles();
  const sizeStyle = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.base,
        sizeStyle.container,
        variantStyle.container,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? tokens.colors.brand.onPrimary : tokens.colors.brand.primary}
        />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
          <Text style={[sizeStyle.text, variantStyle.text, textStyle]}>{title}</Text>
          {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: tokens.spacing.sm,
  },
  iconRight: {
    marginLeft: tokens.spacing.sm,
  },
});
