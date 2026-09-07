import { create } from 'zustand';

export type ProposalUrgency = 'TINGGI' | 'SEDANG' | 'RENDAH';
export type ExpectedOutput = 'Naskah Akademik Perda' | 'Rekomendasi Teknis' | 'Solusi Teknologi' | 'Kajian Kebijakan / Policy Brief' | 'Model / Blueprint';
export type ProposalStatus = 'DRAFT' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REVISION_REQUIRED';

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
  visionAlignmentScore: number; // 1-100 (Kesesuaian Visi-Misi Daerah)
  urgencyScore: number; // 1-100 (Urgensi Masalah)
  budgetFeasibilityScore: number; // 1-100 (Ketersediaan Anggaran / Kelayakan)
  totalScore: number; // calculated weighted average
  fieldClassification: 'Ekonomi' | 'Pemerintahan & Tata Kelola' | 'Sosial Budaya & Kesejahteraan' | 'Inovasi & Teknologi';
  executionMethod: ExecutionMethod;
  researchScheme?: 'INTERNAL_BRIDA' | 'KERJASAMA' | ExecutionMethod;
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
  };
  rkaDocument?: {
    name: string;
    size: string;
    uploadDate: string;
    budgetNominal?: number;
    url?: string;
  };
  internalWorkingDocuments: Array<{
    id: string;
    title: string;
    type: 'Data Mentah' | 'Laporan Antara' | 'Transkrip FGD / Wawancara' | 'Olah Data Statistik';
    uploadDate: string;
    fileSize: string;
  }>;
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

export interface OpdUserAccount {
  id: string;
  name: string;
  email: string;
  opdName: string;
  role: 'OPD' | 'ADMIN_BRIDA' | 'KEPALA_BRIDA';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
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
    decision: 'APPROVED' | 'REJECTED' | 'RETURNED';
    decidedAt: string;
    decidedBy: string;
    notes?: string;
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

interface OpdState {
  proposals: OpdProposal[];
  activeOpdName: string;
  selectedProposalId: string | null;
  
  // Master data states
  opdUsers: OpdUserAccount[];
  categories: string[];
  budgetYears: BudgetYearConfig[];

  // OPD Actions
  addProposal: (data: Omit<OpdProposal, 'id' | 'code' | 'createdAt' | 'lastUpdated' | 'opdName'>, isDraft: boolean) => string;
  updateProposal: (id: string, data: Partial<OpdProposal>) => void;
  submitDraft: (id: string) => void;
  deleteProposal: (id: string) => void;
  selectProposal: (id: string | null) => void;
  submitFollowUp: (id: string, followUp: NonNullable<OpdProposal['followUpReport']>) => void;
  getProposalById: (id: string) => OpdProposal | undefined;
  getTrackingSteps: (proposal: OpdProposal) => TrackingStep[];

  // Admin BRIDA Actions
  verifyProposal: (id: string, isComplete: boolean, verificationNotes: string, adminName: string) => void;
  returnToOpd: (id: string, revisionNotes: string, adminName: string) => void;
  saveScoring: (id: string, scoring: AdminScoringData) => void;
  approveToResearch: (id: string, targetCompletionDate: string) => void;
  updateStudyMilestone: (id: string, milestone: StudyManagementData['currentMilestone'], percentProgress: number, notes: string) => void;
  updateStudyKakRka: (
    id: string,
    kakDocument?: StudyManagementData['kakDocument'],
    rkaDocument?: StudyManagementData['rkaDocument']
  ) => void;
  addWorkingDocument: (id: string, doc: StudyManagementData['internalWorkingDocuments'][0]) => void;
  savePolicyBrief: (id: string, brief: PolicyBriefDraft) => void;
  sendToKepalaBrida: (id: string) => void;

  // Kepala BRIDA (Executive) Actions
  executiveApproveProposal: (id: string, notes?: string) => void;
  executiveRejectProposal: (id: string, reason: string) => void;
  executiveReturnProposal: (id: string, notes: string) => void;
  addExecutiveGuidance: (id: string, guidanceText: string, stage?: string) => void;
  signRecommendationTTE: (id: string, passphrase: string, signType?: 'SINGLE' | 'MULTI_SEKDA') => void;

