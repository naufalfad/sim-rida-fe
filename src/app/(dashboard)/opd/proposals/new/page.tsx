'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useOpdStore, ProposalUrgency, ExpectedOutput } from '@/store/useOpdStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  FilePlus2,
  Save,
  Send,
  UploadCloud,
  FileText,
  Trash2,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

const CATEGORIES = [
  'Pendidikan',
  'Kesehatan',
  'Infrastruktur & Teknologi',
  'Ekonomi & Pariwisata',
  'Tata Kelola & Reformasi Birokrasi',
  'Lingkungan Hidup & Bencana',
  'Sosial & Kesejahteraan Masyarakat'
];

const OUTPUT_OPTIONS: ExpectedOutput[] = [
  'Rekomendasi Teknis',
  'Kajian Kebijakan / Policy Brief',
  'Naskah Akademik Perda',
  'Solusi Teknologi',
  'Model / Blueprint'
];

export default function NewProposalPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addProposal } = useOpdStore();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [problemStatement, setProblemStatement] = useState('');
  const [urgencyReason, setUrgencyReason] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<ProposalUrgency>('TINGGI');
  const [expectedOutput, setExpectedOutput] = useState<ExpectedOutput>('Rekomendasi Teknis');
  const [estimatedBudget, setEstimatedBudget] = useState<number | ''>('');

  // Dokumen Pendukung Lainnya
  const [documents, setDocuments] = useState<Array<{ name: string; size: string; uploadDate: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > 15 * 1024 * 1024) {
        toast('Ukuran file maksimal adalah 15MB', 'warning');
        return;
      }
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      const today = new Date().toLocaleDateString('id-ID');
      setDocuments([...documents, { name: file.name, size: sizeStr, uploadDate: today }]);
      toast(`Berkas "${file.name}" berhasil ditambahkan.`, 'success');
    }
  };

  const removeDoc = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSave = async (isDraft: boolean) => {
    if (!title.trim()) {
      toast('Judul usulan penelitian wajib diisi.', 'warning');
      return;
    }
    if (!problemStatement.trim()) {
      toast('Identifikasi masalah / latar belakang wajib diisi.', 'warning');
      return;
    }
    if (!urgencyReason.trim()) {
      toast('Alasan urgensi penelitian wajib diisi.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const newId = addProposal(
        {
          title,
          category,
          problemStatement,
          urgencyReason,
          urgencyLevel,
          expectedOutput,
          estimatedBudget: estimatedBudget === '' ? undefined : Number(estimatedBudget),
          supportingDocuments: documents,
          status: isDraft ? 'DRAFT' : 'PENDING',
        },
        isDraft
      );

      if (isDraft) {
        toast('Usulan berhasil disimpan sebagai DRAFT.', 'info');
      } else {
        toast('Usulan penelitian resmi DIKIRIM ke BRIDA untuk ditelaah.', 'success');
      }

      router.push('/opd/tracking');
    } catch (err: any) {
      toast('Gagal menyimpan usulan: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top navigation */}
      <div>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-700 font-semibold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Dashboard OPD</span>
        </button>
      </div>

      <PageHeader
        title="Form Tambah Usulan Penelitian"
        description="Rumuskan permasalahan strategis daerah dari instansi Anda agar ditelaah dan diteliti oleh BRIDA untuk menghasilkan rekomendasi kebijakan berbasis bukti."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* ================= LEFT MAIN FORM ================= */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-t-4 border-t-emerald-600 shadow-sm">
            <CardHeader className="pb-3 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <FilePlus2 className="h-4 w-4 text-emerald-600" />
                <span>Rincian Informasi Usulan Masalah</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5 text-xs">
              
              {/* 1. Judul Usulan */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                  <span>1. Judul Usulan Penelitian / Topik Masalah</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Strategi Penurunan Angka Stunting Balita Berbasis Intervensi Gizi Spesifik Lokal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-950 font-medium"
                />
                <p className="text-3xs text-gray-400">Tuliskan rumusan judul yang spesifik, jelas, dan menggambarkan ruang lingkup masalah yang dihadapi.</p>
              </div>

              {/* 2. Kategori Urusan */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                    <span>2. Kategori Urusan Pemerintahan</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-950 font-medium"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                    <span>3. Output Luaran yang Diharapkan</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={expectedOutput}
                    onChange={(e) => setExpectedOutput(e.target.value as ExpectedOutput)}
                    className="w-full p-2.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-950 font-medium"
                  >
                    {OUTPUT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Estimasi Anggaran */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                    <span>4. Estimasi Kebutuhan Anggaran / Pagu Indikatif (Rp)</span>
                    <span className="text-slate-400 text-3xs font-normal">(Opsional / Perkiraan Kebutuhan Riset)</span>
                  </label>
                  {typeof estimatedBudget === 'number' && estimatedBudget > 0 && (
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(estimatedBudget)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="1000000"
                    placeholder="Contoh: 75000000"
                    value={estimatedBudget}
                    onChange={(e) => setEstimatedBudget(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-950 font-mono font-bold"
                  />
                </div>
                <p className="text-3xs text-gray-400">Masukkan estimasi kebutuhan biaya pelaksanaan survei, pengumpulan data lapangan, analisis ahli, dan seminar hasil.</p>
              </div>

              {/* 4. Identifikasi Masalah (Latar Belakang) */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                  <span>5. Identifikasi Masalah & Latar Belakang Lapangan</span>
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Jelaskan secara komprehensif kendala, data awal, faktor penyebab, dan kondisi lapangan yang mendasari perlunya penelitian ini..."
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  className="w-full p-2.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-950 leading-relaxed font-medium"
                />
              </div>

              {/* 5. Urgensi Penelitian */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                    <span>6. Urgensi Penelitian (Mengapa Harus Diteliti Sekarang?)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-3xs text-gray-400 font-semibold">Tingkat Urgensi:</span>
                    {(['TINGGI', 'SEDANG', 'RENDAH'] as ProposalUrgency[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setUrgencyLevel(lvl)}
                        className={`px-2 py-0.5 rounded text-3xs font-extrabold transition-all ${
                          urgencyLevel === lvl
                            ? lvl === 'TINGGI'
                              ? 'bg-rose-600 text-white'
                              : lvl === 'SEDANG'
                              ? 'bg-amber-500 text-white'
                              : 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={3}
                  placeholder="Tuliskan dampak jika masalah ini tidak segera dikaji, keterkaitan dengan target RPJMD/Renja, atau momentum kebijakan yang mendesak..."
                  value={urgencyReason}
                  onChange={(e) => setUrgencyReason(e.target.value)}
                  className="w-full p-2.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-950 leading-relaxed font-medium"
                />
              </div>

              {/* 7. Upload Dokumen Pendukung Lainnya */}
              <div className="space-y-2 pt-2 border-t dark:border-gray-850">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                    <span>7. Berkas Data Dukung Tambahan (Statistik, Data Awal, atau Surat Pengantar)</span>
                  </label>
                  <span className="text-3xs text-gray-400">Opsional (Maksimal 15MB)</span>
                </div>

                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px]">
                    <strong>Informasi KAK & RKA:</strong> Penyusunan Kerangka Acuan Kerja (KAK) dan Rencana Kerja & Anggaran (RKA) pelaksanaan kajian akan disusun dan difokuskan langsung oleh tim fungsional BRIDA setelah usulan disetujui. OPD cukup melampirkan data dukung/surat pengantar jika ada.
                  </p>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-emerald-500 rounded-lg p-3 text-center bg-gray-50/50 dark:bg-gray-900/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.xlsx,.xls,.docx,.doc,.zip"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="doc-file-upload"
                  />
                  <label htmlFor="doc-file-upload" className="cursor-pointer space-y-1 block">
                    <UploadCloud className="h-6 w-6 text-slate-500 mx-auto" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Klik untuk Tambah Lampiran Data Dukung
                    </span>
                    <span className="text-3xs text-gray-400 block">
                      Format: Excel, PDF, Word, atau ZIP (Maksimal 15MB)
                    </span>
                  </label>
                </div>

                {/* Uploaded Documents List */}
                {documents.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg text-2xs">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-600 shrink-0" />
                          <div>
                            <span className="font-bold text-gray-800 dark:text-gray-200 block truncate max-w-sm">{doc.name}</span>
                            <span className="text-3xs text-gray-400">{doc.size} • Diupload {doc.uploadDate}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDoc(idx)}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t dark:border-gray-850">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-xs font-bold text-gray-600 transition-all"
                >
                  Batal
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSave(true)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Save className="h-4 w-4" />
                    <span>Simpan Sebagai Draft</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSave(false)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-all shadow-md flex items-center gap-2 transform active:scale-95"
                  >
                    <Send className="h-4 w-4" />
                    <span>Kirim Usulan ke BRIDA</span>
                  </button>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* ================= RIGHT SIDEBAR (Panduan Pengisian) ================= */}
        <div className="space-y-6">
          <Card className="shadow-sm border-t-4 border-t-emerald-600">
            <CardHeader className="pb-2 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>Petunjuk Penyusunan Usulan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-2xs leading-relaxed text-gray-600 dark:text-gray-400">
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-850 rounded-lg space-y-1">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 block text-xs">Prinsip Input Usulan OPD:</span>
                <p className="text-3xs text-emerald-800 dark:text-emerald-300">
                  Fokuskan pada masalah nyata yang membutuhkan bukti empiris dan rekomendasi teknis untuk pengambilan keputusan pimpinan daerah.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="space-y-0.5">
                  <span className="font-bold text-gray-800 dark:text-gray-200 block">1. Latar Belakang Masalah:</span>
                  <p className="text-3xs text-gray-500">Sertakan angka/indikator capaian saat ini dan target yang belum tercapai.</p>
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-gray-800 dark:text-gray-200 block">2. Data Dukung:</span>
                  <p className="text-3xs text-gray-500">Lampirkan surat resmi pengantar dari Kepala Dinas atau data tabular pendukung.</p>
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-gray-800 dark:text-gray-200 block">3. Draft vs Kirim:</span>
                  <p className="text-3xs text-gray-500">Usulan berstatus *Draft* masih dapat disunting kapan saja. Usulan yang *Dikirim* akan langsung masuk ke antrean telaah evaluator BRIDA.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
