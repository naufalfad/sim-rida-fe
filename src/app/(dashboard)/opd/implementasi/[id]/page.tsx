'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { proposalApi } from '@/lib/api/proposals';
import { Proposal, OpdMonitoringLog, OpdReport } from '@/types/proposals';
import { STATUS_LABELS, STATUS_COLORS } from '@/constants/status';

type Tab = 'overview' | 'monitoring' | 'laporan';

export default function OpdImplementasiDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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

  useEffect(() => {
    if (id) {
      const p = proposalApi.getProposalById(id as string);
      setProposal(p || null);
    }
  }, [id]);

  const handleSubmitLog = async () => {
    if (!logForm.description.trim() || logForm.progress < 0) return;
    setSubmitting(true);
    const updated = await proposalApi.submitOpdMonitoringLog(id as string, {
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
    const updated = await proposalApi.submitOpdFinalReport(id as string, reportForm);
    if (updated) {
      setProposal(updated);
      setSuccessMsg('Laporan akhir berhasil diserahkan ke BRIDA!');
      setActiveTab('overview');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
    setSubmitting(false);
  };

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
    </div>
  );
}
