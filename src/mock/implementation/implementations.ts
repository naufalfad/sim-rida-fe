export interface ImplementationRecord {
  researchId: string;
  status: 'READY' | 'ACTIVE' | 'COMPLETED';
  startedBy: string;
  startedDate: string;
  actualStartDate: string;
  plannedStartDate: string;
  plannedEndDate: string;
  completedBy: string;
  completedDate: string;
}

export const INITIAL_IMPLEMENTATIONS: Record<string, ImplementationRecord> = {
  'RES-2026-001': {
    researchId: 'RES-2026-001',
    status: 'READY',
    startedBy: '',
    startedDate: '',
    actualStartDate: '',
    plannedStartDate: '01 Sep 2026',
    plannedEndDate: '20 Oct 2026',
    completedBy: '',
    completedDate: '',
  },
};
