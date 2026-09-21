import { TrackingWebSocketService } from '../services/trackingWebSocket';
import { enqueueOfflineSample, QueuedLocationSample } from '../services/locationTask';
import AsyncStorage from '@react-native-async-storage/async-storage';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[TEST FAILURE] ${message}`);
  }
}

export async function runTrackingHardeningSuite(): Promise<{ total: number; passed: number; failed: number }> {
  let passed = 0;
  let total = 0;

  async function runTest(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`✅ [PASS] ${name}`);
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.message || err);
    }
  }

  // TEST 1: STOMP Complete Frame & CONNECTED
  await runTest('TEST 1: STOMP complete frame parsing & CONNECTED handling', async () => {
    const ws = new TrackingWebSocketService();
    let state = '';
    ws.subscribeToBooking({
      bookingId: 101,
      onTelemetry: () => {},
      onStateChange: (s) => { state = s; },
    });

    ws.processIncomingChunk(`CONNECTED\nversion:1.2\n\n\x00`);
    assert(state === 'SUBSCRIBED' || state === 'CONNECTED', `State should be SUBSCRIBED/CONNECTED, got ${state}`);
    ws.disconnect();
  });

  // TEST 2: Multiple STOMP Frames in Single Chunk
  await runTest('TEST 2: Multiple STOMP frames in a single WebSocket message chunk', async () => {
    const ws = new TrackingWebSocketService();
    const received: any[] = [];
    ws.subscribeToBooking({
      bookingId: 101,
      onTelemetry: (t) => received.push(t),
      onStateChange: () => {},
    });

    const frame1 = `CONNECTED\nversion:1.2\n\n\x00`;
    const frame2 =
      `MESSAGE\n` +
      `destination:/topic/bookings/101/location\n\n` +
      `{"bookingId":101,"status":"ON_THE_WAY","partnerLatitude":22.7196,"partnerLongitude":75.8577,"timestamp":"2026-09-18T12:00:00.000Z"}\x00`;

    ws.processIncomingChunk(frame1 + frame2);

    assert(received.length === 1, `Expected 1 telemetry payload, got ${received.length}`);
    assert(received[0].partnerLatitude === 22.7196, `Expected lat 22.7196, got ${received[0].partnerLatitude}`);
    ws.disconnect();
  });

  // TEST 3: Fragmented STOMP Frame
  await runTest('TEST 3: Fragmented STOMP frame split across multiple WebSocket message chunks', async () => {
    const ws = new TrackingWebSocketService();
    const received: any[] = [];
    ws.subscribeToBooking({
      bookingId: 101,
      onTelemetry: (t) => received.push(t),
      onStateChange: () => {},
    });

    const chunk1 = `CONNECTED\nversion:1.2\n\n\x00MESSAGE\ndestination:/topic/bookings/101/location\n\n{"bookingId":101,"status":"ON_THE_`;
    const chunk2 = `WAY","partnerLatitude":22.7500,"partnerLongitude":75.8900,"timestamp":"2026-09-18T12:00:00.000Z"}\x00`;

    ws.processIncomingChunk(chunk1);
    assert(received.length === 0, `Expected 0 telemetry during partial chunk, got ${received.length}`);

    ws.processIncomingChunk(chunk2);
    assert(received.length === 1, `Expected 1 telemetry after completing chunk, got ${received.length}`);
    assert(received[0].partnerLatitude === 22.75, `Expected lat 22.75, got ${received[0].partnerLatitude}`);
    ws.disconnect();
  });

  // TEST 4: Heartbeat Frame Handling
  await runTest('TEST 4: STOMP Heartbeat frame handling', async () => {
    const ws = new TrackingWebSocketService();
    const received: any[] = [];
    ws.subscribeToBooking({
      bookingId: 101,
      onTelemetry: (t) => received.push(t),
      onStateChange: () => {},
    });

    ws.processIncomingChunk('\n\x00\r\n\x00');
    assert(received.length === 0, `Heartbeat should produce 0 telemetry payloads`);
    ws.disconnect();
  });

  // TEST 5: Malformed JSON Handling
  await runTest('TEST 5: Malformed STOMP frame & invalid JSON handling', async () => {
    const ws = new TrackingWebSocketService();
    const received: any[] = [];
    ws.subscribeToBooking({
      bookingId: 101,
      onTelemetry: (t) => received.push(t),
      onStateChange: () => {},
    });

    ws.processIncomingChunk(`MESSAGE\ndestination:/topic/bookings/101/location\n\nNON_JSON\x00`);
    assert(received.length === 0, `Malformed frame should produce 0 telemetry payloads`);
    ws.disconnect();
  });

  // TEST 6: Booking ID Mismatch Check
  await runTest('TEST 6: Booking ID authorization validation (Rejects mismatching bookingId)', async () => {
    const ws = new TrackingWebSocketService();
    const received: any[] = [];
    ws.subscribeToBooking({
      bookingId: 101,
      onTelemetry: (t) => received.push(t),
      onStateChange: () => {},
    });

    const mismatch =
      `MESSAGE\ndestination:/topic/bookings/101/location\n\n` +
      `{"bookingId":999,"status":"ON_THE_WAY","partnerLatitude":22.1,"partnerLongitude":75.1}\x00`;

    ws.processIncomingChunk(mismatch);
    assert(received.length === 0, `Mismatching bookingId 999 should be rejected for subscriber 101`);
    ws.disconnect();
  });

  // TEST 7: Coordinates Range Validation
  await runTest('TEST 7: Latitude and Longitude bounds validation', async () => {
    const ws = new TrackingWebSocketService();
    const received: any[] = [];
    ws.subscribeToBooking({
      bookingId: 101,
      onTelemetry: (t) => received.push(t),
      onStateChange: () => {},
    });

    const invalidLat =
      `MESSAGE\ndestination:/topic/bookings/101/location\n\n` +
      `{"bookingId":101,"status":"ON_THE_WAY","partnerLatitude":195.0,"partnerLongitude":75.1}\x00`;

    ws.processIncomingChunk(invalidLat);
    assert(received.length === 0, `Invalid lat 195.0 should be rejected`);
    ws.disconnect();
  });

  // TEST 8: Timestamp Ordering Guard
  await runTest('TEST 8: Timestamp ordering guard (Ignores older sample)', async () => {
    const ws = new TrackingWebSocketService();
    const received: any[] = [];
    ws.subscribeToBooking({
      bookingId: 101,
      onTelemetry: (t) => received.push(t),
      onStateChange: () => {},
    });

    const sampleNewer =
      `MESSAGE\ndestination:/topic/bookings/101/location\n\n` +
      `{"bookingId":101,"status":"ON_THE_WAY","partnerLatitude":22.1,"partnerLongitude":75.1,"timestamp":"2026-09-18T14:00:00.000Z"}\x00`;

    const sampleOlder =
      `MESSAGE\ndestination:/topic/bookings/101/location\n\n` +
      `{"bookingId":101,"status":"ON_THE_WAY","partnerLatitude":22.0,"partnerLongitude":75.0,"timestamp":"2026-09-18T13:00:00.000Z"}\x00`;

    ws.processIncomingChunk(sampleNewer);
    assert(received.length === 1, `Sample newer should be accepted`);

    ws.processIncomingChunk(sampleOlder);
    assert(received.length === 1, `Sample older should be ignored`);
    ws.disconnect();
  });

  // TEST 9: Offline GPS Queue Enqueue & FIFO
  await runTest('TEST 9: Offline GPS queue FIFO enqueue & AsyncStorage serialization', async () => {
    await AsyncStorage.removeItem('@taaskr_offline_gps_queue');

    const sample1: QueuedLocationSample = { latitude: 22.1, longitude: 75.1, timestamp: 1000, bookingId: 101 };
    const sample2: QueuedLocationSample = { latitude: 22.2, longitude: 75.2, timestamp: 2000, bookingId: 101 };

    await enqueueOfflineSample(sample1);
    await enqueueOfflineSample(sample2);

    const storedRaw = await AsyncStorage.getItem('@taaskr_offline_gps_queue');
    const queue: QueuedLocationSample[] = JSON.parse(storedRaw || '[]');

    assert(queue.length === 2, `Queue length should be 2, got ${queue.length}`);
    assert(queue[0].timestamp === 1000, `First item timestamp should be 1000, got ${queue[0].timestamp}`);
    assert(queue[1].timestamp === 2000, `Second item timestamp should be 2000, got ${queue[1].timestamp}`);
  });

  return { total, passed, failed: total - passed };
}
