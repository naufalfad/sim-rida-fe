import axiosInstance from '../lib/axios';
import { LoginPayload, LoginResponse, GetMeResponse } from '../types/auth.types';

export const authService = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await axiosInstance.post<LoginResponse>('/auth/login', payload);
    return response.data;
  },

  getMe: async (): Promise<GetMeResponse> => {
    const response = await axiosInstance.get<GetMeResponse>('/auth/me');
    return response.data;
  }
};
