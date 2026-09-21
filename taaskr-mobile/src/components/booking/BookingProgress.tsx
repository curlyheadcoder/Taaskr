import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

export interface BookingProgressProps {
  currentStep: number; // 1, 2, 3, 4, 5
  totalSteps?: number;
}

const STEP_LABELS = ['Service', 'Location', 'Time', 'Summary'];

export const BookingProgress: React.FC<BookingProgressProps> = ({
  currentStep,
  totalSteps = 4,
}) => {
  const { isDark } = useTheme();

  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const subColor = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;

  if (currentStep > 4) return null; // Step 5 is Confirmation screen

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {STEP_LABELS.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <React.Fragment key={label}>
              <View style={styles.stepItem}>
                <View style={[
                  styles.dot,
                  isActive && styles.dotActive,
                  isCompleted && styles.dotCompleted,
                  !isActive && !isCompleted && {
                    backgroundColor: isDark ? tokens.colors.dark.bgSubtle : tokens.colors.light.bgSubtle
                  }
                ]}>
                  <Text style={[
                    styles.dotText,
                    (isActive || isCompleted) && { color: tokens.colors.brand.onPrimary },
                    !isActive && !isCompleted && { color: subColor }
                  ]}>
                    {isCompleted ? '✓' : String(stepNum)}
                  </Text>
                </View>
                <Text style={[
                  styles.label,
                  isActive && { color: tokens.colors.brand.primary, fontWeight: '700' },
                  !isActive && { color: subColor }
                ]}>
                  {label}
                </Text>
              </View>

              {idx < STEP_LABELS.length - 1 ? (
                <View style={[
                  styles.line,
                  isCompleted && { backgroundColor: tokens.colors.brand.primary },
                  !isCompleted && {
                    backgroundColor: isDark ? tokens.colors.dark.borderSubtle : tokens.colors.light.borderSubtle
                  }
                ]} />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dotActive: {
    backgroundColor: tokens.colors.brand.primary,
  },
  dotCompleted: {
    backgroundColor: tokens.colors.brand.primary,
  },
  dotText: {
    fontSize: 11,
    fontWeight: '800',
  },
  label: {
    fontSize: 10,
  },
  line: {
    flex: 1,
    height: 2,
    marginTop: -14,
    marginHorizontal: 4,
  },
});
