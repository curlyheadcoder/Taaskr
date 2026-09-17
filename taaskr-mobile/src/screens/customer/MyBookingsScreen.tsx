import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert 
} from 'react-native';
import { colors } from '../../theme/colors';
import { api } from '../../services/api';
import { Booking } from '../../types';

interface Props {
  navigation: any;
}

export default function MyBookingsScreen({ navigation }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      const res = await api.bookings.getMyBookings();
      setBookings(res || []);
    } catch (e: any) {
      console.error('Failed to fetch bookings:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'WORK_COMPLETED':
        return '#10B981';
      case 'ON_THE_WAY':
      case 'IN_TRANSIT':
      case 'ARRIVED':
      case 'WORK_STARTED':
        return '#3B82F6';
      case 'CANCELLED':
      case 'REJECTED':
        return '#EF4444';
      default:
        return '#F59E0B';
    }
  };

  const handleCancel = async (bookingId: number) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.bookings.cancel(bookingId, 'Cancelled by user');
              fetchBookings();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not cancel booking.');
            }
          }
        }
      ]
    );
  };

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const statusColor = getStatusColor(item.status);
    const isTrackable = ['ASSIGNED', 'PARTNER_ASSIGNED', 'PARTNER_ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'WORK_STARTED'].includes(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.codeText}>#{item.bookingCode || item.id}</Text>
            <Text style={styles.serviceName}>{item.serviceName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22`, borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status.replace(/_/g, ' ')}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.detailText}>📅 {item.bookingDate} at {item.startTime}</Text>
          <Text style={styles.detailText}>📍 {item.address}, {item.city}</Text>
          {item.servicePartnerName ? (
            <Text style={styles.detailText}>👷 Partner: {item.servicePartnerName}</Text>
          ) : null}
          <Text style={styles.priceText}>₹{item.finalAmount || item.totalAmount}</Text>
        </View>

        <View style={styles.cardFooter}>
          {isTrackable ? (
            <TouchableOpacity 
              style={styles.trackBtn}
              onPress={() => navigation.navigate('LiveTracking', { bookingId: item.id })}
            >
              <Text style={styles.trackBtnText}>📡 Live Tracking</Text>
            </TouchableOpacity>
          ) : null}

          {['PENDING', 'ASSIGNED'].includes(item.status) ? (
            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={() => handleCancel(item.id)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderBookingCard}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => { setRefreshing(true); fetchBookings(); }} 
              tintColor={colors.primary} 
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No bookings found.</Text>
              <Text style={styles.emptySub}>Book a service from Home screen!</Text>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  card: {
    backgroundColor: colors.dark.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.dark.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  codeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardBody: {
    marginTop: 12,
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: colors.dark.textMuted,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  trackBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trackBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 12,
  },
  cancelBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cancelBtnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    color: colors.dark.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
});
