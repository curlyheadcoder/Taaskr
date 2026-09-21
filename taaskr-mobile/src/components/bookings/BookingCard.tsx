import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { Booking, BookingStatus } from '../../types';
import { Card } from '../common/Card';
import { Badge, BadgeVariant } from '../common/Badge';
import { Button } from '../common/Button';
import { 
  Calendar, MapPin, UserCheck, Navigation, 
  XCircle, Star 
} from 'lucide-react-native';

interface BookingCardProps {
  booking: Booking;
  onTrack?: (bookingId: number) => void;
  onCancel?: (bookingId: number) => void;
  onRate?: (booking: Booking) => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onTrack,
  onCancel,
  onRate,
}) => {
  const { isDark } = useTheme();

  // Helper to map status to semantic BadgeVariant
  const getBadgeVariant = (status: BookingStatus): BadgeVariant => {
    switch (status) {
      case 'COMPLETED':
      case 'WORK_COMPLETED':
      case 'PAYMENT_COMPLETED':
      case 'PROVIDER_APPROVED':
        return 'success';
      case 'ON_THE_WAY':
      case 'IN_TRANSIT':
      case 'ARRIVED':
      case 'WORK_STARTED':
      case 'IN_PROGRESS':
        return 'info';
      case 'CANCELLED':
      case 'REJECTED':
        return 'error';
      case 'PENDING':
      case 'ASSIGNED':
      case 'PARTNER_ASSIGNED':
      case 'PARTNER_ACCEPTED':
      case 'ACCEPTED':
      default:
        return 'warning';
    }
  };

  const isTrackable = [
    'ASSIGNED',
    'PARTNER_ASSIGNED',
    'PARTNER_ACCEPTED',
    'ON_THE_WAY',
    'ARRIVED',
    'WORK_STARTED',
    'IN_PROGRESS',
    'IN_TRANSIT',
  ].includes(booking.status);

  const isCancellable = ['PENDING', 'ASSIGNED', 'ACCEPTED'].includes(booking.status);
  const isCompleted = ['COMPLETED', 'WORK_COMPLETED'].includes(booking.status);
  const isRated = typeof booking.rating === 'number' && booking.rating > 0;

  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const secondaryText = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;
  const borderSubtle = isDark ? tokens.colors.dark.borderSubtle : tokens.colors.light.borderSubtle;

  const partnerName = booking.servicePartnerName || booking.providerName;
  const displayPrice = booking.finalAmount || booking.totalAmount;

  return (
    <Card elevation="sm" style={styles.cardContainer}>
      {/* Header Row: Service Name + Booking Code + Status Badge */}
      <View style={styles.headerRow}>
        <View style={styles.titleArea}>
          <Text style={[styles.bookingCode, { color: tokens.colors.brand.primary }]}>
            #{booking.bookingCode || booking.id}
          </Text>
          <Text style={[styles.serviceName, { color: textColor }]} numberOfLines={1}>
            {booking.serviceName}
          </Text>
        </View>
        <Badge
          label={booking.status.replace(/_/g, ' ')}
          variant={getBadgeVariant(booking.status)}
        />
      </View>

      {/* Details Row: Date, Time, Location, Provider */}
      <View style={[styles.detailsContainer, { borderColor: borderSubtle }]}>
        {/* Date & Time */}
        <View style={styles.detailRow}>
          <Calendar size={15} color={secondaryText} style={styles.detailIcon} />
          <Text style={[styles.detailText, { color: secondaryText }]}>
            {booking.bookingDate} {booking.startTime ? `at ${booking.startTime}` : ''}
          </Text>
        </View>

        {/* Address */}
        <View style={styles.detailRow}>
          <MapPin size={15} color={secondaryText} style={styles.detailIcon} />
          <Text style={[styles.detailText, { color: secondaryText }]} numberOfLines={2}>
            {booking.address}, {booking.city} {booking.pincode ? `(${booking.pincode})` : ''}
          </Text>
        </View>

        {/* Partner Info if available */}
        {partnerName ? (
          <View style={styles.detailRow}>
            <UserCheck size={15} color={tokens.colors.brand.primary} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: textColor, fontWeight: '600' }]}>
              Provider: {partnerName}
            </Text>
          </View>
        ) : null}

        {/* Rating Display if rated */}
        {isRated ? (
          <View style={styles.detailRow}>
            <Star size={15} color={tokens.colors.brand.primary} fill={tokens.colors.brand.primary} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: textColor, fontWeight: '700' }]}>
              Rated {booking.rating}/5 {booking.review ? `— "${booking.review}"` : ''}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Footer Row: Price + Primary Actions */}
      <View style={styles.footerRow}>
        <View style={styles.priceArea}>
          <Text style={[styles.priceLabel, { color: secondaryText }]}>Total Amount</Text>
          <Text style={[styles.priceValue, { color: textColor }]}>₹{displayPrice}</Text>
        </View>

        <View style={styles.actionButtons}>
          {isTrackable && onTrack ? (
            <Button
              title="Track Live"
              variant="primary"
              size="sm"
              leftIcon={<Navigation size={14} color="#000" />}
              onPress={() => onTrack(booking.id)}
            />
          ) : null}

          {isCancellable && onCancel ? (
            <Button
              title="Cancel"
              variant="danger"
              size="sm"
              leftIcon={<XCircle size={14} color={tokens.colors.status.error} />}
              onPress={() => onCancel(booking.id)}
            />
          ) : null}

          {isCompleted && !isRated && onRate ? (
            <Button
              title="Rate Service"
              variant="outline"
              size="sm"
              leftIcon={<Star size={14} color={tokens.colors.brand.primary} />}
              onPress={() => onRate(booking)}
            />
          ) : null}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: tokens.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.md,
  },
  titleArea: {
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  bookingCode: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  serviceName: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: '700',
    marginTop: 2,
  },
  detailsContainer: {
    paddingVertical: tokens.spacing.sm,
    gap: tokens.spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: tokens.spacing.xs,
  },
  detailText: {
    fontSize: tokens.typography.bodySm.fontSize,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: tokens.spacing.md,
  },
  priceArea: {
    justifyContent: 'center',
  },
  priceLabel: {
    fontSize: tokens.typography.caption.fontSize,
  },
  priceValue: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: '800',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    alignItems: 'center',
  },
});
