'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  FolderLock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function PersetujuanSeleksiDetailPage() {
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
        console.error('Failed to load proposal details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [proposalId]);

  if (isLoading) {
    return <LoadingState message="Memuat berkas seleksi..." />;
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-base font-semibold">Usulan Tidak Ditemukan</h3>
        <Button onClick={() => router.push('/kepala-brida/persetujuan-seleksi')} className="mt-4" variant="outline">
          Kembali
        </Button>
      </div>
    );
  }

  const handleDecision = async (action: 'APPROVE' | 'REJECT' | 'RETURN') => {
    if (!comment) {
      toast('Mohon berikan catatan keputusan/justifikasi Anda.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await proposalService.approveSelection(proposal.id, comment, action);
      if (updated) {
        if (action === 'APPROVE') {
          toast(`Usulan ${proposal.id} berhasil Disetujui (Lolos Seleksi)!`, 'success');
        } else if (action === 'REJECT') {
          toast(`Usulan ${proposal.id} telah Ditolak.`, 'error');
        } else {
          toast(`Usulan ${proposal.id} dikembalikan ke OPD untuk revisi berkas.`, 'success');
        }
        router.push('/kepala-brida/persetujuan-seleksi');
      }
    } catch {
      toast('Gagal memproses keputusan seleksi.', 'error');
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
          onClick={() => router.push('/kepala-brida/persetujuan-seleksi')}
          className="h-9 w-9 p-0 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <span className="font-mono text-2xs font-bold text-slate-450">
            Persetujuan Seleksi / {proposal.id}
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200 mt-0.5 truncate max-w-sm sm:max-w-md">
            {proposal.title}
          </h1>
        </div>
      </div>

      {/* Grid workspace */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: proposal read-only details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 dark:border-slate-855">
              Rincian Dokumen Usulan & Rekomendasi BRIDA
            </h3>

            <div className="grid gap-4 sm:grid-cols-3 text-xs text-center">
              <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                <span className="text-[10px] text-slate-450 font-bold uppercase">Total Skor Review</span>
                <p className="text-2xl font-mono font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                  {proposal.review?.totalScore || '-'}
                </p>
              </div>

              <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                <span className="text-[10px] text-slate-450 font-bold uppercase">Rekomendasi Panitia</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2">
                  {proposal.review?.recommendation || 'PENDING'}
                </p>
              </div>

              <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800 text-xs">
                <span className="text-[10px] text-slate-450 font-bold uppercase">Anggaran KAK</span>
                <p className="text-xs font-mono font-bold text-slate-850 dark:text-slate-200 mt-2">
                  Rp {Number(proposal.kak?.anggaran || 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <p className="font-bold text-slate-500 uppercase text-[9px]">Latar Belakang Masalah</p>
                <p className="text-slate-750 dark:text-slate-350 leading-relaxed mt-1">{proposal.problem.latarBelakang}</p>
              </div>

              <div>
                <p className="font-bold text-slate-500 uppercase text-[9px]">Justifikasi Penilai Substansi</p>
                <p className="text-slate-750 dark:text-slate-350 leading-relaxed mt-1 italic bg-slate-50/50 dark:bg-slate-955 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                  &ldquo;{proposal.review?.reviewerNotes || 'Tidak ada catatan khusus dari reviewer.'}&rdquo;
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Decision controls */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850">
              Form Keputusan Kepala BRIDA
            </h3>

            <Textarea
              label="Catatan & Justifikasi Keputusan"
              placeholder="Berikan arahan strategis pembangunan atau alasan persetujuan/penolakan..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />

            <div className="space-y-2 border-t pt-4 dark:border-slate-850">
              <Button
                onClick={() => handleDecision('APPROVE')}
                isLoading={isSaving}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 shadow"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Approve Usulan</span>
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleDecision('RETURN')}
                  isLoading={isSaving}
                  variant="outline"
                  className="h-9 text-2xs text-amber-700 border-amber-250 hover:bg-amber-50"
                >
                  Return (Kembalikan)
                </Button>
                <Button
                  onClick={() => handleDecision('REJECT')}
                  isLoading={isSaving}
                  variant="outline"
                  className="h-9 text-2xs text-red-700 border-red-250 hover:bg-red-50"
                >
                  Reject (Tolak)
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
