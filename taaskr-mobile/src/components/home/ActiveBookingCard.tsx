import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Clock, MapPin, Navigation, UserCheck } from 'lucide-react-native';
import { Card } from '../common/Card';
import { Badge, BadgeVariant } from '../common/Badge';
import { Button } from '../common/Button';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { Booking } from '../../types';

export interface ActiveBookingCardProps {
  booking: Booking;
  onTrackPress: (bookingId: number) => void;
}

export const ActiveBookingCard: React.FC<ActiveBookingCardProps> = ({
  booking,
  onTrackPress,
}) => {
  const { isDark } = useTheme();

  const getStatusBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'COMPLETED':
      case 'WORK_COMPLETED':
        return 'success';
      case 'ON_THE_WAY':
      case 'IN_TRANSIT':
      case 'ARRIVED':
      case 'WORK_STARTED':
        return 'info';
      case 'CANCELLED':
      case 'REJECTED':
        return 'error';
      default:
        return 'warning';
    }
  };

  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const subColor = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;

  return (
    <Card 
      elevation="sm" 
      style={styles.card}
      padding={tokens.spacing.lg}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <Text style={[styles.codeText, { color: tokens.colors.brand.primary }]}>
            #{booking.bookingCode || booking.id}
          </Text>
          <Text style={[styles.serviceName, { color: textColor }]} numberOfLines={1}>
            {booking.serviceName}
          </Text>
        </View>

        <Badge 
          label={booking.status.replace(/_/g, ' ')} 
          variant={getStatusBadgeVariant(booking.status)} 
        />
      </View>

      <View style={styles.detailsList}>
        <View style={styles.detailRow}>
          <Clock size={14} color={subColor} />
          <Text style={[styles.detailText, { color: subColor }]}>
            {booking.bookingDate} • {booking.startTime}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <MapPin size={14} color={subColor} />
          <Text style={[styles.detailText, { color: subColor }]} numberOfLines={1}>
            {booking.address}, {booking.city}
          </Text>
        </View>

        {booking.servicePartnerName ? (
          <View style={styles.detailRow}>
            <UserCheck size={14} color={tokens.colors.status.success} />
            <Text style={[styles.detailText, { color: tokens.colors.status.success }]}>
              Technician: {booking.servicePartnerName}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actionRow}>
        <Button
          title="Track Live"
          variant="primary"
          size="sm"
          leftIcon={<Navigation size={14} color={tokens.colors.brand.onPrimary} />}
          onPress={() => onTrackPress(booking.id)}
          fullWidth
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.md,
  },
  titleWrapper: {
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  codeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  serviceName: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: tokens.typography.h3.fontWeight,
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
  actionRow: {
    marginTop: tokens.spacing.xs,
  },
});
