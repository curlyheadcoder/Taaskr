// Taaskr API Service Layer (Connected to Spring Boot Backend)

// In development, use Vite's `/api` proxy so browser requests stay on the
// frontend origin. Deployments can set VITE_API_BASE_URL to their API URL.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

// ==========================================
// HTTP CLIENT UTILITIES
// ==========================================
const getHeaders = () => {
  const token = localStorage.getItem('taaskr_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token && token !== 'undefined' && token !== 'null') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  if (res.status === 401) {
    localStorage.removeItem('taaskr_token');
    localStorage.removeItem('taaskr_current_user');
  }
  if (!res.ok) {
    let errorMsg = 'Something went wrong';
    try {
      const err = await res.json();
      errorMsg = err.message || err.error || errorMsg;
    } catch (e) { }
    throw new Error(errorMsg);
  }
  if (res.status === 204) return null;
  return res.json();
};

const makeRequest = async (path, options = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers
    }
  });
  return handleResponse(response);
};

// ==========================================
// API EXPORT MODULES
// ==========================================
export const api = {
  // ----------------------------------------
  // AUTHENTICATION
  // ----------------------------------------
  auth: {
    login: async (email, password) => {
      const res = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (res && res.token) {
        localStorage.setItem('taaskr_token', res.token);
        localStorage.setItem('taaskr_current_user', JSON.stringify(res));
      }
      return res;
    },

    register: async (data) => {
      const res = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res && res.token) {
        localStorage.setItem('taaskr_token', res.token);
        localStorage.setItem('taaskr_current_user', JSON.stringify(res));
      }
      return res;
    },

    me: async () => {
      return makeRequest('/api/auth/me');
    },

    sendVerificationOtp: async (email) => {
      return makeRequest('/api/auth/send-verification-otp', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    },

    verifyEmail: async (email, otp) => {
      return makeRequest('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email, otp })
      });
    },

    sendPhoneOtp: async (phone) => {
      return makeRequest('/api/auth/send-phone-otp', {
        method: 'POST',
        body: JSON.stringify({ phone })
      });
    },

    verifyPhone: async (phone, otp) => {
      return makeRequest('/api/auth/verify-phone', {
        method: 'POST',
        body: JSON.stringify({ phone, otp })
      });
    },

    forgotPassword: async (email) => {
      return makeRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    },

    resetPassword: async (email, otp, newPassword) => {
      return makeRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword })
      });
    },

    resendOtp: async (email, type) => {
      return makeRequest('/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email, type })
      });
    },

    logout: () => {
      localStorage.removeItem('taaskr_token');
      localStorage.removeItem('taaskr_current_user');
    }
  },

  // ----------------------------------------
  // CATALOG (PUBLIC & PRIVATE)
  // ----------------------------------------
  catalog: {
    getCategories: async () => {
      return makeRequest('/api/categories');
    },

    getServices: async (categoryId) => {
      const query = categoryId ? `?categoryId=${categoryId}` : '';
      return makeRequest(`/api/services${query}`);
    },

    getServiceById: async (serviceId) => {
      return makeRequest(`/api/services/${serviceId}`);
    }
  },

  // ----------------------------------------
  // CUSTOMER BOOKINGS FLOW
  // ----------------------------------------
  bookings: {
    create: async (bookingData) => {
      return makeRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });
    },

    getAvailableProviders: async (serviceId, city, pincode, date, startTime) => {
      const params = new URLSearchParams({
        serviceId,
        date,
        startTime
      });
      if (city) params.append('city', city);
      if (pincode) params.append('pincode', pincode);
      return makeRequest(`/api/bookings/available-providers?${params.toString()}`);
    },

    getMyBookings: async () => {
      return makeRequest('/api/bookings/my');
    },

    getById: async (bookingId) => {
      return makeRequest(`/api/bookings/${bookingId}`);
    },

    rate: async (bookingId, ratingData) => {
      return makeRequest(`/api/bookings/${bookingId}/rate`, {
        method: 'POST',
        body: JSON.stringify(ratingData)
      });
    }
  },

  // ----------------------------------------
  // PROVIDER WORKFLOW
  // ----------------------------------------
  provider: {
    getProfile: async () => {
      return makeRequest('/api/provider/profile');
    },

    updateProfile: async (data) => {
      return makeRequest('/api/provider/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    getAvailability: async () => {
      return makeRequest('/api/provider/availability');
    },

    createAvailability: async (data) => {
      // Ensure availableDate is in YYYY-MM-DD format without timezone shifting
      let availableDate = data.availableDate;
      if (availableDate instanceof Date) {
        availableDate = availableDate.toISOString().split('T')[0];
      } else if (typeof availableDate === 'string') {
        // Just extract date part if it is full ISO or datetime
        availableDate = availableDate.split('T')[0].split(' ')[0];
      }

      // Ensure startTime and endTime are in HH:mm:ss format
      const formatTime = (timeStr) => {
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

    deleteAvailability: async (slotId) => {
      return makeRequest(`/api/provider/availability/${slotId}`, {
        method: 'DELETE'
      });
    },

    getBookings: async () => {
      return makeRequest('/api/provider/bookings');
    },

    getAvailableTasks: async () => {
      return makeRequest('/api/provider/available-tasks');
    },

    claimTask: async (bookingId) => {
      return makeRequest(`/api/provider/bookings/${bookingId}/claim`, {
        method: 'PUT'
      });
    },

    acceptBooking: async (bookingId) => {
      return makeRequest(`/api/provider/bookings/${bookingId}/accept`, {
        method: 'PUT'
      });
    },

    rejectBooking: async (bookingId) => {
      return makeRequest(`/api/provider/bookings/${bookingId}/reject`, {
        method: 'PUT'
      });
    },

    updateBookingStatus: async (bookingId, status) => {
      return makeRequest(`/api/provider/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    },

    updateStatus: async (bookingId, status) => {
      return makeRequest(`/api/provider/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    },

    markAfterServicePaymentReceived: async (bookingId) => {
      return makeRequest(`/api/provider/bookings/${bookingId}/payment-received`, {
        method: 'PUT'
      });
    },

    getCategories: async () => {
      return makeRequest('/api/provider/categories');
    },

    updateCategories: async (categoryIds) => {
      return makeRequest('/api/provider/categories', {
        method: 'PUT',
        body: JSON.stringify({ categoryIds })
      });
    }
  },

  // ----------------------------------------
  // ADMIN CONSOLE
  // ----------------------------------------
  admin: {
    createCategory: async (data) => {
      return makeRequest('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    updateCategory: async (catId, data) => {
      return makeRequest(`/api/admin/categories/${catId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    createService: async (data) => {
      return makeRequest('/api/admin/services', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    updateService: async (srvId, data) => {
      return makeRequest(`/api/admin/services/${srvId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    deleteService: async (srvId) => {
      return makeRequest(`/api/admin/services/${srvId}`, {
        method: 'DELETE'
      });
    },

    getUsers: async () => {
      return makeRequest('/api/admin/users');
    },

    getProviders: async () => {
      return makeRequest('/api/admin/providers');
    },

    approveProvider: async (providerId) => {
      return makeRequest(`/api/admin/providers/${providerId}/approve`, {
        method: 'PUT'
      });
    },

    getAllBookings: async () => {
      return makeRequest('/api/admin/bookings');
    },

    getAnalytics: async (days = 30) => {
      return makeRequest(`/api/admin/analytics/overview?days=${days}`);
    },

    getActuatorHealth: async () => {
      return makeRequest('/actuator/health');
    }
  },

  // ----------------------------------------
  // PAYMENTS GATEWAY FLOW
  // ----------------------------------------
  payments: {
    createOrder: async (bookingId) => {
      return makeRequest('/api/payments/orders', {
        method: 'POST',
        body: JSON.stringify({ bookingId: Number(bookingId) })
      });
    },

    verifyPayment: async (data) => {
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
  // AI DIAGNOSTIC ASSISTANT
  // ----------------------------------------
  ai: {
    diagnose: async (query) => {
      return makeRequest('/api/ai/diagnose', {
        method: 'POST',
        body: JSON.stringify({ query })
      });
    }
  },

  // ----------------------------------------
  // ON-DEMAND INTRA-CITY VEHICLE TRANSPORT
  // ----------------------------------------
  vehicle: {
    estimate: async (estimateData) => {
      return makeRequest('/api/vehicle/estimate', {
        method: 'POST',
        body: JSON.stringify(estimateData)
      });
    },

    getMyVehicle: async () => {
      return makeRequest('/api/vehicle/my-vehicle');
    },

    getMyVehicles: async () => {
      return makeRequest('/api/vehicle/my-vehicles');
    },

    registerVehicle: async (vehicleData) => {
      return makeRequest('/api/vehicle/register', {
        method: 'POST',
        body: JSON.stringify(vehicleData)
      });
    },

    deleteVehicle: async (id) => {
      return makeRequest(`/api/vehicle/${id}`, {
        method: 'DELETE'
      });
    },

    toggleVehicleAvailability: async (id) => {
      return makeRequest(`/api/vehicle/${id}/toggle-availability`, {
        method: 'PATCH'
      });
    },

    updateLocation: async (locationData) => {
      return makeRequest('/api/vehicle/location', {
        method: 'POST',
        body: JSON.stringify(locationData)
      });
    },

    getPricingRules: async () => {
      return makeRequest('/api/vehicle/pricing-rules');
    },

    updatePricingRule: async (id, ruleData) => {
      return makeRequest(`/api/vehicle/pricing-rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(ruleData)
      });
    }
  }
};
