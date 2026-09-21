import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, Navigation, Clock, MapPin } from 'lucide-react-native';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { Booking } from '../../types';

export interface BookingConfirmationStepProps {
  booking: Booking;
  onTrackBooking: (bookingId: number) => void;
  onViewMyBookings: () => void;
}

export const BookingConfirmationStep: React.FC<BookingConfirmationStepProps> = ({
  booking,
  onTrackBooking,
  onViewMyBookings,
}) => {
  const { isDark } = useTheme();

  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const subColor = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;

  return (
    <View style={styles.container}>
      {/* Success Icon */}
      <View style={styles.iconWrapper}>
        <CheckCircle2 size={64} color={tokens.colors.status.success} />
      </View>

      <Text style={[styles.title, { color: textColor }]}>Booking Confirmed!</Text>
      <Text style={[styles.sub, { color: subColor }]}>
        Your order has been placed successfully and dispatch is active.
      </Text>

      {/* Confirmed Booking Summary Card */}
      <Card elevation="sm" style={styles.card} padding={tokens.spacing.lg}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.codeText, { color: tokens.colors.brand.primary }]}>
              #{booking.bookingCode || booking.id}
            </Text>
            <Text style={[styles.serviceName, { color: textColor }]}>
              {booking.serviceName}
            </Text>
          </View>
          <Badge label={booking.status || 'CONFIRMED'} variant="success" />
        </View>

        <View style={styles.detailsList}>
          <View style={styles.detailRow}>
            <Clock size={14} color={subColor} />
            <Text style={[styles.detailText, { color: subColor }]}>
              {booking.bookingDate} at {booking.startTime}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MapPin size={14} color={subColor} />
            <Text style={[styles.detailText, { color: subColor }]} numberOfLines={1}>
              {booking.address}, {booking.city}
            </Text>
          </View>
        </View>

        <View style={[
          styles.fareDivider,
          { borderTopColor: isDark ? tokens.colors.dark.borderSubtle : tokens.colors.light.borderSubtle }
        ]}>
          <Text style={[styles.fareLabel, { color: subColor }]}>Amount Paid / Payable</Text>
          <Text style={[styles.fareVal, { color: tokens.colors.brand.primary }]}>
            ₹{booking.finalAmount || booking.totalAmount}
          </Text>
        </View>
      </Card>

      {/* Action Buttons */}
      <View style={styles.buttonCol}>
        <Button
          title="Track Live Dispatch"
          variant="primary"
          size="lg"
          leftIcon={<Navigation size={18} color={tokens.colors.brand.onPrimary} />}
          onPress={() => onTrackBooking(booking.id)}
          fullWidth
        />

        <Button
          title="View All My Bookings"
          variant="outline"
          size="lg"
          onPress={onViewMyBookings}
          fullWidth
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.xl,
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: tokens.spacing.md,
  },
  title: {
    fontSize: tokens.typography.display.fontSize,
    lineHeight: tokens.typography.display.lineHeight,
    fontWeight: tokens.typography.display.fontWeight,
    textAlign: 'center',
  },
  sub: {
    fontSize: tokens.typography.body.fontSize,
    textAlign: 'center',
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.spacing.xl,
  },
  card: {
    width: '100%',
    marginBottom: tokens.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.md,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  serviceName: {
    fontSize: tokens.typography.h2.fontSize,
    fontWeight: tokens.typography.h2.fontWeight,
    marginTop: 2,
  },
  detailsList: {
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  detailText: {
    fontSize: tokens.typography.bodySm.fontSize,
  },
  fareDivider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: tokens.spacing.md,
    borderTopWidth: 1,
  },
  fareLabel: {
    fontSize: tokens.typography.bodySm.fontSize,
  },
  fareVal: {
    fontSize: tokens.typography.h2.fontSize,
    fontWeight: '800',
  },
  buttonCol: {
    width: '100%',
    gap: tokens.spacing.md,
  },
});
