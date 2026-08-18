import { UserRole } from '@/constants/roles';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  department?: string;
  email?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
