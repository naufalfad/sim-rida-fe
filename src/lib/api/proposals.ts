import { Proposal, FollowUp, FollowUpLog } from '@/types/proposals';
import { VerificationChecklist, SubstantiveReview, Researcher, ProjectIssue, ProjectRisk } from '@/types/brida';
import { INITIAL_PROPOSALS, INITIAL_FOLLOW_UPS } from '@/lib/mock/proposals';
import { INITIAL_RESEARCHERS } from '@/lib/mock/researchers';
import { WorkflowStatus } from '@/constants/status';

const PROPOSALS_KEY = 'sim_rida_proposals';
const FOLLOW_UPS_KEY = 'sim_rida_followups';
const RESEARCHERS_KEY = 'sim_rida_researchers';

const getStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    const parsed = JSON.parse(stored) as T;
    
    // Auto-migrate: If mock data list has new IDs that aren't in the cache, sync them
    if (key === PROPOSALS_KEY && Array.isArray(parsed) && Array.isArray(defaultValue)) {
      const parsedIds = new Set(parsed.map((p) => p.id));
      const hasMissingSeeds = defaultValue.some((p) => !parsedIds.has(p.id));
      if (hasMissingSeeds) {
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue as unknown as T;
      }
    }
    
    if (key === FOLLOW_UPS_KEY && Array.isArray(parsed) && Array.isArray(defaultValue)) {
      const parsedIds = new Set(parsed.map((f) => f.id));
      const hasMissingSeeds = defaultValue.some((f) => !parsedIds.has(f.id));
      if (hasMissingSeeds) {
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue as unknown as T;
      }
    }

    return parsed;
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
    await new Promise((resolve) => setTimeout(resolve, 150));
    return getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
  },

  getProposalById: async (id: string): Promise<Proposal | null> => {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    return list.find((p) => p.id === id) || null;
  },

  saveProposal: async (proposalData: Partial<Proposal> & { id?: string }): Promise<Proposal> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const dateStr = new Date().toISOString();

    if (proposalData.id) {
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
    await new Promise((resolve) => setTimeout(resolve, 300));
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const idx = list.findIndex((p) => p.id === id);

    if (idx !== -1) {
      const existing = list[idx];
      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const updatedTimeline = [...existing.timeline];
      
      const draftStep = updatedTimeline.find((t) => t.status === 'DRAFT');
      if (draftStep) draftStep.isCompleted = true;

      updatedTimeline.push({
        status: 'SUBMITTED',
        label: 'Usulan KAK Diserahkan',
        date: todayStr,
        actor: 'OPD Pengusul',
        isCompleted: true,
      });

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

  // BRIDA: Verify Proposal Document Checklist
  verifyProposal: async (id: string, checklist: VerificationChecklist, isApproved: boolean, isReject: boolean = false): Promise<Proposal | null> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const idx = list.findIndex((p) => p.id === id);

    if (idx !== -1) {
      const existing = list[idx];
      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const updatedTimeline = [...existing.timeline];

      const activeStep = updatedTimeline.find((t) => t.status === 'ADMINISTRATIVE_REVIEW' || t.status === 'SUBMITTED');
      if (activeStep) activeStep.isCompleted = true;

      let nextStatus: WorkflowStatus = 'SUBSTANTIVE_REVIEW';
      let nextLabel = 'Verifikasi Administrasi Diterima';

      if (isReject) {
        nextStatus = 'REJECTED';
        nextLabel = 'Usulan Ditolak BRIDA';
      } else if (!isApproved) {
        nextStatus = 'REVISION_REQUIRED';
        nextLabel = 'Kembalikan Revisi ke OPD';
      }

      updatedTimeline.push({
        status: nextStatus,
        label: nextLabel,
        date: todayStr,
        actor: 'Admin BRIDA',
        notes: checklist.notes,
        isCompleted: true,
      });

      if (nextStatus === 'SUBSTANTIVE_REVIEW') {
        updatedTimeline.push({
          status: 'SUBSTANTIVE_REVIEW',
          label: 'Review Substansi & Scoring',
          date: todayStr,
          actor: 'Reviewer Ahli',
          isCompleted: false,
        });
      }

      const updated: Proposal = {
        ...existing,
        status: nextStatus,
        progress: nextStatus === 'SUBSTANTIVE_REVIEW' ? 25 : existing.progress,
        verificationChecklist: checklist,
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString(),
      };

      list[idx] = updated;
      setStorageItem(PROPOSALS_KEY, list);
      return updated;
    }
    return null;
  },

  // BRIDA: Substantive review scoring
  submitSubstantiveReview: async (id: string, review: SubstantiveReview): Promise<Proposal | null> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const idx = list.findIndex((p) => p.id === id);

    if (idx !== -1) {
      const existing = list[idx];
      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const updatedTimeline = [...existing.timeline];

      const reviewStep = updatedTimeline.find((t) => t.status === 'SUBSTANTIVE_REVIEW');
      if (reviewStep) reviewStep.isCompleted = true;

      updatedTimeline.push({
        status: 'SCORING',
        label: `Skor Substansi Disubmit: ${review.totalScore}`,
        date: todayStr,
        actor: 'Reviewer Ahli',
        notes: review.reviewerNotes,
        isCompleted: true,
      });

      updatedTimeline.push({
        status: 'SELECTION_RECOMMENDED',
        label: 'Menunggu Seleksi Kepala Daerah',
        date: todayStr,
        actor: 'BRIDA',
        isCompleted: false,
      });

      const updated: Proposal = {
        ...existing,
        status: 'SELECTION_RECOMMENDED',
        progress: 50,
        review,
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString(),
      };

      list[idx] = updated;
      setStorageItem(PROPOSALS_KEY, list);
      return updated;
    }
    return null;
  },

  // BRIDA: Select priority status (Moves to SELECTION_RECOMMENDED wait-state for Kepala BRIDA)
  setSelectionStatus: async (id: string, recommendation: 'RECOMMENDED' | 'RESERVE' | 'REJECTED'): Promise<Proposal | null> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const idx = list.findIndex((p) => p.id === id);

    if (idx !== -1) {
      const existing = list[idx];
      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const updatedTimeline = [...existing.timeline];

      const selectionStep = updatedTimeline.find((t) => t.status === 'SELECTION_RECOMMENDED' || t.status === 'SCORING');
      if (selectionStep) selectionStep.isCompleted = true;

      updatedTimeline.push({
        status: 'SELECTION_RECOMMENDED',
        label: `Rekomendasi Seleksi BRIDA: ${recommendation}`,
        date: todayStr,
        actor: 'Admin BRIDA',
        isCompleted: false,
      });

      const updated: Proposal = {
        ...existing,
        status: 'SELECTION_RECOMMENDED',
        progress: 55,
        review: existing.review ? {
          ...existing.review,
          recommendation,
        } : {
          relevansi: 75,
          urgensi: 75,
          novelty: 75,
          feasibility: 75,
          impact: 75,
          alignment: 75,
          totalScore: 75,
          recommendation,
          reviewerNotes: 'Direkomendasikan oleh panitia BRIDA.',
        },
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString(),
      };

      list[idx] = updated;
      setStorageItem(PROPOSALS_KEY, list);
      return updated;
    }
    return null;
  },

  // Researchers list
  getResearchers: async (): Promise<Researcher[]> => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return getStorageItem<Researcher[]>(RESEARCHERS_KEY, INITIAL_RESEARCHERS);
  },

  getResearcherById: async (id: string): Promise<Researcher | null> => {
    const list = getStorageItem<Researcher[]>(RESEARCHERS_KEY, INITIAL_RESEARCHERS);
    return list.find((r) => r.id === id) || null;
  },

  // BRIDA: Assign Researcher to Approved Proposal (Moves to RESEARCHER_APPROVAL wait-state for Kepala BRIDA)
  assignResearcher: async (proposalId: string, researcherId: string): Promise<Proposal | null> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const proposals = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const researchers = getStorageItem<Researcher[]>(RESEARCHERS_KEY, INITIAL_RESEARCHERS);

    const propIdx = proposals.findIndex((p) => p.id === proposalId);
    const resIdx = researchers.findIndex((r) => r.id === researcherId);

    if (propIdx !== -1 && resIdx !== -1) {
      const proposal = proposals[propIdx];
      const researcher = researchers[resIdx];
      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

      const updatedTimeline = [...proposal.timeline];
      const assignStep = updatedTimeline.find((t) => t.status === 'APPROVED');
      if (assignStep) assignStep.isCompleted = true;

      updatedTimeline.push({
        status: 'EKATALOG_SENT',
        label: `E-Katalog Siap Dikirim ke ${proposal.opdName}`,
        date: todayStr,
        actor: 'Admin BRIDA',
        isCompleted: false,
      });

      const updatedProposal: Proposal = {
        ...proposal,
        status: 'APPROVED',
        progress: 55,
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString(),
      };

      proposals[propIdx] = updatedProposal;
      setStorageItem(PROPOSALS_KEY, proposals);
      return updatedProposal;
    }
    return null;
  },

  // KEPALA BRIDA: Selection Prioritas Decision Approval
  approveSelection: async (id: string, comment: string, action: 'APPROVE' | 'REJECT' | 'RETURN'): Promise<Proposal | null> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const idx = list.findIndex((p) => p.id === id);

    if (idx !== -1) {
      const existing = list[idx];
      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const updatedTimeline = [...existing.timeline];

      const selectionStep = updatedTimeline.find((t) => t.status === 'SELECTION_RECOMMENDED');
      if (selectionStep) selectionStep.isCompleted = true;

      let nextStatus: WorkflowStatus = 'APPROVED';
      let nextLabel = 'Usulan Lolos Seleksi (Disetujui Kepala BRIDA)';

      if (action === 'REJECT') {
        nextStatus = 'REJECTED';
        nextLabel = 'Usulan Ditolak';
      } else if (action === 'RETURN') {
        nextStatus = 'REVISION_REQUIRED';
        nextLabel = 'Usulan Dikembalikan untuk Revisi';
      }

      updatedTimeline.push({
        status: nextStatus,
        label: nextLabel,
        date: todayStr,
        actor: 'Kepala BRIDA',
        notes: comment,
        isCompleted: true,
      });

      if (nextStatus === 'APPROVED') {
        updatedTimeline.push({
          status: 'EKATALOG_SENT',
          label: 'Menunggu Pengiriman E-Katalog ke OPD',
          date: todayStr,
          actor: 'Admin BRIDA',
          isCompleted: false,
        });
      }

      const historyEntry = {
        actor: 'Kepala BRIDA',
        date: todayStr,
        action,
        comment,
      };

      const updated: Proposal = {
        ...existing,
        status: nextStatus,
        progress: nextStatus === 'APPROVED' ? 60 : existing.progress,
        timeline: updatedTimeline,
        approvalHistory: [...(existing.approvalHistory || []), historyEntry],
        updatedAt: new Date().toISOString(),
      };

      list[idx] = updated;
      setStorageItem(PROPOSALS_KEY, list);
      return updated;
    }
    return null;
  },

  // KEPALA BRIDA: Researcher Penunjukan Approval — DEPRECATED (kept as stub)
  // Role Peneliti dihapus, fungsi ini tidak digunakan lagi
  approveResearcher: async (_id: string, _comment: string, _action: 'APPROVE' | 'RETURN'): Promise<Proposal | null> => {
    return null;
  },

  // KEPALA BRIDA: Final Report Approval
  approveFinalReport: async (id: string, comment: string, action: 'APPROVE' | 'RETURN'): Promise<Proposal | null> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const idx = list.findIndex((p) => p.id === id);

    if (idx !== -1) {
      const existing = list[idx];
      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const updatedTimeline = [...existing.timeline];

      const reportStep = updatedTimeline.find((t) => t.status === 'OPD_REPORTED');
      if (reportStep) reportStep.isCompleted = true;

      let nextStatus: WorkflowStatus = 'RECOMMENDATION_PENDING';
      let nextLabel = 'Laporan Akhir Disetujui (Menunggu Rekomendasi)';

      if (action === 'RETURN') {
        nextStatus = 'OPD_IMPLEMENTING';
        nextLabel = 'Revisi Laporan Akhir Diminta';
      }

      updatedTimeline.push({
        status: nextStatus,
        label: nextLabel,
        date: todayStr,
        actor: 'Kepala BRIDA',
        notes: comment,
        isCompleted: true,
      });

      if (nextStatus === 'RECOMMENDATION_PENDING') {
        updatedTimeline.push({
          status: 'RECOMMENDATION_PENDING',
          label: 'Penyusunan Surat Rekomendasi Bupati',
          date: todayStr,
          actor: 'BRIDA',
          isCompleted: false,
        });
      }

      const historyEntry = {
        actor: 'Kepala BRIDA',
        date: todayStr,
        action: action === 'APPROVE' ? ('APPROVE' as const) : ('RETURN' as const),
        comment,
      };

      const updated: Proposal = {
        ...existing,
        status: nextStatus,
        progress: nextStatus === 'RECOMMENDATION_PENDING' ? 90 : 80,
        timeline: updatedTimeline,
        approvalHistory: [...(existing.approvalHistory || []), historyEntry],
        updatedAt: new Date().toISOString(),
      };

      list[idx] = updated;
      setStorageItem(PROPOSALS_KEY, list);
      return updated;
    }
    return null;
  },

  // KEPALA BRIDA: Recommendation Bupati Approval
  approveRecommendation: async (id: string, comment: string, action: 'APPROVE' | 'RETURN'): Promise<Proposal | null> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const followUpsList = getStorageItem<FollowUp[]>(FOLLOW_UPS_KEY, INITIAL_FOLLOW_UPS);
    const idx = list.findIndex((p) => p.id === id);

    if (idx !== -1) {
      const existing = list[idx];
      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const updatedTimeline = [...existing.timeline];

      const recoStep = updatedTimeline.find((t) => t.status === 'RECOMMENDATION_PENDING');
      if (recoStep) recoStep.isCompleted = true;

      let nextStatus: WorkflowStatus = 'RECOMMENDATION_APPROVED';
      let nextLabel = 'Rekomendasi Bupati Disahkan & Ditandatangani';

      if (action === 'RETURN') {
        nextStatus = 'RECOMMENDATION_PENDING';
        nextLabel = 'Draf Rekomendasi Dikembalikan';
      }

      updatedTimeline.push({
        status: nextStatus,
        label: nextLabel,
        date: todayStr,
        actor: 'Bupati / Kepala BRIDA',
        notes: comment,
        isCompleted: true,
      });

      if (action === 'APPROVE') {
        const hasFollowup = followUpsList.some((f) => f.proposalId === id);
        if (!hasFollowup) {
          const recommendationTitle = existing.recommendation?.recommendationTitle || existing.title;
          const responsibleOPD = existing.recommendation?.responsibleOPD || existing.opdName;
          const recText = existing.recommendation?.recommendation || `Berdasarkan hasil kajian "${existing.title}", direkomendasikan kepada ${existing.opdName} untuk menindaklanjuti rencana aksi pembangunan terintegrasi.`;
          
          const newF: FollowUp = {
            id: `FT-2026-00${followUpsList.length + 1}`,
            proposalId: id,
            title: recommendationTitle,
            opdName: responsibleOPD,
            recommendationText: recText,
            status: 'PENDING',
            progress: 0,
            logs: [],
          };
          followUpsList.push(newF);
          setStorageItem(FOLLOW_UPS_KEY, followUpsList);
        }
      }

      const historyEntry = {
        actor: 'Kepala BRIDA',
        date: todayStr,
        action: action === 'APPROVE' ? ('APPROVE' as const) : ('RETURN' as const),
        comment,
      };

      const updated: Proposal = {
        ...existing,
        status: nextStatus,
        progress: action === 'APPROVE' ? 100 : existing.progress,
        timeline: updatedTimeline,
        approvalHistory: [...(existing.approvalHistory || []), historyEntry],
        recommendation: existing.recommendation ? {
          ...existing.recommendation,
          status: action === 'APPROVE' ? 'APPROVED' : 'RETURNED',
          approvedAt: action === 'APPROVE' ? new Date().toISOString() : undefined,
        } : undefined,
        updatedAt: new Date().toISOString(),
      };

      list[idx] = updated;
      setStorageItem(PROPOSALS_KEY, list);
      return updated;
    }
    return null;
  },

  // BRIDA: Issues/Risks Operations
  addProjectIssue: async (proposalId: string, description: string, severity: 'LOW' | 'MEDIUM' | 'HIGH'): Promise<Proposal | null> => {
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const idx = list.findIndex((p) => p.id === proposalId);

    if (idx !== -1) {
      const existing = list[idx];
      const newIssue: ProjectIssue = {
        id: `iss-${Math.random().toString(36).substring(2, 9)}`,
        description,
        severity,
        status: 'OPEN',
        dateReported: new Date().toLocaleDateString('en-CA'),
      };
      const updated: Proposal = {
        ...existing,
        issues: [...(existing.issues || []), newIssue],
        updatedAt: new Date().toISOString(),
      };
      list[idx] = updated;
      setStorageItem(PROPOSALS_KEY, list);
      return updated;
    }
    return null;
  },

  resolveProjectIssue: async (proposalId: string, issueId: string): Promise<Proposal | null> => {
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const idx = list.findIndex((p) => p.id === proposalId);

    if (idx !== -1) {
      const existing = list[idx];
      const updatedIssues = (existing.issues || []).map((iss) => {
        if (iss.id === issueId) {
          return { ...iss, status: 'RESOLVED' as const };
        }
        return iss;
      });
      const updated: Proposal = {
        ...existing,
        issues: updatedIssues,
        updatedAt: new Date().toISOString(),
      };
      list[idx] = updated;
      setStorageItem(PROPOSALS_KEY, list);
      return updated;
    }
    return null;
  },

  addProjectRisk: async (proposalId: string, description: string, mitigation: string, riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'): Promise<Proposal | null> => {
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const idx = list.findIndex((p) => p.id === proposalId);

    if (idx !== -1) {
      const existing = list[idx];
      const newRisk: ProjectRisk = {
        id: `rsk-${Math.random().toString(36).substring(2, 9)}`,
        description,
        mitigation,
        riskLevel,
      };
      const updated: Proposal = {
        ...existing,
        risks: [...(existing.risks || []), newRisk],
        updatedAt: new Date().toISOString(),
      };
      list[idx] = updated;
      setStorageItem(PROPOSALS_KEY, list);
      return updated;
    }
    return null;
  },

  // BRIDA: Review Final Report (Moves to RECOMMENDATION_PENDING wait-state for Kepala BRIDA)
  submitLaporanReview: async (id: string, notes: string, status: 'APPROVED' | 'REVISION_REQUIRED'): Promise<Proposal | null> => {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const idx = list.findIndex((p) => p.id === id);

    if (idx !== -1) {
      const existing = list[idx];
      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const updatedTimeline = [...existing.timeline];

      const reportStep = updatedTimeline.find((t) => t.status === 'OPD_REPORTED');
      if (reportStep) reportStep.isCompleted = true;

      let nextStatus: WorkflowStatus = 'RECOMMENDATION_PENDING';
      let nextLabel = 'Evaluasi Laporan BRIDA Selesai (Menunggu Rekomendasi Bupati)';

      if (status === 'REVISION_REQUIRED') {
        nextStatus = 'OPD_IMPLEMENTING';
        nextLabel = 'Revisi Laporan Diminta oleh BRIDA';
      }

      updatedTimeline.push({
        status: nextStatus,
        notes: notes,
        label: nextLabel,
        date: todayStr,
        actor: 'Admin BRIDA',
        isCompleted: false,
      });

      const updated: Proposal = {
        ...existing,
        status: nextStatus,
        progress: status === 'APPROVED' ? 90 : 80,
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString(),
      };

      list[idx] = updated;
      setStorageItem(PROPOSALS_KEY, list);
      return updated;
    }
    return null;
  },

  // Follow Ups API
  getFollowUps: async (): Promise<FollowUp[]> => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return getStorageItem<FollowUp[]>(FOLLOW_UPS_KEY, INITIAL_FOLLOW_UPS);
  },

  getFollowUpById: async (id: string): Promise<FollowUp | null> => {
    await new Promise((resolve) => setTimeout(resolve, 80));
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
    await new Promise((resolve) => setTimeout(resolve, 300));
    const list = getStorageItem<FollowUp[]>(FOLLOW_UPS_KEY, INITIAL_FOLLOW_UPS);
    const idx = list.findIndex((f) => f.id === id);

    if (idx !== -1) {
      const existing = list[idx];
      const logId = `log-${Math.random().toString(36).substring(2, 9)}`;
      const newLog: FollowUpLog = {
        id: logId,
        date: new Date().toLocaleDateString('en-CA'),
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
        evidenceFile: evidenceFile || existing.evidenceFile,
      };

      list[idx] = updated;
      setStorageItem(FOLLOW_UPS_KEY, list);
      return updated;
    }
    return null;
  },

  // updateMilestoneProgress — DEPRECATED (researcher role removed)
  updateMilestoneProgress: async (_proposalId: string, _milestoneId: string, _progress: number, _notes?: string, _evidenceFile?: string): Promise<Proposal | null> => {
    return null;
  },

  // uploadProjectDocument — DEPRECATED (researcher role removed)
  uploadProjectDocument: async (_proposalId: string, _type: string, _name: string, _fileName: string, _fileSize: string): Promise<Proposal | null> => {
    return null;
  },

  // submitFinalReport — DEPRECATED (researcher role removed; use submitOpdFinalReport instead)
  submitFinalReport: async (_proposalId: string, _reportData: Record<string, unknown>): Promise<Proposal | null> => {
    return null;
  },

  // Save or edit Policy Brief
  savePolicyBrief: async (proposalId: string, briefData: Omit<import('@/types/proposals').PolicyBrief, 'updatedAt'>): Promise<Proposal | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const idx = list.findIndex((p) => p.id === proposalId);

    if (idx !== -1) {
      const existing = list[idx];
      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const updatedTimeline = [...existing.timeline];

      let nextStatus: WorkflowStatus = existing.status;
      if (briefData.status === 'APPROVED') {
        nextStatus = 'RECOMMENDATION_PENDING'; // Ready for recommendation
        
        // Add timeline node
        const hasNode = updatedTimeline.some((t) => t.status === 'RECOMMENDATION_PENDING');
        if (!hasNode) {
          updatedTimeline.push({
            status: 'RECOMMENDATION_PENDING',
            label: 'Policy Brief Disahkan & Menunggu Rekomendasi',
            date: todayStr,
            actor: 'Admin BRIDA',
            isCompleted: false
          });
        }
      } else if (briefData.status === 'REVIEW') {
        nextStatus = 'POLICY_BRIEF_REVIEW';
      } else {
        nextStatus = 'POLICY_BRIEF_DRAFT';
      }

      const policyBrief: import('@/types/proposals').PolicyBrief = {
        ...briefData,
        updatedAt: new Date().toISOString(),
      };

      const updated: Proposal = {
        ...existing,
        status: nextStatus,
        policyBrief,
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString(),
      };

      list[idx] = updated;
      setStorageItem(PROPOSALS_KEY, list);
      return updated;
    }
    return null;
  },

  // Save Recommendation
  saveRecommendation: async (proposalId: string, recData: Omit<import('@/types/proposals').ResearchRecommendation, 'status'>): Promise<Proposal | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const idx = list.findIndex((p) => p.id === proposalId);

    if (idx !== -1) {
      const existing = list[idx];
      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const updatedTimeline = [...existing.timeline];

      const recommendation: import('@/types/proposals').ResearchRecommendation = {
        ...recData,
        status: 'PENDING',
      };

      const hasNode = updatedTimeline.some((t) => t.status === 'RECOMMENDATION_PENDING' && t.isCompleted);
      const pendingNode = updatedTimeline.find((t) => t.status === 'RECOMMENDATION_PENDING');
      if (pendingNode) {
        pendingNode.label = 'Rekomendasi Kebijakan Diajukan ke Bupati';
        pendingNode.actor = 'Admin BRIDA';
      }

      const updated: Proposal = {
        ...existing,
        status: 'RECOMMENDATION_PENDING',
        recommendation,
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString(),
      };

      list[idx] = updated;
      setStorageItem(PROPOSALS_KEY, list);
      return updated;
    }
    return null;
  },

  // OPD: Accept recommendation
  acceptFollowUp: async (followUpId: string, pic: string): Promise<FollowUp | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const list = getStorageItem<FollowUp[]>(FOLLOW_UPS_KEY, INITIAL_FOLLOW_UPS);
    const idx = list.findIndex((f) => f.id === followUpId);

    if (idx !== -1) {
      const existing = list[idx];
      const logId = `log-${Math.random().toString(36).substring(2, 9)}`;
      const newLog: FollowUpLog = {
        id: logId,
        date: new Date().toLocaleDateString('en-CA'),
        description: `Rekomendasi diterima oleh OPD pelaksana. PIC ditugaskan: ${pic}.`,
        progress: 0,
      };

      const updated: FollowUp = {
        ...existing,
        status: 'ACCEPTED',
        pic,
        logs: [...existing.logs, newLog],
      };

      list[idx] = updated;
      setStorageItem(FOLLOW_UPS_KEY, list);
      return updated;
    }
    return null;
  },

  // OPD: Submit Action Plan
  submitFollowUpActionPlan: async (followUpId: string, actionPlan: string, targetDate: string, pic: string): Promise<FollowUp | null> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const list = getStorageItem<FollowUp[]>(FOLLOW_UPS_KEY, INITIAL_FOLLOW_UPS);
    const idx = list.findIndex((f) => f.id === followUpId);

    if (idx !== -1) {
      const existing = list[idx];
      const logId = `log-${Math.random().toString(36).substring(2, 9)}`;
      const newLog: FollowUpLog = {
        id: logId,
        date: new Date().toLocaleDateString('en-CA'),
        description: `Rencana Aksi disahkan: "${actionPlan}". Target penyelesaian: ${targetDate}.`,
        progress: 10,
      };

      const updated: FollowUp = {
        ...existing,
        status: 'IN_PROGRESS',
        actionPlan,
        targetDate,
        pic: pic || existing.pic,
        progress: 10,
        logs: [...existing.logs, newLog],
      };

      list[idx] = updated;
      setStorageItem(FOLLOW_UPS_KEY, list);
      
      // Also update the proposal's timeline and status to FOLLOW_UP_IN_PROGRESS!
      const pList = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
      const pIdx = pList.findIndex((p) => p.id === existing.proposalId);
      if (pIdx !== -1) {
        const prop = pList[pIdx];
        const updatedTimeline = [...prop.timeline];
        updatedTimeline.push({
          status: 'FOLLOW_UP_IN_PROGRESS',
          label: 'Tindak Lanjut OPD Mulai Berjalan',
          date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
          actor: existing.opdName,
          isCompleted: false,
        });
        
        pList[pIdx] = {
          ...prop,
          status: 'FOLLOW_UP_IN_PROGRESS',
          timeline: updatedTimeline,
          updatedAt: new Date().toISOString(),
        };
        setStorageItem(PROPOSALS_KEY, pList);
      }

      return updated;
    }
    return null;
  },

  resetDemoData: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PROPOSALS_KEY);
      localStorage.removeItem(FOLLOW_UPS_KEY);
      window.location.reload();
    }
  },

  /** BRIDA mengirimkan link e-Katalog ke OPD setelah seleksi disetujui */
  sendEKatalogLink: async (
    proposalId: string,
    eKatalogUrl: string,
    eKatalogDesc: string,
    eKatalogDeadline: string
  ): Promise<Proposal | null> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const idx = list.findIndex((p) => p.id === proposalId);

    if (idx !== -1) {
      const existing = list[idx];
      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const updatedTimeline = [...existing.timeline];

      updatedTimeline.push({
        status: 'EKATALOG_SENT',
        label: `E-Katalog Dikirimkan ke ${existing.opdName}`,
        date: todayStr,
        actor: 'Admin BRIDA',
        isCompleted: true,
      });

      const updated: Proposal = {
        ...existing,
        status: 'EKATALOG_SENT',
        progress: 55,
        eKatalogUrl,
        eKatalogDesc,
        eKatalogDeadline,
        eKatalogSentAt: new Date().toISOString(),
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString(),
      };

      list[idx] = updated;
      setStorageItem(PROPOSALS_KEY, list);
      return updated;
    }
    return null;
  },

  /** OPD submit log monitoring berkala selama implementasi e-Katalog */
  submitOpdMonitoringLog: async (
    proposalId: string,
    log: { description: string; progress: number; evidenceFile?: string }
  ): Promise<Proposal | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const idx = list.findIndex((p) => p.id === proposalId);

    if (idx !== -1) {
      const existing = list[idx];
      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const updatedTimeline = [...existing.timeline];
      
      // Update OPD_IMPLEMENTING timeline node if not yet added
      const hasNode = updatedTimeline.some((t) => t.status === 'OPD_IMPLEMENTING');
      if (!hasNode) {
        updatedTimeline.push({
          status: 'OPD_IMPLEMENTING',
          label: `${existing.opdName} Mulai Implementasi`,
          date: todayStr,
          actor: existing.opdName,
          isCompleted: false,
        });
      }

      const newLog: import('@/types/proposals').OpdMonitoringLog = {
        id: `log-${Math.random().toString(36).substring(2, 9)}`,
        date: new Date().toLocaleDateString('en-CA'),
        progress: log.progress,
        description: log.description,
        evidenceFile: log.evidenceFile,
      };

      const updated: Proposal = {
        ...existing,
        status: 'OPD_IMPLEMENTING',
        progress: Math.max(existing.progress, Math.round(log.progress * 0.7)), // scale to overall progress
        opdMonitoringLogs: [...(existing.opdMonitoringLogs || []), newLog],
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString(),
      };

      list[idx] = updated;
      setStorageItem(PROPOSALS_KEY, list);
      return updated;
    }
    return null;
  },

  /** OPD submit laporan akhir implementasi → status menjadi OPD_REPORTED */
  submitOpdFinalReport: async (
    proposalId: string,
    reportData: Omit<import('@/types/proposals').OpdReport, 'submittedAt'>
  ): Promise<Proposal | null> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const idx = list.findIndex((p) => p.id === proposalId);

    if (idx !== -1) {
      const existing = list[idx];
      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const updatedTimeline = [...existing.timeline];

      // Mark OPD_IMPLEMENTING as done
      const implNode = updatedTimeline.find((t) => t.status === 'OPD_IMPLEMENTING');
      if (implNode) implNode.isCompleted = true;

      updatedTimeline.push({
        status: 'OPD_REPORTED',
        label: `Laporan Akhir OPD Diserahkan ke BRIDA`,
        date: todayStr,
        actor: existing.opdName,
        isCompleted: true,
      });

      const opdReport: import('@/types/proposals').OpdReport = {
        ...reportData,
        submittedAt: new Date().toISOString(),
      };

      const updated: Proposal = {
        ...existing,
        status: 'OPD_REPORTED',
        progress: 85,
        opdReport,
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString(),
      };

      list[idx] = updated;
      setStorageItem(PROPOSALS_KEY, list);
      return updated;
    }
    return null;
  },
};

