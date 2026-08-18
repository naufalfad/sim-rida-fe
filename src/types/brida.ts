export interface VerificationChecklist {
  kakCheck: boolean;
  problemValid: boolean;
  supportingDocCheck: boolean;
  notes: string;
}

export interface SubstantiveReview {
  relevansi: number; // 0-100
  urgensi: number; // 0-100
  novelty: number; // 0-100
  feasibility: number; // 0-100
  impact: number; // 0-100
  alignment: number; // 0-100
  totalScore: number; // calculated average
  recommendation: 'RECOMMENDED' | 'RESERVE' | 'REJECTED';
  reviewerNotes: string;
}

export interface PreviousResearch {
  title: string;
  year: number;
  role: string;
}

export interface Researcher {
  id: string;
  name: string;
  expertise: string;
  institution: string;
  previousResearch: PreviousResearch[];
  assignedResearchId?: string;
  assignedResearchTitle?: string;
}

export interface ProjectIssue {
  id: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'RESOLVED';
  dateReported: string;
}

export interface ProjectRisk {
  id: string;
  description: string;
  mitigation: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ReportReview {
  reviewerNotes: string;
  status: 'APPROVED' | 'REVISION_REQUIRED';
  reviewedAt?: string;
}
