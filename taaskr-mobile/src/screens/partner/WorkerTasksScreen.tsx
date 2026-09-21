import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, Text, View, FlatList, 
  ActivityIndicator, RefreshControl, Alert 
} from 'react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { api } from '../../services/api';
import { Booking } from '../../types';
import { HeaderBar } from '../../components/common/HeaderBar';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { 
  startPartnerTracking, 
  stopPartnerTracking, 
  getActiveTrackingBookingId 
} from '../../services/locationTask';
import { 
  Bike, MapPin, Wrench, CheckCircle2, 
  CreditCard, Radio, Calendar, User, ShieldCheck 
} from 'lucide-react-native';

export default function WorkerTasksScreen() {
  const { isDark } = useTheme();

  const [tasks, setTasks] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTrackingBookingId, setActiveTrackingBookingId] = useState<number | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const [res, trackedId] = await Promise.all([
        api.partner.getMyTasks(),
        getActiveTrackingBookingId(),
      ]);
      setTasks(res || []);
      setActiveTrackingBookingId(trackedId);
    } catch (e: any) {
      console.error('Failed to load partner tasks:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const advanceTask = async (bookingId: number, currentStatus: string) => {
    setActionLoadingId(bookingId);
    try {
      if (currentStatus === 'PARTNER_ASSIGNED') {
        // Step 1: Accept Task
        await api.partner.acceptTask(bookingId);
        Alert.alert('Task Accepted!', 'You have accepted this task assignment.');
      } else if (currentStatus === 'PARTNER_ACCEPTED' || currentStatus === 'ACCEPTED') {
        // Step 2: Start Journey -> Starts real GPS tracking
        await api.partner.startJourney(bookingId);

        // Start Real Physical Device GPS Tracking
        const trackRes = await startPartnerTracking(bookingId);
        if (trackRes.success) {
          Alert.alert(
            'On The Way! 🚴',
            'Customer has been notified. Real-time GPS location sharing is now active.'
          );
        } else {
          Alert.alert(
            'On The Way! (Location Warning)',
            `Journey started, but location tracking failed: ${trackRes.message}`
          );
        }
      } else if (currentStatus === 'ON_THE_WAY' || currentStatus === 'IN_TRANSIT') {
        // Step 3: Mark Arrived -> Stops real GPS tracking
        await api.partner.markArrived(bookingId);
        await stopPartnerTracking();
        Alert.alert('Arrived at Location! 📍', 'Marked as arrived. GPS location tracking has stopped.');
      } else if (currentStatus === 'ARRIVED') {
        // Step 4: Start Work
        await api.partner.startWork(bookingId);
        await stopPartnerTracking();
        Alert.alert('Work Started! 🛠️', 'Timer started for service execution.');
      } else if (currentStatus === 'WORK_STARTED' || currentStatus === 'IN_PROGRESS') {
        // Step 5: Complete Work
        await api.partner.completeWork(bookingId);
        await stopPartnerTracking();
        Alert.alert('Work Completed! 🎉', 'Service marked finished. Please confirm payment.');
      } else if (currentStatus === 'WORK_COMPLETED') {
        // Step 6: Record Payment
        await api.partner.recordPayment(bookingId, 'AFTER_SERVICE');
        await stopPartnerTracking();
        Alert.alert('Payment Confirmed! 💰', 'Customer payment recorded successfully.');
      }
      loadTasks();
    } catch (err: any) {
      Alert.alert('Action Error', err.message || 'Could not update task status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getActionConfig = (status: string) => {
    switch (status) {
      case 'PARTNER_ASSIGNED':
        return { label: 'Accept Task', icon: <CheckCircle2 size={16} color="#000" />, variant: 'primary' as const };
      case 'PARTNER_ACCEPTED':
      case 'ACCEPTED':
        return { label: 'Start Journey', icon: <Bike size={16} color="#000" />, variant: 'primary' as const };
      case 'ON_THE_WAY':
      case 'IN_TRANSIT':
        return { label: 'Mark Arrived', icon: <MapPin size={16} color="#000" />, variant: 'primary' as const };
      case 'ARRIVED':
        return { label: 'Start Work', icon: <Wrench size={16} color="#000" />, variant: 'primary' as const };
      case 'WORK_STARTED':
      case 'IN_PROGRESS':
        return { label: 'Complete Work', icon: <CheckCircle2 size={16} color="#000" />, variant: 'primary' as const };
      case 'WORK_COMPLETED':
        return { label: 'Record Payment', icon: <CreditCard size={16} color="#000" />, variant: 'primary' as const };
      default:
        return null;
    }
  };

  const bgPage = isDark ? tokens.colors.dark.bgPage : tokens.colors.light.bgPage;
  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const secondaryText = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;
  const borderSubtle = isDark ? tokens.colors.dark.borderSubtle : tokens.colors.light.borderSubtle;

  const renderCard = ({ item }: { item: Booking }) => {
    const actionConfig = getActionConfig(item.status);
    const isTrackingThis = activeTrackingBookingId === item.id;
    const isActionLoading = actionLoadingId === item.id;

    return (
      <Card elevation="sm" style={styles.card}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text style={[styles.code, { color: tokens.colors.brand.primary }]}>
            #{item.bookingCode || item.id}
          </Text>
          <Badge
            label={item.status.replace(/_/g, ' ')}
            variant={item.status === 'COMPLETED' ? 'success' : item.status === 'ON_THE_WAY' ? 'info' : 'warning'}
          />
        </View>

        {/* Live GPS Active Badge */}
        {isTrackingThis ? (
          <View style={styles.liveTrackingBanner}>
            <Radio size={14} color={tokens.colors.status.success} style={{ marginRight: 6 }} />
            <Text style={styles.liveTrackingText}>
              REAL GPS LOCATION SHARING ACTIVE
            </Text>
          </View>
        ) : null}

        {/* Service Title */}
        <Text style={[styles.serviceName, { color: textColor }]}>
          {item.serviceName}
        </Text>

        {/* Details List */}
        <View style={[styles.detailsBox, { borderColor: borderSubtle }]}>
          <View style={styles.detailRow}>
            <MapPin size={14} color={secondaryText} style={{ marginRight: 6 }} />
            <Text style={[styles.detailText, { color: secondaryText }]} numberOfLines={2}>
              {item.address}, {item.city} {item.pincode ? `(${item.pincode})` : ''}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <User size={14} color={secondaryText} style={{ marginRight: 6 }} />
            <Text style={[styles.detailText, { color: secondaryText }]}>
              Customer: {item.userName}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Calendar size={14} color={secondaryText} style={{ marginRight: 6 }} />
            <Text style={[styles.detailText, { color: secondaryText }]}>
              {item.bookingDate} {item.startTime ? `at ${item.startTime}` : ''}
            </Text>
          </View>
        </View>

        {/* Earnings & Action Button */}
        <View style={styles.footerRow}>
          <View>
            <Text style={[styles.earningsLabel, { color: secondaryText }]}>Job Payout</Text>
            <Text style={[styles.earningsValue, { color: tokens.colors.status.success }]}>
              ₹{item.finalAmount || item.totalAmount}
            </Text>
          </View>

          {actionConfig ? (
            <Button
              title={actionConfig.label}
              variant={actionConfig.variant}
              size="md"
              leftIcon={actionConfig.icon}
              onPress={() => advanceTask(item.id, item.status)}
              loading={isActionLoading}
              disabled={isActionLoading}
            />
          ) : null}
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bgPage }]}>
      <HeaderBar
        title="Field Worker Console"
        subtitle="Assigned service tasks & GPS location publishing"
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tokens.colors.brand.primary} />
          <Text style={[styles.loadingText, { color: secondaryText }]}>
            Loading assigned tasks...
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadTasks();
              }}
              tintColor={tokens.colors.brand.primary}
              colors={[tokens.colors.brand.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ShieldCheck size={36} color={secondaryText} style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyTitle, { color: textColor }]}>
                No Assigned Tasks
              </Text>
              <Text style={[styles.emptySub, { color: secondaryText }]}>
                New assigned service jobs will appear here in real time.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.xl,
  },
  loadingText: {
    fontSize: tokens.typography.bodySm.fontSize,
    marginTop: tokens.spacing.md,
  },
  listContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxxl,
    paddingTop: tokens.spacing.md,
  },
  card: {
    marginBottom: tokens.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  code: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  liveTrackingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 4,
    borderRadius: tokens.radii.sm,
    marginTop: tokens.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  liveTrackingText: {
    fontSize: 10,
    fontWeight: '900',
    color: tokens.colors.status.success,
    letterSpacing: 0.5,
  },
  serviceName: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: '800',
    marginTop: tokens.spacing.xs,
  },
  detailsBox: {
    marginVertical: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    gap: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: tokens.typography.bodySm.fontSize,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: tokens.spacing.xs,
  },
  earningsLabel: {
    fontSize: tokens.typography.caption.fontSize,
  },
  earningsValue: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: tokens.spacing.xxxl,
    paddingHorizontal: tokens.spacing.xl,
  },
  emptyTitle: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: tokens.typography.bodySm.fontSize,
    textAlign: 'center',
    marginTop: 2,
  },
});
