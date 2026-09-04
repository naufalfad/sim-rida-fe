import { create } from 'zustand';
import { recommendationService, ResearchRecommendation as BackendRecommendation } from '../services/recommendation.service';

export interface RecommendationRecord {
  id: string;
  researchId: string;
  policyBriefId?: string;
  title: string;
  problemStatement: string;
  researchBasis: string[];
  findingIds: string[];
  recommendationDescription: string;
  expectedPolicyImpact: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'STRATEGIC';
  primaryRecipientId: string;
  supportingRecipientIds: string[];
  status: 'NOT_STARTED' | 'DRAFT' | 'UNDER_REVIEW' | 'REVISION_REQUIRED' | 'APPROVED' | 'PUBLISHED';
  version: string;
  submittedBy: string;
  submittedDate: string;
  approvedBy: string;
  approvedDate: string;
  publishedBy: string;
  publishedDate: string;
  reviewNotes: string;
  supportingEvidence: string[];
}

export interface RecommendationActivity {
  id: string;
  date: string;
  user: string;
  action: string;
  details: string;
}

interface RecommendationState {
  recommendations: Record<string, RecommendationRecord>;
  activities: Record<string, RecommendationActivity[]>;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  fetchRecommendations: (isOpd?: boolean) => Promise<void>;
  getRecommendation: (researchId: string) => RecommendationRecord;
  getActivities: (researchId: string) => RecommendationActivity[];
  getAllRecommendations: () => RecommendationRecord[];

  saveRecommendation: (researchId: string, data: Partial<RecommendationRecord>, userName: string) => Promise<void>;
  submitRecommendationForReview: (researchId: string, userName: string) => Promise<void>;
  approveRecommendation: (researchId: string, reviewNotes: string, userName: string) => Promise<void>;
  returnRecommendationForRevision: (researchId: string, reviewNotes: string, userName: string) => Promise<void>;
  publishRecommendation: (researchId: string, userName: string) => Promise<void>;
}

const createDefaultRecommendation = (researchId: string): RecommendationRecord => ({
  id: `REC-${Date.now().toString().slice(-4)}`,
  researchId,
  title: 'Rekomendasi Kebijakan Hasil Riset',
  problemStatement: '',
  researchBasis: ['Laporan Akhir Penelitian', 'Policy Brief'],
  findingIds: [],
  recommendationDescription: '',
  expectedPolicyImpact: '',
  priority: 'HIGH',
  primaryRecipientId: 'OPD-001',
  supportingRecipientIds: [],
  status: 'NOT_STARTED',
  version: '1.0',
  submittedBy: '',
  submittedDate: '',
  approvedBy: '',
  approvedDate: '',
  publishedBy: '',
  publishedDate: '',
  reviewNotes: '',
  supportingEvidence: [],
});

