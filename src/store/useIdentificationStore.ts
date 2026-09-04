import { create } from 'zustand';
import { problemIdentificationService, ProblemIdentification } from '../services/problemIdentification.service';

export interface EvidenceSource {
  documentId: string;
  documentName: string;
  version: string;
}

export interface AnalysisHistoryItem {
  date: string;
  confidence: number;
  status: 'DRAFT' | 'IN_REVIEW' | 'VALIDATED' | 'REJECTED';
}

export interface AuditActivity {
  id: string;
  date: string;
  identificationId: string;
  opd: string;
  user: string;
  action: string;
  details: string;
}

export interface Identification {
  id: string;
  opdId?: string;
  opd: string;
  topic: string;
  date: string;
  confidence: number;
  status: 'DRAFT' | 'ANALYZING' | 'IN_REVIEW' | 'VALIDATED' | 'REJECTED';
  primaryIssue: string;
  problemDescription: string;
  potentialNeed: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  sector: string;
  reasoningSummary: string;
  evidenceSources: EvidenceSource[];
  bridaNotes: string;
  validatedProblem: string;
  validatedNeed: string;
  rejectionReason: string;
  updatedBy: string;
  history: AnalysisHistoryItem[];
}

interface IdentificationState {
  identifications: Identification[];
  activities: AuditActivity[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  // Actions
  fetchIdentifications: () => Promise<void>;
  addIdentification: (
    opd: string,
    topic: string,
    primaryIssue: string,
    problemDescription: string,
    potentialNeed: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH',
    sector: string,
    confidence: number,
    evidenceSources: EvidenceSource[],
    userName: string,
    status?: 'DRAFT' | 'IN_REVIEW'
  ) => Promise<string>;

  updateIdentificationResult: (
    id: string,
    updatedData: Partial<Omit<Identification, 'id' | 'history'>>,
    userName: string
  ) => Promise<void>;

  validateIdentification: (id: string, userName: string, notes: string) => Promise<void>;
  rejectIdentification: (id: string, userName: string, reason: string) => Promise<void>;

  reAnalyzeOPD: (
    id: string,
    newConfidence: number,
    newIssue: string,
    newDescription: string,
    newNeed: string,
    userName: string
  ) => Promise<void>;
}

const mapBackendToIdentification = (p: ProblemIdentification): Identification => {
  const opdId = p.relatedOpds?.[0]?.opdId || p.relatedOpds?.[0]?.opd?.id;
  const primaryOpd = p.relatedOpds?.[0]?.opd?.name || 'Dinas Terkait';
  const sector = 'Pembangunan Daerah';
  const dateStr = p.createdAt
    ? new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '2026';

  let statusMapped: Identification['status'] = 'IN_REVIEW';
  if (p.status === 'APPROVED') statusMapped = 'VALIDATED';
  else if (p.status === 'REJECTED') statusMapped = 'REJECTED';
  else if (p.status === 'AI_GENERATED') statusMapped = 'IN_REVIEW';
  else if (p.status === 'DRAFT') statusMapped = 'DRAFT';
  else if (p.status === 'UNDER_REVIEW') statusMapped = 'IN_REVIEW';

  const findings = p.findings || [];
  const primaryFinding = findings[0] || {};
  const confidence = Math.round((primaryFinding.confidence || 0.85) * 100);

  const evidenceSources: EvidenceSource[] = p.sourceVersion
    ? [
        {
          documentId: p.sourceVersion.externalSourceId || 'src-1',
          documentName: p.sourceVersion.externalSource?.title || 'Dokumen Sumber',
          version: `v${p.sourceVersion.versionNumber || '1.0'}`,
        },
      ]
    : [];

  return {
    id: p.id,
    opdId,
    opd: primaryOpd,
    topic: p.title,
    date: dateStr,
    confidence,
    status: statusMapped,
    primaryIssue: primaryFinding.title || p.title,
    problemDescription: p.description,
    potentialNeed: primaryFinding.description || 'Diperlukan tindak lanjut riset daerah.',
    priority: 'HIGH',
    sector,
    reasoningSummary: primaryFinding.evidence || 'Hasil analisis telaah dokumen perencanaan.',
    evidenceSources,
    bridaNotes: p.reviewNote || '',
    validatedProblem: p.title,
    validatedNeed: p.description,
    rejectionReason: p.status === 'REJECTED' ? p.reviewNote || '' : '',
    updatedBy: p.reviewedBy?.name || p.createdBy?.name || 'BRIDA Litbang',
    history: [
      {
        date: dateStr,
        confidence,
        status: statusMapped,
      },
    ],
  };
};

export const useIdentificationStore = create<IdentificationState>((set, get) => ({
  identifications: [],
  activities: [],
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchIdentifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const records = await problemIdentificationService.getAll();
      const mapped = records.map(mapBackendToIdentification);
      set({
        identifications: mapped,
        isLoading: false,
        isLoaded: true,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Gagal memuat data identifikasi masalah',
      });
    }
  },

  addIdentification: async (
    opd,
    topic,
    primaryIssue,
    problemDescription,
    potentialNeed,
    priority,
    sector,
    confidence,
    evidenceSources,
    userName,
    status = 'IN_REVIEW'
  ) => {
    try {
      const code = `PRI-${Date.now().toString().slice(-6)}`;
      const res = await problemIdentificationService.create({
        code,
        title: topic,
        description: problemDescription,
        primaryIssue,
        problemDescription,
        potentialNeed,
        priority,
        opdName: opd,
        findings: [
          {
            title: primaryIssue || topic,
            description: problemDescription,
            evidence: potentialNeed,
            confidence: (confidence || 88) / 100,
            sourceReference: evidenceSources?.[0]?.documentName || 'Dokumen Baseline Mimika',
          },
        ],
      });
      await get().fetchIdentifications();
      return res.id;
    } catch (err) {
      console.error('Error adding identification:', err);
      return `id-${Date.now()}`;
    }
  },

  updateIdentificationResult: async (id, updatedData, userName) => {
    try {
      await problemIdentificationService.update(id, {
        title: updatedData.topic,
        description: updatedData.problemDescription,
      });
      await get().fetchIdentifications();
    } catch (err) {
      console.error('Error updating identification:', err);
    }
  },

  validateIdentification: async (id, userName, notes) => {
    try {
      await problemIdentificationService.validate(id, 'APPROVE', notes);
      await get().fetchIdentifications();
    } catch (err) {
      console.error('Error validating identification:', err);
      throw err;
    }
  },

  rejectIdentification: async (id, userName, reason) => {
    try {
      await problemIdentificationService.validate(id, 'REJECT', reason);
      await get().fetchIdentifications();
    } catch (err) {
      console.error('Error rejecting identification:', err);
      throw err;
    }
  },

  reAnalyzeOPD: async (id, newConfidence, newIssue, newDescription, newNeed, userName) => {
    try {
      await problemIdentificationService.update(id, {
        title: newIssue,
        description: newDescription,
      });
      await get().fetchIdentifications();
    } catch (err) {
      console.error('Error re-analyzing OPD:', err);
    }
  },
}));

if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!useIdentificationStore.getState().isLoaded) {
      useIdentificationStore.getState().fetchIdentifications();
    }
  }, 0);
}

