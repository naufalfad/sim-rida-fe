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

export interface SelectionScoreItem {
  id?: string;
  scoreId?: string;
  criteriaId: string;
  code: string;
  name: string;
  description?: string;
  weight: number;
  score: number;
  weightedScore?: number;
  note?: string;
}

export interface ProposalSelectionData {
  id: string;
  code: string;
  status: string;
  totalScore?: number | null;
  result?: string | null;
  selectionNote?: string | null;
  cancelReason?: string | null;
  selectedAt?: string | null;
  finalizedAt?: string | null;
  finalizedBy?: {
    id: string;
    name: string;
    email?: string;
    role?: string;
  } | null;
  createdBy?: {
    id: string;
    name: string;
    email?: string;
    role?: string;
  } | null;
  scores: SelectionScoreItem[];
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
  selection?: ProposalSelectionData | null;
  totalScore?: number | null;
  selectionResult?: string | null;
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
  selection?: ProposalSelectionData | null;
  totalScore?: number | null;
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
    scores: SelectionDetail | Array<{ criteriaId: string; score: number; note?: string }>,
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

  // Map selection details from real backend payload
  const sel = p.selection;
  let mappedSelection: ProposalSelectionData | null = null;
  let totalScore: number | null = null;
  let selectionResult: string | null = null;
  let selectionHistory: SelectionHistoryItem[] = [];

  if (sel) {
    totalScore = sel.totalScore !== null && sel.totalScore !== undefined ? Number(sel.totalScore) : null;
    selectionResult = sel.result || null;
    const mappedScores: SelectionScoreItem[] = Array.isArray(sel.scores)
      ? sel.scores.map((s: any) => {
          const weight = typeof s.weight === 'number' ? s.weight : (s.weightSnapshot || s.criteria?.weight || 0);
          const score = typeof s.score === 'number' ? s.score : 0;
          const weightedScore = typeof s.weightedScore === 'number'
            ? s.weightedScore
            : Math.round(((score * weight) / 100) * 100) / 100;
          return {
            id: s.id || s.scoreId,
            criteriaId: s.criteriaId,
            code: s.code || s.criteria?.code || '',
            name: s.name || s.criteria?.name || '',
            description: s.description || s.criteria?.description || '',
            weight,
            score,
            weightedScore,
            note: s.note || '',
          };
        })
      : [];

    mappedSelection = {
      id: sel.id,
      code: sel.code,
      status: sel.status,
      totalScore: totalScore,
      result: sel.result,
      selectionNote: sel.selectionNote || sel.summary || sel.notes || '',
      cancelReason: sel.cancelReason,
      selectedAt: sel.selectedAt,
      finalizedAt: sel.finalizedAt,
      finalizedBy: sel.finalizedBy,
      createdBy: sel.createdBy,
      scores: mappedScores,
    };

    if (sel.finalizedAt || sel.status === 'FINALIZED' || sel.result) {
      selectionHistory.push({
        date: sel.finalizedAt ? new Date(sel.finalizedAt).toLocaleDateString('id-ID') : dateStr,
        user: sel.finalizedBy?.name || 'Tim Evaluator Litbang BRIDA',
        score: totalScore !== null ? `${totalScore} / 100` : 'Selesai',
        recommendation: sel.result === 'SELECTED' ? 'SELECT' : 'REJECT',
        summary: sel.selectionNote || 'Hasil evaluasi penetapan kelayakan usulan penelitian telah disetujui.',
      });
    }
  }

  const activities: ProposalActivity[] = [
    {
      id: `act-create-${p.id}`,
      date: dateStr,
      user: p.createdBy?.name || 'BRIDA Litbang',
      action: 'Inisiasi Proposal',
      details: 'Proposal penelitian dibuat.',
    },
  ];

  if (p.submittedAt) {
    activities.unshift({
      id: `act-submit-${p.id}`,
      date: subDateStr,
      user: p.createdBy?.name || 'BRIDA Litbang',
      action: 'Pengajuan Seleksi',
      details: 'Usulan penelitian diajukan untuk proses seleksi kelayakan.',
    });
  }

  if (sel?.finalizedAt) {
    activities.unshift({
      id: `act-select-${p.id}`,
      date: new Date(sel.finalizedAt).toLocaleDateString('id-ID'),
      user: sel.finalizedBy?.name || 'Evaluator BRIDA',
      action: 'Penetapan Skor Seleksi',
      details: `Skor total: ${totalScore ?? '-'} (${sel.result === 'SELECTED' ? 'Direkomendasikan Lanjut' : 'Tidak Terpilih'}).`,
    });
  }

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
    selection: mappedSelection,
    totalScore: totalScore,
    selectionResult: selectionResult,
    selectionHistory,
    activities,
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

        const mappedProp = mapped.find((mp) => mp.id === p.id);

        return {
          id: p.id,
          title: p.title,
          proposalId: p.code || p.id,
          identificationId: p.problems?.[0]?.problemIdentification?.code || 'ID-001',
          opd: p.relatedOpds?.[0]?.opd?.name || 'Dinas Terkait',
          status: implStatus,
          priority: (p.priority as any) || 'HIGH',
          approvedDate: p.reviewedAt ? new Date(p.reviewedAt).toLocaleDateString('id-ID') : '2026',
          selection: mappedProp?.selection || null,
          totalScore: mappedProp?.totalScore || null,
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
      
      // Check if selection already exists or needs creation
      let selection = (get().proposals.find(p => p.id === id)?.selection as any);
      if (!selection || !selection.id) {
        try {
          selection = await researchSelectionService.create({ researchProposalId: id });
        } catch (e: any) {
          // If already exists or error, continue
        }
      }

      const selectionId = selection?.id || id;

      // If scores array is provided, save scores first
      if (Array.isArray(scores) && scores.length > 0) {
        try {
          await researchSelectionService.bulkUpdateScores(selectionId, scores);
        } catch (scoreErr) {
          console.warn('Could not bulk update scores directly:', scoreErr);
        }
      }

      await researchSelectionService.finalize(
        selectionId,
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

