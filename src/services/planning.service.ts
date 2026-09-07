import axiosInstance from '../lib/axios';

export interface ResearchKak {
  id: string;
  code: string;
  researchProposalId: string;
  researchProposal?: any;
  status: string;
  background?: string;
  problemStatement?: string;
  objective?: string;
  scope?: string;
  targetOutput?: string;
  targetOutcome?: string;
  methodology?: string;
  durationMonths?: number;
  startDate?: string;
  endDate?: string;
  returnReason?: string;
  budgetEstimate?: number;
  budgetEstimates?: number;
  rab?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchRab {
  id: string;
  code: string;
  researchKakId: string;
  researchKak?: any;
  totalAmount: number;
  status: string;
  returnReason?: string;
  items?: RabItem[];
  createdAt: string;
  updatedAt: string;
}

export interface RabItem {
  id: string;
  rabId: string;
  category: string;
  itemName: string;
  specification?: string;
  volume: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export const planningService = {
  // KAK
  getKaks: async (params?: Record<string, any>): Promise<ResearchKak[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: ResearchKak[] }>('/research-kaks', { params });
    return response.data.data;
  },

  getKakById: async (id: string): Promise<ResearchKak> => {
    const response = await axiosInstance.get<{ success: boolean; data: ResearchKak }>(`/research-kaks/${id}`);
    return response.data.data;
  },

  createKak: async (data: any): Promise<ResearchKak> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchKak }>('/research-kaks', data);
    return response.data.data;
  },

  updateKak: async (id: string, data: any): Promise<ResearchKak> => {
    const response = await axiosInstance.patch<{ success: boolean; data: ResearchKak }>(`/research-kaks/${id}`, data);
    return response.data.data;
  },

  submitKak: async (id: string): Promise<ResearchKak> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchKak }>(`/research-kaks/${id}/submit`);
    return response.data.data;
  },

  returnKak: async (id: string, reviewNote: string): Promise<ResearchKak> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchKak }>(`/research-kaks/${id}/return`, { reviewNote });
    return response.data.data;
  },

  finalizeKak: async (id: string): Promise<ResearchKak> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchKak }>(`/research-kaks/${id}/finalize`);
    return response.data.data;
  },

  // RAB
  getRabs: async (params?: Record<string, any>): Promise<ResearchRab[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: ResearchRab[] }>('/research-rabs', { params });
    return response.data.data;
  },

  getRabById: async (id: string): Promise<ResearchRab> => {
    const response = await axiosInstance.get<{ success: boolean; data: ResearchRab }>(`/research-rabs/${id}`);
    return response.data.data;
  },

  createRab: async (data: { researchKakId: string }): Promise<ResearchRab> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchRab }>('/research-rabs', data);
    return response.data.data;
  },

  addRabItem: async (rabId: string, itemData: any): Promise<RabItem> => {
    const response = await axiosInstance.post<{ success: boolean; data: RabItem }>(`/research-rabs/${rabId}/items`, itemData);
    return response.data.data;
  },

  updateRabItem: async (rabId: string, itemId: string, itemData: any): Promise<RabItem> => {
    const response = await axiosInstance.patch<{ success: boolean; data: RabItem }>(`/research-rabs/${rabId}/items/${itemId}`, itemData);
    return response.data.data;
  },

  deleteRabItem: async (rabId: string, itemId: string): Promise<void> => {
    await axiosInstance.delete(`/research-rabs/${rabId}/items/${itemId}`);
  },

  returnRab: async (id: string, reviewNote: string): Promise<ResearchRab> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchRab }>(`/research-rabs/${id}/return`, { reviewNote });
    return response.data.data;
  },

  finalizeRab: async (id: string): Promise<ResearchRab> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchRab }>(`/research-rabs/${id}/finalize`);
    return response.data.data;
  },

  submitPlanning: async (proposalId: string): Promise<any> => {
    const response = await axiosInstance.post(`/research-planning/${proposalId}/submit`);
    return response.data.data;
  },

  finalizePlanning: async (proposalId: string): Promise<any> => {
    const response = await axiosInstance.post(`/research-planning/${proposalId}/finalize`);
    return response.data.data;
  },
};
