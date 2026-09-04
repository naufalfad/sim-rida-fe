import { create } from 'zustand';
import { implementationService, ResearchImplementation } from '../services/implementation.service';

export interface ImplementationRecord {
  id?: string;
  code?: string;
  researchId: string;
  proposalCode?: string;
  proposalTitle?: string;
  opdName?: string;
  partnerName?: string;
  partnerMethod?: string;
  partnerValue?: number;
  status: 'READY' | 'ACTIVE' | 'COMPLETED';
  startedBy: string;
  startedDate: string;
  actualStartDate: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualEndDate?: string;
  completedBy: string;
  completedDate: string;
  overallProgress: number;
  durationDays?: number;
}

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

export interface EvidenceFile {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  uploadedBy: string;
  fileUrl?: string;
}

export interface MonitoringRecord {
  id: string;
  researchId: string;
  monitoringDate: string;
  overallProgress: number;
  currentActivity: string;
  achievement: string;
  issues: string;
  followUp: string;
  status: 'ON_TRACK' | 'MINOR_DELAY' | 'DELAYED' | 'AT_RISK';
  evidences: EvidenceFile[];
}

export interface ImplementationActivity {
  id: string;
  date: string;
  user: string;
  action: string;
  details: string;
}

export interface TimelineItem {
  id: string;
  implementationId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: string;
  order: number;
}

interface ImplementationState {
  implementations: Record<string, ImplementationRecord>;
  rawImplementations: ResearchImplementation[];
  milestones: Record<string, Milestone[]>;
  timelines: Record<string, TimelineItem[]>;
  monitoring: Record<string, MonitoringRecord[]>;
  activities: Record<string, ImplementationActivity[]>;
  documents: Record<string, EvidenceFile[]>;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  fetchImplementations: () => Promise<void>;
  getImplementation: (researchId: string) => ImplementationRecord;
  getMilestones: (researchId: string) => Milestone[];
  getTimelines: (researchId: string) => TimelineItem[];
  getMonitoring: (researchId: string) => MonitoringRecord[];
  getActivities: (researchId: string) => ImplementationActivity[];
  getDocuments: (researchId: string) => EvidenceFile[];
  getOverallProgress: (researchId: string) => number;
  getTimelineStatus: (researchId: string) => 'ON_TRACK' | 'MINOR_DELAY' | 'DELAYED' | 'AT_RISK';

  startImplementation: (researchId: string, actualStartDate: string, userName?: string) => Promise<void>;
  addMilestone: (researchId: string, milestone: Omit<Milestone, 'id' | 'activities'>) => Promise<void>;
  updateMilestone: (researchId: string, milestoneId: string, data: Partial<Milestone>, userName?: string) => Promise<void>;
  deleteMilestone: (researchId: string, milestoneId: string) => Promise<void>;
  
  createTimeline: (researchId: string, data: { name: string; description?: string; startDate: string; endDate: string; order?: number }) => Promise<void>;
  updateTimeline: (timelineId: string, data: Partial<TimelineItem>) => Promise<void>;
  deleteTimeline: (timelineId: string) => Promise<void>;

  addMonitoringRecord: (
    researchId: string,
    data: Omit<MonitoringRecord, 'id' | 'evidences' | 'overallProgress'>,
    evidences?: Omit<EvidenceFile, 'id' | 'uploadDate'>[]
  ) => Promise<void>;
  uploadDocument: (researchId: string, file: File, title: string, documentType?: string) => Promise<void>;
  markResearchAsCompleted: (researchId: string, userName?: string) => Promise<void>;
}

const calculateDurationDays = (startStr: string, endStr: string): number => {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 0;
};

const createDefaultImplementation = (researchId: string): ImplementationRecord => ({
  researchId,
  status: 'READY',
  startedBy: '',
  startedDate: '',
  actualStartDate: '',
  plannedStartDate: '2026-09-01',
  plannedEndDate: '2026-11-30',
  completedBy: '',
  completedDate: '',
  overallProgress: 0,
  durationDays: 90,
});

