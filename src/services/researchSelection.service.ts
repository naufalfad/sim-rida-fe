import axiosInstance from '../lib/axios';

export interface SelectionCriterion {
  id: string;
  code: string;
  name: string;
  description?: string;
  weight: number;
  isActive?: boolean;
  order?: number;
}

export interface SelectionScore {
  id?: string;
  scoreId?: string;
  criteriaId: string;
  code: string;
  name: string;
  description?: string;
  weight: number;
  score: number;
  weightedScore?: number;
  note?: string;
}

export interface ResearchSelection {
  id: string;
  code: string;
  researchProposalId: string;
  researchProposal?: any;
  status: string;
  totalScore?: number;
  result?: string;
  selectionNote?: string;
  selectedAt?: string;
  finalizedAt?: string;
  finalizedBy?: any;
  createdBy?: any;
  scores?: SelectionScore[];
  criteria?: SelectionScore[];
  createdAt: string;
  updatedAt: string;
}

export const researchSelectionService = {
  getAll: async (params?: Record<string, any>): Promise<ResearchSelection[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: ResearchSelection[] }>('/research-selections', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<ResearchSelection> => {
    const response = await axiosInstance.get<{ success: boolean; data: ResearchSelection }>(`/research-selections/${id}`);
    return response.data.data;
  },

  getCriteria: async (): Promise<SelectionCriterion[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: SelectionCriterion[] }>('/research-selections/criteria');
    return response.data.data;
  },

  create: async (data: { researchProposalId: string; notes?: string }): Promise<ResearchSelection> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchSelection }>('/research-selections', data);
    return response.data.data;
  },

  score: async (id: string, scores: Array<{ criteriaId: string; score: number; note?: string }>): Promise<any> => {
    const response = await axiosInstance.patch<{ success: boolean; data: any }>(`/research-selections/${id}/scores`, { scores });
    return response.data.data;
  },

  bulkUpdateScores: async (id: string, scores: Array<{ criteriaId: string; score: number; note?: string }>): Promise<any> => {
    const response = await axiosInstance.patch<{ success: boolean; data: any }>(`/research-selections/${id}/scores`, { scores });
    return response.data.data;
  },

  finalize: async (id: string, decision: 'SELECTED' | 'NOT_SELECTED', notes?: string): Promise<any> => {
    const finalNote = notes && notes.trim().length >= 5 ? notes.trim() : 'Hasil penilaian seleksi kelayakan usulan penelitian telah disetujui.';
    const response = await axiosInstance.post<{ success: boolean; data: any }>(`/research-selections/${id}/finalize`, {
      result: decision,
      decision,
      selectionNote: finalNote,
      notes: finalNote,
      summary: finalNote,
    });
    return response.data.data;
  },
};

