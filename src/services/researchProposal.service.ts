import axiosInstance from '../lib/axios';

export interface ResearchProposal {
  id: string;
  code: string;
  title: string;
  background?: string;
  problemStatement?: string;
  researchQuestion?: string;
  objective?: string;
  scope?: string;
  expectedOutput?: string;
  expectedOutcome?: string;
  methodology?: string;
  priority: string;
  status: string;
  reviewNote?: string;
  cancelReason?: string;
  createdById: string;
  createdBy?: any;
  submittedAt?: string;
  reviewedAt?: string;
  problems?: any[];
  relatedOpds?: any[];
  selection?: any;
  kak?: any;
  partnerSelection?: any;
  implementation?: any;
  createdAt: string;
  updatedAt: string;
}

export const researchProposalService = {
  getAll: async (params?: Record<string, any>): Promise<ResearchProposal[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: ResearchProposal[] }>('/research-proposals', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<ResearchProposal> => {
    const response = await axiosInstance.get<{ success: boolean; data: ResearchProposal }>(`/research-proposals/${id}`);
    return response.data.data;
  },

  create: async (data: any): Promise<ResearchProposal> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchProposal }>('/research-proposals', data);
    return response.data.data;
  },

  update: async (id: string, data: any): Promise<ResearchProposal> => {
    const response = await axiosInstance.patch<{ success: boolean; data: ResearchProposal }>(`/research-proposals/${id}`, data);
    return response.data.data;
  },

  submit: async (id: string): Promise<ResearchProposal> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchProposal }>(`/research-proposals/${id}/submit`);
    return response.data.data;
  },

  review: async (id: string, action: 'APPROVE' | 'REJECT' | 'RETURN', note?: string): Promise<ResearchProposal> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchProposal }>(`/research-proposals/${id}/review`, {
      action,
      note,
    });
    return response.data.data;
  },

  getTraceability: async (id: string): Promise<any> => {
    const response = await axiosInstance.get<{ success: boolean; data: any }>(`/research-proposals/${id}/traceability`);
    return response.data.data;
  },
};
