import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

export interface HeaderBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
  style,
}) => {
  const { isDark } = useTheme();

  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const subColor = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;
  const iconColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftRow}>
        {onBack ? (
          <TouchableOpacity 
            onPress={onBack} 
            style={styles.backButton}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ArrowLeft size={22} color={iconColor} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: subColor }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {rightAction ? (
        <View style={styles.rightContainer}>
          {rightAction}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: tokens.spacing.xl,
    paddingBottom: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: tokens.spacing.xs,
    marginRight: tokens.spacing.sm,
    marginLeft: -tokens.spacing.xs,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: tokens.typography.h2.fontSize,
    lineHeight: tokens.typography.h2.lineHeight,
    fontWeight: tokens.typography.h2.fontWeight,
  },
  subtitle: {
    fontSize: tokens.typography.bodySm.fontSize,
    lineHeight: tokens.typography.bodySm.lineHeight,
    marginTop: 2,
  },
  rightContainer: {
    marginLeft: tokens.spacing.md,
  },
});
