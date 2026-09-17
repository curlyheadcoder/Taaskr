// Taaskr Native API Service Layer (Connected to Spring Boot Backend)
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { 
  AuthResponse, Category, ServiceItem, Booking, 
  ProviderProfile, ServicePartner, User, BookingStatus, PaymentMethod, LiveLocationTelemetry,
  Address, NotificationItem, Review, Dispute, Payout, WalletOverview, KycDocument,
  Vehicle, VehicleEstimate, PricingRule, ProviderAvailability, ProviderBankDetails,
  ProviderDiscussion, AdminAnalytics, Favorite, OtpResponse
} from '../types';

const TOKEN_KEY = 'taaskr_jwt_token';
const USER_KEY = 'taaskr_current_user';
const SERVER_URL_KEY = 'taaskr_server_url';

export const CLOUD_URL = 'https://taaskr-backend.onrender.com';

// Auto-detect local Expo Host IP (e.g. 192.168.x.x:8080)
const getAutoLocalUrl = (): string => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.developer?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8080`;
    }
  }
  return 'http://10.0.2.2:8080'; // Android emulator default fallback
};

export const DEFAULT_LOCAL_URL = getAutoLocalUrl();

let activeBaseUrl = CLOUD_URL;

export const serverStorage = {
  getServerUrl: async (): Promise<string> => {
    try {
      const stored = await SecureStore.getItemAsync(SERVER_URL_KEY);
      if (stored) {
        activeBaseUrl = stored;
        return stored;
      }
    } catch {}
    return activeBaseUrl;
  },

  setServerUrl: async (url: string): Promise<void> => {
    const trimmed = url.replace(/\/+$/, '');
    activeBaseUrl = trimmed;
    try {
      await SecureStore.setItemAsync(SERVER_URL_KEY, trimmed);
    } catch (e) {
      console.error('Failed to save server URL:', e);
    }
  },

  getActiveUrl: (): string => activeBaseUrl,

  testConnection: async (targetUrl: string): Promise<{ success: boolean; pingMs: number; message: string }> => {
    const cleanUrl = targetUrl.replace(/\/+$/, '');
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${cleanUrl}/actuator/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const pingMs = Date.now() - start;
      if (res.ok) {
        return { success: true, pingMs, message: `Connected (${pingMs}ms)` };
      } else {
        return { success: false, pingMs, message: `Server returned HTTP ${res.status}` };
      }
    } catch (e: any) {
      const pingMs = Date.now() - start;
      if (e.name === 'AbortError') {
        return { success: false, pingMs, message: 'Connection timed out (10s)' };
      }
      return { success: false, pingMs, message: e.message || 'Network unreachable' };
    }
  }
};

// Initialize server URL on app boot
serverStorage.getServerUrl();

export const tokenStorage = {
  getToken: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken: async (token: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to save auth token to SecureStore:', e);
    }
  },

  removeToken: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (e) {}
  }
};

const getHeaders = async () => {
  const token = await tokenStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    await tokenStorage.removeToken();
  }
  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  
  if (!res.ok) {
    let errorMsg = `Server returned HTTP ${res.status}`;
    try {
      if (contentType.includes('application/json')) {
        const err = await res.json();
        errorMsg = err.message || err.error || errorMsg;
      } else {
        const text = await res.text();
        if (text && text.trim().length > 0 && !text.includes('<!DOCTYPE html>')) {
          errorMsg = text.trim();
        }
      }
    } catch (e) {}
    throw new Error(errorMsg);
  }

  if (contentType.includes('application/json')) {
    return res.json();
  } else {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
};

const makeRequest = async (path: string, options: RequestInit = {}) => {
  const baseUrl = await serverStorage.getServerUrl();
  const headers = await getHeaders();
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
  
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return handleResponse(response);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out (30s). Check backend URL (${baseUrl})`);
    }
    throw err;
  }
};

