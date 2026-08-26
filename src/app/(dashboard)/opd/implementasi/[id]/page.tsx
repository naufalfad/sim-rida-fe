


'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { proposalService } from '@/lib/api/proposals';
import { Proposal, OpdMonitoringLog, OpdReport } from '@/types/proposals';
import { STATUS_LABELS, STATUS_COLORS } from '@/constants/status';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';

type Tab = 'overview' | 'monitoring' | 'laporan';

export default function OpdImplementasiDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Issues Form States
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [issueDesc, setIssueDesc] = useState('');
  const [issueSeverity, setIssueSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [isIssueSaving, setIsIssueSaving] = useState(false);

  // Risks Form States
  const [isRiskDialogOpen, setIsRiskDialogOpen] = useState(false);
  const [riskDesc, setRiskDesc] = useState('');
  const [riskMitigation, setRiskMitigation] = useState('');
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [isRiskSaving, setIsRiskSaving] = useState(false);

  // Monitoring log form
  const [logForm, setLogForm] = useState({ description: '', progress: 0, evidenceFile: '' });

  // Final report form
  const [reportForm, setReportForm] = useState<Omit<OpdReport, 'submittedAt'>>({
    title: '',
    findings: '',
    obstacles: '',
    opdRecommendation: '',
    attachments: [],
  });
  const [reportConfirm, setReportConfirm] = useState(false);

  // Resolve issue handler
  const handleResolveIssue = async (issueId: string) => {
    try {
      const updated = await proposalService.resolveProjectIssue(id as string, issueId);
      if (updated) {
        setProposal(updated);
        toast('Kendala berhasil ditandai selesai (RESOLVED).', 'success');
      }
    } catch {
      toast('Gagal menyelesaikan kendala.', 'error');
    }
  };

  // Add issue handler
  const handleAddIssue = async () => {
    if (!issueDesc) {
      toast('Mohon tulis deskripsi kendala.', 'error');
      return;
    }

    setIsIssueSaving(true);
    try {
      const updated = await proposalService.addProjectIssue(id as string, issueDesc, issueSeverity);
      if (updated) {
        setProposal(updated);
        setIssueDesc('');
        setIsIssueDialogOpen(false);
        toast('Kendala riset baru berhasil dicatat.', 'success');
      }
    } catch {
      toast('Gagal mencatat kendala.', 'error');
    } finally {
      setIsIssueSaving(false);
    }
  };

  // Add risk handler
  const handleAddRisk = async () => {
    if (!riskDesc || !riskMitigation) {
      toast('Mohon lengkapi deskripsi risiko dan rencana mitigasi.', 'error');
      return;
    }

    setIsRiskSaving(true);
    try {
      const updated = await proposalService.addProjectRisk(id as string, riskDesc, riskMitigation, riskLevel);
      if (updated) {
        setProposal(updated);
        setRiskDesc('');
        setRiskMitigation('');
        setIsRiskDialogOpen(false);
        toast('Analisis risiko baru berhasil ditambahkan.', 'success');
      }
    } catch {
      toast('Gagal menambahkan risiko.', 'error');
    } finally {
      setIsRiskSaving(false);
    }
  };

  useEffect(() => {
    const loadDetails = async () => {
      if (id) {
        try {
          const p = await proposalService.getProposalById(id as string);
          setProposal(p || null);
        } catch (err) {
          console.error('Failed to load proposal details:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadDetails();
  }, [id]);

  const handleSubmitLog = async () => {
    if (!logForm.description.trim() || logForm.progress < 0) return;
    setSubmitting(true);
    const updated = await proposalService.submitOpdMonitoringLog(id as string, {
      description: logForm.description,
      progress: logForm.progress,
      evidenceFile: logForm.evidenceFile || undefined,
    });
    if (updated) {
      setProposal(updated);
      setLogForm({ description: '', progress: 0, evidenceFile: '' });
      setSuccessMsg('Log monitoring berhasil ditambahkan!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setSubmitting(false);
  };

  const handleSubmitReport = async () => {
    if (!reportForm.title.trim() || !reportForm.findings.trim()) return;
    setSubmitting(true);
    const updated = await proposalService.submitOpdFinalReport(id as string, reportForm);
    if (updated) {
      setProposal(updated);
      setSuccessMsg('Laporan akhir berhasil diserahkan ke BRIDA!');
      setActiveTab('overview');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
    setSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center text-gray-400">
          <p>Memuat detail implementasi...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">🔍</div>
          <p>Proposal tidak ditemukan</p>
          <Link href="/opd/implementasi" className="text-sky-500 text-sm mt-2 inline-block">
            ← Kembali
          </Link>
        </div>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[proposal.status];
  const canSubmitLog =
    proposal.status === 'EKATALOG_SENT' || proposal.status === 'OPD_IMPLEMENTING';
  const canSubmitReport =
    proposal.status === 'OPD_IMPLEMENTING' || proposal.status === 'EKATALOG_SENT';
  const reportAlreadySubmitted = !!proposal.opdReport;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '📋' },
    { key: 'monitoring', label: 'Log Monitoring', icon: '📊' },
    { key: 'laporan', label: 'Laporan Akhir', icon: '📄' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        href="/opd/implementasi"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        ← Kembali ke Daftar Implementasi
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-mono text-gray-400">{proposal.id}</span>
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
              >
                {STATUS_LABELS[proposal.status]}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{proposal.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{proposal.opdName}</p>
          </div>
        </div>

        {/* E-Katalog Info */}
        {proposal.eKatalogUrl && (
          <div className="mt-4 p-4 bg-sky-50 dark:bg-sky-950/30 rounded-lg border border-sky-200 dark:border-sky-900/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sky-600 dark:text-sky-400 font-semibold text-sm">🔗 Link E-Katalog LKPP</span>
            </div>
            <a
              href={proposal.eKatalogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 dark:text-sky-400 text-sm underline break-all hover:text-sky-700"
            >
              {proposal.eKatalogUrl}
            </a>
            {proposal.eKatalogDesc && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{proposal.eKatalogDesc}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
              {proposal.eKatalogSentAt && (
                <span>
                  📅 Dikirim:{' '}
                  {new Date(proposal.eKatalogSentAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              )}
              {proposal.eKatalogDeadline && (
                <span>
                  ⏰ Deadline:{' '}
                  {new Date(proposal.eKatalogDeadline).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Progress Keseluruhan</span>
            <span className="font-semibold">{proposal.progress}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${proposal.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg p-3 text-emerald-700 dark:text-emerald-400 text-sm font-medium flex items-center gap-2">
          ✅ {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              id={`tab-opd-impl-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-b-2 border-sky-500'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* === OVERVIEW TAB === */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {/* Timeline */}
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Timeline Proses</h3>
              <div className="space-y-2">
                {proposal.timeline.map((step, idx) => {
                  const sc = STATUS_COLORS[step.status] ?? STATUS_COLORS['DRAFT'];
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                          step.isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-500'
                        }`}
                      >
                        {step.isCompleted ? '✓' : idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{step.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {step.date} · {step.actor}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                        {STATUS_LABELS[step.status] ?? step.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Latest monitoring summary */}
            {proposal.opdMonitoringLogs && proposal.opdMonitoringLogs.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Log Monitoring Terakhir
                </h3>
                <div className="p-4 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg border border-cyan-200 dark:border-cyan-900/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {proposal.opdMonitoringLogs[proposal.opdMonitoringLogs.length - 1].date}
                    </span>
                    <span className="font-bold text-cyan-700 dark:text-cyan-400">
                      {proposal.opdMonitoringLogs[proposal.opdMonitoringLogs.length - 1].progress}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {proposal.opdMonitoringLogs[proposal.opdMonitoringLogs.length - 1].description}
                  </p>
                </div>
              </div>
            )}

            {/* Final report summary */}
            {proposal.opdReport && (
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Laporan Akhir
                </h3>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900/50 space-y-3">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300">{proposal.opdReport.title}</p>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Temuan Utama</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{proposal.opdReport.findings}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Hambatan</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{proposal.opdReport.obstacles}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Rekomendasi OPD</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{proposal.opdReport.opdRecommendation}</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Diserahkan:{' '}
                    {new Date(proposal.opdReport.submittedAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === MONITORING TAB === */}
        {activeTab === 'monitoring' && (
          <div className="p-6 space-y-6">
            {/* Existing logs */}
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Riwayat Log Monitoring ({proposal.opdMonitoringLogs?.length ?? 0} entri)
              </h3>
              {!proposal.opdMonitoringLogs || proposal.opdMonitoringLogs.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Belum ada log monitoring. Tambahkan log pertama Anda.</p>
              ) : (
                <div className="space-y-3">
                  {[...(proposal.opdMonitoringLogs)].reverse().map((log: OpdMonitoringLog) => (
                    <div
                      key={log.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{log.date}</span>
                        <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{log.progress}%</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{log.description}</p>
                      {log.evidenceFile && (
                        <p className="text-xs text-sky-500 mt-1">📎 {log.evidenceFile}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add monitoring log form */}
            {canSubmitLog && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">+ Tambah Log Monitoring</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Progress Implementasi ({logForm.progress}%)
                    </label>
                    <input
                      id="log-progress"
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={logForm.progress}
                      onChange={(e) => setLogForm((f) => ({ ...f, progress: Number(e.target.value) }))}
                      className="w-full mt-1 accent-sky-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>0%</span>
                      <span className="font-semibold text-sky-600 dark:text-sky-400">{logForm.progress}%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Deskripsi Kemajuan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="log-description"
                      rows={3}
                      value={logForm.description}
                      onChange={(e) => setLogForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Jelaskan kemajuan implementasi yang telah dicapai..."
                      className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">File Bukti (opsional)</label>
                    <input
                      id="log-evidence-file"
                      type="text"
                      value={logForm.evidenceFile}
                      onChange={(e) => setLogForm((f) => ({ ...f, evidenceFile: e.target.value }))}
                      placeholder="Contoh: progress_report_minggu2.pdf"
                      className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    id="btn-submit-log"
                    onClick={handleSubmitLog}
                    disabled={submitting || !logForm.description.trim()}
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                  >
                    {submitting ? 'Menyimpan...' : '📊 Submit Log Monitoring'}
                  </button>
                </div>
              </div>
            )}

            {!canSubmitLog && (
              <p className="text-sm text-gray-400 italic text-center py-4">
                {proposal.status === 'OPD_REPORTED'
                  ? 'Laporan akhir sudah diserahkan. Log monitoring tidak dapat ditambahkan.'
                  : 'Log monitoring hanya dapat ditambahkan saat status E-Katalog Diterima atau Sedang Implementasi.'}
              </p>
            )}

            {/* Issues and Risks Sections for OPD */}
            <div className="grid gap-6 md:grid-cols-2 border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              {/* Issues Register */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-150 dark:border-gray-700 pb-2">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-250">
                    Kendala Teknis Pelaksanaan (Issues Register)
                  </h3>
                  {canSubmitLog && (
                    <button
                      type="button"
                      onClick={() => setIsIssueDialogOpen(true)}
                      className="px-2 py-1 text-2xs font-semibold text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/20 rounded border border-sky-200 flex items-center gap-1"
                    >
                      <PlusCircle className="h-3 w-3" />
                      <span>Catat Kendala</span>
                    </button>
                  )}
                </div>

                {(!proposal.issues || proposal.issues.length === 0) ? (
                  <p className="text-xs text-gray-400 italic py-4">
                    Tidak ada kendala teknis yang dilaporkan.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                    {proposal.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className={`p-3 border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs ${
                          issue.status === 'RESOLVED'
                            ? 'bg-gray-50/50 border-gray-100 opacity-60 dark:bg-gray-900/20 dark:border-gray-800'
                            : issue.severity === 'HIGH'
                            ? 'bg-red-50/10 border-red-200 dark:border-red-950/20'
                            : 'bg-amber-50/10 border-amber-200 dark:border-amber-950/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              issue.status === 'RESOLVED'
                                ? 'bg-gray-100 text-gray-600'
                                : issue.severity === 'HIGH'
                                ? 'bg-red-150 text-red-750 dark:bg-red-950/40 dark:text-red-400'
                                : 'bg-amber-150 text-amber-750 dark:bg-amber-950/40 dark:text-amber-400'
                            }`}>
                              {issue.severity}
                            </span>
                            <span className="text-[10px] text-gray-400">{issue.dateReported}</span>
                          </div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200 mt-1.5">
                            {issue.description}
                          </p>
                        </div>

                        {issue.status === 'OPEN' && canSubmitLog && (
                          <button
                            type="button"
                            onClick={() => handleResolveIssue(issue.id)}
                            className="px-2.5 py-1 text-3xs font-bold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded self-end sm:self-center bg-white dark:bg-gray-900"
                          >
                            Selesaikan
                          </button>
                        )}
                        {issue.status === 'RESOLVED' && (
                          <span className="text-3xs font-bold text-emerald-600 flex items-center gap-0.5">
                            ✓ Teratasi
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Risks Analysis Register */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-150 dark:border-gray-700 pb-2">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-250">
                    Manajemen Risiko & Mitigasi (Risk Register)
                  </h3>
                  {canSubmitLog && (
                    <button
                      type="button"
                      onClick={() => setIsRiskDialogOpen(true)}
                      className="px-2 py-1 text-2xs font-semibold text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/20 rounded border border-sky-200 flex items-center gap-1"
                    >
                      <PlusCircle className="h-3 w-3" />
                      <span>Tambah Risiko</span>
                    </button>
                  )}
                </div>

                {(!proposal.risks || proposal.risks.length === 0) ? (
                  <p className="text-xs text-gray-400 italic py-4">
                    Belum ada analisis risiko yang ditambahkan.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                    {proposal.risks.map((risk) => (
                      <div
                        key={risk.id}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-900/20 text-xs space-y-2"
                      >
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-gray-400 text-[10px] font-mono">{risk.id}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                            risk.riskLevel === 'HIGH'
                              ? 'bg-red-100 text-red-750 dark:bg-red-950/40 dark:text-red-400'
                              : risk.riskLevel === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-755 dark:bg-amber-950/40 dark:text-amber-400'
                              : 'bg-gray-150 text-gray-600 dark:bg-gray-800'
                          }`}>
                            Risiko: {risk.riskLevel}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-gray-800 dark:text-gray-250">Pernyataan Risiko:</span>
                          <p className="text-gray-600 dark:text-gray-350 mt-0.5 leading-relaxed">{risk.description}</p>
                        </div>
                        <div className="pt-2 border-t dark:border-gray-800">
                          <span className="font-bold text-sky-600 dark:text-sky-400">Rencana Mitigasi:</span>
                          <p className="text-gray-600 dark:text-gray-350 mt-0.5 leading-relaxed">{risk.mitigation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === LAPORAN TAB === */}
        {activeTab === 'laporan' && (
          <div className="p-6 space-y-5">
            {reportAlreadySubmitted ? (
              <div className="p-5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900/50 text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">Laporan Akhir Sudah Diserahkan</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Laporan Anda sedang diproses oleh BRIDA.
                </p>
              </div>
            ) : canSubmitReport ? (
              <>
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/50">
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                    ⚠ Laporan akhir hanya dapat diserahkan sekali. Pastikan semua informasi sudah lengkap sebelum submit.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Judul Laporan <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="report-title"
                    type="text"
                    value={reportForm.title}
                    onChange={(e) => setReportForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Contoh: Laporan Implementasi Sistem Transportasi Listrik 2026"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Temuan Utama Implementasi <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="report-findings"
                    rows={4}
                    value={reportForm.findings}
                    onChange={(e) => setReportForm((f) => ({ ...f, findings: e.target.value }))}
                    placeholder="Jelaskan hasil dan temuan utama selama implementasi solusi dari E-Katalog..."
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hambatan yang Dihadapi <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="report-obstacles"
                    rows={3}
                    value={reportForm.obstacles}
                    onChange={(e) => setReportForm((f) => ({ ...f, obstacles: e.target.value }))}
                    placeholder="Jelaskan kendala atau hambatan yang ditemui selama implementasi..."
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Rekomendasi dari OPD <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="report-recommendation"
                    rows={3}
                    value={reportForm.opdRecommendation}
                    onChange={(e) => setReportForm((f) => ({ ...f, opdRecommendation: e.target.value }))}
                    placeholder="Saran dan rekomendasi OPD untuk perbaikan atau keberlanjutan program..."
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <input
                    id="report-confirm"
                    type="checkbox"
                    checked={reportConfirm}
                    onChange={(e) => setReportConfirm(e.target.checked)}
                    className="mt-0.5 accent-sky-500"
                  />
                  <label htmlFor="report-confirm" className="text-sm text-gray-600 dark:text-gray-400">
                    Saya menyatakan bahwa laporan ini adalah akurat dan merupakan hasil implementasi yang sebenarnya.
                    Laporan ini tidak dapat diubah setelah diserahkan.
                  </label>
                </div>

                <button
                  id="btn-submit-report"
                  onClick={handleSubmitReport}
                  disabled={
                    submitting ||
                    !reportForm.title.trim() ||
                    !reportForm.findings.trim() ||
                    !reportForm.obstacles.trim() ||
                    !reportForm.opdRecommendation.trim() ||
                    !reportConfirm
                  }
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                >
                  {submitting ? 'Menyerahkan laporan...' : '📤 Serahkan Laporan Akhir ke BRIDA'}
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-400 italic text-center py-4">
                Laporan hanya dapat diserahkan saat status E-Katalog Diterima atau Sedang Implementasi.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Add Issue Dialog */}
      <Dialog
        isOpen={isIssueDialogOpen}
        onClose={() => setIsIssueDialogOpen(false)}
        title="Catat Kendala Riset Baru"
        description="Catat kendala teknis atau birokrasi lapangan yang menghambat pengumpulan data riset."
        footer={
          <>
            <button 
              type="button"
              onClick={handleAddIssue} 
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-xs" 
              disabled={isIssueSaving}
            >
              {isIssueSaving ? 'Menyimpan...' : 'Simpan Kendala'}
            </button>
            <button 
              type="button"
              onClick={() => setIsIssueDialogOpen(false)} 
              className="px-4 py-2 border border-gray-350 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors text-xs dark:border-gray-650 dark:text-gray-250 dark:hover:bg-gray-800"
            >
              Batal
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Deskripsi Kendala / Masalah Lapangan"
            placeholder="Jelaskan secara ringkas kejadian kendala teknis..."
            value={issueDesc}
            onChange={(e) => setIssueDesc(e.target.value)}
            rows={3}
          />

          <Select
            label="Tingkat Keparahan (Severity)"
            options={[
              { value: 'LOW', label: 'Low (Rendah / Penundaan Minor)' },
              { value: 'MEDIUM', label: 'Medium (Sedang / Menghambat Kerja)' },
              { value: 'HIGH', label: 'High (Kritis / Membutuhkan Rapat Koordinasi)' },
            ]}
            value={issueSeverity}
            onChange={(e) => setIssueSeverity(e.target.value as any)}
            className="bg-white dark:bg-slate-950 dark:border-slate-800 border-slate-300"
          />
        </div>
      </Dialog>

      {/* Add Risk Dialog */}
      <Dialog
        isOpen={isRiskDialogOpen}
        onClose={() => setIsRiskDialogOpen(false)}
        title="Identifikasi Analisis Risiko"
        description="Prediksikan risiko eksternal (sosial, cuaca, kebijakan) beserta rencana mitigasi taktisnya."
        footer={
          <>
            <button 
              type="button"
              onClick={handleAddRisk} 
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-xs" 
              disabled={isRiskSaving}
            >
              {isRiskSaving ? 'Menyimpan...' : 'Simpan Risiko'}
            </button>
            <button 
              type="button"
              onClick={() => setIsRiskDialogOpen(false)} 
              className="px-4 py-2 border border-gray-350 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors text-xs dark:border-gray-650 dark:text-gray-250 dark:hover:bg-gray-800"
            >
              Batal
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Deskripsi Risiko (Risk Statement)"
            placeholder="Contoh: Terjadi fluktuasi penolakan responden nelayan setempat..."
            value={riskDesc}
            onChange={(e) => setRiskDesc(e.target.value)}
            rows={2}
          />

          <Textarea
            label="Rencana Mitigasi (Mitigation Plan)"
            placeholder="Contoh: Menggandeng tokoh adat setempat untuk sosialisasi..."
            value={riskMitigation}
            onChange={(e) => setRiskMitigation(e.target.value)}
            rows={2}
          />

          <Select
            label="Level Risiko"
            options={[
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
            ]}
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value as any)}
            className="bg-white dark:bg-slate-950 dark:border-slate-800 border-slate-300"
          />
        </div>
      </Dialog>
    </div>
  );
}
