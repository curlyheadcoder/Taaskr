import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { ServiceItem } from '../../types';

export interface ServiceCardProps {
  service: ServiceItem;
  onBookPress: (service: ServiceItem) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onBookPress,
}) => {
  const { isDark } = useTheme();

  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const subColor = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;

  return (
    <Card 
      elevation="none" 
      bordered={true}
      style={styles.card}
      padding={tokens.spacing.lg}
    >
      <View style={styles.contentRow}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {service.name}
          </Text>
          
          {service.description ? (
            <Text style={[styles.description, { color: subColor }]} numberOfLines={2}>
              {service.description}
            </Text>
          ) : null}

          <Text style={[styles.price, { color: tokens.colors.brand.primary }]}>
            ₹{service.price}
          </Text>
        </View>

        <View style={styles.actionContainer}>
          <Button
            title="Book Now"
            variant="primary"
            size="sm"
            onPress={() => onBookPress(service)}
          />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: tokens.spacing.md,
  },
  title: {
    fontSize: tokens.typography.h3.fontSize,
    lineHeight: tokens.typography.h3.lineHeight,
    fontWeight: tokens.typography.h3.fontWeight,
  },
  description: {
    fontSize: tokens.typography.bodySm.fontSize,
    lineHeight: tokens.typography.bodySm.lineHeight,
    marginTop: 4,
  },
  price: {
    fontSize: tokens.typography.h2.fontSize,
    fontWeight: '800',
    marginTop: 8,
  },
  actionContainer: {
    justifyContent: 'center',
  },
});
