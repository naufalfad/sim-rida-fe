import { create } from 'zustand';
import { ResearchType } from '../types/research.types';
import { researchService } from '../services/research.service';

interface ResearchState {
  researchTypes: ResearchType[];
  isLoading: boolean;
  
  // Actions
  fetchResearchTypes: () => Promise<void>;
}

export const useResearchStore = create<ResearchState>((set) => ({
  researchTypes: [],
  isLoading: false,

  fetchResearchTypes: async () => {
    set({ isLoading: true });
    try {
      const types = await researchService.getResearchTypes();
      set({ researchTypes: types, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch research types', error);
      set({ isLoading: false });
    }
  },
}));
