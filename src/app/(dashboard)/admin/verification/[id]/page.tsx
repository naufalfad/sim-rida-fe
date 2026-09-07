'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOpdStore } from '@/store/useOpdStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
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
  CheckSquare, 
  Paperclip,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminVerificationDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { proposals, verifyProposal, returnToOpd } = useOpdStore();

  const proposalId = resolvedParams.id;
  const proposal = proposals.find((p) => p.id === proposalId);

  // Form states for verification
  const [isReturnMode, setIsReturnMode] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState(
    proposal?.adminVerification?.verificationNotes || 'Dokumen KAK/TOR dan uraian permasalahan telah diperiksa dan dinyatakan lengkap secara administrasi.'
  );
  const [returnReason, setReturnReason] = useState(proposal?.revisionNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Administrative checklist items
  const [checkKak, setCheckKak] = useState(!!proposal?.torDocument);
  const [checkProblem, setCheckProblem] = useState(true);
  const [checkBudget, setCheckBudget] = useState(true);
  const [checkSupportingDocs, setCheckSupportingDocs] = useState((proposal?.supportingDocuments?.length || 0) > 0);

  if (!proposal) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4 font-sans">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Usulan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">Data usulan dengan ID tersebut tidak ditemukan dalam sistem.</p>
        <button
          onClick={() => router.push('/admin/verification')}
          className="px-4 py-2 bg-[#0f2c59] hover:bg-[#0a1e3f] text-white text-xs font-semibold uppercase tracking-wider transition"
        >
          Kembali ke Daftar Verifikasi
        </button>
      </div>
    );
  }

  const handleApprove = () => {
    setIsSubmitting(true);
    try {
      verifyProposal(proposal.id, true, verificationNotes, user?.name || 'Admin BRIDA');
      toast(`Usulan ${proposal.code} berhasil diverifikasi dan diloloskan ke tahap Penelaahan & Scoring.`, 'success');
      router.push('/admin/verification');
    } catch (err: any) {
      toast('Gagal memproses verifikasi: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturn = () => {
    if (!returnReason.trim()) {
      toast('Catatan perbaikan / revisi wajib diisi untuk mengembalikan usulan ke OPD.', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      returnToOpd(proposal.id, returnReason.trim(), user?.name || 'Admin BRIDA');
      toast(`Usulan ${proposal.code} telah dikembalikan ke ${proposal.opdName} untuk perbaikan data.`, 'info');
      router.push('/admin/verification');
    } catch (err: any) {
      toast('Gagal mengembalikan usulan: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/verification"
          className="flex items-center gap-1.5 text-xs text-[#0f2c59] hover:underline font-semibold uppercase tracking-wider transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Inbox Verifikasi</span>
        </Link>
        <span className="font-mono text-2xs font-bold text-slate-400">
          ID Usulan: {proposal.id}
        </span>
      </div>

      {/* Header Banner */}
      <div className="border border-slate-200 bg-white p-6 md:p-8 border-l-4 border-l-[#0f2c59] space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-xs font-bold text-[#0f2c59] bg-[#dde6f2] px-2.5 py-1 border border-[#bfd2e6]">
            {proposal.code}
          </span>
          <span className={`text-2xs font-semibold px-2.5 py-1 uppercase tracking-wider border ${
            proposal.status === 'PENDING'
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-[#f0f4f9] text-[#0f2c59] border-[#bfd2e6]'
          }`}>
            {proposal.status === 'PENDING' ? 'Menunggu Verifikasi Administrasi' : `Status: ${proposal.status}`}
          </span>
          <span className="text-2xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 border border-slate-300 uppercase tracking-wider">
            Kategori: {proposal.category}
          </span>
        </div>

        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
          {proposal.title}
        </h1>

        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600 font-medium pt-1 border-t border-slate-100">
          <span className="flex items-center gap-1.5 font-bold text-slate-900">
            <Building2 className="w-4 h-4 text-[#0f2c59]" />
            {proposal.opdName}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#0f2c59]" />
            Diajukan: {proposal.submittedAt || proposal.createdAt}
          </span>
        </div>
      </div>

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Detailed Proposal Dossier (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Key Metrics Strip (Divided by lines) */}
          <div className="border border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            <div className="p-4 space-y-1">
              <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block">Estimasi Kebutuhan Pagu</span>
              <span className="text-base font-bold text-[#0f2c59] font-mono block">
                {proposal.estimatedBudget 
                  ? `Rp ${proposal.estimatedBudget.toLocaleString('id-ID')}`
                  : 'Sesuai Standar Satuan Biaya (SBM)'}
              </span>
            </div>

            <div className="p-4 space-y-1">
              <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block">Target Output Luaran</span>
              <span className="text-xs font-semibold text-slate-800 block">
                {proposal.expectedOutput}
              </span>
            </div>

            <div className="p-4 space-y-1">
              <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block">Tingkat Urgensi</span>
              <span className={`inline-block px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider border ${
                proposal.urgencyLevel === 'TINGGI' 
                  ? 'bg-rose-50 text-rose-800 border-rose-300' 
                  : proposal.urgencyLevel === 'SEDANG'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-blue-50 text-blue-800 border-blue-300'
              }`}>
                {proposal.urgencyLevel}
              </span>
            </div>
          </div>

          {/* 1. Uraian Masalah & Latar Belakang Lapangan */}
          <div className="border border-slate-200 bg-white p-6 space-y-3">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0f2c59]" />
                1. Identifikasi Masalah & Latar Belakang Lapangan
              </h3>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line text-justify">
              {proposal.problemStatement}
            </p>
          </div>

          {/* 2. Urgensi & Dampak Kebijakan */}
          <div className="border border-slate-200 bg-white p-6 space-y-3">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#0f2c59]" />
                2. Urgensi Penelitian (Mengapa Harus Diteliti Sekarang?)
              </h3>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line text-justify">
              {proposal.urgencyReason}
            </p>
          </div>

          {/* 3. Dokumen Kerangka Acuan Kerja (KAK / TOR) */}
          <div className="border border-slate-200 bg-white p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0f2c59]" />
                3. Dokumen Kerangka Acuan Kerja (KAK / TOR)
              </h3>
              {proposal.torDocument ? (
                <span className="text-2xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-300 uppercase">
                  Tersedia & Valid
                </span>
              ) : (
                <span className="text-2xs font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 border border-amber-300 uppercase">
                  Belum Dilampirkan OPD
                </span>
              )}
            </div>

            {proposal.torDocument ? (
              <div className="p-4 border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#0f2c59] text-white">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">{proposal.torDocument.name}</span>
                    <span className="text-2xs text-slate-500">
                      {proposal.torDocument.size} • Diunggah {proposal.torDocument.uploadDate}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert(`Mengunduh TOR: ${proposal.torDocument?.name}`)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold uppercase tracking-wider transition"
                >
                  Pratinjau / Unduh
                </button>
              </div>
            ) : (
              <div className="p-3 border border-amber-300 bg-amber-50 text-amber-900 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>OPD tidak melampirkan berkas TOR mandiri. BRIDA dapat menyusun KAK teknis secara mandiri pada tahap Manajemen Kajian.</span>
              </div>
            )}
          </div>

          {/* 4. Berkas Data Dukung Tambahan */}
          <div className="border border-slate-200 bg-white p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-[#0f2c59]" />
                4. Berkas Lampiran Data Dukung Tambahan ({proposal.supportingDocuments?.length || 0})
              </h3>
            </div>

            {(!proposal.supportingDocuments || proposal.supportingDocuments.length === 0) ? (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-50 text-center border border-slate-200">
                Tidak ada berkas data dukung tambahan khusus yang dilampirkan oleh OPD.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {proposal.supportingDocuments.map((doc, idx) => (
                  <div key={idx} className="p-3 border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileText className="w-4 h-4 text-[#0f2c59] shrink-0" />
                      <div className="overflow-hidden">
                        <span className="font-bold text-slate-900 text-xs truncate block">{doc.name}</span>
                        <span className="text-2xs text-slate-500">{doc.size}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => alert(`Mengunduh dokumen: ${doc.name}`)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-2xs border border-slate-300 uppercase shrink-0"
                    >
                      Unduh
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Gatekeeper Action Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-slate-200 bg-white p-6 space-y-6 sticky top-6">
            
            <div className="border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-[#0f2c59] text-xs font-bold uppercase tracking-wider mb-1">
                <CheckSquare className="w-4 h-4" />
                Panel Keputusan Gatekeeper
              </div>
              <h3 className="text-sm font-bold text-slate-900">Verifikasi & Validasi Berkas</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tentukan kelayakan usulan sebelum diteruskan ke penelaahan teknis.</p>
            </div>

            {/* Checklist Administrasi Digital */}
            <div className="space-y-2.5 border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Checklist Kelengkapan Administrasi:
              </span>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkProblem}
                  onChange={(e) => setCheckProblem(e.target.checked)}
                  className="rounded-none text-[#0f2c59] focus:ring-0 w-4 h-4"
                />
                <span>Uraian Masalah Jelas & Spesifik</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkKak}
                  onChange={(e) => setCheckKak(e.target.checked)}
                  className="rounded-none text-[#0f2c59] focus:ring-0 w-4 h-4"
                />
                <span>Kesesuaian Urgensi & Target Luaran</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkBudget}
                  onChange={(e) => setCheckBudget(e.target.checked)}
                  className="rounded-none text-[#0f2c59] focus:ring-0 w-4 h-4"
                />
                <span>Estimasi Kebutuhan Pagu Wajar</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkSupportingDocs}
                  onChange={(e) => setCheckSupportingDocs(e.target.checked)}
                  className="rounded-none text-[#0f2c59] focus:ring-0 w-4 h-4"
                />
                <span>Data Dukung Lapangan Memadai</span>
              </label>
            </div>

            {/* Decision Radio Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Pilih Keputusan Gatekeeper:
              </label>

              <div className="grid grid-cols-1 gap-2">
                <label className={`flex items-start gap-2.5 p-3 border cursor-pointer transition ${
                  !isReturnMode 
                    ? 'border-[#0f2c59] bg-[#f0f4f9] text-[#0f2c59] font-bold' 
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="verifyDecision"
                    checked={!isReturnMode}
                    onChange={() => setIsReturnMode(false)}
                    className="mt-0.5 text-[#0f2c59] focus:ring-0"
                  />
                  <div>
                    <span className="text-xs block uppercase">Loloskan ke Penelaahan & Scoring</span>
                    <span className="text-2xs font-normal text-slate-500">Usulan valid dan diteruskan ke tim penilai</span>
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-3 border cursor-pointer transition ${
                  isReturnMode 
                    ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold' 
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="verifyDecision"
                    checked={isReturnMode}
                    onChange={() => setIsReturnMode(true)}
                    className="mt-0.5 text-rose-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs block uppercase text-rose-700">Kembalikan ke OPD (Minta Revisi)</span>
                    <span className="text-2xs font-normal text-slate-500">Uraian kurang jelas atau data belum lengkap</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Form Input Notes */}
            {!isReturnMode ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Catatan Verifikator (Opsional):
                </label>
                <textarea
                  rows={3}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Contoh: Dokumen administrasi lengkap dan siap masuk tahap scoring."
                  className="w-full p-2.5 border border-slate-300 bg-white text-xs focus:border-[#0f2c59] focus:outline-none focus:ring-1 focus:ring-[#0f2c59]"
                />
              </div>
            ) : (
              <div className="space-y-1.5 p-3 border border-rose-300 bg-rose-50">
                <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Catatan Revisi / Instruksi Perbaikan OPD:
                </label>
                <textarea
                  rows={4}
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Contoh: Mohon lengkapi rincian data prevalensi per wilayah kapanewon..."
                  className="w-full p-2.5 bg-white border border-rose-300 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800"
                />
              </div>
            )}

            {/* Submit Action Button */}
            <div className="pt-2">
              {!isReturnMode ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleApprove}
                  className="w-full py-2.5 bg-[#0f2c59] hover:bg-[#0a1e3f] text-white font-semibold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 border border-[#0f2c59]"
                >
                  <CheckCircle2 className="w-4 h-4 text-sky-300" />
                  <span>Sahkan & Loloskan ke Scoring</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleReturn}
                  className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 border border-rose-800"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Kirim Balik ke OPD untuk Revisi</span>
                </button>
              )}
            </div>

            {/* Previous Verification History */}
            {proposal.adminVerification && (
              <div className="p-3 border border-slate-200 bg-slate-50 text-xs space-y-1">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block">Riwayat Verifikasi Sebelumnya:</span>
                <p className="text-slate-800 font-semibold">{proposal.adminVerification.verificationNotes}</p>
                <span className="text-2xs text-slate-500 block">
                  Oleh: {proposal.adminVerification.verifiedBy} ({proposal.adminVerification.verifiedAt})
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
