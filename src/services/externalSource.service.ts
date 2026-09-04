import axiosInstance from '../lib/axios';

export interface ExternalSource {
  id: string;
  code: string;
  title: string;
  description?: string;
  sourceType: string;
  institution?: string;
  status: string;
  currentVersionId?: string;
  createdAt: string;
  updatedAt: string;
  versions?: any[];
  currentVersion?: any;
  createdBy?: any;
}

export const externalSourceService = {
  getAll: async (params?: Record<string, any>): Promise<ExternalSource[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: ExternalSource[] }>('/external-sources', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<ExternalSource> => {
    const response = await axiosInstance.get<{ success: boolean; data: ExternalSource }>(`/external-sources/${id}`);
    return response.data.data;
  },

  create: async (data: { code: string; title: string; description?: string; sourceType: string; institution?: string }): Promise<ExternalSource> => {
    const response = await axiosInstance.post<{ success: boolean; data: ExternalSource }>('/external-sources', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<ExternalSource>): Promise<ExternalSource> => {
    const response = await axiosInstance.patch<{ success: boolean; data: ExternalSource }>(`/external-sources/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/external-sources/${id}`);
  },

  uploadVersion: async (id: string, formData: FormData): Promise<any> => {
    const response = await axiosInstance.post(`/external-sources/${id}/versions`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  analyze: async (id: string, force = false): Promise<any> => {
    const response = await axiosInstance.post(`/external-sources/${id}/analyze`, { force });
    return response.data.data;
  },
};