export const useRecommendationStore = create<RecommendationState>((set, get) => ({
  recommendations: {},
  activities: {},
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchRecommendations: async (isOpd = false) => {
    set({ isLoading: true, error: null });
    try {
      const records = isOpd
        ? await recommendationService.getOpdRecommendations()
        : await recommendationService.getAll();

      const recMap: Record<string, RecommendationRecord> = {};
      const actMap: Record<string, RecommendationActivity[]> = {};

      records.forEach((r) => {
        let status: RecommendationRecord['status'] = 'DRAFT';
        if (r.status === 'PUBLISHED') status = 'PUBLISHED';
        else if (r.status === 'APPROVED') status = 'APPROVED';
        else if (r.status === 'SUBMITTED') status = 'UNDER_REVIEW';
        else if (r.status === 'REVISION_REQUIRED') status = 'REVISION_REQUIRED';

        let priority: RecommendationRecord['priority'] = 'HIGH';
        if (r.priority === 'LOW') priority = 'LOW';
        else if (r.priority === 'MEDIUM') priority = 'MEDIUM';
        else if (r.priority === 'URGENT') priority = 'STRATEGIC';

        const researchId =
          r.policyBrief?.report?.implementationId ||
          r.policyBriefId ||
          r.id;

        const mappedRec: RecommendationRecord = {
          id: r.id,
          researchId,
          policyBriefId: r.policyBriefId,
          title: r.title,
          problemStatement: r.problem || '',
          researchBasis: [r.basis || 'Laporan Akhir & Policy Brief'],
          findingIds: [],
          recommendationDescription: r.recommendation || '',
          expectedPolicyImpact: r.expectedImpact || '',
          priority,
          primaryRecipientId: r.targetOpdId || 'OPD-001',
          supportingRecipientIds: [],
          status,
          version: '1.0',
          submittedBy: 'BRIDA Litbang',
          submittedDate: r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('id-ID') : '',
          approvedBy: r.approvedBy?.name || '',
          approvedDate: r.approvedAt ? new Date(r.approvedAt).toLocaleDateString('id-ID') : '',
          publishedBy: r.approvedBy?.name || '',
          publishedDate: r.publishedAt ? new Date(r.publishedAt).toLocaleDateString('id-ID') : '',
          reviewNotes: r.reviews?.[0]?.notes || '',
          supportingEvidence: [],
        };

        recMap[r.id] = mappedRec;
        if (r.policyBriefId) recMap[r.policyBriefId] = mappedRec;
        if (researchId) recMap[researchId] = mappedRec;
        if (r.policyBrief?.report?.implementation?.researchProposalId) {
          recMap[r.policyBrief.report.implementation.researchProposalId] = mappedRec;
        }
        if (r.policyBrief?.report?.implementation?.researchProposal?.code) {
          recMap[r.policyBrief.report.implementation.researchProposal.code] = mappedRec;
        }

        actMap[researchId] = [
          {
            id: `ract-${r.id}`,
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID') : '2026',
            user: r.approvedBy?.name || 'BRIDA',
            action: `Status: ${r.status}`,
            details: `Rekomendasi untuk target OPD: ${r.targetOpd?.name || 'OPD Terkait'}.`,
          },
        ];
      });

      set({
        recommendations: recMap,
        activities: actMap,
        isLoading: false,
        isLoaded: true,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Gagal memuat rekomendasi kebijakan',
      });
    }
  },

  getRecommendation: (researchId: string) => {
    return get().recommendations[researchId] || createDefaultRecommendation(researchId);
  },

  getActivities: (researchId: string) => {
    return get().activities[researchId] || [];
  },

  getAllRecommendations: () => {
    const map = get().recommendations;
    // Deduplicate by id
    const uniqueMap = new Map<string, RecommendationRecord>();
    Object.values(map).forEach((r) => {
      if (r.id) uniqueMap.set(r.id, r);
    });
    return Array.from(uniqueMap.values());
  },

  saveRecommendation: async (researchId, data, userName) => {
    try {
      const existing = get().recommendations[researchId];
      if (existing?.id) {
        await recommendationService.update(existing.id, {
          title: data.title,
          problem: data.problemStatement,
          recommendation: data.recommendationDescription,
          expectedImpact: data.expectedPolicyImpact,
          targetOpdId: data.primaryRecipientId,
        });
      } else if (existing?.policyBriefId) {
        await recommendationService.create(existing.policyBriefId, {
          title: data.title || 'Rekomendasi Kebijakan',
          problem: data.problemStatement || '',
          basis: 'Policy Brief Riset Terkait',
          recommendation: data.recommendationDescription || '',
          expectedImpact: data.expectedPolicyImpact || '',
          targetOpdId: data.primaryRecipientId || 'OPD-001',
          priority: (data.priority === 'STRATEGIC' ? 'URGENT' : data.priority) || 'HIGH',
        });
      }
      await get().fetchRecommendations();
    } catch (err) {
      console.error('Error saving recommendation:', err);
    }
  },

  submitRecommendationForReview: async (researchId, userName) => {
    try {
      const existing = get().recommendations[researchId];
      if (existing?.id) {
        await recommendationService.submit(existing.id);
      }
      await get().fetchRecommendations();
    } catch (err) {
      console.error('Error submitting recommendation:', err);
    }
  },

  approveRecommendation: async (researchId, reviewNotes, userName) => {
    try {
      const existing = get().recommendations[researchId];
      if (existing?.id) {
        await recommendationService.approve(existing.id, reviewNotes);
      }
      await get().fetchRecommendations();
    } catch (err) {
      console.error('Error approving recommendation:', err);
    }
  },

  returnRecommendationForRevision: async (researchId, reviewNotes, userName) => {
    try {
      const existing = get().recommendations[researchId];
      if (existing?.id) {
        await recommendationService.revision(existing.id, reviewNotes);
      }
      await get().fetchRecommendations();
    } catch (err) {
      console.error('Error returning recommendation for revision:', err);
    }
  },

  publishRecommendation: async (researchId, userName) => {
    try {
      const existing = get().recommendations[researchId];
      if (existing?.id) {
        await recommendationService.publish(existing.id);
      }
      await get().fetchRecommendations();
    } catch (err) {
      console.error('Error publishing recommendation:', err);
    }
  },
}));

if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!useRecommendationStore.getState().isLoaded) {
      useRecommendationStore.getState().fetchRecommendations();
    }
  }, 0);
}

