import { create } from 'zustand';
import { partnerService, ResearchPartner, ResearchPartnerSelection } from '../services/partner.service';

export type MethodType = 'SWAKELOLA' | 'PENUNJUKAN_LANGSUNG' | 'E_KATALOG' | 'TENDER' | '';

export interface InternalTeamMember {
  id: string;
  name: string;
  position: string;
  role: string;
  expertise: string;
}

export interface MethodSelection {
  id?: string;
  researchId: string;
  method: MethodType;
  justification: string;
  swakelolaDetails?: {
    unitPelaksana: string;
    rencanaPelaksana: string;
    internalTeam: InternalTeamMember[];
  };
  procurementReference?: string;
  catalogReference?: string;
  status: 'NOT_STARTED' | 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REVISION_REQUIRED';
  partnerStatus: 'NOT_STARTED' | 'DRAFT' | 'EVALUATED' | 'RECOMMENDED' | 'SELECTED';
  updatedBy: string;
  updatedAt: string;
  decisionNotes: string;
  decisionBy: string;
  decisionDate: string;
}

export interface SupportingDocument {
  id: string;
  name: string;
  type: 'Company Profile' | 'Proposal' | 'Legal Document' | 'Qualification Document' | 'Technical Proposal' | 'Price Proposal';
  uploadDate: string;
  status: string;
}

export interface CandidateEvaluation {
  competence: number;
  experience: number;
  capacity: number;
  methodology: number;
  cost: number;
  availability: number;
  strength: string;
  weakness: string;
  risk: string;
  notes: string;
  recommendation: 'RECOMMENDED' | 'NOT_RECOMMENDED';
}

export interface Candidate {
  id: string;
  researchId: string;
  name: string;
  type: 'Perguruan Tinggi' | 'Lembaga Penelitian' | 'Konsultan' | 'Perusahaan' | 'Organisasi' | 'Internal Pemerintah' | 'Lainnya';
  specialization: string;
  address: string;
  contact: string;
  email: string;
  website: string;
  price: number;
  notes: string;
  status: 'CANDIDATE' | 'EVALUATED' | 'RECOMMENDED' | 'SELECTED';
  documents: SupportingDocument[];
  evaluation?: CandidateEvaluation;
}

export interface PartnerActivity {
  id: string;
  date: string;
  user: string;
  action: string;
  details: string;
}

interface PartnerState {
  methods: Record<string, MethodSelection>;
  candidates: Record<string, Candidate[]>;
  activities: Record<string, PartnerActivity[]>;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  fetchPartners: () => Promise<void>;
  getMethod: (researchId: string) => MethodSelection;
  getCandidates: (researchId: string) => Candidate[];
  getActivities: (researchId: string) => PartnerActivity[];

  saveMethod: (researchId: string, data: Partial<MethodSelection>, userName: string) => Promise<void>;
  saveCandidate: (researchId: string, candidate: Omit<Candidate, 'documents'> & { documents?: SupportingDocument[] }) => Promise<void>;
  deleteCandidate: (researchId: string, candidateId: string) => Promise<void>;
  saveEvaluation: (researchId: string, candidateId: string, evaluation: CandidateEvaluation) => Promise<void>;
  submitPartnerForReview: (researchId: string, userName: string) => Promise<void>;
  approvePartner: (researchId: string, reviewNotes: string, userName: string) => Promise<void>;
  returnPartnerForRevision: (researchId: string, reviewNotes: string, userName: string) => Promise<void>;
}

const createDefaultMethod = (researchId: string): MethodSelection => ({
  researchId,
  method: 'SWAKELOLA',
  justification: '',
  status: 'NOT_STARTED',
  partnerStatus: 'NOT_STARTED',
  updatedBy: 'BRIDA Litbang',
  updatedAt: new Date().toLocaleDateString('id-ID'),
  decisionNotes: '',
  decisionBy: '',
  decisionDate: '',
});