export const useImplementationStore = create<ImplementationState>((set, get) => ({
  implementations: {},
  rawImplementations: [],
  milestones: {},
  timelines: {},
  monitoring: {},
  activities: {},
  documents: {},
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchImplementations: async () => {
    set({ isLoading: true, error: null });
    try {
      const records = await implementationService.getAll({ limit: 100 });

      const implMap: Record<string, ImplementationRecord> = {};
      const milesMap: Record<string, Milestone[]> = {};
      const timelineMap: Record<string, TimelineItem[]> = {};
      const monMap: Record<string, MonitoringRecord[]> = {};
      const actMap: Record<string, ImplementationActivity[]> = {};
      const docMap: Record<string, EvidenceFile[]> = {};

      records.forEach((impl) => {
        let status: ImplementationRecord['status'] = 'READY';
        if (impl.status === 'ONGOING') status = 'ACTIVE';
        else if (impl.status === 'COMPLETED') status = 'COMPLETED';

        const startDateStr = impl.startDate ? new Date(impl.startDate).toISOString().split('T')[0] : '2026-09-01';
        const endDateStr = impl.endDate ? new Date(impl.endDate).toISOString().split('T')[0] : '2026-11-30';
        const durationDays = calculateDurationDays(startDateStr, endDateStr);

        const mappedRecord: ImplementationRecord = {
          id: impl.id,
          code: impl.code,
          researchId: impl.researchProposalId,
          proposalCode: impl.researchProposal?.code || '',
          proposalTitle: impl.researchProposal?.title || '',
          opdName: impl.researchProposal?.targetOpd || (impl.researchProposal?.relatedOpds?.[0]?.opd?.name) || 'BAPPEDA',
          partnerName: impl.partnerSelection?.partner?.name || impl.partnerSelection?.partner?.institutionName || (impl.partnerSelection?.method === 'SWAKELOLA' ? 'Tim Internal BRIDA' : 'Belum Ditentukan'),
          partnerMethod: impl.partnerSelection?.method || 'SWAKELOLA',
          partnerValue: impl.partnerSelection?.finalValue ? Number(impl.partnerSelection.finalValue) : 0,
          status,
          startedBy: impl.responsibleUser?.name || 'BRIDA Litbang',
          startedDate: impl.startDate ? new Date(impl.startDate).toLocaleDateString('id-ID') : '',
          actualStartDate: impl.actualStartDate ? new Date(impl.actualStartDate).toISOString().split('T')[0] : '',
          plannedStartDate: startDateStr,
          plannedEndDate: endDateStr,
          actualEndDate: impl.actualEndDate ? new Date(impl.actualEndDate).toISOString().split('T')[0] : '',
          completedBy: impl.status === 'COMPLETED' ? impl.responsibleUser?.name || 'BRIDA Litbang' : '',
          completedDate: impl.actualEndDate ? new Date(impl.actualEndDate).toLocaleDateString('id-ID') : '',
          overallProgress: impl.progress || 0,
          durationDays,
        };

        implMap[impl.id] = mappedRecord;
        if (impl.researchProposalId) implMap[impl.researchProposalId] = mappedRecord;
        if (impl.researchProposal?.code) implMap[impl.researchProposal.code] = mappedRecord;
        if (impl.code) implMap[impl.code] = mappedRecord;

        // Milestones
        const mappedMilestones: Milestone[] = (impl.milestones || []).map((m: any) => ({
          id: m.id,
          researchId: impl.researchProposalId,
          title: m.name,
          description: m.description || '',
          startDate: m.targetDate ? new Date(m.targetDate).toISOString().split('T')[0] : '',
          endDate: m.targetDate ? new Date(m.targetDate).toISOString().split('T')[0] : '',
          weight: m.weight ? Number(m.weight) : 20,
          progress: m.progress || 0,
          status: m.status === 'COMPLETED' ? 'COMPLETED' : m.status === 'DELAYED' ? 'DELAYED' : (m.progress > 0 ? 'IN_PROGRESS' : 'PENDING'),
          responsibleUnit: 'Tim Peneliti',
          notes: m.notes || '',
          activities: [],
        }));

        milesMap[impl.id] = mappedMilestones;
        if (impl.researchProposalId) milesMap[impl.researchProposalId] = mappedMilestones;
        if (impl.researchProposal?.code) milesMap[impl.researchProposal.code] = mappedMilestones;

        // Timelines
        const mappedTimelines: TimelineItem[] = (impl.timelines || []).map((t: any) => ({
          id: t.id,
          implementationId: impl.id,
          name: t.name,
          description: t.description || '',
          startDate: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : '',
          endDate: t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : '',
          status: t.status || 'PENDING',
          order: t.order || 0,
        }));
        timelineMap[impl.id] = mappedTimelines;
        if (impl.researchProposalId) timelineMap[impl.researchProposalId] = mappedTimelines;
        if (impl.researchProposal?.code) timelineMap[impl.researchProposal.code] = mappedTimelines;

        // Activities / Monitoring
        const mappedMonitoring: MonitoringRecord[] = (impl.activities || []).map((a: any) => ({
          id: a.id,
          researchId: impl.researchProposalId,
          monitoringDate: a.activityDate ? new Date(a.activityDate).toISOString().split('T')[0] : '2026-09-01',
          overallProgress: impl.progress || 0,
          currentActivity: a.title,
          achievement: a.description || 'Kegiatan lapangan terlaksana.',
          issues: a.notes || '',
          followUp: 'Lanjutkan tahapan berikutnya.',
          status: a.status === 'CANCELLED' ? 'AT_RISK' : 'ON_TRACK',
          evidences: [],
        }));

        monMap[impl.id] = mappedMonitoring;
        if (impl.researchProposalId) monMap[impl.researchProposalId] = mappedMonitoring;
        if (impl.researchProposal?.code) monMap[impl.researchProposal.code] = mappedMonitoring;

        // Documents
        const mappedDocuments: EvidenceFile[] = (impl.documents || []).map((d: any) => ({
          id: d.id,
          name: d.title || d.fileName || 'Dokumen Pelaksanaan',
          type: d.documentType || 'PDF',
          uploadDate: d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString('id-ID') : '',
          uploadedBy: 'BRIDA Litbang',
          fileUrl: d.fileUrl || d.filePath || '',
        }));
        docMap[impl.id] = mappedDocuments;
        if (impl.researchProposalId) docMap[impl.researchProposalId] = mappedDocuments;
        if (impl.researchProposal?.code) docMap[impl.researchProposal.code] = mappedDocuments;

        // Implementation Activity history
        actMap[impl.researchProposalId] = [
          {
            id: `iact-${impl.id}`,
            date: impl.createdAt ? new Date(impl.createdAt).toLocaleDateString('id-ID') : '2026',
            user: impl.responsibleUser?.name || 'BRIDA Litbang',
            action: 'Pelaksanaan Riset',
            details: `Pelaksanaan ${impl.code} berstatus ${impl.status} dengan progres ${impl.progress}%.`,
          },
        ];
      });

      set({
        implementations: implMap,
        rawImplementations: records,
        milestones: milesMap,
        timelines: timelineMap,
        monitoring: monMap,
        activities: actMap,
        documents: docMap,
        isLoading: false,
        isLoaded: true,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Gagal memuat data pelaksanaan riset',
      });
    }
  },

  getImplementation: (researchId: string) => {
    const impls = get().implementations;
    if (impls[researchId]) return impls[researchId];
    const found = Object.values(impls).find(
      (i) => i.id === researchId || i.researchId === researchId || i.proposalCode === researchId || i.code === researchId
    );
    return found || createDefaultImplementation(researchId);
  },

  getMilestones: (researchId: string) => {
    const mMap = get().milestones;
    if (mMap[researchId]) return mMap[researchId];
    const found = Object.entries(mMap).find(([k]) => k === researchId);
    if (found) return found[1];
    return [];
  },

  getTimelines: (researchId: string) => {
    const tMap = get().timelines;
    if (tMap[researchId]) return tMap[researchId];
    const found = Object.entries(tMap).find(([k]) => k === researchId);
    if (found) return found[1];
    return [];
  },

  getMonitoring: (researchId: string) => {
    const monMap = get().monitoring;
    if (monMap[researchId]) return monMap[researchId];
    const found = Object.entries(monMap).find(([k]) => k === researchId);
    if (found) return found[1];
    return [];
  },

  getActivities: (researchId: string) => {
    return get().activities[researchId] || [];
  },

  getDocuments: (researchId: string) => {
    return get().documents[researchId] || [];
  },

  getOverallProgress: (researchId: string) => {
    const impl = get().getImplementation(researchId);
    return impl?.overallProgress || 0;
  },

  getTimelineStatus: (researchId: string) => {
    const milestones = get().getMilestones(researchId);
    if (milestones.some((m) => m.status === 'DELAYED')) return 'DELAYED';
    const progress = get().getOverallProgress(researchId);
    if (progress >= 80) return 'ON_TRACK';
    if (progress >= 50) return 'MINOR_DELAY';
    return 'ON_TRACK';
  },

  startImplementation: async (researchId, actualStartDate, userName) => {
    try {
      const existing = get().implementations[researchId];
      const targetId = existing?.id || researchId;
      await implementationService.start(targetId, actualStartDate);
      await get().fetchImplementations();
    } catch (err) {
      console.error('Error starting implementation:', err);
      throw err;
    }
  },

  addMilestone: async (researchId, milestone) => {
    try {
      const existing = get().implementations[researchId];
      const targetId = existing?.id || researchId;
      await implementationService.createMilestone(targetId, {
        name: milestone.title,
        description: milestone.description,
        targetDate: milestone.endDate,
        weight: milestone.weight,
      });
      await get().fetchImplementations();
    } catch (err) {
      console.error('Error adding milestone:', err);
      throw err;
    }
  },

  updateMilestone: async (researchId, milestoneId, data, userName) => {
    try {
      if (data.progress !== undefined) {
        await implementationService.updateMilestoneProgress(milestoneId, data.progress);
        if (data.progress === 100) {
          try {
            await implementationService.completeMilestone(milestoneId);
          } catch (_) {}
        }
      }
      await get().fetchImplementations();
    } catch (err) {
      console.error('Error updating milestone:', err);
      throw err;
    }
  },

  deleteMilestone: async (researchId, milestoneId) => {
    set((state) => ({
      milestones: {
        ...state.milestones,
        [researchId]: (state.milestones[researchId] || []).filter((m) => m.id !== milestoneId),
      },
    }));
  },

  createTimeline: async (researchId, data) => {
    try {
      const existing = get().implementations[researchId];
      const targetId = existing?.id || researchId;
      await implementationService.createTimeline(targetId, data);
      await get().fetchImplementations();
    } catch (err) {
      console.error('Error creating timeline:', err);
      throw err;
    }
  },

  updateTimeline: async (timelineId, data) => {
    try {
      await implementationService.updateTimeline(timelineId, data);
      await get().fetchImplementations();
    } catch (err) {
      console.error('Error updating timeline:', err);
      throw err;
    }
  },

  deleteTimeline: async (timelineId) => {
    try {
      await implementationService.deleteTimeline(timelineId);
      await get().fetchImplementations();
    } catch (err) {
      console.error('Error deleting timeline:', err);
      throw err;
    }
  },

  addMonitoringRecord: async (researchId, data, evidences) => {
    try {
      const existing = get().implementations[researchId];
      const targetId = existing?.id || researchId;
      await implementationService.createActivity(targetId, {
        title: data.currentActivity,
        description: data.achievement,
        notes: data.issues ? `Kendala: ${data.issues}. Tindak lanjut: ${data.followUp}` : data.followUp,
        activityDate: data.monitoringDate,
      });
      await get().fetchImplementations();
    } catch (err) {
      console.error('Error adding monitoring record:', err);
      throw err;
    }
  },

  uploadDocument: async (researchId, file, title, documentType = 'OTHER') => {
    try {
      const existing = get().implementations[researchId];
      const targetId = existing?.id || researchId;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('documentType', documentType);
      await implementationService.uploadDocument(targetId, formData);
      await get().fetchImplementations();
    } catch (err) {
      console.error('Error uploading document:', err);
      throw err;
    }
  },

  markResearchAsCompleted: async (researchId, userName) => {
    try {
      const existing = get().implementations[researchId];
      const targetId = existing?.id || researchId;
      await implementationService.complete(targetId);
      await get().fetchImplementations();
    } catch (err) {
      console.error('Error completing implementation:', err);
      throw err;
    }
  },
}));

if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!useImplementationStore.getState().isLoaded) {
      useImplementationStore.getState().fetchImplementations();
    }
  }, 0);
}
