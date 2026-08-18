'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  FileText,
  FileDown,
  BookOpen,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function PersetujuanLaporanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;
  const { toast } = useToast();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const data = await proposalService.getProposalById(proposalId);
        setProposal(data);
      } catch (err) {
        console.error('Failed to load report details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [proposalId]);

  if (isLoading) {
    return <LoadingState message="Memuat berkas laporan akhir..." />;
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-base font-semibold">Dokumen Tidak Ditemukan</h3>
        <Button onClick={() => router.push('/kepala-brida/persetujuan-laporan')} className="mt-4" variant="outline">
          Kembali
        </Button>
      </div>
    );
  }

  const handleDecision = async (action: 'APPROVE' | 'RETURN') => {
    if (!comment) {
      toast('Mohon berikan catatan keputusan/justifikasi Anda.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await proposalService.approveFinalReport(proposal.id, comment, action);
      if (updated) {
        if (action === 'APPROVE') {
          toast(`Laporan akhir ${proposal.id} berhasil disetujui! Status berubah menjadi Menunggu Rekomendasi.`, 'success');
        } else {
          toast(`Catatan revisi laporan berhasil dikirim ke peneliti.`, 'success');
        }
        router.push('/kepala-brida/persetujuan-laporan');
      }
    } catch {
      toast('Gagal memproses keputusan laporan akhir.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/kepala-brida/persetujuan-laporan')}
          className="h-9 w-9 p-0 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <span className="font-mono text-2xs font-bold text-slate-455">
            Persetujuan Laporan / {proposal.id}
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-805 dark:text-slate-205 mt-0.5 truncate max-w-sm sm:max-w-md">
            {proposal.title}
          </h1>
        </div>
      </div>

      {/* Grid workspace */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: Summary cards and files */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 dark:border-slate-850">
              Isi Ringkasan Laporan Akhir & Hasil Kajian
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <p className="font-bold text-slate-500 uppercase text-[9px] flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Ringkasan Eksekutif (Executive Summary)</span>
                </p>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-2 bg-slate-50/40 dark:bg-slate-950/20 p-3 rounded-lg border border-slate-100 dark:border-slate-850 font-sans">
                  Kajian ini merekomendasikan formulasi kebijakan peningkatan infrastruktur pendukung, digitalisasi tata kelola, dan standarisasi layanan daerah. Ditemukan bahwa 65% inefisiensi disebabkan kurangnya koordinasi data lintas sektor.
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-500 uppercase text-[9px] flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Catatan Evaluasi Tim Penilai BRIDA</span>
                </p>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-2 italic bg-emerald-50/10 p-3 rounded-lg border border-emerald-100/50">
                  &ldquo;{proposal.reportReview?.reviewerNotes || 'Laporan dinilai lengkap, relevan dengan kebutuhan prioritas OPD, dan naskah akademik terstruktur dengan baik.'}&rdquo;
                </p>
              </div>

              <div className="pt-2">
                <p className="font-bold text-slate-500 uppercase text-[9px] mb-2">Dokumen Terlampir</p>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 p-2 border rounded-lg bg-white dark:bg-slate-950 dark:border-slate-850">
                    <FileText className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-2xs font-bold text-slate-800 dark:text-slate-200">Laporan_Akhir_{proposal.id}.pdf</p>
                      <p className="text-[10px] text-slate-400">4.2 MB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded-lg bg-white dark:bg-slate-955 dark:border-slate-850">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-2xs font-bold text-slate-800 dark:text-slate-200">Policy_Brief_{proposal.id}.pdf</p>
                      <p className="text-[10px] text-slate-400">1.8 MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Action form */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850">
              Keputusan Pengesahan Naskah
            </h3>

            <Textarea
              label="Catatan & Arahan"
              placeholder="Berikan persetujuan untuk pengesahan publik, atau instruksikan detail revisi naskah akademis..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />

            <div className="space-y-2 border-t pt-4 dark:border-slate-850">
              <Button
                onClick={() => handleDecision('APPROVE')}
                isLoading={isSaving}
                className="w-full bg-emerald-650 hover:bg-emerald-750 text-white flex items-center justify-center gap-1.5 shadow"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Sahkan Laporan Riset</span>
              </Button>

              <Button
                onClick={() => handleDecision('RETURN')}
                isLoading={isSaving}
                variant="outline"
                className="w-full text-2xs text-amber-700 border-amber-250 hover:bg-amber-50"
              >
                Kembalikan Laporan (Revisi)
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
