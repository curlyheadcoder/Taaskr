import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const TAASKR_PARTNER_LOCATION_TASK = 'TAASKR_PARTNER_LOCATION_TASK';
const ACTIVE_TRACKING_BOOKING_KEY = 'taaskr_active_tracking_booking_id';
const OFFLINE_GPS_QUEUE_KEY = '@taaskr_offline_gps_queue';

export interface QueuedLocationSample {
  latitude: number;
  longitude: number;
  timestamp: number;
  bookingId: number;
}

// Mutex flag to prevent concurrent flush execution
let isFlushingQueue = false;
const MAX_OFFLINE_QUEUE_SIZE = 30;

// ---------------------------------------------------------------------------
// 1. Task Definition (Must be defined at top-level module load)
// ---------------------------------------------------------------------------
TaskManager.defineTask(TAASKR_PARTNER_LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error(`[GPS Task Error] TaskManager error:`, error.message);
    return;
  }

  if (!data || !data.locations || !Array.isArray(data.locations) || data.locations.length === 0) {
    return;
  }

  try {
    const rawBookingId = await SecureStore.getItemAsync(ACTIVE_TRACKING_BOOKING_KEY);
    if (!rawBookingId) {
      console.log('[GPS Task] No active tracking booking context found. Stopping background updates.');
      await stopPartnerTracking();
      return;
    }

    const bookingId = parseInt(rawBookingId, 10);
    if (isNaN(bookingId)) return;

    const locations: Location.LocationObject[] = data.locations;

    for (const sample of locations) {
      const { latitude, longitude } = sample.coords;
      // Real device GPS sample timestamp (epoch milliseconds)
      const timestamp = typeof sample.timestamp === 'number' && sample.timestamp > 0
        ? sample.timestamp
        : Date.now();

      await sendOrQueueTelemetry({ latitude, longitude, timestamp, bookingId });
    }
  } catch (err: any) {
    console.error('[GPS Task Exception]', err);
  }
});

// ---------------------------------------------------------------------------
// 2. Network & Offline Telemetry Publisher Helper
// ---------------------------------------------------------------------------
export async function sendOrQueueTelemetry(sample: QueuedLocationSample) {
  try {
    // Attempt to flush any previously queued offline samples first
    await flushOfflineQueue();

    // Send current real GPS sample to backend API
    await api.partner.updateLocation({
      latitude: sample.latitude,
      longitude: sample.longitude,
      timestamp: sample.timestamp,
      bookingId: sample.bookingId,
    });

    console.log(`[GPS Telemetry Published] Booking #${sample.bookingId} -> ${sample.latitude.toFixed(5)}°, ${sample.longitude.toFixed(5)}° @ ${new Date(sample.timestamp).toISOString()}`);
  } catch (networkErr: any) {
    console.warn(`[GPS Network Warning] Direct send failed. Saving sample to AsyncStorage queue:`, networkErr.message || networkErr);
    await enqueueOfflineSample(sample);
  }
}

export async function enqueueOfflineSample(sample: QueuedLocationSample) {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_GPS_QUEUE_KEY);
    let queue: QueuedLocationSample[] = [];
    if (raw) {
      try {
        queue = JSON.parse(raw);
        if (!Array.isArray(queue)) queue = [];
      } catch {
        queue = [];
      }
    }

    // Preserve FIFO queue size cap (max 30 items)
    if (queue.length >= MAX_OFFLINE_QUEUE_SIZE) {
      queue.shift(); // Evict oldest sample to maintain recent telemetry
    }
    queue.push(sample);
    await AsyncStorage.setItem(OFFLINE_GPS_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('[GPS Offline Queue Enqueue Error]', e);
  }
}

export async function flushOfflineQueue(): Promise<number> {
  if (isFlushingQueue) return 0;
  isFlushingQueue = true;
  let flushedCount = 0;

  try {
    const raw = await AsyncStorage.getItem(OFFLINE_GPS_QUEUE_KEY);
    if (!raw) return 0;

    let queue: QueuedLocationSample[] = [];
    try {
      queue = JSON.parse(raw);
      if (!Array.isArray(queue)) queue = [];
    } catch {
      await AsyncStorage.removeItem(OFFLINE_GPS_QUEUE_KEY);
      return 0;
    }

    if (queue.length === 0) return 0;

    console.log(`[GPS Offline Queue] Attempting to flush ${queue.length} offline samples...`);
    const remaining: QueuedLocationSample[] = [];

    // Process in FIFO chronological order
    for (const item of queue) {
      try {
        await api.partner.updateLocation({
          latitude: item.latitude,
          longitude: item.longitude,
          timestamp: item.timestamp,
          bookingId: item.bookingId,
        });
        flushedCount++;
      } catch (err) {
        // If sending fails, keep item in remaining queue and stop current flush loop
        remaining.push(item);
      }
    }

    if (remaining.length > 0) {
      await AsyncStorage.setItem(OFFLINE_GPS_QUEUE_KEY, JSON.stringify(remaining));
    } else {
      await AsyncStorage.removeItem(OFFLINE_GPS_QUEUE_KEY);
      console.log('[GPS Offline Queue] All offline samples successfully flushed to backend!');
    }
  } catch (e) {
    console.error('[GPS Queue Flush Error]', e);
  } finally {
    isFlushingQueue = false;
  }

  return flushedCount;
}

