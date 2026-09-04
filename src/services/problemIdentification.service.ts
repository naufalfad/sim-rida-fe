import axiosInstance from '../lib/axios';

export interface ProblemIdentification {
  id: string;
  code: string;
  title: string;
  description: string;
  status: string;
  sourceVersionId?: string;
  sourceVersion?: any;
  createdById: string;
  createdBy?: any;
  reviewedById?: string;
  reviewedBy?: any;
  reviewedAt?: string;
  reviewNote?: string;
  findings?: any[];
  relatedOpds?: any[];
  createdAt: string;
  updatedAt: string;
}

export const problemIdentificationService = {
  getAll: async (params?: Record<string, any>): Promise<ProblemIdentification[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: ProblemIdentification[] }>('/problem-identifications', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<ProblemIdentification> => {
    const response = await axiosInstance.get<{ success: boolean; data: ProblemIdentification }>(`/problem-identifications/${id}`);
    return response.data.data;
  },

  create: async (data: any): Promise<ProblemIdentification> => {
    const response = await axiosInstance.post<{ success: boolean; data: ProblemIdentification }>('/problem-identifications', data);
    return response.data.data;
  },

  update: async (id: string, data: any): Promise<ProblemIdentification> => {
    const response = await axiosInstance.patch<{ success: boolean; data: ProblemIdentification }>(`/problem-identifications/${id}`, data);
    return response.data.data;
  },

  validate: async (id: string, decision: 'APPROVE' | 'REJECT', notes?: string): Promise<ProblemIdentification> => {
    const response = await axiosInstance.post<{ success: boolean; data: ProblemIdentification }>(`/problem-identifications/${id}/validate`, {
      decision,
      notes,
    });
    return response.data.data;
  },
};
