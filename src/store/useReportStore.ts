import { create } from 'zustand';
import { reportService, ResearchReport as BackendReport } from '../services/report.service';
import { policyBriefService, PolicyBrief as BackendPolicyBrief } from '../services/policyBrief.service';

export interface ResearchReport {
  id?: string;
  researchId: string;
  title: string;
  executiveSummary: string;
  background: string;
  objective: string;
  methodology: string;
  scope: string;
  implementationSummary: string;
  results: string;
  discussion: string;
  conclusion: string;
  appendices: string;
  status: 'NOT_STARTED' | 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REVISION_REQUIRED';
  version: string;
  submittedBy: string;
  submittedDate: string;
  decisionNotes: string;
  decisionBy: string;
  decisionDate: string;
}

export interface Finding {
  id: string;
  researchId?: string;
  category?: string;
  title: string;
  description: string;
  evidence: string;
  impact?: string;
  notes?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PolicyBrief {
  id?: string;
  researchId: string;
  reportId?: string;
  title: string;
  executiveSummary: string;
  policyContext: string;
  keyProblem: string;
  keyFindings: string[];
  conclusion: string;
  policyImplication: string;
  status: 'NOT_STARTED' | 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REVISION_REQUIRED';
  version: string;
}

export interface ReportActivity {
  id: string;
  date: string;
  user: string;
  action: string;
  details: string;
}

interface ReportState {
  reports: Record<string, ResearchReport>;
  findings: Record<string, Finding[]>;
  policyBriefs: Record<string, PolicyBrief>;
  activities: Record<string, ReportActivity[]>;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  fetchReportsAndPolicyBriefs: () => Promise<void>;
  getReport: (researchId: string) => ResearchReport;
  getFindings: (researchId: string) => Finding[];
  getPolicyBrief: (researchId: string) => PolicyBrief;
  getActivities: (researchId: string) => ReportActivity[];

