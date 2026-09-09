import axiosInstance from '../lib/axios';
import { LoginPayload, LoginResponse, GetMeResponse, ChangePasswordPayload } from '../types/auth.types';

export const authService = {
  /**
   * Mengirim request otentikasi login ke backend (/auth/login)
   */
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const identifier = (payload.identifier || payload.email || payload.username || '').trim();
    const response = await axiosInstance.post<LoginResponse>('/auth/login', {
      identifier,
      password: payload.password,
    });
    return response.data;
  },

  /**
   * Mengambil data profil user yang sedang aktif berdasarkan Bearer token (/auth/me)
   */
  getMe: async (): Promise<GetMeResponse> => {
    const response = await axiosInstance.get<GetMeResponse>('/auth/me');
    return response.data;
  },

  /**
   * Mengganti password user yang sedang login (/auth/change-password)
   */
  changePassword: async (payload: ChangePasswordPayload): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.post<{ success: boolean; message: string }>('/auth/change-password', payload);
    return response.data;
  },
};
