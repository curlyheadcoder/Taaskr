import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { ServiceItem } from '../../types';

export interface ServiceStepProps {
  service: ServiceItem;
  onNext: () => void;
}

export const ServiceStep: React.FC<ServiceStepProps> = ({
  service,
  onNext,
}) => {
  const { isDark } = useTheme();

  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const subColor = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;

  return (
    <View style={styles.container}>
      <Text style={[styles.stepTitle, { color: textColor }]}>1. Selected Service</Text>
      <Text style={[styles.stepSub, { color: subColor }]}>
        Review service details and scope before continuing.
      </Text>

      <Card elevation="sm" style={styles.card} padding={tokens.spacing.lg}>
        <Text style={[styles.serviceName, { color: textColor }]}>{service.name}</Text>
        
        {service.description ? (
          <Text style={[styles.serviceDesc, { color: subColor }]}>
            {service.description}
          </Text>
        ) : (
          <Text style={[styles.serviceDesc, { color: subColor }]}>
            Professional doorstep home service with verified partners.
          </Text>
        )}

        <View style={[
          styles.priceDivider, 
          { borderTopColor: isDark ? tokens.colors.dark.borderSubtle : tokens.colors.light.borderSubtle }
        ]}>
          <Text style={[styles.priceLabel, { color: subColor }]}>Service Price</Text>
          <Text style={[styles.priceValue, { color: tokens.colors.brand.primary }]}>
            ₹{service.price}
          </Text>
        </View>
      </Card>

      <View style={styles.footerAction}>
        <Button
          title="Continue to Location"
          variant="primary"
          size="lg"
          onPress={onNext}
          fullWidth
        />
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
  card: {
    marginBottom: tokens.spacing.xl,
  },
  serviceName: {
    fontSize: tokens.typography.h1.fontSize,
    lineHeight: tokens.typography.h1.lineHeight,
    fontWeight: tokens.typography.h1.fontWeight,
    marginBottom: tokens.spacing.sm,
  },
  serviceDesc: {
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight,
    marginBottom: tokens.spacing.lg,
  },
  priceDivider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: tokens.spacing.md,
    borderTopWidth: 1,
  },
  priceLabel: {
    fontSize: tokens.typography.body.fontSize,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: tokens.typography.display.fontSize,
    fontWeight: '800',
  },
  footerAction: {
    marginTop: tokens.spacing.md,
  },
});
