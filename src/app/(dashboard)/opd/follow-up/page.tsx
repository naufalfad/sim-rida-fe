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
  BookOpen
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

  useEffect(() => {
    fetchProposals();
    fetchRecommendations({ status: 'FINALIZED' });
  }, [fetchProposals, fetchRecommendations]);

  useEffect(() => {
    if (proposalIdParam) {
      selectProposal(proposalIdParam);
    }
  }, [proposalIdParam, selectProposal]);

  // Completed proposals that have recommendations
  const completedProposals = useMemo(() => {
    return proposals.filter((p) => p.status === 'COMPLETED' || p.recommendationDoc || p.followUpReport);
  }, [proposals]);

  const activeProposal = useMemo(() => {
    if (selectedProposalId) {
      const found = completedProposals.find((p) => p.id === selectedProposalId);
      if (found) return found;
    }
    return completedProposals[0];
  }, [completedProposals, selectedProposalId]);

  // Form states
  const [utilizationType, setUtilizationType] = useState<'Rencana Kerja (Renja)' | 'Revisi / Pembuatan SOP' | 'Penyusunan Ranperda' | 'Implementasi Teknis'>('Rencana Kerja (Renja)');
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
    return recommendations.find(r => r.study?.proposal?.id === activeProposal.id || r.studyId === activeProposal.researchStudy?.id)
      || activeProposal.researchStudy?.policyRecommendations?.[0];
  }, [activeProposal, recommendations]);

  const activeKak = useMemo(() => {
    return activeRecommendation?.study?.kakDocument || activeProposal?.researchStudy?.kakDocument;
  }, [activeRecommendation, activeProposal]);

  const activeStudy = useMemo(() => {
    return activeRecommendation?.study || activeProposal?.researchStudy;
  }, [activeRecommendation, activeProposal]);

  // Handlers for opening the 3 research documents
  const handleOpenPolicyBrief = () => {
    if (!activeProposal) return;
    setDocumentReview({
      name: `Policy_Brief_${activeRecommendation?.code || activeProposal.code}.pdf`,
      type: 'POLICY_BRIEF',
      proposalCode: activeRecommendation?.code || activeProposal.code,
      proposalTitle: activeRecommendation?.title || activeProposal.title,
      opdName: activeProposal.opdName,
      uploadDate: activeRecommendation?.signedAt ? new Date(activeRecommendation.signedAt).toLocaleDateString('id-ID') : '01 Mar 2026',
      size: '3.8 MB',
      executiveSummary: activeRecommendation?.executiveSummary,
      keyFindings: activeRecommendation?.keyFindings,
      policyActions: activeRecommendation?.policyActions,
      targetPolicyType: activeRecommendation?.targetPolicyType || activeProposal.expectedOutput,
      impactLevel: activeRecommendation?.impactLevel || 'Strategis Daerah',
      targetOpdNames: activeRecommendation?.targetOpdNames || activeProposal.opdName,
      signedBy: activeRecommendation?.signedBy?.name || 'Dr. Petrus Renyaan, M.Si (Kepala BRIDA)',
      signedAt: activeRecommendation?.signedAt ? new Date(activeRecommendation.signedAt).toLocaleDateString('id-ID') : '01 Mar 2026',
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
      url: isKakUploaded ? (activeStudy?.finalReportUrl || undefined) : undefined,
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
      finalReportSummary: activeStudy?.finalReportSummary || 'Laporan akhir merangkum seluruh temuan data primer, metodologi riset, analisis statistik, serta implikasi kebijakan strategis.',
      url: activeStudy?.finalReportUrl,
      kakScope: activeKak?.scopeAndMethodology,
      policyActions: activeRecommendation?.policyActions,
      executiveSummary: activeRecommendation?.executiveSummary,
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

      toast('Laporan pemanfaatan & rating kepuasan berhasil disimpan dan dikirimkan ke BRIDA.', 'success');
      await fetchProposals();
    } catch (err: any) {
      toast('Gagal mengirimkan laporan: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      <PageHeader
        title="Modul Tindak Lanjut & Feedback Pemanfaatan"
        description="Laporkan pemanfaatan nyata rekomendasi kebijakan yang telah diterbitkan BRIDA serta berikan evaluasi kepuasan layanan litbang daerah."
      />

      {completedProposals.length === 0 ? (
        <Card className="p-6 sm:p-12 text-center text-slate-400 space-y-3 border border-slate-200 bg-white rounded-xl shadow-xs">
          <Award className="h-10 w-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-xs text-slate-800">Belum Ada Rekomendasi Selesai yang Perlu Dilaporkan</h4>
          <p className="text-2xs text-slate-500 max-w-md mx-auto">
            Formulir tindak lanjut wajib diisi setelah usulan penelitian selesai dan dokumen Policy Brief / Naskah Akademik resmi diterbitkan oleh BRIDA.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* ================= LEFT LIST REKOMENDASI (5 cols) ================= */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="shadow-xs border border-slate-200 bg-white rounded-xl overflow-hidden">
              <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Award className="h-4 w-4 text-blue-600" />
                  <span>Rekomendasi Kebijakan Selesai ({completedProposals.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-slate-100">
                {completedProposals.map((item) => {
                  const isSelected = activeProposal?.id === item.id;
                  const isReported = !!item.followUpReport;

                  return (
                    <div
                      key={item.id}
                      onClick={() => selectProposal(item.id)}
                      className={`p-3.5 sm:p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50/80 border-l-4 border-l-blue-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-3xs font-extrabold text-slate-500">
                            {item.code}
                          </span>
                          {isReported ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              SUDAH DILAPORKAN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="h-3 w-3 text-amber-600" />
                              WAJIB DIISI
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                          {item.recommendationDoc?.title || item.title}
                        </h4>

                        <div className="flex items-center justify-between text-3xs text-slate-500 pt-1">
                          <span className="font-semibold text-blue-900">
                            {item.recommendationDoc?.type || item.expectedOutput}
                          </span>
                          <span>{item.recommendationDoc?.date || '01 Mar 2026'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* ================= RIGHT FORM TINDAK LANJUT (7 cols) ================= */}
          <div className="lg:col-span-7 space-y-6">
            {activeProposal ? (
              <Card className="border border-slate-200 bg-white rounded-xl shadow-xs overflow-hidden">
                
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-3xs font-extrabold text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded border border-blue-200">
                        {activeProposal.code}
                      </span>
                      <span className="text-3xs text-slate-500 font-medium">
                        Kategori: <strong>{activeProposal.category}</strong>
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#0f2c59] leading-snug">
                      Formulir Laporan Pemanfaatan & Evaluasi Kepuasan
                    </h3>
                    <p className="text-2xs text-slate-500">
                      Rujukan Usulan: &ldquo;{activeProposal.title}&rdquo;
                    </p>
                  </div>
                </div>

                <CardContent className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                  
                  {/* DOKUMEN RUJUKAN QUICK ACCESS BAR */}
                  <div className="p-3.5 sm:p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span>Berkas Rujukan Hasil Riset (Tri-Dokumen):</span>
                      </div>
                      <span className="text-3xs text-slate-500">Klik untuk membaca saat mengisi</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Button Policy Brief */}
                      <button
                        type="button"
                        onClick={handleOpenPolicyBrief}
                        className="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 rounded-lg text-left transition flex items-center justify-between group"
                      >
                        <div className="min-w-0 pr-1">
                          <span className="text-3xs text-purple-700 font-bold block uppercase">Dokumen 1</span>
                          <span className="text-2xs font-bold truncate block">Policy Brief</span>
                        </div>
                        <Eye className="w-4 h-4 text-purple-600 shrink-0 group-hover:scale-110 transition-transform" />
                      </button>

                      {/* Button KAK */}
                      <button
                        type="button"
                        onClick={handleOpenKak}
                        className="p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 rounded-lg text-left transition flex items-center justify-between group"
                      >
                        <div className="min-w-0 pr-1">
                          <span className="text-3xs text-blue-700 font-bold block uppercase">Dokumen 2</span>
                          <span className="text-2xs font-bold truncate block">KAK Riset</span>
                        </div>
                        <Eye className="w-4 h-4 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                      </button>

                      {/* Button Laporan Akhir */}
                      <button
                        type="button"
                        onClick={handleOpenFinalReport}
                        className="p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-lg text-left transition flex items-center justify-between group"
                      >
                        <div className="min-w-0 pr-1">
                          <span className="text-3xs text-amber-700 font-bold block uppercase">Dokumen 3</span>
                          <span className="text-2xs font-bold truncate block">Laporan Akhir</span>
                        </div>
                        <Eye className="w-4 h-4 text-amber-600 shrink-0 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* FORM */}
                  <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                    
                    {/* 1. Bentuk Pemanfaatan */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-800 flex items-center gap-1">
                        <span>1. Bentuk Pemanfaatan Rekomendasi oleh OPD</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={utilizationType}
                        onChange={(e) => setUtilizationType(e.target.value as any)}
                        className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white font-medium text-slate-800 focus:outline-hidden"
                      >
                        <option value="Rencana Kerja (Renja)">Diadopsi ke dalam Rencana Kerja (Renja) / RKPD Tahun Depan</option>
                        <option value="Revisi / Pembuatan SOP">Digunakan sebagai dasar Revisi / Pembuatan Standar Operasional Prosedur (SOP)</option>
                        <option value="Penyusunan Ranperda">Dijadikan Naskah Akademik Penyusunan Perda / Perbup</option>
                        <option value="Implementasi Teknis">Aplikasi Teknis / Penerapan Langsung di Lapangan</option>
                      </select>
                    </div>

                    {/* 2. Rincian Pemanfaatan */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-800 flex items-center gap-1">
                        <span>2. Rincian & Deskripsi Pemanfaatan Nyata di Lapangan</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Contoh: Berdasarkan temuan Policy Brief dan Laporan Akhir, program monitoring retribusi telah dimasukkan ke dalam Renja DLH 2027 pada pos pengadaan sarana IT dan sosialisasi di distrik..."
                        value={utilizationSummary}
                        onChange={(e) => setUtilizationSummary(e.target.value)}
                        className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white leading-relaxed font-medium text-slate-800 focus:outline-hidden"
                      />
                    </div>

                    {/* 3. Rating Kepuasan Layanan */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-800">
                          <span>3. Rating Kepuasan Terhadap Layanan & Hasil Riset BRIDA</span>
                        </label>
                        <span className="text-xs font-black text-blue-900">
                          {satisfactionRating} / 5 Bintang
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setSatisfactionRating(star)}
                            className="p-1 text-blue-600 hover:scale-125 transition-transform"
                          >
                            <Star
                              className={`h-6 w-6 sm:h-7 sm:w-7 ${
                                star <= satisfactionRating
                                  ? 'fill-blue-600 text-blue-600'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 4. Saran & Masukan */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-800">
                        <span>4. Catatan Kualitatif / Masukan untuk BRIDA (Opsional)</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Tuliskan masukan mengenai kualitas data, kecepatan respon tim peneliti BRIDA, atau usulan topik lanjutan..."
                        value={feedbackNotes}
                        onChange={(e) => setFeedbackNotes(e.target.value)}
                        className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white leading-relaxed font-medium text-slate-800 focus:outline-hidden"
                      />
                    </div>

                    {/* Submit button */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                        <span>{activeProposal.followUpReport ? 'Perbarui Laporan Pemanfaatan' : 'Kirim Laporan Pemanfaatan'}</span>
                      </button>
                    </div>

                  </form>
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
