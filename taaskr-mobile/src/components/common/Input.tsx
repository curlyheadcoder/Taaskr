import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TextInputProps, 
  StyleProp, ViewStyle, TextStyle 
} from 'react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...restProps
}) => {
  const { isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const borderColor = error
    ? tokens.colors.status.error
    : isFocused
    ? tokens.colors.brand.primary
    : isDark
    ? tokens.colors.dark.borderMedium
    : tokens.colors.light.borderMedium;

  const bgColor = isDark ? tokens.colors.dark.bgSubtle : tokens.colors.light.bgSubtle;
  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const placeholderColor = isDark ? tokens.colors.dark.textMuted : tokens.colors.light.textMuted;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[
          styles.label, 
          { color: isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary }
        ]}>
          {label}
        </Text>
      ) : null}

      <View style={[
        styles.inputWrapper,
        {
          backgroundColor: bgColor,
          borderColor: borderColor,
        }
      ]}>
        {leftIcon ? <View style={styles.leftIconWrapper}>{leftIcon}</View> : null}

        <TextInput
          style={[
            styles.textInput,
            { color: textColor },
            inputStyle
          ]}
          placeholderTextColor={placeholderColor}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...restProps}
        />

        {rightIcon ? <View style={styles.rightIconWrapper}>{rightIcon}</View> : null}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={[
          styles.helperText,
          { color: isDark ? tokens.colors.dark.textMuted : tokens.colors.light.textMuted }
        ]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
  },
  label: {
    fontSize: tokens.typography.caption.fontSize,
    lineHeight: tokens.typography.caption.lineHeight,
    fontWeight: tokens.typography.caption.fontWeight,
    marginBottom: tokens.spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.md,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight,
    paddingVertical: tokens.spacing.sm,
  },
  leftIconWrapper: {
    marginRight: tokens.spacing.sm,
  },
  rightIconWrapper: {
    marginLeft: tokens.spacing.sm,
  },
  errorText: {
    fontSize: tokens.typography.bodySm.fontSize,
    color: tokens.colors.status.error,
    marginTop: tokens.spacing.xs,
  },
  helperText: {
    fontSize: tokens.typography.bodySm.fontSize,
    marginTop: tokens.spacing.xs,
  },
});
