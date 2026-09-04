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

export const useAuthStore = create<AuthState>((set, get) => {
  // Safe helper to access localStorage on the client side
  const getStoredItem = (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  };

  const setStoredItem = (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  };

  const removeStoredItem = (key: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  };

  // Initial user mapping from stored user json if token exists
  const getInitialUser = (): User | null => {
    const token = getStoredItem('token');
    const userJson = getStoredItem('user');
    if (token && userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  };

  const initialUser = getInitialUser();
  const initialToken = getStoredItem('token');

  return {
    user: initialUser,
    token: initialToken,
    isAuthenticated: initialToken !== null && initialUser !== null,
    isLoading: false,
    error: null,

    login: async (payload: LoginPayload) => {
      set({ isLoading: true, error: null });

      const { email, password } = payload;
      if (!email || !password) {
        const msg = 'Email dan password wajib diisi';
        set({ isLoading: false, error: msg });
        throw new Error(msg);
      }

      try {
        const res = await authService.login(payload);
        const token = res.data.token;
        const user = res.data.user;

        setStoredItem('token', token);
        setStoredItem('user', JSON.stringify(user));

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (err: any) {
        const errMsg = err.response?.data?.message || err.message || 'Email atau password salah';
        set({
          isLoading: false,
          error: errMsg,
        });
        throw new Error(errMsg);
      }
    },

    fetchMe: async () => {
      const token = getStoredItem('token');
      
      if (!token) {
        removeStoredItem('token');
        removeStoredItem('user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
        return;
      }

      try {
        const res = await authService.getMe();
        const user = res.data;
        setStoredItem('user', JSON.stringify(user));
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        removeStoredItem('token');
        removeStoredItem('user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      }
    },

    logout: () => {
      removeStoredItem('token');
      removeStoredItem('user');
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false, 
        error: null 
      });
    }
  };
});
