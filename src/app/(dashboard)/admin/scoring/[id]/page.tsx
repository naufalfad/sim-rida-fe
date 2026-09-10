'use client';

import React, { useState, useMemo, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  useOpdStore, 
  OpdProposal, 
  AdminScoringData,
  ExecutionMethod 
} from '@/store/useOpdStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Building2,
  Calendar,
  Layers,
  Save,
  Send,
  Download,
  Sparkles,
  Paperclip,
  Check,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  DollarSign,
  Sliders,
  BookOpen,
  Briefcase,
  Loader2,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { DocumentViewerModal, DocumentReviewItem } from '@/components/ui/document-viewer-modal';
import { openOrDownloadFile, downloadFileDirectly, isPdfDocument } from '@/lib/file-viewer';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminScoringDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { proposals, saveScoring, approveToResearch, fetchScoringQueue, fetchProposals, isLoadingProposals } = useOpdStore();

  const proposalId = resolvedParams.id;
  const proposal = proposals.find((p) => p.id === proposalId);

  useEffect(() => {
    if (!proposal) {
      fetchScoringQueue();
      fetchProposals();
    }
  }, [proposal, fetchScoringQueue, fetchProposals]);

  // Scoring form states initialized from existing scoringData or smart defaults
  const [visionAlignmentScore, setVisionAlignmentScore] = useState<number>(
    proposal?.scoringData?.visionAlignmentScore ?? 85
  );
  const [urgencyScore, setUrgencyScore] = useState<number>(
    proposal?.scoringData?.urgencyScore ?? (proposal?.urgencyLevel === 'TINGGI' ? 90 : proposal?.urgencyLevel === 'SEDANG' ? 80 : 70)
  );
  const [budgetFeasibilityScore, setBudgetFeasibilityScore] = useState<number>(
    proposal?.scoringData?.budgetFeasibilityScore ?? 80
  );
  const [dataReadinessScore, setDataReadinessScore] = useState<number>(
    proposal?.scoringData?.dataReadinessScore ?? 80
  );
  const [fieldClassification, setFieldClassification] = useState<AdminScoringData['fieldClassification']>(
    proposal?.scoringData?.fieldClassification ?? 'Sosial Budaya & Kesejahteraan'
  );
  const [executionMethod, setExecutionMethod] = useState<ExecutionMethod>(
    proposal?.scoringData?.executionMethod ?? 'SWAKELOLA'
  );
  const [researchScheme, setResearchScheme] = useState<AdminScoringData['researchScheme']>(
    proposal?.scoringData?.researchScheme ?? 'INTERNAL_BRIDA'
  );
  const [evaluatorNotes, setEvaluatorNotes] = useState<string>(
    proposal?.scoringData?.evaluatorNotes ?? 'Usulan sangat relevan dan layak didukung ke dalam agenda riset prioritas daerah tahun anggaran berjalan.'
  );
  const [targetCompletionDate, setTargetCompletionDate] = useState<string>(
    proposal?.studyData?.targetCompletionDate ?? '2026-11-30'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document review modal state
  const [previewDoc, setPreviewDoc] = useState<DocumentReviewItem | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const openDocumentReview = (docItem: Partial<DocumentReviewItem>) => {
    setPreviewDoc({
      name: docItem.name || 'Dokumen_Usulan_SIMRIDA.pdf',
      size: docItem.size || '1.4 MB',
      uploadDate: docItem.uploadDate || proposal?.submittedAt || '01 Jan 2026',
      type: docItem.type || 'DATA_DUKUNG',
      proposalCode: proposal?.code,
      proposalTitle: proposal?.title,
      opdName: proposal?.opdName,
      problemStatement: proposal?.problemStatement,
      urgencyReason: proposal?.urgencyReason,
      estimatedBudget: proposal?.estimatedBudget,
      expectedOutput: proposal?.expectedOutput,
    });
    setIsDocModalOpen(true);
  };

  // Weighted total score calculation
  // 30% Visi Misi + 30% Urgensi + 20% Anggaran + 20% Kesiapan Data & Kapasitas
  const totalScore = useMemo(() => {
    const total = (visionAlignmentScore * 0.3) + (urgencyScore * 0.3) + (budgetFeasibilityScore * 0.2) + (dataReadinessScore * 0.2);
    return Math.round(total);
  }, [visionAlignmentScore, urgencyScore, budgetFeasibilityScore, dataReadinessScore]);

  if (isLoadingProposals && !proposal) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4 font-sans">
        <Loader2 className="w-10 h-10 text-[#0f2c59] animate-spin mx-auto" />
        <p className="text-xs text-slate-600 font-semibold">Memuat data instrumen scoring usulan riset...</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4 font-sans">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Usulan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">Data usulan dengan ID tersebut tidak ditemukan dalam sistem.</p>
        <button
          onClick={() => router.push('/admin/scoring')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow"
        >
          Kembali ke Daftar Scoring
        </button>
      </div>
    );
  }

  const handleSaveOnly = async () => {
    setIsSubmitting(true);
    try {
      await saveScoring(proposal.id, {
        visionAlignmentScore,
        urgencyScore,
        budgetFeasibilityScore,
        dataReadinessScore,
        totalScore,
        fieldClassification,
        executionMethod,
        researchScheme: executionMethod === 'SWAKELOLA' ? 'INTERNAL_BRIDA' : 'KERJASAMA',
        evaluatorNotes,
        scoredAt: new Date().toISOString().split('T')[0],
        scoredBy: user?.name || 'Admin Litbang BRIDA',
      });
      toast(`Penilaian usulan ${proposal.code} berhasil disimpan dengan skor ${totalScore}/100.`, 'success');
    } catch (err: any) {
      toast('Gagal menyimpan penilaian: ' + (err.message || 'Terjadi kesalahan sistem'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalizeAndApprove = async () => {
    setIsSubmitting(true);
    try {
      await saveScoring(proposal.id, {
        visionAlignmentScore,
        urgencyScore,
        budgetFeasibilityScore,
        dataReadinessScore,
        totalScore,
        fieldClassification,
        executionMethod,
        researchScheme: executionMethod === 'SWAKELOLA' ? 'INTERNAL_BRIDA' : 'KERJASAMA',
        evaluatorNotes,
        scoredAt: new Date().toISOString().split('T')[0],
        scoredBy: user?.name || 'Admin Litbang BRIDA',
      });
      approveToResearch(proposal.id, targetCompletionDate);
      toast(`Skor difinalisasi (${totalScore}/100). Usulan ${proposal.code} berhasil diteruskan ke tahap Eksekutif & Manajemen Riset!`, 'success');
      router.push('/admin/scoring');
    } catch (err: any) {
      toast('Gagal memfinalisasi penilaian: ' + (err.message || 'Terjadi kesalahan sistem'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      
      {/* Back Button & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/scoring"
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-700 font-bold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Penelaahan & Scoring</span>
        </Link>
        <span className="font-mono text-xs font-bold text-slate-500">
          ID: {proposal.id}
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-[#0f2c59] border border-black p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs font-black bg-[#1b3b6f] text-sky-300 border border-[#264978] px-3 py-1">
              {proposal.code}
            </span>
            <span className="text-xs font-extrabold px-3 py-1 uppercase flex items-center gap-1.5 bg-blue-600 text-white border border-blue-700">
              <Award className="w-3.5 h-3.5 text-white" />
              {proposal.scoringData ? `Sudah Dinilai (Skor: ${proposal.scoringData.totalScore})` : 'Siap Diberi Skor'}
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-black tracking-tight leading-snug">
            {proposal.title}
          </h1>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300 font-medium pt-1">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-sky-400" />
              {proposal.opdName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-400" />
              Diajukan: {proposal.submittedAt || proposal.createdAt}
            </span>
            <span>•</span>
            <span className="font-bold text-sky-300">
              Kategori: {proposal.category}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Proposal Dossier & Context (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Key Metrics Card */}
          <div className="bg-white p-6 border border-black shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <span className="text-3xs font-bold text-slate-500 uppercase tracking-wider block">Estimasi Pagu Anggaran:</span>
              <span className="text-base font-black text-blue-900 font-mono block">
                {proposal.estimatedBudget 
                  ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(proposal.estimatedBudget)
                  : 'Sesuai Standar Satuan Biaya (SBM)'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-3xs font-bold text-slate-500 uppercase tracking-wider block">Target Output Luaran:</span>
              <span className="text-xs font-bold text-slate-800 block">
                {proposal.expectedOutput}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-3xs font-bold text-slate-500 uppercase tracking-wider block">Tingkat Urgensi OPD:</span>
              <span className="inline-block px-2.5 py-0.5 text-xs font-black uppercase bg-blue-50 text-blue-900 border border-blue-300">
                {proposal.urgencyLevel}
              </span>
            </div>
          </div>

          {/* 2. Uraian Masalah & Latar Belakang Lapangan */}
          <div className="bg-white p-6 border border-black shadow-sm space-y-3">
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
              <FileText className="w-4 h-4 text-[#0f2c59]" />
              1. Identifikasi Masalah & Latar Belakang Lapangan
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line text-justify">
              {proposal.problemStatement}
            </p>
          </div>

          {/* 3. Urgensi & Justifikasi Kebijakan */}
          <div className="bg-white p-6 border border-black shadow-sm space-y-3">
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
              <AlertTriangle className="w-4 h-4 text-[#0f2c59]" />
              2. Urgensi Penelitian (Mengapa Harus Diteliti Sekarang?)
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line text-justify">
              {proposal.urgencyReason}
            </p>
          </div>

          {/* 4. Dokumen Lampiran Data Dukung */}
          <div className="bg-white p-6 border border-black shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-[#0f2c59]" />
                3. Berkas Data Dukung dari OPD ({proposal.supportingDocuments?.length || 0})
              </h3>
              <span className="text-[11px] font-semibold text-blue-900 bg-blue-50 px-2.5 py-0.5 border border-blue-300">
                KAK & RKA Dibuat oleh BRIDA
              </span>
            </div>

            <div className="p-3.5 bg-blue-50 border border-blue-200 text-xs text-blue-950 leading-relaxed">
              <p>
                <strong>Catatan Evaluasi:</strong> Dokumen Kerangka Acuan Kerja (KAK) dan Rencana Kerja & Anggaran (RKA) pelaksanaan kajian difokuskan dan disusun langsung oleh tim BRIDA di tahap Manajemen Riset.
              </p>
            </div>

            {(!proposal.supportingDocuments || proposal.supportingDocuments.length === 0) ? (
              <p className="text-xs text-slate-400 italic p-4 bg-slate-50 text-center border border-dashed border-slate-300">
                Tidak ada berkas data dukung tambahan khusus yang dilampirkan oleh OPD.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {proposal.supportingDocuments.map((doc, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-300 flex items-center justify-between gap-2 hover:bg-slate-100 transition">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileText className="w-4 h-4 text-[#0f2c59] shrink-0" />
                      <div className="overflow-hidden">
                        <span className="font-bold text-slate-800 text-xs truncate block">{doc.name}</span>
                        <span className="text-[10px] text-slate-500">{doc.size}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openOrDownloadFile({
                          name: doc.name,
                          size: doc.size,
                          uploadDate: doc.uploadDate,
                          url: doc.url,
                          type: 'DATA_DUKUNG',
                          proposalCode: proposal.code,
                          proposalTitle: proposal.title,
                          opdName: proposal.opdName,
                          content: `LAMPIRAN DATA DUKUNG: ${doc.name}\nUsulan: ${proposal.title} (${proposal.code})\nPengunggah: ${proposal.opdName}`
                        }, toast)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-800 font-bold text-2xs border border-slate-300 transition shadow-xs flex items-center gap-1"
                      >
                        {isPdfDocument(doc.name) ? (
                          <>
                            <ExternalLink className="w-3 h-3 text-[#0f2c59]" />
                            <span>Buka PDF</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3 h-3 text-[#0f2c59]" />
                            <span>Unduh File</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Catatan Verifikasi Gatekeeper Sebelumnya */}
          {proposal.adminVerification && (
            <div className="bg-white p-6 border border-black shadow-sm space-y-2">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
                <ShieldCheck className="w-4 h-4 text-[#0f2c59]" />
                5. Hasil Verifikasi Administrasi (Gatekeeper)
              </h3>
              <div className="p-3.5 bg-blue-50 border border-blue-200 text-xs space-y-1">
                <p className="text-blue-950 font-semibold">{proposal.adminVerification.verificationNotes}</p>
                <span className="text-[10px] text-blue-700 block">
                  Diverifikasi oleh: {proposal.adminVerification.verifiedBy} ({proposal.adminVerification.verifiedAt})
                </span>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Digital Scoring Instrument & Formulation Panel (5 cols, Sticky) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 border border-black shadow-sm space-y-6 sticky top-6">
            
            {/* Header Box */}
            <div className="border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2 text-[#0f2c59] text-xs font-black uppercase tracking-wider mb-1">
                <Award className="w-4 h-4" />
                Instrumen Penilaian Digital
              </div>
              <h3 className="text-base font-black text-slate-900">Scoring & Prioritasi Riset</h3>
              <p className="text-xs text-slate-500 mt-0.5">Penetapan skor pembobotan kriteria, klasifikasi bidang, dan skema riset.</p>
            </div>

            {/* Total Weighted Score Banner */}
            <div className="p-4 bg-[#0f2c59] border border-black text-white shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-200 block">
                    Total Skor Tertimbang
                  </span>
                  <div className="text-3xl font-black font-mono">
                    {totalScore} <span className="text-sm font-normal text-slate-300">/ 100</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 text-xs font-black uppercase border ${
                    totalScore >= 80 
                      ? 'bg-blue-600 text-white border-blue-400' 
                      : totalScore >= 65 
                      ? 'bg-blue-100 text-blue-950 border-blue-400' 
                      : 'bg-slate-100 text-slate-900 border-black'
                  }`}>
                    {totalScore >= 80 ? 'Prioritas Utama' : totalScore >= 65 ? 'Prioritas Kedua' : 'Tidak Prioritas'}
                  </span>
                  <span className="block text-[10px] text-slate-300 font-medium mt-1">
                    {totalScore >= 80 ? 'Rekomendasi Lolos Agenda Riset' : totalScore >= 65 ? 'Dapat Dipertimbangkan' : 'Perlu Penelaahan Lanjut'}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#0a1e3f] h-2 overflow-hidden border border-[#264978]">
                <div 
                  className="h-full transition-all duration-300 bg-sky-400"
                  style={{ width: `${Math.min(100, Math.max(0, totalScore))}%` }}
                />
              </div>
            </div>

            {/* 4 Digital Criteria Sliders */}
            <div className="space-y-4 bg-slate-50 p-4 border border-slate-300">
              
              {/* Kriteria 1: Kesesuaian Visi-Misi (Bobot 30%) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">1. Keselarasan Visi-Misi Daerah & RPJMD (30%)</span>
                  <span className="font-mono font-black text-white bg-[#0f2c59] px-2 py-0.5 border border-black text-xs">
                    {visionAlignmentScore}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={visionAlignmentScore}
                  onChange={(e) => setVisionAlignmentScore(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 appearance-none cursor-pointer accent-[#0f2c59]"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                  <span>0 (Kurang Selaras)</span>
                  <span>50</span>
                  <span>100 (Sangat Selaras)</span>
                </div>
              </div>

              {/* Kriteria 2: Urgensi Masalah Lapangan (Bobot 30%) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">2. Tingkat Urgensi Masalah (30%)</span>
                  <span className="font-mono font-black text-white bg-[#0f2c59] px-2 py-0.5 border border-black text-xs">
                    {urgencyScore}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={urgencyScore}
                  onChange={(e) => setUrgencyScore(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 appearance-none cursor-pointer accent-[#0f2c59]"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                  <span>0 (Tidak Mendesak)</span>
                  <span>50</span>
                  <span>100 (Sangat Mendesak)</span>
                </div>
              </div>

              {/* Kriteria 3: Kelayakan Anggaran & Kesiapan Teknis (Bobot 20%) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">3. Kelayakan Pagu Anggaran & Teknis (20%)</span>
                  <span className="font-mono font-black text-white bg-[#0f2c59] px-2 py-0.5 border border-black text-xs">
                    {budgetFeasibilityScore}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={budgetFeasibilityScore}
                  onChange={(e) => setBudgetFeasibilityScore(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 appearance-none cursor-pointer accent-[#0f2c59]"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                  <span>0 (Biaya/Metode Berat)</span>
                  <span>50</span>
                  <span>100 (Sangat Layak)</span>
                </div>
              </div>

              {/* Kriteria 4: Kesiapan Data & Kapasitas Pelaksanaan Riset (Bobot 20%) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">4. Kesiapan Data Dukung & Kapasitas Riset (20%)</span>
                  <span className="font-mono font-black text-white bg-[#0f2c59] px-2 py-0.5 border border-black text-xs">
                    {dataReadinessScore}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={dataReadinessScore}
                  onChange={(e) => setDataReadinessScore(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 appearance-none cursor-pointer accent-[#0f2c59]"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                  <span>0 (Data Minim)</span>
                  <span>50</span>
                  <span>100 (Data Lengkap & Matang)</span>
                </div>
              </div>

            </div>

            {/* Klasifikasi Bidang Kajian */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Klasifikasi Bidang Riset:
              </label>
              <select
                value={fieldClassification}
                onChange={(e) => setFieldClassification(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-600 focus:bg-white focus:outline-none"
              >
                <option value="Ekonomi">Ekonomi & Pariwisata</option>
                <option value="Pemerintahan & Tata Kelola">Pemerintahan & Tata Kelola Birokrasi</option>
                <option value="Sosial Budaya & Kesejahteraan">Sosial Budaya & Kesejahteraan Masyarakat</option>
                <option value="Inovasi & Teknologi">Inovasi, Teknologi & Lingkungan Hidup</option>
              </select>
            </div>

            {/* Rekomendasi Metode Pelaksanaan Riset */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Rekomendasi Metode Pelaksanaan:</span>
                <span className="text-[11px] font-bold text-blue-900 bg-blue-50 border border-blue-300 px-2 py-0.5">
                  {executionMethod === 'SWAKELOLA' ? 'Swakelola' : executionMethod === 'PENUNJUKAN_LANGSUNG' ? 'Penunjukan Langsung' : executionMethod === 'E_KATALOG' ? 'E-Katalog' : 'Tender'}
                </span>
              </label>
              
              <div className="grid grid-cols-1 gap-2">
                
                {/* 1. Swakelola */}
                <label className={`flex items-start gap-2.5 p-3 border cursor-pointer transition ${
                  executionMethod === 'SWAKELOLA'
                    ? 'border-blue-700 bg-blue-50 text-blue-950 font-bold ring-1 ring-blue-600'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="methodRadio"
                    checked={executionMethod === 'SWAKELOLA'}
                    onChange={() => setExecutionMethod('SWAKELOLA')}
                    className="mt-0.5 text-blue-600 focus:ring-blue-600"
                  />
                  <div>
                    <span className="text-xs block font-bold text-slate-900">1. Swakelola</span>
                    <span className="text-[11px] font-normal text-slate-600">Dikerjakan mandiri oleh tim peneliti internal BRIDA atau swakelola tipe I/II/III/IV.</span>
                  </div>
                </label>

                {/* 2. Penunjukan Langsung */}
                <label className={`flex items-start gap-2.5 p-3 border cursor-pointer transition ${
                  executionMethod === 'PENUNJUKAN_LANGSUNG'
                    ? 'border-blue-700 bg-blue-50 text-blue-950 font-bold ring-1 ring-blue-600'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="methodRadio"
                    checked={executionMethod === 'PENUNJUKAN_LANGSUNG'}
                    onChange={() => setExecutionMethod('PENUNJUKAN_LANGSUNG')}
                    className="mt-0.5 text-blue-600 focus:ring-blue-600"
                  />
                  <div>
                    <span className="text-xs block font-bold text-slate-900">2. Penunjukan Langsung</span>
                    <span className="text-[11px] font-normal text-slate-600">Pengadaan langsung kepada tenaga ahli, pakar, atau konsultan spesialis sesuai regulasi PBJ.</span>
                  </div>
                </label>

                {/* 3. E-Katalog */}
                <label className={`flex items-start gap-2.5 p-3 border cursor-pointer transition ${
                  executionMethod === 'E_KATALOG'
                    ? 'border-blue-700 bg-blue-50 text-blue-950 font-bold ring-1 ring-blue-600'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="methodRadio"
                    checked={executionMethod === 'E_KATALOG'}
                    onChange={() => setExecutionMethod('E_KATALOG')}
                    className="mt-0.5 text-blue-600 focus:ring-blue-600"
                  />
                  <div>
                    <span className="text-xs block font-bold text-slate-900">3. E-Katalog</span>
                    <span className="text-[11px] font-normal text-slate-600">Pembelian jasa riset, kajian, atau konsultan terdaftar melalui E-Katalog LKPP / LPSE.</span>
                  </div>
                </label>

                {/* 4. Tender */}
                <label className={`flex items-start gap-2.5 p-3 border cursor-pointer transition ${
                  executionMethod === 'TENDER'
                    ? 'border-blue-700 bg-blue-50 text-blue-950 font-bold ring-1 ring-blue-600'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="methodRadio"
                    checked={executionMethod === 'TENDER'}
                    onChange={() => setExecutionMethod('TENDER')}
                    className="mt-0.5 text-blue-600 focus:ring-blue-600"
                  />
                  <div>
                    <span className="text-xs block font-bold text-slate-900">4. Tender</span>
                    <span className="text-[11px] font-normal text-slate-600">Seleksi / tender terbuka pengadaan jasa kajian berskala besar yang melibatkan pihak ketiga.</span>
                  </div>
                </label>

              </div>
            </div>

            {/* Catatan Telaah & Rekomendasi Evaluator */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase">
                Catatan Telaah & Rekomendasi Teknis Evaluator:
              </label>
              <textarea
                rows={3}
                value={evaluatorNotes}
                onChange={(e) => setEvaluatorNotes(e.target.value)}
                placeholder="Tuliskan justifikasi kelayakan, metodologi saran, dan catatan prioritas..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white focus:outline-none leading-relaxed text-slate-800"
              />
            </div>

            {/* Target Batas Waktu Penyelesaian */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase">
                Target Waktu Penyelesaian Kajian:
              </label>
              <input
                type="date"
                value={targetCompletionDate}
                onChange={(e) => setTargetCompletionDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-600 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Dual Action Buttons */}
            <div className="space-y-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveOnly}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-2 border border-slate-300"
              >
                <Save className="w-4 h-4 text-slate-600" />
                <span>Simpan Skor Sementara</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalizeAndApprove}
                className="w-full py-3 bg-[#0f2c59] hover:bg-[#1a3d70] text-white font-black text-xs border border-black shadow-md transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                <span>Finalisasi Scoring & Teruskan ke Agenda Riset</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Document Review & Downloader Modal */}
      <DocumentViewerModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        document={previewDoc}
      />
    </div>
  );
}
