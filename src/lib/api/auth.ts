import { User } from '@/types/auth';
import { MOCK_USERS } from '@/lib/mock/users';
import { UserRole } from '@/constants/roles';

const STORAGE_KEY = 'sim_rida_user';

export const authService = {
  login: async (username: string, role: UserRole): Promise<User | null> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = MOCK_USERS.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.role === role
    );

    if (user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      }
      return user;
    }

    return null;
  },

  logout: async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return authService.getCurrentUser() !== null;
  },

  switchRole: (role: UserRole): User | null => {
    const user = MOCK_USERS.find((u) => u.role === role);
    if (user && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },
};
