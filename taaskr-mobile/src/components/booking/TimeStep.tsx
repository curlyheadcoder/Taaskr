import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Zap, Calendar, Clock } from 'lucide-react-native';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

export type DispatchMode = 'IMMEDIATE' | 'SCHEDULED';

export interface TimeStepProps {
  dispatchMode: DispatchMode;
  date: string;
  startTime: string;
  onDispatchModeChange: (mode: DispatchMode) => void;
  onDateChange: (val: string) => void;
  onStartTimeChange: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const TimeStep: React.FC<TimeStepProps> = ({
  dispatchMode,
  date,
  startTime,
  onDispatchModeChange,
  onDateChange,
  onStartTimeChange,
  onNext,
  onBack,
}) => {
  const { isDark } = useTheme();

  const quickDates = [
    { label: 'Today', val: new Date().toISOString().split('T')[0] },
    { label: 'Tomorrow', val: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
    { label: 'In 2 Days', val: new Date(Date.now() + 172800000).toISOString().split('T')[0] }
  ];

  const timeSlots = ['09:00', '11:00', '14:00', '16:00', '18:00'];

  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const subColor = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;

  return (
    <View style={styles.container}>
      <Text style={[styles.stepTitle, { color: textColor }]}>3. Choose Service Time</Text>
      <Text style={[styles.stepSub, { color: subColor }]}>
        Select instant dispatch or schedule a convenient appointment slot.
      </Text>

      {/* Dispatch Option Selector Cards */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[
            styles.modeCard,
            { backgroundColor: isDark ? tokens.colors.dark.bgSurface : tokens.colors.light.bgSurface },
            dispatchMode === 'IMMEDIATE' && styles.modeCardActive
          ]}
          onPress={() => {
            onDispatchModeChange('IMMEDIATE');
            onDateChange(new Date().toISOString().split('T')[0]);
            const now = new Date();
            now.setMinutes(now.getMinutes() + 15);
            onStartTimeChange(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
          }}
          activeOpacity={0.8}
        >
          <Zap size={24} color={dispatchMode === 'IMMEDIATE' ? tokens.colors.brand.primary : subColor} />
          <Text style={[styles.modeTitle, { color: textColor }]}>Immediate</Text>
          <Text style={[styles.modeSub, { color: subColor }]}>Fastest partner (~15m)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeCard,
            { backgroundColor: isDark ? tokens.colors.dark.bgSurface : tokens.colors.light.bgSurface },
            dispatchMode === 'SCHEDULED' && styles.modeCardActive
          ]}
          onPress={() => onDispatchModeChange('SCHEDULED')}
          activeOpacity={0.8}
        >
          <Calendar size={24} color={dispatchMode === 'SCHEDULED' ? tokens.colors.brand.primary : subColor} />
          <Text style={[styles.modeTitle, { color: textColor }]}>Schedule</Text>
          <Text style={[styles.modeSub, { color: subColor }]}>Pick Date & Time</Text>
        </TouchableOpacity>
      </View>

      {/* Immediate Mode Banner */}
      {dispatchMode === 'IMMEDIATE' ? (
        <Card elevation="none" style={styles.immediateBox} padding={tokens.spacing.md}>
          <Text style={styles.immediateText}>
            ⚡ Immediate dispatch selected: Nearest available partner will be assigned today ({date}) at approximately {startTime}.
          </Text>
        </Card>
      ) : (
        /* Scheduled Mode Date & Time Picker */
        <Card elevation="none" style={styles.scheduleBox} padding={tokens.spacing.lg}>
          <Text style={[styles.label, { color: subColor }]}>Select Date</Text>
          <View style={styles.chipRow}>
            {quickDates.map(d => (
              <TouchableOpacity
                key={d.val}
                style={[
                  styles.chip,
                  { backgroundColor: isDark ? tokens.colors.dark.bgSubtle : tokens.colors.light.bgSubtle },
                  date === d.val && styles.chipActive
                ]}
                onPress={() => onDateChange(d.val)}
              >
                <Text style={[
                  styles.chipText,
                  { color: date === d.val ? tokens.colors.brand.onPrimary : subColor }
                ]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input
            value={date}
            onChangeText={onDateChange}
            placeholder="YYYY-MM-DD"
          />

          <Text style={[styles.label, { color: subColor, marginTop: tokens.spacing.md }]}>Select Start Time Slot</Text>
          <View style={styles.chipRow}>
            {timeSlots.map(t => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.chip,
                  { backgroundColor: isDark ? tokens.colors.dark.bgSubtle : tokens.colors.light.bgSubtle },
                  startTime === t && styles.chipActive
                ]}
                onPress={() => onStartTimeChange(t)}
              >
                <Text style={[
                  styles.chipText,
                  { color: startTime === t ? tokens.colors.brand.onPrimary : subColor }
                ]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      )}

      {/* Navigation Buttons */}
      <View style={styles.buttonRow}>
        <View style={{ flex: 1 }}>
          <Button
            title="Back"
            variant="secondary"
            size="lg"
            onPress={onBack}
            fullWidth
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Review Order"
            variant="primary"
            size="lg"
            onPress={onNext}
            fullWidth
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
  },
  stepTitle: {
    fontSize: tokens.typography.h2.fontSize,
    lineHeight: tokens.typography.h2.lineHeight,
    fontWeight: tokens.typography.h2.fontWeight,
  },
  stepSub: {
    fontSize: tokens.typography.bodySm.fontSize,
    marginTop: 4,
    marginBottom: tokens.spacing.lg,
  },
  modeRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  modeCard: {
    flex: 1,
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  modeCardActive: {
    borderColor: tokens.colors.brand.primary,
    backgroundColor: tokens.colors.brand.primaryMuted,
  },
  modeTitle: {
    fontSize: tokens.typography.bodyLg.fontSize,
    fontWeight: '700',
    marginTop: tokens.spacing.xs,
  },
  modeSub: {
    fontSize: tokens.typography.caption.fontSize,
    marginTop: 2,
  },
  immediateBox: {
    backgroundColor: tokens.colors.status.successBg,
    borderColor: tokens.colors.status.success,
    borderWidth: 1,
    marginBottom: tokens.spacing.xl,
  },
  immediateText: {
    color: tokens.colors.status.success,
    fontSize: tokens.typography.bodySm.fontSize,
    fontWeight: '600',
  },
  scheduleBox: {
    marginBottom: tokens.spacing.xl,
  },
  label: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '600',
    marginBottom: tokens.spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.sm,
  },
  chip: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radii.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: tokens.colors.brand.primary,
    borderColor: tokens.colors.brand.primary,
  },
  chipText: {
    fontSize: tokens.typography.bodySm.fontSize,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.md,
  },
});
