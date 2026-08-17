// Taaskr API & Mock Service Layer
// Toggle this variable to connect to the actual backend once ready
export const USE_MOCK = true;

const BASE_URL = ''; // Proxied via Vite config to http://localhost:8081

// Helper to delay mock responses for realistic UX micro-animations
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// MOCK DATA STORAGE INITIALIZER (localStorage)
// ==========================================
const initMockDB = () => {
  if (!localStorage.getItem('taaskr_initialized')) {
    // 1. Seed Users
    const users = [
      { id: 1, name: 'Admin User', email: 'admin@taaskr.com', password: 'Admin@123', role: 'ADMIN', phone: '9999999991', city: 'Indore', pincode: '452001', enabled: true },
      { id: 2, name: 'Regular User', email: 'user@taaskr.com', password: 'User@123', role: 'USER', phone: '9999999992', city: 'Indore', pincode: '452001', enabled: true },
      { id: 3, name: 'Provider User', email: 'provider@taaskr.com', password: 'Provider@123', role: 'PROVIDER', phone: '9999999993', city: 'Indore', pincode: '452001', enabled: true }
    ];
    localStorage.setItem('taaskr_users', JSON.stringify(users));

    // 2. Seed Categories
    const categories = [
      { id: 1, name: 'Plumbing', description: 'Home plumbing repair and installation services', active: true },
      { id: 2, name: 'Cleaning', description: 'Home and deep cleaning services', active: true },
      { id: 3, name: 'Electrical', description: 'Electrical repair and fitting services', active: true }
    ];
    localStorage.setItem('taaskr_categories', JSON.stringify(categories));

    // 3. Seed Services
    const services = [
      { id: 1, categoryId: 1, name: 'Tap Repair', description: 'Fix leaking or damaged taps', price: 299.00, durationMinutes: 60, active: true },
      { id: 2, categoryId: 1, name: 'Pipe Leakage Fix', description: 'Detect and repair minor pipe leakage', price: 499.00, durationMinutes: 90, active: true },
      { id: 3, categoryId: 2, name: 'Bathroom Cleaning', description: 'Deep clean bathroom and fittings', price: 399.00, durationMinutes: 90, active: true },
      { id: 4, categoryId: 2, name: 'Full Home Cleaning', description: 'General home cleaning service', price: 1499.00, durationMinutes: 240, active: true },
      { id: 5, categoryId: 3, name: 'Switch Board Repair', description: 'Repair or replace faulty switch boards', price: 349.00, durationMinutes: 60, active: true }
    ];
    localStorage.setItem('taaskr_services', JSON.stringify(services));

    // 4. Seed Provider Profiles
    const providerProfiles = [
      {
        id: 1,
        userId: 3,
        name: 'Provider User',
        email: 'provider@taaskr.com',
        phone: '9999999993',
        experienceYears: 3,
        city: 'Indore',
        pincode: '452001',
        approved: true,
        rating: 4.7,
        totalJobs: 12,
        bio: 'Experienced home service professional in plumbing and cleaning.'
      }
    ];
    localStorage.setItem('taaskr_providers', JSON.stringify(providerProfiles));

    // 5. Seed Provider Availability Slots
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const availability = [
      { id: 1, providerId: 1, availableDate: dateStr, startTime: '09:00', endTime: '11:00', booked: false },
      { id: 2, providerId: 1, availableDate: dateStr, startTime: '11:30', endTime: '13:30', booked: false },
      { id: 3, providerId: 1, availableDate: dateStr, startTime: '15:00', endTime: '18:00', booked: false }
    ];
    localStorage.setItem('taaskr_availability', JSON.stringify(availability));

    // 6. Bookings (Initially Empty)
    localStorage.setItem('taaskr_bookings', JSON.stringify([]));

    localStorage.setItem('taaskr_initialized', 'true');
  }
};

initMockDB();