  saveReport: (researchId: string, data: Partial<ResearchReport>, userName: string) => Promise<void>;
  saveFinding: (researchId: string, finding: Finding) => void;
  deleteFinding: (researchId: string, findingId: string) => void;
  savePolicyBrief: (researchId: string, data: Partial<PolicyBrief>, userName: string) => Promise<void>;
  submitReportForReview: (researchId: string, userName: string) => Promise<void>;
  approveReport: (researchId: string, reviewNotes: string, userName: string) => Promise<void>;
  returnReportForRevision: (researchId: string, reviewNotes: string, userName: string) => Promise<void>;
}

const createDefaultReport = (researchId: string): ResearchReport => ({
  researchId,
  title: 'Laporan Hasil Riset Daerah',
  executiveSummary: '',
  background: '',
  objective: '',
  methodology: '',
  scope: '',
  implementationSummary: '',
  results: '',
  discussion: '',
  conclusion: '',
  appendices: '',
  status: 'NOT_STARTED',
  version: '1.0',
  submittedBy: '',
  submittedDate: '',
  decisionNotes: '',
  decisionBy: '',
  decisionDate: '',
});

const createDefaultPolicyBrief = (researchId: string): PolicyBrief => ({
  researchId,
  title: 'Policy Brief Hasil Riset Daerah',
  executiveSummary: '',
  policyContext: '',
  keyProblem: '',
  keyFindings: [],
  conclusion: '',
  policyImplication: '',
  status: 'NOT_STARTED',
  version: '1.0',
});

export const useReportStore = create<ReportState>((set, get) => ({
  reports: {},
  findings: {},
  policyBriefs: {},
  activities: {},
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchReportsAndPolicyBriefs: async () => {
    set({ isLoading: true, error: null });
    try {
      const [reportsList, policyBriefsList] = await Promise.all([
        reportService.getAll(),
        policyBriefService.getAll(),
      ]);

      const repMap: Record<string, ResearchReport> = {};
      const pbMap: Record<string, PolicyBrief> = {};
      const actMap: Record<string, ReportActivity[]> = {};

      reportsList.forEach((r) => {
        let status: ResearchReport['status'] = 'DRAFT';
        if (r.status === 'APPROVED') status = 'APPROVED';
        else if (r.status === 'SUBMITTED') status = 'UNDER_REVIEW';
        else if (r.status === 'REVISION_REQUIRED') status = 'REVISION_REQUIRED';

        const mappedReport: ResearchReport = {
          id: r.id,
          researchId: r.implementationId,
          title: r.title,
          executiveSummary: r.summary || '',
          background: '',
          objective: '',
          methodology: '',
          scope: '',
          implementationSummary: '',
          results: r.summary || '',
          discussion: '',
          conclusion: '',
          appendices: '',
          status,
          version: r.version || '1.0',
          submittedBy: 'BRIDA Litbang',
          submittedDate: r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('id-ID') : '',
          decisionNotes: r.reviews?.[0]?.notes || '',
          decisionBy: 'BRIDA Reviewer',
          decisionDate: r.approvedAt ? new Date(r.approvedAt).toLocaleDateString('id-ID') : '',
        };

        repMap[r.id] = mappedReport;
        if (r.implementationId) repMap[r.implementationId] = mappedReport;
        if (r.implementation?.researchProposalId) repMap[r.implementation.researchProposalId] = mappedReport;
        if (r.implementation?.researchProposal?.code) repMap[r.implementation.researchProposal.code] = mappedReport;

        actMap[r.implementationId] = [
          {
            id: `ract-${r.id}`,
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID') : '2026',
            user: 'BRIDA Litbang',
            action: 'Laporan Penelitian',
            details: `Laporan "${r.title}" berstatus ${r.status}.`,
          },
        ];
      });

      policyBriefsList.forEach((pb) => {
        let status: PolicyBrief['status'] = 'DRAFT';
        if (pb.status === 'APPROVED') status = 'APPROVED';
        else if (pb.status === 'SUBMITTED') status = 'UNDER_REVIEW';
        else if (pb.status === 'REVISION_REQUIRED') status = 'REVISION_REQUIRED';

        const researchId = pb.report?.implementationId || pb.reportId;
        const mappedPb: PolicyBrief = {
          id: pb.id,
          researchId,
          reportId: pb.reportId,
          title: pb.title,
          executiveSummary: pb.executiveSummary,
          policyContext: pb.problemStatement || '',
          keyProblem: pb.problemStatement || '',
          keyFindings: [pb.researchFindings || 'Temuan utama hasil riset.'],
          conclusion: pb.conclusion || '',
          policyImplication: pb.recommendedPolicy || '',
          status,
          version: pb.version || '1.0',
        };

        pbMap[pb.id] = mappedPb;
        if (pb.reportId) pbMap[pb.reportId] = mappedPb;
        if (researchId) pbMap[researchId] = mappedPb;
        if (pb.report?.implementation?.researchProposalId) {
          pbMap[pb.report.implementation.researchProposalId] = mappedPb;
        }
        if (pb.report?.implementation?.researchProposal?.code) {
          pbMap[pb.report.implementation.researchProposal.code] = mappedPb;
        }
      });

      set({
        reports: repMap,
        policyBriefs: pbMap,
        activities: actMap,
        isLoading: false,
        isLoaded: true,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Gagal memuat laporan dan policy brief',
      });
    }
  },

  getReport: (researchId: string) => {
    return get().reports[researchId] || createDefaultReport(researchId);
  },

  getFindings: (researchId: string) => {
    return get().findings[researchId] || [];
  },

  getPolicyBrief: (researchId: string) => {
    return get().policyBriefs[researchId] || createDefaultPolicyBrief(researchId);
  },

  getActivities: (researchId: string) => {
    return get().activities[researchId] || [];
  },

  saveReport: async (researchId, data, userName) => {
    try {
      const existing = get().reports[researchId];
      if (existing?.id) {
        await reportService.update(existing.id, {
          title: data.title,
          summary: data.executiveSummary || data.results,
        });
      } else {
        await reportService.create(researchId, {
          title: data.title || 'Laporan Akhir Penelitian',
          reportType: 'FINAL_REPORT',
          summary: data.executiveSummary || data.results || '',
        });
      }
      await get().fetchReportsAndPolicyBriefs();
    } catch (err) {
      console.error('Error saving report:', err);
    }
  },

  saveFinding: (researchId, finding) => {
    set((state) => ({
      findings: {
        ...state.findings,
        [researchId]: [...(state.findings[researchId] || []), finding],
      },
    }));
  },

  deleteFinding: (researchId, findingId) => {
    set((state) => ({
      findings: {
        ...state.findings,
        [researchId]: (state.findings[researchId] || []).filter((f) => f.id !== findingId),
      },
    }));
  },

  savePolicyBrief: async (researchId, data, userName) => {
    try {
      const existing = get().policyBriefs[researchId];
      const rep = get().reports[researchId];
      const reportId = existing?.reportId || rep?.id;

      if (existing?.id) {
        await policyBriefService.update(existing.id, {
          title: data.title,
          executiveSummary: data.executiveSummary,
          problemStatement: data.keyProblem,
          recommendedPolicy: data.policyImplication,
          conclusion: data.conclusion,
        });
      } else if (reportId) {
        await policyBriefService.create(reportId, {
          title: data.title || 'Policy Brief',
          executiveSummary: data.executiveSummary || '',
          problemStatement: data.keyProblem || '',
          researchFindings: data.keyFindings?.[0] || 'Hasil kajian komprehensif.',
          recommendedPolicy: data.policyImplication || '',
          conclusion: data.conclusion || '',
        });
      }
      await get().fetchReportsAndPolicyBriefs();
    } catch (err) {
      console.error('Error saving policy brief:', err);
    }
  },

  submitReportForReview: async (researchId, userName) => {
    try {
      const existing = get().reports[researchId];
      if (existing?.id) {
        await reportService.submit(existing.id);
      }
      await get().fetchReportsAndPolicyBriefs();
    } catch (err) {
      console.error('Error submitting report:', err);
    }
  },

  approveReport: async (researchId, reviewNotes, userName) => {
    try {
      const existing = get().reports[researchId];
      if (existing?.id) {
        await reportService.review(existing.id, 'APPROVE', reviewNotes);
      }
      await get().fetchReportsAndPolicyBriefs();
    } catch (err) {
      console.error('Error approving report:', err);
    }
  },

  returnReportForRevision: async (researchId, reviewNotes, userName) => {
    try {
      const existing = get().reports[researchId];
      if (existing?.id) {
        await reportService.review(existing.id, 'REVISION', reviewNotes);
      }
      await get().fetchReportsAndPolicyBriefs();
    } catch (err) {
      console.error('Error returning report for revision:', err);
    }
  },
}));

if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!useReportStore.getState().isLoaded) {
      useReportStore.getState().fetchReportsAndPolicyBriefs();
    }
  }, 0);
}

