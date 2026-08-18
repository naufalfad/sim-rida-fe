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
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  progress: number; // 0 to 100
  actionPlan?: string;
  targetDate?: string;
  logs: FollowUpLog[];
}
