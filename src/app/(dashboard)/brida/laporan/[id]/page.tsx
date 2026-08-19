'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  FileCheck,
  User,
  Clock,
  AlertTriangle,
  Download,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

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
    const loadDetails = async () => {
      try {
        const data = await proposalService.getProposalById(proposalId);
        setProposal(data);
        if (data && data.reportReview) {
          setReviewNotes(data.reportReview.reviewerNotes);
        }
      } catch (err) {
        console.error('Failed to load report details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [proposalId]);

  if (isLoading) {
    return <LoadingState message="Memuat dokumen laporan akhir..." />;
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

  const handleAction = async (isApproved: boolean) => {
    if (!reviewNotes) {
      toast('Mohon berikan catatan tinjauan/rekomendasi evaluasi laporan.', 'error');
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
        if (isApproved) {
          toast(`Laporan akhir ${proposal.id} berhasil disahkan! Rekomendasi kajian telah diterbitkan ke OPD.`, 'success');
        } else {
          toast(`Permintaan revisi laporan akhir ${proposal.id} telah dikirim ke mitra peneliti.`, 'success');
        }
        router.push('/brida/laporan');
      }
    } catch {
      toast('Gagal memproses review laporan.', 'error');
    } finally {
      setIsActionSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
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
          <span className="font-mono text-2xs font-bold text-blue-650 dark:text-blue-400">
            Review Laporan / {proposal.id}
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200 mt-0.5 truncate max-w-sm sm:max-w-md">
            {proposal.title}
          </h1>
        </div>
      </div>

      {/* Grid workspace */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: reports files & text summaries */}
        <div className="md:col-span-2 space-y-6">
          {/* File Card */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 dark:border-slate-850">
              Dokumen Unggahan Peneliti
            </h3>
            
            <div className="p-3 border rounded-lg bg-slate-50/50 border-slate-200 dark:bg-slate-950/20 dark:border-slate-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {proposal.finalReport ? proposal.finalReport.attachments?.[0]?.name || 'final_report_custom.pdf' : `final_report_${proposal.id.toLowerCase()}.pdf`}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Naskah Kajian Akhir Komprehensif ({proposal.finalReport ? proposal.finalReport.attachments?.[0]?.size || '3.5 MB' : '3.4 MB'})
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-450 hover:text-emerald-600 rounded-full">
                <Download className="h-4.5 w-4.5" />
              </Button>
            </div>

            <div className="p-3 border rounded-lg bg-slate-50/50 border-slate-200 dark:bg-slate-950/20 dark:border-slate-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">policy_brief_{proposal.id.toLowerCase()}.pdf</p>
                  <p className="text-[10px] text-slate-500">Draf Policy Brief Ringkasan Eksekutif (1.2 MB)</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-450 hover:text-blue-600 rounded-full">
                <Download className="h-4.5 w-4.5" />
              </Button>
            </div>
          </Card>

          {/* Dynamic Final Report text summaries from researcher upload */}
          {proposal.finalReport && (
            <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 dark:border-slate-850">
                Isi Naskah Utama Laporan Akhir Peneliti
              </h3>
              <div className="space-y-4 text-xs">
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[9px] block">Ringkasan Eksekutif (Executive Summary)</span>
                  <p className="text-slate-800 dark:text-slate-200 mt-1 leading-relaxed whitespace-pre-line">{proposal.finalReport.executiveSummary}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-3 border rounded-lg bg-slate-50/20 dark:bg-slate-955">
                    <span className="font-bold text-slate-500 uppercase text-[9px] block">Metodologi Kajian</span>
                    <p className="text-slate-800 dark:text-slate-200 mt-1 leading-relaxed whitespace-pre-line">{proposal.finalReport.methodology}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/20 dark:bg-slate-955">
                    <span className="font-bold text-slate-500 uppercase text-[9px] block">Temuan Utama Riset</span>
                    <p className="text-slate-800 dark:text-slate-200 mt-1 leading-relaxed whitespace-pre-line">{proposal.finalReport.findings}</p>
                  </div>
                </div>
                <div className="p-3 border rounded-lg bg-emerald-50/10 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-950">
                  <span className="font-bold text-emerald-600 dark:text-emerald-450 uppercase text-[9px] block">Rekomendasi Kebijakan yang Diajukan</span>
                  <p className="text-slate-850 dark:text-slate-200 mt-1 leading-relaxed font-semibold italic">&ldquo;{proposal.finalReport.recommendation}&rdquo;</p>
                  <p className="text-slate-655 dark:text-slate-400 text-3xs mt-2">Kesimpulan: {proposal.finalReport.conclusion}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Research Objectives vs Deliverables */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 dark:border-slate-850">
              Evaluasi Target Keluaran KAK
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                <p className="font-bold text-slate-500 uppercase text-[9px]">Target Output KAK</p>
                <p className="text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">{proposal.kak?.output}</p>
              </div>

              <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                <p className="font-bold text-slate-500 uppercase text-[9px]">Target Outcome KAK</p>
                <p className="text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">{proposal.kak?.outcome}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column: evaluator notes & action buttons */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850">
              Tinjauan Hasil Laporan
            </h3>

            {proposal.status !== 'REPORT_SUBMITTED' && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-900 rounded-lg text-xs dark:bg-emerald-950/20 dark:text-emerald-450">
                <CheckCircle className="h-4 w-4" />
                <span>Laporan Akhir Telah Disahkan</span>
              </div>
            )}

            <Textarea
              label="Tinjauan Evaluasi Laporan"
              placeholder="Berikan rekomendasi perbaikan substansi kajian atau kesimpulan pengesahan..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={4}
              disabled={proposal.status !== 'REPORT_SUBMITTED'}
            />

            {proposal.status === 'REPORT_SUBMITTED' && (
              <div className="space-y-2 border-t pt-4 dark:border-slate-850">
                <Button
                  onClick={() => handleAction(true)}
                  isLoading={isActionSaving}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 shadow"
                >
                  <FileCheck className="h-4 w-4" />
                  <span>Sahkan Laporan Akhir</span>
                </Button>

                <Button
                  onClick={() => handleAction(false)}
                  isLoading={isActionSaving}
                  variant="outline"
                  className="w-full h-9 text-2xs text-amber-700 border-amber-200 hover:bg-amber-50"
                >
                  Minta Revisi Laporan
                </Button>
              </div>
            )}
          </Card>

          {/* Partner profile card */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 text-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850">
              Pihak Peneliti
            </h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-between dark:bg-blue-950/20 dark:text-blue-400">
                <User className="h-5 w-5 mx-auto" />
              </div>
              <div>
                <p className="font-bold text-slate-850 dark:text-slate-200">{proposal.researcherName}</p>
                <p className="text-3xs text-slate-500">Pakar Peneliti Utama</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
