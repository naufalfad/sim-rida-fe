import { create } from 'zustand';
import axiosInstance from '@/lib/axios';

export type ProposalUrgency = 'TINGGI' | 'SEDANG' | 'RENDAH';
export type ExpectedOutput = 
  | 'Naskah Akademik Perda' 
  | 'Rekomendasi Teknis' 
  | 'Solusi Teknologi' 
  | 'Kajian Kebijakan / Policy Brief' 
  | 'Model / Blueprint'
  | 'Studi Kelayakan'
  | 'REKOMENDASI_KEBIJAKAN'
  | 'NASKAH_AKADEMIK'
  | 'PROTOTIPE_SISTEM'
  | 'DOKUMEN_MASTERPLAN'
  | 'STUDI_KELAYAKAN';

export type ProposalStatus = 
  | 'DRAFT' 
  | 'PENDING' 
  | 'RETURNED'
  | 'IN_REVIEW' 
  | 'SCORED'
  | 'APPROVED' 
  | 'REJECTED'
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'REVISION_REQUIRED';

export const mapFrontendExpectedOutputToBackend = (output: string): string => {
  const map: Record<string, string> = {
    'Naskah Akademik Perda': 'NASKAH_AKADEMIK',
    'Rekomendasi Teknis': 'REKOMENDASI_KEBIJAKAN',
    'Solusi Teknologi': 'PROTOTIPE_SISTEM',
    'Kajian Kebijakan / Policy Brief': 'REKOMENDASI_KEBIJAKAN',
    'Model / Blueprint': 'DOKUMEN_MASTERPLAN',
    'Studi Kelayakan': 'STUDI_KELAYAKAN',
  };
  return map[output] || output || 'REKOMENDASI_KEBIJAKAN';
};

export const mapFieldToBackend = (field: string): 'EKONOMI_PEMBANGUNAN' | 'TATA_KELOLA_PEMERINTAHAN' | 'SOSIAL_BUDAYA' | 'INOVASI_TEKNOLOGI' => {
  const map: Record<string, 'EKONOMI_PEMBANGUNAN' | 'TATA_KELOLA_PEMERINTAHAN' | 'SOSIAL_BUDAYA' | 'INOVASI_TEKNOLOGI'> = {
    'Ekonomi': 'EKONOMI_PEMBANGUNAN',
    'Ekonomi & Pembangunan': 'EKONOMI_PEMBANGUNAN',
    'EKONOMI_PEMBANGUNAN': 'EKONOMI_PEMBANGUNAN',
    'Pemerintahan & Tata Kelola': 'TATA_KELOLA_PEMERINTAHAN',
    'TATA_KELOLA_PEMERINTAHAN': 'TATA_KELOLA_PEMERINTAHAN',
    'Sosial Budaya & Kesejahteraan': 'SOSIAL_BUDAYA',
    'SOSIAL_BUDAYA': 'SOSIAL_BUDAYA',
    'Inovasi & Teknologi': 'INOVASI_TEKNOLOGI',
    'INOVASI_TEKNOLOGI': 'INOVASI_TEKNOLOGI',
  };
  return map[field] || 'SOSIAL_BUDAYA';
};

export const mapFieldToDisplay = (field: string): string => {
  const map: Record<string, string> = {
    'EKONOMI_PEMBANGUNAN': 'Ekonomi',
    'TATA_KELOLA_PEMERINTAHAN': 'Pemerintahan & Tata Kelola',
    'SOSIAL_BUDAYA': 'Sosial Budaya & Kesejahteraan',
    'INOVASI_TEKNOLOGI': 'Inovasi & Teknologi',
  };
  return map[field] || field || 'Sosial Budaya & Kesejahteraan';
};

export const normalizeProposal = (p: any): OpdProposal => {
  const createdAtFormatted = p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '';
  const submittedAtFormatted = p.submittedAt ? new Date(p.submittedAt).toISOString().split('T')[0] : undefined;
  const lastUpdatedFormatted = p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : (createdAtFormatted || '2026-01-01');

  const supportingDocs = Array.isArray(p.supportingDocuments)
    ? p.supportingDocuments.map((doc: any) => ({
        name: doc.name,
        size: doc.size,
        uploadDate: doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('id-ID') : '01 Jan 2026',
        url: doc.fileUrl || undefined,
      }))
    : [];

  const torDoc = p.torDocument || supportingDocs.find((d: any) => 
    d.name?.toLowerCase().includes('kak') || d.name?.toLowerCase().includes('tor')
  );

  let adminVerification = undefined;
  if (p.adminVerification) {
    adminVerification = {
      isDocumentsComplete: p.adminVerification.decision === 'PASS',
      verificationNotes: p.adminVerification.verificationNotes || '',
      verifiedAt: p.adminVerification.verifiedAt ? new Date(p.adminVerification.verifiedAt).toISOString().split('T')[0] : '',
      verifiedBy: p.adminVerification.verifiedBy?.name || 'Admin BRIDA',
    };
  }

  const revisionNotes = p.revisions?.[0]?.revisionNotes || (p.adminVerification?.decision === 'RETURN' ? p.adminVerification.verificationNotes : p.revisionNotes);

  let executiveDecision = undefined;
  if (p.kepalaApproval) {
    executiveDecision = {
      decision: p.kepalaApproval.decision,
      decidedAt: p.kepalaApproval.approvedAt ? new Date(p.kepalaApproval.approvedAt).toISOString().split('T')[0] : '',
      decidedBy: p.kepalaApproval.approvedBy?.name || 'Kepala BRIDA',
      notes: p.kepalaApproval.notes || '',
      approvedBudget: p.kepalaApproval.approvedBudget !== null && p.kepalaApproval.approvedBudget !== undefined ? Number(p.kepalaApproval.approvedBudget) : undefined,
      fiscalYear: p.kepalaApproval.fiscalYear || undefined,
      finalExecutionScheme: p.kepalaApproval.finalExecutionScheme || undefined,
    };
  } else if (p.executiveDecision) {
    executiveDecision = p.executiveDecision;
  }

  return {
    id: p.id,
    code: p.code,
    opdId: p.opdId || p.opd?.id,
    opdName: p.opd?.name || p.opdName || 'Instansi OPD Mimika',
    title: p.title,
    category: p.category,
    problemStatement: p.problemStatement,
    urgencyReason: p.urgencyReason,
    urgencyLevel: p.urgencyLevel || 'TINGGI',
    expectedOutput: p.expectedOutput,
    estimatedBudget: p.estimatedBudget !== undefined && p.estimatedBudget !== null ? Number(p.estimatedBudget) : undefined,
    torDocument: torDoc,
    supportingDocuments: supportingDocs,
    status: p.status,
    createdAt: createdAtFormatted,
    submittedAt: submittedAtFormatted,
    lastUpdated: lastUpdatedFormatted,
    adminVerification,
    revisionNotes,
    scoringData: p.scoring ? {
      visionAlignmentScore: p.scoring.visionAlignmentScore,
      urgencyScore: p.scoring.urgencyScore,
      budgetFeasibilityScore: p.scoring.budgetFeasibilityScore,
      dataReadinessScore: p.scoring.dataReadinessScore,
      totalScore: Number(p.scoring.totalWeightedScore || p.scoring.totalScore || 0),
      fieldClassification: mapFieldToDisplay(p.scoring.researchField || p.scoring.fieldClassification),
      executionMethod: p.scoring.executionScheme || p.scoring.executionMethod || 'SWAKELOLA',
      researchScheme: (p.scoring.executionScheme === 'SWAKELOLA' ? 'INTERNAL_BRIDA' : 'KERJASAMA'),
      priorityCategory: p.scoring.priorityCategory,
      evaluatorNotes: p.scoring.evaluationNotes || p.scoring.evaluatorNotes || '',
      scoredAt: p.scoring.evaluatedAt ? new Date(p.scoring.evaluatedAt).toISOString().split('T')[0] : (p.scoring.createdAt ? new Date(p.scoring.createdAt).toISOString().split('T')[0] : ''),
      scoredBy: p.scoring.evaluator?.name || 'Evaluator BRIDA',
    } : p.scoringData,
    studyData: p.studyData,
    policyBriefDraft: p.policyBriefDraft,
    executiveDecision,
    followUpReport: p.followUp ? {
      utilizationType: p.followUp.utilizationType,
      utilizationSummary: p.followUp.utilizationSummary,
      satisfactionRating: p.followUp.satisfactionRating,
      feedbackNotes: p.followUp.feedbackNotes || '',
      submittedAt: p.followUp.submittedAt ? new Date(p.followUp.submittedAt).toISOString().split('T')[0] : '',
    } : p.followUpReport,
  };
};

export interface KakDocumentData {
  id?: string;
  studyId?: string;
  background: string;
  objectives: string;
  scopeAndMethodology: string;
  targetOutput: string;
  durationMonths: number;
  status: 'DRAFT' | 'FINAL';
  finalizedAt?: string | null;
  updatedAt?: string;
}

export interface RkaItemData {
  id?: string;
  studyId?: string;
  category: string;
  description: string;
  volume: number;
  unit: string;
  unitPrice: number;
  totalPrice?: number;
  createdAt?: string;
}

export interface TeamMemberData {
  id?: string;
  studyId?: string;
  name: string;
  role: string;
  institution: string;
  phone?: string | null;
  email?: string | null;
  createdAt?: string;
}

export interface ResearchStudyItem {
  id: string;
  proposalId: string;
  title: string;
  fiscalYear: number;
  allocatedBudget: number;
  executionScheme: 'SWAKELOLA' | 'PENUNJUKAN_LANGSUNG' | 'E_KATALOG' | 'TENDER' | string;
  startDate?: string | null;
  endDate?: string | null;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED';
  createdById?: string;
  createdAt: string;
  updatedAt?: string;
  proposal?: OpdProposal | any;
  kakDocument?: KakDocumentData | null;
  rkaItems?: RkaItemData[];
  teamMembers?: TeamMemberData[];
  totalRkaBudget?: number;
  remainingBudget?: number;
  isBudgetExceeded?: boolean;
  teamCount?: number;
  hasKak?: boolean;
  kakStatus?: string;
}

