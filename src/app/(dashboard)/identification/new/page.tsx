'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKnowledgeBaseStore } from '@/store/useKnowledgeBaseStore';
import { useIdentificationStore } from '@/store/useIdentificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { masterService, MasterOPD } from '@/services/master.service';
import { DUMMY_OPDS } from '@/mock/knowledge-base/opd';
import { analyzeOPD } from '@/lib/services/aiService';
import {
  FileText,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FolderOpen,
  Briefcase,
  AlertTriangle,
  Database
} from 'lucide-react';

export default function NewIdentificationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { documents, categories, fetchDocuments } = useKnowledgeBaseStore();
  const { identifications, addIdentification } = useIdentificationStore();

  // Wizard state: 1: Pilih OPD, 2: Pilih Sumber, 3: Ringkasan, 4: AI Loading
  const [step, setStep] = useState(1);

  // Form selections
  const [selectedOpd, setSelectedOpd] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [opds, setOpds] = useState<MasterOPD[]>([]);
  const [manualProblem, setManualProblem] = useState('');
  const [focusArea, setFocusArea] = useState('Pelayanan Publik');

  // AI loading steps state
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [isError, setIsError] = useState(false);

  // Load documents and real OPDs
  useEffect(() => {
    fetchDocuments();
    masterService
      .getOpds()
      .then((data) => {
        if (data && data.length > 0) {
          setOpds(data);
        }
      })
      .catch((err) => {
        console.error('Error fetching master OPDs:', err);
      });
  }, [fetchDocuments]);

  // Access check
  useEffect(() => {
    if (user && user.role !== 'BRIDA') {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  // OPD metadata calculations
  const opdInfo = useMemo(() => {
    if (!selectedOpd) return null;

    // Filter documents from Knowledge Base linked to this OPD (or ALL OPD scope) and are ACTIVE
    const activeKbDocs = documents.filter(
      (d) =>
        d.status === 'ACTIVE' &&
        (d.opdScope === 'ALL' ||
          d.specificOpds.includes(selectedOpd) ||
          d.specificOpds.some(
            (so) =>
              selectedOpd.toLowerCase().includes(so.toLowerCase()) ||
              so.toLowerCase().includes(selectedOpd.toLowerCase())
          ))
    );

    // Get last analysis date for this OPD
    const opdAnalyses = identifications.filter((i) => i.opd === selectedOpd);
    const lastAnalysisDate = opdAnalyses.length > 0 ? opdAnalyses[0].date : 'Belum pernah dianalisis';

    let businessSector = 'Pemerintahan / Administrasi';
    if (selectedOpd.includes('Kesehatan')) businessSector = 'Pelayanan Kesehatan';
    else if (selectedOpd.includes('Komunikasi') || selectedOpd.includes('Kominfo') || selectedOpd.includes('Informatika')) businessSector = 'Teknologi Informasi & Komunikasi';
    else if (selectedOpd.includes('Pendidikan')) businessSector = 'Pendidikan & Literasi';
    else if (selectedOpd.includes('Lingkungan')) businessSector = 'Lingkungan Hidup & Kebersihan';
    else if (selectedOpd.includes('PUPR')) businessSector = 'Infrastruktur & Pekerjaan Umum';
    else if (selectedOpd.includes('Perhubungan')) businessSector = 'Transportasi & Perhubungan';
    else if (selectedOpd.includes('Pertanian')) businessSector = 'Agribisnis & Ketahanan Pangan';
    else if (selectedOpd.includes('Perdagangan')) businessSector = 'Perdagangan & UMKM';
    else if (selectedOpd.includes('Bappeda') || selectedOpd.includes('Perencanaan')) businessSector = 'Perencanaan & Pendanaan';

    return {
      name: selectedOpd,
      sector: businessSector,
      kbCount: activeKbDocs.length,
      lastAnalysis: lastAnalysisDate,
      status: activeKbDocs.length > 0 ? 'Siap Analisis' : 'Butuh Dokumen Pendukung',
    };
  }, [selectedOpd, documents, identifications]);

  // Available ACTIVE documents list based on selected OPD
  const activeDocumentsList = useMemo(() => {
    if (!selectedOpd) return [];
    return documents.filter(
      (d) =>
        d.status === 'ACTIVE' &&
        (d.opdScope === 'ALL' ||
          d.specificOpds.includes(selectedOpd) ||
          d.specificOpds.some(
            (so) =>
              selectedOpd.toLowerCase().includes(so.toLowerCase()) ||
              so.toLowerCase().includes(selectedOpd.toLowerCase())
          ))
    );
  }, [selectedOpd, documents]);

  // Select all / Clear selection
  const handleSelectAll = () => {
    setSelectedDocIds(activeDocumentsList.map((d) => d.id));
  };

  const handleClearSelection = () => {
    setSelectedDocIds([]);
  };

  // Toggle individual document
  const handleToggleDoc = (docId: string) => {
    if (selectedDocIds.includes(docId)) {
      setSelectedDocIds(selectedDocIds.filter((id) => id !== docId));
    } else {
      setSelectedDocIds([...selectedDocIds, docId]);
    }
  };

  // Loading steps list
  const loadingSteps = [
    'Preparing selected documents...',
    'Reading document context and priorities...',
    'Identifying regional development issues...',
    'Comparing OPD targets with active stats...',
    'Detecting potential priority needs...',
    'Generating analysis report...'
  ];

  // Trigger analysis simulation
  const handleStartAnalysis = async () => {
    if (!selectedOpd) return;
    if (selectedDocIds.length === 0) return;

    setStep(4);
    setLoadingStepIndex(0);
    setIsError(false);

    // AI steps simulation using interval
    const stepInterval = setInterval(() => {
      setLoadingStepIndex((prev) => {
        if (prev >= loadingSteps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 700);

    try {
      // Fetch mock AI response with manual input and focus area
      const aiResponse = await analyzeOPD(selectedOpd, selectedDocIds, manualProblem, focusArea);
      
      // Match evidence source versions
      const evidenceSources = selectedDocIds.map((id) => {
        const d = documents.find((doc) => doc.id === id);
        return {
          documentId: id,
          documentName: d?.name || 'Dokumen',
          version: '1.0', // Fallback version representation
        };
      });

      // Save to store
      const newId = await addIdentification(
        aiResponse.opd || selectedOpd,
        aiResponse.topic || 'Kajian Kebutuhan Riset Daerah',
        aiResponse.primaryIssue,
        aiResponse.problemDescription,
        aiResponse.potentialNeed,
        aiResponse.priority,
        aiResponse.sector || 'Pembangunan Daerah',
        aiResponse.confidence,
        evidenceSources,
        user?.name || 'BRIDA Litbang',
        'IN_REVIEW' // status defaults to IN_REVIEW
      );

      // Clean interval and redirect after steps
      setTimeout(() => {
        clearInterval(stepInterval);
        toast(`Identifikasi kebutuhan untuk ${selectedOpd} berhasil dianalisis.`, 'success');
        router.push(`/identification/${newId}`);
      }, 500);

    } catch (err) {
      clearInterval(stepInterval);
      setIsError(true);
      toast('AI analysis could not be completed.', 'error');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back link */}
      {step < 4 && (
        <div>
          <button
            onClick={() => router.push('/identification')}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Daftar</span>
          </button>
        </div>
      )}

      {/* Page Header */}
      {step < 4 && (
        <PageHeader
          title="Identifikasi Kebutuhan OPD"
          description="Gunakan sumber pengetahuan BRIDA untuk membantu mengidentifikasi kebutuhan dan permasalahan pada suatu OPD."
        />
      )}

      {/* Visual Workflow Steps Bar */}
      {step < 4 && (
        <div className="grid grid-cols-4 gap-2 border-y border-gray-200 dark:border-gray-800 py-3 bg-white dark:bg-gray-950 px-4 rounded shadow-sm">
          <div className={`flex items-center gap-2 text-2xs font-bold ${step === 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center border ${step === 1 ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20' : 'border-gray-300'}`}>1</span>
            <span>PILIH OPD & MASALAH</span>
          </div>
          <div className={`flex items-center gap-2 text-2xs font-bold ${step === 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center border ${step === 2 ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20' : 'border-gray-300'}`}>2</span>
            <span>PILIH SUMBER</span>
          </div>
          <div className={`flex items-center gap-2 text-2xs font-bold ${step === 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center border ${step === 3 ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20' : 'border-gray-300'}`}>3</span>
            <span>SUMMARY</span>
          </div>
          <div className="flex items-center gap-2 text-2xs font-bold text-gray-400">
            <span className="h-5 w-5 rounded-full flex items-center justify-center border border-gray-300">4</span>
            <span>AI ANALYSIS</span>
          </div>
        </div>
      )}

      {/* ================= STEP 1: PILIH OPD ================= */}
      {step === 1 && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="max-w-md space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Pilih Organisasi Perangkat Daerah (OPD)
              </label>
              <select
                value={selectedOpd}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedOpd(val);
                  if (val) {
                    const activeDocs = documents.filter(
                      (d) =>
                        d.status === 'ACTIVE' &&
                        (d.opdScope === 'ALL' ||
                          d.specificOpds.includes(val) ||
                          d.specificOpds.some(
                            (so) =>
                              val.toLowerCase().includes(so.toLowerCase()) ||
                              so.toLowerCase().includes(val.toLowerCase())
                          ))
                    );
                    setSelectedDocIds(activeDocs.map((d) => d.id));
                  } else {
                    setSelectedDocIds([]);
                  }
                }}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Pilih OPD --</option>
                {opds.length > 0
                  ? opds.map((opd) => (
                      <option key={opd.id} value={opd.name}>
                        {opd.name} ({opd.shortName})
                      </option>
                    ))
                  : DUMMY_OPDS.map((opd) => (
                      <option key={opd} value={opd}>
                        {opd}
                      </option>
                    ))}
              </select>
            </div>

            {opdInfo && (
              <div className="space-y-6 max-w-2xl animate-fade-in">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
                    <Briefcase className="h-4.5 w-4.5 text-blue-600" />
                    <span>Ringkasan Instansi: {opdInfo.name}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-2xs">
                    <div>
                      <span className="text-gray-400 block font-medium">Urusan Sektoral</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{opdInfo.sector}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Dokumen Knowledge Base Aktif</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{opdInfo.kbCount} berkas</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Analisis AI Terakhir</span>
                      <span className="font-semibold text-gray-550">{opdInfo.lastAnalysis}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Status Kesiapan</span>
                      <span className={`inline-block font-bold mt-0.5 ${opdInfo.kbCount > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {opdInfo.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Input Manual Temuan Masalah oleh BRIDA */}
                <div className="p-5 bg-blue-50/40 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900/50 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                        Temuan Permasalahan di OPD (Input Manual BRIDA)
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Masukkan catatan observasi lapangan atau keluhan yang ditemukan di OPD. AI akan memverifikasi temuan ini dengan dokumen baseline daerah.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Fokus Bidang Masalah
                      </label>
                      <select
                        value={focusArea}
                        onChange={(e) => setFocusArea(e.target.value)}
                        className="block w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Pelayanan Publik & SPM">Pelayanan Publik & Standar Pelayanan Minimal (SPM)</option>
                        <option value="Infrastruktur & Sarana">Infrastruktur, Jaringan & Sarana Prasarana</option>
                        <option value="Tata Kelola, SPBE & SDM">Tata Kelola Pemerintahan, SPBE & Kompetensi SDM</option>
                        <option value="Regulasi & Kebijakan Teknis">Regulasi, Standar Operasional & Kebijakan Daerah</option>
                        <option value="Kesehatan Masyarakat & Gizi">Kesehatan Masyarakat, Gizi & Penanganan Stunting</option>
                        <option value="Lingkungan Hidup & Kebersihan">Lingkungan Hidup, Daya Dukung & Pengelolaan Sampah</option>
                        <option value="Perekonomian & Ketahanan Pangan">Pemberdayaan Ekonomi, UMKM & Ketahanan Pangan</option>
                        <option value="Pendidikan & Literasi">Pendidikan, Literasi & Kualitas Pembelajaran</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">
                          Uraian Masalah / Catatan Observasi Lapangan
                        </label>
                        <span className="text-[10px] text-gray-400">
                          {manualProblem.length} karakter
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        value={manualProblem}
                        onChange={(e) => setManualProblem(e.target.value)}
                        placeholder={`Contoh: Terdapat kendala signifikan pada ${opdInfo.name} terkait ${focusArea.toLowerCase()}, di mana masyarakat distrik terpencil mengeluhkan keterbatasan akses layanan serta belum adanya integrasi pelaporan data...`}
                        className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                      />
                      <p className="text-[10px] text-gray-400 italic mt-1.5">
                        * Catatan: Jika dikosongkan, AI akan memindai sasaran makro OPD secara otomatis dari dokumen rujukan yang Anda pilih.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-850">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedOpd || opdInfo?.kbCount === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Langkah Berikutnya</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================= STEP 2: PILIH SUMBER ================= */}
      {step === 2 && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-850 pb-3">
              <div>
                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                  Pilih Dokumen Sumber Pengetahuan
                </h3>
                <p className="text-[11px] text-gray-400 mt-1">
                  Pilih dokumen baseline yang akan digunakan AI untuk memverifikasi dan mentriangulasi temuan masalah OPD.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-2.5 py-1 text-3xs font-bold border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  Select All
                </button>
                <button
                  onClick={handleClearSelection}
                  className="px-2.5 py-1 text-3xs font-bold border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {manualProblem && (
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded text-2xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  AI akan mencocokkan catatan temuan BRIDA (<strong>{manualProblem.slice(0, 70)}...</strong>) dengan dokumen rujukan yang Anda pilih di bawah.
                </span>
              </div>
            )}

            {activeDocumentsList.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 text-xs italic text-gray-450">
                Tidak ada dokumen aktif dalam Knowledge Base yang terkait dengan OPD ini.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center"></TableHead>
                    <TableHead className="text-3xs uppercase tracking-wider font-semibold">Nama Dokumen</TableHead>
                    <TableHead className="text-3xs uppercase tracking-wider font-semibold">Kategori</TableHead>
                    <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-24">Tahun</TableHead>
                    <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-24">Versi</TableHead>
                    <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-28">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeDocumentsList.map((doc) => {
                    const categoryName = categories.find((c) => c.id === doc.categoryId)?.name || 'Kategori';
                    return (
                      <TableRow
                        key={doc.id}
                        className="cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-900/30"
                        onClick={() => handleToggleDoc(doc.id)}
                      >
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedDocIds.includes(doc.id)}
                            onChange={() => handleToggleDoc(doc.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </TableCell>
                        <TableCell className="font-bold text-gray-800 dark:text-gray-200">{doc.name}</TableCell>
                        <TableCell className="text-2xs font-medium text-gray-500">{categoryName}</TableCell>
                        <TableCell className="text-2xs font-semibold text-center">{doc.year}</TableCell>
                        <TableCell className="text-2xs font-bold text-center text-blue-600 dark:text-blue-400">v1.0</TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                            Active
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-850">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-all bg-white dark:bg-gray-950"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Sebelumnya</span>
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={selectedDocIds.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <span>Langkah Berikutnya</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================= STEP 3: SUMMARY & CONFIRM ================= */}
      {step === 3 && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Tinjauan Parameter Analisis AI
              </h3>
              <p className="text-[11px] text-gray-400 leading-relaxed max-w-xl">
                Tinjau kembali pilihan OPD, catatan temuan masalah lapangan, dan dokumen acuan yang akan diproses AI untuk merumuskan kebutuhan riset daerah.
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded space-y-4 max-w-xl">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">OPD Target Analisis</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">{selectedOpd}</span>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Fokus Bidang</span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{focusArea}</span>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Temuan Lapangan (Input Manual BRIDA)</span>
                <p className="text-xs text-gray-700 dark:text-gray-300 italic mt-0.5 whitespace-pre-wrap">
                  {manualProblem ? `"${manualProblem}"` : '(Pemindaian Otomatis Target Baseline)'}
                </p>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
                <span className="text-[10px] text-gray-400 font-bold block uppercase mb-2">
                  Dokumen Referensi Terpilih ({selectedDocIds.length} Berkas)
                </span>
                <ul className="space-y-2 text-2xs font-semibold text-gray-800 dark:text-gray-250">
                  {selectedDocIds.map((id) => {
                    const doc = documents.find((d) => d.id === id);
                    return (
                      <li key={id} className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                        <span>{doc?.name}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* AI cost warning disclaimer */}
            <div className="flex gap-2.5 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded text-2xs text-blue-800 dark:text-blue-300 max-w-xl">
              <Sparkles className="h-4.5 w-4.5 shrink-0 mt-0.5 text-blue-600" />
              <p className="leading-relaxed">
                <strong>Catatan Sistem:</strong> Hasil rumusan identifikasi masalah dan kebutuhan riset yang dihasilkan AI akan dapat Anda tinjau dan edit secara bebas sebelum disetujui.
              </p>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-850">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-all bg-white dark:bg-gray-950"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Sebelumnya</span>
              </button>
              <button
                onClick={handleStartAnalysis}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow"
              >
                <Sparkles className="h-4 w-4" />
                <span>Analyze with AI</span>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================= STEP 4: AI ANALYSIS LOADING SCREEN ================= */}
      {step === 4 && (
        <Card className="min-h-[400px] flex items-center justify-center">
          <CardContent className="p-12 max-w-md w-full text-center space-y-8">
            
            {isError ? (
              <div className="space-y-4 animate-fade-in">
                <AlertTriangle className="h-12 w-12 text-rose-600 mx-auto" />
                <h3 className="text-sm font-bold text-gray-950 dark:text-white">AI analysis could not be completed.</h3>
                <p className="text-xs text-gray-400">Terjadi kendala saat memproses sumber pengetahuan.</p>
                <div className="flex justify-center gap-3 pt-4">
                  <button
                    onClick={handleStartAnalysis}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-800 dark:text-gray-300 text-xs font-semibold rounded"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Visual loading spinner */}
                <div className="relative h-16 w-16 mx-auto flex items-center justify-center">
                  <span className="absolute animate-ping h-12 w-12 rounded-full bg-blue-400 opacity-20" />
                  <span className="absolute animate-spin h-10 w-10 rounded-full border-t-2 border-b-2 border-blue-600" />
                  <Sparkles className="h-5 w-5 text-blue-600 relative z-10 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-950 dark:text-white">Analyzing Knowledge Base...</h3>
                  <p className="text-2xs text-gray-400 font-semibold italic">Asisten AI sedang menyelaraskan target dokumen acuan.</p>
                </div>

                {/* Checklist Progress */}
                <div className="space-y-2.5 max-w-xs mx-auto text-left border border-gray-150 dark:border-gray-850 p-4 rounded bg-gray-50 dark:bg-gray-900">
                  {loadingSteps.map((stepText, idx) => {
                    const isCompleted = loadingStepIndex > idx;
                    const isActive = loadingStepIndex === idx;

                    return (
                      <div key={idx} className="flex items-center gap-2 text-3xs font-bold transition-all">
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : isActive ? (
                          <span className="h-4 w-4 rounded-full border border-blue-600 flex items-center justify-center shrink-0">
                            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                          </span>
                        ) : (
                          <span className="h-4 w-4 rounded-full border border-gray-300 shrink-0" />
                        )}
                        <span className={isCompleted ? 'text-gray-400 line-through' : isActive ? 'text-blue-600' : 'text-gray-300'}>
                          {stepText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      )}

    </div>
  );
}
