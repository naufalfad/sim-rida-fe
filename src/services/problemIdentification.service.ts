import axiosInstance from '../lib/axios';

export interface ProblemIdentification {
  id: string;
  code: string;
  opdId?: string;
  opd?: {
    id: string;
    name: string;
    code?: string;
    shortName?: string;
  };
  year: number;
  field: string;
  title: string;
  description?: string;
  bridaFindings: string;
  currentCondition: string;
  problemStatement: string;
  impact: string;
  potentialNeed: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  sourceVersionId?: string;
  sourceVersion?: {
    id: string;
    versionNumber: number;
    fileUrl?: string;
    fileName?: string;
    externalSource?: {
      id: string;
      code: string;
      title: string;
      institution?: string;
    };
  };
  baselineRelationship?: string;
  analysisNotes?: string;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  reviewedById?: string;
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  reviewedAt?: string;
  reviewNote?: string;
  relatedOpds?: any[];
  findings?: any[];
  researchProposals?: any[];
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

  approve: async (id: string, notes?: string): Promise<ProblemIdentification> => {
    return problemIdentificationService.validate(id, 'APPROVE', notes);
  },

  reject: async (id: string, notes?: string): Promise<ProblemIdentification> => {
    return problemIdentificationService.validate(id, 'REJECT', notes);
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/problem-identifications/${id}`);
  },
};

