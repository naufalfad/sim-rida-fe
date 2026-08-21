import axiosInstance from '../lib/axios';
import { 
  Research, 
  CreateResearchPayload, 
  ResearchType,
  Kak,
  CreateKakPayload
} from '../types/research.types';

export const researchService = {
  getResearchTypes: async (): Promise<ResearchType[]> => {
    const response = await axiosInstance.get<{success: boolean, data: ResearchType[]}>('/master/research-types');
    return response.data.data;
  },

  createResearch: async (payload: CreateResearchPayload): Promise<Research> => {
    const response = await axiosInstance.post<{success: boolean, data: Research}>('/researches', payload);
    return response.data.data;
  },

  createKak: async (researchId: string, payload: CreateKakPayload): Promise<Kak> => {
    const response = await axiosInstance.post<{success: boolean, data: Kak}>(`/researches/${researchId}/kak`, payload);
    return response.data.data;
  },

  getKakByResearchId: async (researchId: string): Promise<Kak> => {
    const response = await axiosInstance.get<{success: boolean, data: Kak}>(`/researches/${researchId}/kak`);
    return response.data.data;
  },

  updateResearch: async (id: string, payload: Partial<CreateResearchPayload>): Promise<Research> => {
    const response = await axiosInstance.put<{success: boolean, data: Research}>(`/researches/${id}`, payload);
    return response.data.data;
  },

  updateKak: async (researchId: string, payload: Partial<CreateKakPayload>): Promise<Kak> => {
    const response = await axiosInstance.put<{success: boolean, data: Kak}>(`/researches/${researchId}/kak`, payload);
    return response.data.data;
  }
};
