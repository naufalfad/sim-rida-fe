'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOpdStore, OpdProposal, PolicyRecommendationItem } from '@/store/useOpdStore';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { DocumentViewerModal, DocumentReviewState } from '@/components/ui/document-viewer-modal';
import {
  Award,
  Download,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Calendar,
  Building,
  ArrowRight,
  Search,
  ClipboardCheck,
  FileSpreadsheet,
  FileCheck,
  Sparkles,
  Layers,
  Eye,
  ExternalLink,
  BookOpen,
  Filter
} from 'lucide-react';
import { openOrDownloadFile, downloadFileDirectly } from '@/lib/file-viewer';

interface UnifiedRecommendationView {
  id: string;
  code: string;
  proposalId?: string;
  proposalCode?: string;
  title: string;
  category: string;
  opdName: string;
  problemStatement?: string;
  executiveSummary?: string;
  keyFindings?: string;
  policyActions?: string;
  targetPolicyType?: string;
  impactLevel?: string;
  targetOpdNames?: string;
  signedBy: string;
  signedAt: string;
  isTteVerified: boolean;
  // Documents
  policyBriefDoc: {
    name: string;
    size: string;
    date: string;
    url?: string;
  };
  kakDoc: {
    name: string;
    size: string;
    date: string;
    background?: string;
    objectives?: string;
    scope?: string;
    targetOutput?: string;
    status: string;
    url?: string;
  } | null;
  finalReportDoc: {
    name: string;
    size: string;
    date: string;
    summary?: string;
    url?: string;
  } | null;
  workingDocuments?: Array<{
    id: string;
    title: string;
    type: string;
    fileUrl?: string | null;
    fileSize?: string | null;
    uploadDate?: string;
  }>;
  hasFollowUp: boolean;
  followUpRating?: number;
}

