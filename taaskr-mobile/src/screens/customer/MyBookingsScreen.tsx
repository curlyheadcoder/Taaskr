import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, View, FlatList, ActivityIndicator, 
  RefreshControl, Alert, Text 
} from 'react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { api } from '../../services/api';
import { Booking, BookingStatus } from '../../types';
import { HeaderBar } from '../../components/common/HeaderBar';
import { Button } from '../../components/common/Button';
import { 
  BookingFilterTabs, 
  BookingTab, 
  BookingCard, 
  BookingEmptyState, 
  BookingRatingModal 
} from '../../components/bookings';
import { AlertCircle, RotateCcw } from 'lucide-react-native';

interface Props {
  navigation: any;
}

export default function MyBookingsScreen({ navigation }: Props) {
  const { isDark } = useTheme();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedTab, setSelectedTab] = useState<BookingTab>('ACTIVE');

  // Rating Modal State
  const [ratingModalVisible, setRatingModalVisible] = useState<boolean>(false);
  const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);

  const fetchBookings = useCallback(async () => {
    setError(null);
    try {
      const res = await api.bookings.getMyBookings();
      setBookings(res || []);
    } catch (e: any) {
      console.error('Failed to fetch bookings:', e);
      setError(e.message || 'Couldn\'t load your bookings. Please check network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Tab categorization helper functions based on REAL backend statuses
  const isActiveStatus = (status: BookingStatus): boolean => {
    return [
      'PENDING',
      'ASSIGNED',
      'PARTNER_ASSIGNED',
      'PARTNER_ACCEPTED',
      'ON_THE_WAY',
      'ARRIVED',
      'WORK_STARTED',
      'ACCEPTED',
      'IN_PROGRESS',
      'IN_TRANSIT',
      'WORK_COMPLETED',
      'PAYMENT_COMPLETED',
      'PROVIDER_APPROVED',
    ].includes(status);
  };

  const isCompletedStatus = (status: BookingStatus): boolean => {
    return status === 'COMPLETED';
  };

  const isCancelledStatus = (status: BookingStatus): boolean => {
    return ['CANCELLED', 'REJECTED'].includes(status);
  };

  const activeBookings = bookings.filter((b) => isActiveStatus(b.status));
  const completedBookings = bookings.filter((b) => isCompletedStatus(b.status));
  const cancelledBookings = bookings.filter((b) => isCancelledStatus(b.status));

  const getCurrentTabBookings = (): Booking[] => {
    switch (selectedTab) {
      case 'ACTIVE':
        return activeBookings;
      case 'COMPLETED':
        return completedBookings;
      case 'CANCELLED':
        return cancelledBookings;
    }
  };

  const handleTrack = (bookingId: number) => {
    navigation.navigate('LiveTracking', { bookingId });
  };

  const handleCancel = (bookingId: number) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking request?',
      [
        { text: 'No, Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.bookings.cancel(bookingId, 'Cancelled by customer');
              fetchBookings();
            } catch (err: any) {
              Alert.alert('Cancellation Error', err.message || 'Could not cancel booking.');
            }
          },
        },
      ]
    );
  };

  const handleOpenRatingModal = (booking: Booking) => {
    setRatingBooking(booking);
    setRatingModalVisible(true);
  };

  const handleSubmitRating = async (rating: number, review?: string) => {
    if (!ratingBooking) return;
    await api.bookings.rate(ratingBooking.id, { rating, review });
    fetchBookings();
  };

  const handleExploreServices = () => {
    navigation.navigate('HomeTab', { screen: 'CustomerHome' });
  };

  const bgPage = isDark ? tokens.colors.dark.bgPage : tokens.colors.light.bgPage;
  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const secondaryText = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;
  const surfaceBg = isDark ? tokens.colors.dark.bgSurface : tokens.colors.light.bgSurface;
  const borderColor = isDark ? tokens.colors.dark.borderSubtle : tokens.colors.light.borderSubtle;

  const currentBookings = getCurrentTabBookings();

  return (
    <View style={[styles.container, { backgroundColor: bgPage }]}>
      <HeaderBar title="My Bookings" />

      {/* Filter Tabs */}
      <BookingFilterTabs
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
        activeCount={activeBookings.length}
        completedCount={completedBookings.length}
        cancelledCount={cancelledBookings.length}
      />

      {/* Content Area */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tokens.colors.brand.primary} />
          <Text style={[styles.loadingText, { color: secondaryText }]}>
            Loading your bookings...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <View style={[styles.errorCard, { backgroundColor: surfaceBg, borderColor }]}>
            <AlertCircle size={36} color={tokens.colors.status.error} style={{ marginBottom: 12 }} />
            <Text style={[styles.errorTitle, { color: textColor }]}>Failed to load bookings</Text>
            <Text style={[styles.errorSubtitle, { color: secondaryText }]}>{error}</Text>
            <Button
              title="Try Again"
              variant="outline"
              size="md"
              leftIcon={<RotateCcw size={16} color={textColor} />}
              onPress={fetchBookings}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={currentBookings}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onTrack={handleTrack}
              onCancel={handleCancel}
              onRate={handleOpenRatingModal}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchBookings();
              }}
              tintColor={tokens.colors.brand.primary}
              colors={[tokens.colors.brand.primary]}
            />
          }
          ListEmptyComponent={
            <BookingEmptyState
              tab={selectedTab}
              onExploreServices={handleExploreServices}
            />
          }
        />
      )}

      {/* Rating Modal */}
      {ratingBooking ? (
        <BookingRatingModal
          visible={ratingModalVisible}
          bookingId={ratingBooking.id}
          serviceName={ratingBooking.serviceName}
          onClose={() => {
            setRatingModalVisible(false);
            setRatingBooking(null);
          }}
          onSubmit={handleSubmitRating}
        />
      ) : null}
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
  errorCard: {
    width: '100%',
    padding: tokens.spacing.xl,
    borderRadius: tokens.radii.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  errorTitle: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: '800',
    marginBottom: 4,
  },
  errorSubtitle: {
    fontSize: tokens.typography.bodySm.fontSize,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxxl,
  },
});
