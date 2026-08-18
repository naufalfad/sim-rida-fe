'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function BridaVerifikasiDetailPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;
  const { toast } = useToast();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verification Checklist States
  const [kakCheck, setKakCheck] = useState(false);
  const [problemValid, setProblemValid] = useState(false);
  const [supportingDocCheck, setSupportingDocCheck] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isActionSaving, setIsActionSaving] = useState(false);

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
    return <LoadingState message="Memuat detail dokumen usulan..." />;
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-base font-semibold">Usulan Tidak Ditemukan</h3>
        <Button onClick={() => router.push('/brida/verifikasi')} className="mt-4" variant="outline">
          Kembali
        </Button>
      </div>
    );
  }

  const handleAction = async (isApproved: boolean, isReject: boolean = false) => {
    if (!isApproved && !isReject && !adminNotes) {
      toast('Mohon berikan catatan revisi untuk OPD pengusul.', 'error');
      return;
    }

    setIsActionSaving(true);
    try {
      const updated = await proposalService.verifyProposal(
        proposal.id,
        {
          kakCheck,
          problemValid,
          supportingDocCheck,
          notes: adminNotes,
        },
        isApproved,
        isReject
      );

      if (updated) {
        if (isReject) {
          toast(`Usulan ${proposal.id} resmi Ditolak.`, 'error');
        } else if (!isApproved) {
          toast(`Usulan ${proposal.id} dikembalikan ke OPD untuk revisi berkas.`, 'success');
        } else {
          toast(`Usulan ${proposal.id} lolos verifikasi administrasi!`, 'success');
        }
        router.push('/brida/verifikasi');
      }
    } catch {
      toast('Gagal melakukan tindakan verifikasi.', 'error');
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
          onClick={() => router.push('/brida/verifikasi')}
          className="h-9 w-9 p-0 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <span className="font-mono text-2xs font-bold text-blue-650 dark:text-blue-400">
            Verifikasi Administrasi / {proposal.id}
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200 mt-0.5 truncate max-w-sm sm:max-w-md">
            {proposal.title}
          </h1>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left columns: proposal details view */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 dark:border-slate-850">
              Dokumen Usulan & KAK OPD
            </h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <p className="font-bold text-slate-500 uppercase text-[10px]">Latar Belakang Masalah (OPD)</p>
                <p className="text-slate-800 dark:text-slate-200 mt-1 whitespace-pre-line leading-relaxed">{proposal.problem.latarBelakang}</p>
              </div>

              <div>
                <p className="font-bold text-slate-500 uppercase text-[10px]">Tujuan Riset & Anggaran KAK</p>
                <p className="text-slate-800 dark:text-slate-200 mt-1 font-semibold">{proposal.research?.tujuan || '-'}</p>
                <p className="text-slate-650 dark:text-slate-450 mt-1 font-mono text-[11px]">
                  Estimasi Anggaran KAK: Rp {Number(proposal.kak?.anggaran || 0).toLocaleString('id-ID')}
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-500 uppercase text-[10px]">Metodologi & Jadwal</p>
                <p className="text-slate-800 dark:text-slate-200 mt-1 whitespace-pre-line">{proposal.kak?.metodologi || '-'}</p>
                <p className="text-slate-500 mt-1">Jadwal Kerja KAK: {proposal.kak?.jadwal || '-'}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column: checklist controls */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Lembar Verifikasi BRIDA
            </h3>

            {/* Checklist elements */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50/50 cursor-pointer dark:bg-slate-950/20 dark:border-slate-800 text-xs">
                <input
                  type="checkbox"
                  checked={kakCheck}
                  onChange={(e) => setKakCheck(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-850 dark:text-slate-200">Format KAK Lengkap</span>
                  <p className="text-[10px] text-slate-500">Mempunyai identitas, metodologi, dan penutup KAK.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50/50 cursor-pointer dark:bg-slate-950/20 dark:border-slate-800 text-xs">
                <input
                  type="checkbox"
                  checked={problemValid}
                  onChange={(e) => setProblemValid(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-850 dark:text-slate-200">Urgensi Isu Valid</span>
                  <p className="text-[10px] text-slate-500">Masalah logis dan mendesak diselesaikan daerah.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50/50 cursor-pointer dark:bg-slate-950/20 dark:border-slate-800 text-xs">
                <input
                  type="checkbox"
                  checked={supportingDocCheck}
                  onChange={(e) => setSupportingDocCheck(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-850 dark:text-slate-200">Berkas Lampiran Sesuai</span>
                  <p className="text-[10px] text-slate-500">Dokumen pendukung / profil dinas terlampir.</p>
                </div>
              </label>
            </div>

            {/* Admin notes */}
            <Textarea
              label="Catatan Verifikasi"
              placeholder="Berikan koreksi berkas atau alasan pengembalian/persetujuan..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
            />

            {/* Action buttons */}
            <div className="space-y-2 border-t pt-4 dark:border-slate-850">
              <Button
                onClick={() => handleAction(true)}
                isLoading={isActionSaving}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5"
                disabled={!(kakCheck && problemValid && supportingDocCheck)}
              >
                <CheckCircle className="h-4 w-4" />
                <span>Setujui Verifikasi</span>
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleAction(false)}
                  isLoading={isActionSaving}
                  variant="outline"
                  className="h-9 text-2xs text-amber-700 border-amber-200 hover:bg-amber-50"
                >
                  Revisi Berkas
                </Button>
                <Button
                  onClick={() => handleAction(false, true)}
                  isLoading={isActionSaving}
                  variant="outline"
                  className="h-9 text-2xs text-red-700 border-red-200 hover:bg-red-50"
                >
                  Tolak Usulan
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
