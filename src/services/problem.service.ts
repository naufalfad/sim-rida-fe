import axiosInstance from '../lib/axios';
import { 
  Problem, 
  ProblemsResponse, 
  ProblemDetailResponse, 
  SectorsResponse,
  CreateProblemPayload,
  Sector
} from '../types/problem.types';

export const problemService = {
  getProblems: async (): Promise<Problem[]> => {
    const response = await axiosInstance.get<ProblemsResponse>('/problems');
    return response.data.data;
  },

  getProblemById: async (id: string): Promise<Problem> => {
    const response = await axiosInstance.get<ProblemDetailResponse>(`/problems/${id}`);
    return response.data.data;
  },

  updateProblem: async (id: string, payload: Partial<CreateProblemPayload>): Promise<Problem> => {
    const formData = new FormData();
    if (payload.title) formData.append('title', payload.title);
    if (payload.sectorId) formData.append('sectorId', payload.sectorId);
    if (payload.background) formData.append('background', payload.background);
    if (payload.mainFocus) formData.append('mainFocus', payload.mainFocus);
    if (payload.impact) formData.append('impact', payload.impact);
    if (payload.urgency) formData.append('urgency', payload.urgency);
    if (payload.targetCompletion) formData.append('targetCompletion', payload.targetCompletion);
    
    if (payload.attachments && payload.attachments.length > 0) {
      payload.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    const response = await axiosInstance.patch<{success: boolean, data: Problem}>(`/problems/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  reviewProblem: async (id: string, payload: { status: string; reviewNotes?: string }): Promise<Problem> => {
    const response = await axiosInstance.patch<{success: boolean, data: Problem}>(`/problems/${id}/review`, payload);
    return response.data.data;
  },

  createProblem: async (payload: CreateProblemPayload): Promise<Problem> => {
    const formData = new FormData();
    
    formData.append('title', payload.title);
    formData.append('sectorId', payload.sectorId);
    formData.append('background', payload.background);
    formData.append('mainFocus', payload.mainFocus);
    formData.append('impact', payload.impact);
    formData.append('urgency', payload.urgency);
    formData.append('targetCompletion', payload.targetCompletion);

    if (payload.attachments && payload.attachments.length > 0) {
      payload.attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    const response = await axiosInstance.post<{success: boolean, data: Problem}>('/problems', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data;
  },

  getSectors: async (): Promise<Sector[]> => {
    const response = await axiosInstance.get<SectorsResponse>('/master/sectors');
    return response.data.data;
  }
};
