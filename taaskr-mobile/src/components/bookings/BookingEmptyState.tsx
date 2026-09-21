import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../common/Button';
import { BookingTab } from './BookingFilterTabs';
import { CalendarX, CheckCircle2, XCircle } from 'lucide-react-native';

interface BookingEmptyStateProps {
  tab: BookingTab;
  onExploreServices?: () => void;
}

export const BookingEmptyState: React.FC<BookingEmptyStateProps> = ({
  tab,
  onExploreServices,
}) => {
  const { isDark } = useTheme();

  const getEmptyConfig = () => {
    switch (tab) {
      case 'ACTIVE':
        return {
          icon: CalendarX,
          title: 'No Active Bookings',
          description: 'You currently have no ongoing or scheduled service requests.',
          showCta: true,
        };
      case 'COMPLETED':
        return {
          icon: CheckCircle2,
          title: 'No Completed Bookings',
          description: 'Your completed booking history and receipts will be listed here.',
          showCta: false,
        };
      case 'CANCELLED':
        return {
          icon: XCircle,
          title: 'No Cancelled Bookings',
          description: 'Any cancelled or rejected service requests will appear here.',
          showCta: false,
        };
    }
  };

  const config = getEmptyConfig();
  const Icon = config.icon;

  const titleColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const descColor = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;
  const iconBg = isDark ? tokens.colors.dark.bgSurface : tokens.colors.light.bgSurface;
  const iconBorder = isDark ? tokens.colors.dark.borderSubtle : tokens.colors.light.borderSubtle;

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrapper, { backgroundColor: iconBg, borderColor: iconBorder }]}>
        <Icon size={36} color={tokens.colors.brand.primary} />
      </View>

      <Text style={[styles.title, { color: titleColor }]}>{config.title}</Text>
      <Text style={[styles.description, { color: descColor }]}>{config.description}</Text>

      {config.showCta && onExploreServices ? (
        <Button
          title="Explore Services"
          variant="primary"
          size="md"
          onPress={onExploreServices}
          style={styles.ctaButton}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.xxxl,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: tokens.spacing.lg,
  },
  title: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
  },
  description: {
    fontSize: tokens.typography.bodySm.fontSize,
    textAlign: 'center',
    lineHeight: tokens.typography.bodySm.lineHeight,
    maxWidth: 280,
  },
  ctaButton: {
    marginTop: tokens.spacing.xl,
    minWidth: 180,
  },
});