  // Master Data Actions
  addOpdUser: (user: Omit<OpdUserAccount, 'id' | 'createdAt'>) => void;
  deleteOpdUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;
  addCategory: (categoryName: string) => void;
  deleteCategory: (categoryName: string) => void;
  toggleBudgetYear: (id: string) => void;
}

const INITIAL_PROPOSALS: OpdProposal[] = [
  {
    id: 'prop-opd-001',
    code: 'USUL-2026-001',
    opdName: 'Dinas Kesehatan Kab. Sleman',
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
      evaluatorNotes: 'Sangat selaras dengan program prioritas Sleman Sehat 2026.',
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
        { id: 'doc-w1', title: 'Hasil Olah Tabulasi Data Gizi Posyandu 17 Kecamatan', type: 'Olah Data Statistik', uploadDate: '12 Feb 2026', fileSize: '3.4 MB' },
        { id: 'doc-w2', title: 'Draf Laporan Antara Kajian Stunting Sleman', type: 'Laporan Antara', uploadDate: '20 Feb 2026', fileSize: '5.1 MB' }
      ]
    },
    recommendationDoc: {
      title: 'Policy Brief: Formula Intervensi Pangan Lokal dan Skema Posyandu Presisi untuk Eliminasi Stunting',
      type: 'Policy Brief',
      date: '01 Mar 2026',
      fileSize: '4.8 MB',
      tteStatus: 'TERVERIFIKASI_TTE',
      signedBy: 'Kepala BRIDA Kabupaten (TTE BSrE Bersertifikat)'
    },
    followUpReport: {
      utilizationSummary: 'Hasil rekomendasi intervensi pangan lokal telah diadopsi ke dalam Rencana Kerja (Renja) Dinas Kesehatan 2027 pada program PMT (Pemberian Makanan Tambahan) Posyandu.',
      utilizationType: 'Rencana Kerja (Renja)',
      submittedAt: '03 Mar 2026',
      satisfactionRating: 5,
      feedbackNotes: 'Kajian sangat tajam, solutif, dan data empirisnya mudah diaplikasikan langsung oleh tim teknis lapangan.'
    }
  },
  {
    id: 'prop-opd-002',
    code: 'USUL-2026-002',
    opdName: 'Dinas Komunikasi dan Informatika',
    title: 'Model Sistem Peringatan Dini Bencana Banjir Lahar Berbasis Sensor IoT dan AI',
    category: 'Infrastruktur & Teknologi',
    problemStatement: 'Sistem pemantauan debit air di sungai aliran lahar dingin Gunung Merapi saat ini masih mengandalkan pos manual, sehingga rentan terjadi keterlambatan evakuasi warga bantaran sungai saat curah hujan ekstrem di puncak.',
    urgencyReason: 'Menjelang musim hujan dengan intensitas tinggi, keselamatan puluhan ribu warga di sepanjang bantaran sungai menjadi prioritas utama.',
    urgencyLevel: 'TINGGI',
    expectedOutput: 'Solusi Teknologi',
    estimatedBudget: 150000000,
    torDocument: {
      name: 'TOR_Smart_EWS_Lahar_Diskominfo.pdf',
      size: '2.8 MB',
      uploadDate: '15 Feb 2026'
    },
    supportingDocuments: [
      { name: 'Peta_Titik_Rentan_Banjir_Lahar.pdf', size: '5.2 MB', uploadDate: '15 Feb 2026' }
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
      milestoneNotes: 'Pemasangan prototipe sensor telemetry di 3 pos pemantau hulu Kali Boyong dan Krasak.',
      targetCompletionDate: '2026-04-30',
      kakDocument: {
        name: 'KAK_Implementasi_EWS_Merapi_IoT.pdf',
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
        { id: 'doc-w3', title: 'Data Mentah Sensor Telemetry Curah Hujan & Debit', type: 'Data Mentah', uploadDate: '24 Feb 2026', fileSize: '8.2 MB' }
      ]
    },
    policyBriefDraft: {
      title: 'Policy Brief: Integrasi Sensor IoT dan Algoritma AI untuk Early Warning System Banjir Lahar Sleman',
      executiveSummary: 'Penerapan jaringan sensor cerdas berbiaya terjangkau mampu memangkas waktu respons peringatan dini evakuasi dari 45 menit menjadi kurang dari 5 menit.',
      problemAnalysis: 'Ketergantungan pada pemantauan visual pos pantau manual berisiko tinggi saat malam hari atau cuaca kabut tebal.',
      policyOptions: 'Opsi 1: Pemasangan sensor mandiri oleh Pemkab. Opsi 2: Kolaborasi multi-sektor BPBD, Diskominfo, dan BBWSO.',
      actionRecommendations: 'Penerbitan Kepbup tentang Standar Integrasi Data Telemetri Kebencanaan ke Sleman Command Center.',
      officialDraftNumber: '005/BRIDA/PB-EWS/2026',
      draftLetterSubject: 'Penyampaian Rekomendasi Teknis Sistem Peringatan Dini Lahar Berbasis IoT',
      tteStatus: 'DRAFT'
    }
  },
  {
    id: 'prop-opd-003',
    code: 'USUL-2026-003',
    opdName: 'Dinas Pendidikan',
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
      { name: 'Hasil_Survei_Literasi_Budaya_Siswa.pdf', size: '1.8 MB', uploadDate: '28 Feb 2026' }
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
    opdName: 'Dinas Koperasi dan UKM',
    title: 'Analisis Rantai Pasok dan Digitalisasi Pemasaran Produk UMKM Olahan Salak Pondoh',
    category: 'Ekonomi & Pariwisata',
    problemStatement: 'Petani dan UMKM olahan salak kerap mengalami anjlok harga saat panen raya akibat keterbatasan akses pasar luar daerah dan sistem logistik rantai dingin.',
    urgencyReason: 'Potensi kerugian ekonomi petani salak mencapai milyaran rupiah per musim panen raya.',
    urgencyLevel: 'SEDANG',
    expectedOutput: 'Kajian Kebijakan / Policy Brief',
    estimatedBudget: 50000000,
    torDocument: {
      name: 'KAK_Rantai_Pasok_Salak_Dinkop.pdf',
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
    opdName: 'Dinas Lingkungan Hidup',
    title: 'Optimalisasi Pengelolaan Sampah Organik Terdesentralisasi Melalui Biokonversi Maggot BSF',
    category: 'Lingkungan Hidup & Bencana',
    problemStatement: 'Kapasitas TPST regional hampir melampaui ambang batas operasional. Diperlukan skema operasional maggot BSF di tingkat kelurahan yang ekonomis dan berkelanjutan.',
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
    opdName: 'Dinas Pariwisata',
    title: 'Studi Kelayakan Pengembangan Desa Wisata Ramah Lansia (Silver Tourism)',
    category: 'Ekonomi & Pariwisata',
    problemStatement: 'Konsep awal desa wisata ramah lansia belum memiliki indikator aksesibilitas fisik dan kesiapan tenaga pendamping medis.',
    urgencyReason: 'Menangkap tren peningkatan wisatawan lansia pasca-pensiun.',
    urgencyLevel: 'RENDAH',
    expectedOutput: 'Model / Blueprint',
    supportingDocuments: [],
    status: 'DRAFT',
    createdAt: '2026-03-06',
    lastUpdated: '2026-03-06'
  }
];

