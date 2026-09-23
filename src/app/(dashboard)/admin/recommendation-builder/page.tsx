'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  useOpdStore,
  PolicyRecommendationItem,
  ResearchStudyItem,
} from '@/store/useOpdStore';
import {
  FileCheck,
  Send,
  Sparkles,
  FileText,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Eye,
  Printer,
  Save,
  Stamp,
  BookOpen,
  AlertCircle,
  ShieldCheck,
  Award,
  Layers,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Edit3,
  ExternalLink,
  Target,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { generatePolicyBriefPdf, openPdfLoadingWindow } from '@/lib/pdf-generator';

const TARGET_POLICY_TYPES = [
  { value: 'DRAFT_PERBUP', label: 'Draf Peraturan Bupati (Perbup)' },
  { value: 'DRAFT_PERDA', label: 'Draf Peraturan Daerah (Perda)' },
  { value: 'SE_BUPATI', label: 'Surat Edaran (SE) Bupati' },
  { value: 'SOP_LAYANAN', label: 'Standar Operasional Prosedur (SOP) Layanan' },
  { value: 'RENCANA_AKSI_DAERAH', label: 'Rencana Aksi Daerah (RAD)' },
  { value: 'PETUNJUK_TEKNIS', label: 'Petunjuk Teknis / Pedoman Pelaksanaan' },
];

const IMPACT_LEVELS = [
  { value: 'STRATEGIS_DAERAH', label: 'Strategis Daerah (Bupati & Sekda)' },
  { value: 'SEKTORAL', label: 'Sektoral (Lintas Perangkat Daerah)' },
  { value: 'OPERASIONAL', label: 'Operasional (Internal OPD Pemohon)' },
];

function RecommendationBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStudyIdParam = searchParams.get('studyId');

  const {
    recommendations,
    availableStudiesForRec,
    fetchRecommendations,
    fetchAvailableStudiesForRec,
    createRecommendation,
    updateRecommendation,
    submitRecommendationToKepala,
    generatePolicyBriefAi,
    isLoadingRecommendations,
  } = useOpdStore();

  // Navigation & View Mode: 'CATALOG' (Pemilihan Usulan) | 'EDITOR' (Form) | 'PREVIEW' (Lembar Cetak)
  const [viewMode, setViewMode] = useState<'CATALOG' | 'EDITOR' | 'PREVIEW'>('CATALOG');
  const [selectedStudyId, setSelectedStudyId] = useState<string>('');
  const [activeRecId, setActiveRecId] = useState<string | null>(null);

  // Filter & Search states in Catalog
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogStatusFilter, setCatalogStatusFilter] = useState<'ALL' | 'UNTOUCHED' | 'DRAFT' | 'SUBMITTED' | 'FINALIZED'>('ALL');
  const [catalogOpdFilter, setCatalogOpdFilter] = useState('');

  // Form states (4 Bagian Baku Policy Brief + Dokumen Terkorelasi)
  const [recTitle, setRecTitle] = useState('');
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [background, setBackground] = useState('');
  const [policyRecommendations, setPolicyRecommendations] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [correlatedDocs, setCorrelatedDocs] = useState('');
  const [targetPolicyType, setTargetPolicyType] = useState<string>('DRAFT_PERBUP');
  const [impactLevel, setImpactLevel] = useState<string>('STRATEGIS_DAERAH');
  const [targetOpdNames, setTargetOpdNames] = useState('');
  const [officialDraftNumber, setOfficialDraftNumber] = useState('');
  const [draftLetterSubject, setDraftLetterSubject] = useState('');

  // UI Interactive states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isQuickPickerOpen, setIsQuickPickerOpen] = useState(false);
  const [quickPickerSearch, setQuickPickerSearch] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isContextExpanded, setIsContextExpanded] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initial load
  useEffect(() => {
    fetchAvailableStudiesForRec();
    fetchRecommendations();
  }, [fetchAvailableStudiesForRec, fetchRecommendations]);

  // Handle URL query param 'studyId'
  useEffect(() => {
    if (initialStudyIdParam && availableStudiesForRec.length > 0) {
      const match = availableStudiesForRec.find((s) => s.id === initialStudyIdParam);
      if (match) {
        setSelectedStudyId(match.id);
        setViewMode('EDITOR');
      }
    }
  }, [initialStudyIdParam, availableStudiesForRec]);

  // Map each study with its recommendation status
  const studiesWithRecStatus = useMemo(() => {
    return availableStudiesForRec.map((study) => {
      const rec = recommendations.find((r) => r.studyId === study.id);
      let recStatus: 'UNTOUCHED' | 'DRAFT' | 'SUBMITTED' | 'FINALIZED' = 'UNTOUCHED';
      if (rec) {
        if (rec.status === 'FINALIZED') recStatus = 'FINALIZED';
        else if (rec.status === 'SUBMITTED') recStatus = 'SUBMITTED';
        else recStatus = 'DRAFT';
      }
      return {
        study,
        rec,
        recStatus,
      };
    });
  }, [availableStudiesForRec, recommendations]);

  // KPI Metrics calculation
  const kpis = useMemo(() => {
    const total = studiesWithRecStatus.length;
    const untouched = studiesWithRecStatus.filter((s) => s.recStatus === 'UNTOUCHED').length;
    const draft = studiesWithRecStatus.filter((s) => s.recStatus === 'DRAFT').length;
    const submitted = studiesWithRecStatus.filter((s) => s.recStatus === 'SUBMITTED').length;
    const finalized = studiesWithRecStatus.filter((s) => s.recStatus === 'FINALIZED').length;
    return { total, untouched, draft, submitted, finalized };
  }, [studiesWithRecStatus]);

  // List of unique OPDs for filtering
  const uniqueOpds = useMemo(() => {
    const set = new Set<string>();
    availableStudiesForRec.forEach((s) => {
      const opdName = s.proposal?.opd?.name;
      if (opdName) set.add(opdName);
    });
    return Array.from(set).sort();
  }, [availableStudiesForRec]);

  // Filtered studies in catalog
  const filteredStudies = useMemo(() => {
    return studiesWithRecStatus.filter(({ study, rec, recStatus }) => {
      if (catalogStatusFilter !== 'ALL' && recStatus !== catalogStatusFilter) {
        return false;
      }
      if (catalogOpdFilter && study.proposal?.opd?.name !== catalogOpdFilter) {
        return false;
      }
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase();
        const matchTitle = study.title.toLowerCase().includes(q);
        const matchOpd = (study.proposal?.opd?.name || '').toLowerCase().includes(q);
        const matchCode = (study.proposal?.code || '').toLowerCase().includes(q);
        const matchProblem = (study.proposal?.problemStatement || '').toLowerCase().includes(q);
        const matchRec = (rec?.title || '').toLowerCase().includes(q);
        if (!matchTitle && !matchOpd && !matchCode && !matchProblem && !matchRec) {
          return false;
        }
      }
      return true;
    });
  }, [studiesWithRecStatus, catalogStatusFilter, catalogOpdFilter, catalogSearch]);

  // Quick picker filtered studies
  const quickPickerFiltered = useMemo(() => {
    if (!quickPickerSearch.trim()) return studiesWithRecStatus;
    const q = quickPickerSearch.toLowerCase();
    return studiesWithRecStatus.filter(({ study, rec }) => {
      return (
        study.title.toLowerCase().includes(q) ||
        (study.proposal?.opd?.name || '').toLowerCase().includes(q) ||
        (study.proposal?.code || '').toLowerCase().includes(q) ||
        (rec?.title || '').toLowerCase().includes(q)
      );
    });
  }, [studiesWithRecStatus, quickPickerSearch]);

  // Synchronize form when selected study changes
  useEffect(() => {
    if (!selectedStudyId) return;

    const existingRec = recommendations.find((r) => r.studyId === selectedStudyId);
    const study = availableStudiesForRec.find((s) => s.id === selectedStudyId);

    if (existingRec) {
      setActiveRecId(existingRec.id);
      setRecTitle(existingRec.title);
      setExecutiveSummary(existingRec.executiveSummary || '');
      setBackground(existingRec.background || '');
      setPolicyRecommendations(existingRec.policyRecommendations || '');
      setConclusion(existingRec.conclusion || '');
      setCorrelatedDocs(existingRec.correlatedDocs || '');
      setTargetPolicyType(existingRec.targetPolicyType || 'DRAFT_PERBUP');
      setImpactLevel(existingRec.impactLevel || 'STRATEGIS_DAERAH');
      setTargetOpdNames(existingRec.targetOpdNames || study?.proposal?.opd?.name || '');
      setOfficialDraftNumber(existingRec.code || `070/BRIDA-MMK/${new Date().getFullYear()}/042`);
      setDraftLetterSubject(`Penyampaian Naskah Rekomendasi Kebijakan: ${existingRec.title}`);
    } else if (study) {
      setActiveRecId(null);
      const opdName = study.proposal?.opd?.name || '';
      setRecTitle('');
      setExecutiveSummary('');
      setBackground('');
      setPolicyRecommendations('');
      setConclusion('');
      setCorrelatedDocs('');
      setTargetPolicyType('DRAFT_PERBUP');
      setImpactLevel('STRATEGIS_DAERAH');
      setTargetOpdNames(opdName);
      setOfficialDraftNumber(`070/BRIDA-MMK/${new Date().getFullYear()}/042`);
      setDraftLetterSubject('');
    }
  }, [selectedStudyId, recommendations, availableStudiesForRec]);

  const currentStudy = availableStudiesForRec.find((s) => s.id === selectedStudyId);
  const currentRec = recommendations.find((r) =>
    activeRecId ? r.id === activeRecId : r.studyId === selectedStudyId
  );
  const isFinalized = currentRec?.status === 'FINALIZED';

  // Handler to open study in editor or preview
  const handleSelectStudy = (studyId: string, targetView: 'EDITOR' | 'PREVIEW' = 'EDITOR') => {
    setSelectedStudyId(studyId);
    setViewMode(targetView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler to reset/create new draft for finalized item
  const handleCreateNewDraftForStudy = () => {
    if (!currentStudy) return;
    setActiveRecId(null);
    const opdName = currentStudy.proposal?.opd?.name || '';
    setRecTitle('');
    setExecutiveSummary('');
    setBackground('');
    setPolicyRecommendations('');
    setConclusion('');
    setCorrelatedDocs('');
    setTargetPolicyType('DRAFT_PERBUP');
    setImpactLevel('STRATEGIS_DAERAH');
    setTargetOpdNames(opdName);
    setOfficialDraftNumber(`070/BRIDA-MMK/${new Date().getFullYear()}/042`);
    setDraftLetterSubject('');
    setViewMode('EDITOR');
    setFeedbackMessage({
      type: 'success',
      text: 'Formulir telah disiapkan untuk penyusunan draf rekomendasi baru.',
    });
  };

  // Handler for AI generation (Single entry point)
  const handleGenerateAi = async (usePrompt: boolean = false) => {
    if (!selectedStudyId) {
      setFeedbackMessage({ type: 'error', text: 'Pilih agenda kajian terlebih dahulu.' });
      return;
    }

    if (isFinalized) {
      setFeedbackMessage({
        type: 'error',
        text: 'Naskah yang telah disahkan (FINALIZED) tidak dapat digenerate ulang.',
      });
      return;
    }

    setIsGeneratingAi(true);
    setFeedbackMessage(null);
    setIsAiModalOpen(false);

    try {
      const promptToSend = usePrompt ? customPrompt : '';
      const result = await generatePolicyBriefAi(selectedStudyId, promptToSend);

      if (result) {
        setRecTitle(result.title || '');
        setExecutiveSummary(result.executiveSummary || '');
        setBackground(result.background || '');
        setPolicyRecommendations(result.policyRecommendations || '');
        setConclusion(result.conclusion || '');
        setCorrelatedDocs(result.correlatedDocs || '');
        if (result.targetPolicyType) setTargetPolicyType(result.targetPolicyType);
        if (result.impactLevel) setImpactLevel(result.impactLevel);
        if (result.targetOpdNames) setTargetOpdNames(result.targetOpdNames);
        setDraftLetterSubject(`Penyampaian Naskah Rekomendasi Kebijakan: ${result.title || currentStudy?.title}`);

        setFeedbackMessage({
          type: 'success',
          text: '✨ Naskah Policy Brief (4 Bagian Baku) berhasil disusun oleh AI berdasarkan integrasi seluruh berkas riset! Silakan periksa dan simpan draf.',
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Gagal menghasilkan naskah dengan AI. Silakan periksa koneksi atau coba kembali.',
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Save Draft (Internal Litbang)
  const handleSaveDraft = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isFinalized) {
      setFeedbackMessage({
        type: 'error',
        text: 'Naskah yang telah disahkan resmi (FINALIZED) terkunci dan tidak dapat diedit.',
      });
      return;
    }

    if (!selectedStudyId) {
      setFeedbackMessage({ type: 'error', text: 'Pilih usulan / agenda kajian terlebih dahulu.' });
      return;
    }

    if (recTitle.length < 10) {
      setFeedbackMessage({ type: 'error', text: 'Judul rekomendasi minimal 10 karakter.' });
      return;
    }

    if (executiveSummary.length < 20 || background.length < 20 || policyRecommendations.length < 20 || conclusion.length < 20) {
      setFeedbackMessage({
        type: 'error',
        text: 'Setiap 4 bagian baku naskah (Ringkasan, Latar Belakang, Rekomendasi, Kesimpulan) minimal 20 karakter.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      if (activeRecId) {
        await updateRecommendation(activeRecId, {
          title: recTitle,
          executiveSummary,
          background,
          policyRecommendations,
          conclusion,
          correlatedDocs: correlatedDocs || null,
          targetPolicyType: targetPolicyType as any,
          impactLevel: impactLevel as any,
          targetOpdNames,
        });
        setFeedbackMessage({ type: 'success', text: 'Draf rekomendasi kebijakan berhasil diperbarui!' });
      } else {
        const created = await createRecommendation({
          studyId: selectedStudyId,
          title: recTitle,
          executiveSummary,
          background,
          policyRecommendations,
          conclusion,
          correlatedDocs: correlatedDocs || null,
          targetPolicyType: targetPolicyType as any,
          impactLevel: impactLevel as any,
          targetOpdNames,
          status: 'DRAFT',
        });
        setActiveRecId(created.id);
        setFeedbackMessage({ type: 'success', text: 'Draf rekomendasi kebijakan baru berhasil disimpan!' });
      }
      fetchRecommendations();
      fetchAvailableStudiesForRec();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Gagal menyimpan draf rekomendasi.' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  // Submit to Kepala BRIDA
  const handleSendToKepala = async () => {
    if (isFinalized) {
      alert('Naskah ini sudah disahkan secara final oleh Kepala BRIDA.');
      return;
    }

    if (recTitle.length < 10 || executiveSummary.length < 20 || background.length < 20 || policyRecommendations.length < 20 || conclusion.length < 20) {
      setFeedbackMessage({
        type: 'error',
        text: 'Lengkapi seluruh isi 4 bagian baku naskah rekomendasi sebelum mengajukan ke Kepala BRIDA.',
      });
      return;
    }

    if (
      confirm(
        'Kirimkan naskah Policy Brief & Rekomendasi ini ke meja kerja Kepala BRIDA untuk diverifikasi dan ditandatangani secara elektronik (TTE BSrE)?'
      )
    ) {
      setIsSubmitting(true);
      setFeedbackMessage(null);

      try {
        let recIdToSubmit = activeRecId;

        // Auto-save first
        if (!recIdToSubmit) {
          const created = await createRecommendation({
            studyId: selectedStudyId,
            title: recTitle,
            executiveSummary,
            background,
            policyRecommendations,
            conclusion,
            correlatedDocs: correlatedDocs || null,
            targetPolicyType: targetPolicyType as any,
            impactLevel: impactLevel as any,
            targetOpdNames,
            status: 'DRAFT',
          });
          recIdToSubmit = created.id;
          setActiveRecId(created.id);
        } else {
          await updateRecommendation(recIdToSubmit, {
            title: recTitle,
            executiveSummary,
            background,
            policyRecommendations,
            conclusion,
            correlatedDocs: correlatedDocs || null,
            targetPolicyType: targetPolicyType as any,
            impactLevel: impactLevel as any,
            targetOpdNames,
          });
        }

        await submitRecommendationToKepala(recIdToSubmit);
        setFeedbackMessage({
          type: 'success',
          text: 'Berhasil! Naskah rekomendasi telah diajukan ke meja kerja Kepala BRIDA untuk pengesahan TTE.',
        });
        fetchRecommendations();
      } catch (err: any) {
        setFeedbackMessage({
          type: 'error',
          text: err.message || 'Gagal mengajukan rekomendasi ke Kepala BRIDA.',
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Buka naskah Policy Brief sebagai PDF di tab peramban baru (Chrome PDF Viewer)
  const handleOpenPolicyBriefPdf = async () => {
    const loadingWin = openPdfLoadingWindow();
    setIsGeneratingPdf(true);
    try {
      await generatePolicyBriefPdf(
        {
          officialNumber: officialDraftNumber || '070/BRIDA-MMK/' + new Date().getFullYear() + '/042',
          title: recTitle || currentStudy?.title || 'Naskah Rekomendasi Kebijakan',
          targetOpdNames: targetOpdNames || currentStudy?.proposal?.opd?.name || 'Pemerintah Kabupaten Mimika',
          targetPolicyType: TARGET_POLICY_TYPES.find((t) => t.value === targetPolicyType)?.label || targetPolicyType,
          impactLevel: IMPACT_LEVELS.find((i) => i.value === impactLevel)?.label || impactLevel,
          subject: draftLetterSubject || recTitle,
          executiveSummary,
          background,
          policyRecommendations,
          conclusion,
          correlatedDocs,
          isFinalized,
          signedBy: 'Dr. Petrus Renyaan, M.Si.',
          signedNip: '19730412 199803 1 001',
          certificateNumber: currentRec?.digitalSignatureLogs?.[0]?.certificateNumber || 'DS-2026-0001',
        },
        loadingWin
      );
    } catch (err) {
      console.error('Failed to generate Policy Brief PDF:', err);
      if (loadingWin && !loadingWin.closed) loadingWin.close();
      alert('Gagal menyusun PDF Policy Brief. Silakan coba kembali.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Unduh dokumen resmi Policy Brief langsung sebagai file .pdf
  const handleDownloadPolicyBriefPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const res = await generatePolicyBriefPdf({
        officialNumber: officialDraftNumber || '070/BRIDA-MMK/' + new Date().getFullYear() + '/042',
        title: recTitle || currentStudy?.title || 'Naskah Rekomendasi Kebijakan',
        targetOpdNames: targetOpdNames || currentStudy?.proposal?.opd?.name || 'Pemerintah Kabupaten Mimika',
        targetPolicyType: TARGET_POLICY_TYPES.find((t) => t.value === targetPolicyType)?.label || targetPolicyType,
        impactLevel: IMPACT_LEVELS.find((i) => i.value === impactLevel)?.label || impactLevel,
        subject: draftLetterSubject || recTitle,
        executiveSummary,
        background,
        policyRecommendations,
        conclusion,
        correlatedDocs,
        isFinalized,
        signedBy: 'Dr. Petrus Renyaan, M.Si.',
        signedNip: '19730412 199803 1 001',
        certificateNumber: currentRec?.digitalSignatureLogs?.[0]?.certificateNumber || 'DS-2026-0001',
      });
      res.download();
    } catch (err) {
      console.error('Failed to download Policy Brief PDF:', err);
      alert('Gagal mengunduh file PDF Policy Brief. Silakan coba kembali.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Helper cetak cepat
  const handlePrint = () => {
    handleOpenPolicyBriefPdf();
  };

  // Helper badge for recommendation status
  const renderStatusBadge = (status: 'UNTOUCHED' | 'DRAFT' | 'SUBMITTED' | 'FINALIZED') => {
    switch (status) {
      case 'FINALIZED':
        return (
          <span className="inline-flex items-center gap-1.5 text-2xs font-black px-2.5 py-1 bg-emerald-600 text-white border border-emerald-700 shadow-sm uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Telah Disahkan TTE
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 text-2xs font-black px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 shadow-sm uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            Menunggu TTE Kepala
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 text-2xs font-black px-2.5 py-1 bg-blue-100 text-blue-950 border border-blue-300 shadow-sm uppercase tracking-wider">
            <Edit3 className="w-3.5 h-3.5 text-blue-700" />
            Draf Tersimpan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-2xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-300 shadow-sm uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Belum Disusun
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Print CSS: Tata Letak Cetak Multi-Halaman Resmi Policy Brief (A4, Header Halaman 1 Saja, TTE Utuh di Halaman Akhir) */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 20mm 18mm 20mm 20mm;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
          }

          /* Sembunyikan TOTAL seluruh elemen dashboard, sidebar, header, dan toolbar luar */
          aside,
          header,
          nav,
          button,
          .print\\:hidden,
          [class*="print:hidden"],
          .fixed {
            display: none !important;
          }

          /* Reset container layout agar tidak mengonsumsi ruang atau padding */
          .min-h-screen,
          [class*="min-h-screen"],
          [class*="overflow-hidden"],
          [class*="overflow-y-auto"] {
            min-height: 0 !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }

          main {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
            border: none !important;
          }

          /* Tampilkan dokumen naskah rekomendasi resmi di posisi paling atas Halaman 1 */
          #printable-recommendation-doc,
          #printable-recommendation-doc * {
            visibility: visible !important;
          }

          #printable-recommendation-doc {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
          }

          /* Header & Kop Surat resmi: HANYA muncul di Halaman 1 */
          .rec-header-block {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid;
            break-after: avoid;
            margin-bottom: 24px !important;
          }

          .rec-body-block {
            display: block !important;
          }

          .rec-chapter-item {
            page-break-inside: auto;
            margin-bottom: 20px !important;
          }

          .rec-chapter-title {
            page-break-after: avoid !important;
            break-after: avoid !important;
            font-weight: bold !important;
          }

          /* TTE: Disimpan di halaman paling akhir tepat di bawah paragraf, utuh tanpa terpotong */
          .rec-tte-block {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            break-before: auto;
            margin-top: 24px !important;
            padding-top: 0 !important;
            border-top: none !important;
            display: flex !important;
            justify-content: flex-end !important;
            float: none !important;
            clear: both !important;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. HEADER SECTION & NAVIGATION                                            */}
      {/* ========================================================================= */}
      <div className="print:hidden bg-[#0f2c59] p-5 sm:p-6 md:p-8 text-white border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sky-300 text-2xs font-black tracking-widest uppercase">
            <BookOpen className="w-4 h-4 text-sky-400" />
            Tahap 5 • Modul Admin BRIDA
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-white">
            {viewMode === 'CATALOG'
              ? 'Penyusunan Rekomendasi OPD'
              : 'Ruang Kerja Naskah Rekomendasi'}
          </h1>
          <p className="text-slate-200 text-xs max-w-2xl leading-relaxed">
            {viewMode === 'CATALOG'
              ? 'Pilih usulan atau agenda kajian riset OPD untuk menyusun naskah Policy Brief dan Surat Rekomendasi Kebijakan resmi sebelum diajukan ke Kepala BRIDA untuk tanda tangan elektronik (TTE BSrE).'
              : `Sedang menyusun rekomendasi untuk: ${currentStudy?.proposal?.opd?.name || 'OPD Terkait'} - ${currentStudy?.title || 'Agenda Kajian'}`}
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
          {viewMode === 'CATALOG' ? (
            <button
              type="button"
              onClick={() => {
                fetchAvailableStudiesForRec();
                fetchRecommendations();
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 border border-slate-700 rounded-lg text-xs transition shadow-xs"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-sky-400', isLoadingRecommendations && 'animate-spin')} />
              Muat Ulang Data
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setViewMode('CATALOG')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 border border-slate-700 rounded-lg text-xs transition shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
              Kembali ke Katalog
            </button>
          )}

          {viewMode !== 'CATALOG' && (
            <button
              type="button"
              onClick={() => {
                setQuickPickerSearch('');
                setIsQuickPickerOpen(true);
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 border border-slate-700 rounded-lg text-xs transition shadow-xs"
            >
              <Layers className="w-3.5 h-3.5 text-sky-300" />
              Ganti Usulan
            </button>
          )}
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedbackMessage && (
        <div
          className={cn(
            'p-4 rounded-xl flex items-center justify-between text-xs font-bold border transition animate-in fade-in shadow-2xs',
            feedbackMessage.type === 'success'
              ? 'bg-blue-50 border-blue-300 text-blue-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          )}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-black text-xs font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODE A: KATALOG USULAN & STATUS REKOMENDASI (DASHBOARD PEMILIHAN)      */}
      {/* ========================================================================= */}
      {viewMode === 'CATALOG' && (
        <div className="space-y-6">
          {/* KPI Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 sm:p-4 border border-slate-200 rounded-xl shadow-xs">
              <span className="text-2xs font-bold text-slate-900 uppercase tracking-wider block">Total Agenda</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900">{kpis.total}</span>
                <Layers className="w-4 h-4 text-slate-600" />
              </div>
              <span className="text-[10px] text-slate-800/80 mt-1 block">Kajian siap rekomendasi</span>
            </div>

            <div className="bg-white p-3.5 sm:p-4 border border-slate-200 rounded-xl shadow-xs">
              <span className="text-2xs font-bold text-slate-900 uppercase tracking-wider block">Perlu Disusun</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black text-slate-800">{kpis.untouched}</span>
                <Clock className="w-4 h-4 text-slate-600" />
              </div>
              <span className="text-[10px] text-slate-800/80 mt-1 block">Belum ada draf naskah</span>
            </div>

            <div className="bg-white p-3.5 sm:p-4 border border-slate-200 rounded-xl shadow-xs">
              <span className="text-2xs font-bold text-slate-900 uppercase tracking-wider block">Draf Litbang</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900">{kpis.draft}</span>
                <Edit3 className="w-4 h-4 text-slate-600" />
              </div>
              <span className="text-[10px] text-slate-800/80 mt-1 block">Sedang disusun/diperbaiki</span>
            </div>

            <div className="bg-white p-3.5 sm:p-4 border border-slate-200 rounded-xl shadow-xs">
              <span className="text-2xs font-bold text-slate-900 uppercase tracking-wider block">Menunggu TTE</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900">{kpis.submitted}</span>
                <Send className="w-4 h-4 text-slate-600" />
              </div>
              <span className="text-[10px] text-slate-800/80 mt-1 block">Di meja Kepala BRIDA</span>
            </div>

            <div className="bg-white p-3.5 sm:p-4 border border-slate-200 rounded-xl shadow-xs col-span-2 sm:col-span-1">
              <span className="text-2xs font-bold text-slate-900 uppercase tracking-wider block">Selesai Disahkan</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900">{kpis.finalized}</span>
                <ShieldCheck className="w-4 h-4 text-slate-600" />
              </div>
              <span className="text-[10px] text-slate-800/80 mt-1 block">TTE BSrE Sah & Terkunci</span>
            </div>
          </div>

          {/* Search, Filter Tabs & OPD Switcher */}
          <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Cari berdasarkan judul riset, nama OPD, kode usulan, atau isu kebijakan..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden"
                />
                {catalogSearch && (
                  <button
                    type="button"
                    onClick={() => setCatalogSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* OPD Selector */}
              <div className="w-full md:w-72 shrink-0">
                <select
                  value={catalogOpdFilter}
                  onChange={(e) => setCatalogOpdFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                >
                  <option value="">Semua Perangkat Daerah ({uniqueOpds.length} OPD)</option>
                  {uniqueOpds.map((opd) => (
                    <option key={opd} value={opd}>
                      {opd}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs overflow-x-auto whitespace-nowrap scrollbar-none pb-1">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" />
                Status:
              </span>
              {[
                { key: 'ALL', label: 'Semua Usulan', count: kpis.total },
                { key: 'UNTOUCHED', label: 'Perlu Disusun', count: kpis.untouched },
                { key: 'DRAFT', label: 'Draf Aktif', count: kpis.draft },
                { key: 'SUBMITTED', label: 'Menunggu TTE', count: kpis.submitted },
                { key: 'FINALIZED', label: 'Selesai Disahkan', count: kpis.finalized },
              ].map((tab) => {
                const isActive = catalogStatusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setCatalogStatusFilter(tab.key as any)}
                    className={cn(
                      'px-3 py-1.5 font-bold text-2xs uppercase tracking-wider transition border rounded-lg flex items-center gap-1.5 shrink-0',
                      isActive
                        ? 'bg-[#0f2c59] text-white border-[#0f2c59] shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded text-[10px] font-black',
                        isActive ? 'bg-sky-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}

              {(catalogSearch || catalogStatusFilter !== 'ALL' || catalogOpdFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setCatalogSearch('');
                    setCatalogStatusFilter('ALL');
                    setCatalogOpdFilter('');
                  }}
                  className="text-2xs font-bold text-rose-600 hover:text-rose-800 ml-auto flex items-center gap-1 underline shrink-0"
                >
                  <X className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Catalog Cards Grid */}
          {filteredStudies.length === 0 ? (
            <div className="bg-white p-8 sm:p-12 text-center border border-slate-200 rounded-xl shadow-xs space-y-3">
              <Layers className="w-12 h-12 mx-auto text-slate-300" />
              <h3 className="font-bold text-sm text-slate-900">Tidak ada usulan / kajian riset yang cocok</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {catalogSearch || catalogStatusFilter !== 'ALL' || catalogOpdFilter
                  ? 'Silakan sesuaikan kata kunci pencarian atau reset filter di atas.'
                  : 'Belum ada agenda kajian riset aktif yang siap dirumuskan rekomendasinya.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStudies.map(({ study, rec, recStatus }) => {
                const opdName = study.proposal?.opd?.name || 'Perangkat Daerah';
                const proposalCode = study.proposal?.code || 'USL-2026';
                const isUntouched = recStatus === 'UNTOUCHED';
                const isDraft = recStatus === 'DRAFT';
                const isSubmitted = recStatus === 'SUBMITTED';
                const isDone = recStatus === 'FINALIZED';

                return (
                  <div
                    key={study.id}
                    className="bg-white border border-slate-200 rounded-xl shadow-xs hover:border-blue-400 hover:shadow-sm transition flex flex-col justify-between p-4 sm:p-5 space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Meta header bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-2xs font-mono font-bold px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-800">
                            {proposalCode}
                          </span>
                          <span className="text-2xs font-bold px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-900">
                            TA {study.fiscalYear}
                          </span>
                          <span className="text-2xs font-medium px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600">
                            {study.executionScheme}
                          </span>
                        </div>
                        <div>{renderStatusBadge(recStatus)}</div>
                      </div>

                      {/* OPD Name */}
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                        <Building2 className="w-3.5 h-3.5 shrink-0 text-blue-700" />
                        <span className="truncate">{opdName}</span>
                      </div>

                      {/* Title */}
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm leading-snug hover:text-blue-900 transition">
                          {study.title}
                        </h3>
                        {rec && rec.title && (
                          <p className="text-2xs text-slate-500 mt-1 font-mono italic">
                            Draf Rekomendasi: &ldquo;{rec.title}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Problem summary snippet */}
                      <div className="p-2.5 bg-slate-50 border border-slate-200 text-2xs text-slate-700 space-y-1">
                        <span className="font-bold text-slate-800 block uppercase tracking-wider">
                          Urgensi / Masalah Usulan:
                        </span>
                        <p className="line-clamp-2 leading-relaxed">
                          {study.proposal?.problemStatement ||
                            study.proposal?.urgencyReason ||
                            study.kakDocument?.background ||
                            'Telaah empiris kebutuhan kebijakan instansi teknis.'}
                        </p>
                      </div>

                      {/* Supporting meta */}
                      <div className="grid grid-cols-2 gap-2 text-2xs text-slate-600 pt-1">
                        <div>
                          <span className="text-slate-400 block">Target Luaran:</span>
                          <span className="font-bold text-slate-800">
                            {study.proposal?.expectedOutput || 'Policy Brief & Naskah Rekomendasi'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Status Pelaksanaan Riset:</span>
                          <span className="font-bold text-slate-800">
                            {study.status === 'COMPLETED' ? 'Riset Selesai' : 'Sedang Berjalan'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-500">
                        {isDone ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            BSrE Valid
                          </span>
                        ) : isSubmitted ? (
                          <span className="text-amber-700 font-bold">Menunggu Verifikasi</span>
                        ) : isDraft ? (
                          <span className="text-blue-800 font-bold">Draf Tersimpan di Litbang</span>
                        ) : (
                          <span className="text-slate-500">Belum Dirumuskan</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isDone && (
                          <button
                            type="button"
                            onClick={() => handleSelectStudy(study.id, 'PREVIEW')}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                            Pratinjau
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleSelectStudy(study.id, isDone ? 'PREVIEW' : 'EDITOR')}
                          className={cn(
                            'px-4 py-1.5 font-bold text-xs transition flex items-center gap-1.5 shadow-sm',
                            isDone
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-800'
                              : isSubmitted
                                ? 'bg-amber-600 hover:bg-amber-700 text-white border border-amber-700'
                                : isDraft
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-700'
                                  : 'bg-[#0f2c59] hover:bg-[#1a4484] text-white border border-blue-900'
                          )}
                        >
                          {isDone ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Buka Naskah Sah
                            </>
                          ) : isSubmitted ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              Pantau Naskah
                            </>
                          ) : isDraft ? (
                            <>
                              <Edit3 className="w-3.5 h-3.5" />
                              Lanjutkan Draf
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-3.5 h-3.5" />
                              Mulai Susun Rekomendasi
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODE B & C: WORKSPACE PENYUSUNAN REKOMENDASI (EDITOR & PRATINJAU)      */}
      {/* ========================================================================= */}
      {viewMode !== 'CATALOG' && (
        <div className="space-y-6">
          {/* Top Context Navigation Bar */}
          <div className="bg-white p-4 border border-slate-300 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
                  Usulan Sedang Dikerjakan:
                </span>
                {renderStatusBadge(
                  isFinalized ? 'FINALIZED' : currentRec?.status === 'SUBMITTED' ? 'SUBMITTED' : activeRecId ? 'DRAFT' : 'UNTOUCHED'
                )}
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 line-clamp-1">
                [{currentStudy?.proposal?.code || 'USL'}] {currentStudy?.title || 'Agenda Kajian'}
              </h2>
              <p className="text-2xs text-slate-600">
                Instansi Pengusul: <strong className="text-slate-800">{currentStudy?.proposal?.opd?.name || 'OPD Terkait'}</strong> | Tahun Anggaran: <strong>{currentStudy?.fiscalYear}</strong>
              </p>
            </div>

            {/* UNIFIED ACTION TOOLBAR (No Redundant Buttons!) */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Toggle Editor / Preview */}
              <div className="inline-flex border border-slate-300 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('EDITOR')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5',
                    viewMode === 'EDITOR'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-black'
                  )}
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                  Form Editor
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('PREVIEW')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5',
                    viewMode === 'PREVIEW'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-black'
                  )}
                >
                  <Eye className="w-3.5 h-3.5 text-sky-600" />
                  Pratinjau Lembar Naskah
                </button>
              </div>

              {/* Single AI Assistant Button */}
              {!isFinalized && (
                <button
                  type="button"
                  disabled={isGeneratingAi || !selectedStudyId}
                  onClick={() => setIsAiModalOpen(true)}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black px-3.5 py-2 border border-blue-700 text-xs shadow-sm transition disabled:opacity-50"
                  title="Gunakan AI untuk mengotomatiskan analisis data riset & KAK menjadi draf naskah rekomendasi"
                >
                  <Sparkles className={cn('w-3.5 h-3.5', isGeneratingAi ? 'animate-spin' : 'text-sky-200')} />
                  {isGeneratingAi ? 'Menyusun AI...' : 'Asisten AI Policy Brief'}
                </button>
              )}

              {/* Save Draft (Only when not finalized) */}
              {!isFinalized && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveDraft()}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold px-3.5 py-2 border border-slate-800 text-xs shadow-sm transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-sky-400" />
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Draf'}
                </button>
              )}

              {/* Submit to Kepala BRIDA */}
              {!isFinalized && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSendToKepala}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 border border-emerald-700 text-xs shadow-sm transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                  {currentRec?.status === 'SUBMITTED' ? 'Ajukan Ulang ke Kepala' : 'Kirim ke Kepala BRIDA'}
                </button>
              )}

              {/* Finalized actions */}
              {isFinalized && (
                <>
                  <button
                    type="button"
                    onClick={handleOpenPolicyBriefPdf}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 border border-blue-700 text-xs shadow-sm transition cursor-pointer"
                    title="Buka dokumen di Chrome PDF viewer (halaman per halaman & cetak PDF)"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-200" />
                    {isGeneratingPdf ? 'Memproses PDF...' : 'Buka / Cetak PDF Resmi'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPolicyBriefPdf}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold px-3.5 py-2 border border-slate-800 text-xs shadow-sm transition cursor-pointer"
                    title="Unduh langsung berkas resmi format PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400" />
                    Unduh PDF
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateNewDraftForStudy}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-2 border border-slate-300 text-xs shadow-sm transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Buat Rekomendasi Baru
                  </button>
                </>
              )}

              {/* Preview Mode Print Button */}
              {viewMode === 'PREVIEW' && !isFinalized && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenPolicyBriefPdf}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 border border-blue-700 text-xs shadow-sm transition cursor-pointer"
                    title="Buka dokumen di Chrome PDF viewer (halaman per halaman & cetak PDF)"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-200" />
                    {isGeneratingPdf ? 'Memproses PDF...' : 'Buka / Cetak PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPolicyBriefPdf}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 border border-slate-300 text-xs shadow-sm transition cursor-pointer"
                    title="Unduh langsung berkas resmi format PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-700" />
                    Unduh PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Finalized Status Notice */}
          {isFinalized && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 flex items-start gap-3 text-emerald-950 text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-extrabold text-emerald-950">
                  Naskah Rekomendasi Telah Disahkan Secara Resmi (Status: FINALIZED)
                </p>
                <p className="text-emerald-900 leading-relaxed text-2xs">
                  Naskah ini telah dibubuhi Tanda Tangan Elektronik (TTE BSrE) oleh Kepala BRIDA Kab. Mimika. Isi naskah terkunci demi kepastian hukum dinas. Anda dapat mencetak dokumen pada tab <strong>Pratinjau Lembar Naskah</strong> atau membuat rekomendasi baru jika diperlukan telaah lanjutan.
                </p>
              </div>
            </div>
          )}

          {/* Context Panel: OPD Proposal & Research Facts */}
          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div
              onClick={() => setIsContextExpanded(!isContextExpanded)}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center justify-between border-b border-slate-200 transition"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-700" />
                <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Konteks Usulan & Hasil Riset OPD Sumber
                </span>
                <span className="text-2xs text-slate-500 font-medium hidden sm:inline">
                  (Bahan telaah perumusan Policy Brief)
                </span>
              </div>
              <div className="flex items-center gap-2 text-2xs font-bold text-blue-800">
                <span>{isContextExpanded ? 'Sembunyikan Rincian' : 'Tampilkan Rincian'}</span>
                {isContextExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {isContextExpanded && (
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1.5 md:border-r border-slate-200 md:pr-4">
                  <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
                    Usulan OPD & Pagu
                  </span>
                  <p className="font-bold text-slate-900">
                    {currentStudy?.proposal?.opd?.name || 'Instansi Terkait'}
                  </p>
                  <p className="text-2xs text-slate-600 font-mono">
                    Kode Usulan: <strong className="text-slate-800">{currentStudy?.proposal?.code || '-'}</strong>
                  </p>
                  <p className="text-2xs text-slate-600">
                    Alokasi Pagu Kajian:{' '}
                    <strong className="text-slate-800">
                      Rp {Number(currentStudy?.allocatedBudget || 0).toLocaleString('id-ID')}
                    </strong>{' '}
                    ({currentStudy?.executionScheme})
                  </p>
                  <p className="text-2xs text-slate-600">
                    Target Luaran:{' '}
                    <strong className="text-slate-800">
                      {currentStudy?.proposal?.expectedOutput || 'Policy Brief & Rekomendasi Teknis'}
                    </strong>
                  </p>
                </div>

                <div className="space-y-1.5 md:border-r border-slate-200 md:pr-4">
                  <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
                    Urgensi & Permasalahan Lapangan (Usulan Asli)
                  </span>
                  <p className="text-2xs text-slate-700 leading-relaxed max-h-24 overflow-y-auto whitespace-pre-line bg-slate-50 p-2 border border-slate-200">
                    {currentStudy?.proposal?.problemStatement ||
                      currentStudy?.proposal?.urgencyReason ||
                      '(Latar belakang masalah tidak tersedia pada berkas usulan)'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
                    Dokumen Pendukung Terlampir
                  </span>
                  <div className="space-y-1 text-2xs text-slate-700">
                    <p className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      Status KAK:{' '}
                      <strong className="text-slate-800">
                        {currentStudy?.kakDocument?.status === 'FINAL'
                          ? 'Final Terverifikasi'
                          : currentStudy?.kakDocument
                            ? 'Draf KAK'
                            : 'Belum Terlampir'}
                      </strong>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      Pelaksanaan Riset:{' '}
                      <strong className="text-slate-800">
                        {currentStudy?.status === 'COMPLETED' ? 'Selesai 100%' : 'Sedang Berjalan'}
                      </strong>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      Tim Peneliti Terdaftar:{' '}
                      <strong className="text-slate-800">
                        {currentStudy?.teamMembers?.length || 0} Anggota
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3A. FORM EDITOR VIEW */}
          {viewMode === 'EDITOR' && (
            <form onSubmit={handleSaveDraft} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Official Administrative Meta (1 col) */}
                <div className="bg-white p-6 border border-slate-300 shadow-sm space-y-5 h-fit">
                  <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
                    <Stamp className="w-4 h-4 text-blue-700" />
                    Metadata Tata Naskah Dinas
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                      Target Bentuk Kebijakan:
                    </label>
                    <select
                      value={targetPolicyType}
                      disabled={isFinalized}
                      onChange={(e) => setTargetPolicyType(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                      {TARGET_POLICY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                      Tingkat Dampak Kebijakan:
                    </label>
                    <select
                      value={impactLevel}
                      disabled={isFinalized}
                      onChange={(e) => setImpactLevel(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                      {IMPACT_LEVELS.map((imp) => (
                        <option key={imp.value} value={imp.value}>
                          {imp.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                      Nomor Naskah BRIDA:
                    </label>
                    <input
                      type="text"
                      value={officialDraftNumber}
                      disabled={isFinalized}
                      onChange={(e) => setOfficialDraftNumber(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                      Perangkat Daerah Sasaran:
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={targetOpdNames}
                        disabled={isFinalized}
                        onChange={(e) => setTargetOpdNames(e.target.value)}
                        placeholder="Nama OPD penerima rekomendasi..."
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-2.5">
                    <span className="font-bold flex items-center gap-1.5 text-blue-900">
                      <Sparkles className="w-4 h-4 text-blue-700" />
                      4 Bagian Baku Policy Brief
                    </span>
                    <ol className="text-2xs space-y-1 text-slate-700 list-decimal pl-4">
                      <li><strong>Ringkasan Eksekutif</strong> (Executive Summary)</li>
                      <li><strong>Latar Belakang</strong> (Background)</li>
                      <li><strong>Rekomendasi Kebijakan</strong> (Policy Recommendations)</li>
                      <li><strong>Kesimpulan</strong> (Conclusion)</li>
                    </ol>
                  </div>

                  {/* Dokumen Terkorelasikan di Sistem */}
                  <div className="p-4 bg-slate-50 border border-slate-200 text-xs space-y-2.5">
                    <span className="font-bold flex items-center gap-1.5 text-slate-900 uppercase text-3xs tracking-wider">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Berkas Rujukan Terintegrasi
                    </span>
                    <div className="space-y-1.5 text-3xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>Lampiran Usulan OPD:</span>
                        <strong className="text-slate-800">{currentStudy?.proposal?.supportingDocuments?.length || 0} File</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Kerangka Acuan Kerja (KAK):</span>
                        <strong className="text-slate-800">{currentStudy?.kakDocument ? 'Terverifikasi' : 'Belum ada'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Legalitas / SK Kerjasama:</span>
                        <strong className="text-slate-800">{currentStudy?.cooperationDocName ? 'Terlampir' : 'SK BRIDA'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Berkas Kerja / Lapangan:</span>
                        <strong className="text-slate-800">{currentStudy?.workingDocuments?.length || 0} Berkas</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Laporan Akhir:</span>
                        <strong className="text-slate-800">{currentStudy?.finalReportName ? 'Tersedia' : 'Draf Akhir'}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: 4 Core Policy Brief Content Sections (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Section 1: Title & Ringkasan Eksekutif */}
                  <div className="bg-white p-6 border border-slate-300 shadow-sm space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                        Judul Naskah Rekomendasi Kebijakan (Policy Brief):
                      </label>
                      <input
                        type="text"
                        value={recTitle}
                        disabled={isFinalized}
                        onChange={(e) => setRecTitle(e.target.value)}
                        placeholder="Contoh: Policy Brief: Formula Intervensi Pangan Lokal untuk Percepatan Penurunan Stunting..."
                        className="w-full p-3 bg-slate-50 border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          1. Ringkasan Eksekutif (Executive Summary):
                        </label>
                        <span className="text-2xs text-slate-500">Minimal 20 karakter</span>
                      </div>
                      <textarea
                        rows={4}
                        value={executiveSummary}
                        disabled={isFinalized}
                        onChange={(e) => setExecutiveSummary(e.target.value)}
                        placeholder="Rangkuman latar belakang, urgensi, dan arah kebijakan yang direkomendasikan kepada pimpinan daerah dan OPD..."
                        className="w-full p-3 bg-slate-50 border border-slate-300 text-xs leading-relaxed focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Section 2: Latar Belakang */}
                  <div className="bg-white p-6 border border-slate-300 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        2. Latar Belakang (Background):
                      </label>
                      <span className="text-2xs text-slate-500">Konteks masalah, dasar regulasi, & urgensi daerah</span>
                    </div>
                    <textarea
                      rows={5}
                      value={background}
                      disabled={isFinalized}
                      onChange={(e) => setBackground(e.target.value)}
                      placeholder="1. Latar belakang persoalan riil dan kondisi di Kabupaten Mimika...\n2. Landasan yuridis dan keterkaitan dengan RPJMD...\n3. Urgensi intervensi kebijakan oleh pemerintah daerah..."
                      className="w-full p-3 bg-slate-50 border border-slate-300 text-xs leading-relaxed focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Section 3: Rekomendasi Kebijakan */}
                  <div className="bg-white p-6 border border-slate-300 shadow-sm space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        3. Rekomendasi Kebijakan (Policy Recommendations):
                      </label>
                      <span className="text-2xs text-blue-700 font-bold">Langkah konkret bagi OPD</span>
                    </div>
                    <textarea
                      rows={8}
                      value={policyRecommendations}
                      disabled={isFinalized}
                      onChange={(e) => setPolicyRecommendations(e.target.value)}
                      placeholder="Uraikan butir-butir arahan rekomendasi kebijakan konkret, terukur, dan operasional bagi perangkat daerah (misal: arahan regulasi daerah, penyesuaian SOP pelayanan, pembagian peran antar-OPD, atau alokasi program prioritas)..."
                      className="w-full p-3 bg-slate-50 border border-slate-300 text-xs leading-relaxed focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Section 4: Kesimpulan */}
                  <div className="bg-white p-6 border border-slate-300 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        4. Kesimpulan (Conclusion):
                      </label>
                      <span className="text-2xs text-slate-500">Simpulan arah tindak lanjut pimpinan</span>
                    </div>
                    <textarea
                      rows={4}
                      value={conclusion}
                      disabled={isFinalized}
                      onChange={(e) => setConclusion(e.target.value)}
                      placeholder="Kesimpulan akhir telaah kebijakan, sintesis dampak positif bagi masyarakat Mimika, dan harapan tindak lanjut oleh OPD..."
                      className="w-full p-3 bg-slate-50 border border-slate-300 text-xs leading-relaxed focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Section 5: Dokumen Bukti yang Dikorelasikan ke Sistem */}
                  <div className="bg-blue-50/40 p-6 border border-blue-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-blue-700" />
                        Dokumen Bukti Rujukan Terkorelasi:
                      </label>
                      <span className="text-3xs text-blue-700 font-bold bg-blue-100/70 px-2 py-0.5 rounded">
                        Korelasi Otomatis AI & Sistem
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={correlatedDocs}
                      disabled={isFinalized}
                      onChange={(e) => setCorrelatedDocs(e.target.value)}
                      placeholder="Dokumen KAK, Laporan Riset Lapangan, SK/PKS, Lampiran OPD yang dikorelasikan sebagai dasar ilmiah..."
                      className="w-full p-3 bg-white border border-blue-200 text-xs leading-relaxed focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* 3B. OFFICIAL DOCUMENT PREVIEW */}
          {viewMode === 'PREVIEW' && (
            <div
              id="printable-recommendation-doc"
              className="bg-white border border-slate-200 shadow-xs rounded-xl p-6 sm:p-12 max-w-4xl mx-auto font-sans text-slate-900"
            >
              {/* 1. Official Header Block (Hanya di Halaman 1) */}
              <div className="rec-header-block space-y-4 mb-6">
                {/* Official Letterhead */}
                <div className="border-b-4 border-double border-black pb-5 text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Award className="w-10 h-10 text-[#0f2c59]" />
                    <div>
                      <h2 className="text-lg font-black tracking-wide uppercase text-slate-900">
                        Pemerintah Daerah Kabupaten Mimika
                      </h2>
                      <h3 className="text-sm font-extrabold tracking-wider uppercase text-[#0f2c59]">
                        Badan Riset dan Inovasi Daerah (BRIDA)
                      </h3>
                    </div>
                  </div>
                  <p className="text-2xs text-slate-600">
                    Jl. Cenderawasih, SP 3, Distrik Kuala Kencana, Kabupaten Mimika, Papua Tengah
                  </p>
                </div>

                {/* Letter Info */}
                <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                  <div>
                    <p>
                      <span className="font-bold">Nomor :</span> {officialDraftNumber || '070/BRIDA-MMK/2026/042'}
                    </p>
                    <p>
                      <span className="font-bold">Sifat :</span> Penting / Naskah Rekomendasi Kebijakan
                    </p>
                    <p>
                      <span className="font-bold">Perihal :</span> {draftLetterSubject || recTitle}
                    </p>
                  </div>
                  <div className="text-right">
                    <p>
                      Mimika,{' '}
                      {new Date().toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="mt-2 font-bold">Kepada Yth:</p>
                    <p className="text-slate-900 font-bold">
                      {targetOpdNames || currentStudy?.proposal?.opd?.name || 'Kepala Perangkat Daerah Terkait'}
                    </p>
                    <p className="text-slate-600">di Tempat</p>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 pt-1 border-b border-slate-200 pb-3">
                  <p>
                    <strong className="text-slate-900">Bentuk Regulasi Sasaran:</strong>{' '}
                    {TARGET_POLICY_TYPES.find((t) => t.value === targetPolicyType)?.label || targetPolicyType}
                  </p>
                  <span className="text-slate-400">•</span>
                  <p>
                    <strong className="text-slate-900">Tingkat Dampak Kebijakan:</strong>{' '}
                    {IMPACT_LEVELS.find((i) => i.value === impactLevel)?.label || impactLevel}
                  </p>
                </div>

                {/* Document Title */}
                <div className="text-center py-2">
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                    {recTitle || 'Naskah Rekomendasi Kebijakan'}
                  </h4>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    Naskah Rekomendasi Hasil Riset dan Inovasi Daerah (SIM-RIDA)
                  </p>
                </div>
              </div>

              {/* 2. Document Body (Word-like, NO box frames, NO border lines) */}
              <div className="rec-body-block space-y-6 pt-1 text-slate-900 text-xs leading-relaxed font-sans">
                <div className="rec-chapter-item space-y-1.5">
                  <h5 className="rec-chapter-title font-bold text-xs uppercase text-slate-900">
                    A. Ringkasan Eksekutif (Executive Summary)
                  </h5>
                  <p className="whitespace-pre-line text-slate-800 text-justify leading-relaxed">
                    {executiveSummary || '(Belum ada ringkasan eksekutif)'}
                  </p>
                </div>

                <div className="rec-chapter-item space-y-1.5">
                  <h5 className="rec-chapter-title font-bold text-xs uppercase text-slate-900">
                    B. Latar Belakang (Background)
                  </h5>
                  <p className="whitespace-pre-line text-slate-800 text-justify leading-relaxed">
                    {background || '(Belum ada uraian latar belakang masalah)'}
                  </p>
                </div>

                <div className="rec-chapter-item space-y-1.5">
                  <h5 className="rec-chapter-title font-bold text-xs uppercase text-slate-900">
                    C. Rekomendasi Kebijakan (Policy Recommendations)
                  </h5>
                  <p className="whitespace-pre-line text-slate-800 text-justify leading-relaxed">
                    {policyRecommendations || '(Belum ada rumusan rekomendasi kebijakan)'}
                  </p>
                </div>

                <div className="rec-chapter-item space-y-1.5">
                  <h5 className="rec-chapter-title font-bold text-xs uppercase text-slate-900">
                    D. Kesimpulan (Conclusion)
                  </h5>
                  <p className="whitespace-pre-line text-slate-800 text-justify leading-relaxed">
                    {conclusion || '(Belum ada kesimpulan)'}
                  </p>
                </div>

                {correlatedDocs && (
                  <div className="rec-chapter-item space-y-1.5">
                    <h5 className="rec-chapter-title font-bold text-xs uppercase text-slate-900">
                      E. Dokumen Bukti yang Dikorelasikan ke Sistem
                    </h5>
                    <p className="whitespace-pre-line text-slate-700 text-justify leading-relaxed">
                      {correlatedDocs}
                    </p>
                  </div>
                )}
              </div>

              {/* 3. TTE Signature Section (Tepat di bawah paragraf, halaman paling akhir, utuh tanpa terpotong) */}
              <div className="rec-tte-block mt-8 pt-2 flex justify-end">
                <div className="text-center w-72 space-y-2">
                  <p className="text-xs font-bold text-slate-900">
                    Kepala Badan Riset dan Inovasi Daerah (BRIDA)
                  </p>

                  <div className="h-28 border border-dashed border-blue-400 bg-blue-50/30 flex flex-col items-center justify-center p-2 text-center rounded-sm">
                    {isFinalized ? (
                      <div className="text-blue-900">
                        <ShieldCheck className="w-8 h-8 mx-auto text-blue-700" />
                        <span className="text-2xs font-black uppercase block mt-1">
                          Ditandatangani Secara Elektronik (TTE)
                        </span>
                        <span className="text-[9px] text-slate-600 font-mono">
                          BSrE - BSSN Validated
                        </span>
                        <span className="text-[8px] text-blue-950 font-mono block mt-0.5 font-bold">
                          {currentRec?.digitalSignatureLogs?.[0]?.certificateNumber || 'DS-2026-0001'}
                        </span>
                      </div>
                    ) : (
                      <div className="text-slate-500">
                        <Stamp className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                        <span className="text-2xs font-bold block">
                          {currentRec?.status === 'SUBMITTED'
                            ? '[ Menunggu TTE Kepala BRIDA ]'
                            : '[ Draf Internal Litbang ]'}
                        </span>
                        <span className="text-[9px] text-slate-500">Sertifikasi BSrE Mimika</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-black text-slate-900 underline">
                      Dr. Petrus Renyaan, M.Si.
                    </p>
                    <p className="text-2xs text-slate-600 font-mono">NIP. 19730412 199803 1 001</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL DIALOGS                                                          */}
      {/* ========================================================================= */}

      {/* A. Quick Proposal Switcher Modal */}
      {isQuickPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-2xl w-full p-4 sm:p-6 shadow-xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Pilih Agenda Usulan / Kajian Riset
                  </h3>
                  <p className="text-2xs text-slate-500">
                    Beralih langsung ke naskah rekomendasi usulan lain
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickPickerOpen(false)}
                className="text-slate-400 hover:text-black text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Search Input in modal */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={quickPickerSearch}
                onChange={(e) => setQuickPickerSearch(e.target.value)}
                placeholder="Ketik judul riset, OPD, atau kode usulan..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
              {quickPickerFiltered.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-8">
                  Tidak ditemukan usulan yang sesuai kata kunci.
                </p>
              ) : (
                quickPickerFiltered.map(({ study, rec, recStatus }) => {
                  const isCurrent = study.id === selectedStudyId;
                  return (
                    <div
                      key={study.id}
                      onClick={() => {
                        setSelectedStudyId(study.id);
                        setIsQuickPickerOpen(false);
                      }}
                      className={cn(
                        'p-3 cursor-pointer transition flex items-start justify-between gap-3 text-xs',
                        isCurrent
                          ? 'bg-blue-50 border border-blue-300'
                          : 'hover:bg-slate-50 border border-transparent'
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-slate-100 border border-slate-300 text-slate-800">
                            {study.proposal?.code || 'USL'}
                          </span>
                          <span className="text-[10px] font-bold text-blue-900">
                            {study.proposal?.opd?.name || 'OPD Terkait'}
                          </span>
                        </div>
                        <p className="font-extrabold text-slate-900 text-xs leading-snug">
                          {study.title}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        {renderStatusBadge(recStatus)}
                        {isCurrent && (
                          <span className="text-[10px] text-blue-700 font-bold block mt-1">
                            Sedang Dibuka
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsQuickPickerOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-300"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B. AI Assistant Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-blue-50 text-blue-800 border border-blue-200 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Asisten AI Policy Brief</h3>
                  <p className="text-2xs text-slate-600">
                    Otomatisasi perumusan naskah berbasis hasil riset & KAK
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-black text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-300 text-xs text-slate-800">
                <p className="font-bold text-slate-900 text-2xs uppercase tracking-wider mb-0.5">
                  Sumber Data Riset Terpilih:
                </p>
                <p className="font-semibold text-slate-950">{currentStudy?.title}</p>
                <p className="text-2xs text-slate-600 mt-1">
                  OPD:{' '}
                  <span className="font-bold text-slate-800">
                    {currentStudy?.proposal?.opd?.name || 'Instansi Terkait'}
                  </span>{' '}
                  | TA: <strong>{currentStudy?.fiscalYear}</strong>
                </p>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 text-xs space-y-1.5">
                <p className="font-extrabold text-blue-950 text-2xs uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                  Basis Dokumen yang Diolah AI:
                </p>
                <div className="grid grid-cols-2 gap-1 text-2xs text-blue-900 font-medium">
                  <span className="flex items-center gap-1">✓ Masalah & Urgensi OPD</span>
                  <span className="flex items-center gap-1">✓ Dokumen KAK Terlampir</span>
                  <span className="flex items-center gap-1">✓ Hasil Telaah Litbang</span>
                  <span className="flex items-center gap-1">✓ Ringkasan Laporan Riset</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                  Instruksi Khusus / Fokus Kebijakan (Opsional):
                </label>
                <textarea
                  rows={3}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Contoh: Fokuskan rekomendasi aksi pada percepatan 6 bulan pertama, alokasi APBD Perubahan, dan integrasi lintas dinas..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 text-xs leading-relaxed focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Biarkan kosong untuk otomatis merumuskan policy brief standar berdasarkan data riset.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition border border-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isGeneratingAi}
                onClick={() => handleGenerateAi(Boolean(customPrompt.trim()))}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-5 py-2.5 transition shadow-md border border-blue-700 text-xs disabled:opacity-50"
              >
                <Sparkles className={cn('w-4 h-4', isGeneratingAi ? 'animate-spin' : 'text-sky-200')} />
                {isGeneratingAi ? 'Menyusun Naskah...' : 'Mulai Susun dengan AI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminRecommendationBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-500 font-mono text-xs">
          Memuat modul Penyusunan Rekomendasi BRIDA...
        </div>
      }
    >
      <RecommendationBuilderContent />
    </Suspense>
  );
}
