'use client';

import React, { useState, useRef, useEffect, use } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  useOpdStore,
  ProposalUrgency,
  ExpectedOutput,
  mapBackendExpectedOutputToFrontend,
  OpdProposal,
} from '@/store/useOpdStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  FileEdit,
  Save,
  Send,
  UploadCloud,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Building2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { uploadAndCacheFile } from '@/lib/file-storage';

const OUTPUT_OPTIONS: ExpectedOutput[] = [
  'Rekomendasi Teknis',
  'Kajian Kebijakan / Policy Brief',
  'Naskah Akademik Perda',
  'Solusi Teknologi',
  'Model / Blueprint',
  'Studi Kelayakan',
];

export default function EditProposalPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params?.id as string;

  const { toast } = useToast();
  const { user, token } = useAuthStore();
  const {
    fetchProposalById,
    updateProposal,
    activeOpdName,
    opds,
    categories: storeCategories,
    fetchOpds,
    fetchCategories,
  } = useOpdStore();

  const [isLoading, setIsLoading] = useState(true);
  const [proposal, setProposal] = useState<OpdProposal | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form states
  const [selectedOpdName, setSelectedOpdName] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [urgencyReason, setUrgencyReason] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<ProposalUrgency>('TINGGI');
  const [expectedOutput, setExpectedOutput] = useState<ExpectedOutput>('Rekomendasi Teknis');
  const [estimatedBudget, setEstimatedBudget] = useState<number | ''>('');
  const [estimatedDuration, setEstimatedDuration] = useState<number | ''>(3);

  // Dokumen TOR / KAK
  const [torDocument, setTorDocument] = useState<{
    name: string;
    size: string;
    uploadDate: string;
    url?: string;
    dataUrl?: string;
  } | null>(null);
  const torInputRef = useRef<HTMLInputElement | null>(null);

  // Dokumen Pendukung Lainnya
  const [documents, setDocuments] = useState<
    Array<{ name: string; size: string; uploadDate: string; url?: string; dataUrl?: string }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Initial master data load
  useEffect(() => {
    fetchOpds();
    fetchCategories();
  }, [fetchOpds, fetchCategories]);

  // 2. Load proposal by ID
  useEffect(() => {
    if (!proposalId) return;

    let isMounted = true;
    setIsLoading(true);

    fetchProposalById(proposalId)
      .then((data) => {
        if (!isMounted) return;
        setProposal(data);
        setTitle(data.title || '');
        setCategory(data.category || storeCategories[0] || 'Pendidikan');
        setProblemStatement(data.problemStatement || '');
        setUrgencyReason(data.urgencyReason || '');
        setUrgencyLevel((data.urgencyLevel as ProposalUrgency) || 'TINGGI');
        setExpectedOutput(mapBackendExpectedOutputToFrontend(data.expectedOutput));
        setEstimatedBudget(
          data.estimatedBudget !== undefined && data.estimatedBudget !== null
            ? Number(data.estimatedBudget)
            : ''
        );
        setEstimatedDuration(
          data.estimatedDuration !== undefined && data.estimatedDuration !== null
            ? Number(data.estimatedDuration)
            : 3
        );
        setSelectedOpdName(data.opdName || '');
        setTorDocument(data.torDocument || null);
        setDocuments(data.supportingDocuments || []);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoadError(err.message || 'Usulan tidak ditemukan atau akses ditolak.');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [proposalId, fetchProposalById, storeCategories]);

  const handleTorUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > 25 * 1024 * 1024) {
        toast('Ukuran file KAK/TOR maksimal adalah 25MB', 'warning');
        return;
      }
      try {
        const storedDoc = await uploadAndCacheFile(file, token);
        setTorDocument(storedDoc);
        toast(`Dokumen KAK/TOR "${file.name}" berhasil diperbarui.`, 'success');
      } catch (err: any) {
        toast(`Gagal mengunggah dokumen KAK: ${err.message}`, 'error');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > 20 * 1024 * 1024) {
        toast('Ukuran file maksimal adalah 20MB', 'warning');
        return;
      }
      try {
        const storedDoc = await uploadAndCacheFile(file, token);
        setDocuments((prev) => [...prev, storedDoc]);
        toast(`Berkas "${file.name}" berhasil ditambahkan.`, 'success');
      } catch (err: any) {
        toast(`Gagal mengunggah berkas: ${err.message}`, 'error');
      }
    }
  };

  const removeDoc = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (isSubmit: boolean) => {
    if (!title.trim()) {
      toast('Judul usulan penelitian wajib diisi.', 'warning');
      return;
    }
    if (title.trim().length < 5) {
      toast('Judul usulan minimal 5 karakter.', 'warning');
      return;
    }
    if (!problemStatement.trim()) {
      toast('Identifikasi masalah / latar belakang wajib diisi.', 'warning');
      return;
    }
    if (problemStatement.trim().length < 10) {
      toast('Identifikasi masalah minimal 10 karakter.', 'warning');
      return;
    }
    if (!urgencyReason.trim()) {
      toast('Alasan urgensi penelitian wajib diisi.', 'warning');
      return;
    }
    if (urgencyReason.trim().length < 10) {
      toast('Alasan urgensi minimal 10 karakter.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);

      await updateProposal(proposalId, {
        title: title.trim(),
        category: category.trim(),
        problemStatement: problemStatement.trim(),
        urgencyReason: urgencyReason.trim(),
        urgencyLevel,
        expectedOutput,
        estimatedBudget: estimatedBudget === '' ? undefined : Number(estimatedBudget),
        estimatedDuration: estimatedDuration === '' ? 3 : Number(estimatedDuration),
        torDocument: torDocument || undefined,
        supportingDocuments: documents,
        isSubmit,
      });

      if (isSubmit) {
        toast('Usulan penelitian resmi DIKIRIM ke BRIDA untuk ditelaah.', 'success');
      } else {
        toast('Perubahan draf usulan berhasil disimpan.', 'success');
      }

      router.push('/opd/tracking');
    } catch (err: any) {
      toast('Gagal menyimpan perubahan: ' + (err.message || 'Terjadi kesalahan sistem'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3 font-sans">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-600">Memuat data draf usulan...</p>
      </div>
    );
  }

  if (loadError || !proposal) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white border border-red-200 rounded-lg space-y-4 font-sans text-center my-8">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h3 className="text-sm font-bold text-slate-900">Gagal Membuka Usulan</h3>
        <p className="text-xs text-slate-600">{loadError || 'Data usulan tidak ditemukan.'}</p>
        <button
          onClick={() => router.push('/opd/tracking')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition"
        >
          Kembali ke Riwayat Tracking
        </button>
      </div>
    );
  }

  const isEditable = ['DRAFT', 'RETURNED'].includes(proposal.status);

  if (!isEditable) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white border border-amber-200 rounded-lg space-y-4 font-sans text-center my-8">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h3 className="text-sm font-bold text-slate-900">Usulan Tidak Dapat Diedit</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Usulan <strong>{proposal.code}</strong> saat ini berstatus{' '}
          <span className="font-bold text-blue-900">{proposal.status}</span> dan sedang dalam proses penelaahan BRIDA.
          Hanya usulan berstatus <strong>DRAFT</strong> atau <strong>RETURNED (Perlu Revisi)</strong> yang dapat disunting kembali.
        </p>
        <button
          onClick={() => router.push('/opd/tracking')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition"
        >
          Kembali ke Riwayat Tracking
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Top navigation */}
      <div>
        <button
          onClick={() => router.push('/opd/tracking')}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-700 font-semibold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Riwayat Tracking</span>
        </button>
      </div>

      <PageHeader
        title={proposal.status === 'RETURNED' ? 'Perbaikan Usulan Riset (Revisi)' : 'Lanjutkan Pengisian Draf Usulan'}
        description={`Perbarui dan lengkapi rincian usulan riset ${proposal.code} untuk instansi ${selectedOpdName || activeOpdName}.`}
        action={
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-extrabold bg-blue-50 text-blue-900 px-2.5 py-1 rounded border border-blue-200">
              {proposal.code}
            </span>
            <span
              className={`text-2xs font-extrabold px-2.5 py-1 rounded border ${
                proposal.status === 'RETURNED'
                  ? 'bg-red-50 text-red-700 border-red-300'
                  : 'bg-slate-100 text-slate-800 border-black'
              }`}
            >
              {proposal.status === 'RETURNED' ? 'PERLU REVISI' : 'DRAFT'}
            </span>
          </div>
        }
      />

      {/* Catatan Revisi jika RETURNED */}
      {proposal.status === 'RETURNED' && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-red-900">
            <RotateCcw className="h-4 w-4 text-red-600" />
            <span>Catatan Pengembalian Berkas dari Verifikator BRIDA</span>
          </div>
          <p className="text-xs text-red-800 bg-white p-3 rounded border border-red-200 leading-relaxed font-sans">
            {proposal.revisionNotes ||
              proposal.adminVerification?.verificationNotes ||
              'Mohon lengkapi latar belakang permasalahan atau lampirkan dokumen KAK/TOR yang sesuai standar litbang daerah.'}
          </p>
        </div>
      )}

      {/* Main Grid: Form Left (2/3), Sidebar Right (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================= LEFT FORM ================= */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-t-4 border-t-[#0f2c59] border border-slate-200">
            <CardHeader className="pb-4 border-b border-slate-200">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FileEdit className="h-4 w-4 text-blue-600" />
                <span>Formulir Penyuntingan Usulan Riset</span>
              </CardTitle>
              <CardDescription className="text-2xs text-slate-500">
                Lengkapi seluruh informasi masalah faktual dan kebutuhan penelitian ilmiah instansi Anda.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Instansi OPD (Read Only / Prefilled) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-blue-600" />
                  <span>Perangkat Daerah Pengusul (OPD)</span>
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedOpdName || activeOpdName || 'Instansi OPD Kabupaten Mimika'}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-xs text-slate-600 font-semibold cursor-not-allowed"
                />
              </div>

              {/* 1. Identifikasi Masalah */}
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                  1. Identifikasi Masalah & Latar Belakang
                </h4>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>
                      Judul Usulan Penelitian <span className="text-red-500">*</span>
                    </span>
                    <span className="text-3xs text-slate-400 font-normal">Minimal 5 karakter</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Kajian Efektivitas Distribusi Logistik Pangan di Wilayah Pedalaman Mimika"
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium text-slate-900 bg-white placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>
                      Rumusan Masalah / Latar Belakang Lapangan <span className="text-red-500">*</span>
                    </span>
                    <span className="text-3xs text-slate-400 font-normal">Minimal 10 karakter</span>
                  </label>
                  <textarea
                    rows={4}
                    value={problemStatement}
                    onChange={(e) => setProblemStatement(e.target.value)}
                    placeholder="Uraikan kesenjangan antara kondisi eksisting dengan target capaian daerah, hambatan teknis, dan data empiris awal di lapangan..."
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-white placeholder:text-slate-400 leading-relaxed font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>
                      Alasan Urgensi Riset bagi Kebijakan Daerah <span className="text-red-500">*</span>
                    </span>
                    <span className="text-3xs text-slate-400 font-normal">Minimal 10 karakter</span>
                  </label>
                  <textarea
                    rows={3}
                    value={urgencyReason}
                    onChange={(e) => setUrgencyReason(e.target.value)}
                    placeholder="Jelaskan dampak risiko jika kajian ini ditunda, relevansi dengan dokumen RPJMD, atau kebutuhan mendesak untuk regulasi kepala daerah..."
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-white placeholder:text-slate-400 leading-relaxed font-sans"
                  />
                </div>
              </div>

              {/* 2. Kategori & Prioritas */}
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                  2. Kategori & Tingkat Urgensi
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Bidang Urusan / Kategori <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-white font-medium"
                    >
                      {storeCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Tingkat Urgensi Waktu <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={urgencyLevel}
                      onChange={(e) => setUrgencyLevel(e.target.value as ProposalUrgency)}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-white font-medium"
                    >
                      <option value="TINGGI">Tinggi (Mendesak untuk tahun anggaran ini)</option>
                      <option value="SEDANG">Sedang (Dibutuhkan untuk perencanaan tahun berikutnya)</option>
                      <option value="RENDAH">Rendah (Eksplorasi jangka panjang)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Luaran & Anggaran */}
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                  3. Target Luaran & Estimasi Anggaran
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-800">Target Luaran Akhir</label>
                    <select
                      value={expectedOutput}
                      onChange={(e) => setExpectedOutput(e.target.value as ExpectedOutput)}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-white font-medium"
                    >
                      {OUTPUT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-800">Estimasi Anggaran (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      value={estimatedBudget}
                      onChange={(e) => setEstimatedBudget(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="150000000"
                      className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-white font-mono"
                    />
                    <span className="text-3xs text-slate-500 block">Opsional / Perkiraan pagu</span>
                  </div>

                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-800">Durasi Kajian (Bulan)</label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={estimatedDuration}
                      onChange={(e) => setEstimatedDuration(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="3"
                      className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-white font-mono"
                    />
                    <span className="text-3xs text-slate-500 block">Default: 3 bulan</span>
                  </div>
                </div>
              </div>

              {/* 4. Berkas Pendukung (TOR & Dokumen) */}
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                  4. Berkas Pendukung (TOR/KAK & Lampiran)
                </h4>

                {/* TOR / KAK Upload */}
                <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-blue-700" />
                      <span>Kerangka Acuan Kerja (KAK) / TOR Awal</span>
                    </span>
                    <span className="text-3xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Sangat Dianjurkan
                    </span>
                  </div>

                  {torDocument ? (
                    <div className="flex items-center justify-between p-2.5 bg-white border border-blue-300 rounded shadow-xs text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-slate-900 block truncate">{torDocument.name}</span>
                          <span className="text-3xs text-slate-500">
                            {torDocument.size} • Diupload {torDocument.uploadDate}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTorDocument(null)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Hapus KAK"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => torInputRef.current?.click()}
                      className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white rounded p-4 text-center cursor-pointer transition-all hover:bg-blue-50/30"
                    >
                      <input
                        ref={torInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleTorUpload}
                        className="hidden"
                      />
                      <UploadCloud className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                      <span className="text-xs font-bold text-blue-900 block">Pilih Dokumen KAK/TOR</span>
                      <span className="text-3xs text-slate-500 block mt-0.5">Format PDF, DOC, DOCX (Maks 25MB)</span>
                    </div>
                  )}
                </div>

                {/* Additional Supporting Docs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Dokumen Pendukung Tambahan Lainnya</span>
                    <span className="text-3xs text-slate-500">Data tabular, telaah staf, atau regulasi terkait</span>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50 rounded p-3 text-center cursor-pointer transition-all hover:bg-slate-100"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <span className="text-2xs font-semibold text-slate-700 flex items-center justify-center gap-1.5">
                      <UploadCloud className="h-3.5 w-3.5 text-slate-500" />
                      <span>Klik untuk menambah berkas pendukung tambahan</span>
                    </span>
                  </div>

                  {documents.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                            <div className="truncate">
                              <span className="font-bold text-slate-800 block truncate max-w-sm">{doc.name}</span>
                              <span className="text-3xs text-slate-500">
                                {doc.size} • Diupload {doc.uploadDate}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDoc(idx)}
                            className="p-1 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => router.push('/opd/tracking')}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded text-xs font-bold text-slate-700 transition"
                >
                  Batal
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSave(false)}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded text-xs font-bold transition flex items-center gap-1.5 shadow-xs border border-slate-300"
                  >
                    <Save className="h-4 w-4 text-blue-600" />
                    <span>Simpan Perubahan Draf</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSave(true)}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-extrabold transition shadow flex items-center gap-2 border border-blue-700 active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Mengirimkan...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Kirim Usulan ke BRIDA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================= RIGHT SIDEBAR ================= */}
        <div className="space-y-6">
          <Card className="shadow-sm border-t-4 border-t-[#0f2c59] border border-slate-200">
            <CardHeader className="pb-2 border-b border-slate-200">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span>Petunjuk Penyuntingan Usulan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-2xs leading-relaxed text-slate-700">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
                <span className="font-bold text-blue-950 block text-xs">Penyempurnaan Draf:</span>
                <p className="text-3xs text-blue-900">
                  Pastikan masalah yang diangkat memiliki urgensi tinggi dan relevan dengan program prioritas pembangunan daerah Mimika.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 block">1. Simpan Perubahan vs Kirim:</span>
                  <p className="text-3xs text-slate-500">
                    Memilih <em>Simpan Perubahan Draf</em> membuat berkas tetap dapat disunting kembali kapan saja.
                    Memilih <em>Kirim Usulan ke BRIDA</em> akan langsung mengunci berkas dan meneruskannya ke antrean verifikasi Admin BRIDA.
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 block">2. Kelengkapan KAK/TOR:</span>
                  <p className="text-3xs text-slate-500">
                    Melampirkan KAK/TOR awal sangat mempercepat proses telaah evaluator serta meningkatkan skor kelayakan riset.
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 block">3. Pasca Pengiriman:</span>
                  <p className="text-3xs text-slate-500">
                    Setelah dikirimkan, Anda dapat memantau setiap tahap telaah dan verifikasi 5 pilar melalui menu Tracking Usulan.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
