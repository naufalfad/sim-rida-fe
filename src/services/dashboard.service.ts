import axiosInstance from '../lib/axios';

export interface DashboardSummary {
  completedResearch: number;
  reports: {
    draft: number;
    submitted: number;
    approved: number;
  };
  policyBriefs: {
    draft: number;
    submitted: number;
    approved: number;
  };
  recommendations: {
    draft: number;
    submitted: number;
    approved: number;
    published: number;
  };
}

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await axiosInstance.get<{ success: boolean; data: DashboardSummary }>('/research-results/dashboard');
    return response.data.data;
  },

  getReportStats: async (): Promise<any> => {
    const response = await axiosInstance.get<{ success: boolean; data: any }>('/research-reports/statistics');
    return response.data.data;
  },

  getPolicyBriefStats: async (): Promise<any> => {
    const response = await axiosInstance.get<{ success: boolean; data: any }>('/policy-briefs/statistics');
    return response.data.data;
  },

  getRecommendationStats: async (): Promise<any> => {
    const response = await axiosInstance.get<{ success: boolean; data: any }>('/recommendations/statistics');
    return response.data.data;
  },
};