export interface TrackingStep {
  step: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED';
  label: string;
  description: string;
  date?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export type ExecutionMethod = 'SWAKELOLA' | 'PENUNJUKAN_LANGSUNG' | 'E_KATALOG' | 'TENDER';

export interface AdminScoringData {
  visionAlignmentScore: number; // 0-100 (Kesesuaian Visi-Misi Daerah)
  urgencyScore: number; // 0-100 (Urgensi Masalah)
  budgetFeasibilityScore: number; // 0-100 (Ketersediaan Anggaran / Kelayakan)
  dataReadinessScore?: number; // 0-100 (Kesiapan Data & Kapasitas)
  totalScore: number; // calculated weighted average (0-100)
  fieldClassification: 'Ekonomi' | 'Pemerintahan & Tata Kelola' | 'Sosial Budaya & Kesejahteraan' | 'Inovasi & Teknologi' | string;
  executionMethod: ExecutionMethod;
  researchScheme?: 'INTERNAL_BRIDA' | 'KERJASAMA' | ExecutionMethod;
  priorityCategory?: 'PRIORITAS_UTAMA' | 'PRIORITAS_KEDUA' | 'TIDAK_PRIORITAS' | string;
  evaluatorNotes: string;
  scoredAt: string;
  scoredBy: string;
}

export interface StudyManagementData {
  currentMilestone: 'PERSIAPAN' | 'PENGUMPULAN_DATA' | 'ANALISIS_DATA' | 'PENYUSUNAN_DRAF' | 'FINALISASI';
  percentProgress: number; // 0 - 100
  milestoneNotes: string;
  targetCompletionDate: string;
  kakDocument?: {
    name: string;
    size: string;
    uploadDate: string;
    url?: string;
    dataUrl?: string;
  };
  rkaDocument?: {
    name: string;
    size: string;
    uploadDate: string;
    budgetNominal?: number;
    url?: string;
    dataUrl?: string;
  };
  internalWorkingDocuments: Array<{
    id: string;
    title: string;
    type: 'Data Mentah' | 'Laporan Antara' | 'Transkrip FGD / Wawancara' | 'Olah Data Statistik';
    uploadDate: string;
    fileSize: string;
  }>;
}

export interface PolicyRecommendationItem {
  id: string;
  code: string;
  studyId: string;
  title: string;
  executiveSummary: string;
  keyFindings: string;
  policyActions: string;
  targetPolicyType: 'DRAFT_PERBUP' | 'DRAFT_PERDA' | 'SE_BUPATI' | 'SOP_LAYANAN' | 'RENCANA_AKSI_DAERAH' | 'PETUNJUK_TEKNIS' | string;
  impactLevel: 'STRATEGIS_DAERAH' | 'SEKTORAL' | 'OPERASIONAL' | string;
  targetOpdNames?: string | null;
  documentUrl?: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'FINALIZED';
  createdById?: string;
  signedById?: string | null;
  signedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  study?: {
    id: string;
    title: string;
    fiscalYear: number;
    executionScheme: string;
    proposal?: {
      id: string;
      code: string;
      category: string;
      opd?: {
        id: string;
        code: string;
        name: string;
      };
    };
  };
  createdBy?: {
    id: string;
    name: string;
    nip?: string | null;
  };
  signedBy?: {
    id: string;
    name: string;
    nip?: string | null;
  };
  digitalSignatureLogs?: DigitalSignatureLogItem[];
}

export interface DigitalSignatureLogItem {
  id: string;
  certificateNumber: string;
  documentType: 'POLICY_RECOMMENDATION' | 'KAK_DOCUMENT' | string;
  documentId: string;
  documentTitle: string;
  documentCode?: string | null;
  signerId: string;
  signerName: string;
  signerNip?: string | null;
  signerRole: string;
  signatureHash: string;
  verificationUrl?: string | null;
  status: 'VALID' | 'REVOKED' | string;
  notes?: string | null;
  signedAt: string;
  signer?: {
    id: string;
    name: string;
    nip?: string | null;
    email?: string;
  };
}

export interface TteInboxItem {
  id: string;
  documentType: 'POLICY_RECOMMENDATION' | 'KAK_DOCUMENT';
  documentCode: string;
  title: string;
  studyTitle?: string;
  opdName?: string;
  fiscalYear?: number;
  submittedBy?: string;
  submittedAt?: string;
  status: string;
  targetPolicyType?: string;
  impactLevel?: string;
  durationMonths?: number;
}

export interface PolicyBriefDraft {
  title: string;
  executiveSummary: string;
  problemAnalysis: string;
  policyOptions: string;
  actionRecommendations: string;
  officialDraftNumber: string;
  draftLetterSubject: string;
  submittedToKepalaDate?: string;
  tteStatus: 'DRAFT' | 'PENDING_KEPALA_APPROVAL' | 'TERVERIFIKASI_TTE';
}

export interface OpdMaster {
  id: string;
  code: string;
  name: string;
  category: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    users?: number;
    proposals?: number;
  };
}

