export interface OpdInfo {
  id: string;
  code: string;
  name: string;
  category?: string;
  isActive?: boolean;
}

export interface User {
  id: string;
  name: string;
  nip?: string | null;
  email: string;
  phone?: string | null;
  role: 'ADMIN_BRIDA' | 'KEPALA_BRIDA' | 'OPD' | string;
  isActive?: boolean;
  opdId?: string | null;
  opd?: OpdInfo | null;
}

export interface LoginPayload {
  identifier?: string;
  email?: string;
  username?: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface GetMeResponse {
  success: boolean;
  message?: string;
  data: User;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}
