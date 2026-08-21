import { create } from 'zustand';
import { User, LoginPayload } from '../types/auth.types';
import { authService } from '../services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (payload: LoginPayload) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(payload);
      const token = response.data.token;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }
      
      set({ 
        token, 
        isAuthenticated: true, 
        isLoading: false,
        user: response.data.user
      });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Login failed' 
      });
      throw error;
    }
  },

  fetchMe: async () => {
    const { token } = get();
    if (!token) return;

    set({ isLoading: true, error: null });
    try {
      const response = await authService.getMe();
      set({ 
        user: response.data, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error: any) {
      // If fetching me fails (e.g., token expired), we should logout
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: 'Session expired'
      });
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false, 
      error: null 
    });
  }
}));