const makeMultipartRequest = async (path: string, formData: FormData, options: RequestInit = {}) => {
  const baseUrl = await serverStorage.getServerUrl();
  const token = await tokenStorage.getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);
  
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      body: formData,
      ...options,
      headers: {
        ...headers,
        ...options.headers
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return handleResponse(response);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Multipart request timed out. Check backend URL (${baseUrl})`);
    }
    throw err;
  }
};

export const api = {
  // ----------------------------------------
  // AUTHENTICATION & SECURITY
  // ----------------------------------------
  auth: {
    login: async (email: string, pass: string): Promise<AuthResponse> => {
      const res = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass })
      });
      if (res && res.token) {
        await tokenStorage.setToken(res.token);
      }
      return res;
    },

    register: async (data: any): Promise<AuthResponse> => {
      const res = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res && res.token) {
        await tokenStorage.setToken(res.token);
      }
      return res;
    },

    me: async (): Promise<User> => {
      return makeRequest('/api/auth/me');
    },

    updateProfile: async (data: any): Promise<User> => {
      return makeRequest('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    sendVerificationOtp: async (email: string): Promise<OtpResponse> => {
      return makeRequest('/api/auth/send-verification-otp', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    },

    verifyEmail: async (email: string, otp: string): Promise<any> => {
      return makeRequest('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email, otp })
      });
    },

    sendPhoneOtp: async (phone: string): Promise<OtpResponse> => {
      return makeRequest('/api/auth/send-phone-otp', {
        method: 'POST',
        body: JSON.stringify({ phone })
      });
    },

    verifyPhone: async (phone: string, otp: string): Promise<any> => {
      return makeRequest('/api/auth/verify-phone', {
        method: 'POST',
        body: JSON.stringify({ phone, otp })
      });
    },

    forgotPassword: async (email: string): Promise<OtpResponse> => {
      return makeRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    },

    resetPassword: async (email: string, otp: string, newPassword: string): Promise<any> => {
      return makeRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword })
      });
    },

    resendOtp: async (email: string, type: string): Promise<OtpResponse> => {
      return makeRequest('/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email, type })
      });
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<any> => {
      return makeRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
    },

    logout: async (): Promise<void> => {
      await tokenStorage.removeToken();
    }
  },

  // ----------------------------------------
  // CATALOG (PUBLIC)
  // ----------------------------------------
  catalog: {
    getCategories: async (): Promise<Category[]> => {
      return makeRequest('/api/categories');
    },

    getServices: async (categoryId?: number): Promise<ServiceItem[]> => {
      const query = categoryId ? `?categoryId=${categoryId}` : '';
      return makeRequest(`/api/services${query}`);
    },

    getServiceById: async (serviceId: number): Promise<ServiceItem> => {
      return makeRequest(`/api/services/${serviceId}`);
    }
  },

  // ----------------------------------------
  // CUSTOMER BOOKINGS FLOW
  // ----------------------------------------
  bookings: {
    create: async (bookingData: any): Promise<Booking> => {
      return makeRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });
    },

    getAvailableProviders: async (serviceId: number, city?: string, pincode?: string, date?: string, startTime?: string): Promise<ProviderProfile[]> => {
      const params = new URLSearchParams({
        serviceId: String(serviceId),
        date: date || '',
        startTime: startTime || ''
      });
      if (city) params.append('city', city);
      if (pincode) params.append('pincode', pincode);
      return makeRequest(`/api/bookings/available-providers?${params.toString()}`);
    },

    getMyBookings: async (): Promise<Booking[]> => {
      return makeRequest('/api/bookings/my');
    },

    getById: async (bookingId: number): Promise<Booking> => {
      return makeRequest(`/api/bookings/${bookingId}`);
    },

    rate: async (bookingId: number, ratingData: number | { rating: number; review?: string }): Promise<Booking> => {
      const payload = typeof ratingData === 'number' ? { rating: ratingData } : ratingData;
      return makeRequest(`/api/bookings/${bookingId}/rate`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    cancel: async (bookingId: number, cancellationReason: string = ''): Promise<Booking> => {
      return makeRequest(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ cancellationReason })
      });
    }
  },

  // ----------------------------------------
  // PROVIDER WORKFLOW
  // ----------------------------------------
  provider: {
    getProfile: async (): Promise<ProviderProfile> => {
      return makeRequest('/api/provider/profile');
    },

    updateProfile: async (data: any): Promise<ProviderProfile> => {
      return makeRequest('/api/provider/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    getBankDetails: async (): Promise<ProviderBankDetails> => {
      return makeRequest('/api/provider/bank-details');
    },

    updateBankDetails: async (data: any): Promise<ProviderBankDetails> => {
      return makeRequest('/api/provider/bank-details', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    getAvailability: async (): Promise<ProviderAvailability[]> => {
      return makeRequest('/api/provider/availability');
    },

    createAvailability: async (data: any): Promise<ProviderAvailability> => {
      let availableDate = data.availableDate;
      if (availableDate instanceof Date) {
        availableDate = availableDate.toISOString().split('T')[0];
      } else if (typeof availableDate === 'string') {
        availableDate = availableDate.split('T')[0].split(' ')[0];
      }

      const formatTime = (timeStr: string) => {
        if (!timeStr) return '00:00:00';
        const parts = timeStr.split(':');
        if (parts.length === 2) {
          return `${timeStr}:00`;
        }
        return timeStr;
      };

      const payload = {
        availableDate,
        startTime: formatTime(data.startTime),
        endTime: formatTime(data.endTime)
      };

      return makeRequest('/api/provider/availability', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    deleteAvailability: async (slotId: number): Promise<void> => {
      return makeRequest(`/api/provider/availability/${slotId}`, {
        method: 'DELETE'
      });
    },

    getBookings: async (): Promise<Booking[]> => {
      return makeRequest('/api/provider/bookings');
    },

    getAvailableTasks: async (): Promise<Booking[]> => {
      return makeRequest('/api/provider/available-tasks');
    },

    claimTask: async (bookingId: number): Promise<Booking> => {
      return makeRequest(`/api/provider/bookings/${bookingId}/claim`, {
        method: 'PUT'
      });
    },

    acceptBooking: async (bookingId: number): Promise<Booking> => {
      return makeRequest(`/api/provider/bookings/${bookingId}/accept`, {
        method: 'PUT'
      });
    },

    rejectBooking: async (bookingId: number, reason: string = ''): Promise<Booking> => {
      const url = reason ? `/api/provider/bookings/${bookingId}/reject?reason=${encodeURIComponent(reason)}` : `/api/provider/bookings/${bookingId}/reject`;
      return makeRequest(url, {
        method: 'PUT'
      });
    },

    updateBookingStatus: async (bookingId: number, status: BookingStatus, reason: string = ''): Promise<Booking> => {
      return makeRequest(`/api/provider/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, reason })
      });
    },

    updateStatus: async (bookingId: number, status: BookingStatus, reason: string = ''): Promise<Booking> => {
      return makeRequest(`/api/provider/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, reason })
      });
    },

    markAfterServicePaymentReceived: async (bookingId: number): Promise<Booking> => {
      return makeRequest(`/api/provider/bookings/${bookingId}/payment-received`, {
        method: 'PUT'
      });
    },

    toggleOnlineStatus: async (isOnline: boolean): Promise<ProviderProfile> => {
      return makeRequest(`/api/provider/status?online=${isOnline}`, {
        method: 'PUT'
      });
    },

    getCategories: async (): Promise<Category[]> => {
      return makeRequest('/api/provider/categories');
    },

    updateCategories: async (categoryIds: number[]): Promise<void> => {
      return makeRequest('/api/provider/categories', {
        method: 'PUT',
        body: JSON.stringify({ categoryIds })
      });
    },

    getDiscussions: async (): Promise<ProviderDiscussion[]> => {
      return makeRequest('/api/provider/discussions');
    },

    getDiscussionById: async (discussionId: number): Promise<ProviderDiscussion> => {
      return makeRequest(`/api/provider/discussions/${discussionId}`);
    },

    createDiscussion: async (data: any): Promise<ProviderDiscussion> => {
      return makeRequest('/api/provider/discussions', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    replyDiscussion: async (discussionId: number, message: string): Promise<ProviderDiscussion> => {
      return makeRequest(`/api/provider/discussions/${discussionId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
    },

    getPartners: async (): Promise<ServicePartner[]> => {
      return makeRequest('/api/provider/partners');
    },

    createPartner: async (data: any): Promise<ServicePartner> => {
      return makeRequest('/api/provider/partners', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    togglePartnerStatus: async (partnerId: number, active?: boolean): Promise<ServicePartner> => {
      const url = active !== undefined ? `/api/provider/partners/${partnerId}/toggle-status?active=${active}` : `/api/provider/partners/${partnerId}/toggle-status`;
      return makeRequest(url, {
        method: 'PUT'
      });
    },

    verifyPartner: async (partnerId: number): Promise<ServicePartner> => {
      return makeRequest(`/api/provider/partners/${partnerId}/verify`, {
        method: 'PUT'
      });
    },

    assignPartner: async (bookingId: number, servicePartnerId: number): Promise<Booking> => {
      return makeRequest(`/api/provider/bookings/${bookingId}/assign-partner`, {
        method: 'PUT',
        body: JSON.stringify({ servicePartnerId })
      });
    },

    approveCompletion: async (bookingId: number): Promise<Booking> => {
      return makeRequest(`/api/provider/bookings/${bookingId}/approve-completion`, {
        method: 'PUT'
      });
    }
  },

  // ----------------------------------------
  // SERVICE PARTNER (FIELD WORKER)
  // ----------------------------------------
  partner: {
    getProfile: async (): Promise<ServicePartner> => {
      return makeRequest('/api/partner/profile');
    },

    getTasks: async (): Promise<Booking[]> => {
      return makeRequest('/api/partner/tasks');
    },

    getMyTasks: async (): Promise<Booking[]> => {
      return makeRequest('/api/partner/tasks');
    },

    acceptTask: async (bookingId: number): Promise<Booking> => {
      return makeRequest(`/api/partner/tasks/${bookingId}/accept`, {
        method: 'PUT'
      });
    },

    startJourney: async (bookingId: number): Promise<Booking> => {
      return makeRequest(`/api/partner/tasks/${bookingId}/start-journey`, {
        method: 'PUT'
      });
    },

    updateLocation: async (arg1: number | any, arg2?: number, arg3?: number): Promise<void> => {
      const payload = typeof arg1 === 'object' && arg1 !== null
        ? arg1
        : { latitude: arg1, longitude: arg2, bookingId: arg3 };
      return makeRequest('/api/partner/location', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    markArrived: async (bookingId: number): Promise<Booking> => {
      return makeRequest(`/api/partner/tasks/${bookingId}/arrived`, {
        method: 'PUT'
      });
    },

    startWork: async (bookingId: number): Promise<Booking> => {
      return makeRequest(`/api/partner/tasks/${bookingId}/start-work`, {
        method: 'PUT'
      });
    },

    completeWork: async (bookingId: number): Promise<Booking> => {
      return makeRequest(`/api/partner/tasks/${bookingId}/complete-work`, {
        method: 'PUT'
      });
    },

    recordPayment: async (bookingId: number, method: PaymentMethod = 'AFTER_SERVICE'): Promise<Booking> => {
      return makeRequest(`/api/partner/tasks/${bookingId}/record-payment?paymentMethod=${method}`, {
        method: 'PUT'
      });
    }
  },

  // ----------------------------------------
  // ADMIN CONSOLE
  // ----------------------------------------
  admin: {
    createCategory: async (data: any): Promise<Category> => {
      return makeRequest('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    updateCategory: async (catId: number, data: any): Promise<Category> => {
      return makeRequest(`/api/admin/categories/${catId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    createService: async (data: any): Promise<ServiceItem> => {
      return makeRequest('/api/admin/services', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    updateService: async (srvId: number, data: any): Promise<ServiceItem> => {
      return makeRequest(`/api/admin/services/${srvId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    deleteService: async (srvId: number): Promise<void> => {
      return makeRequest(`/api/admin/services/${srvId}`, {
        method: 'DELETE'
      });
    },

    getUsers: async (): Promise<User[]> => {
      return makeRequest('/api/admin/users');
    },

    verifyUser: async (userId: number): Promise<User> => {
      return makeRequest(`/api/admin/users/${userId}/verify`, {
        method: 'PUT'
      });
    },

    toggleUserStatus: async (userId: number): Promise<User> => {
      return makeRequest(`/api/admin/users/${userId}/toggle-status`, {
        method: 'PUT'
      });
    },

    getProviders: async (): Promise<ProviderProfile[]> => {
      return makeRequest('/api/admin/providers');
    },

    approveProvider: async (providerId: number): Promise<ProviderProfile> => {
      return makeRequest(`/api/admin/providers/${providerId}/approve`, {
        method: 'PUT'
      });
    },

    updateProviderRemarks: async (providerId: number, remarks: string): Promise<ProviderProfile> => {
      return makeRequest(`/api/admin/providers/${providerId}/remarks`, {
        method: 'PUT',
        body: JSON.stringify({ remarks })
      });
    },

    getAllBookings: async (): Promise<Booking[]> => {
      return makeRequest('/api/admin/bookings');
    },

    assignProviderToBooking: async (bookingId: number, providerId: number): Promise<Booking> => {
      return makeRequest(`/api/admin/bookings/${bookingId}/assign/${providerId}`, {
        method: 'PUT'
      });
    },

    getAnalytics: async (days: number = 30): Promise<AdminAnalytics> => {
      return makeRequest(`/api/admin/analytics/overview?days=${days}`);
    },

    getActuatorHealth: async (): Promise<any> => {
      return makeRequest('/actuator/health');
    },

    getDiscussions: async (status?: string): Promise<ProviderDiscussion[]> => {
      const url = status ? `/api/admin/discussions?status=${status}` : '/api/admin/discussions';
      return makeRequest(url);
    },

    getDiscussionById: async (discussionId: number): Promise<ProviderDiscussion> => {
      return makeRequest(`/api/admin/discussions/${discussionId}`);
    },

    replyDiscussion: async (discussionId: number, message: string): Promise<ProviderDiscussion> => {
      return makeRequest(`/api/admin/discussions/${discussionId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
    },

    updateDiscussionStatus: async (discussionId: number, status: string): Promise<ProviderDiscussion> => {
      return makeRequest(`/api/admin/discussions/${discussionId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    }
  },

  // ----------------------------------------
  // PAYMENTS GATEWAY FLOW
  // ----------------------------------------
  payments: {
    createOrder: async (bookingId: number): Promise<any> => {
      return makeRequest('/api/payments/orders', {
        method: 'POST',
        body: JSON.stringify({ bookingId: Number(bookingId) })
      });
    },

    verifyPayment: async (data: { razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string }): Promise<any> => {
      return makeRequest('/api/payments/verify', {
        method: 'POST',
        body: JSON.stringify({
          razorpayPaymentId: data.razorpayPaymentId,
          razorpayOrderId: data.razorpayOrderId,
          razorpaySignature: data.razorpaySignature
        })
      });
    }
  },

  // ----------------------------------------
  // AI DIAGNOSTIC & ASSISTANT
  // ----------------------------------------
  ai: {
    diagnose: async (query: string): Promise<{ diagnosis: string; recommendedServices?: ServiceItem[] }> => {
      return makeRequest('/api/ai/diagnose', {
        method: 'POST',
        body: JSON.stringify({ query })
      });
    },

    chat: async (chatPayload: string | { message: string }): Promise<{ response: string }> => {
      const payload = typeof chatPayload === 'string' ? { message: chatPayload } : chatPayload;
      return makeRequest('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
  },

  // ----------------------------------------
  // ON-DEMAND INTRA-CITY VEHICLE TRANSPORT
  // ----------------------------------------
  vehicle: {
    estimate: async (estimateData: { vehicleType: string; pickupAddress: string; dropAddress: string; distanceKm?: number }): Promise<VehicleEstimate> => {
      return makeRequest('/api/vehicle/estimate', {
        method: 'POST',
        body: JSON.stringify(estimateData)
      });
    },

    getMyVehicle: async (): Promise<Vehicle> => {
      return makeRequest('/api/vehicle/my-vehicle');
    },

    getMyVehicles: async (): Promise<Vehicle[]> => {
      return makeRequest('/api/vehicle/my-vehicles');
    },

    registerVehicle: async (vehicleData: any): Promise<Vehicle> => {
      return makeRequest('/api/vehicle/register', {
        method: 'POST',
        body: JSON.stringify(vehicleData)
      });
    },

    deleteVehicle: async (id: number): Promise<void> => {
      return makeRequest(`/api/vehicle/${id}`, {
        method: 'DELETE'
      });
    },

    toggleVehicleAvailability: async (id: number): Promise<Vehicle> => {
      return makeRequest(`/api/vehicle/${id}/toggle-availability`, {
        method: 'PATCH'
      });
    },

    updateLocation: async (locationData: { latitude: number; longitude: number; vehicleId?: number }): Promise<void> => {
      return makeRequest('/api/vehicle/location', {
        method: 'POST',
        body: JSON.stringify(locationData)
      });
    },

    getPricingRules: async (): Promise<PricingRule[]> => {
      return makeRequest('/api/vehicle/pricing-rules');
    },

    updatePricingRule: async (id: number, ruleData: any): Promise<PricingRule> => {
      return makeRequest(`/api/vehicle/pricing-rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(ruleData)
      });
    }
  },

  // ----------------------------------------
  // LIVE GPS & PROVIDER TRACKING
  // ----------------------------------------
  tracking: {
    getLiveTracking: async (bookingId: number): Promise<LiveLocationTelemetry> => {
      return makeRequest(`/api/bookings/${bookingId}/track`);
    },

    updateProviderLocation: async (coords: { latitude: number; longitude: number; bookingId?: number }): Promise<void> => {
      return makeRequest('/api/provider/location', {
        method: 'POST',
        body: JSON.stringify(coords)
      });
    }
  },

  // ----------------------------------------
  // REVIEWS & RATINGS
  // ----------------------------------------
  reviews: {
    create: async (data: { bookingId?: number; serviceId?: number; providerId?: number; rating: number; review?: string }): Promise<Review> => {
      return makeRequest('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    getByService: async (serviceId: number): Promise<Review[]> => {
      return makeRequest(`/api/reviews/service/${serviceId}`);
    },

    getByProvider: async (providerId: number): Promise<Review[]> => {
      return makeRequest(`/api/reviews/provider/${providerId}`);
    },

    getMyReviews: async (): Promise<Review[]> => {
      return makeRequest('/api/reviews/my');
    },

    getByBookingId: async (bookingId: number): Promise<Review> => {
      return makeRequest(`/api/reviews/booking/${bookingId}`);
    },

    reply: async (reviewId: number, reply: string): Promise<Review> => {
      return makeRequest(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply })
      });
    }
  },

  // ----------------------------------------
  // PERSISTENT NOTIFICATIONS
  // ----------------------------------------
  notifications: {
    getAll: async (): Promise<NotificationItem[]> => {
      return makeRequest('/api/notifications');
    },

    getUnreadCount: async (): Promise<{ unreadCount: number }> => {
      return makeRequest('/api/notifications/unread-count');
    },

    markAsRead: async (id: number): Promise<NotificationItem> => {
      return makeRequest(`/api/notifications/${id}/read`, {
        method: 'PATCH'
      });
    },

    markAllAsRead: async (): Promise<void> => {
      return makeRequest('/api/notifications/read-all', {
        method: 'POST'
      });
    }
  },

  // ----------------------------------------
  // SAVED ADDRESS BOOK
  // ----------------------------------------
  addresses: {
    getAll: async (): Promise<Address[]> => {
      return makeRequest('/api/addresses');
    },

    create: async (data: any): Promise<Address> => {
      return makeRequest('/api/addresses', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    update: async (id: number, data: any): Promise<Address> => {
      return makeRequest(`/api/addresses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    delete: async (id: number): Promise<void> => {
      return makeRequest(`/api/addresses/${id}`, {
        method: 'DELETE'
      });
    },

    setDefault: async (id: number): Promise<Address> => {
      return makeRequest(`/api/addresses/${id}/default`, {
        method: 'PATCH'
      });
    }
  },

  // ----------------------------------------
  // PROVIDER WALLET & PAYOUTS
  // ----------------------------------------
  payouts: {
    getWalletOverview: async (): Promise<WalletOverview> => {
      return makeRequest('/api/provider/wallet');
    },

    requestPayout: async (arg1: any, arg2?: string): Promise<Payout> => {
      const payload = typeof arg1 === 'object' ? { ...arg1 } : { amount: Number(arg1), notes: arg2 };
      if (typeof arg2 === 'string' && arg2.includes('@') && !payload.upiId) {
        payload.upiId = arg2.trim();
      }
      return makeRequest('/api/provider/payouts/request', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    getMyPayouts: async (): Promise<Payout[]> => {
      return makeRequest('/api/provider/payouts');
    },

    getAdminPayouts: async (): Promise<Payout[]> => {
      return makeRequest('/api/admin/payouts');
    },

    processAdminPayout: async (payoutId: number, arg1: any, arg2?: string, arg3?: string): Promise<Payout> => {
      const payload = typeof arg1 === 'object' ? { ...arg1 } : { status: arg1, transactionReference: arg2, adminNotes: arg3 };
      if (payload.status === 'COMPLETED') {
        payload.status = 'PROCESSED';
      } else if (payload.status === 'PROCESSING') {
        payload.status = 'APPROVED';
      }
      return makeRequest(`/api/admin/payouts/${payoutId}/process`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
    }
  },

  // ----------------------------------------
  // DISPUTES & ESCALATIONS
  // ----------------------------------------
  disputes: {
    create: async (arg1: any, arg2?: string, arg3?: string): Promise<Dispute> => {
      const payload = typeof arg1 === 'object' ? arg1 : { bookingId: Number(arg1), reason: arg2, description: arg3 };
      return makeRequest('/api/disputes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    getMyDisputes: async (): Promise<Dispute[]> => {
      return makeRequest('/api/disputes/my');
    },

    getProviderDisputes: async (): Promise<Dispute[]> => {
      return makeRequest('/api/disputes/provider');
    },

    getAllForAdmin: async (): Promise<Dispute[]> => {
      return makeRequest('/api/admin/disputes');
    },

    getById: async (id: number): Promise<Dispute> => {
      return makeRequest(`/api/admin/disputes/${id}`);
    },

    resolve: async (disputeId: number, arg1: any, arg2?: string, arg3?: number): Promise<Dispute> => {
      const payload = typeof arg1 === 'object' ? arg1 : { status: arg1, resolution: arg2, refundAmount: arg3 };
      return makeRequest(`/api/admin/disputes/${disputeId}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
    },

    reply: async (disputeId: number, message: string): Promise<Dispute> => {
      return makeRequest(`/api/disputes/${disputeId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
    }
  },

  // ----------------------------------------
  // KYC VERIFICATION & DOCUMENT MANAGEMENT
  // ----------------------------------------
  kyc: {
    upload: async (documentType: string, file: any, documentNumber: string = ''): Promise<KycDocument> => {
      const formData = new FormData();
      formData.append('documentType', documentType);
      if (documentNumber) formData.append('documentNumber', documentNumber);
      formData.append('file', file);
      return makeMultipartRequest('/api/provider/kyc/upload', formData);
    },

    getMyDocuments: async (): Promise<KycDocument[]> => {
      return makeRequest('/api/provider/kyc/my-documents');
    },

    getAdminDocuments: async (status: string = '', page: number = 0, size: number = 20): Promise<any> => {
      const query = new URLSearchParams({ page: String(page), size: String(size) });
      if (status) query.append('status', status);
      return makeRequest(`/api/admin/kyc/documents?${query.toString()}`);
    },

    verifyDocument: async (documentId: number, status: string, rejectionReason: string = ''): Promise<KycDocument> => {
      return makeRequest(`/api/admin/kyc/documents/${documentId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason })
      });
    }
  },

  // ----------------------------------------
  // FAVORITE SERVICES & BOOKMARKS
  // ----------------------------------------
  favorites: {
    getAll: async (): Promise<Favorite[]> => {
      return makeRequest('/api/favorites');
    },

    check: async (serviceId: number): Promise<{ favorited: boolean }> => {
      return makeRequest(`/api/favorites/check/${serviceId}`);
    },

    add: async (serviceId: number): Promise<Favorite> => {
      return makeRequest(`/api/favorites/${serviceId}`, {
        method: 'POST'
      });
    },

    remove: async (serviceId: number): Promise<void> => {
      return makeRequest(`/api/favorites/${serviceId}`, {
        method: 'DELETE'
      });
    }
  }
};
