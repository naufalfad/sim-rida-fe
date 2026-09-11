'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  Building2,
  FileText,
  DollarSign,
  Save,
  Send,
  UploadCloud,
  Trash2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Layers,
  FileCheck,
} from 'lucide-react';
import { useOpdStore, ExpectedOutput, ProposalUrgency } from '@/store/useOpdStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { uploadAndCacheFile } from '@/lib/file-storage';
import { cn } from '@/lib/utils/cn';

const OUTPUT_OPTIONS: ExpectedOutput[] = [
  'Rekomendasi Teknis',
  'Kajian Kebijakan / Policy Brief',
  'Naskah Akademik Perda',
  'Solusi Teknologi',
  'Model / Blueprint',
  'Studi Kelayakan',
];

export default function NewAdminIdentificationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, token } = useAuthStore();
  const {
    addProposal,
    opds,
    fetchOpds,
    categories: storeCategories,
    fetchCategories,
  } = useOpdStore();

  const [targetOpdId, setTargetOpdId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(storeCategories[0] || 'Ekonomi & Pembangunan');
  const [problemStatement, setProblemStatement] = useState('');
  const [strategicImpact, setStrategicImpact] = useState('');
  const [urgencyReason, setUrgencyReason] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<ProposalUrgency>('TINGGI');
  const [expectedOutput, setExpectedOutput] = useState<ExpectedOutput>('Kajian Kebijakan / Policy Brief');
  const [estimatedBudget, setEstimatedBudget] = useState<number | ''>('');
  const [estimatedDuration, setEstimatedDuration] = useState<number | ''>(3);

  const [documents, setDocuments] = useState<Array<{ name: string; size: string; uploadDate: string; url?: string; dataUrl?: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOpds();
    fetchCategories();
  }, [fetchOpds, fetchCategories]);

  useEffect(() => {
    if (opds.length > 0 && !targetOpdId) {
      // Default to non-BRIDA OPD if available
      const nonBrida = opds.find((o) => o.code !== 'BRIDA');
      if (nonBrida) setTargetOpdId(nonBrida.id);
      else setTargetOpdId(opds[0].id);
    }
  }, [opds, targetOpdId]);

  useEffect(() => {
    if (storeCategories.length > 0 && !category) {
      setCategory(storeCategories[0]);
    }
  }, [storeCategories, category]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 25 * 1024 * 1024) {
        toast(`Ukuran file "${file.name}" melebihi 25MB`, 'warning');
        continue;
      }
      try {
        const storedDoc = await uploadAndCacheFile(file, token);
        setDocuments((prev) => [...prev, storedDoc]);
        toast(`Dokumen "${file.name}" berhasil diunggah.`, 'success');
      } catch (err: any) {
        toast(`Gagal mengunggah file "${file.name}": ${err.message}`, 'error');
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!targetOpdId) {
      toast('Silakan pilih OPD target rekomendasi.', 'warning');
      return;
    }
    if (!title.trim() || title.trim().length < 5) {
      toast('Judul / Isu strategis minimal 5 karakter.', 'warning');
      return;
    }
    if (!problemStatement.trim() || problemStatement.trim().length < 10) {
      toast('Latar belakang & analisis masalah minimal 10 karakter.', 'warning');
      return;
    }

    const selectedOpd = opds.find((o) => o.id === targetOpdId);

    try {
      setIsSubmitting(true);
      await addProposal(
        {
          source: 'BRIDA_ANALYSIS',
          opdId: targetOpdId,
          opdName: selectedOpd?.name || 'Perangkat Daerah Mimika',
          title: title.trim(),
          category,
          problemStatement: problemStatement.trim(),
          urgencyReason: urgencyReason.trim() || strategicImpact.trim(),
          strategicImpact: strategicImpact.trim() || undefined,
          urgencyLevel,
          expectedOutput,
          estimatedBudget: estimatedBudget !== '' ? Number(estimatedBudget) : undefined,
          estimatedDuration: estimatedDuration !== '' ? Number(estimatedDuration) : 3,
          supportingDocuments: documents,
          status: isDraft ? 'DRAFT' : 'APPROVED',
        },
        isDraft
      );

      if (isDraft) {
        toast('Draf analisis BRIDA berhasil disimpan.', 'success');
      } else {
        toast('Analisis Mandiri BRIDA berhasil diterbitkan! Usulan langsung siap untuk Tahap 3 (Penyusunan KAK).', 'success');
      }

      router.push('/admin/identification');
    } catch (err: any) {
      toast(`Gagal menyimpan analisis: ${err.message || 'Terjadi kesalahan sistem'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* HEADER */}
      <PageHeader
        title="Input Analisis Mandiri Masalah Daerah (BRIDA)"
        description="Formulir inisiasi riset top-down oleh Tim Litbang BRIDA untuk merumuskan rekomendasi kebijakan strategis bagi Perangkat Daerah terkait."
        action={
          <Link
            href="/admin/identification"
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar
          </Link>
        }
      />

      {/* HIGHLIGHT BANNER */}
      <div className="border border-slate-200 bg-blue-50/70 p-4.5 text-xs text-blue-950 flex items-start gap-3.5">
        <div className="p-2 bg-[#0f2c59] text-white shrink-0 mt-0.5">
          <Sparkles className="h-4 w-4 text-sky-300" />
        </div>
        <div className="space-y-1 leading-relaxed">
          <span className="font-bold text-[#0f2c59] block text-sm">
            Inisiatif Riset Top-Down Tim Litbang BRIDA
          </span>
          <p className="text-slate-700">
            Usulan yang diinput melalui formulir ini merupakan <strong>Analisis Mandiri BRIDA</strong>. Berdasarkan alur SIM-RIDA, analisis ini <strong>otomatis melewati (by-pass) Tahap 2 Validasi</strong> dan langsung menuju ke <strong>Tahap 3 (Penyusunan KAK & AI Support)</strong> setelah diterbitkan.
          </p>
        </div>
      </div>

      {/* FORM SECTIONS */}
      <div className="space-y-6">
        {/* CARD 1: TARGET OPD & KLASIFIKASI */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="border-b border-slate-200 pb-4">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#0f2c59]" />
              1. Target Lokus Kebijakan & Klasifikasi Riset
            </CardTitle>
            <CardDescription className="text-xs">
              Tentukan Perangkat Daerah yang menjadi target penerima rekomendasi serta bidang fokus riset.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Target OPD */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  Target OPD Sasaran Rekomendasi <span className="text-blue-600">*</span>
                </label>
                <select
                  value={targetOpdId}
                  onChange={(e) => setTargetOpdId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-none text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
                >
                  <option value="" disabled>-- Pilih OPD Penerima Rekomendasi --</option>
                  {opds.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Kategori Bidang */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  Kategori Bidang Fokus Riset <span className="text-blue-600">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-none text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
                >
                  {storeCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CARD 2: URAIAN MASALAH & ANALISIS STRATEGIS */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="border-b border-slate-200 pb-4">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#0f2c59]" />
              2. Uraian Masalah & Analisis Strategis
            </CardTitle>
            <CardDescription className="text-xs">
              Rumuskan judul kajian serta uraian masalah faktual yang terjadi di Kabupaten Mimika.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {/* Judul Riset */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                Judul Analisis / Usulan Riset Kebijakan <span className="text-blue-600">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Analisis Efektivitas Penyaluran Bantuan Sosial Terpadu Berbasis Geospasial..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-none text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Identifikasi Masalah Utama */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                Uraian Fakta Lapangan & Pokok Masalah <span className="text-blue-600">*</span>
              </label>
              <textarea
                rows={4}
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="Uraikan kondisi faktual, kesenjangan data, dan akar persoalan yang mendasari perlunya intervensi riset..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-none text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all leading-relaxed"
              />
            </div>

            {/* Urgensi Riset */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Alasan Urgensi Riset Kebijakan
              </label>
              <textarea
                rows={3}
                value={urgencyReason}
                onChange={(e) => setUrgencyReason(e.target.value)}
                placeholder="Mengapa kajian ini mendesak untuk diselesaikan pada tahun anggaran berjalan?"
                className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-none text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all leading-relaxed"
              />
            </div>

            {/* Dampak Strategis */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Dampak Strategis terhadap Visi / Misi / RPJMD Mimika
              </label>
              <textarea
                rows={3}
                value={strategicImpact}
                onChange={(e) => setStrategicImpact(e.target.value)}
                placeholder="Uraikan dampak strategis terhadap RPJMD, pengentasan kemiskinan, peningkatan PAD, atau efisiensi pelayanan publik..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-none text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all leading-relaxed"
              />
            </div>
          </CardContent>
        </Card>

        {/* CARD 3: URGENSI & JUSTIFIKASI KEBIJAKAN */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="border-b border-slate-200 pb-4">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              3. Target Luaran, Estimasi Pagu Anggaran & Durasi Pelaksanaan
            </CardTitle>
            <CardDescription className="text-xs">
              Ekspektasi produk akhir riset, perkiraan alokasi pagu anggaran, dan estimasi waktu pelaksanaan riset daerah.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Target Output */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Bentuk Luaran Kebijakan
                </label>
                <select
                  value={expectedOutput}
                  onChange={(e) => setExpectedOutput(e.target.value as ExpectedOutput)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-none text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
                >
                  {OUTPUT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estimasi Anggaran */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Estimasi Pagu Anggaran (Rp)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={estimatedBudget}
                    onChange={(e) => setEstimatedBudget(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Contoh: 100000000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-none text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Estimasi Durasi */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Estimasi Durasi (Bulan)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="3"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-none text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none">
                    Bulan
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CARD 4: DATA DUKUNG & DOKUMEN PENDUKUNG */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="border-b border-slate-200 pb-4">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-[#0f2c59]" />
              4. Dokumen Bukti Analisis & Data Lapangan Awal
            </CardTitle>
            <CardDescription className="text-xs">
              Unggah file kajian awal, data statistik mikro, transkrip wawancara, atau regulasi terkait (Maksimal 25MB/file).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-[#0f2c59] p-6 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/20 transition-all"
            >
              <div className="h-10 w-10 mx-auto bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0f2c59] mb-2">
                <UploadCloud className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                Klik untuk memilih berkas dokumen pendukung
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Format yang didukung: PDF, DOCX, XLSX, CSV, PPTX (Hingga 25MB)
              </p>
            </div>

            {documents.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Dokumen Terunggah ({documents.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-300 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="h-4 w-4 text-[#0f2c59] shrink-0" />
                        <span className="truncate font-medium text-slate-800">{doc.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[10px] text-slate-500">{doc.size}</span>
                        <button
                          type="button"
                          onClick={() => removeDocument(idx)}
                          className="p-1 text-slate-500 hover:text-black"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* BOTTOM SUBMIT BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white border border-slate-200">
          <Link
            href="/admin/identification"
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-black border border-slate-300 bg-white"
          >
            Batal
          </Link>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
            >
              <Save className="h-3.5 w-3.5 text-slate-700" />
              Simpan Sebagai Draf
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0f2c59] hover:bg-[#1a3d70] border border-blue-900 transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              {isSubmitting ? 'Memproses...' : 'Terbitkan Analisis (Siap KAK)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
