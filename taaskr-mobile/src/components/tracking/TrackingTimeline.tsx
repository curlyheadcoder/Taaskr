import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { Booking, BookingStatus } from '../../types';
import { CheckCircle2, Clock, Circle } from 'lucide-react-native';

interface TrackingTimelineProps {
  booking: Booking;
}

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({ booking }) => {
  const { isDark } = useTheme();

  const getStepIndex = (status: BookingStatus): number => {
    switch (status) {
      case 'ASSIGNED': return 0;
      case 'PARTNER_ASSIGNED':
      case 'PARTNER_ACCEPTED': return 1;
      case 'ON_THE_WAY':
      case 'IN_TRANSIT': return 2;
      case 'ARRIVED': return 3;
      case 'WORK_STARTED':
      case 'IN_PROGRESS': return 4;
      case 'WORK_COMPLETED':
      case 'PAYMENT_COMPLETED':
      case 'PROVIDER_APPROVED':
      case 'COMPLETED': return 5;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(booking.status);

  // Format real timestamps if available
  const formatTimeOnly = (isoStr?: string) => {
    if (!isoStr) return null;
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return null;
    }
  };

  const steps = [
    {
      key: 'ASSIGNED',
      title: 'Booking Confirmed',
      time: formatTimeOnly(booking.createdAt),
    },
    {
      key: 'PARTNER_ACCEPTED',
      title: 'Partner Assigned',
      time: formatTimeOnly(booking.partnerAssignedAt || booking.partnerAcceptedAt),
    },
    {
      key: 'ON_THE_WAY',
      title: 'Partner On The Way',
      time: formatTimeOnly(booking.journeyStartedAt),
    },
    {
      key: 'ARRIVED',
      title: 'Arrived at Location',
      time: formatTimeOnly(booking.arrivedAt),
    },
    {
      key: 'WORK_STARTED',
      title: 'Service In Progress',
      time: formatTimeOnly(booking.workStartedAt),
    },
    {
      key: 'COMPLETED',
      title: 'Service Completed',
      time: formatTimeOnly(booking.workCompletedAt || booking.paymentCompletedAt || booking.providerApprovedAt),
    },
  ];

  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const secondaryText = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;
  const borderSubtle = isDark ? tokens.colors.dark.borderSubtle : tokens.colors.light.borderSubtle;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Service Timeline
      </Text>

      <View style={styles.timelineList}>
        {steps.map((step, idx) => {
          const isDone = idx <= currentStep;
          const isCurrent = idx === currentStep;

          return (
            <View key={step.key} style={styles.timelineRow}>
              {/* Dot Icon Column */}
              <View style={styles.iconCol}>
                {isDone ? (
                  <CheckCircle2
                    size={20}
                    color={isCurrent ? tokens.colors.brand.primary : tokens.colors.status.success}
                  />
                ) : (
                  <Circle size={18} color={secondaryText} />
                )}
                {idx < steps.length - 1 ? (
                  <View
                    style={[
                      styles.line,
                      {
                        backgroundColor: idx < currentStep
                          ? tokens.colors.status.success
                          : borderSubtle,
                      },
                    ]}
                  />
                ) : null}
              </View>

              {/* Step Info */}
              <View style={styles.contentCol}>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.stepTitle,
                      {
                        color: isDone ? textColor : secondaryText,
                        fontWeight: isCurrent ? '800' : isDone ? '700' : '500',
                      },
                    ]}
                  >
                    {step.title}
                  </Text>

                  {step.time ? (
                    <Text style={[styles.timeText, { color: secondaryText }]}>
                      {step.time}
                    </Text>
                  ) : null}
                </View>

                {isCurrent ? (
                  <Text style={[styles.activeBadge, { color: tokens.colors.brand.primary }]}>
                    ● Current Status
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.xl,
  },
  sectionTitle: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: '800',
    marginBottom: tokens.spacing.md,
  },
  timelineList: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 52,
  },
  iconCol: {
    alignItems: 'center',
    width: 24,
    marginRight: tokens.spacing.md,
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  contentCol: {
    flex: 1,
    paddingBottom: tokens.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: tokens.typography.bodySm.fontSize,
  },
  timeText: {
    fontSize: tokens.typography.caption.fontSize,
  },
  activeBadge: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '800',
    marginTop: 2,
  },
});
