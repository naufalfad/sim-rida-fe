import axiosInstance from '../lib/axios';

export interface ResearchRecommendation {
  id: string;
  policyBriefId: string;
  policyBrief?: any;
  title: string;
  recommendationType: string;
  targetOpdId: string;
  targetOpd?: any;
  problem: string;
  basis: string;
  recommendation: string;
  expectedImpact?: string;
  priority: string;
  status: string;
  submittedAt?: string;
  approvedById?: string;
  approvedBy?: any;
  approvedAt?: string;
  publishedAt?: string;
  documents?: any[];
  reviews?: any[];
  createdAt: string;
  updatedAt: string;
}

export const recommendationService = {
  // BRIDA & General
  getAll: async (params?: Record<string, any>): Promise<ResearchRecommendation[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: ResearchRecommendation[] }>('/recommendations', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<ResearchRecommendation> => {
    const response = await axiosInstance.get<{ success: boolean; data: ResearchRecommendation }>(`/recommendations/${id}`);
    return response.data.data;
  },

  create: async (policyBriefId: string, data: any): Promise<ResearchRecommendation> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchRecommendation }>(`/policy-briefs/${policyBriefId}/recommendations`, data);
    return response.data.data;
  },

  update: async (id: string, data: any): Promise<ResearchRecommendation> => {
    const response = await axiosInstance.patch<{ success: boolean; data: ResearchRecommendation }>(`/recommendations/${id}`, data);
    return response.data.data;
  },

  submit: async (id: string): Promise<ResearchRecommendation> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchRecommendation }>(`/recommendations/${id}/submit`);
    return response.data.data;
  },

  approve: async (id: string, notes?: string): Promise<any> => {
    const response = await axiosInstance.post<{ success: boolean; data: any }>(`/recommendations/${id}/approve`, { notes });
    return response.data.data;
  },

  revision: async (id: string, notes: string): Promise<any> => {
    const response = await axiosInstance.post<{ success: boolean; data: any }>(`/recommendations/${id}/revision`, { notes });
    return response.data.data;
  },

  publish: async (id: string): Promise<ResearchRecommendation> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchRecommendation }>(`/recommendations/${id}/publish`);
    return response.data.data;
  },

  // OPD-Specific Portal
  getOpdRecommendations: async (params?: Record<string, any>): Promise<ResearchRecommendation[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: ResearchRecommendation[] }>('/opd/recommendations', { params });
    return response.data.data;
  },

  getOpdRecommendationById: async (id: string): Promise<any> => {
    const response = await axiosInstance.get<{ success: boolean; data: any }>(`/opd/recommendations/${id}`);
    return response.data.data;
  },

  // Documents
  getDocuments: async (id: string): Promise<any[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: any[] }>(`/recommendations/${id}/documents`);
    return response.data.data;
  },

  uploadDocument: async (id: string, formData: FormData): Promise<any> => {
    const response = await axiosInstance.post(`/recommendations/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  deleteDocument: async (id: string, documentId: string): Promise<void> => {
    await axiosInstance.delete(`/recommendations/${id}/documents/${documentId}`);
  },
};
