'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useIdentificationStore } from '@/store/useIdentificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { masterService, MasterOPD } from '@/services/master.service';
import { externalSourceService, ExternalSource } from '@/services/externalSource.service';
import { problemIdentificationService, ProblemIdentification } from '@/services/problemIdentification.service';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Save,
  Send,
  Building2,
  Calendar,
  Layers,
  FileText,
  AlertTriangle,
  Info
} from 'lucide-react';

const STANDARD_FIELDS = [
  'Tata Kelola Pemerintahan & SPBE',
  'Pendidikan, Literasi & SDM',
  'Pelayanan Kesehatan & Penanganan Stunting',
  'Lingkungan Hidup, Kebersihan & Daya Dukung',
  'Infrastruktur, Jaringan & Pekerjaan Umum',
  'Pemberdayaan Ekonomi Daerah & UMKM',
  'Ketahanan Pangan & Pertanian',
  'Sosial, Kebudayaan & Kemasyarakatan',
  'Perencanaan Pembangunan & Keuangan Daerah'
];

export default function EditIdentificationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { updateIdentification } = useIdentificationStore();

  const id = params?.id;
  const [opds, setOpds] = useState<MasterOPD[]>([]);
  const [baselineSources, setBaselineSources] = useState<ExternalSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [opdId, setOpdId] = useState('');
  const [year, setYear] = useState<number>(2026);
  const [field, setField] = useState('Tata Kelola Pemerintahan & SPBE');
  const [customField, setCustomField] = useState('');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [sourceVersionId, setSourceVersionId] = useState('');
  const [baselineRelationship, setBaselineRelationship] = useState('');

  // 5 Core Structural Analysis
  const [bridaFindings, setBridaFindings] = useState('');
  const [currentCondition, setCurrentCondition] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [impact, setImpact] = useState('');
  const [potentialNeed, setPotentialNeed] = useState('');
  const [analysisNotes, setAnalysisNotes] = useState('');

  // Access check
  useEffect(() => {
    if (user && user.role !== 'BRIDA' && user.role !== 'ADMIN_BRIDA') {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  // Load master data, baseline sources, & existing identification
  useEffect(() => {
    masterService.getOpds().then((data) => {
      if (data) setOpds(data);
    }).catch(console.error);

    externalSourceService.getAll().then((data) => {
      if (data) setBaselineSources(data);
    }).catch(console.error);

    if (id) {
      setIsLoading(true);
      problemIdentificationService.getById(id).then((data) => {
        if (data) {
          setOpdId(data.opdId || data.relatedOpds?.[0]?.opdId || '');
          setYear(data.year || 2026);
          if (STANDARD_FIELDS.includes(data.field)) {
            setField(data.field);
          } else {
            setField('OTHER');
            setCustomField(data.field || '');
          }
          setTitle(data.title || '');
          setPriority(data.priority || 'MEDIUM');
          setSourceVersionId(data.sourceVersionId || '');
          setBaselineRelationship(data.baselineRelationship || '');
          setBridaFindings(data.bridaFindings || data.description || '');
          setCurrentCondition(data.currentCondition || '');
          setProblemStatement(data.problemStatement || data.title || '');
          setImpact(data.impact || '');
          setPotentialNeed(data.potentialNeed || '');
          setAnalysisNotes(data.analysisNotes || '');
        }
      }).catch((err) => {
        console.error('Error fetching identification to edit:', err);
        toast('Gagal memuat data identifikasi.', 'error');
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }, [id]);

  const handleSubmit = async (submitStatus?: 'DRAFT' | 'UNDER_REVIEW') => {
    if (!id) return;
    if (!opdId) {
      toast('Silakan pilih Perangkat Daerah (OPD) target.', 'warning');
      return;
    }
    if (!title.trim()) {
      toast('Judul / Rumusan Kebutuhan wajib diisi.', 'warning');
      return;
    }
    if (!problemStatement.trim()) {
      toast('Permasalahan Utama wajib diisi.', 'warning');
      return;
    }
    if (!potentialNeed.trim()) {
      toast('Kebutuhan Intervensi / Solusi wajib diisi.', 'warning');
      return;
    }

    const selectedField = field === 'OTHER' ? customField : field;
    const selectedOpd = opds.find((o) => o.id === opdId);

    setIsSubmitting(true);
    try {
      const payload: any = {
        opdId,
        opdName: selectedOpd?.name,
        year,
        field: selectedField,
        title: title.trim(),
        priority,
        sourceVersionId: sourceVersionId || null,
        baselineRelationship: baselineRelationship.trim() || null,
        bridaFindings: bridaFindings.trim(),
        currentCondition: currentCondition.trim(),
        problemStatement: problemStatement.trim(),
        impact: impact.trim(),
        potentialNeed: potentialNeed.trim(),
        analysisNotes: analysisNotes.trim() || null,
      };

      if (submitStatus) {
        payload.status = submitStatus;
      }

      await updateIdentification(id, payload);
      toast('Perubahan identifikasi kebutuhan berhasil disimpan.', 'success');
      router.push(`/identification/${id}`);
    } catch (err: any) {
      console.error('Error updating identification:', err);
      toast(err.response?.data?.message || 'Gagal menyimpan perubahan identifikasi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 font-sans max-w-5xl mx-auto py-12 text-center text-xs text-gray-400">
        Memuat formulir edit...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto pb-12">
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push(`/identification/${id}`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Detail Identifikasi</span>
        </button>
      </div>

      {/* Page Header */}
      <PageHeader
        title={`Edit Identifikasi Kebutuhan #${id}`}
        description="Perbarui informasi klasifikasi, catatan observasi pemantauan BRIDA, dan arah kebutuhan intervensi."
      />

      {/* Form Container */}
      <div className="space-y-6">
        {/* SECTION 1: Informasi Dasar & Klasifikasi */}
        <Card>
          <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span>1. Klasifikasi Perangkat Daerah & Urusan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* OPD Target */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                  Perangkat Daerah (OPD) Target *
                </label>
                <select
                  value={opdId}
                  onChange={(e) => setOpdId(e.target.value)}
                  className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Pilih OPD --</option>
                  {opds.map((opd) => (
                    <option key={opd.id} value={opd.id}>
                      {opd.name} {opd.code ? `(${opd.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tahun Perencanaan */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                  Tahun Anggaran / Perencanaan *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || 2026)}
                    min={2020}
                    max={2035}
                    className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Bidang / Sektor */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                  Bidang / Sektor Pembangunan *
                </label>
                <select
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {STANDARD_FIELDS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                  <option value="OTHER">Bidang Lainnya (Ketik Manual)...</option>
                </select>
                {field === 'OTHER' && (
                  <input
                    type="text"
                    value={customField}
                    onChange={(e) => setCustomField(e.target.value)}
                    placeholder="Ketik nama bidang pembangunan..."
                    className="block w-full mt-2 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-750 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
                  />
                )}
              </div>

              {/* Tingkat Prioritas */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                  Tingkat Prioritas Kebutuhan *
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="HIGH">Tinggi (Mendesak & Berdampak Luas pada SPM/Daerah)</option>
                  <option value="MEDIUM">Sedang (Perbaikan Manajemen & Efisiensi Layanan)</option>
                  <option value="LOW">Rendah (Penyempurnaan Rutin)</option>
                </select>
              </div>
            </div>

            {/* Judul Kebutuhan */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                Judul / Rumusan Kebutuhan OPD *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Kebutuhan Penguatan Monitoring Kinerja Internal dan SPM Dinas Kesehatan"
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: 5 Blok Analisis Terstruktur */}
        <Card>
          <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              <span>2. Telaah Analisis Pemantauan & Masalah (5 Elemen Inti)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* 1. Temuan Pemantauan BRIDA */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] flex items-center justify-center font-bold">1</span>
                <span>Temuan Pemantauan BRIDA</span>
              </label>
              <textarea
                rows={3}
                value={bridaFindings}
                onChange={(e) => setBridaFindings(e.target.value)}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 2. Kondisi Saat Ini */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] flex items-center justify-center font-bold">2</span>
                <span>Kondisi Saat Ini (Faktual)</span>
              </label>
              <textarea
                rows={3}
                value={currentCondition}
                onChange={(e) => setCurrentCondition(e.target.value)}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 3. Permasalahan Utama */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] flex items-center justify-center font-bold">3</span>
                <span>Permasalahan Utama (Akar Masalah) *</span>
              </label>
              <textarea
                rows={3}
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 4. Dampak Permasalahan */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] flex items-center justify-center font-bold">4</span>
                <span>Dampak Permasalahan</span>
              </label>
              <textarea
                rows={3}
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 5. Kebutuhan Intervensi / Kajian */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] flex items-center justify-center font-bold">5</span>
                <span>Kebutuhan Intervensi / Kajian Litbang *</span>
              </label>
              <textarea
                rows={3}
                value={potentialNeed}
                onChange={(e) => setPotentialNeed(e.target.value)}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: Penyelarasan Dokumen Baseline Mimika */}
        <Card>
          <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span>3. Penyelarasan Dokumen Baseline Resmi Daerah</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                Pilih Dokumen Baseline Rujukan (Mimika)
              </label>
              <select
                value={sourceVersionId}
                onChange={(e) => setSourceVersionId(e.target.value)}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Tanpa Dokumen Baseline (Opsional) --</option>
                {baselineSources.map((src) => {
                  const version = src.currentVersion || (src.versions && src.versions[0]);
                  const vId = version?.id || src.currentVersionId;
                  if (!vId) return null;
                  return (
                    <option key={src.id} value={vId}>
                      {src.code} - {src.title} (v{version?.versionNumber || '1'})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                Keterkaitan Dokumen Baseline & Pasal/Indikator yang Dirujuk
              </label>
              <textarea
                rows={2}
                value={baselineRelationship}
                onChange={(e) => setBaselineRelationship(e.target.value)}
                placeholder="Contoh: Selaras dengan Sasaran Strategis 2 RPJMD Bab IV terkait peningkatan tata kelola dan SPM Kesehatan Daerah..."
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-850">
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                Catatan Analisis BRIDA (Internal Litbang)
              </label>
              <textarea
                rows={2}
                value={analysisNotes}
                onChange={(e) => setAnalysisNotes(e.target.value)}
                placeholder="Catatan tambahan dari analis litbang..."
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={() => router.push(`/identification/${id}`)}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-750 dark:text-gray-300 rounded-lg text-xs font-semibold transition-all bg-white dark:bg-gray-950"
          >
            Batal
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
