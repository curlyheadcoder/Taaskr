import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';
import { 
  X, Phone, Star, ShieldCheck, MapPin, Navigation, 
  Clock, Truck, User, RefreshCw, AlertCircle, Play, 
  CheckCircle2, Compass, Layers, Radio
} from 'lucide-react';

// Fix standard Leaflet default icons in Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom HTML Pin Generators
const createProviderIcon = (isVehicle, providerName) => {
  const iconEmoji = isVehicle ? '🚗' : '👨‍🔧';
  return L.divIcon({
    className: 'custom-live-provider-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(34, 197, 94, 0.28); animation: taaskr-pulse-radar 2s infinite ease-out;"></div>
        <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #10b981 0%, #059669 100%); display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.45); border: 2.5px solid #ffffff; z-index: 2;">
          ${iconEmoji}
        </div>
        <div style="margin-top: 4px; background: rgba(15, 23, 42, 0.92); color: #ffffff; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; white-space: nowrap; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 2px 6px rgba(0,0,0,0.3); z-index: 2;">
          ${providerName ? providerName.split(' ')[0] : 'Provider'}
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

const createCustomerIcon = (isDrop) => {
  const bg = isDrop ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' : 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)';
  const label = isDrop ? 'Drop Point' : 'Service Location';
  const emoji = isDrop ? '🏁' : '🏠';
  return L.divIcon({
    className: 'custom-destination-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: ${bg}; display: flex; align-items: center; justify-content: center; font-size: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid #ffffff; z-index: 1;">
          ${emoji}
        </div>
        <div style="margin-top: 3px; background: rgba(15, 23, 42, 0.85); color: #ffffff; padding: 2px 7px; border-radius: 9999px; font-size: 9px; font-weight: 600; white-space: nowrap; border: 1px solid rgba(255,255,255,0.12);">
          ${label}
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

// Auto-Fit Bounds Component to frame all markers nicely
function AutoFitBounds({ boundsCoords, triggerRecenter }) {
  const map = useMap();
  useEffect(() => {
    if (boundsCoords && boundsCoords.length > 0) {
      const validPoints = boundsCoords.filter(p => p && p[0] != null && p[1] != null);
      if (validPoints.length === 1) {
        map.setView(validPoints[0], 15);
      } else if (validPoints.length > 1) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    }
  }, [boundsCoords, map, triggerRecenter]);
  return null;
}

export default function LiveTrackingModal({ bookingId, onClose }) {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastPingTime, setLastPingTime] = useState(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  // Simulation state for interactive demo/testing
  const [simulationActive, setSimulationActive] = useState(false);
  const [simulatedProviderCoords, setSimulatedProviderCoords] = useState(null);
  const simulationStepRef = useRef(0);

  const fetchTracking = async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await api.tracking.getLiveTracking(bookingId);
      setTrackingData(res);
      setLastPingTime(new Date());
      setErrorMsg('');
    } catch (err) {
      console.error('Failed to fetch tracking data:', err);
      if (!isSilent) {
        setErrorMsg(err.message || 'Unable to connect to live tracking service');
      }
    } finally {
      setLoading(false);
      if (!isSilent) setRefreshing(false);
    }
  };

  // Initial load + periodic 4-second live polling
  useEffect(() => {
    fetchTracking(false);

    const interval = setInterval(() => {
      fetchTracking(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [bookingId]);

  // Provider coordinates (actual or simulated)
  const providerCoords = useMemo(() => {
    if (simulatedProviderCoords) {
      return simulatedProviderCoords;
    }
    if (trackingData?.providerLatitude != null && trackingData?.providerLongitude != null) {
      return [Number(trackingData.providerLatitude), Number(trackingData.providerLongitude)];
    }
    return null;
  }, [trackingData, simulatedProviderCoords]);

  // Customer Coordinates (Pickup / Service)
  const customerCoords = useMemo(() => {
    if (trackingData?.customerLatitude != null && trackingData?.customerLongitude != null) {
      return [Number(trackingData.customerLatitude), Number(trackingData.customerLongitude)];
    }
    // Fallback default Indore city center if coordinates weren't stored on booking
    return [22.7196, 75.8577];
  }, [trackingData]);

  // Drop Coordinates (if vehicle task)
  const dropCoords = useMemo(() => {
    if (trackingData?.dropLatitude != null && trackingData?.dropLongitude != null) {
      return [Number(trackingData.dropLatitude), Number(trackingData.dropLongitude)];
    }
    return null;
  }, [trackingData]);

  // Coordinates array for framing bounds
  const allBoundsCoords = useMemo(() => {
    const pts = [];
    if (providerCoords) pts.push(providerCoords);
    if (customerCoords) pts.push(customerCoords);
    if (dropCoords) pts.push(dropCoords);
    return pts;
  }, [providerCoords, customerCoords, dropCoords]);

  // Polyline points
  const polylinePositions = useMemo(() => {
    if (!providerCoords || !customerCoords) return [];
    if (dropCoords && trackingData?.status === 'IN_TRANSIT') {
      return [providerCoords, dropCoords];
    }
    return [providerCoords, customerCoords];
  }, [providerCoords, customerCoords, dropCoords, trackingData?.status]);

  // Dynamic Real-time Distance & ETA computation based on current provider coordinates
  const computedMetrics = useMemo(() => {
    const targetCoords = (trackingData?.status === 'IN_TRANSIT' && dropCoords) ? dropCoords : customerCoords;
    
    if (providerCoords && targetCoords) {
      const [lat1, lon1] = providerCoords;
      const [lat2, lon2] = targetCoords;

      const R = 6371; // Earth radius in KM
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const straightLine = R * c;
      const estimatedRoadKm = Math.max(0.1, straightLine * 1.25); // Road factor

      const distStr = estimatedRoadKm < 1 ? estimatedRoadKm.toFixed(2) : estimatedRoadKm.toFixed(1);
      const mins = Math.max(1, Math.round((estimatedRoadKm / 25.0) * 60.0));
      const isArriving = estimatedRoadKm < 0.25;

      return {
        distanceKm: distStr,
        etaText: isArriving ? 'Arriving now' : `~${mins} min${mins > 1 ? 's' : ''}`,
        isArriving
      };
    }

    if (trackingData?.distanceKm) {
      const dist = Number(trackingData.distanceKm);
      const mins = trackingData?.estimatedEtaMinutes || Math.max(1, Math.round((dist / 25.0) * 60.0));
      return {
        distanceKm: dist.toFixed(1),
        etaText: `~${mins} min${mins > 1 ? 's' : ''}`,
        isArriving: dist < 0.25
      };
    }

    return {
      distanceKm: '2.4',
      etaText: '~6 mins',
      isArriving: false
    };
  }, [providerCoords, customerCoords, dropCoords, trackingData]);

  // Simulation Runner for instant demo/testing
  useEffect(() => {
    let timer;
    if (simulationActive && customerCoords) {
      const target = (trackingData?.status === 'IN_TRANSIT' && dropCoords) ? dropCoords : customerCoords;
      // Start near target location (offset by ~3.2 km)
      const startLat = target[0] + 0.024;
      const startLng = target[1] - 0.022;
      
      timer = setInterval(() => {
        simulationStepRef.current += 1;
        const progress = Math.min(simulationStepRef.current / 20, 1.0);
        const currentLat = startLat + (target[0] - startLat) * progress;
        const currentLng = startLng + (target[1] - startLng) * progress;
        
        setSimulatedProviderCoords([currentLat, currentLng]);

        // Send simulated coordinates to backend so database also updates
        api.tracking.updateProviderLocation({
          latitude: currentLat,
          longitude: currentLng
        }).catch(() => {});

        if (progress >= 1.0) {
          setSimulationActive(false);
          simulationStepRef.current = 0;
        }
      }, 1200);
    } else {
      setSimulatedProviderCoords(null);
      simulationStepRef.current = 0;
    }

    return () => clearInterval(timer);
  }, [simulationActive, customerCoords, dropCoords, trackingData?.status]);

  const handleStartSimulation = () => {
    simulationStepRef.current = 0;
    setSimulationActive(true);
  };

  const handleStopSimulation = () => {
    setSimulationActive(false);
    setSimulatedProviderCoords(null);
  };

  // Status stage helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'IN_TRANSIT':
        return { label: 'In Transit to Drop Point', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: Truck };
      case 'IN_PROGRESS':
        return { label: 'Service In Progress', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: Compass };
      case 'ACCEPTED':
      case 'ASSIGNED':
        return { label: 'Provider En Route', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: Navigation };
      case 'COMPLETED':
        return { label: 'Completed', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)', icon: CheckCircle2 };
      default:
        return { label: status || 'Active', color: 'var(--text-muted)', bg: 'var(--bg-subtle)', icon: Radio };
    }
  };

  const statusBadge = getStatusBadge(trackingData?.status);
  const StatusIcon = statusBadge.icon;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '1rem'
    }}>
      <style>{`
        @keyframes taaskr-pulse-radar {
          0% { transform: scale(0.6); opacity: 0.9; }
          70% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes pulse-dot {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
      `}</style>

      <div className="panel" style={{
        width: '100%',
        maxWidth: '900px',
        height: '90vh',
        maxHeight: '780px',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-light)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        padding: 0,
        backgroundColor: 'var(--bg-card)'
      }}>
        {/* Header Bar */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-panel)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Navigation size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Live Provider Tracking
                </h3>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: statusBadge.bg,
                  color: statusBadge.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <StatusIcon size={12} />
                  <span>{statusBadge.label}</span>
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Booking #{trackingData?.bookingCode || bookingId} • {trackingData?.serviceName || 'Service Task'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => fetchTracking(false)}
              className="btn btn-secondary btn-sm"
              disabled={refreshing}
              title="Refresh tracking data"
              style={{ padding: '0.4rem 0.6rem' }}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.4rem 0.6rem' }}
              title="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Telemetry Status Ribbon */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
          padding: '0.75rem 1.25rem',
          backgroundColor: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '0.8125rem'
        }}>
          {/* Live Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: trackingData?.isLive || simulationActive ? '#10b981' : '#f59e0b',
              boxShadow: trackingData?.isLive || simulationActive ? '0 0 8px #10b981' : 'none',
              animation: 'pulse-dot 1.5s infinite'
            }} />
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>GPS Signal</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {simulationActive ? 'Simulated Live' : trackingData?.isLive ? 'Live GPS Online' : 'Active Connection'}
              </div>
            </div>
          </div>

          {/* Distance */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={16} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Distance</div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontFeatureSettings: 'tnum' }}>
                {computedMetrics.distanceKm} km
              </div>
            </div>
          </div>

          {/* ETA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} color="#10b981" />
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Estimated ETA</div>
              <div style={{ fontWeight: 700, color: '#10b981', fontFeatureSettings: 'tnum' }}>
                {computedMetrics.etaText}
              </div>
            </div>
          </div>

          {/* Destination */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Navigation size={16} color="#6366f1" />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Target Destination</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {trackingData?.status === 'IN_TRANSIT' && trackingData?.dropAddress ? trackingData.dropAddress : (trackingData?.address || 'Service Spot')}
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            margin: '0.75rem 1.25rem 0',
            padding: '0.65rem 0.85rem',
            backgroundColor: 'var(--error-bg)',
            border: '1px solid var(--error-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--error)',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Interactive Map Area */}
        <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: '320px', backgroundColor: '#0f172a' }}>
          {loading ? (
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              color: 'var(--text-muted)'
            }}>
              <RefreshCw size={28} className="animate-spin" color="var(--primary)" />
              <div style={{ fontSize: '0.875rem' }}>Connecting to live provider telemetry...</div>
            </div>
          ) : (
            <MapContainer
              center={providerCoords || customerCoords}
              zoom={14}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Provider Pin */}
              {providerCoords && (
                <Marker
                  position={providerCoords}
                  icon={createProviderIcon(!!trackingData?.vehicleType, trackingData?.providerName)}
                >
                  <Popup>
                    <div style={{ padding: '0.2rem', color: '#0f172a' }}>
                      <strong>{trackingData?.providerName || 'Service Provider'}</strong>
                      <div>Status: {statusBadge.label}</div>
                      {trackingData?.vehicleModel && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{trackingData.vehicleModel} ({trackingData.vehicleRegistrationNumber})</div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Customer Pin (Service / Pickup spot) */}
              {customerCoords && (
                <Marker
                  position={customerCoords}
                  icon={createCustomerIcon(false)}
                >
                  <Popup>
                    <div style={{ padding: '0.2rem', color: '#0f172a' }}>
                      <strong>Service Location</strong>
                      <div style={{ fontSize: '11px' }}>{trackingData?.address || 'Your Specified Address'}</div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Drop Pin (for Vehicle transport tasks) */}
              {dropCoords && (
                <Marker
                  position={dropCoords}
                  icon={createCustomerIcon(true)}
                >
                  <Popup>
                    <div style={{ padding: '0.2rem', color: '#0f172a' }}>
                      <strong>Drop Destination</strong>
                      <div style={{ fontSize: '11px' }}>{trackingData?.dropAddress || 'Destination Address'}</div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Live Route Polyline */}
              {polylinePositions.length >= 2 && (
                <Polyline
                  positions={polylinePositions}
                  pathOptions={{
                    color: '#6366f1',
                    weight: 5,
                    opacity: 0.85,
                    dashArray: '8, 8',
                    lineCap: 'round'
                  }}
                />
              )}

              <AutoFitBounds boundsCoords={allBoundsCoords} triggerRecenter={recenterTrigger} />
            </MapContainer>
          )}

          {/* Floating Map Controls */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            zIndex: 400
          }}>
            <button
              onClick={() => setRecenterTrigger(prev => prev + 1)}
              className="btn btn-secondary btn-sm"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(4px)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Navigation size={13} />
              <span>Center Map</span>
            </button>
          </div>
        </div>

        {/* Footer Provider Details & Action Controls */}
        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--bg-card)',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          {/* Provider Profile Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-subtle)',
              border: '2px solid var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.1rem',
              color: 'var(--primary)'
            }}>
              {trackingData?.providerName ? trackingData.providerName.charAt(0).toUpperCase() : <User size={22} />}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  {trackingData?.providerName || 'Assigned Taaskr Partner'}
                </span>
                <span title="Verified Provider" style={{ display: 'flex', alignItems: 'center', color: '#10b981' }}>
                  <ShieldCheck size={16} />
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#f59e0b', fontWeight: 600 }}>
                  <Star size={13} fill="#f59e0b" />
                  <span>{trackingData?.providerRating ? trackingData.providerRating.toFixed(1) : '4.9'}</span>
                </span>
                <span>•</span>
                <span>{trackingData?.providerExperienceYears || 3} yrs exp</span>
                {trackingData?.vehicleModel && (
                  <>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Truck size={12} color="var(--primary)" />
                      <span>{trackingData.vehicleModel} ({trackingData.vehicleRegistrationNumber || 'Reg Plate'})</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Demo Simulation Toggle */}
            <button
              onClick={simulationActive ? handleStopSimulation : handleStartSimulation}
              className={`btn btn-sm ${simulationActive ? 'btn-danger' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.45rem 0.75rem' }}
              title="Test route motion simulation"
            >
              <Play size={13} className={simulationActive ? 'animate-spin' : ''} />
              <span>{simulationActive ? 'Stop Sim' : 'Test Motion Sim'}</span>
            </button>

            {/* Direct Phone Call */}
            {trackingData?.providerPhone && (
              <a
                href={`tel:${trackingData.providerPhone}`}
                className="btn btn-primary btn-sm"
                style={{
                  fontSize: '0.8125rem',
                  padding: '0.45rem 0.9rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Phone size={14} />
                <span>Call Provider</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
