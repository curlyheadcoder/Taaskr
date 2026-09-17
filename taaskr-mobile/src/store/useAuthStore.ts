import { create } from 'zustand';
import { User, Role } from '../types';
import { api, tokenStorage } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, pass: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.auth.login(email, pass);
      set({
        user: {
          id: res.id,
          name: res.name,
          email: res.email,
          phone: res.phone,
          role: res.role,
          city: res.city,
          pincode: res.pincode,
          emailVerified: res.emailVerified,
          phoneVerified: res.phoneVerified,
          approved: res.approved
        },
        token: res.token,
        role: res.role,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
      throw err;
    }
  },

  register: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.auth.register(data);
      set({
        user: {
          id: res.id,
          name: res.name,
          email: res.email,
          phone: res.phone,
          role: res.role,
          city: res.city,
          pincode: res.pincode,
          emailVerified: res.emailVerified,
          phoneVerified: res.phoneVerified,
          approved: res.approved
        },
        token: res.token,
        role: res.role,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await api.auth.logout();
    set({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const storedToken = await tokenStorage.getToken();
      if (storedToken) {
        const currentUser = await api.auth.me();
        set({
          user: currentUser,
          token: storedToken,
          role: currentUser.role,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        set({ isLoading: false, isAuthenticated: false });
      }
    } catch (e: any) {
      if (e?.message?.includes('401') || e?.message?.includes('Unauthorized') || e?.message?.includes('HTTP 401')) {
        await tokenStorage.removeToken();
        set({ user: null, token: null, role: null, isAuthenticated: false, isLoading: false });
      } else {
        console.warn('Session verification warning (server warming up or network delayed):', e?.message);
        set({ isLoading: false });
      }
    }
  }
}));
