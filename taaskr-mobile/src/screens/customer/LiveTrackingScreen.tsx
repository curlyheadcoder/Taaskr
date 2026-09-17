import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl 
} from 'react-native';
import { colors } from '../../theme/colors';
import { api } from '../../services/api';
import { Booking, LiveLocationTelemetry } from '../../types';

interface Props {
  route?: { params?: { bookingId?: number } };
  navigation?: any;
}

export default function LiveTrackingScreen({ route, navigation }: Props) {
  const bookingId = route?.params?.bookingId;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [telemetry, setTelemetry] = useState<LiveLocationTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrackingData = async () => {
    if (!bookingId) return;
    try {
      const [bkRes, telRes] = await Promise.all([
        api.bookings.getById(bookingId),
        api.tracking.getLiveTracking(bookingId).catch(() => null)
      ]);
      setBooking(bkRes);
      setTelemetry(telRes);
    } catch (e: any) {
      console.error('Tracking load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTrackingData();
    const timer = setInterval(loadTrackingData, 5000); // Poll live GPS telemetry every 5 sec
    return () => clearInterval(timer);
  }, [bookingId]);

  if (!bookingId || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: '#AAA', marginTop: 12 }}>Acquiring live GPS location telemetry...</Text>
      </View>
    );
  }

  const steps = [
    { key: 'ASSIGNED', title: 'Booking Confirmed', icon: '✅' },
    { key: 'PARTNER_ACCEPTED', title: 'Partner Assigned', icon: '👷' },
    { key: 'ON_THE_WAY', title: 'On The Way', icon: '🚴' },
    { key: 'ARRIVED', title: 'Arrived at Location', icon: '📍' },
    { key: 'WORK_STARTED', title: 'Work In Progress', icon: '🛠️' },
    { key: 'COMPLETED', title: 'Service Completed', icon: '🎉' },
  ];

  const getStepIndex = (status?: string) => {
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
      case 'COMPLETED': return 5;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(booking?.status);

  // Default coordinate fallbacks if telemetry or partner coordinates exist
  const partnerLat = telemetry?.partnerLatitude || booking?.latitude || 22.7196;
  const partnerLng = telemetry?.partnerLongitude || booking?.longitude || 75.8577;
  const distanceKm = telemetry?.distanceKm ?? (telemetry?.estimatedEtaMinutes ? (telemetry.estimatedEtaMinutes * 0.4).toFixed(1) : '2.4');

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTrackingData(); }} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live GPS Telemetry</Text>
      </View>

      {/* Interactive GPS Pin Location Card */}
      <View style={styles.mapCard}>
        <View style={styles.mapVisualHeader}>
          <View style={styles.pulseRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveStatusText}>
              {telemetry?.isLive ? '🔴 LIVE GPS PIN ACTIVE' : '📡 TELEMETRY ACTIVE'}
            </Text>
          </View>
          <Text style={styles.distText}>{distanceKm} km away</Text>
        </View>

        {/* GPS Pin Box */}
        <View style={styles.pinBox}>
          <View style={styles.pinHeader}>
            <Text style={styles.pinIcon}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.pinTitle}>Service Destination Pin</Text>
              <Text style={styles.pinSub} numberOfLines={1}>{booking?.address}, {booking?.city}</Text>
            </View>
          </View>

          <View style={styles.coordBox}>
            <View style={styles.coordCol}>
              <Text style={styles.coordLabel}>Partner Latitude</Text>
              <Text style={styles.coordVal}>{Number(partnerLat).toFixed(5)}° N</Text>
            </View>
            <View style={styles.coordDivider} />
            <View style={styles.coordCol}>
              <Text style={styles.coordLabel}>Partner Longitude</Text>
              <Text style={styles.coordVal}>{Number(partnerLng).toFixed(5)}° E</Text>
            </View>
          </View>
        </View>

        <View style={styles.serviceDetails}>
          <Text style={styles.serviceTitle}>{booking?.serviceName}</Text>
          <Text style={styles.bookingCode}>Booking Code: #{booking?.bookingCode || booking?.id}</Text>
        </View>

        {telemetry?.estimatedEtaMinutes ? (
          <View style={styles.etaBox}>
            <Text style={styles.etaLabel}>ESTIMATED TIME OF ARRIVAL</Text>
            <Text style={styles.etaValue}>⏱️ {telemetry.estimatedEtaMinutes} Minutes</Text>
          </View>
        ) : null}

        {booking?.servicePartnerName ? (
          <View style={styles.partnerInfo}>
            <Text style={styles.partnerTitle}>Assigned Technician & Field Worker</Text>
            <Text style={styles.partnerName}>👷 {booking.servicePartnerName}</Text>
            {booking.servicePartnerPhone ? (
              <Text style={styles.partnerPhone}>📞 {booking.servicePartnerPhone}</Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.waitingText}>⏳ Dispatching nearest verified specialist to location...</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Service Journey Timeline</Text>

      <View style={styles.timeline}>
        {steps.map((step, idx) => {
          const isDone = idx <= currentStep;
          const isCurrent = idx === currentStep;

          return (
            <View key={step.key} style={styles.timelineStep}>
              <View style={[styles.stepDot, isDone && styles.stepDotDone, isCurrent && styles.stepDotCurrent]}>
                <Text style={{ fontSize: 12 }}>{step.icon}</Text>
              </View>

              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, isDone && styles.stepTitleDone]}>{step.title}</Text>
                {isCurrent ? (
                  <Text style={styles.currentBadge}>Current Execution State</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.bgPage, padding: 20 },
  center: { flex: 1, backgroundColor: colors.dark.bgPage, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 20 },
  backBtn: { paddingRight: 16 },
  backText: { color: colors.primary, fontWeight: '700' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  mapCard: { backgroundColor: colors.dark.bgCard, padding: 20, borderRadius: 18, borderWidth: 1, borderColor: colors.primary, marginBottom: 24 },
  mapVisualHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  pulseRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
  liveStatusText: { fontSize: 10, fontWeight: '900', color: '#10B981', letterSpacing: 1 },
  distText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  pinBox: { backgroundColor: '#09090B', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#27272A', marginBottom: 14 },
  pinHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  pinIcon: { fontSize: 24 },
  pinTitle: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  pinSub: { color: '#A1A1AA', fontSize: 12, marginTop: 2 },
  coordBox: { flexDirection: 'row', backgroundColor: '#18181B', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#3F3F46', marginTop: 6 },
  coordCol: { flex: 1, alignItems: 'center' },
  coordDivider: { width: 1, backgroundColor: '#3F3F46' },
  coordLabel: { color: '#A1A1AA', fontSize: 10, fontWeight: '600' },
  coordVal: { color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 2 },
  serviceDetails: { marginTop: 4 },
  serviceTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  bookingCode: { fontSize: 12, color: colors.dark.textMuted, marginTop: 2 },
  etaBox: { backgroundColor: 'rgba(245, 158, 11, 0.12)', padding: 12, borderRadius: 12, marginTop: 14, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  etaLabel: { fontSize: 10, fontWeight: '800', color: colors.primary },
  etaValue: { fontSize: 16, fontWeight: '900', color: '#FFF', marginTop: 2 },
  partnerInfo: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)' },
  partnerTitle: { fontSize: 11, color: colors.dark.textMuted },
  partnerName: { fontSize: 15, fontWeight: '700', color: '#FFF', marginTop: 4 },
  partnerPhone: { fontSize: 13, color: colors.primary, marginTop: 2 },
  waitingText: { fontSize: 13, color: colors.dark.textMuted, marginTop: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#FFF', marginBottom: 16 },
  timeline: { gap: 16, paddingBottom: 40 },
  timelineStep: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#27272A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#3F3F46' },
  stepDotDone: { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: '#10B981' },
  stepDotCurrent: { backgroundColor: 'rgba(245, 158, 11, 0.25)', borderColor: colors.primary },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '600', color: '#71717A' },
  stepTitleDone: { color: '#FFF', fontWeight: '700' },
  currentBadge: { fontSize: 10, fontWeight: '800', color: colors.primary, marginTop: 2 }
});
