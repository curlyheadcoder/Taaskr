import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  StyleSheet, View, ScrollView, ActivityIndicator, 
  RefreshControl, BackHandler, Text, AppState, AppStateStatus 
} from 'react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { api } from '../../services/api';
import { Booking, LiveLocationTelemetry } from '../../types';
import { HeaderBar } from '../../components/common/HeaderBar';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, BadgeVariant } from '../../components/common/Badge';
import { 
  TrackingMapVisualizer, 
  PartnerInfoCard, 
  TrackingTimeline 
} from '../../components/tracking';
import { 
  trackingWebSocket, 
  WebSocketConnectionState 
} from '../../services/trackingWebSocket';
import { AlertCircle, RotateCcw, Calendar, MapPin } from 'lucide-react-native';

interface Props {
  route?: { params?: { bookingId?: number } };
  navigation?: any;
}

export default function LiveTrackingScreen({ route, navigation }: Props) {
  const bookingId = route?.params?.bookingId;
  const { isDark } = useTheme();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [telemetry, setTelemetry] = useState<LiveLocationTelemetry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [wsState, setWsState] = useState<WebSocketConnectionState>('DISCONNECTED');

  const pollingTimerRef = useRef<any>(null);

  // Initial Data Fetching via REST
  const fetchInitialData = useCallback(async () => {
    if (!bookingId) return;
    try {
      const [bkRes, telRes] = await Promise.all([
        api.bookings.getById(bookingId),
        api.tracking.getLiveTracking(bookingId).catch(() => null),
      ]);
      setBooking(bkRes);
      if (telRes) {
        setTelemetry(telRes);
      }
    } catch (e: any) {
      console.error('Tracking load error:', e);
      setError(e.message || 'Unable to load live tracking details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingId]);

  // REST Fallback Polling Executor
  const executeRestFallbackPoll = useCallback(async () => {
    if (!bookingId) return;
    try {
      const [bkRes, telRes] = await Promise.all([
        api.bookings.getById(bookingId),
        api.tracking.getLiveTracking(bookingId).catch(() => null),
      ]);
      setBooking(bkRes);
      if (telRes) {
        setTelemetry((prev) => {
          // Ignore stale REST fallback sample if newer STOMP telemetry arrived
          if (prev?.timestamp && telRes.timestamp) {
            const prevTime = new Date(prev.timestamp).getTime();
            const currTime = new Date(telRes.timestamp).getTime();
            if (currTime < prevTime) return prev;
          }
          return telRes;
        });
      }
    } catch (e) {
      console.warn('[REST Fallback Poll Error]', e);
    }
  }, [bookingId]);

  // Polling Timer Controller (Primary STOMP active -> 30s slow heartbeat; Fallback -> 5s active)
  const resetPollingInterval = useCallback((intervalMs: number) => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }
    pollingTimerRef.current = setInterval(executeRestFallbackPoll, intervalMs);
  }, [executeRestFallbackPoll]);

  // WebSocket Subscription Setup & Teardown
  useEffect(() => {
    if (!bookingId) return;

    fetchInitialData();

    // Subscribe to STOMP WebSocket topic /topic/bookings/{bookingId}/location
    trackingWebSocket.subscribeToBooking({
      bookingId,
      onTelemetry: (newTelemetry) => {
        setTelemetry(newTelemetry);

        // Update booking status dynamically if status advanced in live telemetry
        if (newTelemetry.status) {
          setBooking((prev) => (prev ? { ...prev, status: newTelemetry.status } : prev));
        }

        // When healthy STOMP telemetry arrives, slow down REST fallback polling
        resetPollingInterval(30000);
      },
      onStateChange: (state) => {
        setWsState(state);

        if (state === 'SUBSCRIBED') {
          // Slow REST polling to 30s background heartbeat when STOMP is healthy
          resetPollingInterval(30000);
        } else if (state === 'OFFLINE_FALLBACK' || state === 'RECONNECTING' || state === 'DISCONNECTED') {
          // Activate 5s REST polling fallback on WebSocket disconnection/recovery
          resetPollingInterval(5000);
        }
      },
    });

    // Handle AppState foreground reconnects
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && bookingId) {
        console.log('[App Active] Reconnecting STOMP WebSocket for tracking...');
        trackingWebSocket.subscribeToBooking({
          bookingId,
          onTelemetry: (newTel) => setTelemetry(newTel),
          onStateChange: (state) => setWsState(state),
        });
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    // Clean up timers & WebSocket subscription on unmount
    return () => {
      appStateSub.remove();
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
      trackingWebSocket.disconnect();
    };
  }, [bookingId, fetchInitialData, resetPollingInterval]);

  // Android hardware back button handler
  useEffect(() => {
    const backAction = () => {
      navigation?.goBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [navigation]);

  const bgPage = isDark ? tokens.colors.dark.bgPage : tokens.colors.light.bgPage;
  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const secondaryText = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;
  const surfaceBg = isDark ? tokens.colors.dark.bgSurface : tokens.colors.light.bgSurface;
  const borderColor = isDark ? tokens.colors.dark.borderSubtle : tokens.colors.light.borderSubtle;

  // Map Connection State to Header Badge
  const getConnectionBadge = (): { label: string; variant: BadgeVariant } => {
    switch (wsState) {
      case 'SUBSCRIBED':
        return { label: '● LIVE STOMP', variant: 'success' };
      case 'CONNECTING':
      case 'CONNECTED':
        return { label: 'CONNECTING...', variant: 'warning' };
      case 'RECONNECTING':
        return { label: 'RECONNECTING...', variant: 'warning' };
      case 'OFFLINE_FALLBACK':
      default:
        return { label: 'FALLBACK POLLING', variant: 'info' };
    }
  };

  const connBadge = getConnectionBadge();

  if (!bookingId || loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: bgPage }]}>
        <ActivityIndicator size="large" color={tokens.colors.brand.primary} />
        <Text style={[styles.loadingText, { color: secondaryText }]}>
          Connecting to live STOMP tracking telemetry stream...
        </Text>
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: bgPage }]}>
        <HeaderBar
          title="Tracking Error"
          onBack={() => navigation?.goBack()}
        />
        <View style={[styles.errorCard, { backgroundColor: surfaceBg, borderColor }]}>
          <AlertCircle size={36} color={tokens.colors.status.error} style={{ marginBottom: 12 }} />
          <Text style={[styles.errorTitle, { color: textColor }]}>
            Unable to load tracking
          </Text>
          <Text style={[styles.errorSubtitle, { color: secondaryText }]}>
            {error || 'Booking record could not be found.'}
          </Text>
          <Button
            title="Retry Connection"
            variant="outline"
            size="md"
            leftIcon={<RotateCcw size={16} color={textColor} />}
            onPress={() => {
              setLoading(true);
              fetchInitialData();
              if (bookingId) {
                trackingWebSocket.subscribeToBooking({
                  bookingId,
                  onTelemetry: (t) => setTelemetry(t),
                  onStateChange: (s) => setWsState(s),
                });
              }
            }}
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
    );
  }

  const partnerLat = telemetry?.partnerLatitude;
  const partnerLng = telemetry?.partnerLongitude;
  const serviceLat = booking.latitude;
  const serviceLng = booking.longitude;
  const displayPrice = booking.finalAmount || booking.totalAmount;

  return (
    <View style={[styles.container, { backgroundColor: bgPage }]}>
      <HeaderBar
        title="Live Tracking"
        subtitle={`Booking #${booking.bookingCode || booking.id}`}
        onBack={() => navigation?.goBack()}
        rightAction={
          <Badge label={connBadge.label} variant={connBadge.variant} />
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchInitialData();
            }}
            tintColor={tokens.colors.brand.primary}
            colors={[tokens.colors.brand.primary]}
          />
        }
      >
        {/* Real GPS Map Visualizer */}
        <TrackingMapVisualizer
          partnerLat={partnerLat}
          partnerLng={partnerLng}
          serviceLat={serviceLat}
          serviceLng={serviceLng}
          telemetry={telemetry}
          status={booking.status}
          address={booking.address}
          city={booking.city}
          pincode={booking.pincode}
        />

        {/* Assigned Service Partner Card */}
        <PartnerInfoCard
          partnerName={booking.servicePartnerName}
          partnerPhone={booking.servicePartnerPhone}
          partnerTitle={booking.servicePartnerTitle}
          partnerRating={booking.servicePartnerRating}
          providerName={booking.providerName}
        />

        {/* Status Lifecycle Timeline */}
        <TrackingTimeline booking={booking} />

        {/* Service Order Summary */}
        <Card elevation="sm" style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.serviceTitle, { color: textColor }]}>
              {booking.serviceName}
            </Text>
            <Badge label={`₹${displayPrice}`} variant="warning" />
          </View>

          <View style={[styles.summaryDetails, { borderColor }]}>
            <View style={styles.detailRow}>
              <Calendar size={14} color={secondaryText} style={{ marginRight: 6 }} />
              <Text style={[styles.detailText, { color: secondaryText }]}>
                {booking.bookingDate} {booking.startTime ? `at ${booking.startTime}` : ''}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MapPin size={14} color={secondaryText} style={{ marginRight: 6 }} />
              <Text style={[styles.detailText, { color: secondaryText }]} numberOfLines={2}>
                {booking.address}, {booking.city} {booking.pincode ? `(${booking.pincode})` : ''}
              </Text>
            </View>
          </View>
        </Card>

        {/* Bottom Action */}
        <Button
          title="Back to My Bookings"
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => navigation?.navigate('BookingsTab', { screen: 'MyBookings' })}
          style={{ marginTop: tokens.spacing.md }}
        />
      </ScrollView>
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
    marginTop: tokens.spacing.xl,
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
  scrollContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxxl,
  },
  summaryCard: {
    marginBottom: tokens.spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  serviceTitle: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: '800',
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  summaryDetails: {
    paddingTop: tokens.spacing.sm,
    gap: 6,
    borderTopWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: tokens.typography.bodySm.fontSize,
    flex: 1,
  },
});
