import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MapPin, Bell, User as UserIcon, ChevronDown } from 'lucide-react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { User, Address } from '../../types';

export interface HomeHeaderProps {
  user: User | null;
  defaultAddress?: Address | null;
  unreadCount?: number;
  onLocationPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  user,
  defaultAddress,
  unreadCount = 0,
  onLocationPress,
  onNotificationPress,
  onProfilePress,
}) => {
  const { isDark } = useTheme();

  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const subColor = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;
  const iconColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;

  const locationText = defaultAddress
    ? `${defaultAddress.label || 'Home'} - ${defaultAddress.city || defaultAddress.addressLine}`
    : 'Select your location';

  return (
    <View style={styles.container}>
      {/* Left Location Selector */}
      <TouchableOpacity 
        style={styles.locationContainer} 
        onPress={onLocationPress}
        activeOpacity={0.7}
      >
        <View style={styles.pinWrapper}>
          <MapPin size={18} color={tokens.colors.brand.primary} />
        </View>
        <View style={styles.locationTextWrapper}>
          <Text style={[styles.locationLabel, { color: subColor }]}>Deliver to</Text>
          <View style={styles.locationRow}>
            <Text style={[styles.locationValue, { color: textColor }]} numberOfLines={1}>
              {locationText}
            </Text>
            <ChevronDown size={14} color={subColor} style={styles.chevron} />
          </View>
        </View>
      </TouchableOpacity>

      {/* Right Actions (Notifications & Profile) */}
      <View style={styles.rightActions}>
        <TouchableOpacity 
          style={[
            styles.actionButton,
            { backgroundColor: isDark ? tokens.colors.dark.bgSubtle : tokens.colors.light.bgSubtle }
          ]} 
          onPress={onNotificationPress}
          activeOpacity={0.7}
          accessibilityLabel="Notifications"
        >
          <Bell size={18} color={iconColor} />
          {unreadCount > 0 ? (
            <View style={styles.notificationDot} />
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.actionButton,
            { backgroundColor: isDark ? tokens.colors.dark.bgSubtle : tokens.colors.light.bgSubtle }
          ]} 
          onPress={onProfilePress}
          activeOpacity={0.7}
          accessibilityLabel="User Profile"
        >
          <UserIcon size={18} color={iconColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: tokens.spacing.xl + 20, // Status bar clearance
    paddingBottom: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: tokens.spacing.md,
  },
  pinWrapper: {
    width: 32,
    height: 32,
    borderRadius: tokens.radii.pill,
    backgroundColor: tokens.colors.brand.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing.sm,
  },
  locationTextWrapper: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationValue: {
    fontSize: tokens.typography.body.fontSize,
    fontWeight: '700',
    lineHeight: tokens.typography.body.lineHeight,
  },
  chevron: {
    marginLeft: 4,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: tokens.radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.colors.status.error,
  },
});
