import axiosInstance from '../lib/axios';

export interface MasterOPD {
  id: string;
  code: string;
  name: string;
  shortName: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
}

export interface MasterSector {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface MasterResearchType {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export const masterService = {
  getOpds: async (): Promise<MasterOPD[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: MasterOPD[] }>('/opds');
    return response.data.data;
  },

  getSectors: async (): Promise<MasterSector[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: MasterSector[] }>('/master/sectors');
    return response.data.data;
  },

  getResearchTypes: async (): Promise<MasterResearchType[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: MasterResearchType[] }>('/master/research-types');
    return response.data.data;
  },

  getUsers: async (params?: Record<string, any>): Promise<any[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: any[] }>('/users', { params });
    return response.data.data;
  },
};
