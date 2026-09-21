import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { BookingStatus, LiveLocationTelemetry } from '../../types';
import { MapPin, Navigation, Signal, Radio, AlertCircle } from 'lucide-react-native';

interface TrackingMapVisualizerProps {
  partnerLat?: number;
  partnerLng?: number;
  serviceLat?: number;
  serviceLng?: number;
  telemetry?: LiveLocationTelemetry | null;
  status: BookingStatus;
  address: string;
  city: string;
  pincode?: string;
}

export const TrackingMapVisualizer: React.FC<TrackingMapVisualizerProps> = ({
  partnerLat,
  partnerLng,
  serviceLat,
  serviceLng,
  telemetry,
  status,
  address,
  city,
  pincode,
}) => {
  const { isDark } = useTheme();

  const hasPartnerCoords = typeof partnerLat === 'number' && typeof partnerLng === 'number' && !isNaN(partnerLat) && !isNaN(partnerLng);
  const hasServiceCoords = typeof serviceLat === 'number' && typeof serviceLng === 'number' && !isNaN(serviceLat) && !isNaN(serviceLng);
  const isLive = Boolean(telemetry?.isLive);

  const containerBg = isDark ? tokens.colors.dark.bgSurface : tokens.colors.light.bgSurface;
  const cardBorder = isDark ? tokens.colors.dark.borderMedium : tokens.colors.light.borderMedium;
  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const secondaryText = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;
  const innerBg = isDark ? tokens.colors.dark.bgPage : tokens.colors.light.bgElevated;

  return (
    <View style={[styles.container, { backgroundColor: containerBg, borderColor: cardBorder }]}>
      {/* Visual Header / Signal Status */}
      <View style={styles.headerRow}>
        <View style={styles.statusRow}>
          <View style={[styles.pulseDot, { backgroundColor: isLive ? tokens.colors.status.success : tokens.colors.brand.primary }]} />
          <Text style={[styles.statusText, { color: isLive ? tokens.colors.status.success : tokens.colors.brand.primary }]}>
            {isLive ? 'LIVE GPS TELEMETRY ACTIVE' : 'TELEMETRY CONNECTION ACTIVE'}
          </Text>
        </View>

        {telemetry?.distanceKm !== undefined ? (
          <Text style={[styles.distanceText, { color: tokens.colors.brand.primary }]}>
            {telemetry.distanceKm} km away
          </Text>
        ) : null}
      </View>

      {/* Map Canvas Box */}
      <View style={[styles.mapCanvas, { backgroundColor: innerBg, borderColor: cardBorder }]}>
        {/* Case 1: Both Partner & Service Coords Available */}
        {hasPartnerCoords && hasServiceCoords ? (
          <View style={styles.coordsContent}>
            <View style={styles.locationNode}>
              <View style={[styles.iconCircle, { backgroundColor: tokens.colors.status.infoBg }]}>
                <Navigation size={20} color={tokens.colors.status.info} />
              </View>
              <View style={styles.nodeTextInfo}>
                <Text style={[styles.nodeLabel, { color: secondaryText }]}>Partner Location</Text>
                <Text style={[styles.coordBadge, { color: textColor }]}>
                  {partnerLat?.toFixed(4)}° N, {partnerLng?.toFixed(4)}° E
                </Text>
              </View>
            </View>

            <View style={styles.connectorLine} />

            <View style={styles.locationNode}>
              <View style={[styles.iconCircle, { backgroundColor: tokens.colors.status.successBg }]}>
                <MapPin size={20} color={tokens.colors.status.success} />
              </View>
              <View style={styles.nodeTextInfo}>
                <Text style={[styles.nodeLabel, { color: secondaryText }]}>Service Destination</Text>
                <Text style={[styles.coordBadge, { color: textColor }]} numberOfLines={1}>
                  {address}, {city}
                </Text>
              </View>
            </View>
          </View>
        ) : hasServiceCoords ? (
          /* Case 2: Only Service Destination Coords Available */
          <View style={styles.coordsContent}>
            <View style={styles.locationNode}>
              <View style={[styles.iconCircle, { backgroundColor: tokens.colors.status.successBg }]}>
                <MapPin size={22} color={tokens.colors.status.success} />
              </View>
              <View style={styles.nodeTextInfo}>
                <Text style={[styles.nodeLabel, { color: secondaryText }]}>Service Location Pinned</Text>
                <Text style={[styles.coordBadge, { color: textColor }]}>
                  {serviceLat?.toFixed(4)}° N, {serviceLng?.toFixed(4)}° E
                </Text>
                <Text style={[styles.addressSub, { color: secondaryText }]} numberOfLines={1}>
                  {address}, {city} {pincode ? `(${pincode})` : ''}
                </Text>
              </View>
            </View>
            <View style={styles.waitingBanner}>
              <Radio size={14} color={tokens.colors.brand.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.waitingBannerText, { color: secondaryText }]}>
                Waiting for service partner to start journey...
              </Text>
            </View>
          </View>
        ) : (
          /* Case 3: No Coordinates Available */
          <View style={styles.noCoordsBox}>
            <Signal size={32} color={tokens.colors.brand.primary} style={{ marginBottom: 8 }} />
            <Text style={[styles.noCoordsTitle, { color: textColor }]}>
              Waiting for location signal
            </Text>
            <Text style={[styles.noCoordsSub, { color: secondaryText }]}>
              Live GPS telemetry will appear here when your service partner starts the journey.
            </Text>
          </View>
        )}
      </View>

      {/* Real ETA Banner if present in backend telemetry */}
      {telemetry?.estimatedEtaMinutes !== undefined && telemetry.estimatedEtaMinutes !== null ? (
        <View style={styles.etaContainer}>
          <Text style={styles.etaLabel}>ESTIMATED ARRIVAL TIME</Text>
          <Text style={[styles.etaValue, { color: textColor }]}>
            ⏱️ {telemetry.estimatedEtaMinutes} minutes
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: tokens.radii.xl,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    marginBottom: tokens.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  distanceText: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '800',
  },
  mapCanvas: {
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.md,
    borderWidth: 1,
  },
  coordsContent: {
    gap: tokens.spacing.sm,
  },
  locationNode: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  },
  nodeTextInfo: {
    flex: 1,
  },
  nodeLabel: {
    fontSize: tokens.typography.caption.fontSize,
  },
  coordBadge: {
    fontSize: tokens.typography.bodySm.fontSize,
    fontWeight: '700',
    marginTop: 2,
  },
  addressSub: {
    fontSize: tokens.typography.caption.fontSize,
    marginTop: 1,
  },
  connectorLine: {
    width: 2,
    height: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    marginLeft: 19,
    marginVertical: -2,
  },
  waitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: tokens.spacing.xs,
    paddingTop: tokens.spacing.xs,
  },
  waitingBannerText: {
    fontSize: tokens.typography.caption.fontSize,
  },
  noCoordsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.md,
  },
  noCoordsTitle: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 4,
  },
  noCoordsSub: {
    fontSize: tokens.typography.bodySm.fontSize,
    textAlign: 'center',
    maxWidth: 260,
  },
  etaContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    marginTop: tokens.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  etaLabel: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '800',
    color: tokens.colors.brand.primary,
  },
  etaValue: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: '800',
    marginTop: 2,
  },
});
