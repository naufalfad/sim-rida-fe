import { create } from 'zustand';
import { problemIdentificationService, ProblemIdentification } from '../services/problemIdentification.service';

export interface EvidenceSource {
  documentId: string;
  documentName: string;
  version: string;
}

export interface Identification {
  id: string;
  code: string;
  opdId?: string;
  opd: string;
  opdName: string;
  year: number;
  field: string;
  sector?: string; // compatibility alias for field
  title: string;
  topic: string; // compatibility alias for title
  date: string;
  status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'VALIDATED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence?: number; // compatibility alias
  bridaFindings: string;
  currentCondition: string;
  problemStatement: string;
  primaryIssue: string; // compatibility alias
  problemDescription: string; // compatibility alias
  impact: string;
  potentialNeed: string;
  baselineRelationship?: string;
  analysisNotes?: string;
  sourceVersionId?: string;
  sourceVersion?: any;
  evidenceSources: EvidenceSource[];
  bridaNotes: string;
  rejectionReason: string;
  createdById?: string;
  createdBy?: string;
  reviewedById?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  updatedBy: string;
  raw: ProblemIdentification;
}

interface IdentificationState {
  identifications: Identification[];
  selectedIdentification: Identification | null;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  // Actions
  fetchIdentifications: (params?: Record<string, any>) => Promise<void>;
  fetchIdentificationById: (id: string) => Promise<Identification | null>;
  createIdentification: (data: {
    opdId?: string;
    opdName?: string;
    year?: number;
    field: string;
    title: string;
    bridaFindings: string;
    currentCondition: string;
    problemStatement: string;
    impact: string;
    potentialNeed: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    status?: 'DRAFT' | 'UNDER_REVIEW';
    sourceVersionId?: string;
    baselineRelationship?: string;
    analysisNotes?: string;
  }) => Promise<ProblemIdentification>;
  updateIdentification: (id: string, data: any) => Promise<ProblemIdentification>;
  approveIdentification: (id: string, notes?: string) => Promise<ProblemIdentification>;
  rejectIdentification: (id: string, notes?: string) => Promise<ProblemIdentification>;
  deleteIdentification: (id: string) => Promise<void>;

  // Compatibility aliases
  addIdentification: (
    opd: string,
    topic: string,
    primaryIssue: string,
    problemDescription: string,
    potentialNeed: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH',
    sector: string,
    confidence?: number,
    evidenceSources?: EvidenceSource[],
    userName?: string,
    status?: 'DRAFT' | 'UNDER_REVIEW'
  ) => Promise<string>;
  updateIdentificationResult: (
    id: string,
    updatedData: Partial<Identification>,
    userName?: string
  ) => Promise<void>;
  validateIdentification: (id: string, userName?: string, notes?: string) => Promise<void>;
}

export const mapBackendToIdentification = (p: ProblemIdentification): Identification => {
  const opdId = p.opdId || p.opd?.id || p.relatedOpds?.[0]?.opdId || p.relatedOpds?.[0]?.opd?.id;
  const opdName = p.opd?.name || p.relatedOpds?.[0]?.opd?.name || 'Perangkat Daerah';
  const field = p.field || 'Pembangunan Daerah';
  const year = p.year || 2026;
  const dateStr = p.createdAt
    ? new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '2026';

  const evidenceSources: EvidenceSource[] = p.sourceVersion
    ? [
        {
          documentId: p.sourceVersion.externalSource?.id || p.sourceVersion.id,
          documentName: p.sourceVersion.externalSource?.title || p.sourceVersion.fileName || 'Dokumen Baseline Mimika',
          version: `v${p.sourceVersion.versionNumber || '1'}`,
        },
      ]
    : [];

  const creatorName = p.createdBy?.name || 'BRIDA Litbang';
  const reviewerName = p.reviewedBy?.name || '';

  return {
    id: p.id,
    code: p.code || `PRI-${p.id.slice(0, 6)}`,
    opdId,
    opd: opdName,
    opdName,
    year,
    field,
    sector: field,
    title: p.title,
    topic: p.title,
    date: dateStr,
    status: p.status,
    priority: p.priority || 'MEDIUM',
    confidence: 100,
    bridaFindings: p.bridaFindings || p.description || '',
    currentCondition: p.currentCondition || p.description || '',
    problemStatement: p.problemStatement || p.title || '',
    primaryIssue: p.problemStatement || p.title || '',
    problemDescription: p.currentCondition || p.description || '',
    impact: p.impact || '',
    potentialNeed: p.potentialNeed || '',
    baselineRelationship: p.baselineRelationship || '',
    analysisNotes: p.analysisNotes || '',
    sourceVersionId: p.sourceVersionId,
    sourceVersion: p.sourceVersion,
    evidenceSources,
    bridaNotes: p.reviewNote || p.analysisNotes || '',
    rejectionReason: p.status === 'REJECTED' ? p.reviewNote || '' : '',
    createdById: p.createdById,
    createdBy: creatorName,
    reviewedById: p.reviewedById,
    reviewedBy: reviewerName,
    reviewedAt: p.reviewedAt,
    reviewNote: p.reviewNote,
    updatedBy: reviewerName || creatorName,
    raw: p,
  };
};

