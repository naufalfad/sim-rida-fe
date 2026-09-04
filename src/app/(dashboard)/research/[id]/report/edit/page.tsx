'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReportStore } from '@/store/useReportStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useImplementationStore } from '@/store/useImplementationStore';
import { usePartnerStore } from '@/store/usePartnerStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Check,
  ChevronRight,
  BookOpen,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';

type SectionKey =
  | 'COVER'
  | 'EXEC_SUMMARY'
  | 'BACKGROUND'
  | 'OBJECTIVE'
  | 'METHODOLOGY'
  | 'SCOPE'
  | 'RESULTS'
  | 'DISCUSSION'
  | 'APPENDICES';

const SECTIONS: Array<{ key: SectionKey; label: string }> = [
  { key: 'COVER', label: 'Cover & Judul Laporan' },
  { key: 'EXEC_SUMMARY', label: 'Executive Summary' },
  { key: 'BACKGROUND', label: 'Pendahuluan & Latar Belakang' },
  { key: 'OBJECTIVE', label: 'Tujuan Penelitian' },
  { key: 'METHODOLOGY', label: 'Metodologi & Ruang Lingkup' },
  { key: 'RESULTS', label: 'Hasil Penelitian (Results)' },
  { key: 'DISCUSSION', label: 'Pembahasan (Discussion)' },
  { key: 'APPENDICES', label: 'Lampiran (Appendices)' },
];

