'use client';

import React, { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOpdStore, OpdProposal } from '@/store/useOpdStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DocumentViewerModal, DocumentReviewState } from '@/components/ui/document-viewer-modal';
import { openOrDownloadFile, isPdfDocument } from '@/lib/file-viewer';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
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
  User,
  Phone,
  Mail,
  Target,
  Download,
  ExternalLink,
  Eye,
  BadgeAlert,
  Flame,
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
  const { proposals, verifyProposal, fetchProposalById } = useOpdStore();

  const proposalId = resolvedParams.id;
  const [proposal, setProposal] = useState<OpdProposal | null>(
    () => proposals.find((p) => p.id === proposalId) || null
  );
  const [isLoading, setIsLoading] = useState(!proposal);
  const [documentReview, setDocumentReview] = useState<DocumentReviewState | null>(null);

  // 5 Pilar Validasi State
  const [isProblemClear, setIsProblemClear] = useState(true);
  const [isNotDuplicated, setIsNotDuplicated] = useState(true);
  const [isUrgencyRelevant, setIsUrgencyRelevant] = useState(true);
  const [isStrategicAligned, setIsStrategicAligned] = useState(true);
  const [isResearchFeasible, setIsResearchFeasible] = useState(true);

  const [verificationNotes, setVerificationNotes] = useState(
    'Usulan telah ditelaah berdasarkan 5 pilar validasi BRIDA dan memenuhi kriteria kelayakan riset daerah.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch complete proposal details directly from backend API
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchProposalById(proposalId)
      .then((data) => {
        if (!isMounted) return;
        setProposal(data);
        if (data.adminVerification) {
          setIsProblemClear(data.adminVerification.isProblemClear ?? true);
          setIsNotDuplicated(data.adminVerification.isNotDuplicated ?? true);
          setIsUrgencyRelevant(data.adminVerification.isUrgencyRelevant ?? true);
          setIsStrategicAligned(data.adminVerification.isStrategicAligned ?? true);
          setIsResearchFeasible(data.adminVerification.isResearchFeasible ?? true);
          if (data.adminVerification.verificationNotes) {
            setVerificationNotes(data.adminVerification.verificationNotes);
          }
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load proposal detail:', err);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [proposalId, fetchProposalById]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4 font-sans">
        <Loader2 className="w-10 h-10 text-[#0f2c59] animate-spin mx-auto" />
        <p className="text-xs text-slate-600 font-semibold">Memuat rincian lengkap berkas usulan riset...</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4 font-sans bg-white border border-slate-200 p-8">
        <AlertTriangle className="w-12 h-12 text-[#0f2c59] mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Usulan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">Data usulan dengan ID tersebut tidak ditemukan dalam sistem.</p>
        <Link
          href="/admin/verification"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0f2c59] text-white text-xs font-semibold border border-blue-900"
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

  const getUrgencyBadge = (level?: string) => {
    switch (level) {
      case 'TINGGI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
            <Flame className="h-3.5 w-3.5 text-rose-600" />
            Tinggi (Mendesak)
          </span>
        );
      case 'SEDANG':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            Sedang (Tahunan)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            Rendah
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 font-sans">
      {/* HEADER */}
      <PageHeader
        title="Validasi Substansi & Kelayakan Riset OPD"
        description={`Pemeriksaan kelayakan komprehensif usulan riset kode ${proposal.code} dari ${proposal.opdName} berdasarkan 5 pilar instrumen validasi BRIDA.`}
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
              ? 'bg-slate-100 text-slate-900 border-slate-300'
              : 'bg-slate-900 text-white border-slate-800'
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

      {/* ================= SECTION 1: PROPOSAL OVERVIEW CARD ================= */}
      <Card className="bg-white border-slate-200 shadow-xs">
        <CardHeader className="border-b border-slate-200 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-700 px-2.5 py-1 bg-slate-100 border border-slate-300">
                {proposal.code}
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-300">
                Usulan Perangkat Daerah
              </span>
              {getUrgencyBadge(proposal.urgencyLevel)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Diajukan: {proposal.submittedAt || proposal.createdAt || '2026-09-01'}</span>
            </div>
          </div>
          <CardTitle className="text-base font-bold text-slate-900 mt-2 leading-snug">
            {proposal.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5 space-y-5 text-xs">
          
          {/* Card 1.1: Identitas OPD & Kontak Pengusul */}
          <div className="p-4 bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-[#0f2c59]" />
                Identitas Instansi Pengusul & Penanggung Jawab
              </span>
              <span className="text-3xs text-slate-500 bg-white px-2 py-0.5 border border-slate-200">
                {proposal.opd?.category || 'Badan / Dinas Daerah'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Perangkat Daerah (OPD)
                </span>
                <span className="font-bold text-slate-900 mt-0.5 block">{proposal.opdName}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Penanggung Jawab / Staf
                </span>
                <span className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  {proposal.createdBy?.name || 'Staf OPD Pengusul'}
                </span>
                {proposal.createdBy?.nip && (
                  <span className="text-3xs text-slate-500 block font-mono">NIP: {proposal.createdBy.nip}</span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Email Kontak
                </span>
                <span className="font-medium text-slate-800 mt-0.5 flex items-center gap-1 truncate">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{proposal.createdBy?.email || proposal.opd?.email || '-'}</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Nomor Kontak / Telepon
                </span>
                <span className="font-medium text-slate-800 mt-0.5 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {proposal.createdBy?.phone || proposal.opd?.phone || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 1.2: Parameter Riset, Target Luaran & Anggaran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-blue-50/40 border border-blue-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
                Bidang / Kategori Riset
              </span>
              <span className="font-bold text-slate-900 mt-1 block">{proposal.category}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block flex items-center gap-1">
                <Target className="h-3 w-3 text-blue-700" />
                Target Luaran Akhir
              </span>
              <span className="font-bold text-blue-900 mt-1 block">{proposal.expectedOutput}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-blue-700" />
                Estimasi Pagu Anggaran
              </span>
              <span className="font-extrabold text-blue-950 mt-1 block font-mono text-sm">
                {proposal.estimatedBudget
                  ? `Rp ${Number(proposal.estimatedBudget).toLocaleString('id-ID')}`
                  : 'Menyesuaikan APBD'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-700" />
                Estimasi Durasi Kajian
              </span>
              <span className="font-bold text-slate-900 mt-1 block">
                {proposal.estimatedDuration ? `${proposal.estimatedDuration} Bulan` : '3 Bulan'}
              </span>
            </div>
          </div>

          {/* Card 1.3: Substansi Masalah & Urgensi Kebijakan */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-[#0f2c59]" />
                <span>1. Rumusan Masalah / Latar Belakang Lapangan (Fakta Empiris):</span>
              </span>
              <div className="p-4 bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap text-xs">
                {proposal.problemStatement}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-rose-600" />
                <span>2. Alasan Urgensi Riset bagi Pembuatan Kebijakan Daerah:</span>
              </span>
              <div className="p-4 bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap text-xs">
                {proposal.urgencyReason}
              </div>
            </div>

            {proposal.strategicImpact && (
              <div className="space-y-1.5">
                <span className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span>3. Dampak Strategis Kebijakan (Keterkaitan RPJMD / Layanan Publik):</span>
                </span>
                <div className="p-4 bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap text-xs">
                  {proposal.strategicImpact}
                </div>
              </div>
            )}
          </div>

          {/* Card 1.4: Berkas KAK / TOR Awal & Dokumen Pendukung */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-[#0f2c59]" />
                <span>Dokumen Kerangka Acuan Kerja (KAK / TOR) & Berkas Pendukung</span>
              </span>
              <span className="text-3xs text-slate-500">
                Total:{' '}
                {(proposal.torDocument ? 1 : 0) + (proposal.supportingDocuments?.length || 0)} Berkas
              </span>
            </div>

            {/* TOR Document Box */}
            {proposal.torDocument ? (
              <div className="p-3.5 bg-blue-50/70 border border-blue-300 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-blue-600 text-white rounded shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 block truncate">{proposal.torDocument.name}</span>
                      <span className="text-3xs font-extrabold uppercase px-1.5 py-0.2 bg-blue-200 text-blue-900 rounded shrink-0">
                        KAK / TOR Resmi
                      </span>
                    </div>
                    <span className="text-3xs text-slate-500 block mt-0.5">
                      {proposal.torDocument.size} • Diunggah {proposal.torDocument.uploadDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      openOrDownloadFile(
                        {
                          name: proposal.torDocument!.name,
                          type: 'TOR_DOCUMENT',
                          proposalCode: proposal.code,
                          proposalTitle: proposal.title,
                          opdName: proposal.opdName,
                          uploadDate: proposal.torDocument!.uploadDate,
                          size: proposal.torDocument!.size,
                          url: proposal.torDocument!.url,
                          content: `KERANGKA ACUAN KERJA (KAK / TOR)\nJudul: ${proposal.title}\nInstansi: ${proposal.opdName}\nKode: ${proposal.code}\nPagu Anggaran: Rp ${Number(proposal.estimatedBudget || 0).toLocaleString('id-ID')}\nTarget Luaran: ${proposal.expectedOutput}\n\nLatar Belakang Masalah:\n${proposal.problemStatement}\n\nUrgensi Riset:\n${proposal.urgencyReason}`,
                        },
                        toast
                      );
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-blue-600 hover:text-white rounded text-2xs font-bold transition flex items-center gap-1.5 border border-blue-300 shadow-xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Buka / Pratinjau KAK</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
                <span>OPD belum melampirkan berkas KAK/TOR awal terpisah pada formulir pengajuan ini.</span>
              </div>
            )}

            {/* Supporting Documents List */}
            {proposal.supportingDocuments && proposal.supportingDocuments.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-2xs font-bold text-slate-700 block uppercase tracking-wider">
                  Berkas Data Pendukung Tambahan ({proposal.supportingDocuments.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {proposal.supportingDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                        <div className="truncate">
                          <span className="truncate font-medium text-slate-800 block">{doc.name}</span>
                          <span className="text-3xs text-slate-400">{doc.size}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          openOrDownloadFile(
                            {
                              name: doc.name,
                              type: 'DATA_DUKUNG',
                              proposalCode: proposal.code,
                              proposalTitle: proposal.title,
                              opdName: proposal.opdName,
                              uploadDate: doc.uploadDate || proposal.createdAt,
                              size: doc.size,
                              url: doc.url,
                              content: `LAMPIRAN DOKUMEN PENDUKUNG\nNama Berkas: ${doc.name}\nUsulan: ${proposal.title} (${proposal.code})\nInstansi: ${proposal.opdName}`,
                            },
                            toast
                          );
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 rounded text-3xs font-semibold transition flex items-center gap-1 border border-slate-300 shrink-0 shadow-xs"
                      >
                        {isPdfDocument(doc.name) ? (
                          <>
                            <ExternalLink className="h-3 w-3 text-blue-600" />
                            <span>Lihat PDF</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-3 w-3 text-slate-600" />
                            <span>Unduh</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ================= SECTION 2: 5 PILAR VALIDASI FORM ================= */}
      <Card className="bg-white border-slate-200 shadow-xs overflow-hidden">
        <CardHeader className="bg-[#0f2c59] text-white p-5 border-b border-slate-200">
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
                    Pilar 2: Kebaruan & Pemeriksaan Duplikasi
                  </strong>
                  {isNotDuplicated && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-blue-600 px-2 py-0.5 border border-blue-700">
                      Memenuhi
                    </span>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Topik riset belum pernah diteliti sebelumnya oleh instansi manapun di Kabupaten Mimika dalam 3 tahun terakhir dan bukan merupakan duplikasi kajian OPD lain.
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
                    Pilar 3: Tingkat Urgensi Kebijakan Daerah
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
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 border border-slate-800 hover:bg-black transition-colors cursor-pointer"
                >
                  <XCircle className="h-4 w-4" />
                  Tolak Usulan
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDecision('RETURN')}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
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
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0f2c59] hover:bg-[#1a3d70] border border-blue-900 transition-colors"
              >
                Kembali ke Daftar Antrean
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Review & Viewer Modal */}
      {documentReview && (
        <DocumentViewerModal
          isOpen={!!documentReview}
          onClose={() => setDocumentReview(null)}
          document={documentReview}
        />
      )}
    </div>
  );
}
