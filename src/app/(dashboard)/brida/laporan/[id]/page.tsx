'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, AlertTriangle, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService, proposalApi } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';
import { STATUS_LABELS, STATUS_COLORS } from '@/constants/status';

export default function BridaLaporanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;
  const { toast } = useToast();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isActionSaving, setIsActionSaving] = useState(false);

  useEffect(() => {
    const data = proposalApi.getProposalById(proposalId);
    setProposal(data || null);
    setIsLoading(false);
  }, [proposalId]);

  if (isLoading) {
    return <LoadingState message="Memuat laporan OPD..." />;
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-base font-semibold">Laporan Tidak Ditemukan</h3>
        <Button onClick={() => router.push('/brida/laporan')} className="mt-4" variant="outline">
          Kembali
        </Button>
      </div>
    );
  }

  const handleApproveReport = async (isApproved: boolean) => {
    if (!reviewNotes.trim()) {
      toast('Mohon berikan catatan review terlebih dahulu.', 'error');
      return;
    }
    setIsActionSaving(true);
    try {
      const updated = await proposalService.submitLaporanReview(
        proposal.id,
        reviewNotes,
        isApproved ? 'APPROVED' : 'REVISION_REQUIRED'
      );
      if (updated) {
        toast(
          isApproved
            ? `Laporan OPD ${proposal.id} disahkan! Siap disusun Policy Brief.`
            : `Permintaan perbaikan laporan dikirimkan ke ${proposal.opdName}.`,
          isApproved ? 'success' : 'error'
        );
        router.push('/brida/laporan');
      }
    } catch {
      toast('Gagal memproses keputusan laporan.', 'error');
    } finally {
      setIsActionSaving(false);
    }
  };

  const sc = STATUS_COLORS[proposal.status];
  const opdReport = proposal.opdReport;
  const monitoringLogs = proposal.opdMonitoringLogs ?? [];

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/brida/laporan')}
          className="h-9 w-9 p-0 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <span className="font-mono text-2xs font-bold text-sky-600 dark:text-sky-400">
            Review Laporan OPD / {proposal.id}
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200 mt-0.5 truncate max-w-sm sm:max-w-2xl">
            {proposal.title}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-slate-500">{proposal.opdName}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>
              {STATUS_LABELS[proposal.status]}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: OPD Report content */}
        <div className="md:col-span-2 space-y-5">
          {/* E-Katalog info */}
          {proposal.eKatalogUrl && (
            <Card className="bg-white dark:bg-slate-900 border-sky-200 dark:border-sky-900/50 p-5">
              <h3 className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wide border-b border-sky-200 dark:border-sky-900/50 pb-2 mb-3">
                Informasi E-Katalog
              </h3>
              <p className="text-xs text-slate-500 mb-1">URL E-Katalog</p>
              <a
                href={proposal.eKatalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-sky-500 underline break-all"
              >
                {proposal.eKatalogUrl}
              </a>
              {proposal.eKatalogDesc && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{proposal.eKatalogDesc}</p>
              )}
            </Card>
          )}

          {/* Monitoring logs summary */}
          {monitoringLogs.length > 0 && (
            <Card className="bg-white dark:bg-slate-900 border-slate-200/80 p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 dark:border-slate-800">
                Riwayat Log Monitoring OPD ({monitoringLogs.length} entri)
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {[...monitoringLogs].reverse().map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs"
                  >
                    <div className="w-12 text-center shrink-0">
                      <span className="font-bold text-cyan-600 dark:text-cyan-400 text-sm">{log.progress}%</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-700 dark:text-slate-300">{log.description}</p>
                      <p className="text-slate-400 mt-0.5">{log.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* OPD Final Report */}
          {opdReport ? (
            <Card className="bg-white dark:bg-slate-900 border-slate-200/80 p-5 space-y-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 dark:border-slate-800">
                Laporan Akhir dari OPD
              </h3>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Judul Laporan</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{opdReport.title}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Temuan Utama</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{opdReport.findings}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Hambatan</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{opdReport.obstacles}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Rekomendasi dari OPD</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{opdReport.opdRecommendation}</p>
              </div>

              {opdReport.attachments && opdReport.attachments.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Lampiran</p>
                  <div className="space-y-1.5">
                    {opdReport.attachments.map((att) => (
                      <div
                        key={att.name}
                        className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs"
                      >
                        <FileText className="h-4 w-4 text-sky-500 shrink-0" />
                        <span className="font-medium text-slate-700 dark:text-slate-300 flex-1">{att.name}</span>
                        <span className="text-slate-400">{att.size}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-400">
                Diserahkan:{' '}
                {new Date(opdReport.submittedAt).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </Card>
          ) : (
            <Card className="bg-white dark:bg-slate-900 border-slate-200/80 p-8 text-center">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-slate-500 dark:text-slate-400">OPD belum menyerahkan laporan akhir.</p>
            </Card>
          )}
        </div>

        {/* Right: Review action */}
        <div className="space-y-5">
          {opdReport && (
            <Card className="bg-white dark:bg-slate-900 border-slate-200/80 p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-800">
                Review Laporan OPD
              </h3>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Catatan Review BRIDA *
                </label>
                <Textarea
                  id="review-notes"
                  rows={5}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Tuliskan catatan evaluasi laporan dari OPD. Apakah temuan sesuai? Apakah hambatan perlu ditindaklanjuti?"
                  className="mt-1 text-xs"
                />
              </div>

              <div className="space-y-2 border-t pt-3 dark:border-slate-800">
                <Button
                  id="btn-approve-report"
                  onClick={() => handleApproveReport(true)}
                  isLoading={isActionSaving}
                  disabled={!reviewNotes.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Sahkan Laporan OPD</span>
                </Button>
                <Button
                  id="btn-request-revision"
                  onClick={() => handleApproveReport(false)}
                  isLoading={isActionSaving}
                  disabled={!reviewNotes.trim()}
                  variant="outline"
                  className="w-full text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center justify-center gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Minta Perbaikan</span>
                </Button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Setelah disahkan, laporan ini dapat digunakan sebagai referensi penyusunan Policy Brief.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