export const usePartnerStore = create<PartnerState>((set, get) => ({
  methods: {},
  candidates: {},
  activities: {},
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchPartners: async () => {
    set({ isLoading: true, error: null });
    try {
      const [selections, partners] = await Promise.all([
        partnerService.getPartnerSelections(),
        partnerService.getPartners(),
      ]);

      const methodsMap: Record<string, MethodSelection> = {};
      const candidatesMap: Record<string, Candidate[]> = {};
      const actMap: Record<string, PartnerActivity[]> = {};

      const globalCandidates: Candidate[] = (partners || []).map((p: any) => {
        let typeStr: Candidate['type'] = 'Lembaga Penelitian';
        if (p.type === 'UNIVERSITY') typeStr = 'Perguruan Tinggi';
        else if (p.type === 'CONSULTANT') typeStr = 'Konsultan';
        else if (p.type === 'COMPANY') typeStr = 'Perusahaan';
        else if (p.type === 'INTERNAL_BRIDA') typeStr = 'Internal Pemerintah';
        else if (p.type === 'INDIVIDUAL') typeStr = 'Organisasi';

        let candPrice = Number(p.price || p.estimatedValue || p.finalValue || 0);
        let candNotes = p.description || p.notes || '';
        let candSpec = p.institutionName || p.institution || '';
        let candWeb = p.website || '';

        if (typeof window !== 'undefined') {
          try {
            const saved = localStorage.getItem(`sim_rida_cand_${p.id}`);
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed.price) candPrice = parsed.price;
              if (parsed.notes) candNotes = parsed.notes;
              if (parsed.specialization) candSpec = parsed.specialization;
              if (parsed.website) candWeb = parsed.website;
            }
          } catch (e) {}
        }

        return {
          id: p.id,
          researchId: '',
          name: p.name,
          type: typeStr,
          specialization: candSpec,
          address: p.address || '',
          contact: p.phone || p.contactPerson || '',
          email: p.email || '',
          website: candWeb,
          price: candPrice,
          notes: candNotes,
          status: 'CANDIDATE' as const,
          documents: [],
        };
      });

      // Default global candidates key
      candidatesMap['_global'] = globalCandidates;

      (selections || []).forEach((s: any) => {
        let status: MethodSelection['status'] = 'DRAFT';
        if (s.status === 'SELECTED') status = 'APPROVED';
        else if (s.status === 'SUBMITTED') status = 'UNDER_REVIEW';
        else if (s.status === 'RETURNED') status = 'REVISION_REQUIRED';

        const partnerId = s.partnerId || s.partner?.id;
        const propId = s.researchProposalId || s.proposal?.id || s.researchProposal?.id || '';
        const propCode = s.proposal?.code || s.researchProposal?.code || '';

        const isPartnerDetermined = s.method === 'SWAKELOLA' || !!partnerId;

        const mappedMethod: MethodSelection = {
          id: s.id,
          researchId: propId || s.id,
          method: (s.method as any) || 'SWAKELOLA',
          justification: s.justification || s.notes || '',
          status,
          partnerStatus: isPartnerDetermined ? 'SELECTED' : 'DRAFT',
          updatedBy: s.createdBy?.name || 'BRIDA Litbang',
          updatedAt: s.updatedAt ? new Date(s.updatedAt).toLocaleDateString('id-ID') : '2026',
          decisionNotes: s.reviewNote || '',
          decisionBy: s.finalizedBy?.name || '',
          decisionDate: s.finalizedAt ? new Date(s.finalizedAt).toLocaleDateString('id-ID') : '',
        };

        if (s.id) methodsMap[s.id] = mappedMethod;
        if (propId) methodsMap[propId] = mappedMethod;
        if (propCode) methodsMap[propCode] = mappedMethod;

        // Associate candidates for this research while preserving evaluations and custom fields
        const prevList = get().candidates[propId] || get().candidates[propCode] || get().candidates[s.id] || [];
        const prevMap = new Map(prevList.map((c) => [c.id, c]));

        const candList = globalCandidates.map((c) => {
          const prev = prevMap.get(c.id);
          let loadedPrice = prev?.price || c.price || 0;
          let loadedNotes = prev?.notes || c.notes || '';
          let loadedSpecialization = prev?.specialization || c.specialization || '';
          let loadedWebsite = prev?.website || c.website || '';
          let loadedEval = prev?.evaluation;

          if (typeof window !== 'undefined') {
            try {
              const savedCand = localStorage.getItem(`sim_rida_cand_${propId}_${c.id}`) ||
                localStorage.getItem(`sim_rida_cand_${s.id}_${c.id}`) ||
                localStorage.getItem(`sim_rida_cand_${c.id}`);
              if (savedCand) {
                const parsed = JSON.parse(savedCand);
                if (parsed.price) loadedPrice = parsed.price;
                if (parsed.notes) loadedNotes = parsed.notes;
                if (parsed.specialization) loadedSpecialization = parsed.specialization;
                if (parsed.website) loadedWebsite = parsed.website;
              }
              const savedEval = localStorage.getItem(`sim_rida_eval_${propId}_${c.id}`) || localStorage.getItem(`sim_rida_eval_${s.id}_${c.id}`);
              if (savedEval) loadedEval = JSON.parse(savedEval);
            } catch (e) {}
          }
          const isSelected = partnerId === c.id;
          if (!loadedEval && isSelected) {
            loadedEval = {
              competence: 5, experience: 5, capacity: 5, methodology: 5, cost: 5, availability: 5,
              strength: 'Kualifikasi dan kompetensi sesuai kebutuhan penelitian',
              weakness: 'Perlu penyesuaian jadwal pelaksanaan',
              risk: 'Rendah',
              notes: 'Direkomendasikan sebagai mitra pelaksana utama',
              recommendation: 'RECOMMENDED' as const
            };
          }
          let candStatus: Candidate['status'] = 'CANDIDATE';
          if (isSelected) candStatus = 'SELECTED';
          else if (loadedEval?.recommendation === 'RECOMMENDED') candStatus = 'RECOMMENDED';
          else if (loadedEval) candStatus = 'EVALUATED';

          return {
            ...c,
            researchId: propId || s.id,
            specialization: loadedSpecialization,
            website: loadedWebsite,
            price: loadedPrice,
            notes: loadedNotes,
            evaluation: loadedEval,
            status: candStatus,
          };
        });

        if (propId) candidatesMap[propId] = candList;
        if (propCode) candidatesMap[propCode] = candList;
        if (s.id) candidatesMap[s.id] = candList;
      });

      set({
        methods: methodsMap,
        candidates: candidatesMap,
        activities: actMap,
        isLoading: false,
        isLoaded: true,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Gagal memuat data mitra',
      });
    }
  },

  getMethod: (researchId: string) => {
    const methods = get().methods;
    if (methods[researchId]) return methods[researchId];
    const found = Object.values(methods).find(
      (m) => m.id === researchId || m.researchId === researchId
    );
    return found || createDefaultMethod(researchId);
  },

  getCandidates: (researchId: string) => {
    const cMap = get().candidates;
    if (cMap[researchId] && cMap[researchId].length > 0) return cMap[researchId];
    
    // Check if any list matches researchId
    const foundEntry = Object.entries(cMap).find(([k, list]) => 
      (k === researchId || list.some(c => c.researchId === researchId)) && list.length > 0
    );
    if (foundEntry) return foundEntry[1];

    // Fallback to global candidates
    const globalList = cMap['_global'] || Object.values(cMap).flat();
    const unique = Array.from(new Map(globalList.map((item) => [item.id, item])).values());
    if (unique.length > 0) {
      return unique.map((c) => ({
        ...c,
        researchId,
      }));
    }
    return [];
  },

  getActivities: (researchId: string) => {
    return get().activities[researchId] || [];
  },

  saveMethod: async (researchId, data, userName) => {
    try {
      const existing = get().getMethod(researchId);

      // Resolve proposal UUID if needed
      let proposalId = researchId;
      const proposals = (await import('./useResearchStore')).useResearchStore.getState().proposals || [];
      const prop = proposals.find(
        (p) => p.id === researchId || p.code === researchId || p.identificationId === researchId
      );
      if (prop?.id) proposalId = prop.id;
      const propCode = prop?.code || '';

      let resultSelection: any = null;

      if (existing?.id) {
        resultSelection = await partnerService.updatePartnerSelection(existing.id, {
          method: data.method,
          notes: data.justification,
          justification: data.justification,
          responsiblePerson: data.swakelolaDetails?.unitPelaksana || 'BRIDA',
          implementationTeam: data.swakelolaDetails?.rencanaPelaksana || 'Tim Internal BRIDA',
        });
      } else {
        resultSelection = await partnerService.createPartnerSelection({
          researchProposalId: proposalId,
          method: data.method || 'SWAKELOLA',
          notes: data.justification,
          justification: data.justification,
          responsiblePerson: data.swakelolaDetails?.unitPelaksana || 'BRIDA',
          implementationTeam: data.swakelolaDetails?.rencanaPelaksana || 'Tim Internal BRIDA',
        });
      }

      // Optimistic update in Zustand store so UI reacts instantly
      const updatedMethod: MethodSelection = {
        id: resultSelection?.id || existing?.id || `sel-${Date.now()}`,
        researchId: proposalId,
        method: (data.method as any) || 'SWAKELOLA',
        justification: data.justification || '',
        swakelolaDetails: data.swakelolaDetails,
        procurementReference: data.procurementReference,
        catalogReference: data.catalogReference,
        status: 'DRAFT',
        partnerStatus: data.method === 'SWAKELOLA' ? 'SELECTED' : (existing?.partnerStatus || 'DRAFT'),
        updatedBy: userName || 'BRIDA Litbang',
        updatedAt: new Date().toLocaleDateString('id-ID'),
        decisionNotes: '',
        decisionBy: '',
        decisionDate: '',
      };

      set((state) => ({
        methods: {
          ...state.methods,
          [researchId]: updatedMethod,
          [proposalId]: updatedMethod,
          ...(propCode ? { [propCode]: updatedMethod } : {}),
          ...(updatedMethod.id ? { [updatedMethod.id]: updatedMethod } : {}),
        },
      }));

      await get().fetchPartners();
    } catch (err) {
      console.error('Error saving method:', err);
      throw err;
    }
  },

  saveCandidate: async (researchId, candidate) => {
    try {
      const mapTypeToBackend = (typeStr?: string): string => {
        switch (typeStr) {
          case 'Perguruan Tinggi': return 'UNIVERSITY';
          case 'Lembaga Penelitian': return 'RESEARCH_INSTITUTION';
          case 'Konsultan': return 'CONSULTANT';
          case 'Perusahaan': return 'COMPANY';
          case 'Individual': return 'INDIVIDUAL';
          case 'Internal Pemerintah': return 'INTERNAL_BRIDA';
          default: return 'OTHER';
        }
      };

      // Resolve proposal UUID and code if needed
      let proposalId = researchId;
      const proposals = (await import('./useResearchStore')).useResearchStore.getState().proposals || [];
      const prop = proposals.find(
        (p) => p.id === researchId || p.code === researchId || p.identificationId === researchId
      );
      if (prop?.id) proposalId = prop.id;
      const propCode = prop?.code || '';

      const isRealUUID = candidate.id && !candidate.id.startsWith('cand-') && candidate.id.length >= 20;

      let created: any = null;
      if (isRealUUID) {
        created = await partnerService.updatePartner(candidate.id, {
          name: candidate.name,
          type: mapTypeToBackend(candidate.type),
          institutionName: candidate.specialization,
          email: candidate.email || undefined,
          phone: candidate.contact || undefined,
          address: candidate.address || undefined,
          website: candidate.website || undefined,
          description: candidate.notes || undefined,
        });
      } else {
        created = await partnerService.createPartner({
          name: candidate.name,
          type: mapTypeToBackend(candidate.type),
          institutionName: candidate.specialization,
          email: candidate.email || undefined,
          phone: candidate.contact || undefined,
          address: candidate.address || undefined,
          website: candidate.website || undefined,
          description: candidate.notes || undefined,
        });
      }

      // Optimistic append/update
      const newCand: Candidate = {
        id: created?.id || candidate.id || `cand-${Date.now()}`,
        researchId: proposalId,
        name: candidate.name,
        type: candidate.type,
        specialization: candidate.specialization,
        address: candidate.address || '',
        contact: candidate.contact || '',
        email: candidate.email || '',
        website: candidate.website || '',
        price: candidate.price || 0,
        notes: candidate.notes || '',
        status: candidate.status || 'CANDIDATE',
        documents: candidate.documents || [],
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`sim_rida_cand_${newCand.id}`, JSON.stringify(newCand));
          localStorage.setItem(`sim_rida_cand_${proposalId}_${newCand.id}`, JSON.stringify(newCand));
          if (researchId !== proposalId) {
            localStorage.setItem(`sim_rida_cand_${researchId}_${newCand.id}`, JSON.stringify(newCand));
          }
        } catch (e) {}
      }

      set((state) => {
        const updateList = (list: Candidate[] = []) => {
          const idx = list.findIndex((c) => c.id === newCand.id);
          if (idx >= 0) {
            const next = [...list];
            next[idx] = newCand;
            return next;
          }
          return [...list, newCand];
        };

        return {
          candidates: {
            ...state.candidates,
            [researchId]: updateList(state.candidates[researchId]),
            [proposalId]: updateList(state.candidates[proposalId]),
            ...(propCode ? { [propCode]: updateList(state.candidates[propCode]) } : {}),
            _global: updateList(state.candidates['_global']),
          },
        };
      });

      await get().fetchPartners();
    } catch (err) {
      console.error('Error saving candidate:', err);
      throw err;
    }
  },

  deleteCandidate: async (researchId, candidateId) => {
    try {
      if (candidateId && !candidateId.startsWith('cand-') && candidateId.length >= 20) {
        try {
          const axiosInstance = (await import('../lib/axios')).default;
          await axiosInstance.delete(`/research-partners/${candidateId}`);
        } catch (e) {
          console.warn('Backend delete partner skipped or failed:', e);
        }
      }
    } catch (e) {
      // ignore
    }

    set((state) => {
      const filterOut = (list: Candidate[] = []) => list.filter((c) => c.id !== candidateId);
      return {
        candidates: {
          ...state.candidates,
          [researchId]: filterOut(state.candidates[researchId]),
          _global: filterOut(state.candidates['_global']),
        },
      };
    });
  },

  saveEvaluation: async (researchId, candidateId, evaluation) => {
    try {
      const existing = get().getMethod(researchId);
      const isRecommended = evaluation.recommendation === 'RECOMMENDED';

      // Resolve proposal UUID & code
      let proposalId = researchId;
      const proposals = (await import('./useResearchStore')).useResearchStore.getState().proposals || [];
      const prop = proposals.find(
        (p) => p.id === researchId || p.code === researchId || p.identificationId === researchId
      );
      if (prop?.id) proposalId = prop.id;
      const propCode = prop?.code || '';

      // Persist in localStorage for robust client-side recovery
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`sim_rida_eval_${proposalId}_${candidateId}`, JSON.stringify(evaluation));
          if (researchId !== proposalId) {
            localStorage.setItem(`sim_rida_eval_${researchId}_${candidateId}`, JSON.stringify(evaluation));
          }
          if (existing?.id) {
            localStorage.setItem(`sim_rida_eval_${existing.id}_${candidateId}`, JSON.stringify(evaluation));
          }
        } catch (e) {}
      }

      // If recommended, link partnerId in database
      if (existing?.id && isRecommended) {
        try {
          await partnerService.updatePartnerSelection(existing.id, {
            partnerId: candidateId,
            notes: evaluation.notes || existing.justification,
          });
        } catch (e) {
          console.warn('Backend update partner selection with partnerId failed:', e);
        }
      }

      // Update in Zustand store
      set((state) => {
        const updateCandidateInList = (list: Candidate[] = []) => {
          return list.map((c) =>
            c.id === candidateId
              ? {
                  ...c,
                  evaluation,
                  status: isRecommended ? ('RECOMMENDED' as const) : ('EVALUATED' as const),
                }
              : (isRecommended && c.status === 'RECOMMENDED' ? { ...c, status: 'EVALUATED' as const } : c)
          );
        };

        const currentMethod = state.methods[researchId] || state.methods[proposalId] || existing;
        const updatedMethod = currentMethod
          ? {
              ...currentMethod,
              partnerStatus: isRecommended ? ('SELECTED' as const) : currentMethod.partnerStatus,
            }
          : undefined;

        const updatedList = updateCandidateInList(
          state.candidates[researchId] || state.candidates[proposalId] || get().getCandidates(researchId)
        );

        return {
          candidates: {
            ...state.candidates,
            [researchId]: updatedList,
            [proposalId]: updatedList,
            ...(propCode ? { [propCode]: updatedList } : {}),
            _global: updateCandidateInList(state.candidates['_global']),
          },
          methods: updatedMethod
            ? {
                ...state.methods,
                [researchId]: updatedMethod,
                [proposalId]: updatedMethod,
                ...(propCode ? { [propCode]: updatedMethod } : {}),
                ...(updatedMethod.id ? { [updatedMethod.id]: updatedMethod } : {}),
              }
            : state.methods,
        };
      });

      await get().fetchPartners();
    } catch (err) {
      console.error('Error saving evaluation:', err);
      throw err;
    }
  },

  submitPartnerForReview: async (researchId, userName) => {
    try {
      const existing = get().getMethod(researchId);
      if (existing?.id) {
        try {
          await partnerService.submitSelection(existing.id);
        } catch (e) {
          await partnerService.updatePartnerSelection(existing.id, { status: 'SUBMITTED' });
        }
      }

      set((state) => {
        const currentMethod = state.methods[researchId] || existing;
        if (!currentMethod) return state;
        const updated = { ...currentMethod, status: 'UNDER_REVIEW' as const };
        return {
          methods: {
            ...state.methods,
            [researchId]: updated,
            ...(updated.id ? { [updated.id]: updated } : {}),
          },
        };
      });

      await get().fetchPartners();
    } catch (err) {
      console.error('Error submitting partner selection:', err);
      throw err;
    }
  },

  approvePartner: async (researchId, reviewNotes, userName) => {
    try {
      const existing = get().getMethod(researchId);
      const candidates = get().getCandidates(researchId) || [];
      const selected = candidates.find((c) => c.status === 'SELECTED' || c.status === 'RECOMMENDED') || candidates[0];

      if (existing?.id) {
        await partnerService.finalizeSelection(existing.id, selected?.id);
      }

      set((state) => {
        const currentMethod = state.methods[researchId] || existing;
        if (!currentMethod) return state;
        const updated = { ...currentMethod, status: 'APPROVED' as const, partnerStatus: 'SELECTED' as const };
        return {
          methods: {
            ...state.methods,
            [researchId]: updated,
            ...(updated.id ? { [updated.id]: updated } : {}),
          },
        };
      });

      await get().fetchPartners();
    } catch (err) {
      console.error('Error approving partner:', err);
      throw err;
    }
  },

  returnPartnerForRevision: async (researchId, reviewNotes, userName) => {
    try {
      const existing = get().getMethod(researchId);
      if (existing?.id) {
        await partnerService.returnSelection(existing.id, reviewNotes || 'Perlu revisi pemilihan mitra');
      }

      set((state) => {
        const currentMethod = state.methods[researchId] || existing;
        if (!currentMethod) return state;
        const updated = { ...currentMethod, status: 'REVISION_REQUIRED' as const };
        return {
          methods: {
            ...state.methods,
            [researchId]: updated,
            ...(updated.id ? { [updated.id]: updated } : {}),
          },
        };
      });

      await get().fetchPartners();
    } catch (err) {
      console.error('Error returning partner selection for revision:', err);
      throw err;
    }
  },
}));

if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!usePartnerStore.getState().isLoaded) {
      usePartnerStore.getState().fetchPartners();
    }
  }, 0);
}