export interface OpdUserAccount {
  id: string;
  name: string;
  nip?: string | null;
  email: string;
  phone?: string | null;
  role: 'OPD' | 'ADMIN_BRIDA' | 'KEPALA_BRIDA' | string;
  isActive?: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
  opdId?: string | null;
  opdName?: string;
  opd?: {
    id: string;
    code: string;
    name: string;
    category?: string;
    isActive?: boolean;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface BudgetYearConfig {
  id: string;
  year: number;
  status: 'OPEN' | 'CLOSED';
  startDate: string;
  endDate: string;
  totalAllocationPagu: string;
}

export interface OpdProposal {
  id: string;
  code: string;
  opdId?: string;
  opdName: string;
  title: string;
  category: string;
  problemStatement: string;
  urgencyReason: string;
  urgencyLevel: ProposalUrgency;
  expectedOutput: ExpectedOutput;
  estimatedBudget?: number; // Kebutuhan anggaran dalam Rupiah
  torDocument?: {
    name: string;
    size: string;
    uploadDate: string;
    url?: string;
  };
  supportingDocuments: Array<{
    name: string;
    size: string;
    uploadDate: string;
    url?: string;
  }>;
  status: ProposalStatus;
  createdAt: string;
  submittedAt?: string;
  lastUpdated: string;
  adminVerification?: {
    isDocumentsComplete: boolean;
    verificationNotes: string;
    verifiedAt: string;
    verifiedBy: string;
  };
  revisionNotes?: string;
  scoringData?: AdminScoringData;
  studyData?: StudyManagementData;
  policyBriefDraft?: PolicyBriefDraft;
  executiveDecision?: {
    decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED' | 'RETURNED';
    decidedAt: string;
    decidedBy: string;
    notes?: string;
    approvedBudget?: number;
    fiscalYear?: number;
    finalExecutionScheme?: string;
  };
  executiveGuidanceList?: Array<{
    id: string;
    text: string;
    createdAt: string;
    createdBy: string;
    stage: string;
  }>;
  recommendationDoc?: {
    title: string;
    type: 'Policy Brief' | 'Naskah Akademik' | 'Surat Rekomendasi';
    date: string;
    fileSize: string;
    tteStatus: 'TERVERIFIKASI_TTE' | 'DRAFT';
    signedBy: string;
    signatureHash?: string;
  };
  followUpReport?: {
    utilizationSummary: string;
    utilizationType: 'Rencana Kerja (Renja)' | 'Revisi / Pembuatan SOP' | 'Penyusunan Ranperda' | 'Implementasi Teknis';
    submittedAt: string;
    satisfactionRating: number;
    feedbackNotes: string;
  };
}

export interface KepalaDashboardData {
  kpis: {
    totalProposals: number;
    pendingApproval: number;
    activeStudies: number;
    completedStudies: number;
    finalizedRecommendations: number;
    pendingTteCount: number;
  };
  budgetSummary: {
    totalAllocatedBudget: number;
    totalRkaBudget: number;
    remainingBudget: number;
    budgetByExecutionScheme: Record<string, { count: number; budget: number }>;
  };
  researchFieldDistribution: Array<{
    field: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  proposalStatusDistribution: Record<string, number>;
  topActiveOpds: Array<{
    id: string;
    code: string;
    name: string;
    proposalCount: number;
  }>;
  recentApprovals: Array<any>;
  gisLocations: Array<{
    id: string;
    title: string;
    kapanewon: string;
    coordinates: [number, number];
    field: string;
    status: string;
    leadAgency: string;
    allocatedBudget: number;
  }>;
}

export interface AdminDashboardData {
  actionQueue: {
    verificationPending: number;
    scoringPending: number;
    studiesInPlanning: number;
    draftRecommendations: number;
  };
  summaryStats: {
    totalProposals: number;
    totalStudies: number;
    totalRecommendations: number;
    totalUsers: number;
    totalOpds: number;
  };
  recentProposals: Array<any>;
  recentStudies: Array<any>;
}

export interface OpdDashboardData {
  opdInfo: {
    id: string;
    code: string;
    name: string;
    category?: string;
  };
  kpis: {
    totalProposals: number;
    draftProposals: number;
    inVerification: number;
    returnedForRevision: number;
    inReview: number;
    scored: number;
    approved: number;
    rejected: number;
  };
  totalEstimatedBudgetProposed: number;
  proposals: Array<any>;
  publishedRecommendations: Array<any>;
}

interface OpdState {
  proposals: OpdProposal[];
  activeOpdName: string;
  selectedProposalId: string | null;

  // Dashboard states
  kepalaDashboard: KepalaDashboardData | null;
  adminDashboard: AdminDashboardData | null;
  opdDashboard: OpdDashboardData | null;
  isLoadingDashboard: boolean;
  errorDashboard: string | null;
  
  // Master data states
  opds: any[];
  opdUsers: OpdUserAccount[];
  categories: string[];
  budgetYears: BudgetYearConfig[];
  isLoadingMaster: boolean;
  errorMaster: string | null;

  // Proposal states
  isLoadingProposals: boolean;
  errorProposals: string | null;

  // Study states
  studies: ResearchStudyItem[];
  approvedProposals: OpdProposal[];
  currentStudy: ResearchStudyItem | null;
  isLoadingStudies: boolean;
  errorStudies: string | null;

  // Recommendation states
  recommendations: PolicyRecommendationItem[];
  availableStudiesForRec: ResearchStudyItem[];
  currentRecommendation: PolicyRecommendationItem | null;
  isLoadingRecommendations: boolean;
  errorRecommendations: string | null;

  // TTE states
  tteInbox: TteInboxItem[];
  tteHistory: DigitalSignatureLogItem[];
  currentTteDetail: any | null;
  isLoadingTte: boolean;
  errorTte: string | null;

  // Recommendation API Actions
  fetchRecommendations: (params?: { search?: string; status?: string; impactLevel?: string; targetPolicyType?: string; opdId?: string; page?: number; limit?: number }) => Promise<PolicyRecommendationItem[]>;
  fetchAvailableStudiesForRec: () => Promise<ResearchStudyItem[]>;
  fetchRecommendationById: (id: string) => Promise<PolicyRecommendationItem>;
  createRecommendation: (payload: {
    studyId: string;
    title: string;
    executiveSummary: string;
    keyFindings: string;
    policyActions: string;
    targetPolicyType?: 'DRAFT_PERBUP' | 'DRAFT_PERDA' | 'SE_BUPATI' | 'SOP_LAYANAN' | 'RENCANA_AKSI_DAERAH' | 'PETUNJUK_TEKNIS' | string;
    impactLevel?: 'STRATEGIS_DAERAH' | 'SEKTORAL' | 'OPERASIONAL' | string;
    targetOpdNames?: string | null;
    documentUrl?: string | null;
    status?: 'DRAFT' | 'SUBMITTED';
  }) => Promise<PolicyRecommendationItem>;
  updateRecommendation: (id: string, payload: Partial<{
    title: string;
    executiveSummary: string;
    keyFindings: string;
    policyActions: string;
    targetPolicyType: 'DRAFT_PERBUP' | 'DRAFT_PERDA' | 'SE_BUPATI' | 'SOP_LAYANAN' | 'RENCANA_AKSI_DAERAH' | 'PETUNJUK_TEKNIS' | string;
    impactLevel: 'STRATEGIS_DAERAH' | 'SEKTORAL' | 'OPERASIONAL' | string;
    targetOpdNames?: string | null;
    documentUrl?: string | null;
  }>) => Promise<PolicyRecommendationItem>;
  submitRecommendationToKepala: (id: string) => Promise<PolicyRecommendationItem>;
  finalizeRecommendation: (id: string, payload?: { notes?: string }) => Promise<PolicyRecommendationItem>;
  deleteRecommendation: (id: string) => Promise<boolean>;

  // TTE API Actions
  fetchTteInbox: () => Promise<TteInboxItem[]>;
  fetchTteHistory: (params?: { search?: string; documentType?: string; page?: number; limit?: number }) => Promise<DigitalSignatureLogItem[]>;
  fetchTteDocumentDetail: (documentType: 'POLICY_RECOMMENDATION' | 'KAK_DOCUMENT', id: string) => Promise<any>;
  signTteDocument: (payload: {
    documentType: 'POLICY_RECOMMENDATION' | 'KAK_DOCUMENT';
    documentId: string;
    passphrase: string;
    notes?: string;
  }) => Promise<DigitalSignatureLogItem>;
  verifyTteCertificate: (certificateNumber: string) => Promise<any>;

  // Dashboard API Actions
  fetchDashboardSummary: () => Promise<any>;
  fetchKepalaDashboard: () => Promise<KepalaDashboardData>;
  fetchAdminDashboard: () => Promise<AdminDashboardData>;
  fetchOpdDashboard: () => Promise<OpdDashboardData>;

  // Master Data API Actions
  fetchOpds: () => Promise<any[]>;
  fetchCategories: () => Promise<string[]>;

  // Proposal API Actions
  fetchProposals: (params?: { search?: string; status?: string; category?: string; opdId?: string; page?: number; limit?: number }) => Promise<OpdProposal[]>;
  fetchVerificationInbox: (params?: { search?: string; page?: number; limit?: number }) => Promise<OpdProposal[]>;
  fetchScoringQueue: (params?: { search?: string; status?: string; researchField?: string; opdId?: string; page?: number; limit?: number }) => Promise<OpdProposal[]>;
  fetchApprovalInbox: (params?: { search?: string; status?: string; researchField?: string; opdId?: string; page?: number; limit?: number }) => Promise<OpdProposal[]>;
  fetchApprovalDetail: (proposalId: string) => Promise<OpdProposal>;

  // OPD Actions
  addProposal: (data: Omit<OpdProposal, 'id' | 'code' | 'createdAt' | 'lastUpdated' | 'opdName'> & { opdName?: string; opdId?: string }, isDraft: boolean) => Promise<string>;
  updateProposal: (id: string, data: Partial<OpdProposal>) => void;
  submitDraft: (id: string) => void;
  deleteProposal: (id: string) => void;
  selectProposal: (id: string | null) => void;
  submitFollowUp: (id: string, followUp: NonNullable<OpdProposal['followUpReport']>) => void;
  getProposalById: (id: string) => OpdProposal | undefined;
  getTrackingSteps: (proposal: OpdProposal) => TrackingStep[];

  // Admin BRIDA Actions
  verifyProposal: (
    id: string,
    decisionOrIsComplete: boolean | 'PASS' | 'RETURN' | {
      decision: 'PASS' | 'RETURN';
      verificationNotes: string;
      isProblemClear?: boolean;
      isUrgencyRelevant?: boolean;
      isBudgetFeasible?: boolean;
      isDataAdequate?: boolean;
    },
    verificationNotes?: string,
    adminName?: string
  ) => Promise<any>;
  returnToOpd: (id: string, revisionNotes: string, adminName?: string) => Promise<any>;
  saveScoring: (
    id: string,
    scoring: Partial<AdminScoringData> & {
      visionAlignmentScore: number;
      urgencyScore: number;
      budgetFeasibilityScore: number;
      dataReadinessScore?: number;
      researchField?: string;
      fieldClassification?: string;
      executionScheme?: string;
      executionMethod?: ExecutionMethod;
      evaluationNotes?: string;
      evaluatorNotes?: string;
    }
  ) => Promise<any>;
  approveToResearch: (id: string, targetCompletionDate: string) => void;
  updateStudyMilestone: (id: string, milestone: StudyManagementData['currentMilestone'], percentProgress: number, notes: string) => void;
  updateStudyKakRka: (
    id: string,
    kakDocument?: StudyManagementData['kakDocument'] | null,
    rkaDocument?: StudyManagementData['rkaDocument'] | null
  ) => void;
  addWorkingDocument: (id: string, doc: StudyManagementData['internalWorkingDocuments'][0]) => void;
  savePolicyBrief: (id: string, brief: PolicyBriefDraft) => void;
  sendToKepalaBrida: (id: string) => void;

  // Study Management API Actions (Admin BRIDA)
  fetchStudies: (params?: { search?: string; status?: string; fiscalYear?: number; executionScheme?: string; opdId?: string; page?: number; limit?: number }) => Promise<ResearchStudyItem[]>;
  fetchApprovedProposals: (params?: { search?: string }) => Promise<OpdProposal[]>;
  initializeStudy: (proposalId: string, data?: { startDate?: string; endDate?: string }) => Promise<ResearchStudyItem>;
  fetchStudyById: (id: string) => Promise<ResearchStudyItem>;
  saveStudyKak: (id: string, data: {
    background: string;
    objectives: string;
    scopeAndMethodology: string;
    targetOutput: string;
    durationMonths?: number;
    status?: 'DRAFT' | 'FINAL';
  }) => Promise<KakDocumentData>;
  saveStudyRka: (id: string, data: {
    items: Array<{
      category: string;
      description: string;
      volume: number;
      unit: string;
      unitPrice: number;
    }>;
  }) => Promise<{ totalRkaBudget: number; allocatedBudget: number; remainingBudget: number; items: RkaItemData[] }>;
  saveStudyTeam: (id: string, data: {
    members: Array<{
      name: string;
      role: string;
      institution: string;
      phone?: string | null;
      email?: string | null;
    }>;
  }) => Promise<TeamMemberData[]>;
  updateStudyStatus: (id: string, status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED') => Promise<ResearchStudyItem>;

  // Kepala BRIDA (Executive) Actions
  submitExecutiveApproval: (proposalId: string, payload: {
    decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED';
    approvedBudget?: number | null;
    fiscalYear?: number | null;
    finalExecutionScheme?: 'SWAKELOLA' | 'PENUNJUKAN_LANGSUNG' | 'E_KATALOG' | 'TENDER' | null;
    notes?: string | null;
  }) => Promise<any>;
  executiveApproveProposal: (id: string, notes?: string, config?: { approvedBudget?: number; fiscalYear?: number; finalExecutionScheme?: 'SWAKELOLA' | 'PENUNJUKAN_LANGSUNG' | 'E_KATALOG' | 'TENDER' }) => Promise<any>;
  executiveRejectProposal: (id: string, reason: string) => Promise<any>;
  executiveReturnProposal: (id: string, notes: string) => Promise<any>;
  addExecutiveGuidance: (id: string, guidanceText: string, stage?: string) => void;
  signRecommendationTTE: (id: string, passphrase: string, signType?: 'SINGLE' | 'MULTI_SEKDA') => void;

  // Master Data Actions
  fetchUsers: (params?: { search?: string; role?: string; opdId?: string }) => Promise<OpdUserAccount[]>;
  addOpdUser: (user: Omit<OpdUserAccount, 'id' | 'createdAt'> & { password?: string; opdId?: string; nip?: string; phone?: string }) => Promise<any>;
  deleteOpdUser: (id: string) => Promise<any>;
  toggleUserStatus: (id: string, isActive?: boolean) => Promise<any>;
  addOpd: (opd: { code: string; name: string; category?: string; address?: string; phone?: string; email?: string }) => Promise<any>;
  addCategory: (categoryName: string) => void;
  deleteCategory: (categoryName: string) => void;
  toggleBudgetYear: (id: string) => void;
}

const INITIAL_PROPOSALS: OpdProposal[] = [
  {
    id: 'prop-opd-001',
    code: 'USUL-2026-001',
    opdName: 'Dinas Kesehatan Kab. Mimika',
    title: 'Strategi Penurunan Angka Stunting Balita Berbasis Intervensi Gizi Spesifik Lokal',
    category: 'Kesehatan',
    problemStatement: 'Meskipun angka stunting mengalami penurunan, prevalensi di beberapa kantong desa masih berada di atas 15%. Diperlukan identifikasi pola konsumsi pangan lokal dan integrasi layanan posyandu terpadu untuk percepatan eliminasi stunting.',
    urgencyReason: 'Target nasional penurunan stunting di bawah 14% mendesak untuk diakselerasi dalam penyusunan RKPD tahun mendatang.',
    urgencyLevel: 'TINGGI',
    expectedOutput: 'Rekomendasi Teknis',
    estimatedBudget: 85000000,
    torDocument: {
      name: 'KAK_Kajian_Stunting_Dinkes_2026.pdf',
      size: '1.4 MB',
      uploadDate: '02 Feb 2026'
    },
    supportingDocuments: [
      { name: 'Data_Prevalensi_Stunting_Kecamatan_2025.xlsx', size: '2.4 MB', uploadDate: '02 Feb 2026' },
      { name: 'Surat_Permohonan_Kajian_Dinkes.pdf', size: '1.1 MB', uploadDate: '02 Feb 2026' }
    ],
    status: 'COMPLETED',
    createdAt: '2026-02-02',
    submittedAt: '2026-02-03',
    lastUpdated: '2026-03-01',
    scoringData: {
      visionAlignmentScore: 95,
      urgencyScore: 92,
      budgetFeasibilityScore: 88,
      totalScore: 92,
      fieldClassification: 'Sosial Budaya & Kesejahteraan',
      executionMethod: 'SWAKELOLA',
      researchScheme: 'INTERNAL_BRIDA',
      evaluatorNotes: 'Sangat selaras dengan program prioritas Mimika Sehat 2026.',
      scoredAt: '2026-02-05',
      scoredBy: 'Admin Litbang BRIDA'
    },
    studyData: {
      currentMilestone: 'FINALISASI',
      percentProgress: 100,
      milestoneNotes: 'Kajian empiris dan uji lab pangan lokal telah selesai dipublikasikan.',
      targetCompletionDate: '2026-02-28',
      kakDocument: {
        name: 'KAK_Pelaksanaan_Kajian_Stunting_BRIDA_2026.pdf',
        size: '2.1 MB',
        uploadDate: '08 Feb 2026'
      },
      rkaDocument: {
        name: 'RKA_Belanja_Kajian_Stunting_Dinkes.xlsx',
        size: '1.4 MB',
        uploadDate: '08 Feb 2026',
        budgetNominal: 85000000
      },
      internalWorkingDocuments: [
        { id: 'doc-w1', title: 'Hasil Olah Tabulasi Data Gizi Posyandu 18 Distrik', type: 'Olah Data Statistik', uploadDate: '12 Feb 2026', fileSize: '3.4 MB' },
        { id: 'doc-w2', title: 'Draf Laporan Antara Kajian Stunting Mimika', type: 'Laporan Antara', uploadDate: '20 Feb 2026', fileSize: '5.1 MB' }
      ]
    },
    recommendationDoc: {
      title: 'Policy Brief: Formula Intervensi Pangan Lokal dan Skema Posyandu Presisi untuk Eliminasi Stunting',
      type: 'Policy Brief',
      date: '01 Mar 2026',
      fileSize: '4.8 MB',
      tteStatus: 'TERVERIFIKASI_TTE',
      signedBy: 'Kepala BRIDA Kabupaten Mimika (TTE BSrE Bersertifikat)'
    },
    followUpReport: {
      utilizationSummary: 'Hasil rekomendasi intervensi pangan lokal telah diadopsi ke dalam Rencana Kerja (Renja) Dinas Kesehatan Kab. Mimika 2027 pada program PMT (Pemberian Makanan Tambahan) Posyandu.',
      utilizationType: 'Rencana Kerja (Renja)',
      submittedAt: '03 Mar 2026',
      satisfactionRating: 5,
      feedbackNotes: 'Kajian sangat tajam, solutif, dan data empirisnya mudah diaplikasikan langsung oleh tim teknis lapangan.'
    }
  },
  {
    id: 'prop-opd-002',
    code: 'USUL-2026-002',
    opdName: 'Dinas Komunikasi dan Informatika Kab. Mimika',
    title: 'Model Sistem Peringatan Dini Bencana Banjir dan Pasang Pesisir Berbasis Sensor IoT dan AI',
    category: 'Infrastruktur & Teknologi',
    problemStatement: 'Sistem pemantauan debit air di sungai aliran Wania dan Kamoro serta pasang air laut di pesisir Mimika saat ini masih mengandalkan pos manual, sehingga rentan terjadi keterlambatan evakuasi warga bantaran sungai saat curah hujan ekstrem.',
    urgencyReason: 'Menjelang musim hujan dengan intensitas tinggi, keselamatan puluhan ribu warga di sepanjang bantaran sungai dan pesisir Mimika menjadi prioritas utama.',
    urgencyLevel: 'TINGGI',
    expectedOutput: 'Solusi Teknologi',
    estimatedBudget: 150000000,
    torDocument: {
      name: 'TOR_Smart_EWS_Banjir_Pesisir_Diskominfo.pdf',
      size: '2.8 MB',
      uploadDate: '15 Feb 2026'
    },
    supportingDocuments: [
      { name: 'Peta_Titik_Rentan_Banjir_Pesisir_Mimika.pdf', size: '5.2 MB', uploadDate: '15 Feb 2026' }
    ],
    status: 'IN_PROGRESS',
    createdAt: '2026-02-15',
    submittedAt: '2026-02-16',
    lastUpdated: '2026-02-25',
    scoringData: {
      visionAlignmentScore: 90,
      urgencyScore: 96,
      budgetFeasibilityScore: 85,
      totalScore: 91,
      fieldClassification: 'Inovasi & Teknologi',
      executionMethod: 'E_KATALOG',
      researchScheme: 'KERJASAMA',
      evaluatorNotes: 'Urgensi keselamatan warga sangat tinggi, rekomendasi pengadaan teknologi via E-Katalog.',
      scoredAt: '2026-02-18',
      scoredBy: 'Admin Litbang BRIDA'
    },
    studyData: {
      currentMilestone: 'PENGUMPULAN_DATA',
      percentProgress: 45,
      milestoneNotes: 'Pemasangan prototipe sensor telemetry di 3 pos pemantau hulu Sungai Wania dan Sungai Kamoro.',
      targetCompletionDate: '2026-04-30',
      kakDocument: {
        name: 'KAK_Implementasi_EWS_Banjir_Pesisir_IoT.pdf',
        size: '3.2 MB',
        uploadDate: '20 Feb 2026'
      },
      rkaDocument: {
        name: 'RKA_Pengembangan_Sensor_IoT_AI.xlsx',
        size: '2.1 MB',
        uploadDate: '20 Feb 2026',
        budgetNominal: 150000000
      },
      internalWorkingDocuments: [
        { id: 'doc-w3', title: 'Data Mentah Sensor Telemetry Curah Hujan & Debit Mimika', type: 'Data Mentah', uploadDate: '24 Feb 2026', fileSize: '8.2 MB' }
      ]
    },
    policyBriefDraft: {
      title: 'Policy Brief: Integrasi Sensor IoT dan Algoritma AI untuk Early Warning System Banjir Pesisir Mimika',
      executiveSummary: 'Penerapan jaringan sensor cerdas berbiaya terjangkau mampu memangkas waktu respons peringatan dini evakuasi dari 45 menit menjadi kurang dari 5 menit.',
      problemAnalysis: 'Ketergantungan pada pemantauan visual pos pantau manual berisiko tinggi saat malam hari atau cuaca kabut tebal.',
      policyOptions: 'Opsi 1: Pemasangan sensor mandiri oleh Pemkab Mimika. Opsi 2: Kolaborasi multi-sektor BPBD, Diskominfo, dan BWS Papua.',
      actionRecommendations: 'Penerbitan Perbup tentang Standar Integrasi Data Telemetri Kebencanaan ke Mimika Command Center.',
      officialDraftNumber: '005/BRIDA-MMK/PB-EWS/2026',
      draftLetterSubject: 'Penyampaian Rekomendasi Teknis Sistem Peringatan Dini Banjir Berbasis IoT',
      tteStatus: 'DRAFT'
    }
  },
  {
    id: 'prop-opd-003',
    code: 'USUL-2026-003',
    opdName: 'Dinas Pendidikan Kab. Mimika',
    title: 'Kajian Evaluasi Efektivitas Kurikulum Muatan Lokal Kebudayaan Daerah pada Sekolah Dasar',
    category: 'Pendidikan',
    problemStatement: 'Belum ada standarisasi modul ajar dan instrumen penilaian kecakapan budaya daerah untuk siswa SD, sehingga capaian pelestarian nilai kearifan lokal belum terukur optimal.',
    urgencyReason: 'Dinas Pendidikan merencanakan revisi silabus muatan lokal untuk tahun ajaran baru mendatang.',
    urgencyLevel: 'SEDANG',
    expectedOutput: 'Naskah Akademik Perda',
    estimatedBudget: 60000000,
    torDocument: {
      name: 'KAK_Evaluasi_Mulok_Disdik.pdf',
      size: '1.1 MB',
      uploadDate: '28 Feb 2026'
    },
    supportingDocuments: [
      { name: 'Hasil_Survei_Literasi_Budaya_Siswa_Mimika.pdf', size: '1.8 MB', uploadDate: '28 Feb 2026' }
    ],
    status: 'APPROVED',
    createdAt: '2026-02-28',
    submittedAt: '2026-03-01',
    lastUpdated: '2026-03-02',
    scoringData: {
      visionAlignmentScore: 88,
      urgencyScore: 82,
      budgetFeasibilityScore: 90,
      totalScore: 86,
      fieldClassification: 'Sosial Budaya & Kesejahteraan',
      executionMethod: 'PENUNJUKAN_LANGSUNG',
      researchScheme: 'KERJASAMA',
      evaluatorNotes: 'Layak diteliti, rekomendasi penunjukan langsung kepada pakar kebudayaan & kurikulum daerah.',
      scoredAt: '2026-03-02',
      scoredBy: 'Admin Litbang BRIDA'
    },
    studyData: {
      currentMilestone: 'PERSIAPAN',
      percentProgress: 15,
      milestoneNotes: 'Penyusunan instrumen kuesioner dan penentuan sampel 40 SD percontohan.',
      targetCompletionDate: '2026-05-30',
      internalWorkingDocuments: []
    }
  },
  {
    id: 'prop-opd-004',
    code: 'USUL-2026-004',
    opdName: 'Dinas Koperasi dan UKM Kab. Mimika',
    title: 'Analisis Rantai Pasok dan Digitalisasi Pemasaran Produk UMKM Olahan Sagu dan Kopi Amungme',
    category: 'Ekonomi & Pariwisata',
    problemStatement: 'Petani dan pelaku UMKM olahan sagu dan kopi Amungme kerap mengalami kendala keterbatasan akses pasar luar daerah dan sistem logistik rantai pasok.',
    urgencyReason: 'Potensi pemberdayaan ekonomi masyarakat adat Amungme dan Kamoro sangat besar untuk meningkatkan taraf hidup keluarga.',
    urgencyLevel: 'SEDANG',
    expectedOutput: 'Kajian Kebijakan / Policy Brief',
    estimatedBudget: 50000000,
    torDocument: {
      name: 'KAK_Rantai_Pasok_Sagu_Kopi_Dinkop.pdf',
      size: '950 KB',
      uploadDate: '04 Mar 2026'
    },
    supportingDocuments: [],
    status: 'IN_REVIEW',
    createdAt: '2026-03-04',
    submittedAt: '2026-03-04',
    lastUpdated: '2026-03-04',
    adminVerification: {
      isDocumentsComplete: true,
      verificationNotes: 'Dokumen dan uraian masalah terverifikasi lengkap.',
      verifiedAt: '2026-03-04',
      verifiedBy: 'Admin Litbang BRIDA'
    }
  },
  {
    id: 'prop-opd-005',
    code: 'USUL-2026-005',
    opdName: 'Dinas Lingkungan Hidup Kab. Mimika',
    title: 'Optimalisasi Pengelolaan Sampah Organik Terdesentralisasi Melalui Biokonversi Maggot BSF',
    category: 'Lingkungan Hidup & Bencana',
    problemStatement: 'Kapasitas TPST regional hampir melampaui ambang batas operasional. Diperlukan skema operasional maggot BSF di tingkat kelurahan dan kampung yang ekonomis dan berkelanjutan.',
    urgencyReason: 'Penumpukan volume sampah harian mencapai 200 ton/hari tanpa pengolahan reduksi di hulu.',
    urgencyLevel: 'TINGGI',
    expectedOutput: 'Rekomendasi Teknis',
    estimatedBudget: 110000000,
    torDocument: {
      name: 'TOR_Kajian_Maggot_BSF_DLH.pdf',
      size: '2.1 MB',
      uploadDate: '05 Mar 2026'
    },
    supportingDocuments: [
      { name: 'Laporan_Volume_Sampah_TPST_2025.pdf', size: '3.1 MB', uploadDate: '05 Mar 2026' }
    ],
    status: 'PENDING',
    createdAt: '2026-03-05',
    submittedAt: '2026-03-05',
    lastUpdated: '2026-03-05'
  },
  {
    id: 'prop-opd-006',
    code: 'USUL-2026-006',
    opdName: 'Dinas Pariwisata Kab. Mimika',
    title: 'Studi Kelayakan Pengembangan Ekowisata Mangrove dan Desa Wisata Pesisir Mimika',
    category: 'Ekonomi & Pariwisata',
    problemStatement: 'Konsep awal ekowisata pesisir belum memiliki indikator daya dukung lingkungan dan standardisasi pemandu wisata lokal.',
    urgencyReason: 'Menangkap potensi pariwisata berkelanjutan dan pelestarian ekosistem pesisir.',
    urgencyLevel: 'RENDAH',
    expectedOutput: 'Model / Blueprint',
    supportingDocuments: [],
    status: 'DRAFT',
    createdAt: '2026-03-06',
    lastUpdated: '2026-03-06'
  }
];

const INITIAL_OPDS: OpdMaster[] = [
  { id: 'opd-1', code: 'BAPPEDA', name: 'Badan Perencanaan Pembangunan Daerah Kab. Mimika', category: 'Badan Daerah', isActive: true },
  { id: 'opd-2', code: 'DINKES', name: 'Dinas Kesehatan Kab. Mimika', category: 'Dinas Daerah', isActive: true },
  { id: 'opd-3', code: 'DISKOMINFO', name: 'Dinas Komunikasi dan Informatika Kab. Mimika', category: 'Dinas Daerah', isActive: true },
  { id: 'opd-4', code: 'DLH', name: 'Dinas Lingkungan Hidup Kab. Mimika', category: 'Dinas Daerah', isActive: true },
  { id: 'opd-5', code: 'DISDIK', name: 'Dinas Pendidikan Kab. Mimika', category: 'Dinas Daerah', isActive: true },
  { id: 'opd-6', code: 'DINKOP', name: 'Dinas Koperasi dan UKM Kab. Mimika', category: 'Dinas Daerah', isActive: true },
  { id: 'opd-7', code: 'DISPAR', name: 'Dinas Pariwisata, Kebudayaan, Pemuda dan Olahraga Kab. Mimika', category: 'Dinas Daerah', isActive: true },
  { id: 'opd-8', code: 'BPBD', name: 'Badan Penanggulangan Bencana Daerah Kab. Mimika', category: 'Badan Daerah', isActive: true },
  { id: 'opd-9', code: 'DISTAN', name: 'Dinas Pertanian, Tanaman Pangan & Perkebunan Kab. Mimika', category: 'Dinas Daerah', isActive: true },
];

const INITIAL_USERS: OpdUserAccount[] = [
  { id: 'usr-1', name: 'BAPPEDA Kab. Mimika', email: 'opd.bappeda@mimikakab.go.id', opdName: 'Badan Perencanaan Pembangunan Daerah Kab. Mimika', role: 'OPD', status: 'ACTIVE', isActive: true, createdAt: '2026-01-10' },
  { id: 'usr-2', name: 'Dinas Kesehatan Kab. Mimika', email: 'dinkes@mimikakab.go.id', opdName: 'Dinas Kesehatan Kab. Mimika', role: 'OPD', status: 'ACTIVE', isActive: true, createdAt: '2026-01-12' },
  { id: 'usr-3', name: 'Dinas Komunikasi & Informatika Kab. Mimika', email: 'diskominfo@mimikakab.go.id', opdName: 'Dinas Komunikasi dan Informatika Kab. Mimika', role: 'OPD', status: 'ACTIVE', isActive: true, createdAt: '2026-01-15' },
  { id: 'usr-4', name: 'Dinas Lingkungan Hidup Kab. Mimika', email: 'dlh@mimikakab.go.id', opdName: 'Dinas Lingkungan Hidup Kab. Mimika', role: 'OPD', status: 'ACTIVE', isActive: true, createdAt: '2026-01-18' },
  { id: 'usr-5', name: 'Dinas Pendidikan Kab. Mimika', email: 'disdik@mimikakab.go.id', opdName: 'Dinas Pendidikan Kab. Mimika', role: 'OPD', status: 'ACTIVE', isActive: true, createdAt: '2026-01-20' },
  { id: 'usr-6', name: 'Dinas Koperasi & UKM Kab. Mimika', email: 'dinkop@mimikakab.go.id', opdName: 'Dinas Koperasi dan UKM Kab. Mimika', role: 'OPD', status: 'ACTIVE', isActive: true, createdAt: '2026-01-22' },
];

const INITIAL_BUDGET_YEARS: BudgetYearConfig[] = [
  { id: 'by-2026', year: 2026, status: 'OPEN', startDate: '2026-01-01', endDate: '2026-10-31', totalAllocationPagu: 'Rp 4.500.000.000' },
  { id: 'by-2025', year: 2025, status: 'CLOSED', startDate: '2025-01-01', endDate: '2025-10-31', totalAllocationPagu: 'Rp 3.800.000.000' },
];

const INITIAL_CATEGORIES = [
  'Pendidikan',
  'Kesehatan',
  'Infrastruktur & Teknologi',
  'Ekonomi & Pariwisata',
  'Tata Kelola & Reformasi Birokrasi',
  'Lingkungan Hidup & Bencana',
  'Sosial & Kesejahteraan Masyarakat'
];

export const useOpdStore = create<OpdState>((set, get) => ({
  proposals: INITIAL_PROPOSALS,
  activeOpdName: 'BAPPEDA & Perangkat Daerah Kab. Mimika',
  selectedProposalId: null,
  opds: INITIAL_OPDS,
  opdUsers: INITIAL_USERS,
  categories: INITIAL_CATEGORIES,
  budgetYears: INITIAL_BUDGET_YEARS,
  isLoadingMaster: false,
  errorMaster: null,
  isLoadingProposals: false,
  errorProposals: null,

  // Dashboard states
  kepalaDashboard: null,
  adminDashboard: null,
  opdDashboard: null,
  isLoadingDashboard: false,
  errorDashboard: null,

  // Study states
  studies: [],
  approvedProposals: [],
  currentStudy: null,
  isLoadingStudies: false,
  errorStudies: null,

  // Recommendation states
  recommendations: [],
  availableStudiesForRec: [],
  currentRecommendation: null,
  isLoadingRecommendations: false,
  errorRecommendations: null,

  // TTE states
  tteInbox: [],
  tteHistory: [],
  currentTteDetail: null,
  isLoadingTte: false,
  errorTte: null,

  // Dashboard API Actions
  fetchDashboardSummary: async () => {
    try {
      set({ isLoadingDashboard: true, errorDashboard: null });
      const res = await axiosInstance.get('/dashboard/summary');
      const data = res.data?.data || res.data;
      set({ isLoadingDashboard: false });
      return data;
    } catch (err: any) {
      console.error('Failed to fetch dashboard summary:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal memuat ringkasan dashboard';
      set({ errorDashboard: errMsg, isLoadingDashboard: false });
      return null;
    }
  },

  fetchKepalaDashboard: async () => {
    try {
      set({ isLoadingDashboard: true, errorDashboard: null });
      const res = await axiosInstance.get('/dashboard/kepala');
      const data = res.data?.data || res.data;
      set({ kepalaDashboard: data, isLoadingDashboard: false });
      return data;
    } catch (err: any) {
      console.error('Failed to fetch Kepala BRIDA dashboard:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal memuat dashboard eksekutif';
      set({ errorDashboard: errMsg, isLoadingDashboard: false });
      return get().kepalaDashboard!;
    }
  },

  fetchAdminDashboard: async () => {
    try {
      set({ isLoadingDashboard: true, errorDashboard: null });
      const res = await axiosInstance.get('/dashboard/admin');
      const data = res.data?.data || res.data;
      set({ adminDashboard: data, isLoadingDashboard: false });
      return data;
    } catch (err: any) {
      console.error('Failed to fetch Admin dashboard:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal memuat dashboard operasional';
      set({ errorDashboard: errMsg, isLoadingDashboard: false });
      return get().adminDashboard!;
    }
  },

  fetchOpdDashboard: async () => {
    try {
      set({ isLoadingDashboard: true, errorDashboard: null });
      const res = await axiosInstance.get('/dashboard/opd');
      const data = res.data?.data || res.data;
      set({ opdDashboard: data, isLoadingDashboard: false });
      return data;
    } catch (err: any) {
      console.error('Failed to fetch OPD dashboard:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal memuat dashboard OPD';
      set({ errorDashboard: errMsg, isLoadingDashboard: false });
      return get().opdDashboard!;
    }
  },

  // Master Data API Actions
  fetchOpds: async () => {
    try {
      set({ isLoadingMaster: true, errorMaster: null });
      const res = await axiosInstance.get('/opds');
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data) && data.length > 0) {
        set({ opds: data, isLoadingMaster: false });
        return data;
      }
      set({ isLoadingMaster: false });
      return get().opds;
    } catch (err: any) {
      console.error('Failed to fetch OPDs:', err);
      set({ errorMaster: err.message || 'Gagal memuat master OPD', isLoadingMaster: false });
      return get().opds;
    }
  },

  fetchCategories: async () => {
    try {
      const res = await axiosInstance.get('/opds');
      const data: any[] = res.data?.data || res.data || [];
      if (Array.isArray(data) && data.length > 0) {
        const opdCategories = Array.from(new Set(data.map((o: any) => o.category).filter(Boolean)));
        const mergedCategories = Array.from(new Set([...INITIAL_CATEGORIES, ...opdCategories]));
        set({ categories: mergedCategories });
        return mergedCategories;
      }
      return get().categories;
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
      return get().categories;
    }
  },

  // Proposal API Actions
  fetchProposals: async (params = {}) => {
    try {
      set({ isLoadingProposals: true, errorProposals: null });
      const res = await axiosInstance.get('/proposals', { params });
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        const normalized = data.map(normalizeProposal);
        set({ proposals: normalized, isLoadingProposals: false });
        return normalized;
      }
      set({ isLoadingProposals: false });
      return get().proposals;
    } catch (err: any) {
      console.error('Failed to fetch proposals:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal memuat daftar usulan';
      set({ errorProposals: errMsg, isLoadingProposals: false });
      return get().proposals;
    }
  },

  fetchVerificationInbox: async (params = {}) => {
    try {
      set({ isLoadingProposals: true, errorProposals: null });
      const res = await axiosInstance.get('/proposals/verification/inbox', { params });
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        const normalized = data.map(normalizeProposal);
        set((state) => {
          const inboxMap = new Map(normalized.map((p) => [p.id, p]));
          const merged = [
            ...normalized,
            ...state.proposals.filter((p) => !inboxMap.has(p.id)),
          ];
          return { proposals: merged, isLoadingProposals: false };
        });
        return normalized;
      }
      set({ isLoadingProposals: false });
      return get().proposals.filter((p) => p.status === 'PENDING');
    } catch (err: any) {
      console.error('Failed to fetch verification inbox:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal memuat inbox verifikasi';
      set({ errorProposals: errMsg, isLoadingProposals: false });
      return get().proposals.filter((p) => p.status === 'PENDING');
    }
  },

  fetchScoringQueue: async (params = {}) => {
    try {
      set({ isLoadingProposals: true, errorProposals: null });
      const res = await axiosInstance.get('/scoring/queue', { params });
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        const normalized = data.map(normalizeProposal);
        set((state) => {
          const scoringMap = new Map(normalized.map((p) => [p.id, p]));
          const merged = [
            ...normalized,
            ...state.proposals.filter((p) => !scoringMap.has(p.id)),
          ];
          return { proposals: merged, isLoadingProposals: false };
        });
        return normalized;
      }
      set({ isLoadingProposals: false });
      return get().proposals.filter((p) => ['IN_REVIEW', 'SCORED', 'APPROVED'].includes(p.status));
    } catch (err: any) {
      console.error('Failed to fetch scoring queue:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal memuat antrean scoring';
      set({ errorProposals: errMsg, isLoadingProposals: false });
      return get().proposals.filter((p) => ['IN_REVIEW', 'SCORED', 'APPROVED'].includes(p.status));
    }
  },

  fetchApprovalInbox: async (params = {}) => {
    try {
      set({ isLoadingProposals: true, errorProposals: null });
      const res = await axiosInstance.get('/approvals/inbox', { params });
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        const normalized = data.map(normalizeProposal);
        set((state) => {
          const approvalMap = new Map(normalized.map((p) => [p.id, p]));
          const merged = [
            ...normalized,
            ...state.proposals.filter((p) => !approvalMap.has(p.id)),
          ];
          return { proposals: merged, isLoadingProposals: false };
        });
        return normalized;
      }
      set({ isLoadingProposals: false });
      return get().proposals.filter((p) => ['SCORED', 'APPROVED', 'REJECTED', 'IN_PROGRESS'].includes(p.status));
    } catch (err: any) {
      console.error('Failed to fetch approval inbox:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal memuat antrean persetujuan';
      set({ errorProposals: errMsg, isLoadingProposals: false });
      return get().proposals.filter((p) => ['SCORED', 'APPROVED', 'REJECTED', 'IN_PROGRESS'].includes(p.status));
    }
  },

  fetchApprovalDetail: async (proposalId: string) => {
    try {
      const res = await axiosInstance.get(`/approvals/${proposalId}`);
      const data = res.data?.data || res.data;
      const normalized = normalizeProposal(data);
      set((state) => ({
        proposals: state.proposals.map((p) => (p.id === proposalId ? normalized : p)),
      }));
      return normalized;
    } catch (err: any) {
      console.error('Failed to fetch approval detail:', err);
      throw err;
    }
  },

  // OPD Actions
  addProposal: async (data, isDraft) => {
    try {
      set({ isLoadingProposals: true, errorProposals: null });

      const docs: Array<{ name: string; size: string; fileUrl?: string }> = [];
      if (data.torDocument) {
        docs.push({
          name: data.torDocument.name,
          size: data.torDocument.size,
          fileUrl: data.torDocument.url,
        });
      }
      if (Array.isArray(data.supportingDocuments)) {
        data.supportingDocuments.forEach((doc) => {
          if (doc.name !== data.torDocument?.name) {
            docs.push({
              name: doc.name,
              size: doc.size,
              fileUrl: doc.url,
            });
          }
        });
      }

      const backendExpectedOutput = mapFrontendExpectedOutputToBackend(data.expectedOutput);

      const payload = {
        opdId: data.opdId,
        title: data.title,
        category: data.category,
        problemStatement: data.problemStatement,
        urgencyReason: data.urgencyReason,
        urgencyLevel: data.urgencyLevel || 'TINGGI',
        expectedOutput: backendExpectedOutput,
        estimatedBudget:
          data.estimatedBudget !== undefined &&
          data.estimatedBudget !== null &&
          !isNaN(Number(data.estimatedBudget))
            ? Number(data.estimatedBudget)
            : null,
        isDraft: !!isDraft,
        supportingDocuments: docs,
      };

      const res = await axiosInstance.post('/proposals', payload);
      const createdData = res.data?.data || res.data;
      const normalized = normalizeProposal(createdData);

      set((state) => ({
        proposals: [normalized, ...state.proposals.filter((p) => p.id !== normalized.id)],
        selectedProposalId: normalized.id,
        isLoadingProposals: false,
      }));

      return normalized.id;
    } catch (err: any) {
      console.error('Failed to create proposal:', err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        err.message ||
        'Gagal menyimpan usulan riset';
      set({ errorProposals: errMsg, isLoadingProposals: false });
      throw new Error(errMsg);
    }
  },

  updateProposal: (id, data) => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => ({
      proposals: state.proposals.map((p) =>
        p.id === id ? { ...p, ...data, lastUpdated: today } : p
      ),
    }));
  },

  submitDraft: (id) => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => ({
      proposals: state.proposals.map((p) =>
        p.id === id
          ? {
              ...p,
              status: 'PENDING',
              submittedAt: today,
              lastUpdated: today,
            }
          : p
      ),
    }));
  },

  deleteProposal: (id) => {
    set((state) => ({
      proposals: state.proposals.filter((p) => p.id !== id),
      selectedProposalId: state.selectedProposalId === id ? null : state.selectedProposalId,
    }));
  },

  selectProposal: (id) => {
    set({ selectedProposalId: id });
  },

  submitFollowUp: async (id, followUp) => {
    try {
      const res = await axiosInstance.post(`/proposals/${id}/follow-up`, {
        utilizationType: followUp.utilizationType,
        utilizationSummary: followUp.utilizationSummary,
        satisfactionRating: followUp.satisfactionRating,
        feedbackNotes: followUp.feedbackNotes || null,
      });
      const saved = res.data?.data || res.data;
      set((state) => ({
        proposals: state.proposals.map((p) =>
          p.id === id ? { ...p, followUpReport: followUp } : p
        ),
      }));
      return saved;
    } catch (err: any) {
      console.error('Failed to submit follow-up report:', err);
      // Fallback local update
      set((state) => ({
        proposals: state.proposals.map((p) =>
          p.id === id ? { ...p, followUpReport: followUp } : p
        ),
      }));
    }
  },

  getProposalById: (id) => {
    return get().proposals.find((p) => p.id === id);
  },

  getTrackingSteps: (proposal) => {
    const statusOrder: Array<'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED'> = [
      'PENDING',
      'IN_REVIEW',
      'APPROVED',
      'IN_PROGRESS',
      'COMPLETED',
    ];

    const labels: Record<string, { label: string; desc: string }> = {
      PENDING: {
        label: 'Usulan Terkirim (Pending)',
        desc: 'Usulan telah diterima sistem dan menunggu verifikasi kelengkapan berkas oleh Admin BRIDA.',
      },
      IN_REVIEW: {
        label: 'Sedang Dikaji (In-Review)',
        desc: 'Tim evaluator BRIDA sedang menilai relevansi, urgensi masalah, dan kesesuaian prioritas daerah.',
      },
      APPROVED: {
        label: 'Disetujui (Approved)',
        desc: 'Kepala BRIDA menyetujui usulan untuk dialokasikan anggaran dan ditetapkan menjadi agenda riset daerah.',
      },
      IN_PROGRESS: {
        label: 'Pelaksanaan Riset (In-Progress)',
        desc: 'Tim peneliti BRIDA / Mitra sedang melaksanakan pengumpulan data lapangan, survei, dan analisis.',
      },
      COMPLETED: {
        label: 'Rekomendasi Terbit (Completed)',
        desc: 'Laporan akhir & Dokumen Policy Brief telah selesai dan ditandatangani elektronik (TTE) resmi.',
      },
    };

    let activeIndex = -1;
    if (proposal.status === 'PENDING') activeIndex = 0;
    else if (proposal.status === 'IN_REVIEW' || proposal.status === 'SCORED') activeIndex = 1;
    else if (proposal.status === 'APPROVED') activeIndex = 2;
    else if (proposal.status === 'IN_PROGRESS') activeIndex = 3;
    else if (proposal.status === 'COMPLETED') activeIndex = 4;

    return statusOrder.map((step, idx) => ({
      step,
      label: labels[step].label,
      description: labels[step].desc,
      date: idx <= activeIndex ? (idx === 0 ? proposal.submittedAt || proposal.createdAt : proposal.lastUpdated) : undefined,
      isCompleted: idx < activeIndex || (proposal.status === 'COMPLETED' && idx === activeIndex),
      isCurrent: idx === activeIndex && proposal.status !== 'COMPLETED',
    }));
  },

  // Admin BRIDA Actions
  verifyProposal: async (id, decisionOrIsComplete, verificationNotes, adminName) => {
    try {
      set({ isLoadingProposals: true, errorProposals: null });

      let payload: {
        decision: 'PASS' | 'RETURN';
        verificationNotes: string;
        isProblemClear?: boolean;
        isUrgencyRelevant?: boolean;
        isBudgetFeasible?: boolean;
        isDataAdequate?: boolean;
      };

      if (typeof decisionOrIsComplete === 'object' && decisionOrIsComplete !== null) {
        payload = {
          decision: decisionOrIsComplete.decision,
          verificationNotes:
            decisionOrIsComplete.verificationNotes ||
            (decisionOrIsComplete.decision === 'PASS'
              ? 'Berkas administrasi dan uraian masalah dinyatakan lengkap dan valid.'
              : 'Mohon lengkapi berkas dan perjelas uraian masalah.'),
          isProblemClear: decisionOrIsComplete.isProblemClear ?? true,
          isUrgencyRelevant: decisionOrIsComplete.isUrgencyRelevant ?? true,
          isBudgetFeasible: decisionOrIsComplete.isBudgetFeasible ?? true,
          isDataAdequate: decisionOrIsComplete.isDataAdequate ?? true,
        };
      } else if (typeof decisionOrIsComplete === 'boolean') {
        payload = {
          decision: decisionOrIsComplete ? 'PASS' : 'RETURN',
          verificationNotes:
            verificationNotes ||
            (decisionOrIsComplete
              ? 'Berkas administrasi dan uraian masalah dinyatakan lengkap dan valid.'
              : 'Mohon lengkapi berkas dan perjelas uraian masalah.'),
          isProblemClear: decisionOrIsComplete,
          isUrgencyRelevant: decisionOrIsComplete,
          isBudgetFeasible: decisionOrIsComplete,
          isDataAdequate: decisionOrIsComplete,
        };
      } else {
        payload = {
          decision: decisionOrIsComplete === 'PASS' ? 'PASS' : 'RETURN',
          verificationNotes:
            verificationNotes ||
            (decisionOrIsComplete === 'PASS'
              ? 'Berkas administrasi dan uraian masalah dinyatakan lengkap dan valid.'
              : 'Mohon lengkapi berkas dan perjelas uraian masalah.'),
          isProblemClear: decisionOrIsComplete === 'PASS',
          isUrgencyRelevant: decisionOrIsComplete === 'PASS',
          isBudgetFeasible: decisionOrIsComplete === 'PASS',
          isDataAdequate: decisionOrIsComplete === 'PASS',
        };
      }

      const res = await axiosInstance.post(`/proposals/${id}/verify`, payload);
      const updatedData = res.data?.data || res.data;
      const normalized = updatedData?.id ? normalizeProposal(updatedData) : null;
      const today = new Date().toISOString().split('T')[0];

      set((state) => ({
        proposals: state.proposals.map((p) => {
          if (p.id !== id) return p;
          if (normalized) return normalized;
          return {
            ...p,
            status: payload.decision === 'PASS' ? 'IN_REVIEW' : 'RETURNED',
            lastUpdated: today,
            adminVerification: {
              isDocumentsComplete: payload.decision === 'PASS',
              verificationNotes: payload.verificationNotes,
              verifiedAt: today,
              verifiedBy: adminName || 'Admin BRIDA',
            },
            revisionNotes: payload.decision === 'RETURN' ? payload.verificationNotes : undefined,
          };
        }),
        isLoadingProposals: false,
      }));

      return res.data;
    } catch (err: any) {
      console.error('Failed to verify proposal:', err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        err.message ||
        'Gagal memproses verifikasi usulan';
      set({ errorProposals: errMsg, isLoadingProposals: false });
      throw new Error(errMsg);
    }
  },

  returnToOpd: async (id, revisionNotes, adminName) => {
    return get().verifyProposal(
      id,
      {
        decision: 'RETURN',
        verificationNotes: revisionNotes,
        isProblemClear: false,
        isUrgencyRelevant: false,
        isBudgetFeasible: false,
        isDataAdequate: false,
      },
      revisionNotes,
      adminName
    );
  },

  saveScoring: async (id, scoring) => {
    try {
      set({ isLoadingProposals: true, errorProposals: null });

      const backendField = mapFieldToBackend(
        scoring.researchField || scoring.fieldClassification || 'Sosial Budaya & Kesejahteraan'
      );
      const backendExecution = (scoring.executionScheme ||
        scoring.executionMethod ||
        'SWAKELOLA') as 'SWAKELOLA' | 'PENUNJUKAN_LANGSUNG' | 'E_KATALOG' | 'TENDER';
      const evaluationNotes = (
        scoring.evaluationNotes ||
        scoring.evaluatorNotes ||
        'Usulan dinilai memenuhi kriteria keselarasan, urgensi, dan kelayakan teknis pelaksanaan riset daerah.'
      ).trim();

      const payload = {
        visionAlignmentScore: Number(scoring.visionAlignmentScore),
        urgencyScore: Number(scoring.urgencyScore),
        budgetFeasibilityScore: Number(scoring.budgetFeasibilityScore),
        dataReadinessScore: Number(
          scoring.dataReadinessScore !== undefined && scoring.dataReadinessScore !== null
            ? scoring.dataReadinessScore
            : 80
        ),
        researchField: backendField,
        executionScheme: backendExecution,
        evaluationNotes:
          evaluationNotes.length >= 10
            ? evaluationNotes
            : `${evaluationNotes} (Telah ditelaah oleh tim teknis BRIDA).`,
      };

      const res = await axiosInstance.post(`/scoring/${id}`, payload);
      const responseData = res.data?.data || res.data;
      const updatedProposal = responseData?.proposal;
      const savedScoring = responseData?.scoring;

      const today = new Date().toISOString().split('T')[0];

      set((state) => ({
        proposals: state.proposals.map((p) => {
          if (p.id !== id) return p;
          if (updatedProposal?.id) {
            return normalizeProposal({
              ...p,
              ...updatedProposal,
              scoring: savedScoring || updatedProposal.scoring,
            });
          }
          return {
            ...p,
            status: 'SCORED',
            lastUpdated: today,
            scoringData: {
              visionAlignmentScore: payload.visionAlignmentScore,
              urgencyScore: payload.urgencyScore,
              budgetFeasibilityScore: payload.budgetFeasibilityScore,
              dataReadinessScore: payload.dataReadinessScore,
              totalScore: savedScoring?.totalWeightedScore
                ? Number(savedScoring.totalWeightedScore)
                : Math.round(
                    payload.visionAlignmentScore * 0.3 +
                      payload.urgencyScore * 0.3 +
                      payload.budgetFeasibilityScore * 0.2 +
                      payload.dataReadinessScore * 0.2
                  ),
              fieldClassification: mapFieldToDisplay(payload.researchField),
              executionMethod: payload.executionScheme,
              researchScheme:
                payload.executionScheme === 'SWAKELOLA' ? 'INTERNAL_BRIDA' : 'KERJASAMA',
              priorityCategory:
                savedScoring?.priorityCategory ||
                (savedScoring?.totalWeightedScore >= 80
                  ? 'PRIORITAS_UTAMA'
                  : savedScoring?.totalWeightedScore >= 65
                  ? 'PRIORITAS_KEDUA'
                  : 'TIDAK_PRIORITAS'),
              evaluatorNotes: payload.evaluationNotes,
              scoredAt: today,
              scoredBy: scoring.scoredBy || 'Admin Litbang BRIDA',
            },
          };
        }),
        isLoadingProposals: false,
      }));

      return res.data;
    } catch (err: any) {
      console.error('Failed to submit scoring:', err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        err.message ||
        'Gagal menyimpan penilaian scoring';
      set({ errorProposals: errMsg, isLoadingProposals: false });
      throw new Error(errMsg);
    }
  },

  approveToResearch: (id, targetCompletionDate) => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => ({
      proposals: state.proposals.map((p) =>
        p.id === id
          ? {
              ...p,
              status: 'APPROVED',
              lastUpdated: today,
              studyData: p.studyData || {
                currentMilestone: 'PERSIAPAN',
                percentProgress: 10,
                milestoneNotes: 'Usulan disetujui, pembentukan tim riset dan rencana jadwal.',
                targetCompletionDate: targetCompletionDate || '2026-06-30',
                internalWorkingDocuments: [],
              },
            }
          : p
      ),
    }));
  },

  updateStudyMilestone: (id, milestone, percentProgress, notes) => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => ({
      proposals: state.proposals.map((p) => {
        if (p.id !== id) return p;
        const currentStudy = p.studyData || {
          currentMilestone: 'PERSIAPAN',
          percentProgress: 0,
          milestoneNotes: '',
          targetCompletionDate: '2026-06-30',
          internalWorkingDocuments: [],
        };
        const nextStatus = percentProgress >= 100 ? 'COMPLETED' : 'IN_PROGRESS';

        return {
          ...p,
          status: nextStatus,
          lastUpdated: today,
          studyData: {
            ...currentStudy,
            currentMilestone: milestone,
            percentProgress,
            milestoneNotes: notes,
          },
        };
      }),
    }));
  },

  updateStudyKakRka: (id, kakDocument, rkaDocument) => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => ({
      proposals: state.proposals.map((p) => {
        if (p.id !== id) return p;
        const currentStudy = p.studyData || {
          currentMilestone: 'PERSIAPAN',
          percentProgress: 15,
          milestoneNotes: 'Dokumen perencanaan KAK dan RKA riset telah disusun.',
          targetCompletionDate: '2026-06-30',
          internalWorkingDocuments: [],
        };
        return {
          ...p,
          lastUpdated: today,
          studyData: {
            ...currentStudy,
            kakDocument: kakDocument === null ? undefined : (kakDocument !== undefined ? kakDocument : currentStudy.kakDocument),
            rkaDocument: rkaDocument === null ? undefined : (rkaDocument !== undefined ? rkaDocument : currentStudy.rkaDocument),
          },
        };
      }),
    }));
  },

  addWorkingDocument: (id, doc) => {
    set((state) => ({
      proposals: state.proposals.map((p) => {
        if (p.id !== id) return p;
        const currentStudy = p.studyData || {
          currentMilestone: 'PENGUMPULAN_DATA',
          percentProgress: 30,
          milestoneNotes: '',
          targetCompletionDate: '2026-06-30',
          internalWorkingDocuments: [],
        };
        return {
          ...p,
          studyData: {
            ...currentStudy,
            internalWorkingDocuments: [doc, ...currentStudy.internalWorkingDocuments],
          },
        };
      }),
    }));
  },

  savePolicyBrief: (id, brief) => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => ({
      proposals: state.proposals.map((p) =>
        p.id === id
          ? {
              ...p,
              policyBriefDraft: brief,
              lastUpdated: today,
            }
          : p
      ),
    }));
  },

  sendToKepalaBrida: (id) => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => ({
      proposals: state.proposals.map((p) => {
        if (p.id !== id) return p;
        const brief = p.policyBriefDraft || {
          title: `Policy Brief: ${p.title}`,
          executiveSummary: 'Draf ringkasan kebijakan hasil telaah riset.',
          problemAnalysis: p.problemStatement,
          policyOptions: 'Rekomendasi tindakan terpadu.',
          actionRecommendations: 'Penerbitan instruksi bupati.',
          officialDraftNumber: `005/BRIDA/PB/${new Date().getFullYear()}`,
          draftLetterSubject: `Penyampaian Rekomendasi ${p.title}`,
          tteStatus: 'DRAFT',
        };

        const updatedBrief: PolicyBriefDraft = {
          ...brief,
          submittedToKepalaDate: today,
          tteStatus: 'PENDING_KEPALA_APPROVAL',
        };

        return {
          ...p,
          policyBriefDraft: updatedBrief,
          lastUpdated: today,
        };
      }),
    }));
  },

  // Study Management API Actions (Admin BRIDA)
  fetchStudies: async (params = {}) => {
    try {
      set({ isLoadingStudies: true, errorStudies: null });
      const res = await axiosInstance.get('/studies', { params });
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        set({ studies: data, isLoadingStudies: false });
        return data;
      }
      set({ isLoadingStudies: false });
      return get().studies;
    } catch (err: any) {
      console.error('Failed to fetch studies:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal memuat daftar kajian';
      set({ errorStudies: errMsg, isLoadingStudies: false });
      return get().studies;
    }
  },

  fetchApprovedProposals: async (params = {}) => {
    try {
      set({ isLoadingStudies: true, errorStudies: null });
      const res = await axiosInstance.get('/studies/approved-proposals', { params });
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        const normalized = data.map(normalizeProposal);
        set({ approvedProposals: normalized, isLoadingStudies: false });
        return normalized;
      }
      set({ isLoadingStudies: false });
      return get().approvedProposals;
    } catch (err: any) {
      console.error('Failed to fetch approved proposals for study:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal memuat usulan yang disetujui';
      set({ errorStudies: errMsg, isLoadingStudies: false });
      return get().approvedProposals;
    }
  },

  initializeStudy: async (proposalId: string, data = {}) => {
    try {
      set({ isLoadingStudies: true, errorStudies: null });
      const res = await axiosInstance.post(`/studies/initialize/${proposalId}`, data);
      const newStudy = res.data?.data || res.data;
      set((state) => ({
        studies: [newStudy, ...state.studies.filter((s) => s.id !== newStudy.id)],
        approvedProposals: state.approvedProposals.filter((p) => p.id !== proposalId),
        proposals: state.proposals.map((p) =>
          p.id === proposalId ? { ...p, status: 'IN_PROGRESS' } : p
        ),
        isLoadingStudies: false,
      }));
      return newStudy;
    } catch (err: any) {
      console.error('Failed to initialize study:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal menginisiasi kajian riset';
      set({ errorStudies: errMsg, isLoadingStudies: false });
      throw new Error(errMsg);
    }
  },

  fetchStudyById: async (id: string) => {
    try {
      set({ isLoadingStudies: true, errorStudies: null });
      const res = await axiosInstance.get(`/studies/${id}`);
      const study = res.data?.data || res.data;
      set({ currentStudy: study, isLoadingStudies: false });
      return study;
    } catch (err: any) {
      console.error('Failed to fetch study detail:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal memuat detail kajian';
      set({ errorStudies: errMsg, isLoadingStudies: false });
      throw new Error(errMsg);
    }
  },

  saveStudyKak: async (id: string, data) => {
    try {
      set({ isLoadingStudies: true, errorStudies: null });
      const res = await axiosInstance.put(`/studies/${id}/kak`, data);
      const kak = res.data?.data || res.data;
      set((state) => ({
        currentStudy: state.currentStudy && state.currentStudy.id === id
          ? { ...state.currentStudy, kakDocument: kak, hasKak: true, kakStatus: kak.status }
          : state.currentStudy,
        studies: state.studies.map((s) =>
          s.id === id ? { ...s, kakDocument: kak, hasKak: true, kakStatus: kak.status } : s
        ),
        isLoadingStudies: false,
      }));
      return kak;
    } catch (err: any) {
      console.error('Failed to save study KAK:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal menyimpan KAK digital';
      set({ errorStudies: errMsg, isLoadingStudies: false });
      throw new Error(errMsg);
    }
  },

  saveStudyRka: async (id: string, data) => {
    try {
      set({ isLoadingStudies: true, errorStudies: null });
      const res = await axiosInstance.post(`/studies/${id}/rka`, data);
      const rkaResult = res.data?.data || res.data;
      set((state) => ({
        currentStudy: state.currentStudy && state.currentStudy.id === id
          ? {
              ...state.currentStudy,
              rkaItems: rkaResult.items,
              totalRkaBudget: rkaResult.totalRkaBudget,
              remainingBudget: rkaResult.remainingBudget,
              isBudgetExceeded: rkaResult.remainingBudget < 0,
            }
          : state.currentStudy,
        studies: state.studies.map((s) =>
          s.id === id
            ? {
                ...s,
                rkaItems: rkaResult.items,
                totalRkaBudget: rkaResult.totalRkaBudget,
                remainingBudget: rkaResult.remainingBudget,
                isBudgetExceeded: rkaResult.remainingBudget < 0,
              }
            : s
        ),
        isLoadingStudies: false,
      }));
      return rkaResult;
    } catch (err: any) {
      console.error('Failed to save study RKA:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal menyimpan RKA belanja';
      set({ errorStudies: errMsg, isLoadingStudies: false });
      throw new Error(errMsg);
    }
  },

  saveStudyTeam: async (id: string, data) => {
    try {
      set({ isLoadingStudies: true, errorStudies: null });
      const res = await axiosInstance.post(`/studies/${id}/team`, data);
      const members = res.data?.data || res.data;
      set((state) => ({
        currentStudy: state.currentStudy && state.currentStudy.id === id
          ? { ...state.currentStudy, teamMembers: members, teamCount: members.length }
          : state.currentStudy,
        studies: state.studies.map((s) =>
          s.id === id ? { ...s, teamMembers: members, teamCount: members.length } : s
        ),
        isLoadingStudies: false,
      }));
      return members;
    } catch (err: any) {
      console.error('Failed to save study team:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal menyimpan tim peneliti';
      set({ errorStudies: errMsg, isLoadingStudies: false });
      throw new Error(errMsg);
    }
  },

  updateStudyStatus: async (id: string, status) => {
    try {
      set({ isLoadingStudies: true, errorStudies: null });
      const res = await axiosInstance.patch(`/studies/${id}/status`, { status });
      const updated = res.data?.data || res.data;
      set((state) => ({
        currentStudy: state.currentStudy && state.currentStudy.id === id
          ? { ...state.currentStudy, ...updated, status }
          : state.currentStudy,
        studies: state.studies.map((s) => (s.id === id ? { ...s, ...updated, status } : s)),
        proposals: state.proposals.map((p) =>
          updated.proposalId && p.id === updated.proposalId
            ? { ...p, status: status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS' }
            : p
        ),
        isLoadingStudies: false,
      }));
      return updated;
    } catch (err: any) {
      console.error('Failed to update study status:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal memperbarui status kajian';
      set({ errorStudies: errMsg, isLoadingStudies: false });
      throw new Error(errMsg);
    }
  },

  // Kepala BRIDA (Executive) Actions
  submitExecutiveApproval: async (proposalId, payload) => {
    try {
      set({ isLoadingProposals: true, errorProposals: null });
      const res = await axiosInstance.post(`/approvals/${proposalId}`, payload);
      const data = res.data?.data || res.data;
      const updatedProposal = data?.proposal;
      const approval = data?.approval;
      const today = new Date().toISOString().split('T')[0];

      set((state) => ({
        proposals: state.proposals.map((p) => {
          if (p.id !== proposalId) return p;
          if (updatedProposal?.id) {
            return normalizeProposal({
              ...p,
              ...updatedProposal,
              kepalaApproval: approval || updatedProposal.kepalaApproval,
            });
          }
          const nextStatus = payload.decision === 'APPROVED' ? 'APPROVED' : payload.decision === 'REJECTED' ? 'REJECTED' : 'IN_REVIEW';
          return {
            ...p,
            status: nextStatus,
            lastUpdated: today,
            executiveDecision: {
              decision: payload.decision,
              decidedAt: today,
              decidedBy: 'Kepala BRIDA',
              notes: payload.notes || undefined,
              approvedBudget: payload.approvedBudget !== null && payload.approvedBudget !== undefined ? Number(payload.approvedBudget) : undefined,
              fiscalYear: payload.fiscalYear || undefined,
              finalExecutionScheme: payload.finalExecutionScheme || undefined,
            },
          };
        }),
        isLoadingProposals: false,
      }));

      return res.data;
    } catch (err: any) {
      console.error('Failed to submit executive approval:', err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        err.message ||
        'Gagal memproses persetujuan Kepala BRIDA';
      set({ errorProposals: errMsg, isLoadingProposals: false });
      throw new Error(errMsg);
    }
  },

  executiveApproveProposal: async (id, notes, config) => {
    return get().submitExecutiveApproval(id, {
      decision: 'APPROVED',
      notes: notes || null,
      approvedBudget: config?.approvedBudget || null,
      fiscalYear: config?.fiscalYear || null,
      finalExecutionScheme: config?.finalExecutionScheme || null,
    });
  },

  executiveRejectProposal: async (id, reason) => {
    return get().submitExecutiveApproval(id, {
      decision: 'REJECTED',
      notes: reason || null,
    });
  },

  executiveReturnProposal: async (id, notes) => {
    return get().submitExecutiveApproval(id, {
      decision: 'REVISION_REQUIRED',
      notes: notes || null,
    });
  },

  addExecutiveGuidance: (id: string, guidanceText: string, stage = 'Monitoring Kajian') => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => ({
      proposals: state.proposals.map((p) => {
        if (p.id !== id) return p;
        const newGuidance = {
          id: `gd-${Date.now()}`,
          text: guidanceText,
          createdAt: today,
          createdBy: 'Kepala BRIDA (Dr. H. Bambang Suherman, M.Si.)',
          stage,
        };
        return {
          ...p,
          executiveGuidanceList: [newGuidance, ...(p.executiveGuidanceList || [])],
        };
      }),
    }));
  },

  signRecommendationTTE: (id: string, passphrase: string, signType = 'SINGLE') => {
    const today = new Date().toISOString().split('T')[0];
    const signatureHash = `BSRE-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString().slice(-6)}`;

    set((state) => ({
      proposals: state.proposals.map((p) => {
        if (p.id !== id) return p;

        const brief = p.policyBriefDraft || {
          title: `Policy Brief: ${p.title}`,
          executiveSummary: 'Rekomendasi kebijakan berbasis bukti telah disahkan.',
          problemAnalysis: p.problemStatement,
          policyOptions: 'Rekomendasi tindakan terpadu.',
          actionRecommendations: 'Penerbitan instruksi kepala daerah dan implementasi teknis.',
          officialDraftNumber: `070/BRIDA-MMK/${new Date().getFullYear()}/042`,
          draftLetterSubject: `Penyampaian Rekomendasi Kebijakan: ${p.title}`,
          tteStatus: 'TERVERIFIKASI_TTE',
        };

        return {
          ...p,
          status: 'COMPLETED',
          lastUpdated: today,
          policyBriefDraft: {
            ...brief,
            tteStatus: 'TERVERIFIKASI_TTE',
          },
          recommendationDoc: {
            title: brief.title,
            type: 'Policy Brief',
            date: today,
            fileSize: '3.8 MB',
            tteStatus: 'TERVERIFIKASI_TTE',
            signedBy: signType === 'MULTI_SEKDA' 
              ? 'Kepala BRIDA & Sekretaris Daerah Kab. Mimika (TTE BSrE)' 
              : 'Kepala BRIDA Kab. Mimika (TTE BSrE BSSN)',
            signatureHash,
          },
        };
      }),
    }));
  },

  // Recommendation API Actions
  fetchRecommendations: async (params = {}) => {
    try {
      set({ isLoadingRecommendations: true, errorRecommendations: null });
      const res = await axiosInstance.get('/recommendations', { params });
      const data = res.data?.data?.recommendations || res.data?.data || res.data || [];
      const list = Array.isArray(data) ? data : [];
      set({ recommendations: list, isLoadingRecommendations: false });
      return list;
    } catch (err: any) {
      console.error('Failed to fetch recommendations:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal memuat daftar rekomendasi kebijakan';
      set({ errorRecommendations: errMsg, isLoadingRecommendations: false });
      return get().recommendations;
    }
  },

  fetchAvailableStudiesForRec: async () => {
    try {
      set({ isLoadingRecommendations: true, errorRecommendations: null });
      const res = await axiosInstance.get('/recommendations/available-studies');
      const data = res.data?.data || res.data || [];
      const list = Array.isArray(data) ? data : [];
      set({ availableStudiesForRec: list, isLoadingRecommendations: false });
      return list;
    } catch (err: any) {
      console.error('Failed to fetch available studies for recommendations:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal memuat daftar kajian riset';
      set({ errorRecommendations: errMsg, isLoadingRecommendations: false });
      return get().availableStudiesForRec;
    }
  },

  fetchRecommendationById: async (id: string) => {
    try {
      set({ isLoadingRecommendations: true, errorRecommendations: null });
      const res = await axiosInstance.get(`/recommendations/${id}`);
      const data = res.data?.data || res.data;
      set({ currentRecommendation: data, isLoadingRecommendations: false });
      return data;
    } catch (err: any) {
      console.error('Failed to fetch recommendation by id:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal memuat detail rekomendasi kebijakan';
      set({ errorRecommendations: errMsg, isLoadingRecommendations: false });
      throw new Error(errMsg);
    }
  },

  createRecommendation: async (payload) => {
    try {
      set({ isLoadingRecommendations: true, errorRecommendations: null });
      const res = await axiosInstance.post('/recommendations', payload);
      const created = res.data?.data || res.data;
      set((state) => ({
        recommendations: [created, ...state.recommendations.filter((r) => r.id !== created.id)],
        currentRecommendation: created,
        isLoadingRecommendations: false,
      }));
      return created;
    } catch (err: any) {
      console.error('Failed to create recommendation:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || err.message || 'Gagal membuat rekomendasi kebijakan';
      set({ errorRecommendations: errMsg, isLoadingRecommendations: false });
      throw new Error(errMsg);
    }
  },

  updateRecommendation: async (id, payload) => {
    try {
      set({ isLoadingRecommendations: true, errorRecommendations: null });
      const res = await axiosInstance.put(`/recommendations/${id}`, payload);
      const updated = res.data?.data || res.data;
      set((state) => ({
        recommendations: state.recommendations.map((r) => (r.id === id ? { ...r, ...updated } : r)),
        currentRecommendation: updated,
        isLoadingRecommendations: false,
      }));
      return updated;
    } catch (err: any) {
      console.error('Failed to update recommendation:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || err.message || 'Gagal memperbarui rekomendasi kebijakan';
      set({ errorRecommendations: errMsg, isLoadingRecommendations: false });
      throw new Error(errMsg);
    }
  },

  submitRecommendationToKepala: async (id: string) => {
    try {
      set({ isLoadingRecommendations: true, errorRecommendations: null });
      const res = await axiosInstance.post(`/recommendations/${id}/submit`);
      const submitted = res.data?.data || res.data;
      set((state) => ({
        recommendations: state.recommendations.map((r) => (r.id === id ? { ...r, ...submitted, status: 'SUBMITTED' } : r)),
        currentRecommendation: submitted,
        isLoadingRecommendations: false,
      }));
      return submitted;
    } catch (err: any) {
      console.error('Failed to submit recommendation to Kepala BRIDA:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal mengajukan rekomendasi ke Kepala BRIDA';
      set({ errorRecommendations: errMsg, isLoadingRecommendations: false });
      throw new Error(errMsg);
    }
  },

  finalizeRecommendation: async (id: string, payload = {}) => {
    try {
      set({ isLoadingRecommendations: true, errorRecommendations: null });
      const res = await axiosInstance.post(`/recommendations/${id}/finalize`, payload);
      const finalized = res.data?.data || res.data;
      set((state) => ({
        recommendations: state.recommendations.map((r) => (r.id === id ? { ...r, ...finalized, status: 'FINALIZED' } : r)),
        currentRecommendation: finalized,
        isLoadingRecommendations: false,
      }));
      return finalized;
    } catch (err: any) {
      console.error('Failed to finalize recommendation:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal mengesahkan rekomendasi kebijakan';
      set({ errorRecommendations: errMsg, isLoadingRecommendations: false });
      throw new Error(errMsg);
    }
  },

  deleteRecommendation: async (id: string) => {
    try {
      set({ isLoadingRecommendations: true, errorRecommendations: null });
      await axiosInstance.delete(`/recommendations/${id}`);
      set((state) => ({
        recommendations: state.recommendations.filter((r) => r.id !== id),
        currentRecommendation: state.currentRecommendation?.id === id ? null : state.currentRecommendation,
        isLoadingRecommendations: false,
      }));
      return true;
    } catch (err: any) {
      console.error('Failed to delete recommendation:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal menghapus rekomendasi kebijakan';
      set({ errorRecommendations: errMsg, isLoadingRecommendations: false });
      throw new Error(errMsg);
    }
  },

  // TTE API Actions
  fetchTteInbox: async () => {
    try {
      set({ isLoadingTte: true, errorTte: null });
      const res = await axiosInstance.get('/tte/inbox');
      const items = res.data?.data?.items || res.data?.items || res.data?.data || [];
      const list = Array.isArray(items) ? items : [];
      set({ tteInbox: list, isLoadingTte: false });
      return list;
    } catch (err: any) {
      console.error('Failed to fetch TTE inbox:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal memuat antrean TTE';
      set({ errorTte: errMsg, isLoadingTte: false });
      return get().tteInbox;
    }
  },

  fetchTteHistory: async (params = {}) => {
    try {
      set({ isLoadingTte: true, errorTte: null });
      const res = await axiosInstance.get('/tte/history', { params });
      const logs = res.data?.data?.logs || res.data?.logs || res.data?.data || [];
      const list = Array.isArray(logs) ? logs : [];
      set({ tteHistory: list, isLoadingTte: false });
      return list;
    } catch (err: any) {
      console.error('Failed to fetch TTE history:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal memuat riwayat TTE';
      set({ errorTte: errMsg, isLoadingTte: false });
      return get().tteHistory;
    }
  },

  fetchTteDocumentDetail: async (documentType, id) => {
    try {
      set({ isLoadingTte: true, errorTte: null });
      const res = await axiosInstance.get(`/tte/detail/${documentType}/${id}`);
      const detail = res.data?.data || res.data;
      set({ currentTteDetail: detail, isLoadingTte: false });
      return detail;
    } catch (err: any) {
      console.error('Failed to fetch TTE document detail:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal memuat detail dokumen TTE';
      set({ errorTte: errMsg, isLoadingTte: false });
      throw new Error(errMsg);
    }
  },

  signTteDocument: async (payload) => {
    try {
      set({ isLoadingTte: true, errorTte: null });
      const res = await axiosInstance.post('/tte/sign', payload);
      const logResult = res.data?.data || res.data;
      set((state) => ({
        tteInbox: state.tteInbox.filter((item) => item.id !== payload.documentId),
        tteHistory: [logResult, ...state.tteHistory],
        isLoadingTte: false,
      }));
      return logResult;
    } catch (err: any) {
      console.error('Failed to sign document via TTE:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || err.message || 'Gagal menandatangani dokumen secara digital';
      set({ errorTte: errMsg, isLoadingTte: false });
      throw new Error(errMsg);
    }
  },

  verifyTteCertificate: async (certificateNumber: string) => {
    try {
      const res = await axiosInstance.get(`/tte/verify/${certificateNumber}`);
      return res.data?.data || res.data;
    } catch (err: any) {
      console.error('Failed to verify TTE certificate:', err);
      const errMsg = err.response?.data?.message || err.message || 'Sertifikat TTE tidak valid';
      throw new Error(errMsg);
    }
  },

  // Master Data Actions
  fetchUsers: async (params = {}) => {
    try {
      set({ isLoadingMaster: true, errorMaster: null });
      const res = await axiosInstance.get('/users', { params });
      const users = res.data?.data || res.data || [];
      const list = Array.isArray(users) ? users : [];
      const normalizedUsers: OpdUserAccount[] = list.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        opdName: u.opd?.name || (u.role === 'ADMIN_BRIDA' ? 'Admin Litbang BRIDA' : u.role === 'KEPALA_BRIDA' ? 'Kepala BRIDA' : 'Instansi OPD'),
        role: u.role,
        status: u.isActive ? 'ACTIVE' : 'INACTIVE',
        isActive: u.isActive,
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '2026-01-01',
      }));
      set({ opdUsers: normalizedUsers, isLoadingMaster: false });
      return normalizedUsers;
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      set({ errorMaster: err.message || 'Gagal memuat pengguna', isLoadingMaster: false });
      return get().opdUsers;
    }
  },

  addOpdUser: async (userData) => {
    try {
      set({ isLoadingMaster: true, errorMaster: null });
      const payload = {
        name: userData.name,
        email: userData.email,
        password: userData.password || 'password123',
        role: userData.role || 'OPD',
        opdId: userData.opdId || undefined,
        phone: userData.phone || undefined,
        nip: userData.nip || undefined,
      };
      const res = await axiosInstance.post('/users', payload);
      const created = res.data?.data || res.data;
      const newUser: OpdUserAccount = {
        id: created.id,
        name: created.name,
        email: created.email,
        opdName: created.opd?.name || userData.opdName || 'Instansi OPD',
        role: created.role,
        status: created.isActive ? 'ACTIVE' : 'INACTIVE',
        isActive: created.isActive,
        createdAt: new Date().toISOString().split('T')[0],
      };
      set((state) => ({
        opdUsers: [newUser, ...state.opdUsers.filter((u) => u.id !== newUser.id)],
        isLoadingMaster: false,
      }));
      return newUser;
    } catch (err: any) {
      console.error('Failed to create user:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal menambah user';
      set({ errorMaster: errMsg, isLoadingMaster: false });
      throw new Error(errMsg);
    }
  },

  deleteOpdUser: async (id) => {
    try {
      await axiosInstance.delete(`/users/${id}`);
      set((state) => ({
        opdUsers: state.opdUsers.filter((u) => u.id !== id),
      }));
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      set((state) => ({
        opdUsers: state.opdUsers.filter((u) => u.id !== id),
      }));
    }
  },

  toggleUserStatus: async (id, nextActive) => {
    try {
      const user = get().opdUsers.find((u) => u.id === id);
      const isActive = nextActive !== undefined ? nextActive : !(user?.status === 'ACTIVE' || user?.isActive);
      await axiosInstance.patch(`/users/${id}/status`, { isActive });
      set((state) => ({
        opdUsers: state.opdUsers.map((u) =>
          u.id === id ? { ...u, status: isActive ? 'ACTIVE' : 'INACTIVE', isActive } : u
        ),
      }));
    } catch (err: any) {
      console.error('Failed to toggle user status:', err);
      set((state) => ({
        opdUsers: state.opdUsers.map((u) =>
          u.id === id ? { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE', isActive: !u.isActive } : u
        ),
      }));
    }
  },

  addOpd: async (opdData) => {
    try {
      set({ isLoadingMaster: true, errorMaster: null });
      const res = await axiosInstance.post('/opds', opdData);
      const created = res.data?.data || res.data;
      set((state) => ({
        opds: [created, ...state.opds.filter((o) => o.id !== created.id)],
        isLoadingMaster: false,
      }));
      return created;
    } catch (err: any) {
      console.error('Failed to create OPD:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal menambah instansi OPD';
      set({ errorMaster: errMsg, isLoadingMaster: false });
      throw new Error(errMsg);
    }
  },

  addCategory: (categoryName) => {
    if (!categoryName.trim()) return;
    set((state) => {
      if (state.categories.includes(categoryName.trim())) return state;
      return { categories: [...state.categories, categoryName.trim()] };
    });
  },

  deleteCategory: (categoryName) => {
    set((state) => ({
      categories: state.categories.filter((c) => c !== categoryName),
    }));
  },

  toggleBudgetYear: (id) => {
    set((state) => ({
      budgetYears: state.budgetYears.map((b) =>
        b.id === id ? { ...b, status: b.status === 'OPEN' ? 'CLOSED' : 'OPEN' } : b
      ),
    }));
  },
}));
