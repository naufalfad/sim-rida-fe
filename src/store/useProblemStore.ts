import { create } from 'zustand';
import { Problem, Sector, CreateProblemPayload } from '../types/problem.types';
import { problemService } from '../services/problem.service';

interface ProblemState {
  problems: Problem[];
  selectedProblem: Problem | null;
  sectors: Sector[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProblems: () => Promise<void>;
  fetchProblemById: (id: string) => Promise<Problem>;
  createProblem: (payload: CreateProblemPayload) => Promise<Problem>;
  fetchSectors: () => Promise<void>;
}

export const useProblemStore = create<ProblemState>((set) => ({
  problems: [],
  selectedProblem: null,
  sectors: [],
  isLoading: false,
  error: null,

  fetchProblems: async () => {
    set({ isLoading: true, error: null });
    try {
      const problems = await problemService.getProblems();
      set({ problems, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Gagal memuat daftar masalah' 
      });
    }
  },

  fetchProblemById: async (id: string) => {
    set({ isLoading: true, error: null, selectedProblem: null });
    try {
      const problem = await problemService.getProblemById(id);
      set({ selectedProblem: problem, isLoading: false });
      return problem;
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Gagal memuat detail masalah' 
      });
      throw error;
    }
  },

  createProblem: async (payload: CreateProblemPayload) => {
    set({ isLoading: true, error: null });
    try {
      const newProblem = await problemService.createProblem(payload);
      set((state) => ({ 
        problems: [newProblem, ...state.problems], 
        isLoading: false 
      }));
      return newProblem;
    } catch (error: any) {
      const errorMsg = error.response?.data?.errors?.[0]?.message 
        || error.response?.data?.message 
        || 'Gagal menyimpan usulan masalah';
      set({ isLoading: false, error: errorMsg });
      throw new Error(errorMsg);
    }
  },


  fetchSectors: async () => {
    try {
      const sectors = await problemService.getSectors();
      set({ sectors });
    } catch (error) {
      console.error('Failed to fetch sectors', error);
    }
  },
}));
