import { WorkflowStatus } from '@/constants/status';

export interface ProblemProposal {
  judul: string;
  bidang: string;
  opd: string;
  latarBelakang: string;
  masalahUtama: string;
  dampak: string;
  urgensi: string;
  targetPenyelesaian: string;
  dokumenPendukung?: string; // filename
}

export interface ResearchProposal {
  judul: string;
  tujuan: string;
  pertanyaanPenelitian: string;
  ruangLingkup: string;
  outputDiharapkan: string;
  outcomeDiharapkan: string;
  indikator: string;
  estimasiWaktu: string;
  estimasiAnggaran: number;
}

export interface KAK {
  identitas: string;
  latarBelakang: string;
  dasarPemikiran: string;
  maksudTujuan: string;
  ruangLingkup: string;
  metodologi: string;
  output: string;
  outcome: string;
  indikator: string;
  jadwal: string;
  anggaran: number;
  penutup: string;
}

export interface TimelineLog {
  status: WorkflowStatus;
  label: string;
  date: string;
  actor: string;
  notes?: string;
  isCompleted: boolean;
}

export interface ApprovalHistoryLog {
  actor: string;
  date: string;
  action: 'APPROVE' | 'REJECT' | 'RETURN';
  comment: string;
}

export interface ResearchMilestone {
  id: string;
  label: string;
  progress: number;
  notes?: string;
  evidenceFile?: string;
  updatedAt?: string;
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: 'PROPOSAL' | 'METHODOLOGY' | 'DATASET_METADATA' | 'PROGRESS_REPORT' | 'FINAL_REPORT';
  fileName: string;
  fileSize: string;
  uploadedAt: string;
}

export interface FinalReport {
  executiveSummary: string;
  methodology: string;
  findings: string;
  conclusion: string;
  recommendation: string;
  attachments?: { name: string; size: string }[];
  submittedAt: string;
}

export interface Proposal {
  id: string;
  title: string;
  opdName: string;
  status: WorkflowStatus;
  progress: number; // 0 to 100
  createdAt: string;
  updatedAt: string;
  problem: ProblemProposal;
  research?: ResearchProposal;
  kak?: KAK;
  timeline: TimelineLog[];
  researcherId?: string;
  researcherName?: string;
  // BRIDA operational fields
  verificationChecklist?: import('./brida').VerificationChecklist;
  review?: import('./brida').SubstantiveReview;
  issues?: import('./brida').ProjectIssue[];
  risks?: import('./brida').ProjectRisk[];
  reportReview?: import('./brida').ReportReview;
  approvalHistory?: ApprovalHistoryLog[];
  milestones?: ResearchMilestone[];
  documents?: ProjectDocument[];
  finalReport?: FinalReport;
  policyBrief?: PolicyBrief;
  recommendation?: ResearchRecommendation;
}

export interface PolicyBrief {
  policyIssue: string;
  evidence: string;
  researchFindings: string;
  implication: string;
  policyOptions: string;
  preferredOption: string;
  implementationConsideration: string;
  status: 'DRAFT' | 'REVIEW' | 'REVISION' | 'APPROVED';
  updatedAt: string;
}

export interface ResearchRecommendation {
  recommendationTitle: string;
  issue: string;
  evidence: string;
  recommendation: string;
  responsibleOPD: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedImpact: string;
  targetDate: string;
  status: 'PENDING' | 'APPROVED' | 'RETURNED';
  approvedAt?: string;
}

export interface FollowUpLog {
  id: string;
  date: string;
  description: string;
  progress: number;
  evidenceFile?: string;
}

export interface FollowUp {
  id: string;
  proposalId: string;
  title: string;
  opdName: string;
  recommendationText: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  progress: number; // 0 to 100
  actionPlan?: string;
  targetDate?: string;
  pic?: string;
  evidenceFile?: string;
  logs: FollowUpLog[];
}
