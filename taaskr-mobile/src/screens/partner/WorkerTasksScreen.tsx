import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert 
} from 'react-native';
import { colors } from '../../theme/colors';
import { api } from '../../services/api';
import { Booking } from '../../types';

export default function WorkerTasksScreen() {
  const [tasks, setTasks] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTasks = async () => {
    try {
      const res = await api.partner.getMyTasks();
      setTasks(res || []);
    } catch (e: any) {
      console.error('Failed to load partner tasks:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const advanceTask = async (bookingId: number, currentStatus: string) => {
    try {
      if (currentStatus === 'PARTNER_ASSIGNED') {
        await api.partner.acceptTask(bookingId);
        Alert.alert('Task Accepted!', 'You have accepted this task assignment.');
      } else if (currentStatus === 'PARTNER_ACCEPTED' || currentStatus === 'ACCEPTED') {
        await api.partner.startJourney(bookingId);
        Alert.alert('On The Way! 🚴', 'Customer has been notified that you are en route.');
      } else if (currentStatus === 'ON_THE_WAY' || currentStatus === 'IN_TRANSIT') {
        await api.partner.markArrived(bookingId);
        Alert.alert('Arrived! 📍', 'Marked as arrived at customer address.');
      } else if (currentStatus === 'ARRIVED') {
        await api.partner.startWork(bookingId);
        Alert.alert('Work Started! 🛠️', 'Timer started for service execution.');
      } else if (currentStatus === 'WORK_STARTED' || currentStatus === 'IN_PROGRESS') {
        await api.partner.completeWork(bookingId);
        Alert.alert('Work Completed! 🎉', 'Service marked as finished. Please record payment.');
      } else if (currentStatus === 'WORK_COMPLETED') {
        await api.partner.recordPayment(bookingId, 'AFTER_SERVICE');
        Alert.alert('Payment Recorded! 💰', 'Customer payment confirmed.');
      }
      loadTasks();
    } catch (err: any) {
      Alert.alert('Action Error', err.message || 'Could not update task status.');
    }
  };

  const getActionLabel = (status: string) => {
    switch (status) {
      case 'PARTNER_ASSIGNED': return 'Accept Task';
      case 'PARTNER_ACCEPTED':
      case 'ACCEPTED': return 'Start Journey 🚴';
      case 'ON_THE_WAY':
      case 'IN_TRANSIT': return 'Mark Arrived 📍';
      case 'ARRIVED': return 'Start Work 🛠️';
      case 'WORK_STARTED':
      case 'IN_PROGRESS': return 'Complete Work 🎉';
      case 'WORK_COMPLETED': return 'Record Payment 💰';
      default: return null;
    }
  };

  const renderCard = ({ item }: { item: Booking }) => {
    const actionLabel = getActionLabel(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.code}>#{item.bookingCode || item.id}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.status.replace(/_/g, ' ')}</Text>
          </View>
        </View>

        <Text style={styles.serviceName}>{item.serviceName}</Text>
        <Text style={styles.text}>📍 {item.address}, {item.city}</Text>
        <Text style={styles.text}>👤 Customer: {item.userName}</Text>
        <Text style={styles.amount}>Earnings: ₹{item.finalAmount || item.totalAmount}</Text>

        {actionLabel ? (
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => advanceTask(item.id, item.status)}
          >
            <Text style={styles.actionBtnText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Field Worker Console</Text>
        <Text style={styles.sub}>Assigned service jobs & live location updates</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCard}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => { setRefreshing(true); loadTasks(); }} 
              tintColor={colors.primary} 
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ color: '#FFF', fontWeight: '700' }}>No assigned tasks.</Text>
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
    backgroundColor: colors.dark.bgPage,
    paddingHorizontal: 20,
    paddingTop: 54,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  sub: {
    fontSize: 12,
    color: colors.dark.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.dark.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.dark.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  code: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  badge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 6,
  },
  text: {
    fontSize: 13,
    color: colors.dark.textMuted,
    marginTop: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 8,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  actionBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
});