export default function OpdRecommendationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    recommendations,
    fetchRecommendations,
    selectProposal,
    isLoadingRecommendations
  } = useOpdStore();

  const [documentReview, setDocumentReview] = useState<DocumentReviewState | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    fetchRecommendations({ status: 'FINALIZED' });
  }, [fetchRecommendations]);

  // Menampilkan daftar naskah rekomendasi kebijakan resmi yang bersumber langsung dari database
  const unifiedItems = useMemo(() => {
    const list: UnifiedRecommendationView[] = [];
    const seenIds = new Set<string>();

    recommendations.forEach((rec) => {
      if (seenIds.has(rec.id)) return;
      seenIds.add(rec.id);

      const prop = rec.study?.proposal;
      const kak = rec.study?.kakDocument;
      const opdTitle = rec.targetOpdNames || prop?.opd?.name || 'Pemerintah Kabupaten Mimika';
      const formattedDate = rec.signedAt
        ? new Date(rec.signedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date(rec.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

      list.push({
        id: rec.id,
        code: rec.code,
        proposalId: prop?.id,
        proposalCode: prop?.code,
        title: rec.title,
        category: prop?.category || 'Tata Kelola Lingkungan',
        opdName: opdTitle,
        problemStatement: prop?.problemStatement,
        executiveSummary: rec.executiveSummary,
        keyFindings: rec.keyFindings,
        policyActions: rec.policyActions,
        targetPolicyType: rec.targetPolicyType || 'Peraturan Bupati (Perbup)',
        impactLevel: rec.impactLevel || 'Strategis Daerah',
        targetOpdNames: rec.targetOpdNames || undefined,
        signedBy: rec.signedBy?.name || 'Dr. Petrus Renyaan, M.Si (Kepala BRIDA Mimika)',
        signedAt: formattedDate,
        isTteVerified: rec.status === 'FINALIZED',
        policyBriefDoc: {
          name: `Policy_Brief_${rec.code}.pdf`,
          size: '3.8 MB',
          date: formattedDate,
          url: rec.documentUrl || undefined,
        },
        kakDoc: kak ? {
          name: rec.study?.finalReportName?.toLowerCase().includes('kak')
            ? rec.study.finalReportName
            : `KAK_${rec.study?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'Penelitian'}.pdf`,
          size: '2.4 MB',
          date: kak.finalizedAt ? new Date(kak.finalizedAt).toLocaleDateString('id-ID') : formattedDate,
          background: kak.background,
          objectives: kak.objectives,
          scope: kak.scopeAndMethodology,
          targetOutput: kak.targetOutput,
          status: kak.status || 'FINAL',
          url: rec.study?.finalReportName?.toLowerCase().includes('kak') ? (rec.study?.finalReportUrl || undefined) : undefined,
        } : null,
        finalReportDoc: rec.study ? {
          name: rec.study.finalReportName || `Laporan_Akhir_${rec.study.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'Riset'}.pdf`,
          size: '5.2 MB',
          date: formattedDate,
          summary: rec.study.finalReportSummary || undefined,
          url: rec.study.finalReportUrl || undefined,
        } : null,
        workingDocuments: rec.study?.workingDocuments || [],
        hasFollowUp: !!prop?.followUp,
        followUpRating: prop?.followUp?.satisfactionRating,
      });
    });

    return list;
  }, [recommendations]);

  const filteredItems = useMemo(() => {
    return unifiedItems.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        (item.proposalCode && item.proposalCode.toLowerCase().includes(search.toLowerCase())) ||
        item.opdName.toLowerCase().includes(search.toLowerCase());

      const matchCat = categoryFilter === 'ALL' || item.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [unifiedItems, search, categoryFilter]);

  // Handlers for opening the 3 documents in viewer
  const handleOpenPolicyBrief = (item: UnifiedRecommendationView) => {
    setDocumentReview({
      name: item.policyBriefDoc.name,
      type: 'POLICY_BRIEF',
      proposalCode: item.code,
      proposalTitle: item.title,
      opdName: item.opdName,
      uploadDate: item.signedAt,
      size: item.policyBriefDoc.size,
      url: item.policyBriefDoc.url,
      executiveSummary: item.executiveSummary,
      keyFindings: item.keyFindings,
      policyActions: item.policyActions,
      targetPolicyType: item.targetPolicyType,
      impactLevel: item.impactLevel,
      targetOpdNames: item.targetOpdNames,
      signedBy: item.signedBy,
      signedAt: item.signedAt,
    });
  };

  const handleOpenKak = (item: UnifiedRecommendationView) => {
    const kak = item.kakDoc;
    setDocumentReview({
      name: kak?.name || `KAK_${item.code}.pdf`,
      type: 'KAK_TOR',
      proposalCode: item.proposalCode || item.code,
      proposalTitle: `Kerangka Acuan Kerja (KAK): ${item.title}`,
      opdName: item.opdName,
      uploadDate: kak?.date || item.signedAt,
      size: kak?.size || '2.4 MB',
      url: kak?.url,
      kakBackground: kak?.background || item.problemStatement,
      kakObjectives: kak?.objectives,
      kakScope: kak?.scope,
      kakTargetOutput: kak?.targetOutput,
      kakStatus: kak?.status || 'FINAL',
      problemStatement: item.problemStatement,
    });
  };

  const handleOpenFinalReport = (item: UnifiedRecommendationView) => {
    const report = item.finalReportDoc;
    setDocumentReview({
      name: report?.name || `Laporan_Akhir_${item.code}.pdf`,
      type: 'LAPORAN_AKHIR',
      proposalCode: item.proposalCode || item.code,
      proposalTitle: `Laporan Akhir Penelitian: ${item.title}`,
      opdName: item.opdName,
      uploadDate: report?.date || item.signedAt,
      size: report?.size || '5.2 MB',
      finalReportSummary: report?.summary,
      url: report?.url,
      kakScope: item.kakDoc?.scope,
      policyActions: item.policyActions,
      executiveSummary: item.executiveSummary,
    });
  };

  const handleDirectDownload = (doc: { name: string; url?: string; size?: string }, type: string) => {
    downloadFileDirectly({
      name: doc.name,
      url: doc.url,
      size: doc.size,
    });
    toast(`Mengunduh berkas resmi [${type}]: "${doc.name}"...`, 'success');
  };

  const handleGoToFollowUp = (item: UnifiedRecommendationView) => {
    if (item.proposalId) {
      selectProposal(item.proposalId);
      router.push(`/opd/follow-up?proposalId=${item.proposalId}`);
    } else {
      router.push('/opd/follow-up');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      <PageHeader
        title="Gudang Rekomendasi Kebijakan (Output & Repository)"
        description="Repositori resmi hasil riset BRIDA Kabupaten Mimika: Naskah Policy Brief, Kerangka Acuan Kerja (KAK), dan Laporan Akhir Penelitian yang telah disahkan dan siap ditindaklanjuti oleh OPD."
      />

      {/* Summary Highlight Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-blue-900 text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#0f2c59] text-white rounded-lg shadow-xs shrink-0">
            <ShieldCheck className="h-6 w-6 text-sky-400" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-bold text-sm text-blue-950">
              Dokumen Sah Bersertifikasi TTE Elektronik (BSrE BSSN)
            </h4>
            <p className="text-2xs text-blue-800">
              Seluruh naskah rekomendasi, KAK, dan laporan akhir yang disahkan di bawah ini sah secara hukum untuk dijadikan rujukan penyusunan Renja, Perbup/Perda, maupun SOP teknis instansi Anda.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <span className="px-3 py-1 bg-blue-600 text-white rounded-full font-bold text-2xs shadow-xs">
            {unifiedItems.length} Riset Disahkan
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari naskah kebijakan, KAK, atau topik riset..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 text-2xs font-semibold text-slate-600 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="shrink-0">Kategori:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto p-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="Kesehatan">Kesehatan</option>
            <option value="Pendidikan">Pendidikan</option>
            <option value="Infrastruktur & Teknologi">Infrastruktur & Teknologi</option>
            <option value="Ekonomi">Ekonomi</option>
            <option value="Tata Kelola Lingkungan">Tata Kelola Lingkungan</option>
          </select>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 space-y-3 border border-slate-200 bg-white rounded-xl shadow-xs">
          <Award className="h-10 w-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-xs text-slate-800">Belum Ada Rekomendasi Selesai</h4>
          <p className="text-2xs text-slate-500 max-w-md mx-auto">
            Usulan yang diajukan saat ini masih dalam proses penelaahan atau pelaksanaan riset oleh tim BRIDA. Dokumen Policy Brief, KAK, dan Laporan Akhir akan otomatis tampil di sini setelah disahkan resmi dengan TTE.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="border border-slate-200 bg-white rounded-xl shadow-xs hover:shadow-md transition-shadow overflow-hidden">
              
              {/* Card Top Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-3xs font-extrabold text-blue-900 bg-blue-100/70 px-2.5 py-0.5 rounded-md border border-blue-200">
                        {item.code}
                      </span>
                      {item.proposalCode && (
                        <span className="font-mono text-3xs font-semibold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded">
                          Ref Usulan: {item.proposalCode}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        TTE TERVERIFIKASI (BSrE BSSN)
                      </span>
                      <span className="text-3xs text-slate-500 font-medium">
                        Kategori: <strong className="text-slate-700">{item.category}</strong>
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-[#0f2c59] leading-snug">
                      {item.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-2xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>OPD Sasaran: <strong className="text-slate-800">{item.opdName}</strong></span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Disahkan: <strong className="text-slate-800">{item.signedAt}</strong></span>
                      </span>
                      <span>
                        Penandatangan: <strong className="text-blue-900">{item.signedBy}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Top Right Action */}
                  <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto self-stretch sm:self-start lg:self-center">
                    <button
                      onClick={() => handleGoToFollowUp(item)}
                      className="w-full sm:w-auto px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>Tindak Lanjut Rekomendasi</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Body: Tri-Dokumen Hub */}
              <CardContent className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                
                {/* Executive Summary Excerpt */}
                {item.executiveSummary && (
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-700 space-y-1">
                    <span className="font-bold text-3xs uppercase tracking-wider text-[#0f2c59] block">
                      Ringkasan Eksekutif Rekomendasi Kebijakan:
                    </span>
                    <p className="line-clamp-2 leading-relaxed text-2xs text-slate-600">
                      {item.executiveSummary}
                    </p>
                  </div>
                )}

                {/* Section Title */}
                <div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>Dokumen Luaran Riset untuk Tindak Lanjut OPD (3 Dokumen Lengkap):</span>
                  </h4>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    Pihak OPD dapat meninjau isi lengkap di peramban atau mengunduh dokumen resmi sebagai landasan Renja/SOP:
                  </p>
                </div>

                {/* 3 Document Cards Grid */}
                <div className="grid gap-3.5 md:grid-cols-3">
                  
                  {/* DOKUMEN 1: POLICY BRIEF */}
                  <div className="p-4 bg-purple-50/50 border border-purple-200/80 rounded-xl space-y-3 flex flex-col justify-between hover:bg-purple-50 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                          <FileText className="w-4 h-4" />
                        </span>
                        <span className="px-2 py-0.5 bg-purple-200/80 text-purple-900 font-bold text-3xs rounded-full">
                          DOKUMEN 1
                        </span>
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-purple-950">Naskah Policy Brief</h5>
                        <p className="text-3xs text-purple-800 leading-snug mt-0.5">
                          Rekomendasi tindakan, temuan kunci & opsi regulasi ({item.targetPolicyType || 'Perbup'}).
                        </p>
                      </div>
                      <div className="text-3xs text-slate-500 font-mono">
                        {item.policyBriefDoc.name} • {item.policyBriefDoc.size}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2 border-t border-purple-200/60">
                      <button
                        type="button"
                        onClick={() => handleOpenPolicyBrief(item)}
                        className="flex-1 py-1.5 px-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-2xs font-bold transition flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Buka Naskah</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDirectDownload(item.policyBriefDoc, 'Policy Brief');
                        }}
                        className="p-1.5 bg-white hover:bg-purple-100 text-purple-700 rounded-lg text-2xs transition border border-purple-300 cursor-pointer"
                        title="Unduh Naskah Policy Brief"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* DOKUMEN 2: KERANGKA ACUAN KERJA (KAK) */}
                  <div className="p-4 bg-blue-50/50 border border-blue-200/80 rounded-xl space-y-3 flex flex-col justify-between hover:bg-blue-50 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                          <Layers className="w-4 h-4" />
                        </span>
                        <span className="px-2 py-0.5 bg-blue-200/80 text-blue-900 font-bold text-3xs rounded-full">
                          DOKUMEN 2
                        </span>
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-blue-950">Kerangka Acuan Kerja (KAK)</h5>
                        <p className="text-3xs text-blue-800 leading-snug mt-0.5">
                          Landasan hukum, ruang lingkup wilayah, metodologi & target luaran riset.
                        </p>
                      </div>
                      <div className="text-3xs text-slate-500 font-mono">
                        {item.kakDoc?.name || `KAK_${item.code}.pdf`} • {item.kakDoc?.size || '2.4 MB'}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2 border-t border-blue-200/60">
                      <button
                        type="button"
                        onClick={() => handleOpenKak(item)}
                        className="flex-1 py-1.5 px-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-2xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Buka KAK</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDirectDownload({
                            name: item.kakDoc?.name || `KAK_${item.code}.pdf`,
                            url: item.kakDoc?.url,
                            size: item.kakDoc?.size,
                          }, 'KAK');
                        }}
                        className="p-1.5 bg-white hover:bg-blue-100 text-blue-700 rounded-lg text-2xs transition border border-blue-300 cursor-pointer"
                        title="Unduh Dokumen KAK"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* DOKUMEN 3: LAPORAN AKHIR PENELITIAN */}
                  <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-3 flex flex-col justify-between hover:bg-amber-50 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                          <FileCheck className="w-4 h-4" />
                        </span>
                        <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 font-bold text-3xs rounded-full">
                          DOKUMEN 3
                        </span>
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-amber-950">Laporan Akhir Penelitian</h5>
                        <p className="text-3xs text-amber-800 leading-snug mt-0.5">
                          Laporan komprehensif olah data lapangan, bukti empiris & hasil kajian saintifik.
                        </p>
                      </div>
                      <div className="text-3xs text-slate-500 font-mono">
                        {item.finalReportDoc?.name || `Laporan_Akhir_${item.code}.pdf`} • {item.finalReportDoc?.size || '5.2 MB'}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2 border-t border-amber-200/60">
                      <button
                        type="button"
                        onClick={() => handleOpenFinalReport(item)}
                        className="flex-1 py-1.5 px-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-2xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Buka Laporan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDirectDownload({
                            name: item.finalReportDoc?.name || `Laporan_Akhir_${item.code}.pdf`,
                            url: item.finalReportDoc?.url,
                            size: item.finalReportDoc?.size,
                          }, 'Laporan Akhir');
                        }}
                        className="p-1.5 bg-white hover:bg-amber-100 text-amber-800 rounded-lg text-2xs transition border border-amber-300 cursor-pointer"
                        title="Unduh Laporan Akhir"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>

                {/* Working Documents / Lampiran Tambahan (e.g. HPS, Tabulasi) */}
                {item.workingDocuments && item.workingDocuments.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-3xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Berkas Lampiran & Dokumen Kerja Tambahan ({item.workingDocuments.length}):</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {item.workingDocuments.map((wDoc) => (
                        <div
                          key={wDoc.id}
                          className="px-3 py-1.5 bg-emerald-50/70 hover:bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-xl text-3xs font-semibold flex items-center gap-2 transition shadow-2xs"
                        >
                          <span className="truncate max-w-xs">{wDoc.title}</span>
                          <span className="text-emerald-700 font-mono text-4xs bg-emerald-100/80 px-1.5 py-0.5 rounded">
                            {wDoc.fileSize || 'Berkas'}
                          </span>
                          <div className="flex items-center gap-1 ml-1 border-l border-emerald-200 pl-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setDocumentReview({
                                  name: wDoc.title.includes('.') ? wDoc.title : `${wDoc.title}.xlsx`,
                                  type: 'WORKING_DOC',
                                  proposalCode: item.code,
                                  proposalTitle: item.title,
                                  opdName: item.opdName,
                                  uploadDate: wDoc.uploadDate,
                                  size: wDoc.fileSize || 'Berkas',
                                  url: wDoc.fileUrl || undefined,
                                });
                              }}
                              className="p-1 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-200/60 rounded transition cursor-pointer"
                              title="Lihat & Telaah Dokumen Kerja"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleDirectDownload({
                                  name: wDoc.title.includes('.') ? wDoc.title : `${wDoc.title}.xlsx`,
                                  url: wDoc.fileUrl || undefined,
                                  size: wDoc.fileSize || 'Berkas',
                                }, 'Berkas Kerja');
                              }}
                              className="p-1 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-200/60 rounded transition cursor-pointer"
                              title="Unduh Berkas Kerja"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card Footer: Status Laporan Pemanfaatan */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-2xs">
                  {item.hasFollowUp ? (
                    <div className="flex items-center gap-2 text-emerald-800 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Laporan Tindak Lanjut Pemanfaatan Telah Dilaporkan ke BRIDA</span>
                      {item.followUpRating && (
                        <span className="text-3xs bg-white px-2 py-0.5 rounded font-bold border border-emerald-300 text-emerald-900">
                          Rating Kepuasan: ★ {item.followUpRating}/5
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      <span>Belum ada laporan tindak lanjut pemanfaatan dari OPD Anda.</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleGoToFollowUp(item)}
                    className="font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 self-end sm:self-center"
                  >
                    <span>{item.hasFollowUp ? 'Lihat / Edit Tindak Lanjut' : 'Isi Tindak Lanjut Pemanfaatan'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </CardContent>
            </Card>
          ))}
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
