import { create } from 'zustand';
import { researchProposalService, ResearchProposal as BackendProposal } from '../services/researchProposal.service';
import { researchSelectionService } from '../services/researchSelection.service';
import { useMasterStore } from './useMasterStore';

export interface SelectionDetail {
  relevance: number;
  relevanceNotes: string;
  urgency: number;
  urgencyNotes: string;
  priorityAlignment: number;
  priorityAlignmentNotes: string;
  benefits: number;
  benefitsNotes: string;
  feasibility: number;
  feasibilityNotes: string;
  dataAvailability: number;
  dataAvailabilityNotes: string;
  recommendationPotential: number;
  recommendationPotentialNotes: string;
}

export interface SelectionNotes {
  summary: string;
  strengths: string;
  weaknesses: string;
  risks: string;
  recommendation: 'SELECT' | 'REJECT' | 'NEED REVISION';
}

export interface SelectionHistoryItem {
  date: string;
  user: string;
  score: string;
  recommendation: 'SELECT' | 'REJECT' | 'NEED REVISION';
  summary: string;
}

export interface ProposalActivity {
  id: string;
  date: string;
  user: string;
  action: string;
  details: string;
}

export interface ResearchProposal {
  id: string;
  code?: string;
  identificationId: string;
  opd: string;
  title: string;
  background: string;
  problemStatement: string;
  objective: string;
  researchQuestions: string;
  scope: string;
  expectedOutput: string;
  expectedBenefits: string;
  sector: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  duration: string;
  bridaNotes: string;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedDate?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_SELECTION' | 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED';
  submittedDate: string;
  updatedDate: string;
  activities: ProposalActivity[];
  selectionDetail?: SelectionDetail;
  selectionDetails?: SelectionDetail;
  selectionNotes?: SelectionNotes;
  selectionHistory?: SelectionHistoryItem[];
}

export interface ResearchRecord {
  id: string;
  title: string;
  proposalId: string;
  identificationId: string;
  opd: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  approvedDate: string;
}

