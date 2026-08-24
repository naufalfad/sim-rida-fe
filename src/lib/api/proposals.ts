import axiosInstance from '@/lib/axios';
import { Proposal, FollowUp, FollowUpLog } from '@/types/proposals';
import { VerificationChecklist, SubstantiveReview } from '@/types/brida';
import { WorkflowStatus } from '@/constants/status';

const mapProblemToProposal = (p: any): Proposal => {
  return {
    id: p.id,
    title: p.title,
    opdName: p.createdBy?.name || 'Dinas Kesehatan',
    status: p.status as WorkflowStatus,
    progress: p.progress || 0,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    problem: {
      judul: p.title,
      bidang: p.sector?.name || 'Kesehatan',
      opd: p.createdBy?.name || 'Dinas Kesehatan',
      latarBelakang: p.background || '',
      masalahUtama: p.mainFocus || '',
      dampak: p.impact || '',
      urgensi: p.urgency || '',
      targetPenyelesaian: p.targetCompletion || '',
      dokumenPendukung: p.attachments?.[0] || undefined,
    },
    research: p.research ? {
      judul: p.research.title,
      tujuan: p.research.objective,
      pertanyaanPenelitian: p.research.researchQuestions,
      ruangLingkup: p.research.scope,
      outputDiharapkan: p.research.expectedOutput,
      outcomeDiharapkan: p.research.expectedOutcome,
      indikator: p.research.successIndicators,
      estimasiWaktu: p.research.estimatedDurationMonths + ' Bulan',
      estimasiAnggaran: p.research.estimatedBudget,
    } : undefined,
    kak: p.research?.kak ? {
      identitas: p.research.title,
      latarBelakang: p.background || '',
      dasarPemikiran: p.research.kak.dasarPemikiran,
      maksudTujuan: p.research.kak.maksudTujuan,
      ruangLingkup: p.research.kak.ruangLingkup,
      metodologi: p.research.kak.metodologi,
      output: p.research.kak.output,
      outcome: p.research.kak.outcome,
      indikator: p.research.kak.indikatorKinerja,
      jadwal: p.research.kak.jadwalPelaksanaan,
      anggaran: p.research.estimatedBudget || p.research.kak.rabItems?.reduce((acc: number, item: any) => acc + item.total, 0) || 0,
      penutup: p.research.kak.penutup,
    } : undefined,
    timeline: p.timeline || [],
    eKatalogUrl: p.eKatalogUrl || undefined,
    eKatalogDesc: p.eKatalogDesc || undefined,
    eKatalogDeadline: p.eKatalogDeadline || undefined,
    eKatalogSentAt: p.eKatalogSentAt || undefined,
    opdMonitoringLogs: p.opdMonitoringLogs || [],
    opdReport: p.opdReports?.[0] || undefined,
    verificationChecklist: p.verificationChecklist || undefined,
    review: p.substantiveReview || undefined,
    policyBrief: p.policyBrief || undefined,
    recommendation: p.recommendation || undefined,
    followUp: p.followUp || undefined,
    approvalHistory: p.substantiveReview?.approvalHistory || [],
  };
};

