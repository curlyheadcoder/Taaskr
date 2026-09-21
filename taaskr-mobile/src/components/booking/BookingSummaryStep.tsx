import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CreditCard, DollarSign, ShieldCheck } from 'lucide-react-native';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { ServiceItem, PaymentMethod } from '../../types';

export interface BookingSummaryStepProps {
  service: ServiceItem;
  address: string;
  city: string;
  pincode: string;
  dispatchMode: 'IMMEDIATE' | 'SCHEDULED';
  date: string;
  startTime: string;
  notes: string;
  paymentMethod: PaymentMethod;
  submitting: boolean;
  onNotesChange: (val: string) => void;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export const BookingSummaryStep: React.FC<BookingSummaryStepProps> = ({
  service,
  address,
  city,
  pincode,
  dispatchMode,
  date,
  startTime,
  notes,
  paymentMethod,
  submitting,
  onNotesChange,
  onPaymentMethodChange,
  onConfirm,
  onBack,
}) => {
  const { isDark } = useTheme();

  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const subColor = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;

  return (
    <View style={styles.container}>
      <Text style={[styles.stepTitle, { color: textColor }]}>4. Review & Confirm</Text>
      <Text style={[styles.stepSub, { color: subColor }]}>
        Verify your booking summary before confirming.
      </Text>

      {/* Order Summary Card */}
      <Card elevation="sm" style={styles.summaryCard} padding={tokens.spacing.lg}>
        <Text style={[styles.sectionHeading, { color: textColor }]}>Order Summary</Text>

        <View style={styles.summaryRow}>
          <Text style={[styles.label, { color: subColor }]}>Service</Text>
          <Text style={[styles.valText, { color: textColor }]}>{service.name}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={[styles.label, { color: subColor }]}>Dispatch</Text>
          <Text style={[styles.valText, { color: textColor }]}>
            {dispatchMode === 'IMMEDIATE' ? '⚡ Immediate (~15m)' : `📅 Scheduled (${date})`}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={[styles.label, { color: subColor }]}>Start Time</Text>
          <Text style={[styles.valText, { color: textColor }]}>{startTime}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={[styles.label, { color: subColor }]}>Location</Text>
          <Text style={[styles.valText, { color: textColor }]} numberOfLines={1}>
            {address}, {city} ({pincode})
          </Text>
        </View>

        <View style={[
          styles.totalDivider,
          { borderTopColor: isDark ? tokens.colors.dark.borderSubtle : tokens.colors.light.borderSubtle }
        ]}>
          <Text style={[styles.totalLabel, { color: subColor }]}>Total Fare</Text>
          <Text style={[styles.totalValue, { color: tokens.colors.brand.primary }]}>
            ₹{service.price}
          </Text>
        </View>
      </Card>

      {/* Special Notes Input */}
      <Input
        label="Additional Instructions (Optional)"
        placeholder="E.g. Ring doorbell twice, ask for Sharma..."
        value={notes}
        onChangeText={onNotesChange}
      />

      {/* Payment Options */}
      <Text style={[styles.sectionHeading, { color: textColor, marginTop: tokens.spacing.md, marginBottom: tokens.spacing.xs }]}>
        Payment Method
      </Text>

      <View style={styles.paymentRow}>
        <TouchableOpacity
          style={[
            styles.paymentOption,
            { backgroundColor: isDark ? tokens.colors.dark.bgSurface : tokens.colors.light.bgSurface },
            paymentMethod === 'AFTER_SERVICE' && styles.paymentOptionActive
          ]}
          onPress={() => onPaymentMethodChange('AFTER_SERVICE')}
          activeOpacity={0.8}
        >
          <DollarSign size={20} color={paymentMethod === 'AFTER_SERVICE' ? tokens.colors.brand.primary : subColor} />
          <Text style={[
            styles.paymentText,
            { color: paymentMethod === 'AFTER_SERVICE' ? tokens.colors.brand.primary : textColor }
          ]}>
            Pay After Service
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.paymentOption,
            { backgroundColor: isDark ? tokens.colors.dark.bgSurface : tokens.colors.light.bgSurface },
            paymentMethod === 'ONLINE' && styles.paymentOptionActive
          ]}
          onPress={() => onPaymentMethodChange('ONLINE')}
          activeOpacity={0.8}
        >
          <CreditCard size={20} color={paymentMethod === 'ONLINE' ? tokens.colors.brand.primary : subColor} />
          <Text style={[
            styles.paymentText,
            { color: paymentMethod === 'ONLINE' ? tokens.colors.brand.primary : textColor }
          ]}>
            Online / UPI
          </Text>
        </TouchableOpacity>
      </View>

      {/* Navigation & Submit Buttons */}
      <View style={styles.buttonRow}>
        <View style={{ flex: 1 }}>
          <Button
            title="Back"
            variant="secondary"
            size="lg"
            disabled={submitting}
            onPress={onBack}
            fullWidth
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title={submitting ? 'Confirming...' : `Confirm Booking (₹${service.price})`}
            variant="primary"
            size="lg"
            loading={submitting}
            disabled={submitting}
            onPress={onConfirm}
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
  summaryCard: {
    marginBottom: tokens.spacing.lg,
  },
  sectionHeading: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: tokens.typography.h3.fontWeight,
    marginBottom: tokens.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  label: {
    fontSize: tokens.typography.bodySm.fontSize,
  },
  valText: {
    fontSize: tokens.typography.bodySm.fontSize,
    fontWeight: '600',
    maxWidth: '65%',
    textAlign: 'right',
  },
  totalDivider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: tokens.typography.bodyLg.fontSize,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: tokens.typography.h1.fontSize,
    fontWeight: '800',
  },
  paymentRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: tokens.spacing.xs,
  },
  paymentOptionActive: {
    borderColor: tokens.colors.brand.primary,
    backgroundColor: tokens.colors.brand.primaryMuted,
  },
  paymentText: {
    fontSize: tokens.typography.bodySm.fontSize,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
  },
});