/**
 * proposalApi — synchronous API for client components that read directly
 * from localStorage without async delays. Use for initial renders and quick reads.
 */
export const proposalApi = {
  getProposals: (): Proposal[] => {
    return getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
  },

  getProposalById: (id: string): Proposal | undefined => {
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    return list.find((p) => p.id === id);
  },

  sendEKatalogLink: async (
    proposalId: string,
    url: string,
    desc: string,
    deadline: string
  ): Promise<Proposal | null> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const idx = list.findIndex((p) => p.id === proposalId);
    if (idx !== -1) {
      const existing = list[idx];
      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const updatedTimeline = [...existing.timeline];

      // Mark APPROVED step as completed
      const approvedStep = updatedTimeline.find((t) => t.status === 'APPROVED');
      if (approvedStep) approvedStep.isCompleted = true;

      updatedTimeline.push({
        status: 'EKATALOG_SENT',
        label: `Link E-Katalog Dikirim ke ${existing.opdName}`,
        date: todayStr,
        actor: 'Admin BRIDA',
        isCompleted: true,
      });

      const updated: Proposal = {
        ...existing,
        status: 'EKATALOG_SENT',
        eKatalogUrl: url,
        eKatalogDesc: desc,
        eKatalogDeadline: deadline,
        progress: 60,
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString(),
      };

      list[idx] = updated;
      setStorageItem(PROPOSALS_KEY, list);
      return updated;
    }
    return null;
  },

  submitOpdMonitoringLog: async (
    proposalId: string,
    log: { description: string; progress: number; date?: string; evidenceFile?: string }
  ): Promise<Proposal | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const list = getStorageItem<Proposal[]>(PROPOSALS_KEY, INITIAL_PROPOSALS);
    const idx = list.findIndex((p) => p.id === proposalId);
    if (idx !== -1) {
      const existing = list[idx];
      const todayStr = log.date || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const newLog = {
        id: `log-${Math.random().toString(36).substring(2, 9)}`,
        description: log.description,
        progress: log.progress,
        date: todayStr,
        evidenceFile: log.evidenceFile,
      };
      const updated: Proposal = {
        ...existing,
        status: 'OPD_IMPLEMENTING',
        progress: Math.max(existing.progress, Math.round(log.progress * 0.7)),
        opdMonitoringLogs: [...(existing.opdMonitoringLogs || []), newLog],
        updatedAt: new Date().toISOString(),
      };
      list[idx] = updated;
      setStorageItem(PROPOSALS_KEY, list);
      return updated;
    }
    return null;
  },

  submitOpdFinalReport: async (
    proposalId: string,
    reportData: Omit<import('@/types/proposals').OpdReport, 'submittedAt'>
  ): Promise<Proposal | null> => {
    return proposalService.submitOpdFinalReport(proposalId, reportData);
  },
};