export const proposalService = {
  getProposals: async (): Promise<Proposal[]> => {
    const res = await axiosInstance.get('/problems');
    return (res.data.data || []).map(mapProblemToProposal);
  },

  getProposalById: async (id: string): Promise<Proposal | null> => {
    try {
      const res = await axiosInstance.get(`/problems/${id}`);
      return mapProblemToProposal(res.data.data);
    } catch {
      return null;
    }
  },

  saveProposal: async (proposalData: Partial<Proposal> & { id?: string }): Promise<Proposal> => {
    return {} as Proposal;
  },

  submitProposal: async (id: string): Promise<Proposal | null> => {
    const prop = await proposalService.getProposalById(id);
    if (!prop) return null;
    
    const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const updatedTimeline = [...prop.timeline];
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

    const res = await axiosInstance.patch(`/problems/${id}/workflow`, {
      status: 'SUBMITTED',
      progress: 10,
      timeline: updatedTimeline,
    });
    return mapProblemToProposal(res.data.data);
  },

  verifyProposal: async (id: string, checklist: VerificationChecklist, isApproved: boolean, isReject: boolean = false): Promise<Proposal | null> => {
    const prop = await proposalService.getProposalById(id);
    if (!prop) return null;

    const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const updatedTimeline = [...prop.timeline];

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

    const res = await axiosInstance.patch(`/problems/${id}/workflow`, {
      status: nextStatus,
      progress: nextStatus === 'SUBSTANTIVE_REVIEW' ? 25 : prop.progress,
      verificationChecklist: checklist,
      timeline: updatedTimeline,
    });
    return mapProblemToProposal(res.data.data);
  },

  submitSubstantiveReview: async (id: string, review: SubstantiveReview): Promise<Proposal | null> => {
    const prop = await proposalService.getProposalById(id);
    if (!prop) return null;

    const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const updatedTimeline = [...prop.timeline];

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

    const res = await axiosInstance.patch(`/problems/${id}/workflow`, {
      status: 'SELECTION_RECOMMENDED',
      progress: 50,
      substantiveReview: review,
      timeline: updatedTimeline,
    });
    return mapProblemToProposal(res.data.data);
  },

  setSelectionStatus: async (id: string, recommendation: 'RECOMMENDED' | 'RESERVE' | 'REJECTED'): Promise<Proposal | null> => {
    const prop = await proposalService.getProposalById(id);
    if (!prop) return null;

    const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const updatedTimeline = [...prop.timeline];

    const selectionStep = updatedTimeline.find((t) => t.status === 'SELECTION_RECOMMENDED' || t.status === 'SCORING');
    if (selectionStep) selectionStep.isCompleted = true;

    updatedTimeline.push({
      status: 'SELECTION_RECOMMENDED',
      label: `Rekomendasi Seleksi BRIDA: ${recommendation}`,
      date: todayStr,
      actor: 'Admin BRIDA',
      isCompleted: false,
    });

    const review = prop.review ? {
      ...prop.review,
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
    };

    const res = await axiosInstance.patch(`/problems/${id}/workflow`, {
      status: 'SELECTION_RECOMMENDED',
      progress: 55,
      substantiveReview: review,
      timeline: updatedTimeline,
    });
    return mapProblemToProposal(res.data.data);
  },

  approveSelection: async (id: string, comment: string, action: 'APPROVE' | 'REJECT' | 'RETURN'): Promise<Proposal | null> => {
    const prop = await proposalService.getProposalById(id);
    if (!prop) return null;

    const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const updatedTimeline = [...prop.timeline];

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

    const res = await axiosInstance.patch(`/problems/${id}/workflow`, {
      status: nextStatus,
      progress: nextStatus === 'APPROVED' ? 60 : prop.progress,
      timeline: updatedTimeline,
      substantiveReview: prop.review ? {
        ...prop.review,
        approvalHistory: [...((prop.review as any).approvalHistory || []), historyEntry]
      } : { approvalHistory: [historyEntry] }
    });
    return mapProblemToProposal(res.data.data);
  },

  approveFinalReport: async (id: string, comment: string, action: 'APPROVE' | 'RETURN'): Promise<Proposal | null> => {
    const prop = await proposalService.getProposalById(id);
    if (!prop) return null;

    const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const updatedTimeline = [...prop.timeline];

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

    const res = await axiosInstance.patch(`/problems/${id}/workflow`, {
      status: nextStatus,
      progress: nextStatus === 'RECOMMENDATION_PENDING' ? 90 : 80,
      timeline: updatedTimeline,
    });
    return mapProblemToProposal(res.data.data);
  },

  approveRecommendation: async (id: string, comment: string, action: 'APPROVE' | 'RETURN'): Promise<Proposal | null> => {
    const prop = await proposalService.getProposalById(id);
    if (!prop) return null;

    const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const updatedTimeline = [...prop.timeline];

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

    const recommendationTitle = prop.recommendation?.recommendationTitle || prop.title;
    const responsibleOPD = prop.recommendation?.responsibleOPD || prop.opdName;
    const recText = prop.recommendation?.recommendation || `Berdasarkan hasil kajian "${prop.title}", direkomendasikan kepada ${prop.opdName} untuk menindaklanjuti rencana aksi pembangunan terintegrasi.`;

    const followUp = {
      id: `FT-${id}`,
      proposalId: id,
      title: recommendationTitle,
      opdName: responsibleOPD,
      recommendationText: recText,
      status: 'PENDING',
      progress: 0,
      logs: [],
    };

    const res = await axiosInstance.patch(`/problems/${id}/workflow`, {
      status: nextStatus,
      progress: action === 'APPROVE' ? 100 : prop.progress,
      timeline: updatedTimeline,
      recommendation: prop.recommendation ? {
        ...prop.recommendation,
        status: action === 'APPROVE' ? 'APPROVED' : 'RETURNED',
        approvedAt: action === 'APPROVE' ? new Date().toISOString() : undefined,
      } : undefined,
      followUp,
    });
    return mapProblemToProposal(res.data.data);
  },

  getFollowUps: async (): Promise<FollowUp[]> => {
    const props = await proposalService.getProposals();
    return props
      .filter((p) => ['RECOMMENDATION_APPROVED', 'FOLLOW_UP_PENDING', 'FOLLOW_UP_IN_PROGRESS', 'FOLLOW_UP_COMPLETED'].includes(p.status) || p.followUp)
      .map((p) => ({
        id: p.followUp?.id || `FT-${p.id}`,
        proposalId: p.id,
        title: p.followUp?.title || p.recommendation?.recommendationTitle || p.title,
        opdName: p.followUp?.opdName || p.recommendation?.responsibleOPD || p.opdName,
        recommendationText: p.followUp?.recommendationText || p.recommendation?.recommendation || '',
        status: p.followUp?.status || 'PENDING',
        progress: p.followUp?.progress || 0,
        actionPlan: p.followUp?.actionPlan || '',
        targetDate: p.followUp?.targetDate || '',
        pic: p.followUp?.pic || '',
        logs: p.followUp?.logs || [],
      }));
  },

  getFollowUpById: async (id: string): Promise<FollowUp | null> => {
    const list = await proposalService.getFollowUps();
    return list.find((f) => f.id === id || f.proposalId === id) || null;
  },

  acceptFollowUp: async (followUpId: string, pic: string): Promise<FollowUp | null> => {
    const cleanId = followUpId.replace('FT-', '');
    const prop = await proposalService.getProposalById(cleanId);
    if (!prop) return null;

    const logId = `log-${Math.random().toString(36).substring(2, 9)}`;
    const newLog: FollowUpLog = {
      id: logId,
      date: new Date().toLocaleDateString('en-CA'),
      description: `Rekomendasi diterima oleh OPD pelaksana. PIC ditugaskan: ${pic}.`,
      progress: 0,
    };

    const followUp = {
      ...(prop.followUp || {}),
      status: 'ACCEPTED',
      pic,
      logs: [...(prop.followUp?.logs || []), newLog],
    };

    const res = await axiosInstance.patch(`/problems/${cleanId}/workflow`, {
      followUp,
    });
    const updatedProp = mapProblemToProposal(res.data.data);
    return {
      id: updatedProp.followUp?.id || `FT-${cleanId}`,
      proposalId: cleanId,
      title: updatedProp.followUp?.title || '',
      opdName: updatedProp.followUp?.opdName || '',
      recommendationText: updatedProp.followUp?.recommendationText || '',
      status: updatedProp.followUp?.status || 'PENDING',
      progress: updatedProp.followUp?.progress || 0,
      logs: updatedProp.followUp?.logs || [],
    };
  },

  submitFollowUpActionPlan: async (followUpId: string, actionPlan: string, targetDate: string, pic: string): Promise<FollowUp | null> => {
    const cleanId = followUpId.replace('FT-', '');
    const prop = await proposalService.getProposalById(cleanId);
    if (!prop) return null;

    const logId = `log-${Math.random().toString(36).substring(2, 9)}`;
    const newLog: FollowUpLog = {
      id: logId,
      date: new Date().toLocaleDateString('en-CA'),
      description: `Rencana Aksi disahkan: "${actionPlan}". Target penyelesaian: ${targetDate}.`,
      progress: 10,
    };

    const followUp = {
      ...(prop.followUp || {}),
      status: 'IN_PROGRESS',
      actionPlan,
      targetDate,
      pic: pic || prop.followUp?.pic,
      progress: 10,
      logs: [...(prop.followUp?.logs || []), newLog],
    };

    const updatedTimeline = [...prop.timeline];
    updatedTimeline.push({
      status: 'FOLLOW_UP_IN_PROGRESS',
      label: 'Tindak Lanjut OPD Mulai Berjalan',
      date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      actor: prop.opdName,
      isCompleted: false,
    });

    const res = await axiosInstance.patch(`/problems/${cleanId}/workflow`, {
      status: 'FOLLOW_UP_IN_PROGRESS',
      followUp,
      timeline: updatedTimeline,
    });
    
    const updatedProp = mapProblemToProposal(res.data.data);
    return {
      id: updatedProp.followUp?.id || `FT-${cleanId}`,
      proposalId: cleanId,
      title: updatedProp.followUp?.title || '',
      opdName: updatedProp.followUp?.opdName || '',
      recommendationText: updatedProp.followUp?.recommendationText || '',
      status: updatedProp.followUp?.status || 'PENDING',
      progress: updatedProp.followUp?.progress || 0,
      logs: updatedProp.followUp?.logs || [],
    };
  },

  addFollowUpLog: async (followUpId: string, description: string, progress: number, evidenceFile?: string): Promise<FollowUp | null> => {
    const cleanId = followUpId.replace('FT-', '');
    const prop = await proposalService.getProposalById(cleanId);
    if (!prop) return null;

    const logId = `log-${Math.random().toString(36).substring(2, 9)}`;
    const newLog: FollowUpLog = {
      id: logId,
      date: new Date().toLocaleDateString('en-CA'),
      description,
      progress,
      evidenceFile,
    };

    const isCompleted = progress >= 100;
    const followUp = {
      ...(prop.followUp || {}),
      progress,
      status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      logs: [...(prop.followUp?.logs || []), newLog],
      evidenceFile: evidenceFile || prop.followUp?.evidenceFile,
    };

    const res = await axiosInstance.patch(`/problems/${cleanId}/workflow`, {
      status: isCompleted ? 'FOLLOW_UP_COMPLETED' : 'FOLLOW_UP_IN_PROGRESS',
      followUp,
    });

    const updatedProp = mapProblemToProposal(res.data.data);
    return {
      id: updatedProp.followUp?.id || `FT-${cleanId}`,
      proposalId: cleanId,
      title: updatedProp.followUp?.title || '',
      opdName: updatedProp.followUp?.opdName || '',
      recommendationText: updatedProp.followUp?.recommendationText || '',
      status: updatedProp.followUp?.status || 'PENDING',
      progress: updatedProp.followUp?.progress || 0,
      logs: updatedProp.followUp?.logs || [],
    };
  },

  resetDemoData: (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  },

  sendEKatalogLink: async (
    proposalId: string,
    eKatalogUrl: string,
    eKatalogDesc: string,
    eKatalogDeadline: string
  ): Promise<Proposal | null> => {
    const prop = await proposalService.getProposalById(proposalId);
    if (!prop) return null;

    const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const updatedTimeline = [...prop.timeline];

    updatedTimeline.push({
      status: 'EKATALOG_SENT',
      label: `E-Katalog Dikirimkan ke ${prop.opdName}`,
      date: todayStr,
      actor: 'Admin BRIDA',
      isCompleted: true,
    });

    const res = await axiosInstance.patch(`/problems/${proposalId}/workflow`, {
      status: 'EKATALOG_SENT',
      progress: 55,
      eKatalogUrl,
      eKatalogDesc,
      eKatalogDeadline,
      eKatalogSentAt: new Date().toISOString(),
      timeline: updatedTimeline,
    });
    return mapProblemToProposal(res.data.data);
  },

  submitOpdMonitoringLog: async (
    proposalId: string,
    log: { description: string; progress: number; evidenceFile?: string }
  ): Promise<Proposal | null> => {
    await axiosInstance.post(`/problems/${proposalId}/monitoring-logs`, log);
    return proposalService.getProposalById(proposalId);
  },

  submitOpdFinalReport: async (
    proposalId: string,
    reportData: Omit<import('@/types/proposals').OpdReport, 'submittedAt'>
  ): Promise<Proposal | null> => {
    await axiosInstance.post(`/problems/${proposalId}/reports`, reportData);
    return proposalService.getProposalById(proposalId);
  },

  submitLaporanReview: async (id: string, notes: string, status: 'APPROVED' | 'REVISION_REQUIRED'): Promise<Proposal | null> => {
    const prop = await proposalService.getProposalById(id);
    if (!prop) return null;

    const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const updatedTimeline = [...prop.timeline];

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

    const res = await axiosInstance.patch(`/problems/${id}/workflow`, {
      status: nextStatus,
      progress: status === 'APPROVED' ? 90 : 80,
      timeline: updatedTimeline,
    });
    return mapProblemToProposal(res.data.data);
  },

  addProjectIssue: async (proposalId: string, description: string, severity: 'LOW' | 'MEDIUM' | 'HIGH'): Promise<Proposal | null> => {
    const prop = await proposalService.getProposalById(proposalId);
    if (!prop) return null;

    const newIssue = {
      id: `iss-${Math.random().toString(36).substring(2, 9)}`,
      description,
      severity,
      status: 'OPEN' as const,
      dateReported: new Date().toLocaleDateString('en-CA'),
    };

    const res = await axiosInstance.patch(`/problems/${proposalId}/workflow`, {
      issues: [...(prop.issues || []), newIssue],
    });
    return mapProblemToProposal(res.data.data);
  },

  resolveProjectIssue: async (proposalId: string, issueId: string): Promise<Proposal | null> => {
    const prop = await proposalService.getProposalById(proposalId);
    if (!prop) return null;

    const updatedIssues = (prop.issues || []).map((iss) => {
      if (iss.id === issueId) {
        return { ...iss, status: 'RESOLVED' as const };
      }
      return iss;
    });

    const res = await axiosInstance.patch(`/problems/${proposalId}/workflow`, {
      issues: updatedIssues,
    });
    return mapProblemToProposal(res.data.data);
  },

  addProjectRisk: async (proposalId: string, description: string, mitigation: string, riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'): Promise<Proposal | null> => {
    const prop = await proposalService.getProposalById(proposalId);
    if (!prop) return null;

    const newRisk = {
      id: `rsk-${Math.random().toString(36).substring(2, 9)}`,
      description,
      mitigation,
      riskLevel,
    };

    const res = await axiosInstance.patch(`/problems/${proposalId}/workflow`, {
      risks: [...(prop.risks || []), newRisk],
    });
    return mapProblemToProposal(res.data.data);
  },

  savePolicyBrief: async (proposalId: string, briefData: Omit<import('@/types/proposals').PolicyBrief, 'updatedAt'>): Promise<Proposal | null> => {
    const prop = await proposalService.getProposalById(proposalId);
    if (!prop) return null;

    const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const updatedTimeline = [...prop.timeline];

    let nextStatus: WorkflowStatus = prop.status;
    if (briefData.status === 'APPROVED') {
      nextStatus = 'RECOMMENDATION_PENDING';
      
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

    const policyBrief = {
      ...briefData,
      updatedAt: new Date().toISOString(),
    };

    const res = await axiosInstance.patch(`/problems/${proposalId}/workflow`, {
      status: nextStatus,
      policyBrief,
      timeline: updatedTimeline,
    });
    return mapProblemToProposal(res.data.data);
  },

  saveRecommendation: async (proposalId: string, recData: Omit<import('@/types/proposals').ResearchRecommendation, 'status'>): Promise<Proposal | null> => {
    const prop = await proposalService.getProposalById(proposalId);
    if (!prop) return null;

    const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const updatedTimeline = [...prop.timeline];

    const recommendation = {
      ...recData,
      status: 'PENDING',
    };

    const pendingNode = updatedTimeline.find((t) => t.status === 'RECOMMENDATION_PENDING');
    if (pendingNode) {
      pendingNode.label = 'Rekomendasi Kebijakan Diajukan ke Bupati';
      pendingNode.actor = 'Admin BRIDA';
    }

    const res = await axiosInstance.patch(`/problems/${proposalId}/workflow`, {
      status: 'RECOMMENDATION_PENDING',
      recommendation,
      timeline: updatedTimeline,
    });
    return mapProblemToProposal(res.data.data);
  },
};

export const proposalApi = {
  getProposals: (): Proposal[] => {
    return [];
  },

  getProposalById: (id: string): Proposal | undefined => {
    return undefined;
  },

  sendEKatalogLink: async (
    proposalId: string,
    url: string,
    desc: string,
    deadline: string
  ): Promise<Proposal | null> => {
    return proposalService.sendEKatalogLink(proposalId, url, desc, deadline);
  },

  submitOpdMonitoringLog: async (
    proposalId: string,
    log: { description: string; progress: number; date?: string; evidenceFile?: string }
  ): Promise<Proposal | null> => {
    return proposalService.submitOpdMonitoringLog(proposalId, log);
  },

  submitOpdFinalReport: async (
    proposalId: string,
    reportData: Omit<import('@/types/proposals').OpdReport, 'submittedAt'>
  ): Promise<Proposal | null> => {
    return proposalService.submitOpdFinalReport(proposalId, reportData);
  },
};
