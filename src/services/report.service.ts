import axiosInstance from '../lib/axios';

export interface ResearchReport {
  id: string;
  implementationId: string;
  implementation?: any;
  title: string;
  reportType: string;
  version: string;
  status: string;
  summary?: string;
  submittedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  documents?: any[];
  reviews?: any[];
  policyBriefs?: any[];
  createdAt: string;
  updatedAt: string;
}

export const reportService = {
  getAll: async (params?: Record<string, any>): Promise<ResearchReport[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: ResearchReport[] }>('/research-reports', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<ResearchReport> => {
    const response = await axiosInstance.get<{ success: boolean; data: ResearchReport }>(`/research-reports/${id}`);
    return response.data.data;
  },

  create: async (implementationId: string, data: any): Promise<ResearchReport> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchReport }>(`/research-implementations/${implementationId}/reports`, data);
    return response.data.data;
  },

  update: async (id: string, data: any): Promise<ResearchReport> => {
    const response = await axiosInstance.patch<{ success: boolean; data: ResearchReport }>(`/research-reports/${id}`, data);
    return response.data.data;
  },

  submit: async (id: string): Promise<ResearchReport> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchReport }>(`/research-reports/${id}/submit`);
    return response.data.data;
  },

  review: async (id: string, decision: 'APPROVE' | 'REVISION' | 'REJECT', notes?: string): Promise<any> => {
    const response = await axiosInstance.post<{ success: boolean; data: any }>(`/research-reports/${id}/review`, {
      decision,
      notes,
    });
    return response.data.data;
  },

  getDocuments: async (id: string): Promise<any[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: any[] }>(`/research-reports/${id}/documents`);
    return response.data.data;
  },

  uploadDocument: async (id: string, formData: FormData): Promise<any> => {
    const response = await axiosInstance.post(`/research-reports/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  deleteDocument: async (id: string, documentId: string): Promise<void> => {
    await axiosInstance.delete(`/research-reports/${id}/documents/${documentId}`);
  },
};
