import axiosInstance from '../lib/axios';

export interface ResearchPartner {
  id: string;
  code: string;
  name: string;
  type: string;
  institution?: string;
  leadResearcher?: string;
  email?: string;
  phone?: string;
  address?: string;
  npwp?: string;
  bankAccount?: string;
  bankName?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchPartnerSelection {
  id: string;
  code: string;
  researchProposalId: string;
  researchProposal?: any;
  method: string;
  status: string;
  partnerId?: string;
  partner?: ResearchPartner;
  notes?: string;
  documents?: any[];
  candidates?: any[];
  evaluations?: any[];
  createdAt: string;
  updatedAt: string;
}

export const partnerService = {
  getPartners: async (params?: Record<string, any>): Promise<ResearchPartner[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: ResearchPartner[] }>('/research-partners', { params });
    return response.data.data;
  },

  createPartner: async (data: any): Promise<ResearchPartner> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchPartner }>('/research-partners', data);
    return response.data.data;
  },

  updatePartner: async (id: string, data: any): Promise<ResearchPartner> => {
    const response = await axiosInstance.patch<{ success: boolean; data: ResearchPartner }>(`/research-partners/${id}`, data);
    return response.data.data;
  },

  getPartnerSelections: async (params?: Record<string, any>): Promise<ResearchPartnerSelection[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: ResearchPartnerSelection[] }>('/research-partner-selections', { params });
    return response.data.data;
  },

  getPartnerSelectionById: async (id: string): Promise<ResearchPartnerSelection> => {
    const response = await axiosInstance.get<{ success: boolean; data: ResearchPartnerSelection }>(`/research-partner-selections/${id}`);
    return response.data.data;
  },

  createPartnerSelection: async (data: any): Promise<ResearchPartnerSelection> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchPartnerSelection }>('/research-partner-selections', data);
    return response.data.data;
  },

  updatePartnerSelection: async (id: string, data: any): Promise<ResearchPartnerSelection> => {
    const response = await axiosInstance.patch<{ success: boolean; data: ResearchPartnerSelection }>(`/research-partner-selections/${id}`, data);
    return response.data.data;
  },

  finalizeSelection: async (id: string, selectedPartnerId?: string): Promise<ResearchPartnerSelection> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchPartnerSelection }>(`/research-partner-selections/${id}/finalize`, {
      partnerId: selectedPartnerId,
    });
    return response.data.data;
  },

  submitSelection: async (id: string): Promise<ResearchPartnerSelection> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchPartnerSelection }>(`/research-partner-selections/${id}/submit`);
    return response.data.data;
  },

  returnSelection: async (id: string, reviewNote: string): Promise<ResearchPartnerSelection> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchPartnerSelection }>(`/research-partner-selections/${id}/return`, {
      reviewNote,
    });
    return response.data.data;
  },

  cancelSelection: async (id: string, cancelReason: string): Promise<ResearchPartnerSelection> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchPartnerSelection }>(`/research-partner-selections/${id}/cancel`, {
      cancelReason,
    });
    return response.data.data;
  },
};