interface ResearchStore {
  proposals: ResearchProposal[];
  researchRecords: ResearchRecord[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  fetchProposals: () => Promise<void>;

  addProposal: (
    identificationId: string,
    opd: string,
    title: string,
    background: string,
    problemStatement: string,
    objective: string,
    researchQuestions: string,
    scope: string,
    expectedOutput: string,
    expectedBenefits: string,
    sector: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH',
    duration: string,
    bridaNotes: string,
    userName: string,
    opdId?: string
  ) => Promise<string>;

  updateProposal: (
    id: string,
    updatedData: Partial<Omit<ResearchProposal, 'id' | 'activities' | 'selectionHistory'>>,
    userName: string
  ) => Promise<void>;

  submitForSelection: (id: string, userName: string) => Promise<void>;
  startSelection: (id: string, userName: string) => Promise<void>;

  saveSelectionResult: (
    id: string,
    scores: SelectionDetail,
    notes: Omit<SelectionNotes, 'recommendation'> & { recommendation: 'SELECT' | 'REJECT' | 'NEED REVISION' },
    userName: string
  ) => Promise<void>;

  approveResearch: (id: string, userName: string) => Promise<void>;
  rejectResearch: (id: string, reason: string, userName: string) => Promise<void>;
}

const mapBackendToProposal = (p: BackendProposal): ResearchProposal => {
  const primaryOpd = p.relatedOpds?.[0]?.opd?.name || 'Dinas Terkait';
  const identificationId = p.problems?.[0]?.problemIdentification?.code || p.problems?.[0]?.problemIdentificationId || 'PRI-2026-001';

  let status: ResearchProposal['status'] = 'DRAFT';
  if (p.status === 'SUBMITTED') status = 'SUBMITTED';
  else if (p.status === 'UNDER_REVIEW' || p.status === 'UNDER_SELECTION' || p.status === 'APPROVED_FOR_SELECTION') status = 'UNDER_SELECTION';
  else if (p.status === 'SELECTED' || p.status === 'READY_FOR_PARTNER' || p.status === 'MITRA_SELECTED' || p.status === 'READY_FOR_IMPLEMENTATION') status = 'APPROVED';
  else if (p.status === 'REJECTED' || p.status === 'CANCELLED' || p.status === 'NOT_SELECTED') status = 'REJECTED';

  const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString('id-ID') : '2026';
  const subDateStr = p.submittedAt ? new Date(p.submittedAt).toLocaleDateString('id-ID') : '';

  return {
    id: p.id,
    code: p.code,
    identificationId,
    opd: primaryOpd,
    title: p.title,
    background: p.background || '',
    problemStatement: p.problemStatement || '',
    objective: p.objective || '',
    researchQuestions: p.researchQuestion || '',
    scope: p.scope || '',
    expectedOutput: p.expectedOutput || '',
    expectedBenefits: p.expectedOutcome || '',
    sector: 'Pembangunan Daerah',
    priority: (p.priority as any) || 'HIGH',
    duration: '6 Bulan',
    bridaNotes: p.reviewNote || '',
    rejectionReason: p.status === 'REJECTED' ? p.reviewNote || '' : '',
    rejectedBy: p.status === 'REJECTED' ? (p as any).reviewedBy?.name || 'BRIDA Litbang' : '',
    rejectedDate: p.status === 'REJECTED' && p.reviewedAt ? new Date(p.reviewedAt).toLocaleDateString('id-ID') : '',
    status,
    submittedDate: subDateStr,
    updatedDate: dateStr,
    selectionHistory: [],
    activities: [
      {
        id: `act-${p.id}`,
        date: dateStr,
        user: p.createdBy?.name || 'BRIDA Litbang',
        action: 'Inisiasi Proposal',
        details: 'Proposal penelitian dibuat.',
      },
    ],
  };
};

export const useResearchStore = create<ResearchStore>((set, get) => ({
  proposals: [],
  researchRecords: [],
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchProposals: async () => {
    set({ isLoading: true, error: null });
    try {
      const records = await researchProposalService.getAll();
      const mapped = records.map(mapBackendToProposal);

      // Extract research records for research section
      const activeProposals = records.filter(
        (p) =>
          p.status === 'SELECTED' ||
          p.status === 'READY_FOR_PARTNER' ||
          p.status === 'MITRA_SELECTED' ||
          p.status === 'READY_FOR_IMPLEMENTATION' ||
          p.status === 'APPROVED_FOR_SELECTION' ||
          p.kak ||
          p.partnerSelection ||
          p.implementation
      );

      const mappedRecords: ResearchRecord[] = activeProposals.map((p) => {
        let implStatus: ResearchRecord['status'] = 'PLANNED';
        if (p.implementation?.status === 'COMPLETED') implStatus = 'COMPLETED';
        else if (p.implementation?.status === 'ONGOING') implStatus = 'ACTIVE';

        return {
          id: p.id,
          title: p.title,
          proposalId: p.code || p.id,
          identificationId: p.problems?.[0]?.problemIdentification?.code || 'ID-001',
          opd: p.relatedOpds?.[0]?.opd?.name || 'Dinas Terkait',
          status: implStatus,
          priority: (p.priority as any) || 'HIGH',
          approvedDate: p.reviewedAt ? new Date(p.reviewedAt).toLocaleDateString('id-ID') : '2026',
        };
      });

      set({
        proposals: mapped,
        researchRecords: mappedRecords,
        isLoading: false,
        isLoaded: true,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Gagal memuat proposal penelitian',
      });
    }
  },

  addProposal: async (
    identificationId,
    opd,
    title,
    background,
    problemStatement,
    objective,
    researchQuestions,
    scope,
    expectedOutput,
    expectedBenefits,
    sector,
    priority,
    duration,
    bridaNotes,
    userName,
    opdId
  ) => {
    // 1. Resolve target OPD ID if available
    const masterOpds = useMasterStore.getState().opds;
    const matchedOpd = masterOpds.find(
      (o) =>
        o.name.toLowerCase() === (opd || '').toLowerCase() ||
        o.shortName.toLowerCase() === (opd || '').toLowerCase() ||
        o.id === opd
    );
    const resolvedOpdId = opdId || matchedOpd?.id;

    // 2. Prepare payload
    const payload: any = {
      title,
      background: background || problemStatement,
      problemStatement,
      researchQuestion: researchQuestions || `Bagaimana formulasi rekomendasi kebijakan atas permasalahan ${title}?`,
      objective,
      scope,
      expectedOutput,
      expectedOutcome: expectedBenefits || expectedOutput,
      methodology: 'Kajian kebijakan berbasis bukti (evidence-based policy research) dengan analisis data sekunder, survei lapangan, dan formulasi rekomendasi strategis.',
      priority: priority || 'MEDIUM',
    };

    if (identificationId) {
      payload.primaryProblemId = identificationId;
      payload.problemIds = [identificationId];
      payload.problems = [
        {
          problemIdentificationId: identificationId,
          isPrimary: true,
        },
      ];
    }

    if (resolvedOpdId) {
      payload.primaryOpdId = resolvedOpdId;
      payload.opdIds = [resolvedOpdId];
    }

    const res = await researchProposalService.create(payload);
    await get().fetchProposals();
    return res.id;
  },

  updateProposal: async (id, updatedData, userName) => {
    try {
      await researchProposalService.update(id, {
        title: updatedData.title,
        background: updatedData.background,
        problemStatement: updatedData.problemStatement,
        objective: updatedData.objective,
        researchQuestion: updatedData.researchQuestions,
        scope: updatedData.scope,
        expectedOutput: updatedData.expectedOutput,
        expectedOutcome: updatedData.expectedBenefits,
      });
      await get().fetchProposals();
    } catch (err) {
      console.error('Error updating proposal:', err);
      throw err;
    }
  },

  submitForSelection: async (id, userName) => {
    await researchProposalService.submit(id);
    await get().fetchProposals();
  },

  startSelection: async (id, userName) => {
    try {
      await researchSelectionService.create({ researchProposalId: id });
      await get().fetchProposals();
    } catch (err) {
      console.error('Error starting selection:', err);
      throw err;
    }
  },

  saveSelectionResult: async (id, scores, notes, userName) => {
    try {
      const decision = notes.recommendation === 'SELECT' ? 'SELECTED' : 'NOT_SELECTED';
      await researchSelectionService.finalize(
        id,
        decision,
        notes.summary || 'Hasil telaah penilaian seleksi kelayakan usulan penelitian telah disetujui.'
      );
      await get().fetchProposals();
    } catch (err) {
      console.error('Error saving selection result:', err);
      throw err;
    }
  },

  approveResearch: async (id, userName) => {
    try {
      await researchProposalService.review(id, 'APPROVE');
      await get().fetchProposals();
    } catch (err) {
      console.error('Error approving proposal:', err);
    }
  },

  rejectResearch: async (id, reason, userName) => {
    try {
      await researchProposalService.review(id, 'REJECT', reason);
      await get().fetchProposals();
    } catch (err) {
      console.error('Error rejecting proposal:', err);
    }
  },
}));

if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!useResearchStore.getState().isLoaded) {
      useResearchStore.getState().fetchProposals();
    }
  }, 0);
}

