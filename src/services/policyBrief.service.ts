import axiosInstance from '../lib/axios';

export interface PolicyBrief {
  id: string;
  reportId: string;
  report?: any;
  title: string;
  version: string;
  status: string;
  executiveSummary: string;
  problemStatement?: string;
  researchFindings?: string;
  policyOptions?: string;
  recommendedPolicy?: string;
  conclusion?: string;
  submittedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  documents?: any[];
  reviews?: any[];
  recommendations?: any[];
  createdAt: string;
  updatedAt: string;
}

export const policyBriefService = {
  getAll: async (params?: Record<string, any>): Promise<PolicyBrief[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: PolicyBrief[] }>('/policy-briefs', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<PolicyBrief> => {
    const response = await axiosInstance.get<{ success: boolean; data: PolicyBrief }>(`/policy-briefs/${id}`);
    return response.data.data;
  },

  create: async (reportId: string, data: any): Promise<PolicyBrief> => {
    const response = await axiosInstance.post<{ success: boolean; data: PolicyBrief }>(`/research-reports/${reportId}/policy-briefs`, data);
    return response.data.data;
  },

  update: async (id: string, data: any): Promise<PolicyBrief> => {
    const response = await axiosInstance.patch<{ success: boolean; data: PolicyBrief }>(`/policy-briefs/${id}`, data);
    return response.data.data;
  },

  submit: async (id: string): Promise<PolicyBrief> => {
    const response = await axiosInstance.post<{ success: boolean; data: PolicyBrief }>(`/policy-briefs/${id}/submit`);
    return response.data.data;
  },

  review: async (id: string, decision: 'APPROVE' | 'REVISION', notes?: string): Promise<any> => {
    const response = await axiosInstance.post<{ success: boolean; data: any }>(`/policy-briefs/${id}/review`, {
      decision,
      notes,
    });
    return response.data.data;
  },

  getDocuments: async (id: string): Promise<any[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: any[] }>(`/policy-briefs/${id}/documents`);
    return response.data.data;
  },

  uploadDocument: async (id: string, formData: FormData): Promise<any> => {
    const response = await axiosInstance.post(`/policy-briefs/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  deleteDocument: async (id: string, documentId: string): Promise<void> => {
    await axiosInstance.delete(`/policy-briefs/${id}/documents/${documentId}`);
  },
};
