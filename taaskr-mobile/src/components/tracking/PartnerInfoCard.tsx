import React from 'react';
import { StyleSheet, Text, View, Linking, Alert } from 'react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { UserCheck, Phone, ShieldCheck, Star } from 'lucide-react-native';

interface PartnerInfoCardProps {
  partnerName?: string;
  partnerPhone?: string;
  partnerTitle?: string;
  partnerRating?: number;
  providerName?: string;
}

export const PartnerInfoCard: React.FC<PartnerInfoCardProps> = ({
  partnerName,
  partnerPhone,
  partnerTitle,
  partnerRating,
  providerName,
}) => {
  const { isDark } = useTheme();

  const name = partnerName || providerName;
  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const secondaryText = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;
  const borderSubtle = isDark ? tokens.colors.dark.borderSubtle : tokens.colors.light.borderSubtle;

  const handleCall = () => {
    if (!partnerPhone) {
      Alert.alert('Phone Unavailable', 'No contact phone number is available for this partner.');
      return;
    }
    Linking.openURL(`tel:${partnerPhone}`).catch(() => {
      Alert.alert('Error', 'Could not launch phone dialer.');
    });
  };

  if (!name) {
    return (
      <Card elevation="sm" style={styles.cardContainer}>
        <View style={styles.unassignedRow}>
          <UserCheck size={20} color={secondaryText} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.unassignedTitle, { color: textColor }]}>
              Service Partner Assignment
            </Text>
            <Text style={[styles.unassignedSub, { color: secondaryText }]}>
              Details will appear here as soon as a specialist is assigned.
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card elevation="sm" style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View style={[styles.avatarCircle, { backgroundColor: tokens.colors.brand.primaryMuted }]}>
          <UserCheck size={24} color={tokens.colors.brand.primary} />
        </View>

        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={[styles.partnerName, { color: textColor }]} numberOfLines={1}>
              {name}
            </Text>
            <ShieldCheck size={16} color={tokens.colors.status.success} style={{ marginLeft: 6 }} />
          </View>

          {partnerTitle ? (
            <Text style={[styles.partnerRole, { color: secondaryText }]}>
              {partnerTitle}
            </Text>
          ) : null}

          {typeof partnerRating === 'number' && partnerRating > 0 ? (
            <View style={styles.ratingRow}>
              <Star size={12} color={tokens.colors.brand.primary} fill={tokens.colors.brand.primary} />
              <Text style={[styles.ratingText, { color: textColor }]}>
                {partnerRating.toFixed(1)} rating
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Contact Action if phone exists */}
      {partnerPhone ? (
        <View style={[styles.actionFooter, { borderColor: borderSubtle }]}>
          <Button
            title={`Call ${name.split(' ')[0]}`}
            variant="outline"
            size="sm"
            fullWidth
            leftIcon={<Phone size={14} color={tokens.colors.brand.primary} />}
            onPress={handleCall}
          />
        </View>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: tokens.spacing.lg,
  },
  unassignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unassignedTitle: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: '700',
  },
  unassignedSub: {
    fontSize: tokens.typography.bodySm.fontSize,
    marginTop: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerName: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: '800',
  },
  partnerRole: {
    fontSize: tokens.typography.bodySm.fontSize,
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '700',
  },
  actionFooter: {
    marginTop: tokens.spacing.md,
    paddingTop: tokens.spacing.md,
    borderTopWidth: 1,
  },
});
