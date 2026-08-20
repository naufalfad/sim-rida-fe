'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  FolderLock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService, proposalApi } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function BridaSeleksiDetailPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;
  const { toast } = useToast();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionSaving, setIsActionSaving] = useState(false);
  const [eKatalogForm, setEKatalogForm] = useState({
    url: '',
    desc: '',
    deadline: '',
  });
  const [isSendingEKatalog, setIsSendingEKatalog] = useState(false);
  const [eKatalogSent, setEKatalogSent] = useState(false);

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
    return <LoadingState message="Memuat berkas kelayakan seleksi..." />;
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-base font-semibold">Usulan Tidak Ditemukan</h3>
        <Button onClick={() => router.push('/brida/seleksi')} className="mt-4" variant="outline">
          Kembali
        </Button>
      </div>
    );
  }

  const handleSelection = async (recommendation: 'RECOMMENDED' | 'RESERVE' | 'REJECTED') => {
    setIsActionSaving(true);
    try {
      const updated = await proposalService.setSelectionStatus(proposal.id, recommendation);
      if (updated) {
        if (recommendation === 'RECOMMENDED') {
          toast(`Usulan ${proposal.id} secara resmi disahkan untuk didanai!`, 'success');
        } else if (recommendation === 'RESERVE') {
          toast(`Usulan ${proposal.id} dimasukkan ke daftar cadangan riset.`, 'success');
        } else {
          toast(`Usulan ${proposal.id} ditolak dari prioritas.`, 'error');
        }
        router.push('/brida/seleksi');
      }
    } catch {
      toast('Gagal memproses keputusan seleksi.', 'error');
    } finally {
      setIsActionSaving(false);
    }
  };

  const handleSendEKatalog = async () => {
    if (!eKatalogForm.url.trim() || !eKatalogForm.deadline) return;
    setIsSendingEKatalog(true);
    try {
      const updated = await proposalApi.sendEKatalogLink(
        proposal!.id,
        eKatalogForm.url,
        eKatalogForm.desc,
        eKatalogForm.deadline
      );
      if (updated) {
        setProposal(updated);
        setEKatalogSent(true);
        toast(`Link E-Katalog berhasil dikirimkan ke ${updated.opdName}!`, 'success');
      }
    } catch {
      toast('Gagal mengirimkan link E-Katalog.', 'error');
    } finally {
      setIsSendingEKatalog(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/brida/seleksi')}
          className="h-9 w-9 p-0 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <span className="font-mono text-2xs font-bold text-blue-650 dark:text-blue-400">
            Penetapan Seleksi / {proposal.id}
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200 mt-0.5 truncate max-w-sm sm:max-w-md">
            {proposal.title}
          </h1>
        </div>
      </div>

      {/* Grid workspace */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: review score details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 dark:border-slate-855">
              Ulasan Hasil Penilaian Ahli
            </h3>

            <div className="grid gap-4 sm:grid-cols-3 text-center">
              <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Skor</span>
                <p className="text-2xl font-mono font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                  {proposal.review?.totalScore || '-'}
                </p>
              </div>

              <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Rekomendasi Reviewer</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2">
                  {proposal.review?.recommendation || 'BELUM DINILAI'}
                </p>
              </div>

              <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Anggaran Diajukan</span>
                <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-2">
                  Rp {Number(proposal.kak?.anggaran || 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800 text-xs">
              <p className="font-bold text-slate-500 uppercase text-[10px]">Catatan Ahli Reviewer</p>
              <p className="text-slate-700 dark:text-slate-350 mt-1 whitespace-pre-line leading-relaxed italic">
                &ldquo;{proposal.review?.reviewerNotes || 'Tidak ada catatan.'}&rdquo;
              </p>
            </div>
          </Card>
        </div>

        {/* Right column: selection action buttons */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850">
              Sidang Keputusan Seleksi
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tentukan status akhir pembiayaan dan pelaksanaan riset untuk tahun anggaran berjalan.
            </p>

            <div className="space-y-2 border-t pt-4 dark:border-slate-850">
              <Button
                onClick={() => handleSelection('RECOMMENDED')}
                isLoading={isActionSaving}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 shadow"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Rekomendasikan Lolos</span>
              </Button>

              <Button
                onClick={() => handleSelection('RESERVE')}
                isLoading={isActionSaving}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-1.5 shadow"
              >
                <FolderLock className="h-4 w-4" />
                <span>Masukkan Cadangan</span>
              </Button>

              <Button
                onClick={() => handleSelection('REJECTED')}
                isLoading={isActionSaving}
                className="w-full bg-red-650 hover:bg-red-750 text-white flex items-center justify-center gap-1.5 shadow"
              >
                <XCircle className="h-4 w-4" />
                <span>Tolak Pendanaan</span>
              </Button>
            </div>
          </Card>

          {/* E-Katalog section: shown after APPROVED */}
          {(proposal.status === 'APPROVED' || proposal.status === 'EKATALOG_SENT') && (
            <Card className="bg-white dark:bg-slate-900 border-sky-200 dark:border-sky-900/50 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-sky-700 dark:text-sky-400 border-b border-sky-200 dark:border-sky-900/50 pb-2">
                🔗 Kirim Link E-Katalog ke OPD
              </h3>

              {proposal.status === 'EKATALOG_SENT' || eKatalogSent ? (
                <div className="text-center py-2">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">E-Katalog Sudah Dikirimkan</p>
                  {proposal.eKatalogUrl && (
                    <a
                      href={proposal.eKatalogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sky-500 underline break-all mt-1 block"
                    >
                      {proposal.eKatalogUrl}
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Setelah seleksi disetujui Kepala BRIDA, kirimkan link E-Katalog LKPP kepada OPD untuk pembelian solusi.
                  </p>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">URL E-Katalog LKPP *</label>
                    <input
                      id="ekatalog-url"
                      type="url"
                      value={eKatalogForm.url}
                      onChange={(e) => setEKatalogForm((f) => ({ ...f, url: e.target.value }))}
                      placeholder="https://e-katalog.lkpp.go.id/..."
                      className="mt-1 w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Deskripsi Solusi</label>
                    <textarea
                      id="ekatalog-desc"
                      rows={2}
                      value={eKatalogForm.desc}
                      onChange={(e) => setEKatalogForm((f) => ({ ...f, desc: e.target.value }))}
                      placeholder="Nama vendor dan deskripsi solusi singkat..."
                      className="mt-1 w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Deadline Implementasi *</label>
                    <input
                      id="ekatalog-deadline"
                      type="date"
                      value={eKatalogForm.deadline}
                      onChange={(e) => setEKatalogForm((f) => ({ ...f, deadline: e.target.value }))}
                      className="mt-1 w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <Button
                    id="btn-send-ekatalog"
                    onClick={handleSendEKatalog}
                    isLoading={isSendingEKatalog}
                    disabled={!eKatalogForm.url.trim() || !eKatalogForm.deadline}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs flex items-center justify-center gap-1.5"
                  >
                    📤 Kirim E-Katalog ke OPD
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
