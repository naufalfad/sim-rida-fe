import { Research } from './research.types';

export interface Sector {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  filename: string;
  fileUrl: string;
  uploadedAt: string;
}

export type ValidationStatus = 'DRAFT' | 'PROBLEM_SUBMITTED' | 'VALID' | 'APPROVED' | 'REVISION_REQUIRED' | 'REJECTED' | 'EKATALOG_SENT' | 'OPD_IMPLEMENTING' | 'OPD_REPORTED' | 'POLICY_BRIEF_DRAFT' | 'RECOMMENDATION_APPROVED' | 'FOLLOW_UP_COMPLETED';

export interface Problem {
  id: string;
  title: string;
  background: string;
  mainFocus: string;
  impact: string;
  urgency: string;
  targetCompletion: string;
  sectorId: string;
  sector?: Sector;
  research?: Research;
  attachments?: Attachment[];
  status: ValidationStatus;
  rejectionReason?: string;
  reviewNotes?: string;
  opdId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProblemPayload {
  title: string;
  sectorId: string;
  background: string;
  mainFocus: string;
  impact: string;
  urgency: string;
  targetCompletion: string;
  attachments?: File[];
}

export interface ProblemsResponse {
  success: boolean;
  data: Problem[];
}

export interface ProblemDetailResponse {
  success: boolean;
  data: Problem;
}

export interface SectorsResponse {
  success: boolean;
  data: Sector[];
}