// ==========================================
// HTTP CLIENT UTILITIES
// ==========================================
const getHeaders = () => {
  const token = localStorage.getItem('taaskr_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  if (!res.ok) {
    let errorMsg = 'Something went wrong';
    try {
      const err = await res.json();
      errorMsg = err.message || err.error || errorMsg;
    } catch (e) {}
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
      if (USE_MOCK) {
        await delay();
        const users = JSON.parse(localStorage.getItem('taaskr_users') || '[]');
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user || user.password !== password) {
          throw new Error('Invalid email or password');
        }
        if (!user.enabled) {
          throw new Error('User account is disabled');
        }

        const token = `mock-jwt-token-for-${user.id}-${user.role}`;
        localStorage.setItem('taaskr_token', token);
        localStorage.setItem('taaskr_current_user', JSON.stringify(user));
        return {
          token,
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        };
      } else {
        return makeRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
      }
    },

    register: async (data) => {
      if (USE_MOCK) {
        await delay();
        const users = JSON.parse(localStorage.getItem('taaskr_users') || '[]');
        if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
          throw new Error('Email is already registered');
        }

        const newUser = {
          id: Date.now(),
          name: data.name,
          email: data.email,
          password: data.password, // In mock we store plaintext
          role: data.role || 'USER',
          phone: data.phone || '',
          city: data.city || '',
          pincode: data.pincode || '',
          enabled: true
        };

        users.push(newUser);
        localStorage.setItem('taaskr_users', JSON.stringify(users));

        // Create provider profile if role is PROVIDER
        if (newUser.role === 'PROVIDER') {
          const providers = JSON.parse(localStorage.getItem('taaskr_providers') || '[]');
          const newProvider = {
            id: Date.now() + 1,
            userId: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            experienceYears: 0,
            city: newUser.city,
            pincode: newUser.pincode,
            approved: false, // Needs admin approval
            rating: 5.0,
            totalJobs: 0,
            bio: 'New service provider'
          };
          providers.push(newProvider);
          localStorage.setItem('taaskr_providers', JSON.stringify(providers));
        }

        const token = `mock-jwt-token-for-${newUser.id}-${newUser.role}`;
        localStorage.setItem('taaskr_token', token);
        localStorage.setItem('taaskr_current_user', JSON.stringify(newUser));

        return {
          token,
          userId: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        };
      } else {
        return makeRequest('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }
    },

    me: async () => {
      if (USE_MOCK) {
        await delay(100);
        const user = JSON.parse(localStorage.getItem('taaskr_current_user') || 'null');
        if (!user) throw new Error('Unauthenticated');
        return {
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          city: user.city,
          pincode: user.pincode,
          enabled: user.enabled
        };
      } else {
        return makeRequest('/api/auth/me');
      }
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
      if (USE_MOCK) {
        await delay(150);
        const categories = JSON.parse(localStorage.getItem('taaskr_categories') || '[]');
        return categories.filter(c => c.active);
      } else {
        return makeRequest('/api/categories');
      }
    },

    getServices: async (categoryId) => {
      if (USE_MOCK) {
        await delay(150);
        const services = JSON.parse(localStorage.getItem('taaskr_services') || '[]');
        const activeServices = services.filter(s => s.active);
        if (categoryId) {
          return activeServices.filter(s => s.categoryId === Number(categoryId));
        }
        return activeServices;
      } else {
        const query = categoryId ? `?catpegoryId=${categoryId}` : ''; // Using backend's actual typo 'catpegoryId'
        return makeRequest(`/api/services${query}`);
      }
    },

    getServiceById: async (serviceId) => {
      if (USE_MOCK) {
        await delay(100);
        const services = JSON.parse(localStorage.getItem('taaskr_services') || '[]');
        const service = services.find(s => s.id === Number(serviceId));
        if (!service) throw new Error('Service not found');
        return service;
      } else {
        return makeRequest(`/api/services/${serviceId}`);
      }
    }
  },

  // ----------------------------------------
  // CUSTOMER BOOKINGS FLOW
  // ----------------------------------------
  bookings: {
    create: async (bookingData) => {
      if (USE_MOCK) {
        await delay();
        const currentUser = JSON.parse(localStorage.getItem('taaskr_current_user') || 'null');
        if (!currentUser) throw new Error('Please login to create a booking');

        const services = JSON.parse(localStorage.getItem('taaskr_services') || '[]');
        const service = services.find(s => s.id === Number(bookingData.serviceId));
        if (!service) throw new Error('Selected service not found');

        const bookings = JSON.parse(localStorage.getItem('taaskr_bookings') || '[]');
        const providers = JSON.parse(localStorage.getItem('taaskr_providers') || '[]');
        
        // Find an approved provider that is active in that area, or default to provider #1
        const provider = providers.find(p => p.approved && p.city.toLowerCase() === bookingData.city.toLowerCase()) || providers[0];

        const newBooking = {
          id: Date.now(),
          customerId: currentUser.id,
          customerName: currentUser.name,
          customerEmail: currentUser.email,
          customerPhone: currentUser.phone,
          serviceId: service.id,
          serviceName: service.name,
          categoryName: service.categoryId === 1 ? 'Plumbing' : service.categoryId === 2 ? 'Cleaning' : 'Electrical',
          price: service.price,
          bookingDate: bookingData.bookingDate,
          startTime: bookingData.startTime,
          address: bookingData.address,
          city: bookingData.city,
          pincode: bookingData.pincode,
          notes: bookingData.notes || '',
          bookingStatus: 'PENDING',
          paymentStatus: 'PENDING',
          createdAt: new Date().toISOString(),
          providerId: provider ? provider.id : null,
          providerName: provider ? provider.name : null,
          providerPhone: provider ? provider.phone : null
        };

        // If provider assigned, set status to ASSIGNED
        if (newBooking.providerId) {
          newBooking.bookingStatus = 'ASSIGNED';
        }

        bookings.push(newBooking);
        localStorage.setItem('taaskr_bookings', JSON.stringify(bookings));
        return newBooking;
      } else {
        return makeRequest('/api/bookings', {
          method: 'POST',
          body: JSON.stringify(bookingData)
        });
      }
    },

    getMyBookings: async () => {
      if (USE_MOCK) {
        await delay(200);
        const currentUser = JSON.parse(localStorage.getItem('taaskr_current_user') || 'null');
        if (!currentUser) throw new Error('Unauthenticated');
        const bookings = JSON.parse(localStorage.getItem('taaskr_bookings') || '[]');
        return bookings.filter(b => b.customerId === currentUser.id);
      } else {
        return makeRequest('/api/bookings/my');
      }
    },

    getById: async (bookingId) => {
      if (USE_MOCK) {
        await delay(100);
        const bookings = JSON.parse(localStorage.getItem('taaskr_bookings') || '[]');
        const booking = bookings.find(b => b.id === Number(bookingId));
        if (!booking) throw new Error('Booking not found');
        return booking;
      } else {
        return makeRequest(`/api/bookings/${bookingId}`);
      }
    }
  },

  // ----------------------------------------
  // PROVIDER WORKFLOW
  // ----------------------------------------
  provider: {
    getAvailability: async () => {
      if (USE_MOCK) {
        await delay(150);
        const currentUser = JSON.parse(localStorage.getItem('taaskr_current_user') || 'null');
        const providers = JSON.parse(localStorage.getItem('taaskr_providers') || '[]');
        const providerProfile = providers.find(p => p.userId === currentUser.id);
        if (!providerProfile) return [];

        const availability = JSON.parse(localStorage.getItem('taaskr_availability') || '[]');
        return availability.filter(a => a.providerId === providerProfile.id);
      } else {
        return makeRequest('/api/provider/availability');
      }
    },

    createAvailability: async (data) => {
      if (USE_MOCK) {
        await delay();
        const currentUser = JSON.parse(localStorage.getItem('taaskr_current_user') || 'null');
        const providers = JSON.parse(localStorage.getItem('taaskr_providers') || '[]');
        const providerProfile = providers.find(p => p.userId === currentUser.id);
        if (!providerProfile) throw new Error('Provider profile not found');

        const availability = JSON.parse(localStorage.getItem('taaskr_availability') || '[]');
        const newSlot = {
          id: Date.now(),
          providerId: providerProfile.id,
          availableDate: data.availableDate,
          startTime: data.startTime,
          endTime: data.endTime,
          booked: false
        };

        availability.push(newSlot);
        localStorage.setItem('taaskr_availability', JSON.stringify(availability));
        return newSlot;
      } else {
        return makeRequest('/api/provider/availability', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }
    },

    deleteAvailability: async (slotId) => {
      if (USE_MOCK) {
        await delay(150);
        let availability = JSON.parse(localStorage.getItem('taaskr_availability') || '[]');
        availability = availability.filter(a => a.id !== Number(slotId));
        localStorage.setItem('taaskr_availability', JSON.stringify(availability));
        return { success: true };
      } else {
        return makeRequest(`/api/provider/availability/${slotId}`, {
          method: 'DELETE'
        });
      }
    },

    getBookings: async () => {
      if (USE_MOCK) {
        await delay(200);
        const currentUser = JSON.parse(localStorage.getItem('taaskr_current_user') || 'null');
        const providers = JSON.parse(localStorage.getItem('taaskr_providers') || '[]');
        const providerProfile = providers.find(p => p.userId === currentUser.id);
        if (!providerProfile) return [];

        const bookings = JSON.parse(localStorage.getItem('taaskr_bookings') || '[]');
        // Provider gets bookings assigned to them
        return bookings.filter(b => b.providerId === providerProfile.id);
      } else {
        return makeRequest('/api/provider/bookings');
      }
    },

    acceptBooking: async (bookingId) => {
      if (USE_MOCK) {
        await delay();
        const bookings = JSON.parse(localStorage.getItem('taaskr_bookings') || '[]');
        const index = bookings.findIndex(b => b.id === Number(bookingId));
        if (index === -1) throw new Error('Booking not found');
        
        bookings[index].bookingStatus = 'ACCEPTED';
        // Simulate immediate payment processing when provider accepts for interactive experience
        bookings[index].paymentStatus = 'PAID';
        localStorage.setItem('taaskr_bookings', JSON.stringify(bookings));
        return bookings[index];
      } else {
        return makeRequest(`/api/provider/bookings/${bookingId}/accept`, {
          method: 'PUT'
        });
      }
    },

    rejectBooking: async (bookingId) => {
      if (USE_MOCK) {
        await delay();
        const bookings = JSON.parse(localStorage.getItem('taaskr_bookings') || '[]');
        const index = bookings.findIndex(b => b.id === Number(bookingId));
        if (index === -1) throw new Error('Booking not found');
        
        bookings[index].bookingStatus = 'REJECTED';
        localStorage.setItem('taaskr_bookings', JSON.stringify(bookings));
        return bookings[index];
      } else {
        return makeRequest(`/api/provider/bookings/${bookingId}/reject`, {
          method: 'PUT'
        });
      }
    },

    updateBookingStatus: async (bookingId, status) => {
      if (USE_MOCK) {
        await delay();
        const bookings = JSON.parse(localStorage.getItem('taaskr_bookings') || '[]');
        const index = bookings.findIndex(b => b.id === Number(bookingId));
        if (index === -1) throw new Error('Booking not found');
        
        bookings[index].bookingStatus = status; // PENDING, ASSIGNED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED, REJECTED
        localStorage.setItem('taaskr_bookings', JSON.stringify(bookings));
        return bookings[index];
      } else {
        return makeRequest(`/api/provider/bookings/${bookingId}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status })
        });
      }
    }
  },

  // ----------------------------------------
  // ADMIN CONSOLE
  // ----------------------------------------
  admin: {
    // Categories CRUD
    createCategory: async (data) => {
      if (USE_MOCK) {
        await delay();
        const categories = JSON.parse(localStorage.getItem('taaskr_categories') || '[]');
        const newCat = {
          id: Date.now(),
          name: data.name,
          description: data.description || '',
          active: true
        };
        categories.push(newCat);
        localStorage.setItem('taaskr_categories', JSON.stringify(categories));
        return newCat;
      } else {
        return makeRequest('/api/admin/categories', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }
    },

    updateCategory: async (catId, data) => {
      if (USE_MOCK) {
        await delay();
        const categories = JSON.parse(localStorage.getItem('taaskr_categories') || '[]');
        const idx = categories.findIndex(c => c.id === Number(catId));
        if (idx === -1) throw new Error('Category not found');
        categories[idx] = { ...categories[idx], name: data.name, description: data.description };
        localStorage.setItem('taaskr_categories', JSON.stringify(categories));
        return categories[idx];
      } else {
        return makeRequest(`/api/admin/categories/${catId}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      }
    },

    // Services CRUD
    createService: async (data) => {
      if (USE_MOCK) {
        await delay();
        const services = JSON.parse(localStorage.getItem('taaskr_services') || '[]');
        const newService = {
          id: Date.now(),
          categoryId: Number(data.categoryId),
          name: data.name,
          description: data.description || '',
          price: Number(data.price),
          durationMinutes: Number(data.durationMinutes),
          active: true
        };
        services.push(newService);
        localStorage.setItem('taaskr_services', JSON.stringify(services));
        return newService;
      } else {
        return makeRequest('/api/admin/services', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }
    },

    updateService: async (srvId, data) => {
      if (USE_MOCK) {
        await delay();
        const services = JSON.parse(localStorage.getItem('taaskr_services') || '[]');
        const idx = services.findIndex(s => s.id === Number(srvId));
        if (idx === -1) throw new Error('Service not found');
        services[idx] = {
          ...services[idx],
          name: data.name,
          description: data.description,
          price: Number(data.price),
          durationMinutes: Number(data.durationMinutes),
          categoryId: Number(data.categoryId)
        };
        localStorage.setItem('taaskr_services', JSON.stringify(services));
        return services[idx];
      } else {
        return makeRequest(`/api/admin/services/${srvId}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      }
    },

    deleteService: async (srvId) => {
      if (USE_MOCK) {
        await delay();
        let services = JSON.parse(localStorage.getItem('taaskr_services') || '[]');
        const idx = services.findIndex(s => s.id === Number(srvId));
        if (idx === -1) throw new Error('Service not found');
        
        // Soft delete / toggle active status
        services[idx].active = false;
        localStorage.setItem('taaskr_services', JSON.stringify(services));
        return { success: true };
      } else {
        return makeRequest(`/api/admin/services/${srvId}`, {
          method: 'DELETE'
        });
      }
    },

    // User / Provider Management
    getUsers: async () => {
      if (USE_MOCK) {
        await delay(150);
        const users = JSON.parse(localStorage.getItem('taaskr_users') || '[]');
        return users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          phone: u.phone,
          city: u.city,
          pincode: u.pincode,
          enabled: u.enabled
        }));
      } else {
        return makeRequest('/api/admin/users');
      }
    },

    getProviders: async () => {
      if (USE_MOCK) {
        await delay(150);
        return JSON.parse(localStorage.getItem('taaskr_providers') || '[]');
      } else {
        return makeRequest('/api/admin/providers');
      }
    },

    approveProvider: async (providerId) => {
      if (USE_MOCK) {
        await delay();
        const providers = JSON.parse(localStorage.getItem('taaskr_providers') || '[]');
        const idx = providers.findIndex(p => p.id === Number(providerId));
        if (idx === -1) throw new Error('Provider not found');
        providers[idx].approved = true;
        localStorage.setItem('taaskr_providers', JSON.stringify(providers));
        return providers[idx];
      } else {
        return makeRequest(`/api/admin/providers/${providerId}/approve`, {
          method: 'PUT'
        });
      }
    },

    // Global Bookings Monitor
    getAllBookings: async () => {
      if (USE_MOCK) {
        await delay(200);
        return JSON.parse(localStorage.getItem('taaskr_bookings') || '[]');
      } else {
        return makeRequest('/api/admin/bookings');
      }
    }
  },

  // ----------------------------------------
  // PAYMENTS GATEWAY FLOW
  // ----------------------------------------
  payments: {
    createOrder: async (bookingId) => {
      if (USE_MOCK) {
        await delay();
        return {
          paymentId: Date.now(),
          bookingId: Number(bookingId),
          razorpayOrderId: `order_mock_${Date.now()}`,
          amount: 299.00,
          currency: 'INR',
          razorpayKeyId: 'rzp_test_mockkeyid123'
        };
      } else {
        return makeRequest('/api/payments/orders', {
          method: 'POST',
          body: JSON.stringify({ bookingId: Number(bookingId) })
        });
      }
    },

    verifyPayment: async (data) => {
      if (USE_MOCK) {
        await delay();
        const bookings = JSON.parse(localStorage.getItem('taaskr_bookings') || '[]');
        const idx = bookings.findIndex(b => b.id === Number(data.bookingId));
        if (idx !== -1) {
          bookings[idx].paymentStatus = 'PAID';
          localStorage.setItem('taaskr_bookings', JSON.stringify(bookings));
        }
        return { success: true };
      } else {
        return makeRequest('/api/payments/verify', {
          method: 'POST',
          body: JSON.stringify({
            razorpayPaymentId: data.razorpayPaymentId,
            razorpayOrderId: data.razorpayOrderId,
            razorpaySignature: data.razorpaySignature
          })
        });
      }
    }
  }
};