// ---------------------------------------------------------------------------
// 3. Public API: Start, Stop, and Query Real GPS Partner Tracking
// ---------------------------------------------------------------------------

/**
 * Starts real device GPS location tracking for a specific active journey booking.
 */
export async function startPartnerTracking(bookingId: number): Promise<{ success: boolean; message: string }> {
  try {
    // Step 1: Request Foreground Location Permission
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== Location.PermissionStatus.GRANTED) {
      return {
        success: false,
        message: 'Foreground location permission is required while travelling to the customer location.',
      };
    }

    // Step 2: Request Background Location Permission
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== Location.PermissionStatus.GRANTED) {
      console.warn('[GPS Tracking] Background location permission not granted. Foreground-only tracking will be active.');
    }

    // Step 3: Check if location services are enabled on the device
    const providerStatus = await Location.getProviderStatusAsync();
    if (!providerStatus.locationServicesEnabled) {
      return {
        success: false,
        message: 'GPS Location Services are disabled on this device. Please turn on Location in device settings.',
      };
    }

    // Step 4: Save active tracking booking context securely in SecureStore
    await SecureStore.setItemAsync(ACTIVE_TRACKING_BOOKING_KEY, String(bookingId));

    // Step 5: Start Location Updates with Foreground Service Notification
    await Location.startLocationUpdatesAsync(TAASKR_PARTNER_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,          // Sample every 5 seconds
      distanceInterval: 10,         // Sample every 10 meters moved
      deferredUpdatesInterval: 5000,
      deferredUpdatesDistance: 10,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Taaskr — Journey tracking active',
        notificationBody: `Sharing live location with customer for Booking #${bookingId}`,
        notificationColor: '#F59E0B',
      },
    });

    // Step 6: Trigger an immediate initial GPS sample
    try {
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      if (initialLocation) {
        await sendOrQueueTelemetry({
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
          timestamp: initialLocation.timestamp || Date.now(),
          bookingId,
        });
      }
    } catch (posErr) {
      console.warn('[GPS Tracking] Could not acquire immediate initial fix, background task will supply sample:', posErr);
    }

    console.log(`[GPS Tracking Started] Active for Booking #${bookingId}`);
    return {
      success: true,
      message: 'Real-time GPS location sharing active.',
    };
  } catch (err: any) {
    console.error('[GPS Start Error]', err);
    return {
      success: false,
      message: err.message || 'Failed to start GPS tracking service.',
    };
  }
}

/**
 * Stops real device GPS location tracking and clears the active booking context.
 */
export async function stopPartnerTracking(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(TAASKR_PARTNER_LOCATION_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(TAASKR_PARTNER_LOCATION_TASK);
      console.log('[GPS Tracking Stopped] Background location updates stopped.');
    }
    await SecureStore.deleteItemAsync(ACTIVE_TRACKING_BOOKING_KEY);
  } catch (err: any) {
    console.error('[GPS Stop Error]', err);
  }
}

/**
 * Checks if GPS partner tracking is currently active on the device.
 */
export async function isPartnerTrackingActive(): Promise<boolean> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(TAASKR_PARTNER_LOCATION_TASK);
    const activeId = await SecureStore.getItemAsync(ACTIVE_TRACKING_BOOKING_KEY);
    return Boolean(isRegistered && activeId);
  } catch {
    return false;
  }
}

/**
 * Gets the active booking ID currently being tracked, if any.
 */
export async function getActiveTrackingBookingId(): Promise<number | null> {
  try {
    const rawId = await SecureStore.getItemAsync(ACTIVE_TRACKING_BOOKING_KEY);
    return rawId ? parseInt(rawId, 10) : null;
  } catch {
    return null;
  }
}
