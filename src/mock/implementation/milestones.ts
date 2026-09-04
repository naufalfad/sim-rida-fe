export interface MilestoneActivity {
  date: string;
  user: string;
  action: string;
  notes: string;
}

export interface Milestone {
  id: string;
  researchId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  weight: number;
  progress: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  responsibleUnit: string;
  notes: string;
  activities: MilestoneActivity[];
}

export const INITIAL_MILESTONES: Record<string, Milestone[]> = {};
