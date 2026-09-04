import { create } from 'zustand';
import { masterService, MasterOPD, MasterSector, MasterResearchType } from '../services/master.service';

interface MasterState {
  opds: MasterOPD[];
  sectors: MasterSector[];
  researchTypes: MasterResearchType[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  fetchMasterData: () => Promise<void>;
  getOpdNameById: (id: string) => string;
}

export const useMasterStore = create<MasterState>((set, get) => ({
  opds: [],
  sectors: [],
  researchTypes: [],
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchMasterData: async () => {
    if (get().isLoaded) return;
    set({ isLoading: true, error: null });
    try {
      const [opds, sectors, researchTypes] = await Promise.all([
        masterService.getOpds(),
        masterService.getSectors().catch(() => []),
        masterService.getResearchTypes().catch(() => []),
      ]);
      set({
        opds,
        sectors,
        researchTypes,
        isLoading: false,
        isLoaded: true,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Gagal memuat master data',
      });
    }
  },

  getOpdNameById: (id: string) => {
    const opd = get().opds.find((o) => o.id === id || o.code === id);
    return opd ? opd.name : id;
  },
}));

if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!useMasterStore.getState().isLoaded) {
      useMasterStore.getState().fetchMasterData();
    }
  }, 0);
}