export const useIdentificationStore = create<IdentificationState>((set, get) => ({
  identifications: [],
  selectedIdentification: null,
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchIdentifications: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const records = await problemIdentificationService.getAll(params);
      const mapped = records.map(mapBackendToIdentification);
      set({
        identifications: mapped,
        isLoading: false,
        isLoaded: true,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Gagal memuat data identifikasi kebutuhan',
      });
    }
  },

  fetchIdentificationById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const record = await problemIdentificationService.getById(id);
      const mapped = mapBackendToIdentification(record);
      set({
        selectedIdentification: mapped,
        isLoading: false,
      });
      return mapped;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Gagal memuat data identifikasi kebutuhan',
      });
      return null;
    }
  },

  createIdentification: async (data) => {
    try {
      const created = await problemIdentificationService.create(data);
      await get().fetchIdentifications();
      return created;
    } catch (err: any) {
      console.error('Error creating identification:', err);
      throw err;
    }
  },

  updateIdentification: async (id, data) => {
    try {
      const updated = await problemIdentificationService.update(id, data);
      await get().fetchIdentifications();
      return updated;
    } catch (err: any) {
      console.error('Error updating identification:', err);
      throw err;
    }
  },

  approveIdentification: async (id, notes) => {
    try {
      const res = await problemIdentificationService.approve(id, notes);
      await get().fetchIdentifications();
      return res;
    } catch (err: any) {
      console.error('Error approving identification:', err);
      throw err;
    }
  },

  rejectIdentification: async (id, notes) => {
    try {
      const res = await problemIdentificationService.reject(id, notes);
      await get().fetchIdentifications();
      return res;
    } catch (err: any) {
      console.error('Error rejecting identification:', err);
      throw err;
    }
  },

  deleteIdentification: async (id) => {
    try {
      await problemIdentificationService.delete(id);
      await get().fetchIdentifications();
    } catch (err: any) {
      console.error('Error deleting identification:', err);
      throw err;
    }
  },

  // Backward compatibility alias
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
    status = 'UNDER_REVIEW'
  ) => {
    const res = await problemIdentificationService.create({
      title: topic,
      opdName: opd,
      field: sector,
      bridaFindings: problemDescription,
      currentCondition: problemDescription,
      problemStatement: primaryIssue || topic,
      impact: 'Dampak terhadap capaian kinerja daerah',
      potentialNeed: potentialNeed,
      priority,
      status: status === 'DRAFT' ? 'DRAFT' : 'UNDER_REVIEW',
    });
    await get().fetchIdentifications();
    return res.id;
  },

  updateIdentificationResult: async (id, updatedData, userName) => {
    await problemIdentificationService.update(id, {
      title: updatedData.title || updatedData.topic,
      field: updatedData.field,
      bridaFindings: updatedData.bridaFindings,
      currentCondition: updatedData.currentCondition || updatedData.problemDescription,
      problemStatement: updatedData.problemStatement || updatedData.primaryIssue,
      impact: updatedData.impact,
      potentialNeed: updatedData.potentialNeed,
      priority: updatedData.priority,
      analysisNotes: updatedData.analysisNotes || updatedData.bridaNotes,
    });
    await get().fetchIdentifications();
  },

  validateIdentification: async (id, userName, notes) => {
    await problemIdentificationService.approve(id, notes);
    await get().fetchIdentifications();
  },
}));

if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!useIdentificationStore.getState().isLoaded) {
      useIdentificationStore.getState().fetchIdentifications();
    }
  }, 0);
}


