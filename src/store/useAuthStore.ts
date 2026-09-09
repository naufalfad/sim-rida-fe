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
  login: (payload: LoginPayload) => Promise<User>;
  fetchMe: () => Promise<User | null>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
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

  const getInitialUser = (): User | null => {
    const userJson = getStoredItem('user');
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  };

  const initialToken = getStoredItem('token');
  const initialUser = getInitialUser();

  return {
    user: initialUser,
    token: initialToken,
    isAuthenticated: !!initialToken && !!initialUser,
    isLoading: false,
    error: null,

    clearError: () => set({ error: null }),

    login: async (payload: LoginPayload) => {
      set({ isLoading: true, error: null });

      try {
        const res = await authService.login(payload);
        const { token, user } = res.data;

        setStoredItem('token', token);
        setStoredItem('user', JSON.stringify(user));

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return user;
      } catch (err: any) {
        const message =
          err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.message ||
          err.message ||
          'Login gagal. Periksa kembali email/NIP dan password Anda.';

        removeStoredItem('token');
        removeStoredItem('user');

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: message,
        });

        throw new Error(message);
      }
    },

    fetchMe: async () => {
      const token = getStoredItem('token');
      if (!token) {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        return null;
      }

      set({ isLoading: true });

      try {
        const res = await authService.getMe();
        const user = res.data;

        setStoredItem('user', JSON.stringify(user));

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return user;
      } catch (err: any) {
        removeStoredItem('token');
        removeStoredItem('user');

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });

        return null;
      }
    },

    logout: () => {
      removeStoredItem('token');
      removeStoredItem('user');

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    },
  };
});
