import { create } from 'zustand';
import { planningService, ResearchKak, ResearchRab, RabItem as BackendRabItem } from '../services/planning.service';

export interface KakDocument {
  id?: string;
  researchId: string;
  title: string;
  background: string;
  legalBasis: string;
  intent: string;
  objective: string;
  target: string;
  scope: string;
  methodology: string;
  location: string;
  duration: string;
  output: string;
  benefit: string;
  indicators: string;
  personnel: string;
  notes: string;
  status: 'NOT_STARTED' | 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REVISION_REQUIRED';
  version: string;
  updatedBy: string;
  updatedAt: string;
  budgetEstimates: number;
  sector: string;
}

export interface RabItem {
  id: string;
  category: string;
  component: string;
  description: string;
  volume: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

export interface RabDocument {
  id?: string;
  researchId: string;
  items: RabItem[];
  status: 'NOT_STARTED' | 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REVISION_REQUIRED';
  version: string;
  updatedBy: string;
  updatedAt: string;
}

export interface PlanningActivity {
  id: string;
  date: string;
  user: string;
  action: string;
  details: string;
}

interface PlanningState {
  kakDocuments: Record<string, KakDocument>;
  rabDocuments: Record<string, RabDocument>;
  activities: Record<string, PlanningActivity[]>;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  fetchPlanning: () => Promise<void>;
  getKak: (researchId: string) => KakDocument;
  getRab: (researchId: string) => RabDocument;
  getActivities: (researchId: string) => PlanningActivity[];

