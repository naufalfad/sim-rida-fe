export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  opdId?: string | null;
  opd?: any;
}

export interface LoginPayload {
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
  data: User;
}
