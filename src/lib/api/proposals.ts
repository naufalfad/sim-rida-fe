import { Proposal, FollowUp, FollowUpLog } from '@/types/proposals';
import { INITIAL_PROPOSALS, INITIAL_FOLLOW_UPS } from '@/lib/mock/proposals';
import { WorkflowStatus } from '@/constants/status';

const PROPOSALS_KEY = 'sim_rida_proposals';
const FOLLOW_UPS_KEY = 'sim_rida_followups';

// Helper to check for window/localStorage (avoids Next SSR crashes)
const getStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

export const proposalService = {
  getProposals: async (): Promise<Proposal[]> => {
    // Simulate minor network delay
    await new Promise((resolve) => setTimeout(resolve, 200));
    return getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
  },

  getProposalById: async (id: string): Promise<Proposal | null> => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    return list.find((p) => p.id === id) || null;
  },

  saveProposal: async (proposalData: Partial<Proposal> & { id?: string }): Promise<Proposal> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const dateStr = new Date().toISOString();

    if (proposalData.id) {
      // Update existing proposal
      const idx = list.findIndex((p) => p.id === proposalData.id);
      if (idx !== -1) {
        const existing = list[idx];
        const updated: Proposal = {
          ...existing,
          ...proposalData,
          title: proposalData.problem?.judul || existing.title,
          updatedAt: dateStr,
        } as Proposal;
        list[idx] = updated;
        setStorageItem(PROPOSALS_KEY, list);
        return updated;
      }
    }

    // Create a new proposal
    const newId = `PRP-2026-00${list.length + 1}`;
    const newProposal: Proposal = {
      id: newId,
      title: proposalData.problem?.judul || 'Usulan Baru',
      opdName: proposalData.opdName || 'Bappeda Litbang Daerah',
      status: 'DRAFT',
      progress: 0,
      createdAt: dateStr,
      updatedAt: dateStr,
      problem: proposalData.problem || {
        judul: '',
        bidang: '',
        opd: '',
        latarBelakang: '',
        masalahUtama: '',
        dampak: '',
        urgensi: '',
        targetPenyelesaian: '',
      },
      research: proposalData.research,
      kak: proposalData.kak,
      timeline: [
        {
          status: 'DRAFT',
          label: 'Draf Usulan Masalah',
          date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
          actor: 'OPD Pengusul',
          isCompleted: true,
        },
      ],
    };

    list.unshift(newProposal);
    setStorageItem(PROPOSALS_KEY, list);
    return newProposal;
  },

  submitProposal: async (id: string): Promise<Proposal | null> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const idx = list.findIndex((p) => p.id === id);

    if (idx !== -1) {
      const existing = list[idx];
      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

      // Build timeline log updates
      const updatedTimeline = [...existing.timeline];
      
      // Mark Draft step completed if not already
      const draftStep = updatedTimeline.find((t) => t.status === 'DRAFT');
      if (draftStep) draftStep.isCompleted = true;

      // Add Submitted step
      updatedTimeline.push({
        status: 'SUBMITTED',
        label: 'Usulan KAK Diserahkan',
        date: todayStr,
        actor: 'OPD Pengusul',
        isCompleted: true,
      });

      // Add Admin Review step as pending/active
      updatedTimeline.push({
        status: 'ADMINISTRATIVE_REVIEW',
        label: 'Verifikasi Administrasi BRIDA',
        date: todayStr,
        actor: 'Admin BRIDA',
        isCompleted: false,
      });

      const updated: Proposal = {
        ...existing,
        status: 'SUBMITTED',
        progress: 10,
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString(),
      };

      list[idx] = updated;
      setStorageItem(PROPOSALS_KEY, list);
      return updated;
    }

    return null;
  },

  getFollowUps: async (): Promise<FollowUp[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return getStorageItem<FollowUp[]>(FOLLOW_UPS_KEY, INITIAL_FOLLOW_UPS);
  },

  getFollowUpById: async (id: string): Promise<FollowUp | null> => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const list = getStorageItem<FollowUp[]>(FOLLOW_UPS_KEY, INITIAL_FOLLOW_UPS);
    return list.find((f) => f.id === id) || null;
  },

  updateFollowUp: async (id: string, actionPlan: string, targetDate: string): Promise<FollowUp | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const list = getStorageItem<FollowUp[]>(FOLLOW_UPS_KEY, INITIAL_FOLLOW_UPS);
    const idx = list.findIndex((f) => f.id === id);

    if (idx !== -1) {
      const existing = list[idx];
      const updated: FollowUp = {
        ...existing,
        actionPlan,
        targetDate,
        status: 'IN_PROGRESS',
        progress: Math.max(existing.progress, 10),
      };
      list[idx] = updated;
      setStorageItem(FOLLOW_UPS_KEY, list);
      return updated;
    }
    return null;
  },

  addFollowUpLog: async (id: string, description: string, progress: number, evidenceFile?: string): Promise<FollowUp | null> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const list = getStorageItem<FollowUp[]>(FOLLOW_UPS_KEY, INITIAL_FOLLOW_UPS);
    const idx = list.findIndex((f) => f.id === id);

    if (idx !== -1) {
      const existing = list[idx];
      const logId = `log-${Math.random().toString(36).substring(2, 9)}`;
      const newLog: FollowUpLog = {
        id: logId,
        date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
        description,
        progress,
        evidenceFile,
      };

      const updatedLogs = [...existing.logs, newLog];
      const isCompleted = progress >= 100;

      const updated: FollowUp = {
        ...existing,
        progress,
        status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        logs: updatedLogs,
      };

      list[idx] = updated;
      setStorageItem(FOLLOW_UPS_KEY, list);
      return updated;
    }
    return null;
  },
};
