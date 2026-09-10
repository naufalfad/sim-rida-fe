export type WorkflowStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PROBLEM_SUBMITTED'
  | 'VALID'
  | 'ADMINISTRATIVE_REVIEW'
  | 'REVISION_REQUIRED'
  | 'SUBSTANTIVE_REVIEW'
  | 'SCORING'
  | 'SELECTION_RECOMMENDED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESERVE'
  // --- Alur E-Katalog (menggantikan alur peneliti/mitra) ---
  | 'EKATALOG_SENT'
  | 'OPD_IMPLEMENTING'
  | 'OPD_REPORTED'
  // --- Lanjutan Policy Brief & Rekomendasi ---
  | 'POLICY_BRIEF_DRAFT'
  | 'POLICY_BRIEF_REVIEW'
  | 'RECOMMENDATION_PENDING'
  | 'RECOMMENDATION_APPROVED'
  | 'FOLLOW_UP_PENDING'
  | 'FOLLOW_UP_IN_PROGRESS'
  | 'FOLLOW_UP_COMPLETED';

export const WORKFLOW_STATUS: Record<WorkflowStatus, WorkflowStatus> = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  PROBLEM_SUBMITTED: 'PROBLEM_SUBMITTED',
  VALID: 'VALID',
  ADMINISTRATIVE_REVIEW: 'ADMINISTRATIVE_REVIEW',
  REVISION_REQUIRED: 'REVISION_REQUIRED',
  SUBSTANTIVE_REVIEW: 'SUBSTANTIVE_REVIEW',
  SCORING: 'SCORING',
  SELECTION_RECOMMENDED: 'SELECTION_RECOMMENDED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  RESERVE: 'RESERVE',
  EKATALOG_SENT: 'EKATALOG_SENT',
  OPD_IMPLEMENTING: 'OPD_IMPLEMENTING',
  OPD_REPORTED: 'OPD_REPORTED',
  POLICY_BRIEF_DRAFT: 'POLICY_BRIEF_DRAFT',
  POLICY_BRIEF_REVIEW: 'POLICY_BRIEF_REVIEW',
  RECOMMENDATION_PENDING: 'RECOMMENDATION_PENDING',
  RECOMMENDATION_APPROVED: 'RECOMMENDATION_APPROVED',
  FOLLOW_UP_PENDING: 'FOLLOW_UP_PENDING',
  FOLLOW_UP_IN_PROGRESS: 'FOLLOW_UP_IN_PROGRESS',
  FOLLOW_UP_COMPLETED: 'FOLLOW_UP_COMPLETED',
};

export const STATUS_LABELS: Record<WorkflowStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Diajukan',
  PROBLEM_SUBMITTED: 'Diajukan',
  VALID: 'Lolos Validasi',
  ADMINISTRATIVE_REVIEW: 'Verifikasi Administrasi',
  REVISION_REQUIRED: 'Butuh Revisi',
  SUBSTANTIVE_REVIEW: 'Review Substansi',
  SCORING: 'Penilaian/Scoring',
  SELECTION_RECOMMENDED: 'Rekomendasi Seleksi',
  APPROVED: 'Disetujui Seleksi',
  REJECTED: 'Ditolak',
  RESERVE: 'Cadangan',
  EKATALOG_SENT: 'E-Katalog Dikirim',
  OPD_IMPLEMENTING: 'OPD Sedang Implementasi',
  OPD_REPORTED: 'Laporan OPD Diterima',
  POLICY_BRIEF_DRAFT: 'Draft Policy Brief',
  POLICY_BRIEF_REVIEW: 'Review Policy Brief',
  RECOMMENDATION_PENDING: 'Menunggu Rekomendasi Bupati',
  RECOMMENDATION_APPROVED: 'Rekomendasi Disahkan',
  FOLLOW_UP_PENDING: 'Menunggu Tindak Lanjut',
  FOLLOW_UP_IN_PROGRESS: 'Tindak Lanjut Berjalan',
  FOLLOW_UP_COMPLETED: 'Tindak Lanjut Selesai',
};

export const STATUS_COLORS: Record<WorkflowStatus, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  SUBMITTED: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
  PROBLEM_SUBMITTED: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
  VALID: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700' },
  ADMINISTRATIVE_REVIEW: { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' },
  REVISION_REQUIRED: { bg: 'bg-slate-200', text: 'text-slate-900', border: 'border-slate-400' },
  SUBSTANTIVE_REVIEW: { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' },
  SCORING: { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' },
  SELECTION_RECOMMENDED: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700' },
  APPROVED: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700' },
  REJECTED: { bg: 'bg-slate-800', text: 'text-white', border: 'border-black' },
  RESERVE: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  EKATALOG_SENT: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  OPD_IMPLEMENTING: { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' },
  OPD_REPORTED: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  POLICY_BRIEF_DRAFT: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  POLICY_BRIEF_REVIEW: { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' },
  RECOMMENDATION_PENDING: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
  RECOMMENDATION_APPROVED: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700' },
  FOLLOW_UP_PENDING: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
  FOLLOW_UP_IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' },
  FOLLOW_UP_COMPLETED: { bg: 'bg-blue-700', text: 'text-white', border: 'border-blue-800' },
};
