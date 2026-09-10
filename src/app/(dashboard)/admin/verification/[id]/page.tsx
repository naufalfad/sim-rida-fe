'use client';

import React, { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOpdStore } from '@/store/useOpdStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Building2,
  Calendar,
  ShieldCheck,
  RotateCcw,
  Loader2,
  XCircle,
  Sparkles,
  ArrowRight,
  DollarSign,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminVerificationDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { proposals, verifyProposal, fetchProposals, isLoadingProposals } = useOpdStore();

  const proposalId = resolvedParams.id;
  const proposal = proposals.find((p) => p.id === proposalId);

  useEffect(() => {
    if (!proposal) {
      fetchProposals();
    }
  }, [proposal, fetchProposals]);

  // 5 Pilar Validasi State
  const [isProblemClear, setIsProblemClear] = useState(
    proposal?.adminVerification?.isProblemClear ?? true
  );
  const [isNotDuplicated, setIsNotDuplicated] = useState(
    proposal?.adminVerification?.isNotDuplicated ?? true
  );
  const [isUrgencyRelevant, setIsUrgencyRelevant] = useState(
    proposal?.adminVerification?.isUrgencyRelevant ?? true
  );
  const [isStrategicAligned, setIsStrategicAligned] = useState(
    proposal?.adminVerification?.isStrategicAligned ?? true
  );
  const [isResearchFeasible, setIsResearchFeasible] = useState(
    proposal?.adminVerification?.isResearchFeasible ?? true
  );

  const [verificationNotes, setVerificationNotes] = useState(
    proposal?.adminVerification?.verificationNotes ||
      'Usulan telah ditelaah berdasarkan 5 pilar validasi BRIDA dan memenuhi kriteria kelayakan riset daerah.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoadingProposals && !proposal) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4 font-sans">
        <Loader2 className="w-10 h-10 text-[#0f2c59] animate-spin mx-auto" />
        <p className="text-xs text-slate-600 font-semibold">Memuat rincian berkas usulan riset...</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4 font-sans">
        <AlertTriangle className="w-12 h-12 text-[#0f2c59] mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Usulan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">Data usulan dengan ID tersebut tidak ditemukan dalam sistem.</p>
        <Link
          href="/admin/verification"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0f2c59] text-white text-xs font-semibold border border-black"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Antrean Validasi
        </Link>
      </div>
    );
  }

  const isAlreadyVerified = proposal.status !== 'PENDING';

  const handleDecision = async (decision: 'PASS' | 'RETURN' | 'REJECT') => {
    if (!verificationNotes.trim() || verificationNotes.trim().length < 5) {
      toast('Catatan hasil validasi wajib diisi minimal 5 karakter.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      await verifyProposal(
        proposal.id,
        {
          decision,
          isProblemClear,
          isNotDuplicated,
          isUrgencyRelevant,
          isStrategicAligned,
          isResearchFeasible,
          verificationNotes: verificationNotes.trim(),
        },
        verificationNotes.trim(),
        user?.name || 'Admin Litbang BRIDA'
      );

      if (decision === 'PASS') {
        toast('Usulan OPD dinyatakan Lolos Validasi! Usulan kini berstatus Siap Masuk ke Tahap 3 (Penyusunan KAK).', 'success');
      } else if (decision === 'RETURN') {
        toast('Usulan berhasil dikembalikan ke OPD dengan catatan revisi perbaikan.', 'warning');
      } else {
        toast('Usulan OPD telah ditolak dengan catatan alasan ketidaklayakan.', 'error');
      }

      router.push('/admin/verification');
    } catch (err: any) {
      toast(`Gagal memproses validasi: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allPillarsChecked =
    isProblemClear && isNotDuplicated && isUrgencyRelevant && isStrategicAligned && isResearchFeasible;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 font-sans">
      {/* HEADER */}
      <PageHeader
        title="Validasi Substansi & Kelayakan Riset OPD"
        description={`Pemeriksaan kelayakan usulan riset kode ${proposal.code} dari ${proposal.opdName} berdasarkan 5 pilar instrumen validasi BRIDA.`}
        action={
          <Link
            href="/admin/verification"
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Antrean
          </Link>
        }
      />

      {/* STATUS BANNER IF ALREADY PROCESSED */}
      {isAlreadyVerified && (
        <div
          className={cn(
            'p-4 border flex items-center justify-between gap-4 text-xs font-medium',
            proposal.status === 'APPROVED' || proposal.status === 'IN_PROGRESS' || proposal.status === 'COMPLETED'
              ? 'bg-blue-600 text-white border-blue-700'
              : proposal.status === 'RETURNED'
              ? 'bg-slate-100 text-slate-900 border-black'
              : 'bg-slate-900 text-white border-black'
          )}
        >
          <div className="flex items-center gap-2.5">
            {proposal.status === 'APPROVED' ? (
              <CheckCircle2 className="h-5 w-5 text-white" />
            ) : proposal.status === 'RETURNED' ? (
              <AlertTriangle className="h-5 w-5 text-slate-900" />
            ) : (
              <XCircle className="h-5 w-5 text-white" />
            )}
            <div>
              <span className="font-bold block text-sm">
                Status Saat Ini: {proposal.status === 'APPROVED' ? 'Lolos Validasi BRIDA (Siap KAK)' : proposal.status === 'RETURNED' ? 'Dikembalikan untuk Revisi OPD' : proposal.status}
              </span>
              <p className="text-[11px] opacity-80 mt-0.5">
                Divalidasi pada {proposal.adminVerification?.verifiedAt || '2026-09-01'} oleh {proposal.adminVerification?.verifiedBy || 'Admin BRIDA'}.
              </p>
            </div>
          </div>

          {proposal.status === 'APPROVED' && (
            <Link
              href="/admin/research"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0f2c59] text-white border border-white font-semibold hover:bg-[#1a3d70] transition-colors"
            >
              Lanjut ke Penyusunan KAK
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* SECTION 1: PROPOSAL OVERVIEW CARD */}
      <Card className="bg-white border-black shadow-sm">
        <CardHeader className="border-b border-slate-200 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-700 px-2.5 py-1 bg-slate-100 border border-slate-300">
                {proposal.code}
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-300">
                Usulan Perangkat Daerah
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Diajukan: {proposal.submittedAt || proposal.createdAt || '2026-09-01'}
            </span>
          </div>
          <CardTitle className="text-base font-bold text-slate-900 mt-2 leading-snug">
            {proposal.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-300">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                OPD Pengusul
              </span>
              <span className="font-bold text-slate-800 mt-0.5 block">{proposal.opdName}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Bidang / Kategori
              </span>
              <span className="font-bold text-slate-800 mt-0.5 block">{proposal.category}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Estimasi Pagu Anggaran
              </span>
              <span className="font-bold text-blue-900 mt-0.5 block font-mono">
                Rp {Number(proposal.estimatedBudget || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="font-bold text-slate-800 block text-xs">
              Rumusan Masalah yang Dihadapi OPD:
            </span>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-wrap">
              {proposal.problemStatement}
            </div>
          </div>

          {proposal.urgencyReason && (
            <div className="space-y-1.5">
              <span className="font-bold text-slate-800 block text-xs">
                Alasan Urgensi & Kebutuhan Solusi Riset:
              </span>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-wrap">
                {proposal.urgencyReason}
              </div>
            </div>
          )}

          {proposal.supportingDocuments && proposal.supportingDocuments.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="font-bold text-slate-800 block text-xs">
                Dokumen Lampiran TOR / Data Awal ({proposal.supportingDocuments.length}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {proposal.supportingDocuments.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 text-[#0f2c59] shrink-0" />
                      <span className="truncate font-medium text-slate-800">{doc.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">{doc.size}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2: 5 PILAR VALIDASI FORM */}
      <Card className="bg-white border-black shadow-sm overflow-hidden">
        <CardHeader className="bg-[#0f2c59] text-white p-5 border-b border-black">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-sky-400" />
            <div>
              <CardTitle className="text-base font-bold text-white">
                Instrumen Evaluasi 5 Pilar Validasi BRIDA
              </CardTitle>
              <CardDescription className="text-xs text-slate-300">
                Tentukan kelayakan usulan OPD melalui verifikasi 5 kriteria mutlak sebelum meloloskan ke Tahap 3 KAK.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {/* 5 PILARS CHECKLIST */}
          <div className="grid grid-cols-1 gap-3.5">
            {/* PILAR 1 */}
            <label
              className={cn(
                'p-4 border transition-all flex items-start gap-3.5 cursor-pointer select-none',
                isProblemClear
                  ? 'bg-blue-50/70 border-blue-600 ring-1 ring-blue-500'
                  : 'bg-slate-50 border-slate-300 hover:border-black'
              )}
            >
              <input
                type="checkbox"
                disabled={isAlreadyVerified}
                checked={isProblemClear}
                onChange={(e) => setIsProblemClear(e.target.checked)}
                className="mt-1 h-4 w-4 rounded-none text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
              <div className="space-y-1 flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900 font-bold text-sm">
                    Pilar 1: Validasi Kejelasan Masalah
                  </strong>
                  {isProblemClear && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-blue-600 px-2 py-0.5 border border-blue-700">
                      Memenuhi
                    </span>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Rumusan masalah diuraikan dengan jelas, didukung fakta empiris lapangan, dan merupakan permasalahan yang membutuhkan kajian ilmiah/inovasi (bukan sekadar belanja barang rutin OPD).
                </p>
              </div>
            </label>

            {/* PILAR 2: NOVELTY / DUPLICATION CHECK */}
            <label
              className={cn(
                'p-4 border transition-all flex items-start gap-3.5 cursor-pointer select-none',
                isNotDuplicated
                  ? 'bg-blue-50/70 border-blue-600 ring-1 ring-blue-500'
                  : 'bg-slate-50 border-slate-300 hover:border-black'
              )}
            >
              <input
                type="checkbox"
                disabled={isAlreadyVerified}
                checked={isNotDuplicated}
                onChange={(e) => setIsNotDuplicated(e.target.checked)}
                className="mt-1 h-4 w-4 rounded-none text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
              <div className="space-y-1 flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900 font-bold text-sm">
                    Pilar 2: Kebaruan & Pemeriksaan Riwayat Riset (Bebas Duplikasi)
                  </strong>
                  {isNotDuplicated && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-blue-600 px-2 py-0.5 border border-blue-700">
                      Memenuhi
                    </span>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Telah diverifikasi bahwa riset atau penyelesaian masalah serupa <strong>belum pernah dilakukan sebelumnya</strong> dalam repositori SIM-RIDA, atau usulan ini memberikan kebaruan (novelty) serta kelanjutan yang signifikan.
                </p>
              </div>
            </label>

            {/* PILAR 3: URGENSI */}
            <label
              className={cn(
                'p-4 border transition-all flex items-start gap-3.5 cursor-pointer select-none',
                isUrgencyRelevant
                  ? 'bg-blue-50/70 border-blue-600 ring-1 ring-blue-500'
                  : 'bg-slate-50 border-slate-300 hover:border-black'
              )}
            >
              <input
                type="checkbox"
                disabled={isAlreadyVerified}
                checked={isUrgencyRelevant}
                onChange={(e) => setIsUrgencyRelevant(e.target.checked)}
                className="mt-1 h-4 w-4 rounded-none text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
              <div className="space-y-1 flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900 font-bold text-sm">
                    Pilar 3: Tingkat Urgensi Masalah
                  </strong>
                  {isUrgencyRelevant && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-blue-600 px-2 py-0.5 border border-blue-700">
                      Memenuhi
                    </span>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Tingkat kepentingan masalah dinilai mendesak. Penundaan penyelesaian masalah berpotensi menimbulkan dampak negatif terhadap pelayanan masyarakat atau kerugian pembangunan daerah.
                </p>
              </div>
            </label>

            {/* PILAR 4: STRATEGIS */}
            <label
              className={cn(
                'p-4 border transition-all flex items-start gap-3.5 cursor-pointer select-none',
                isStrategicAligned
                  ? 'bg-blue-50/70 border-blue-600 ring-1 ring-blue-500'
                  : 'bg-slate-50 border-slate-300 hover:border-black'
              )}
            >
              <input
                type="checkbox"
                disabled={isAlreadyVerified}
                checked={isStrategicAligned}
                onChange={(e) => setIsStrategicAligned(e.target.checked)}
                className="mt-1 h-4 w-4 rounded-none text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
              <div className="space-y-1 flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900 font-bold text-sm">
                    Pilar 4: Keselarasan Isu Strategis Daerah (RPJMD)
                  </strong>
                  {isStrategicAligned && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-blue-600 px-2 py-0.5 border border-blue-700">
                      Memenuhi
                    </span>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Usulan selaras dengan program prioritas RPJMD Kabupaten Mimika (misal: pengentasan kemiskinan ekstrem, penanganan stunting, diversifikasi ekonomi lokal, penguatan SDM, atau tata kelola pemerintahan).
                </p>
              </div>
            </label>

            {/* PILAR 5: KELAYAKAN RISET */}
            <label
              className={cn(
                'p-4 border transition-all flex items-start gap-3.5 cursor-pointer select-none',
                isResearchFeasible
                  ? 'bg-blue-50/70 border-blue-600 ring-1 ring-blue-500'
                  : 'bg-slate-50 border-slate-300 hover:border-black'
              )}
            >
              <input
                type="checkbox"
                disabled={isAlreadyVerified}
                checked={isResearchFeasible}
                onChange={(e) => setIsResearchFeasible(e.target.checked)}
                className="mt-1 h-4 w-4 rounded-none text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
              <div className="space-y-1 flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900 font-bold text-sm">
                    Pilar 5: Kelayakan Penelitian (Data Dukung & Anggaran)
                  </strong>
                  {isResearchFeasible && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-blue-600 px-2 py-0.5 border border-blue-700">
                      Memenuhi
                    </span>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Ketersediaan data awal mencukupi, metodologi yang diusulkan masuk akal untuk dikerjakan, dan estimasi kebutuhan anggaran dinilai rasional.
                </p>
              </div>
            </label>
          </div>

          {/* CATATAN HASIL VALIDASI */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Catatan Telaah & Rekomendasi Validasi Tim BRIDA <span className="text-blue-600">*</span></span>
              <span className="text-[10px] text-slate-500">Minimal 5 karakter</span>
            </label>
            <textarea
              rows={4}
              disabled={isAlreadyVerified}
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              placeholder="Berikan catatan kesimpulan hasil validasi, arahan penajaman ruang lingkup, atau rincian perbaikan jika dikembalikan..."
              className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-none text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all leading-relaxed"
            />
          </div>

          {/* ACTION BUTTONS */}
          {!isAlreadyVerified ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <Link
                href="/admin/verification"
                className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-black border border-slate-300 bg-white"
              >
                Batal
              </Link>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDecision('REJECT')}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 border border-black hover:bg-black transition-colors cursor-pointer"
                >
                  <XCircle className="h-4 w-4" />
                  Tolak Usulan
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDecision('RETURN')}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-900 bg-white border border-black hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  Kembalikan ke OPD (Perlu Revisi)
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDecision('PASS')}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border border-blue-700 shadow-sm transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isSubmitting ? 'Memproses...' : 'Loloskan ke Tahap 3 (Penyusunan KAK)'}
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600 italic">
                Usulan ini telah selesai diproses validasi.
              </span>
              <Link
                href="/admin/verification"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0f2c59] hover:bg-[#1a3d70] border border-black transition-colors"
              >
                Kembali ke Daftar Antrean
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
