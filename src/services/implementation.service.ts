import axiosInstance from '../lib/axios';

export interface ResearchImplementation {
  id: string;
  code: string;
  researchProposalId: string;
  researchProposal?: any;
  partnerSelectionId: string;
  partnerSelection?: any;
  responsibleUserId: string;
  responsibleUser?: any;
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  status: string;
  progress: number;
  description?: string;
  notes?: string;
  cancelReason?: string;
  timelines?: any[];
  milestones?: any[];
  activities?: any[];
  documents?: any[];
  progressHistory?: any[];
  reports?: any[];
  createdAt: string;
  updatedAt: string;
}

export const implementationService = {
  getAll: async (params?: Record<string, any>): Promise<ResearchImplementation[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: ResearchImplementation[] }>('/research-implementations', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<ResearchImplementation> => {
    const response = await axiosInstance.get<{ success: boolean; data: ResearchImplementation }>(`/research-implementations/${id}`);
    return response.data.data;
  },

  create: async (data: any): Promise<ResearchImplementation> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchImplementation }>('/research-implementations', data);
    return response.data.data;
  },

  update: async (id: string, data: any): Promise<ResearchImplementation> => {
    const response = await axiosInstance.patch<{ success: boolean; data: ResearchImplementation }>(`/research-implementations/${id}`, data);
    return response.data.data;
  },

  start: async (id: string, actualStartDate?: string): Promise<ResearchImplementation> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchImplementation }>(`/research-implementations/${id}/start`, { actualStartDate });
    return response.data.data;
  },

  updateProgress: async (id: string, progress: number, notes?: string): Promise<ResearchImplementation> => {
    const response = await axiosInstance.patch<{ success: boolean; data: ResearchImplementation }>(`/research-implementations/${id}/progress`, {
      progress,
      notes,
    });
    return response.data.data;
  },

  complete: async (id: string, actualEndDate?: string, notes?: string): Promise<ResearchImplementation> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchImplementation }>(`/research-implementations/${id}/complete`, {
      actualEndDate,
      notes,
    });
    return response.data.data;
  },

  cancel: async (id: string, cancelReason: string): Promise<ResearchImplementation> => {
    const response = await axiosInstance.post<{ success: boolean; data: ResearchImplementation }>(`/research-implementations/${id}/cancel`, { cancelReason });
    return response.data.data;
  },

  // Timelines
  getTimelines: async (implementationId: string): Promise<any[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: any[] }>(`/research-implementations/${implementationId}/timelines`);
    return response.data.data;
  },

  createTimeline: async (implementationId: string, data: any): Promise<any> => {
    const response = await axiosInstance.post<{ success: boolean; data: any }>(`/research-implementations/${implementationId}/timelines`, data);
    return response.data.data;
  },

  updateTimeline: async (timelineId: string, data: any): Promise<any> => {
    const response = await axiosInstance.patch<{ success: boolean; data: any }>(`/research-timelines/${timelineId}`, data);
    return response.data.data;
  },

  deleteTimeline: async (timelineId: string): Promise<void> => {
    await axiosInstance.delete(`/research-timelines/${timelineId}`);
  },

  // Milestones
  getMilestones: async (implementationId: string): Promise<any[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: any[] }>(`/research-implementations/${implementationId}/milestones`);
    return response.data.data;
  },

  createMilestone: async (implementationId: string, data: any): Promise<any> => {
    const response = await axiosInstance.post<{ success: boolean; data: any }>(`/research-implementations/${implementationId}/milestones`, data);
    return response.data.data;
  },

  updateMilestoneProgress: async (milestoneId: string, progress: number): Promise<any> => {
    const response = await axiosInstance.patch<{ success: boolean; data: any }>(`/research-milestones/${milestoneId}/progress`, { progress });
    return response.data.data;
  },

  completeMilestone: async (milestoneId: string): Promise<any> => {
    const response = await axiosInstance.post<{ success: boolean; data: any }>(`/research-milestones/${milestoneId}/complete`);
    return response.data.data;
  },

  // Activities
  getActivities: async (implementationId: string, params?: Record<string, any>): Promise<any[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: any[] }>(`/research-implementations/${implementationId}/activities`, { params });
    return response.data.data;
  },

  createActivity: async (implementationId: string, data: any): Promise<any> => {
    const response = await axiosInstance.post<{ success: boolean; data: any }>(`/research-implementations/${implementationId}/activities`, data);
    return response.data.data;
  },

  completeActivity: async (activityId: string): Promise<any> => {
    const response = await axiosInstance.post<{ success: boolean; data: any }>(`/research-activities/${activityId}/complete`);
    return response.data.data;
  },

  // Documents
  getDocuments: async (implementationId: string): Promise<any[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: any[] }>(`/research-implementations/${implementationId}/documents`);
    return response.data.data;
  },

  uploadDocument: async (implementationId: string, formData: FormData): Promise<any> => {
    const response = await axiosInstance.post(`/research-implementations/${implementationId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
};