const INITIAL_USERS: OpdUserAccount[] = [
  { id: 'usr-1', name: 'BAPPEDA Kab. Sleman', email: 'opd.bappeda@slemankab.go.id', opdName: 'Badan Perencanaan Pembangunan Daerah', role: 'OPD', status: 'ACTIVE', createdAt: '2026-01-10' },
  { id: 'usr-2', name: 'Dinas Kesehatan', email: 'dinkes@slemankab.go.id', opdName: 'Dinas Kesehatan Kab. Sleman', role: 'OPD', status: 'ACTIVE', createdAt: '2026-01-12' },
  { id: 'usr-3', name: 'Dinas Komunikasi & Informatika', email: 'diskominfo@slemankab.go.id', opdName: 'Dinas Kominfo', role: 'OPD', status: 'ACTIVE', createdAt: '2026-01-15' },
  { id: 'usr-4', name: 'Dinas Lingkungan Hidup', email: 'dlh@slemankab.go.id', opdName: 'Dinas Lingkungan Hidup', role: 'OPD', status: 'ACTIVE', createdAt: '2026-01-18' },
  { id: 'usr-5', name: 'Dinas Pendidikan', email: 'disdik@slemankab.go.id', opdName: 'Dinas Pendidikan', role: 'OPD', status: 'ACTIVE', createdAt: '2026-01-20' },
  { id: 'usr-6', name: 'Dinas Koperasi & UKM', email: 'dinkop@slemankab.go.id', opdName: 'Dinas Koperasi dan UKM', role: 'OPD', status: 'ACTIVE', createdAt: '2026-01-22' },
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
  activeOpdName: 'BAPPEDA & Perangkat Daerah Kab. Sleman',
  selectedProposalId: null,
  opdUsers: INITIAL_USERS,
  categories: INITIAL_CATEGORIES,
  budgetYears: INITIAL_BUDGET_YEARS,

  // OPD Actions
  addProposal: (data, isDraft) => {
    const state = get();
    const count = state.proposals.length + 1;
    const year = new Date().getFullYear();
    const code = `USUL-${year}-${String(count).padStart(3, '0')}`;
    const id = `prop-opd-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    const newProposal: OpdProposal = {
      ...data,
      id,
      code,
      opdName: state.activeOpdName,
      status: isDraft ? 'DRAFT' : 'PENDING',
      createdAt: today,
      submittedAt: isDraft ? undefined : today,
      lastUpdated: today,
    };

    set({
      proposals: [newProposal, ...state.proposals],
      selectedProposalId: id,
    });

    return id;
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

  submitFollowUp: (id, followUp) => {
    set((state) => ({
      proposals: state.proposals.map((p) =>
        p.id === id ? { ...p, followUpReport: followUp } : p
      ),
    }));
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
    else if (proposal.status === 'IN_REVIEW') activeIndex = 1;
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
  verifyProposal: (id, isComplete, verificationNotes, adminName) => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => ({
      proposals: state.proposals.map((p) =>
        p.id === id
          ? {
              ...p,
              status: isComplete ? 'IN_REVIEW' : 'PENDING',
              lastUpdated: today,
              adminVerification: {
                isDocumentsComplete: isComplete,
                verificationNotes,
                verifiedAt: today,
                verifiedBy: adminName || 'Admin BRIDA',
              },
              revisionNotes: undefined,
            }
          : p
      ),
    }));
  },

  returnToOpd: (id, revisionNotes, adminName) => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => ({
      proposals: state.proposals.map((p) =>
        p.id === id
          ? {
              ...p,
              status: 'DRAFT',
              lastUpdated: today,
              revisionNotes,
              adminVerification: {
                isDocumentsComplete: false,
                verificationNotes: `Dikembalikan ke OPD: ${revisionNotes}`,
                verifiedAt: today,
                verifiedBy: adminName || 'Admin BRIDA',
              },
            }
          : p
      ),
    }));
  },

  saveScoring: (id, scoring) => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => ({
      proposals: state.proposals.map((p) =>
        p.id === id
          ? {
              ...p,
              scoringData: scoring,
              lastUpdated: today,
            }
          : p
      ),
    }));
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
            kakDocument: kakDocument !== undefined ? kakDocument : currentStudy.kakDocument,
            rkaDocument: rkaDocument !== undefined ? rkaDocument : currentStudy.rkaDocument,
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

  // Kepala BRIDA (Executive) Actions
  executiveApproveProposal: (id: string, notes?: string) => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => ({
      proposals: state.proposals.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          status: 'IN_PROGRESS',
          lastUpdated: today,
          executiveDecision: {
            decision: 'APPROVED',
            decidedAt: today,
            decidedBy: 'Kepala BRIDA (Dr. H. Bambang Suherman, M.Si.)',
            notes: notes || 'Disetujui untuk dilaksanakan sebagai agenda riset prioritas daerah.',
          },
          studyData: p.studyData || {
            currentMilestone: 'PERSIAPAN',
            percentProgress: 15,
            milestoneNotes: 'Kajian telah disetujui Kepala BRIDA dan masuk tahap persiapan instrumen.',
            targetCompletionDate: '30 November 2026',
            internalWorkingDocuments: [],
          },
        };
      }),
    }));
  },

  executiveRejectProposal: (id: string, reason: string) => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => ({
      proposals: state.proposals.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          status: 'REVISION_REQUIRED',
          revisionNotes: reason,
          lastUpdated: today,
          executiveDecision: {
            decision: 'REJECTED',
            decidedAt: today,
            decidedBy: 'Kepala BRIDA (Dr. H. Bambang Suherman, M.Si.)',
            notes: reason,
          },
        };
      }),
    }));
  },

  executiveReturnProposal: (id: string, notes: string) => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => ({
      proposals: state.proposals.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          status: 'IN_REVIEW',
          revisionNotes: `[Catatan Kepala BRIDA untuk Staff Peneliti]: ${notes}`,
          lastUpdated: today,
          executiveDecision: {
            decision: 'RETURNED',
            decidedAt: today,
            decidedBy: 'Kepala BRIDA (Dr. H. Bambang Suherman, M.Si.)',
            notes,
          },
        };
      }),
    }));
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
          officialDraftNumber: `070/BRIDA-SLM/${new Date().getFullYear()}/042`,
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
              ? 'Kepala BRIDA & Sekretaris Daerah Kab. Sleman (TTE BSrE)' 
              : 'Kepala BRIDA Kab. Sleman (TTE BSrE BSSN)',
            signatureHash,
          },
        };
      }),
    }));
  },

  // Master Data Actions
  addOpdUser: (userData) => {
    const today = new Date().toISOString().split('T')[0];
    const newUser: OpdUserAccount = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: today,
    };
    set((state) => ({
      opdUsers: [newUser, ...state.opdUsers],
    }));
  },

  deleteOpdUser: (id) => {
    set((state) => ({
      opdUsers: state.opdUsers.filter((u) => u.id !== id),
    }));
  },

  toggleUserStatus: (id) => {
    set((state) => ({
      opdUsers: state.opdUsers.map((u) =>
        u.id === id ? { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : u
      ),
    }));
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
