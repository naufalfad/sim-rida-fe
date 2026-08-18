export type WorkflowStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ADMINISTRATIVE_REVIEW'
  | 'REVISION_REQUIRED'
  | 'SUBSTANTIVE_REVIEW'
  | 'SCORING'
  | 'SELECTION_RECOMMENDED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESERVE'
  | 'RESEARCHER_SELECTION'
  | 'RESEARCHER_APPROVAL'
  | 'IN_PROGRESS'
  | 'MONITORING'
  | 'REPORT_SUBMITTED'
  | 'REPORT_REVIEW'
  | 'REPORT_REVISION'
  | 'COMPLETED'
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
  ADMINISTRATIVE_REVIEW: 'ADMINISTRATIVE_REVIEW',
  REVISION_REQUIRED: 'REVISION_REQUIRED',
  SUBSTANTIVE_REVIEW: 'SUBSTANTIVE_REVIEW',
  SCORING: 'SCORING',
  SELECTION_RECOMMENDED: 'SELECTION_RECOMMENDED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  RESERVE: 'RESERVE',
  RESEARCHER_SELECTION: 'RESEARCHER_SELECTION',
  RESEARCHER_APPROVAL: 'RESEARCHER_APPROVAL',
  IN_PROGRESS: 'IN_PROGRESS',
  MONITORING: 'MONITORING',
  REPORT_SUBMITTED: 'REPORT_SUBMITTED',
  REPORT_REVIEW: 'REPORT_REVIEW',
  REPORT_REVISION: 'REPORT_REVISION',
  COMPLETED: 'COMPLETED',
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
  ADMINISTRATIVE_REVIEW: 'Verifikasi Administrasi',
  REVISION_REQUIRED: 'Butuh Revisi',
  SUBSTANTIVE_REVIEW: 'Review Substansi',
  SCORING: 'Penilaian/Scoring',
  SELECTION_RECOMMENDED: 'Rekomendasi Seleksi',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  RESERVE: 'Cadangan Riset',
  RESEARCHER_SELECTION: 'Seleksi Peneliti',
  RESEARCHER_APPROVAL: 'Persetujuan Peneliti',
  IN_PROGRESS: 'Pelaksanaan Penelitian',
  MONITORING: 'Monitoring',
  REPORT_SUBMITTED: 'Laporan Akhir Diajukan',
  REPORT_REVIEW: 'Review Laporan',
  REPORT_REVISION: 'Revisi Laporan',
  COMPLETED: 'Selesai Penelitian',
  POLICY_BRIEF_DRAFT: 'Draft Policy Brief',
  POLICY_BRIEF_REVIEW: 'Review Policy Brief',
  RECOMMENDATION_PENDING: 'Menunggu Rekomendasi',
  RECOMMENDATION_APPROVED: 'Rekomendasi Disahkan',
  FOLLOW_UP_PENDING: 'Menunggu Tindak Lanjut',
  FOLLOW_UP_IN_PROGRESS: 'Tindak Lanjut Berjalan',
  FOLLOW_UP_COMPLETED: 'Tindak Lanjut Selesai',
};

export const STATUS_COLORS: Record<WorkflowStatus, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700' },
  SUBMITTED: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/50' },
  ADMINISTRATIVE_REVIEW: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/50' },
  REVISION_REQUIRED: { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900/50' },
  SUBSTANTIVE_REVIEW: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-900/50' },
  SCORING: { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900/50' },
  SELECTION_RECOMMENDED: { bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-900/50' },
  APPROVED: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/50' },
  REJECTED: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-900/50' },
  RESERVE: { bg: 'bg-yellow-50 dark:bg-yellow-950/30', text: 'text-yellow-750 dark:text-yellow-405', border: 'border-yellow-200 dark:border-yellow-900/50' },
  RESEARCHER_SELECTION: { bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-900/50' },
  RESEARCHER_APPROVAL: { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-900/50' },
  IN_PROGRESS: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-900/50' },
  MONITORING: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-900/50' },
  REPORT_SUBMITTED: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/50' },
  REPORT_REVIEW: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/50' },
  REPORT_REVISION: { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900/50' },
  COMPLETED: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/50' },
  POLICY_BRIEF_DRAFT: { bg: 'bg-gray-50 dark:bg-gray-950/30', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-900/50' },
  POLICY_BRIEF_REVIEW: { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-900/50' },
  RECOMMENDATION_PENDING: { bg: 'bg-yellow-50 dark:bg-yellow-950/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-900/50' },
  RECOMMENDATION_APPROVED: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/50' },
  FOLLOW_UP_PENDING: { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900/50' },
  FOLLOW_UP_IN_PROGRESS: { bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-900/50' },
  FOLLOW_UP_COMPLETED: { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-900/50' },
};
