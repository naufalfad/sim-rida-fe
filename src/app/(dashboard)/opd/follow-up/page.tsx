'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOpdStore, OpdProposal } from '@/store/useOpdStore';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { DocumentViewerModal, DocumentReviewState } from '@/components/ui/document-viewer-modal';
import {
  ClipboardCheck,
  Star,
  CheckCircle2,
  Award,
  Send,
  Building,
  Calendar,
  FileText,
  Sparkles,
  HelpCircle,
  Clock,
  ArrowRight,
  Layers,
  FileCheck,
  Eye,
  BookOpen,
  ShieldCheck,
  FileSpreadsheet,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Info,
  Lightbulb,
  Check,
  FolderArchive,
  FileCode,
  Download
} from 'lucide-react';

function FollowUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalIdParam = searchParams.get('proposalId');
  const { toast } = useToast();
  const {
    proposals,
    recommendations,
    selectedProposalId,
    selectProposal,
    submitFollowUp,
    fetchProposals,
    fetchRecommendations
  } = useOpdStore();

  const [documentReview, setDocumentReview] = useState<DocumentReviewState | null>(null);

  // Search & Filter States for proposals list
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'REPORTED'>('ALL');

  // Active Workspace Sub-Tab State
  const [activeTab, setActiveTab] = useState<'FORM' | 'DOCUMENTS' | 'BRIEF'>('FORM');

  // Filter inside the Document Center Tab
  const [docCategoryFilter, setDocCategoryFilter] = useState<'ALL' | 'PRIMARY' | 'LEGAL' | 'WORKING'>('ALL');

  useEffect(() => {
    fetchProposals();
    fetchRecommendations({ status: 'FINALIZED' });
  }, [fetchProposals, fetchRecommendations]);

  useEffect(() => {
    if (proposalIdParam) {
      selectProposal(proposalIdParam);
    }
  }, [proposalIdParam, selectProposal]);

  // Completed proposals that have recommendations or follow up
  const completedProposals = useMemo(() => {
    return proposals.filter((p) => p.status === 'COMPLETED' || p.recommendationDoc || p.followUpReport);
  }, [proposals]);

  // Filtered proposals based on search and status
  const filteredProposals = useMemo(() => {
    return completedProposals.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.recommendationDoc?.title && p.recommendationDoc.title.toLowerCase().includes(q));

      const isReported = !!p.followUpReport;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'REPORTED' && isReported) ||
        (statusFilter === 'PENDING' && !isReported);

      return matchesSearch && matchesStatus;
    });
  }, [completedProposals, searchQuery, statusFilter]);

  const activeProposal = useMemo(() => {
    if (selectedProposalId) {
      const found = completedProposals.find((p) => p.id === selectedProposalId);
      if (found) return found;
    }
    return filteredProposals[0] || completedProposals[0];
  }, [completedProposals, filteredProposals, selectedProposalId]);

  // Form states
  const [utilizationType, setUtilizationType] = useState<
    'Rencana Kerja (Renja)' | 'Revisi / Pembuatan SOP' | 'Penyusunan Ranperda' | 'Implementasi Teknis'
  >('Rencana Kerja (Renja)');
  const [utilizationSummary, setUtilizationSummary] = useState('');
  const [satisfactionRating, setSatisfactionRating] = useState(5);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize when active proposal changes
  useEffect(() => {
    if (activeProposal?.followUpReport) {
      setUtilizationType(activeProposal.followUpReport.utilizationType);
      setUtilizationSummary(activeProposal.followUpReport.utilizationSummary);
      setSatisfactionRating(activeProposal.followUpReport.satisfactionRating);
      setFeedbackNotes(activeProposal.followUpReport.feedbackNotes);
    } else {
      setUtilizationSummary('');
      setSatisfactionRating(5);
      setFeedbackNotes('');
    }
  }, [activeProposal]);

  // Find linked recommendation if available
  const activeRecommendation = useMemo(() => {
    if (!activeProposal) return null;
    return (
      recommendations.find(
        (r) => r.study?.proposal?.id === activeProposal.id || r.studyId === activeProposal.researchStudy?.id
      ) || activeProposal.researchStudy?.policyRecommendations?.[0]
    );
  }, [activeProposal, recommendations]);

  const activeKak = useMemo(() => {
    return activeRecommendation?.study?.kakDocument || activeProposal?.researchStudy?.kakDocument;
  }, [activeRecommendation, activeProposal]);

  const activeStudy = useMemo(() => {
    return activeRecommendation?.study || activeProposal?.researchStudy;
  }, [activeRecommendation, activeProposal]);

  // Handlers for opening documents
  const handleOpenPolicyBrief = () => {
    if (!activeProposal) return;
    setDocumentReview({
      name: `Policy_Brief_${activeRecommendation?.code || activeProposal.code}.pdf`,
      type: 'POLICY_BRIEF',
      proposalCode: activeRecommendation?.code || activeProposal.code,
      proposalTitle: activeRecommendation?.title || activeProposal.title,
      opdName: activeProposal.opdName,
      uploadDate: activeRecommendation?.signedAt
        ? new Date(activeRecommendation.signedAt).toLocaleDateString('id-ID')
        : '01 Mar 2026',
      size: '3.8 MB',
      executiveSummary: activeRecommendation?.executiveSummary,
      background: activeRecommendation?.background,
      policyRecommendations: activeRecommendation?.policyRecommendations,
      conclusion: activeRecommendation?.conclusion,
      correlatedDocs: activeRecommendation?.correlatedDocs || undefined,
      targetPolicyType: activeRecommendation?.targetPolicyType || activeProposal.expectedOutput,
      impactLevel: activeRecommendation?.impactLevel || 'Strategis Daerah',
      targetOpdNames: activeRecommendation?.targetOpdNames || activeProposal.opdName,
      signedBy: activeRecommendation?.signedBy?.name || 'Dr. Petrus Renyaan, M.Si (Kepala BRIDA)',
      signedAt: activeRecommendation?.signedAt
        ? new Date(activeRecommendation.signedAt).toLocaleDateString('id-ID')
        : '01 Mar 2026',
    });
  };

  const handleOpenKak = () => {
    if (!activeProposal) return;
    const isKakUploaded = activeStudy?.finalReportName?.toLowerCase().includes('kak');
    setDocumentReview({
      name: isKakUploaded ? activeStudy!.finalReportName! : `KAK_${activeProposal.code}.pdf`,
      type: 'KAK_TOR',
      proposalCode: activeProposal.code,
      proposalTitle: `Kerangka Acuan Kerja (KAK): ${activeProposal.title}`,
      opdName: activeProposal.opdName,
      uploadDate: activeKak?.finalizedAt ? new Date(activeKak.finalizedAt).toLocaleDateString('id-ID') : '01 Jan 2026',
      size: '2.4 MB',
      url: isKakUploaded ? activeStudy?.finalReportUrl || undefined : undefined,
      kakBackground: activeKak?.background || activeProposal.problemStatement,
      kakObjectives: activeKak?.objectives || activeProposal.urgencyReason,
      kakScope: activeKak?.scopeAndMethodology || 'Wilayah Kabupaten Mimika',
      kakTargetOutput: activeKak?.targetOutput || activeProposal.expectedOutput,
      kakStatus: activeKak?.status || 'FINAL',
      problemStatement: activeProposal.problemStatement,
    });
  };

  const handleOpenFinalReport = () => {
    if (!activeProposal) return;
    setDocumentReview({
      name: activeStudy?.finalReportName || `Laporan_Akhir_${activeProposal.code}.pdf`,
      type: 'LAPORAN_AKHIR',
      proposalCode: activeProposal.code,
      proposalTitle: `Laporan Akhir Penelitian: ${activeProposal.title}`,
      opdName: activeProposal.opdName,
      uploadDate: activeProposal.lastUpdated || '01 Mar 2026',
      size: '5.2 MB',
      finalReportSummary:
        activeStudy?.finalReportSummary ||
        'Laporan akhir merangkum seluruh temuan data primer, metodologi riset, analisis statistik, serta implikasi kebijakan strategis.',
      url: activeStudy?.finalReportUrl,
      kakScope: activeKak?.scopeAndMethodology,
      policyRecommendations: activeRecommendation?.policyRecommendations,
      executiveSummary: activeRecommendation?.executiveSummary,
    });
  };

  // Dokumen Kerja Sama & Legalitas Info
  const cooperationDocInfo = useMemo(() => {
    const scheme = activeStudy?.executionScheme || activeProposal?.scoringData?.executionMethod || 'SWAKELOLA';
    const isSwakelola = scheme === 'SWAKELOLA';
    const defaultDocName = isSwakelola
      ? `SK_Tim_Peneliti_BRIDA_${activeProposal?.code || 'RIS'}.pdf`
      : `PKS_Kerja_Sama_Litbang_${activeProposal?.code || 'RIS'}.pdf`;
    const name = activeStudy?.cooperationDocName || defaultDocName;
    const schemeTitle = isSwakelola
      ? 'SK Tim Peneliti (Swakelola Internal)'
      : scheme === 'PENUNJUKAN_LANGSUNG'
      ? 'SPK Tenaga Ahli (Penunjukan Langsung)'
      : scheme === 'E_KATALOG'
      ? 'Surat Pesanan Kontrak E-Katalog'
      : 'Perjanjian Kerja Sama (PKS) Tender';

    return {
      name,
      schemeTitle,
      scheme,
      url: activeStudy?.cooperationDocUrl || undefined,
      isUploaded: !!activeStudy?.cooperationDocName || !!activeStudy?.cooperationDocUrl,
    };
  }, [activeStudy, activeProposal]);

  // Handler: Buka Dokumen Kerja Sama / SK Tim Peneliti
  const handleOpenCooperationDoc = () => {
    if (!activeProposal) return;
    const scheme = activeStudy?.executionScheme || activeProposal.scoringData?.executionMethod || 'SWAKELOLA';
    const isSwakelola = scheme === 'SWAKELOLA';
    const schemeLabel = isSwakelola
      ? 'Swakelola Mandiri Internal BRIDA'
      : scheme === 'PENUNJUKAN_LANGSUNG'
      ? 'Penunjukan Langsung / SPK Tenaga Ahli'
      : scheme === 'E_KATALOG'
      ? 'E-Katalog / Surat Pesanan Kontrak Riset'
      : 'Tender / Perjanjian Kerja Sama (PKS) Litbang';

    setDocumentReview({
      name: cooperationDocInfo.name,
      type: 'COOPERATION_DOC',
      proposalCode: activeProposal.code,
      proposalTitle: `Dokumen Legalitas & Kerja Sama: ${activeProposal.title}`,
      opdName: activeProposal.opdName,
      uploadDate: activeProposal.lastUpdated || '01 Feb 2026',
      size: '2.8 MB',
      url: cooperationDocInfo.url,
      cooperationScheme: schemeLabel,
      cooperationNumber: isSwakelola ? `SK.045/BRIDA-MMK/${activeProposal.code}` : `PKS.021/BRIDA-MITRA/${activeProposal.code}`,
      institution: isSwakelola ? 'Tim Peneliti BRIDA Kabupaten Mimika' : 'Lembaga Pelaksana Riset & Perguruan Tinggi',
      teamLead: activeStudy?.teamMembers?.find((m: any) => m.role?.toLowerCase().includes('ketua'))?.name || 'Dr. Hendra Wijaya, M.Sc (Ketua Tim Peneliti)',
      content: isSwakelola
        ? `Surat Keputusan (SK) Penetapan Tim Peneliti Internal BRIDA Kabupaten Mimika untuk pelaksanaan kegiatan kajian riset "${activeProposal.title}". Menugaskan susunan tim peneliti untuk melaksanakan survei primer lapangan, uji laboratorium/data statistik, hingga perumusan rekomendasi naskah kebijakan resmi.`
        : `Surat Perjanjian Kerja Sama (PKS) dan Dokumen Kontrak Pelaksanaan Kegiatan Kelitbangan antara Badan Riset dan Inovasi Daerah (BRIDA) Kabupaten Mimika dengan Lembaga Mitra Peneliti. Mengatur hak, kewajiban, tata cara pembayaran berbasis deliverable luaran, serta jaminan mutu hasil riset bagi Pemkab Mimika.`,
    });
  };

  // Berkas Kerja & Data Riset Lapangan (Working Documents)
  const workingDocumentsList = useMemo(() => {
    if (Array.isArray(activeStudy?.workingDocuments) && activeStudy.workingDocuments.length > 0) {
      return activeStudy.workingDocuments;
    }
    // Fallback berkas kerja representatif jika belum diinput manual ke database
    return [
      {
        id: `wd-1-${activeProposal?.id || 'def'}`,
        title: `Tabulasi_Data_Survei_Responden_${activeProposal?.code || 'RIS'}.xlsx`,
        type: 'Data Mentah / Tabulasi (Excel / CSV)',
        fileSize: '1.9 MB',
        uploadDate: activeProposal?.lastUpdated || '2026-02-14',
        fileUrl: undefined,
      },
      {
        id: `wd-2-${activeProposal?.id || 'def'}`,
        title: `Transkrip_FGD_Masyarakat_Stakeholder_${activeProposal?.code || 'RIS'}.pdf`,
        type: 'Transkrip FGD & Wawancara Mendalam',
        fileSize: '2.4 MB',
        uploadDate: activeProposal?.lastUpdated || '2026-02-20',
        fileUrl: undefined,
      },
      {
        id: `wd-3-${activeProposal?.id || 'def'}`,
        title: `Laporan_Antara_Progres_Metodologi_${activeProposal?.code || 'RIS'}.pdf`,
        type: 'Laporan Antara / Interim Report',
        fileSize: '3.6 MB',
        uploadDate: activeProposal?.lastUpdated || '2026-02-28',
        fileUrl: undefined,
      },
    ];
  }, [activeStudy, activeProposal]);

  // Handler: Buka Berkas Kerja / Data Lapangan
  const handleOpenWorkingDoc = (doc: {
    id: string;
    title: string;
    type: string;
    fileSize?: string | null;
    uploadDate?: string;
    fileUrl?: string;
  }) => {
    if (!activeProposal) return;
    setDocumentReview({
      name: doc.title,
      type: 'WORKING_DOC',
      proposalCode: activeProposal.code,
      proposalTitle: `Berkas Riset: ${activeProposal.title}`,
      opdName: activeProposal.opdName,
      uploadDate: doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('id-ID') : '15 Feb 2026',
      size: doc.fileSize || '2.4 MB',
      url: doc.fileUrl || undefined,
      workingDocType: doc.type,
      workingDocDescription: `Berkas kerja litbang BRIDA berkategori "${doc.type}" untuk usulan ${activeProposal.code} ("${activeProposal.title}"). Berkas ini merupakan data mentah empiris atau dokumen teknis antara yang dihimpun tim peneliti litbang daerah di wilayah Kabupaten Mimika.`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProposal) return;
    if (!utilizationSummary.trim()) {
      toast('Ringkasan pemanfaatan rekomendasi wajib diisi.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const today = new Date().toLocaleDateString('id-ID');
      await submitFollowUp(activeProposal.id, {
        utilizationType,
        utilizationSummary,
        satisfactionRating,
        feedbackNotes,
        submittedAt: today,
      });

      toast('Laporan pemanfaatan & evaluasi kepuasan berhasil disimpan dan diteruskan ke BRIDA.', 'success');
      await fetchProposals();
    } catch (err: any) {
      toast('Gagal mengirimkan laporan: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSatisfactionLabel = (rating: number) => {
    switch (rating) {
      case 5:
        return { label: 'Sangat Puas' };
      case 4:
        return { label: 'Puas' };
      case 3:
        return { label: 'Cukup Puas' };
      case 2:
        return { label: 'Kurang Puas' };
      case 1:
        return { label: 'Tidak Puas' };
      default:
        return { label: 'Puas' };
    }
  };

  // Qualitative feedback text helper
  const satisfactionMeta = useMemo(() => {
    switch (satisfactionRating) {
      case 5:
        return {
          label: 'Sangat Puas',
          desc: 'Hasil riset & rekomendasi sangat aplikatif, berkualitas tinggi, dan solutif.',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
      case 4:
        return {
          label: 'Puas',
          desc: 'Hasil kajian litbang sesuai ekspektasi dan memberikan rekomendasi yang jelas.',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
        };
      case 3:
        return {
          label: 'Cukup Puas',
          desc: 'Rekomendasi cukup baik, namun masih memerlukan penyesuaian operasional di lapangan.',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 2:
        return {
          label: 'Kurang Puas',
          desc: 'Hasil kajian kurang tajam atau data pendukung belum mencukupi kebutuhan OPD.',
          badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
        };
      case 1:
        return {
          label: 'Tidak Puas',
          desc: 'Rekomendasi tidak relevan atau tidak dapat ditindaklanjuti secara teknis.',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        };
      default:
        return {
          label: 'Puas',
          desc: '',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
        };
    }
  }, [satisfactionRating]);

  // Quick insertion of template text for utilizationSummary
  const handleApplyTemplate = (text: string) => {
    if (!utilizationSummary.trim()) {
      setUtilizationSummary(text);
    } else {
      setUtilizationSummary((prev) => `${prev}\n\n${text}`);
    }
    toast('Contoh format pemanfaatan disisipkan ke formulir.', 'info');
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Modul Tindak Lanjut & Evaluasi Rekomendasi OPD"
        description="Pantau seluruh berkas hasil litbang dari BRIDA (Kebijakan, KAK, Laporan Akhir, PKS, & Berkas Lapangan) serta laporkan adopsi pemanfaatannya."
      />

      {completedProposals.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center text-slate-400 space-y-3 border border-slate-200 bg-white rounded-2xl shadow-xs">
          <Award className="h-12 w-12 text-slate-300 mx-auto" />
          <h4 className="font-bold text-sm text-slate-800">Belum Ada Rekomendasi Riset yang Perlu Dilaporkan</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Halaman ini akan aktif otomatis setelah usulan penelitian OPD Anda rampung dan dokumen Policy Brief resmi
            diterbitkan oleh BRIDA Kabupaten Mimika.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          
          {/* ============================================================== */}
          {/* LEFT SIDEBAR: DAFTAR REKOMENDASI USAHAN (4 cols)              */}
          {/* ============================================================== */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="shadow-xs border border-slate-200 bg-white rounded-2xl overflow-hidden">
              
              {/* Header List */}
              <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/80 space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Award className="h-4 w-4 text-blue-600" />
                    <span>Daftar Rekomendasi ({completedProposals.length})</span>
                  </CardTitle>
                  <span className="text-3xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-mono">
                    {filteredProposals.length} Tampil
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari kode atau judul usulan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition"
                  />
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-3xs font-bold transition whitespace-nowrap ${
                      statusFilter === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Semua ({completedProposals.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('PENDING')}
                    className={`px-2.5 py-1 rounded-lg text-3xs font-bold transition whitespace-nowrap ${
                      statusFilter === 'PENDING'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    Wajib Diisi ({completedProposals.filter((p) => !p.followUpReport).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('REPORTED')}
                    className={`px-2.5 py-1 rounded-lg text-3xs font-bold transition whitespace-nowrap ${
                      statusFilter === 'REPORTED'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    Dilaporkan ({completedProposals.filter((p) => !!p.followUpReport).length})
                  </button>
                </div>
              </CardHeader>

              {/* Proposals List Items */}
              <CardContent className="p-0 divide-y divide-slate-100 max-h-[calc(100vh-280px)] overflow-y-auto">
                {filteredProposals.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 space-y-1 text-xs">
                    <p className="font-semibold text-slate-600">Tidak ada usulan yang cocok</p>
                    <p className="text-3xs text-slate-400">Ubah kata kunci pencarian atau filter status Anda.</p>
                  </div>
                ) : (
                  filteredProposals.map((item) => {
                    const isSelected = activeProposal?.id === item.id;
                    const isReported = !!item.followUpReport;

                    return (
                      <div
                        key={item.id}
                        onClick={() => selectProposal(item.id)}
                        className={`p-3.5 sm:p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50/90 border-l-4 border-l-blue-600 shadow-xs'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-3xs font-black px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                              {item.code}
                            </span>
                            {isReported ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                SUDAH DILAPORKAN
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                <Clock className="h-3 w-3 text-amber-600 animate-pulse" />
                                PERLU TINDAK LANJUT
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                            {item.recommendationDoc?.title || item.title}
                          </h4>

                          <div className="flex items-center justify-between text-3xs text-slate-500 pt-0.5">
                            <span className="font-semibold text-blue-900 truncate max-w-[140px]">
                              {item.category || item.expectedOutput}
                            </span>
                            <span className="font-mono text-slate-400">
                              {item.recommendationDoc?.date || item.lastUpdated || '2026'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* ============================================================== */}
          {/* RIGHT WORKSPACE: DOKUMEN & FORMULIR TINDAK LANJUT (8 cols)      */}
          {/* ============================================================== */}
          <div className="lg:col-span-8 space-y-4">
            {activeProposal ? (
              <Card className="border border-slate-200 bg-white rounded-2xl shadow-xs overflow-hidden">
                
                {/* 1. Proposal Hero Header */}
                <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-blue-50/40">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-lg border border-blue-200">
                          {activeProposal.code}
                        </span>
                        <span className="text-2xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {activeProposal.category}
                        </span>
                      </div>

                      {activeProposal.followUpReport ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-2xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Pemanfaatan Telah Dilaporkan ({activeProposal.followUpReport.submittedAt})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded-full text-2xs font-bold">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Menunggu Laporan Pemanfaatan OPD</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[#0f2c59] leading-snug">
                        {activeRecommendation?.title || activeProposal.title}
                      </h3>
                      <p className="text-2xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span>Pengusul: <strong>{activeProposal.opdName}</strong></span>
                        <span>•</span>
                        <span>Luaran Target: <strong>{activeProposal.expectedOutput}</strong></span>
                      </p>
                    </div>
                  </div>

                  {/* Tab Navigation Segmented Control */}
                  <div className="mt-4 pt-3 border-t border-slate-200/70 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('FORM')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                        activeTab === 'FORM'
                          ? 'bg-[#0f2c59] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>Formulir Laporan Pemanfaatan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('DOCUMENTS')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                        activeTab === 'DOCUMENTS'
                          ? 'bg-[#0f2c59] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <FolderArchive className="w-4 h-4" />
                      <span>Semua Berkas Riset BRIDA ({3 + 1 + workingDocumentsList.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('BRIEF')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                        activeTab === 'BRIEF'
                          ? 'bg-[#0f2c59] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Intisari Rekomendasi (Policy Brief)</span>
                    </button>
                  </div>
                </div>

                <CardContent className="p-4 sm:p-6 space-y-6">
                  
                  {/* ========================================================== */}
                  {/* TAB 1: FORMULIR PELAPORAN TINDAK LANJUT & EVALUASI        */}
                  {/* ========================================================== */}
                  {activeTab === 'FORM' && (
                    <div className="space-y-6">
                      
                      {/* Quick Recommendation Reference Callout */}
                      <div className="p-4 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border border-blue-200 rounded-2xl space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-blue-950">
                            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>Rujukan Pilihan Kebijakan BRIDA untuk Dipertimbangkan:</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleOpenPolicyBrief}
                              className="px-2 py-1 bg-white hover:bg-purple-50 text-purple-900 border border-purple-200 rounded-lg text-3xs font-bold transition flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3 text-purple-600" />
                              <span>Baca Policy Brief</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleOpenFinalReport}
                              className="px-2 py-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-3xs font-bold transition flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3 text-amber-600" />
                              <span>Laporan Akhir</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-2xs text-slate-700 leading-relaxed bg-white/80 p-3 rounded-xl border border-blue-100 line-clamp-3">
                          {activeRecommendation?.executiveSummary ||
                            activeProposal.problemStatement ||
                            'Kajian ini telah selesai dan menghasilkan rekomendasi kebijakan strategis berbasis bukti empiris lapangan bagi dinas terkait.'}
                        </p>

                        <div className="flex items-center justify-between text-3xs text-blue-800 pt-0.5">
                          <span>
                            Bentuk Regulasi Disarankan:{' '}
                            <strong>{activeRecommendation?.targetPolicyType || activeProposal.expectedOutput}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveTab('BRIEF')}
                            className="font-bold underline hover:text-blue-950 flex items-center gap-0.5"
                          >
                            <span>Lihat Telaah Lengkap</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Status Terlapor Notifier */}
                      {activeProposal.followUpReport && (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-950">
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div>
                              <span className="font-bold block">
                                Laporan Tindak Lanjut Telah Tersimpan di Database BRIDA
                              </span>
                              <span className="text-2xs text-emerald-800">
                                Diperbarui tanggal: {activeProposal.followUpReport.submittedAt} • Rating:{' '}
                                {activeProposal.followUpReport.satisfactionRating} Bintang (
                                {getSatisfactionLabel(activeProposal.followUpReport.satisfactionRating).label})
                              </span>
                            </div>
                          </div>
                          <span className="text-3xs font-extrabold px-2 py-0.5 bg-emerald-200/70 text-emerald-900 rounded font-mono">
                            VERIFIKASI OPD
                          </span>
                        </div>
                      )}

                      {/* Form Formulir */}
                      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                        
                        {/* 1. Bentuk Pemanfaatan */}
                        <div className="space-y-2">
                          <label className="font-bold text-slate-800 flex items-center gap-1">
                            <span>1. Bentuk Pemanfaatan Rekomendasi oleh OPD</span>
                            <span className="text-red-500">*</span>
                          </label>
                          <p className="text-3xs text-slate-500">
                            Pilih instrumen kebijakan atau saluran adopsi utama yang digunakan oleh dinas Anda:
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {[
                              {
                                id: 'Rencana Kerja (Renja)',
                                title: 'Rencana Kerja (Renja / RKPD)',
                                desc: 'Diadopsi ke dalam pos anggaran program Renja tahun depan',
                                icon: Calendar,
                              },
                              {
                                id: 'Revisi / Pembuatan SOP',
                                title: 'Revisi / Pembuatan SOP Teknis',
                                desc: 'Digunakan sebagai dasar acuan baku standar prosedur lapangan',
                                icon: FileCheck,
                              },
                              {
                                id: 'Penyusunan Ranperda',
                                title: 'Penyusunan Perda / Perbup',
                                desc: 'Dijadikan Naskah Akademik draf regulasi kepala daerah',
                                icon: BookOpen,
                              },
                              {
                                id: 'Implementasi Teknis',
                                title: 'Aplikasi / Penerapan Teknis Langsung',
                                desc: 'Penerapan metodologi, survei, atau inovasi fisik di lapangan',
                                icon: Sparkles,
                              },
                            ].map((opt) => {
                              const isChecked = utilizationType === opt.id;
                              const Icon = opt.icon;
                              return (
                                <div
                                  key={opt.id}
                                  onClick={() => setUtilizationType(opt.id as any)}
                                  className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                                    isChecked
                                      ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                                      : 'bg-white hover:bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <div
                                    className={`p-2 rounded-lg shrink-0 ${
                                      isChecked ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-xs text-slate-900">{opt.title}</h5>
                                    <p className="text-3xs text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Rincian & Deskripsi Pemanfaatan Nyata */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <label className="font-bold text-slate-800 flex items-center gap-1">
                              <span>2. Rincian & Deskripsi Pemanfaatan Nyata di Lapangan</span>
                              <span className="text-red-500">*</span>
                            </label>
                            <span className="text-3xs text-slate-400">Minimal 15 karakter uraian</span>
                          </div>

                          {/* Quick Template Chips */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-3xs font-semibold text-slate-500 flex items-center gap-1">
                              <Lightbulb className="w-3 h-3 text-amber-500" />
                              Contoh narasi:
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleApplyTemplate(
                                  `Rekomendasi kajian BRIDA diintegrasikan ke dalam Rancangan Rencana Kerja (Renja) tahun anggaran berikutnya pada program peningkatan mutu layanan dan alokasi anggaran kegiatan.`
                                )
                              }
                              className="text-3xs px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
                            >
                              + Adopsi Renja
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleApplyTemplate(
                                  `Menindaklanjuti Alternatif 1: Data dan telaah empiris digunakan sebagai dasar pembaharuan Standar Operasional Prosedur (SOP) internal dinas untuk mempercepat waktu pelayanan.`
                                )
                              }
                              className="text-3xs px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-md transition font-medium"
                            >
                              + Alternatif 1 (SOP/Internal)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleApplyTemplate(
                                  `Menindaklanjuti Alternatif 2 (Rekomendasi Utama): OPD mengadopsi naskah rekomendasi sebagai dasar penyusunan Draf Peraturan Bupati (Perbup) dan pembentukan Tim Pokja Terpadu.`
                                )
                              }
                              className="text-3xs px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md transition font-medium"
                            >
                              + Alternatif 2 (Perbup/Pokja)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleApplyTemplate(
                                  `Menindaklanjuti Alternatif 3: Pengusulan alokasi pos anggaran APBD khusus dan digitalisasi integrasi sarpras pelayanan pada tahun anggaran berjalan.`
                                )
                              }
                              className="text-3xs px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-md transition font-medium"
                            >
                              + Alternatif 3 (APBD/Digital)
                            </button>
                          </div>

                          <textarea
                            rows={4}
                            placeholder="Contoh: Berdasarkan temuan Policy Brief dan Laporan Akhir, program monitoring ini telah kami masukkan ke dalam usulan Renja dinas pada pos belanja operasional, serta dijadikan pedoman pembagian zonasi kerja di 12 distrik..."
                            value={utilizationSummary}
                            onChange={(e) => setUtilizationSummary(e.target.value)}
                            className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 bg-white leading-relaxed font-medium text-slate-800 focus:outline-hidden"
                          />
                        </div>

                        {/* 3. Rating Kepuasan Layanan Litbang */}
                        <div className="space-y-2 pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-slate-800">
                              <span>3. Evaluasi Kepuasan Terhadap Layanan & Mutu Riset BRIDA</span>
                            </label>
                            <span className="text-xs font-black text-blue-900">
                              {satisfactionRating} dari 5 Bintang
                            </span>
                          </div>

                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                            <div className="flex items-center justify-center gap-2 sm:gap-3">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setSatisfactionRating(star)}
                                  className="p-1.5 transition-transform hover:scale-125 focus:outline-hidden"
                                  title={`Rating ${star} Bintang`}
                                >
                                  <Star
                                    className={`h-7 w-7 sm:h-8 sm:w-8 transition-colors ${
                                      star <= satisfactionRating
                                        ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                                        : 'text-slate-300 hover:text-slate-400'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>

                            {/* Qualitative label */}
                            <div className="text-center">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${satisfactionMeta.badgeClass}`}
                              >
                                {satisfactionMeta.label}
                              </span>
                              <p className="text-2xs text-slate-500 mt-1 max-w-md mx-auto">
                                {satisfactionMeta.desc}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 4. Saran & Masukan */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <label className="font-bold text-slate-800">
                            <span>4. Catatan Kualitatif / Masukan Konstruktif untuk BRIDA (Opsional)</span>
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Tuliskan apresiasi, masukan terkait metodologi data, kecepatan respon tim peneliti BRIDA, atau rekomendasi tema riset lanjutan..."
                            value={feedbackNotes}
                            onChange={(e) => setFeedbackNotes(e.target.value)}
                            className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 bg-white leading-relaxed font-medium text-slate-800 focus:outline-hidden"
                          />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <span className="text-3xs text-slate-500 text-center sm:text-left">
                            Laporan ini tersimpan resmi dan menjadi indikator kinerja litbang daerah Pemkab Mimika.
                          </span>

                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                          >
                            <Send className="h-4 w-4" />
                            <span>
                              {activeProposal.followUpReport
                                ? 'Perbarui Laporan Pemanfaatan'
                                : 'Kirim Laporan Pemanfaatan'}
                            </span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* ========================================================== */}
                  {/* TAB 2: SELURUH BERKAS & ARSIP RISET BRIDA                  */}
                  {/* ========================================================== */}
                  {activeTab === 'DOCUMENTS' && (
                    <div className="space-y-6">
                      
                      {/* Documents Overview Banner */}
                      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-[#0f2c59] text-white rounded-2xl space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-sky-500/20 text-sky-300 rounded-xl border border-sky-400/30 shrink-0">
                              <FolderArchive className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">
                                Repositori Berkas Resmi Hasil Riset BRIDA
                              </h4>
                              <p className="text-2xs text-slate-300">
                                Seluruh dokumen kajian dari tahap KAK, perjanjian kerja sama, data lapangan, hingga
                                rekomendasi kebijakan.
                              </p>
                            </div>
                          </div>

                          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-2xs font-mono font-bold self-start sm:self-center">
                            TOTAL: {3 + 1 + workingDocumentsList.length} DOKUMEN
                          </span>
                        </div>

                        {/* Filter Chips inside Documents */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-700/80 overflow-x-auto">
                          <button
                            type="button"
                            onClick={() => setDocCategoryFilter('ALL')}
                            className={`px-3 py-1 rounded-lg text-3xs font-bold transition whitespace-nowrap ${
                              docCategoryFilter === 'ALL'
                                ? 'bg-white text-slate-950 shadow-xs'
                                : 'bg-white/10 text-slate-200 hover:bg-white/20'
                            }`}
                          >
                            Semua Berkas ({3 + 1 + workingDocumentsList.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setDocCategoryFilter('PRIMARY')}
                            className={`px-3 py-1 rounded-lg text-3xs font-bold transition whitespace-nowrap ${
                              docCategoryFilter === 'PRIMARY'
                                ? 'bg-white text-slate-950 shadow-xs'
                                : 'bg-white/10 text-slate-200 hover:bg-white/20'
                            }`}
                          >
                            Dokumen Pokok Riset (3)
                          </button>
                          <button
                            type="button"
                            onClick={() => setDocCategoryFilter('LEGAL')}
                            className={`px-3 py-1 rounded-lg text-3xs font-bold transition whitespace-nowrap ${
                              docCategoryFilter === 'LEGAL'
                                ? 'bg-white text-slate-950 shadow-xs'
                                : 'bg-white/10 text-slate-200 hover:bg-white/20'
                            }`}
                          >
                            Legalitas Kerja Sama (1)
                          </button>
                          <button
                            type="button"
                            onClick={() => setDocCategoryFilter('WORKING')}
                            className={`px-3 py-1 rounded-lg text-3xs font-bold transition whitespace-nowrap ${
                              docCategoryFilter === 'WORKING'
                                ? 'bg-white text-slate-950 shadow-xs'
                                : 'bg-white/10 text-slate-200 hover:bg-white/20'
                            }`}
                          >
                            Berkas Kerja Lapangan ({workingDocumentsList.length})
                          </button>
                        </div>
                      </div>

                      {/* 1. DOKUMEN POKOK RISET (TRI-DOKUMEN) */}
                      {(docCategoryFilter === 'ALL' || docCategoryFilter === 'PRIMARY') && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4 text-blue-600" />
                              <span>1. Dokumen Pokok Kebijakan & Laporan Riset (Tri-Dokumen)</span>
                            </h5>
                            <span className="text-3xs text-slate-400">Luaran Utama Litbang</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Card 1: Policy Brief */}
                            <div className="p-4 bg-white border border-purple-200 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between hover:border-purple-300 transition">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-3xs font-black uppercase text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded font-mono">
                                    DOKUMEN 1
                                  </span>
                                  <span className="text-3xs font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-full">
                                    TTE BSrE BSSN
                                  </span>
                                </div>
                                <h6 className="text-xs font-bold text-slate-900 leading-snug">
                                  Policy Brief / Rekomendasi Kebijakan
                                </h6>
                                <p className="text-3xs text-slate-500 line-clamp-2">
                                  Naskah rekomendasi kebijakan resmi yang disahkan oleh Kepala BRIDA Mimika.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={handleOpenPolicyBrief}
                                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Pratinjau & Unduh</span>
                              </button>
                            </div>

                            {/* Card 2: KAK Riset */}
                            <div className="p-4 bg-white border border-blue-200 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between hover:border-blue-300 transition">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-3xs font-black uppercase text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-mono">
                                    DOKUMEN 2
                                  </span>
                                  <span className="text-3xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-full">
                                    KAK Disahkan
                                  </span>
                                </div>
                                <h6 className="text-xs font-bold text-slate-900 leading-snug">
                                  Kerangka Acuan Kerja (KAK)
                                </h6>
                                <p className="text-3xs text-slate-500 line-clamp-2">
                                  Dokumen acuan ruang lingkup, metodologi, dan target luaran pelaksanaan riset.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={handleOpenKak}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Pratinjau & Unduh</span>
                              </button>
                            </div>

                            {/* Card 3: Laporan Akhir */}
                            <div className="p-4 bg-white border border-amber-200 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between hover:border-amber-300 transition">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-3xs font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono">
                                    DOKUMEN 3
                                  </span>
                                  <span className="text-3xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                                    Laporan Lengkap
                                  </span>
                                </div>
                                <h6 className="text-xs font-bold text-slate-900 leading-snug">
                                  Laporan Akhir Penelitian
                                </h6>
                                <p className="text-3xs text-slate-500 line-clamp-2">
                                  Laporan komprehensif memuat seluruh temuan lapangan, analisis data, dan metodologi.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={handleOpenFinalReport}
                                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Pratinjau & Unduh</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. DOKUMEN KERJA SAMA & LEGALITAS */}
                      {(docCategoryFilter === 'ALL' || docCategoryFilter === 'LEGAL') && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-indigo-600" />
                              <span>2. Dokumen Kerja Sama & Legalitas Pelaksana Riset</span>
                            </h5>
                            <span className="text-3xs text-slate-400">Dasar Hukum & Tim</span>
                          </div>

                          <div className="p-4 bg-white border border-indigo-200 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 transition">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="p-3 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl shrink-0">
                                <ShieldCheck className="w-6 h-6" />
                              </div>
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-3xs font-black uppercase text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-mono">
                                    {cooperationDocInfo.schemeTitle}
                                  </span>
                                  <span className="text-3xs text-slate-400">•</span>
                                  <span className="text-3xs text-slate-500">Legalitas SK/PKS Resmi BRIDA</span>
                                </div>
                                <h6 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                  {cooperationDocInfo.name}
                                </h6>
                                <p className="text-3xs text-slate-500">
                                  Surat Keputusan penetapan tim peneliti, penugasan resmi, jadwal kerja, dan perjanjian
                                  pelaksanaan riset litbang daerah.
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={handleOpenCooperationDoc}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-center shadow-xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Buka Dokumen Legalitas</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 3. BERKAS KERJA & DATA LAPANGAN (WORKING DOCUMENTS) */}
                      {(docCategoryFilter === 'ALL' || docCategoryFilter === 'WORKING') && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                              <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                              <span>
                                3. Berkas Kerja & Data Riset Lapangan ({workingDocumentsList.length} Berkas)
                              </span>
                            </h5>
                            <span className="text-3xs text-slate-400">Data Tabulasi Mentah, Transkrip FGD, Laporan Antara</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {workingDocumentsList.map((doc: any) => (
                              <div
                                key={doc.id}
                                className="p-3.5 bg-white border border-slate-200 hover:border-teal-300 rounded-2xl shadow-xs flex flex-col justify-between gap-3 transition"
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-3xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                                      {doc.type}
                                    </span>
                                    <span className="text-3xs font-mono text-slate-400">
                                      {doc.fileSize || '2.4 MB'}
                                    </span>
                                  </div>

                                  <div className="flex items-start gap-2.5">
                                    <div className="p-2 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg shrink-0 mt-0.5">
                                      {doc.type.toLowerCase().includes('tabulasi') ? (
                                        <FileSpreadsheet className="w-4 h-4" />
                                      ) : (
                                        <FileText className="w-4 h-4" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <h6 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                                        {doc.title}
                                      </h6>
                                      <p className="text-3xs text-slate-400 mt-1">
                                        Diunggah: {doc.uploadDate || '2026'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleOpenWorkingDoc(doc)}
                                  className="w-full py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 font-bold rounded-xl text-2xs transition flex items-center justify-center gap-1.5"
                                >
                                  <Eye className="w-3.5 h-3.5 text-teal-700" />
                                  <span>Pratinjau / Unduh</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* ========================================================== */}
                  {/* TAB 3: INTISARI REKOMENDASI KEBIJAKAN (EXECUTIVE BRIEF)     */}
                  {/* ========================================================== */}
                  {activeTab === 'BRIEF' && (
                    <div className="space-y-5">
                      
                      {/* TTE Official Banner */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-950">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-[#0f2c59] text-white rounded-xl shrink-0">
                            <ShieldCheck className="w-5 h-5 text-sky-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-blue-950">
                              Naskah Kebijakan Resmi Ber-TTE Elektronik (BSrE BSSN)
                            </h4>
                            <p className="text-2xs text-blue-800">
                              Disahkan oleh:{' '}
                              <strong>{activeRecommendation?.signedBy?.name || 'Dr. Petrus Renyaan, M.Si (Kepala BRIDA)'}</strong>{' '}
                              pada {activeRecommendation?.signedAt ? new Date(activeRecommendation.signedAt).toLocaleDateString('id-ID') : '01 Maret 2026'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleOpenPolicyBrief}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh Dokumen Policy Brief</span>
                        </button>
                      </div>

                      {/* Metadata Table */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-2xs text-slate-700">
                        <div>
                          <span className="text-slate-500 block">Nomor Registrasi:</span>
                          <strong className="font-mono text-slate-900 text-xs">
                            {activeRecommendation?.code || activeProposal.code}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Bentuk Regulasi Sasaran:</span>
                          <strong className="text-slate-900 text-xs">
                            {activeRecommendation?.targetPolicyType || activeProposal.expectedOutput}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Tingkat Dampak Kebijakan:</span>
                          <strong className="text-slate-900 text-xs">
                            {activeRecommendation?.impactLevel || 'Strategis Daerah Mimika'}
                          </strong>
                        </div>
                      </div>

                      {/* 1. Ringkasan Eksekutif */}
                      <div className="space-y-1">
                        <span className="font-bold text-xs uppercase tracking-wider text-[#0f2c59] block">
                          1. Ringkasan Eksekutif (Executive Summary)
                        </span>
                        <p className="text-xs text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                          {activeRecommendation?.executiveSummary ||
                            activeProposal.problemStatement ||
                            'Kajian kelitbangan ini merumuskan rekomendasi kebijakan komprehensif berbasis temuan empiris dan analisis pemangku kepentingan.'}
                        </p>
                      </div>

                      {/* 2. Latar Belakang */}
                      <div className="space-y-1">
                        <span className="font-bold text-xs uppercase tracking-wider text-[#0f2c59] block">
                          2. Latar Belakang (Background)
                        </span>
                        <p className="text-xs text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                          {activeRecommendation?.background ||
                            'Uraian latar belakang masalah, dasar yuridis, dan urgensi intervensi kebijakan bagi daerah Kabupaten Mimika.'}
                        </p>
                      </div>

                      {/* 3. Rekomendasi Kebijakan */}
                      <div className="space-y-1">
                        <span className="font-bold text-xs uppercase tracking-wider text-[#0f2c59] block">
                          3. Rekomendasi Kebijakan (Policy Recommendations)
                        </span>
                        <p className="text-xs text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                          {activeRecommendation?.policyRecommendations ||
                            '1. Optimalisasi Prosedur Operasional & SOP Layanan Internal OPD.\n2. Penyusunan Draf Peraturan Bupati (Perbup) definitif dan pembentukan Pokja lintas instansi.\n3. Alokasi program prioritas dalam Renja perangkat daerah guna percepatan dampak strategis bagi masyarakat Mimika.'}
                        </p>
                      </div>

                      {/* 4. Kesimpulan */}
                      <div className="space-y-1">
                        <span className="font-bold text-xs uppercase tracking-wider text-[#0f2c59] block">
                          4. Kesimpulan (Conclusion)
                        </span>
                        <p className="text-xs text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                          {activeRecommendation?.conclusion ||
                            'Penerapan rekomendasi ini secara konsisten akan mempercepat pencapaian target pembangunan daerah dan peningkatan kualitas pelayanan publik Kabupaten Mimika.'}
                        </p>
                      </div>

                      {/* Dokumen Terkorelasi */}
                      {activeRecommendation?.correlatedDocs && (
                        <div className="space-y-1 pt-1">
                          <span className="font-bold text-[#0f2c59] uppercase tracking-wider text-xs block">
                            Dokumen Bukti Rujukan Terkorelasi:
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                            {activeRecommendation.correlatedDocs}
                          </p>
                        </div>
                      )}

                      {/* Footer Switch to Form */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div>
                          <h5 className="font-bold text-xs text-slate-900">
                            Siap Menindaklanjuti Pilihan Kebijakan Ini?
                          </h5>
                          <p className="text-3xs text-slate-500">
                            Gunakan alternatif kebijakan di atas untuk melaporkan bentuk adopsi pemanfaatan nyata OPD Anda.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('FORM')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>Buka Formulir Pelaporan</span>
                        </button>
                      </div>

                    </div>
                  )}

                </CardContent>
              </Card>
            ) : null}
          </div>

        </div>
      )}

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

export default function OpdFollowUpPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Memuat modul tindak lanjut...</div>}>
      <FollowUpContent />
    </Suspense>
  );
}