export default function EditReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { researchRecords, proposals } = useResearchStore();
  const { getMethod } = usePartnerStore();
  const { getImplementation, getOverallProgress } = useImplementationStore();
  const { getReport, saveReport } = useReportStore();

  const id = params?.id || '';
  const isBrida = user?.role === 'BRIDA';

  // Access check
  useEffect(() => {
    if (user && user.role !== 'BRIDA') {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  // Find target research record
  const record = useMemo(() => {
    return researchRecords.find((r) => r.id === id);
  }, [researchRecords, id]);

  const impl = getImplementation(id);
  const report = getReport(id);
  const method = getMethod(id);
  const overallProgress = getOverallProgress(id);

  // Find corresponding proposal details for autofills
  const proposal = useMemo(() => {
    if (!record) return null;
    return proposals.find((p) => p.id === record.proposalId);
  }, [proposals, record]);

  // Redirect if approved (locked state)
  useEffect(() => {
    if (report && report.status === 'APPROVED') {
      toast('Laporan telah disetujui dan terkunci (Read-Only).', 'warning');
      router.replace(`/research/${id}/report`);
    }
  }, [report, id, router, toast]);

  // Section state
  const [activeSection, setActiveSection] = useState<SectionKey>('COVER');

  // Form states
  const [title, setTitle] = useState('');
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [background, setBackground] = useState('');
  const [objective, setObjective] = useState('');
  const [methodology, setMethodology] = useState('');
  const [scope, setScope] = useState('');
  const [implementationSummary, setImplementationSummary] = useState('');
  const [results, setResults] = useState('');
  const [discussion, setDiscussion] = useState('');
  const [appendices, setAppendices] = useState('');

  // Autosave simulation state
  const [isSaved, setIsSaved] = useState(true);

  // Sync form states with report record on mount
  useEffect(() => {
    if (report) {
      setTitle(report.title || '');
      setExecutiveSummary(report.executiveSummary || '');
      setBackground(report.background || '');
      setObjective(report.objective || '');
      setMethodology(report.methodology || '');
      setScope(report.scope || '');
      setImplementationSummary(report.implementationSummary || '');
      setResults(report.results || '');
      setDiscussion(report.discussion || '');
      setAppendices(report.appendices || '');
    }
  }, [report]);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setIsSaved(false);
  };

  // Prefill report data from research record & proposal (Section 9)
  const handleAutofill = () => {
    if (!record) return;

    setTitle(record.title);
    setBackground(proposal?.background || 'Berdasarkan data usulan daerah, analisis ini dilatarbelakangi oleh kebutuhan integrasi SIMPUS terpadu.');
    setObjective(proposal?.objective || 'Mengevaluasi arsitektur pertukaran data medis Satu Sehat daerah.');
    setScope(proposal?.scope || 'Cakupan pengerjaan meliputi 8 unit puskesmas dinas kesehatan daerah.');
    setMethodology('Menggunakan metodologi survei kepatuhan standardisasi FHIR HL7 terpusat, pengujian endpoint Sandbox API, FGD dinkes.');
    setImplementationSummary(`Proyek penelitian diselesaikan oleh partner pelaksana dengan bobot pengerjaan milestone kumulatif mencapai ${overallProgress}%.`);
    setResults('Rata-rata kesiapan SIMPUS puskesmas mencapai 40%. RSUD telah mencapai 80% dengan anomali penulisan ICD-10.');
    setDiscussion('Pembahasan difokuskan pada pemetaan kapasitas server dinas kesehatan dan hambatan blank spot wilayah pesisir.');
    setAppendices('Lampiran 1: Kuesioner Survei\nLampiran 2: Dokumentasi Lokakarya Dinas Kesehatan');

    setIsSaved(false);
    toast('Data laporan di-autofill dari Rekod Penelitian & Proposal.', 'success');
  };

  const handleSaveDraft = () => {
    const payload = {
      title,
      executiveSummary,
      background,
      objective,
      methodology,
      scope,
      implementationSummary,
      results,
      discussion,
      appendices,
    };

    saveReport(id, payload, user?.name || 'BRIDA Litbang');
    setIsSaved(true);
    toast('Draf laporan hasil penelitian berhasil disimpan.', 'success');
  };

  const handleNextSection = () => {
    const idx = SECTIONS.findIndex(s => s.key === activeSection);
    if (idx < SECTIONS.length - 1) {
      setActiveSection(SECTIONS[idx + 1].key);
    } else {
      handleSaveDraft();
      router.push(`/research/${id}/report`);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push(`/research/${id}/report`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Overview</span>
        </button>
      </div>

      <PageHeader
        title="Penyusunan Laporan Hasil Penelitian"
        description={`Sunting isi dan bab pendukung laporan pengerjaan riset: "${record?.title}"`}
        action={
          <div className="flex gap-2 items-center">
            {/* Autosave badge indicator (Section 53) */}
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
              isSaved 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-250' 
                : 'bg-amber-50 text-amber-700 border-amber-250 animate-pulse'
            }`}>
              {isSaved ? '✓ Saved to Local Draft' : '● Unsaved Changes'}
            </span>
            
            <button
              onClick={handleAutofill}
              className="px-3.5 py-1.5 border border-indigo-200 hover:bg-indigo-50/20 text-indigo-700 rounded text-xs font-bold transition-all bg-white flex items-center gap-1"
            >
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>Autofill from Research</span>
            </button>

            <button
              onClick={handleSaveDraft}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1 shadow"
            >
              <Save className="h-4 w-4" />
              <span>Save Draft</span>
            </button>
          </div>
        }
      />

      {/* Editor Split Panel Layout (Section 52 & 54) */}
      <div className="grid gap-6 md:grid-cols-4">
        
        {/* Navigation Sidebar (Section 52) */}
        <div className="space-y-3">
          
          {/* Mobile dropdown select (Section 54) */}
          <div className="md:hidden">
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value as SectionKey)}
              className="w-full px-3 py-2 border rounded font-semibold text-xs bg-white text-gray-900 focus:outline-none"
            >
              {SECTIONS.map((sec) => (
                <option key={sec.key} value={sec.key}>{sec.label}</option>
              ))}
            </select>
          </div>

          {/* Desktop list sidebar */}
          <Card className="hidden md:block">
            <CardContent className="p-2 space-y-1">
              <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider pl-3 py-1.5">
                Daftar Bab Laporan
              </span>
              {SECTIONS.map((sec) => {
                const isActive = activeSection === sec.key;
                return (
                  <button
                    key={sec.key}
                    onClick={() => setActiveSection(sec.key)}
                    className={`w-full text-left px-3 py-2 text-2xs font-bold rounded flex items-center justify-between transition-all ${
                      isActive 
                        ? 'bg-indigo-50/50 text-indigo-755 border-l-2 border-indigo-650'
                        : 'text-gray-650 hover:bg-slate-50'
                    }`}
                  >
                    <span>{sec.label}</span>
                    {isActive && <ChevronRight className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Separate routes navigation banners (Section 12 & 16) */}
          <Card>
            <CardContent className="p-3.5 space-y-3.5 text-xs font-semibold leading-normal">
              
              <div className="p-3 bg-slate-55/20 border rounded space-y-1">
                <span className="font-bold text-gray-800 block text-2xs uppercase">10. Research Findings</span>
                <p className="text-[10px] text-gray-450 leading-relaxed">Kelola tabel temuan kualitatif, evidence pendukung, dan level keparahan.</p>
                <button
                  onClick={() => router.push(`/research/${id}/report/findings`)}
                  className="mt-1.5 text-indigo-650 font-extrabold hover:underline inline-flex items-center gap-0.5 text-3xs uppercase"
                >
                  <span>Go to Findings Page</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="p-3 bg-slate-55/20 border rounded space-y-1">
                <span className="font-bold text-gray-800 block text-2xs uppercase">12. Conclusion & Limits</span>
                <p className="text-[10px] text-gray-455 leading-relaxed">Masukkan kesimpulan utama riset, pelajaran penting, serta limitasi metodologis.</p>
                <button
                  onClick={() => router.push(`/research/${id}/report/conclusion`)}
                  className="mt-1.5 text-indigo-650 font-extrabold hover:underline inline-flex items-center gap-0.5 text-3xs uppercase"
                >
                  <span>Go to Conclusion Page</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

            </CardContent>
          </Card>

        </div>

        {/* Editor Form Right Panel */}
        <div className="md:col-span-3">
          <Card>
            <CardContent className="p-6 space-y-5 text-xs font-semibold">
              
              {/* Section Heading Banner */}
              <div className="border-b pb-2 flex justify-between items-baseline">
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                  Seksi Aktif: {activeSection}
                </span>
                <span className="text-[10px] text-indigo-650 font-bold">SIM-RIDA Output Editor</span>
              </div>

              {/* COVER SECTION */}
              {activeSection === 'COVER' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-2xs font-bold text-gray-700 uppercase">Judul Laporan Hasil Penelitian *</label>
                      <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-1.5 border rounded">Based on Research Record</span>
                    </div>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => handleInputChange(setTitle, e.target.value)}
                      placeholder="Masukkan judul resmi laporan penelitian..."
                      className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 focus:border-indigo-600"
                    />
                  </div>
                  
                  <div className="p-3 bg-gray-50 border rounded text-[11px] font-normal leading-relaxed text-gray-450 space-y-2 select-none">
                    <span className="font-bold text-[8px] text-gray-400 block uppercase">Metadata Proyek Asal</span>
                    <div>ID Riset: <span className="font-bold text-gray-700">{record?.id}</span></div>
                    <div>OPD Pengusul: <span className="font-bold text-gray-700">{record?.opd}</span></div>
                    <div>Metode Pelaksanaan: <span className="font-bold text-gray-700">{method.method}</span></div>
                  </div>
                </div>
              )}

              {/* EXEC SUMMARY SECTION (Section 11) */}
              {activeSection === 'EXEC_SUMMARY' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-2xs font-bold text-gray-700 uppercase">Executive Summary *</label>
                    <textarea
                      value={executiveSummary}
                      onChange={(e) => handleInputChange(setExecutiveSummary, e.target.value)}
                      placeholder="Tuliskan rangkuman padat latar belakang, metodologi, temuan kritis utama, dan kesimpulan kebijakan dalam 1 seksi..."
                      rows={8}
                      className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-indigo-600 leading-relaxed"
                    />
                  </div>
                  <div className="p-3 bg-blue-50/50 border rounded text-2xs text-gray-600 leading-normal flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Executive summary akan dimuat secara otomatis di cover depan Policy Brief ringkas daerah.</span>
                  </div>
                </div>
              )}

              {/* BACKGROUND SECTION */}
              {activeSection === 'BACKGROUND' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-2xs font-bold text-gray-700 uppercase">Pendahuluan & Latar Belakang Masalah</label>
                      <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-1.5 border rounded">Based on Research Record</span>
                    </div>
                    <textarea
                      value={background}
                      onChange={(e) => handleInputChange(setBackground, e.target.value)}
                      placeholder="Deskripsikan regulasi acuan atau dasar hukum penulisan kajian..."
                      rows={6}
                      className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-indigo-600 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* OBJECTIVE SECTION */}
              {activeSection === 'OBJECTIVE' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-2xs font-bold text-gray-700 uppercase">Tujuan Penelitian / Kajian</label>
                      <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-1.5 border rounded">Based on Research Record</span>
                    </div>
                    <textarea
                      value={objective}
                      onChange={(e) => handleInputChange(setObjective, e.target.value)}
                      placeholder="Masukkan daftar tujuan pengerjaan penelitian..."
                      rows={5}
                      className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-indigo-600 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* METHODOLOGY SECTION */}
              {activeSection === 'METHODOLOGY' && (
                <div className="space-y-4">
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-2xs font-bold text-gray-700 uppercase">Metodologi Riset</label>
                      <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-1.5 border rounded">Based on Research Record</span>
                    </div>
                    <textarea
                      value={methodology}
                      onChange={(e) => handleInputChange(setMethodology, e.target.value)}
                      placeholder="Contoh: FGD teknis, penyebaran angket kuantitatif IT..."
                      rows={4}
                      className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-indigo-600 leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-2xs font-bold text-gray-700 uppercase">Ruang Lingkup Kajian</label>
                      <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-1.5 border rounded">Based on Research Record</span>
                    </div>
                    <textarea
                      value={scope}
                      onChange={(e) => handleInputChange(setScope, e.target.value)}
                      placeholder="Batasan wilayah atau objek riset daerah..."
                      rows={4}
                      className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-indigo-600 leading-relaxed"
                    />
                  </div>

                </div>
              )}

              {/* RESULTS SECTION */}
              {activeSection === 'RESULTS' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-2xs font-bold text-gray-700 uppercase">Ringkasan Hasil Penelitian (Results) *</label>
                    <textarea
                      value={results}
                      onChange={(e) => handleInputChange(setResults, e.target.value)}
                      placeholder="Detail data primer/sekunder yang didapatkan di lapangan..."
                      rows={7}
                      className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-indigo-600 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* DISCUSSION SECTION */}
              {activeSection === 'DISCUSSION' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-2xs font-bold text-gray-700 uppercase">Pembahasan Temuan (Discussion)</label>
                    <textarea
                      value={discussion}
                      onChange={(e) => handleInputChange(setDiscussion, e.target.value)}
                      placeholder="Analisis teori atau pemecahan sintesis data terhadap temuan lapangan..."
                      rows={6}
                      className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-indigo-600 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* APPENDICES SECTION */}
              {activeSection === 'APPENDICES' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-2xs font-bold text-gray-700 uppercase">Lampiran Pendukung (Appendices)</label>
                    <textarea
                      value={appendices}
                      onChange={(e) => handleInputChange(setAppendices, e.target.value)}
                      placeholder="Daftar berkas lampiran pendukung laporan..."
                      rows={5}
                      className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-indigo-600 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Bottom Wizard navigation controls */}
              <div className="flex justify-between items-center pt-4 border-t dark:border-gray-800">
                <button
                  onClick={handleSaveDraft}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-semibold bg-white"
                >
                  Save Draft
                </button>
                
                <button
                  onClick={handleNextSection}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold flex items-center gap-1 transition-all shadow"
                >
                  <span>{activeSection === 'APPENDICES' ? 'Complete Editor' : 'Save & Next Section'}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