  saveKak: (researchId: string, data: Partial<KakDocument>, userName: string) => Promise<void>;
  saveRabItem: (researchId: string, item: Omit<RabItem, 'subtotal'>) => Promise<void>;
  deleteRabItem: (researchId: string, itemId: string) => Promise<void>;
  submitPlanningForReview: (researchId: string, userName: string) => Promise<void>;
  approvePlanning: (researchId: string, reviewNotes: string, userName: string) => Promise<void>;
  returnPlanningForRevision: (researchId: string, reviewNotes: string, userName: string) => Promise<void>;
}

const createDefaultKak = (researchId: string): KakDocument => ({
  researchId,
  title: 'Penyusunan KAK Penelitian',
  background: '',
  legalBasis: '',
  intent: '',
  objective: '',
  target: '',
  scope: '',
  methodology: '',
  location: '',
  duration: '6 Bulan',
  output: '',
  benefit: '',
  indicators: '',
  personnel: '',
  notes: '',
  status: 'NOT_STARTED',
  version: '1.0',
  updatedBy: 'BRIDA Litbang',
  updatedAt: new Date().toLocaleDateString('id-ID'),
  budgetEstimates: 0,
  sector: 'Pembangunan Daerah',
});

const createDefaultRab = (researchId: string): RabDocument => ({
  researchId,
  items: [],
  status: 'NOT_STARTED',
  version: '1.0',
  updatedBy: 'BRIDA Litbang',
  updatedAt: new Date().toLocaleDateString('id-ID'),
});

export const usePlanningStore = create<PlanningState>((set, get) => ({
  kakDocuments: {},
  rabDocuments: {},
  activities: {},
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchPlanning: async () => {
    set({ isLoading: true, error: null });
    try {
      const [kaks, rabs] = await Promise.all([
        planningService.getKaks(),
        planningService.getRabs(),
      ]);

      const kakMap: Record<string, KakDocument> = {};
      const rabMap: Record<string, RabDocument> = {};
      const actMap: Record<string, PlanningActivity[]> = {};

      kaks.forEach((k: any) => {
        let status: KakDocument['status'] = 'DRAFT';
        if (k.status === 'FINALIZED') status = 'APPROVED';
        else if (k.status === 'SUBMITTED') status = 'UNDER_REVIEW';
        else if (k.status === 'RETURNED') status = 'REVISION_REQUIRED';

        const totalAmount = Number(k.rab?.totalAmount || k.rabSummary?.totalAmount || k.budgetEstimates || 0);
        const mappedKak: KakDocument = {
          id: k.id,
          researchId: k.researchProposalId || k.researchProposal?.id || k.id,
          title: k.researchProposal?.title || 'Kerangka Acuan Kerja',
          background: k.background || '',
          legalBasis: k.legalBasis || '',
          intent: k.purpose || '',
          objective: k.objective || '',
          target: k.deliverables || k.expectedOutput || k.targetOutput || '',
          scope: k.researchScope || k.scope || '',
          methodology: k.researchMethodology || k.methodology || '',
          location: k.researchLocation || 'Daerah Kabupaten',
          duration: k.researchDuration || `${k.durationMonths || 6} Bulan`,
          output: k.expectedOutput || k.targetOutput || '',
          benefit: k.expectedOutcome || k.targetOutcome || '',
          indicators: k.successIndicator || '',
          personnel: k.deliverables || '',
          notes: k.notes || k.returnReason || '',
          status,
          version: String(k.version || '1.0'),
          updatedBy: 'BRIDA Litbang',
          updatedAt: k.updatedAt ? new Date(k.updatedAt).toLocaleDateString('id-ID') : '2026',
          budgetEstimates: totalAmount,
          sector: 'Pembangunan Daerah',
        };

        kakMap[k.id] = mappedKak;
        if (k.researchProposalId) kakMap[k.researchProposalId] = mappedKak;
        if (k.researchProposal?.id) kakMap[k.researchProposal.id] = mappedKak;
        if (k.researchProposal?.code) kakMap[k.researchProposal.code] = mappedKak;
        if (k.code) kakMap[k.code] = mappedKak;

        const propId = k.researchProposalId || k.researchProposal?.id || k.id;
        actMap[propId] = [
          {
            id: `act-${k.id}`,
            date: k.createdAt ? new Date(k.createdAt).toLocaleDateString('id-ID') : '2026',
            user: 'BRIDA Litbang',
            action: 'Inisiasi KAK',
            details: `Penyusunan KAK ${k.code} selesai dilakukan.`,
          },
        ];
      });

      rabs.forEach((r: any) => {
        let status: RabDocument['status'] = 'DRAFT';
        if (r.status === 'FINALIZED') status = 'APPROVED';
        else if (r.status === 'SUBMITTED') status = 'UNDER_REVIEW';
        else if (r.status === 'RETURNED') status = 'REVISION_REQUIRED';

        const items: RabItem[] = (r.items || []).map((it: any) => ({
          id: it.id,
          category: it.category || 'Belanja Operasional',
          component: it.itemName || it.description || 'Komponen Belanja',
          description: it.specification || it.notes || it.description || '',
          volume: Number(it.quantity || it.volume || 1),
          unit: it.unit || 'Unit',
          unitPrice: Number(it.unitPrice || 0),
          subtotal: Number(it.subtotal || it.totalPrice || (Number(it.quantity || 1) * Number(it.unitPrice || 0))),
        }));

        const researchId = r.researchKak?.researchProposalId || r.researchKak?.researchProposal?.id || r.researchKakId;
        const mappedRab: RabDocument = {
          id: r.id,
          researchId,
          items,
          status,
          version: String(r.version || '1.0'),
          updatedBy: 'BRIDA Litbang',
          updatedAt: r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('id-ID') : '2026',
        };

        rabMap[r.id] = mappedRab;
        if (researchId) rabMap[researchId] = mappedRab;
        if (r.researchKakId) rabMap[r.researchKakId] = mappedRab;
        if (r.researchKak?.id) rabMap[r.researchKak.id] = mappedRab;
        if (r.researchKak?.researchProposalId) rabMap[r.researchKak.researchProposalId] = mappedRab;
        if (r.researchKak?.researchProposal?.id) rabMap[r.researchKak.researchProposal.id] = mappedRab;
        if (r.researchKak?.researchProposal?.code) rabMap[r.researchKak.researchProposal.code] = mappedRab;
        if (r.code) rabMap[r.code] = mappedRab;
      });

      set({
        kakDocuments: kakMap,
        rabDocuments: rabMap,
        activities: actMap,
        isLoading: false,
        isLoaded: true,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Gagal memuat KAK dan RAB',
      });
    }
  },

  getKak: (researchId: string) => {
    const docs = get().kakDocuments;
    if (docs[researchId]) return docs[researchId];
    const found = Object.values(docs).find(
      (d) => d.id === researchId || d.researchId === researchId
    );
    return found || createDefaultKak(researchId);
  },

  getRab: (researchId: string) => {
    const docs = get().rabDocuments;
    if (docs[researchId]) return docs[researchId];
    const found = Object.values(docs).find(
      (d) => d.id === researchId || d.researchId === researchId
    );
    return found || createDefaultRab(researchId);
  },

  getActivities: (researchId: string) => {
    return get().activities[researchId] || [];
  },

  saveKak: async (researchId, data, userName) => {
    try {
      const existing = get().kakDocuments[researchId];
      if (existing?.id) {
        await planningService.updateKak(existing.id, {
          background: data.background,
          legalBasis: data.legalBasis,
          purpose: data.intent,
          intent: data.intent,
          objective: data.objective,
          researchScope: data.scope,
          scope: data.scope,
          researchLocation: data.location,
          location: data.location,
          researchDuration: data.duration,
          duration: data.duration,
          researchMethodology: data.methodology,
          methodology: data.methodology,
          expectedOutput: data.output,
          targetOutput: data.output,
          output: data.output,
          expectedOutcome: data.benefit,
          targetOutcome: data.benefit,
          benefit: data.benefit,
          successIndicator: data.indicators,
          indicators: data.indicators,
          deliverables: data.personnel,
          personnel: data.personnel,
        });
      } else {
        await planningService.createKak({
          researchProposalId: researchId,
          background: data.background || '',
          legalBasis: data.legalBasis || '',
          purpose: data.intent || '',
          intent: data.intent || '',
          objective: data.objective || '',
          researchScope: data.scope || '',
          scope: data.scope || '',
          researchLocation: data.location || '',
          location: data.location || '',
          researchDuration: data.duration || '',
          duration: data.duration || '',
          researchMethodology: data.methodology || '',
          methodology: data.methodology || '',
          expectedOutput: data.output || '',
          targetOutput: data.output || '',
          output: data.output || '',
          expectedOutcome: data.benefit || '',
          targetOutcome: data.benefit || '',
          benefit: data.benefit || '',
          successIndicator: data.indicators || '',
          indicators: data.indicators || '',
          deliverables: data.personnel || '',
          personnel: data.personnel || '',
        });
      }
      await get().fetchPlanning();
    } catch (err) {
      console.error('Error saving KAK:', err);
      throw err;
    }
  },

  saveRabItem: async (researchId, item) => {
    try {
      let existing = get().rabDocuments[researchId];
      if (!existing?.id) {
        const kak = get().kakDocuments[researchId];
        if (kak?.id) {
          try {
            const newRab = await planningService.createRab({ researchKakId: kak.id });
            existing = { ...existing, id: newRab.id };
          } catch (e) {
            // Might already exist
          }
        }
      }
      if (existing?.id) {
        await planningService.addRabItem(existing.id, {
          category: item.category,
          itemName: item.component,
          component: item.component,
          specification: item.description,
          description: item.description,
          volume: Number(item.volume),
          quantity: Number(item.volume),
          unit: item.unit,
          unitPrice: Number(item.unitPrice),
        });
      }
      await get().fetchPlanning();
    } catch (err) {
      console.error('Error saving RAB item:', err);
      throw err;
    }
  },

  deleteRabItem: async (researchId, itemId) => {
    try {
      const existing = get().rabDocuments[researchId];
      if (existing?.id) {
        await planningService.deleteRabItem(existing.id, itemId);
      }
      await get().fetchPlanning();
    } catch (err) {
      console.error('Error deleting RAB item:', err);
      throw err;
    }
  },

  submitPlanningForReview: async (researchId, userName) => {
    try {
      // 1. Try proposal-level submit
      try {
        await planningService.submitPlanning(researchId);
      } catch (e) {
        // Fallback to KAK submit
        const kak = get().getKak(researchId);
        if (kak?.id) {
          await planningService.submitKak(kak.id);
        }
      }
      await get().fetchPlanning();
    } catch (err) {
      console.error('Error submitting planning:', err);
      throw err;
    }
  },

  approvePlanning: async (researchId, reviewNotes, userName) => {
    try {
      // 1. Try proposal-level finalize first
      try {
        await planningService.finalizePlanning(researchId);
      } catch (e) {
        // Fallback to individual finalize
        const kak = get().getKak(researchId);
        const rab = get().getRab(researchId);
        if (kak?.id) await planningService.finalizeKak(kak.id);
        if (rab?.id) await planningService.finalizeRab(rab.id);
      }
      await get().fetchPlanning();
    } catch (err) {
      console.error('Error approving planning:', err);
      throw err;
    }
  },

  returnPlanningForRevision: async (researchId, reviewNotes, userName) => {
    try {
      const kak = get().getKak(researchId);
      const rab = get().getRab(researchId);
      if (kak?.id) await planningService.returnKak(kak.id, reviewNotes || 'Perlu revisi draf KAK');
      if (rab?.id) {
        try {
          await planningService.returnRab(rab.id, reviewNotes || 'Perlu revisi draf RAB');
        } catch (e) {
          // Rab might already be returned with KAK
        }
      }
      await get().fetchPlanning();
    } catch (err) {
      console.error('Error returning planning for revision:', err);
      throw err;
    }
  },
}));

if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!usePlanningStore.getState().isLoaded) {
      usePlanningStore.getState().fetchPlanning();
    }
  }, 0);
}

