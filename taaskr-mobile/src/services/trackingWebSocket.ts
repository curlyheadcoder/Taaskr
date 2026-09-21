import { LiveLocationTelemetry } from '../types';
import { tokenStorage, serverStorage } from './api';

export type WebSocketConnectionState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'SUBSCRIBED'
  | 'RECONNECTING'
  | 'OFFLINE_FALLBACK';

export interface TrackingWebSocketOptions {
  bookingId: number;
  onTelemetry: (telemetry: LiveLocationTelemetry) => void;
  onStateChange: (state: WebSocketConnectionState) => void;
}

export class TrackingWebSocketService {
  private ws: WebSocket | null = null;
  private currentBookingId: number | null = null;
  private onTelemetryCallback: ((telemetry: LiveLocationTelemetry) => void) | null = null;
  private onStateChangeCallback: ((state: WebSocketConnectionState) => void) | null = null;

  private state: WebSocketConnectionState = 'DISCONNECTED';
  private reconnectTimer: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseBackoffMs = 1000;
  private maxBackoffMs = 16000;
  private latestTimestamp: number = 0;

  private isExplicitDisconnect = false;
  private frameBuffer = ''; // STOMP frame fragment buffer

  private setState(newState: WebSocketConnectionState) {
    if (this.state !== newState) {
      this.state = newState;
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(newState);
      }
    }
  }

  public async subscribeToBooking(options: TrackingWebSocketOptions): Promise<void> {
    // If switching booking, clean up existing connection completely
    if (this.currentBookingId && this.currentBookingId !== options.bookingId) {
      this.disconnect();
    }

    this.currentBookingId = options.bookingId;
    this.onTelemetryCallback = options.onTelemetry;
    this.onStateChangeCallback = options.onStateChange;
    this.isExplicitDisconnect = false;
    this.latestTimestamp = 0;

    await this.connect();
  }

  private async connect(): Promise<void> {
    if (this.isExplicitDisconnect) return;

    this.setState(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING');

    try {
      const token = await tokenStorage.getToken();
      if (!token) {
        console.warn('[STOMP WS] No auth token available for WebSocket connection.');
        this.setState('OFFLINE_FALLBACK');
        return;
      }

      const baseUrl = serverStorage.getActiveUrl();
      // CLEAN URL WITHOUT ANY CREDENTIAL QUERY PARAMETERS (ISSUE 1 FIX)
      const wsUrl = baseUrl
        .replace(/^http:/, 'ws:')
        .replace(/^https:/, 'wss:') + '/ws-taaskr';

      console.log(`[STOMP WS] Connecting clean socket to ${wsUrl} for Booking #${this.currentBookingId}...`);

      this.ws = new WebSocket(wsUrl);
      this.frameBuffer = '';

      this.ws.onopen = () => {
        console.log('[STOMP WS] Native WebSocket connected. Sending STOMP CONNECT frame with Bearer token...');
        this.sendStompConnect(token);
      };

      this.ws.onmessage = (event: WebSocketMessageEvent) => {
        // Feed incoming chunk to STOMP frame buffer processor (ISSUE 3 FIX)
        this.processIncomingChunk(String(event.data));
      };

      this.ws.onerror = (err) => {
        console.warn('[STOMP WS Error]', err);
      };

      this.ws.onclose = (event: WebSocketCloseEvent) => {
        console.log(`[STOMP WS Closed] Code: ${event.code}, Reason: ${event.reason}`);
        if (!this.isExplicitDisconnect) {
          this.scheduleReconnect();
        }
      };
    } catch (e: any) {
      console.error('[STOMP WS Connect Exception]', e);
      this.scheduleReconnect();
    }
  }

  // ---------------------------------------------------------------------------
  // STOMP 1.2 Protocol Frame Encoders
  // ---------------------------------------------------------------------------
  private sendStompConnect(token: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Authenticate exclusively via STOMP CONNECT headers (NO URL query params)
    const connectFrame =
      `CONNECT\n` +
      `accept-version:1.2,1.1,1.0\n` +
      `heart-beat:10000,10000\n` +
      `passcode:${token}\n` +
      `Authorization:Bearer ${token}\n\n\x00`;

    this.ws.send(connectFrame);
  }

  private sendStompSubscribe(bookingId: number) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const topic = `/topic/bookings/${bookingId}/location`;
    console.log(`[STOMP WS] Subscribing to topic: ${topic}`);

    const subFrame =
      `SUBSCRIBE\n` +
      `id:sub-${bookingId}\n` +
      `destination:${topic}\n\n\x00`;

    this.ws.send(subFrame);
    this.setState('SUBSCRIBED');
  }

  private sendStompUnsubscribe(bookingId: number) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const unsubFrame = `UNSUBSCRIBE\nid:sub-${bookingId}\n\n\x00`;
    try {
      this.ws.send(unsubFrame);
    } catch {}
  }

  private sendStompDisconnect() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const discFrame = `DISCONNECT\nreceipt:disc-${Date.now()}\n\n\x00`;
    try {
      this.ws.send(discFrame);
    } catch {}
  }

  // ---------------------------------------------------------------------------
  // ISSUE 3 FIX: STOMP Frame Buffering Engine for Fragmented & Multiple Frames
  // ---------------------------------------------------------------------------
  public processIncomingChunk(chunk: string) {
    if (!chunk) return;

    // Append incoming data chunk to internal buffer
    this.frameBuffer += chunk;

    // Extract all complete null-byte-terminated (\x00) STOMP frames from buffer
    let nullIndex = this.frameBuffer.indexOf('\x00');
    while (nullIndex !== -1) {
      const rawFrame = this.frameBuffer.substring(0, nullIndex);
      this.frameBuffer = this.frameBuffer.substring(nullIndex + 1);

      this.parseAndDispatchSingleFrame(rawFrame);

      nullIndex = this.frameBuffer.indexOf('\x00');
    }
  }

  private parseAndDispatchSingleFrame(rawFrame: string) {
    // 1. Handle STOMP Heartbeat frames (\n or \r\n empty lines sent by server)
    const trimmed = rawFrame.trim();
    if (!trimmed) {
      // Heartbeat pulse received: ignore silently without error
      return;
    }

    try {
      const lines = rawFrame.split('\n');
      const command = lines[0].trim();

      if (command === 'CONNECTED') {
        console.log('[STOMP WS] Handshake & Auth CONNECTED!');
        this.reconnectAttempts = 0; // Reset backoff on clean connection
        this.setState('CONNECTED');
        if (this.currentBookingId) {
          this.sendStompSubscribe(this.currentBookingId);
        }
      } else if (command === 'MESSAGE') {
        this.processStompMessage(lines, rawFrame);
      } else if (command === 'ERROR') {
        console.error('[STOMP WS Server Error]', trimmed);
        this.setState('OFFLINE_FALLBACK');
      }
    } catch (err: any) {
      console.warn('[STOMP WS Parser Exception] Safely caught malformed STOMP frame:', err.message || err);
    }
  }

  private processStompMessage(lines: string[], rawFrame: string) {
    // Check for content-length header if present in frame
    let contentLength: number | null = null;
    let bodyIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.toLowerCase().startsWith('content-length:')) {
        const val = parseInt(line.split(':')[1].trim(), 10);
        if (!isNaN(val)) contentLength = val;
      }
      if (line === '') {
        bodyIndex = i + 1;
        break;
      }
    }

    if (bodyIndex === -1 || bodyIndex >= lines.length) return;

    let bodyText = lines.slice(bodyIndex).join('\n').trim();
    if (contentLength !== null && contentLength > 0) {
      bodyText = bodyText.substring(0, contentLength);
    }

    if (!bodyText) return;

    try {
      const parsed = JSON.parse(bodyText);
      this.validateAndDeliverTelemetry(parsed);
    } catch (e) {
      console.warn('[STOMP WS] Received non-JSON telemetry payload:', bodyText);
    }
  }

  private validateAndDeliverTelemetry(payload: any) {
    if (!payload || typeof payload !== 'object') return;

    // 1. Strict Booking ID Validation
    const messageBookingId = payload.bookingId ? Number(payload.bookingId) : null;
    if (messageBookingId && this.currentBookingId && messageBookingId !== this.currentBookingId) {
      console.warn(`[STOMP WS Security Check] Received telemetry for Booking #${messageBookingId} while subscribed to #${this.currentBookingId}. Ignoring.`);
      return;
    }

    // 2. Coordinates Range Validation
    if (payload.partnerLatitude !== undefined && payload.partnerLatitude !== null) {
      const lat = Number(payload.partnerLatitude);
      if (isNaN(lat) || lat < -90 || lat > 90) return;
    }
    if (payload.partnerLongitude !== undefined && payload.partnerLongitude !== null) {
      const lng = Number(payload.partnerLongitude);
      if (isNaN(lng) || lng < -180 || lng > 180) return;
    }

    // 3. Timestamp Ordering Guard
    if (payload.timestamp) {
      const sampleTime = new Date(payload.timestamp).getTime();
      if (!isNaN(sampleTime)) {
        if (sampleTime < this.latestTimestamp) {
          console.log('[STOMP WS] Out-of-order telemetry sample ignored.');
          return;
        }
        this.latestTimestamp = sampleTime;
      }
    }

    // Map verified payload into LiveLocationTelemetry interface
    const telemetry: LiveLocationTelemetry = {
      bookingId: this.currentBookingId || payload.bookingId,
      status: payload.status,
      partnerLatitude: payload.partnerLatitude !== undefined ? Number(payload.partnerLatitude) : undefined,
      partnerLongitude: payload.partnerLongitude !== undefined ? Number(payload.partnerLongitude) : undefined,
      distanceKm: payload.distanceKm !== undefined ? Number(payload.distanceKm) : undefined,
      estimatedEtaMinutes: payload.estimatedEtaMinutes !== undefined ? Number(payload.estimatedEtaMinutes) : undefined,
      isLive: payload.isLive !== undefined ? Boolean(payload.isLive) : true,
      message: payload.message,
      timestamp: payload.timestamp || new Date().toISOString(),
    };

    console.log(`[STOMP WS Telemetry Received] Booking #${telemetry.bookingId} status=${telemetry.status} lat=${telemetry.partnerLatitude} lng=${telemetry.partnerLongitude}`);

    if (this.onTelemetryCallback) {
      this.onTelemetryCallback(telemetry);
    }
  }

  // ---------------------------------------------------------------------------
  // Reconnect with Exponential Backoff
  // ---------------------------------------------------------------------------
  private scheduleReconnect() {
    if (this.isExplicitDisconnect) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn(`[STOMP WS] Max reconnect attempts (${this.maxReconnectAttempts}) reached. Falling back to REST polling.`);
      this.setState('OFFLINE_FALLBACK');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.baseBackoffMs * Math.pow(2, this.reconnectAttempts - 1),
      this.maxBackoffMs
    );

    console.log(`[STOMP WS Reconnect] Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} scheduled in ${delay}ms...`);
    this.setState('RECONNECTING');

    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  public disconnect(): void {
    this.isExplicitDisconnect = true;
    this.clearReconnectTimer();

    if (this.currentBookingId) {
      this.sendStompUnsubscribe(this.currentBookingId);
    }
    this.sendStompDisconnect();

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    this.currentBookingId = null;
    this.onTelemetryCallback = null;
    this.onStateChangeCallback = null;
    this.reconnectAttempts = 0;
    this.latestTimestamp = 0;
    this.frameBuffer = '';
    this.setState('DISCONNECTED');
  }

  public getState(): WebSocketConnectionState {
    return this.state;
  }
}

export const trackingWebSocket = new TrackingWebSocketService();
