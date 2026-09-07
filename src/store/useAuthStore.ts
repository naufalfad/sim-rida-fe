import { create } from 'zustand';
import { User, LoginPayload } from '../types/auth.types';
import { authService } from '../services/auth.service';

export const MOCK_USERS: Record<string, User> = {
  OPD: {
    id: 'user-opd-001',
    name: 'BAPPEDA & Perangkat Daerah Kab. Sleman',
    email: 'opd.bappeda@slemankab.go.id',
    role: 'OPD',
    opd: {
      id: 'opd-001',
      name: 'Badan Perencanaan Pembangunan Daerah (BAPPEDA)',
      code: 'BAPPEDA',
    }
  },
  ADMIN_BRIDA: {
    id: 'user-admin-001',
    name: 'Admin Litbang BRIDA Kab. Sleman',
    email: 'admin@simrida.local',
    role: 'ADMIN_BRIDA',
    opd: {
      id: 'opd-brida',
      name: 'Badan Riset dan Inovasi Daerah (BRIDA)',
      code: 'BRIDA',
    }
  },
  KEPALA_BRIDA: {
    id: 'user-kepala-001',
    name: 'Dr. H. Bambang Priyanto, M.Si (Kepala BRIDA)',
    email: 'kepala@simrida.local',
    role: 'KEPALA_BRIDA',
    opd: {
      id: 'opd-brida',
      name: 'Badan Riset dan Inovasi Daerah (BRIDA)',
      code: 'BRIDA',
    }
  }
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (payload: LoginPayload) => Promise<void>;
  loginAsMock: (role: 'OPD' | 'ADMIN_BRIDA' | 'KEPALA_BRIDA') => void;
  fetchMe: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
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
        return MOCK_USERS.OPD;
      }
    }
    return MOCK_USERS.OPD;
  };

  const initialUser = getInitialUser() || MOCK_USERS.OPD;
  const initialToken = getStoredItem('token') || 'token-mock-opd';

  return {
    user: initialUser,
    token: initialToken,
    isAuthenticated: true,
    isLoading: false,
    error: null,

    loginAsMock: (role) => {
      const mockUser = MOCK_USERS[role] || MOCK_USERS.OPD;
      const mockToken = `mock-token-${role.toLowerCase()}`;
      setStoredItem('token', mockToken);
      setStoredItem('user', JSON.stringify(mockUser));
      set({
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    },

    login: async (payload: LoginPayload) => {
      set({ isLoading: true, error: null });
      const { email, password } = payload;

      const lowerEmail = (email || '').toLowerCase();
      let matchedRole: 'OPD' | 'ADMIN_BRIDA' | 'KEPALA_BRIDA' = 'OPD';
      if (lowerEmail.includes('admin') || lowerEmail.includes('brida')) matchedRole = 'ADMIN_BRIDA';
      else if (lowerEmail.includes('kepala')) matchedRole = 'KEPALA_BRIDA';
      else if (lowerEmail.includes('opd') || lowerEmail.includes('bappeda')) matchedRole = 'OPD';

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
        const mockUser = MOCK_USERS[matchedRole];
        const mockToken = `token-mock-${matchedRole.toLowerCase()}`;
        setStoredItem('token', mockToken);
        setStoredItem('user', JSON.stringify(mockUser));
        set({
          user: mockUser,
          token: mockToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      }
    },

    fetchMe: async () => {
      const token = getStoredItem('token');
      if (!token) {
        const defaultUser = MOCK_USERS.OPD;
        set({
          user: defaultUser,
          token: 'token-mock-opd',
          isAuthenticated: true,
          isLoading: false,
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
        // Keep active mock user
      }
    },

    logout: () => {
      removeStoredItem('token');
      removeStoredItem('user');
      set({ 
        user: MOCK_USERS.OPD, 
        token: 'token-mock-opd', 
        isAuthenticated: true, 
        error: null 
      });
    }
  };
});
