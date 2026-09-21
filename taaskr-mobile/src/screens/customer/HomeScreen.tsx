import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl 
} from 'react-native';
import { Search, Zap, Calendar, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { api, serverStorage } from '../../services/api';
import { Category, ServiceItem, Booking, Address } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import ServerConfigModal from '../../components/ServerConfigModal';
import { HomeHeader } from '../../components/home/HomeHeader';
import { CategoryGrid } from '../../components/home/CategoryGrid';
import { ActiveBookingCard } from '../../components/home/ActiveBookingCard';
import { ServiceCard } from '../../components/home/ServiceCard';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';

interface Props {
  navigation: any;
}

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { isDark } = useTheme();

  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeServerUrl, setActiveServerUrl] = useState('');
  const [serverModalVisible, setServerModalVisible] = useState(false);

  const loadData = async () => {
    setErrorMsg(null);
    const url = await serverStorage.getServerUrl();
    setActiveServerUrl(url);

    try {
      const [catRes, srvRes, bookingsRes, addressRes, unreadRes] = await Promise.all([
        api.catalog.getCategories().catch(() => []),
        api.catalog.getServices().catch(() => []),
        api.bookings.getMyBookings().catch(() => []),
        api.addresses.getAll().catch(() => []),
        api.notifications.getUnreadCount().catch(() => ({ unreadCount: 0 })),
      ]);

      setCategories(catRes || []);
      setServices(srvRes || []);

      // Find active booking if exists
      const activeStatuses = ['ASSIGNED', 'PARTNER_ASSIGNED', 'PARTNER_ACCEPTED', 'ON_THE_WAY', 'IN_TRANSIT', 'ARRIVED', 'WORK_STARTED', 'IN_PROGRESS'];
      const currentActive = (bookingsRes || []).find((b: Booking) => activeStatuses.includes(b.status));
      setActiveBooking(currentActive || null);

      // Find default address if available
      const defAddr = (addressRes || []).find((a: Address) => a.isDefault) || (addressRes && addressRes.length > 0 ? addressRes[0] : null);
      setDefaultAddress(defAddr || null);

      // Unread notifications
      setUnreadNotifications(unreadRes?.unreadCount || 0);

    } catch (e: any) {
      console.error('Failed to load catalog:', e);
      setErrorMsg(e.message || 'Could not connect to backend server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter services by selected category and live search query
  const filteredServices = services.filter((s) => {
    const matchesCategory = selectedCatId ? s.categoryId === selectedCatId : true;
    const matchesSearch = searchQuery.trim() === ''
      ? true
      : (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  const handleBookNowCTA = () => {
    const targetService = filteredServices.length > 0 ? filteredServices[0] : services[0];
    if (targetService) {
      navigation.navigate('BookingFlow', { service: targetService });
    }
  };

  const handleScheduleCTA = () => {
    const targetService = filteredServices.length > 0 ? filteredServices[0] : services[0];
    if (targetService) {
      navigation.navigate('BookingFlow', { service: targetService, dispatchMode: 'SCHEDULED' });
    }
  };

  const bgColor = isDark ? tokens.colors.dark.bgPage : tokens.colors.light.bgPage;
  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const subColor = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;

  return (
    <View style={[styles.appWrapper, { backgroundColor: bgColor }]}>
      {/* Premium Top Navigation Header */}
      <HomeHeader
        user={user}
        defaultAddress={defaultAddress}
        unreadCount={unreadNotifications}
        onLocationPress={() => navigation.navigate('ProfileTab', { screen: 'AddressBook' })}
        onNotificationPress={() => navigation.navigate('ProfileTab')}
        onProfilePress={() => navigation.navigate('ProfileTab')}
      />

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); loadData(); }} 
            tintColor={tokens.colors.brand.primary} 
          />
        }
      >
        {/* Error Connection Banner (if offline/unreachable) */}
        {errorMsg ? (
          <Card elevation="none" style={styles.errorCard} padding={tokens.spacing.md}>
            <View style={styles.errorHeader}>
              <AlertTriangle size={18} color={tokens.colors.status.error} />
              <Text style={styles.errorTitle}>Backend Unreachable</Text>
            </View>
            <Text style={styles.errorSub}>{errorMsg}</Text>
            <Text style={styles.errorUrl}>Target: {activeServerUrl}</Text>

            <View style={styles.errorActionRow}>
              <Button
                title="Retry"
                variant="danger"
                size="sm"
                leftIcon={<RefreshCw size={14} color={tokens.colors.status.error} />}
                onPress={loadData}
              />
              <Button
                title="Change Server URL"
                variant="secondary"
                size="sm"
                onPress={() => setServerModalVisible(true)}
              />
            </View>
          </Card>
        ) : null}

        {/* User Greeting & Hero Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.greeting, { color: subColor }]}>
            {user?.name ? `Hello, ${user.name}` : 'Welcome'}
          </Text>
          <Text style={[styles.heroTitle, { color: textColor }]}>
            What do you need help with today?
          </Text>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchSection}>
          <Input
            placeholder="Search services (e.g. AC Repair, Plumbing)..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Search size={18} color={subColor} />}
            containerStyle={{ marginBottom: 0 }}
          />
        </View>

        {/* Primary Booking Action Buttons */}
        <View style={styles.primaryActionsRow}>
          <View style={{ flex: 1 }}>
            <Button
              title="Book Now"
              variant="primary"
              size="md"
              leftIcon={<Zap size={16} color={tokens.colors.brand.onPrimary} />}
              onPress={handleBookNowCTA}
              fullWidth
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Schedule"
              variant="outline"
              size="md"
              leftIcon={<Calendar size={16} color={textColor} />}
              onPress={handleScheduleCTA}
              fullWidth
            />
          </View>
        </View>

        {/* Real Active Booking Banner (Only rendered if an active booking exists) */}
        {activeBooking ? (
          <View style={styles.activeBookingSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Active Booking</Text>
            <ActiveBookingCard
              booking={activeBooking}
              onTrackPress={(bookingId) => navigation.navigate('BookingsTab', { screen: 'LiveTracking', params: { bookingId } })}
            />
          </View>
        ) : null}

        {/* Service Categories Grid */}
        {loading ? (
          <ActivityIndicator color={tokens.colors.brand.primary} style={{ marginVertical: 24 }} />
        ) : (
          <CategoryGrid
            categories={categories}
            selectedCatId={selectedCatId}
            onSelectCategory={setSelectedCatId}
          />
        )}

        {/* Available Services Section */}
        <View style={styles.servicesSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {selectedCatId ? 'Filtered Services' : searchQuery ? 'Search Results' : 'Doorstep Services'}
          </Text>

          {loading ? (
            <ActivityIndicator color={tokens.colors.brand.primary} style={{ marginVertical: 20 }} />
          ) : filteredServices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: subColor }]}>
                No services available matching your criteria.
              </Text>
            </View>
          ) : (
            filteredServices.map((srv) => (
              <ServiceCard
                key={srv.id}
                service={srv}
                onBookPress={(service) => navigation.navigate('BookingFlow', { service })}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Server Config Modal (Reused) */}
      <ServerConfigModal 
        visible={serverModalVisible} 
        onClose={() => setServerModalVisible(false)}
        onUrlChanged={loadData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  appWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: tokens.spacing.huge,
  },
  heroSection: {
    paddingHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  greeting: {
    fontSize: tokens.typography.bodySm.fontSize,
    lineHeight: tokens.typography.bodySm.lineHeight,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: tokens.typography.h1.fontSize,
    lineHeight: tokens.typography.h1.lineHeight,
    fontWeight: tokens.typography.h1.fontWeight,
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
  primaryActionsRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
  },
  activeBookingSection: {
    marginBottom: tokens.spacing.md,
  },
  sectionTitle: {
    fontSize: tokens.typography.h3.fontSize,
    lineHeight: tokens.typography.h3.lineHeight,
    fontWeight: tokens.typography.h3.fontWeight,
    marginBottom: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
  },
  servicesSection: {
    marginTop: tokens.spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.xxl,
    paddingHorizontal: tokens.spacing.lg,
  },
  emptyText: {
    fontSize: tokens.typography.body.fontSize,
  },
  errorCard: {
    marginHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
    backgroundColor: tokens.colors.status.errorBg,
    borderColor: tokens.colors.status.error,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    marginBottom: 4,
  },
  errorTitle: {
    color: tokens.colors.status.error,
    fontWeight: '700',
    fontSize: tokens.typography.body.fontSize,
  },
  errorSub: {
    color: '#FFF',
    fontSize: tokens.typography.bodySm.fontSize,
  },
  errorUrl: {
    color: '#9CA3AF',
    fontSize: tokens.typography.caption.fontSize,
    marginTop: 2,
  },
  errorActionRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.md,
  },
});
