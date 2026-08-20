'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Award,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function PersetujuanRekomendasiDetailPage() {
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
        console.error('Failed to load recommendation details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [proposalId]);

  if (isLoading) {
    return <LoadingState message="Memuat draf surat rekomendasi daerah..." />;
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-base font-semibold">Usulan Tidak Ditemukan</h3>
        <Button onClick={() => router.push('/kepala-brida/persetujuan-rekomendasi')} className="mt-4" variant="outline">
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
      const updated = await proposalService.approveRecommendation(proposal.id, comment, action);
      if (updated) {
        if (action === 'APPROVE') {
          toast(`Rekomendasi Bupati untuk ${proposal.id} berhasil disetujui & ditandatangani! Rencana aksi dikirim ke ${proposal.opdName}.`, 'success');
        } else {
          toast(`Catatan draf rekomendasi dikembalikan ke BRIDA untuk direvisi.`, 'success');
        }
        router.push('/kepala-brida/persetujuan-rekomendasi');
      }
    } catch {
      toast('Gagal memproses keputusan rekomendasi Bupati.', 'error');
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
          onClick={() => router.push('/kepala-brida/persetujuan-rekomendasi')}
          className="h-9 w-9 p-0 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <span className="font-mono text-2xs font-bold text-slate-455">
            Tanda Tangan SK Rekomendasi / {proposal.id}
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-805 dark:text-slate-205 mt-0.5 truncate max-w-sm sm:max-w-md">
            {proposal.title}
          </h1>
        </div>
      </div>

      {/* Grid workspace */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: SK draft editor preview */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2 dark:border-slate-850">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Draf Surat Keputusan Rekomendasi Bupati
              </h3>
              <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-mono font-bold">
                PROPOSED STATUS: ACTIVE
              </span>
            </div>

            <div className="space-y-4 text-xs font-serif leading-relaxed text-slate-800 dark:text-slate-200 bg-slate-50/20 p-5 rounded-lg border border-slate-150 border-dashed dark:border-slate-850">
              <div className="text-center font-bold uppercase tracking-wide">
                SURAT KEPUTUSAN BUPATI DAERAH<br />
                TENTANG REKOMENDASI KEBIJAKAN PENATAAN STRATEGIS DAERAH
              </div>
              
              <p className="mt-4">
                Menimbang hasil kajian riset daerah oleh OPD <strong>{proposal.opdName}</strong> dengan judul <em>&ldquo;{proposal.title}&rdquo;</em>, maka diputuskan bahwa:
              </p>

              <div className="pl-4 border-l-2 border-teal-500 font-sans text-xs italic my-3 text-slate-655">
                &ldquo;Kepada Kepala OPD <strong>{proposal.opdName}</strong> diinstruksikan untuk segera menindaklanjuti rekomendasi perbaikan sistem, digitalisasi data sekunder, dan mengalokasikan program kerja pendukung dalam Rencana Kerja (Renja) OPD tahun anggaran berjalan.&rdquo;
              </div>

              <p className="mt-4 text-right">
                Bupati Daerah,<br />
                <span className="text-2xs text-slate-400 italic block mt-6">[Belum Ditandatangani - Menunggu TTD Elektronik]</span>
              </p>
            </div>
          </Card>
        </div>

        {/* Right: TTD & Comment controls */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850">
              Otorisasi Pengesahan Bupati
            </h3>

            <Textarea
              label="Catatan Pengantar & Pengesahan"
              placeholder="Berikan arahan implementasi OPD atau catatan perbaikan redaksional draf SK..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />

            <div className="space-y-2 border-t pt-4 dark:border-slate-850">
              <Button
                onClick={() => handleDecision('APPROVE')}
                isLoading={isSaving}
                className="w-full bg-teal-655 hover:bg-teal-750 text-white flex items-center justify-center gap-1.5 shadow font-bold"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Sahkan & TTD SK</span>
              </Button>

              <Button
                onClick={() => handleDecision('RETURN')}
                isLoading={isSaving}
                variant="outline"
                className="w-full text-2xs text-amber-700 border-amber-250 hover:bg-amber-50"
              >
                Kembalikan Draf (Revisi)
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
