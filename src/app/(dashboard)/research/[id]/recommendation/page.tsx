'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRecommendationStore } from '@/store/useRecommendationStore';
import { useReportStore } from '@/store/useReportStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { MOCK_OPDS } from '@/mock/opd';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  AlertTriangle,
  History,
  Clock,
  Send,
  Eye,
  Check,
  X,
  FileText,
  UserCheck,
  Workflow,
  Compass
} from 'lucide-react';

export default function RecommendationOverviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { researchRecords } = useResearchStore();
  const { getReport, getFindings, getPolicyBrief } = useReportStore();
  const {
    getRecommendation,
    getActivities,
    submitRecommendationForReview,
    publishRecommendation
  } = useRecommendationStore();

  const id = params?.id || '';
  const isBrida = user?.role === 'BRIDA';
  const isKepalaBrida = user?.role === 'KEPALA_BRIDA';

  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);

  // Find target research record
  const record = useMemo(() => {
    return researchRecords.find((r) => r.id === id);
  }, [researchRecords, id]);

  const report = getReport(id);
  const findings = getFindings(id);
  const brief = getPolicyBrief(id);
  const rec = getRecommendation(id);
  const activities = getActivities(id);

  // Resolve Recipient OPD names
  const primaryOpdName = useMemo(() => {
    const opd = MOCK_OPDS.find(o => o.id === rec.primaryRecipientId);
    return opd ? opd.name : '-';
  }, [rec.primaryRecipientId]);

  const supportingOpdNames = useMemo(() => {
    return rec.supportingRecipientIds.map(sId => {
      const opd = MOCK_OPDS.find(o => o.id === sId);
      return opd ? opd.name : '';
    }).filter(Boolean);
  }, [rec.supportingRecipientIds]);

  // Stepper workflow: RESEARCH COMPLETED ➔ REPORT APPROVED ➔ POLICY BRIEF APPROVED ➔ RECOMMENDATION DRAFT ➔ REVIEW KEPALA BRIDA ➔ APPROVED ➔ PUBLISHED ➔ RECEIVED BY OPD
  const stepperStates = useMemo(() => {
    const states = {
      completed: 'completed',
      reportApproved: 'completed',
      briefApproved: 'completed',
      draft: 'future',
      review: 'future',
      approved: 'future',
      published: 'future',
    };

    if (rec.status !== 'NOT_STARTED') {
      states.draft = rec.status === 'PUBLISHED' || rec.status === 'APPROVED' ? 'completed' : 'active';
    }
    if (rec.status === 'UNDER_REVIEW') {
      states.draft = 'completed';
      states.review = 'active';
    }
    if (rec.status === 'APPROVED') {
      states.draft = 'completed';
      states.review = 'completed';
      states.approved = 'completed';
      states.published = 'active';
    }
    if (rec.status === 'PUBLISHED') {
      states.draft = 'completed';
      states.review = 'completed';
      states.approved = 'completed';
      states.published = 'completed';
    }

    return states;
  }, [rec]);

  // Validation checklists (Section 20)
  const validation = useMemo(() => {
    const errors: string[] = [];

    if (!rec.title.trim()) {
      errors.push('Judul rekomendasi belum ditentukan');
    }
    if (!rec.problemStatement.trim()) {
      errors.push('Deskripsi fokus permasalahan (Problem Statement) belum diisi');
    }
    if (rec.researchBasis.length === 0) {
      errors.push('Dasar referensi penelitian (Research Basis) belum dicentang');
    }
    if (rec.findingIds.length === 0) {
      errors.push('Belum menautkan minimal 1 Temuan Riset (Research Finding)');
    }
    if (!rec.recommendationDescription.trim()) {
      errors.push('Isi usulan rekomendasi (Recommendation Description) belum diisi');
    }
    if (!rec.expectedPolicyImpact.trim()) {
      errors.push('Dampak kebijakan publik yang diharapkan belum diisi');
    }
    if (!rec.primaryRecipientId) {
      errors.push('Belum menentukan Perangkat Daerah (OPD) penerima utama');
    }

    const isValid = errors.length === 0;

    return { isValid, errors };
  }, [rec]);

  // Recommendation Completeness indicator score (Section 40)
  const completenessScore = useMemo(() => {
    let score = 0;
    if (rec.researchBasis.length > 0) score++;
    if (rec.findingIds.length > 0) score++;
    if (rec.problemStatement.trim()) score++;
    if (rec.primaryRecipientId) score++;
    if (rec.expectedPolicyImpact.trim()) score++;
    if (rec.supportingEvidence.length > 0) score++;
    return score;
  }, [rec]);

  const handleConfirmSubmit = () => {
    submitRecommendationForReview(id, user?.name || 'BRIDA Litbang');
    setIsSubmitOpen(false);
    toast('Draf rekomendasi dikirim ke Kepala BRIDA untuk ditinjau.', 'success');
  };

  const handleConfirmPublish = () => {
    publishRecommendation(id, user?.name || 'Kepala BRIDA');
    setIsPublishOpen(false);
    toast('Rekomendasi resmi diterbitkan kepada Perangkat Daerah terkait.', 'success');
  };

  const getPriorityBadgeClass = (prio: string) => {
    switch (prio) {
      case 'STRATEGIC':
        return 'bg-purple-50 text-purple-750 border-purple-250';
      case 'HIGH':
        return 'bg-rose-50 text-rose-700 border-rose-250';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-250';
      default:
        return 'bg-slate-50 text-slate-550 border-slate-200';
    }
  };

  if (!record) {
    return (
      <div className="space-y-6 text-center py-12 font-sans">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Rekod Penelitian Tidak Ditemukan</h2>
        <button
          onClick={() => router.push('/research')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push(`/research/${id}`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Detail Penelitian</span>
        </button>
      </div>

      <PageHeader
        title="Research Recommendation"
        description="Penyusunan rekomendasi BRIDA terarah kepada perangkat daerah teknis berdasarkan anomali kualitatif riset."
        action={
          <div className="flex gap-2">
            {isKepalaBrida && rec.status === 'UNDER_REVIEW' && (
              <button
                onClick={() => router.push(`/research/${record.id}/recommendation/review`)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all shadow"
              >
                Review & Verifikasi
              </button>
            )}

            {isKepalaBrida && rec.status === 'APPROVED' && (
              <button
                onClick={() => setIsPublishOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-650 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all shadow"
              >
                Publish Recommendation
              </button>
            )}
          </div>
        }
      />

      {/* Stepper workflow (Section 7) */}
      <Card>
        <CardContent className="p-4 overflow-x-auto">
          <div className="flex justify-between items-center gap-4 text-xs font-bold min-w-[850px] select-none">
            
            <div className="flex items-center gap-1">
              <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-355 flex items-center justify-center text-[10px]">✓</span>
              <span className="text-emerald-700 text-[10px]">COMPLETED</span>
            </div>
            <div className="h-px bg-gray-200 dark:bg-gray-800 grow" />
            
            <div className="flex items-center gap-1 text-[10px]">
              <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-355 flex items-center justify-center text-[10px]">✓</span>
              <span className="text-emerald-700">REPORT APPROVED</span>
            </div>
            <div className="h-px bg-gray-200 dark:bg-gray-800 grow" />

            {/* DRAFT */}
            <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
              {stepperStates.draft === 'completed' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-355 flex items-center justify-center text-[10px]">✓</span>
              ) : stepperStates.draft === 'active' ? (
                <span className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-750 border border-indigo-650 flex items-center justify-center text-[10px] animate-pulse">●</span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={stepperStates.draft === 'completed' ? 'text-emerald-700' : stepperStates.draft === 'active' ? 'text-indigo-755' : 'text-gray-400'}>
                REC DRAFT
              </span>
            </div>
            <div className="h-px bg-gray-200 dark:bg-gray-800 grow" />

            {/* REVIEW */}
            <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
              {stepperStates.review === 'completed' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-355 flex items-center justify-center text-[10px]">✓</span>
              ) : stepperStates.review === 'active' ? (
                <span className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-755 border border-indigo-650 flex items-center justify-center text-[10px] animate-pulse">●</span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={stepperStates.review === 'completed' ? 'text-emerald-700' : stepperStates.review === 'active' ? 'text-indigo-755' : 'text-gray-400'}>
                REVIEW KEPALA
              </span>
            </div>
            <div className="h-px bg-gray-200 dark:bg-gray-800 grow" />

            {/* APPROVED */}
            <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
              {stepperStates.approved === 'completed' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-355 flex items-center justify-center text-[10px]">✓</span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={stepperStates.approved === 'completed' ? 'text-emerald-700' : 'text-gray-400'}>
                APPROVED
              </span>
            </div>
            <div className="h-px bg-gray-200 dark:bg-gray-800 grow" />

            {/* PUBLISHED */}
            <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
              {stepperStates.published === 'completed' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-355 flex items-center justify-center text-[10px]">✓</span>
              ) : stepperStates.published === 'active' ? (
                <span className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-750 border border-indigo-650 flex items-center justify-center text-[10px] animate-pulse">●</span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={stepperStates.published === 'completed' ? 'text-emerald-700' : stepperStates.published === 'active' ? 'text-indigo-755' : 'text-gray-400'}>
                PUBLISHED
              </span>
            </div>

          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* ================= LEFT SECTION (Traceability & Details) ================= */}
        <div className="md:col-span-2 space-y-6 text-xs font-semibold">
          
          {/* Main overview metrics summary panels */}
          <div className="grid gap-4 sm:grid-cols-3 select-none">
            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Rekomendasi Status</span>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold border ${
                  rec.status === 'PUBLISHED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-350'
                    : rec.status === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                    : 'bg-gray-100 text-gray-650'
                }`}>
                  {rec.status === 'NOT_STARTED' ? 'NOT STARTED' : `v${rec.version} • ${rec.status}`}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-gray-400 block font-bold text-[8px] uppercase">OPD Penerima Utama</span>
                <span className="text-gray-800 dark:text-gray-250 block text-[11px] truncate">{primaryOpdName}</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Priority Level</span>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold border ${getPriorityBadgeClass(rec.priority)}`}>
                  {rec.priority}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Traceability workflow representation (Section 38 & 39) */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Workflow className="h-4 w-4 text-indigo-650" />
                <span>Alur Penelusuran Sumber Masalah (Recommendation Traceability)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 font-sans">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-3xs font-bold select-none text-center">
                
                <div className="p-3 border rounded bg-gray-50/50 grow flex flex-col justify-center gap-0.5">
                  <span className="text-[7px] text-gray-400 uppercase">1. Research</span>
                  <span className="text-slate-800 truncate max-w-28 mx-auto">{record.id}</span>
                </div>
                
                <span className="self-center text-gray-400">➔</span>

                <div className="p-3 border rounded bg-gray-50/50 grow flex flex-col justify-center gap-0.5">
                  <span className="text-[7px] text-gray-400 uppercase">2. Report</span>
                  <span className="text-slate-800 truncate max-w-28 mx-auto">v{report.version} • {report.status}</span>
                </div>

                <span className="self-center text-gray-400">➔</span>

                <div className="p-3 border rounded bg-gray-50/50 grow flex flex-col justify-center gap-0.5">
                  <span className="text-[7px] text-gray-400 uppercase">3. Findings</span>
                  <span className="text-rose-700 truncate max-w-28 mx-auto">{rec.findingIds.length} Linked Findings</span>
                </div>

                <span className="self-center text-gray-400">➔</span>

                <div className="p-3 border border-indigo-250 rounded bg-indigo-50/20 grow flex flex-col justify-center gap-0.5">
                  <span className="text-[7px] text-indigo-650 uppercase font-extrabold">4. Rec Target</span>
                  <span className="text-indigo-750 truncate max-w-28 mx-auto">{rec.id}</span>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Validation Checklist panel (Section 20) */}
          {isBrida && rec.status !== 'APPROVED' && rec.status !== 'PUBLISHED' && rec.status !== 'UNDER_REVIEW' && (
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-gray-400" />
                  <span>Recommendation Validation Checklist</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                
                <div className="grid gap-2 sm:grid-cols-2 text-2xs font-bold">
                  <div className="flex items-center gap-2">
                    {rec.title.trim() ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-rose-600" />
                    )}
                    <span className={rec.title.trim() ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                      Recommendation Title Filled
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {rec.findingIds.length > 0 ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-rose-600" />
                    )}
                    <span className={rec.findingIds.length > 0 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                      At least 1 Finding Linked
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {rec.recommendationDescription.trim() ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-rose-600" />
                    )}
                    <span className={rec.recommendationDescription.trim() ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                      Description Filled
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {rec.primaryRecipientId ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-rose-600" />
                    )}
                    <span className={rec.primaryRecipientId ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                      Recipient OPD Selected
                    </span>
                  </div>
                </div>

                {!validation.isValid ? (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 rounded text-rose-750 dark:text-rose-400 text-2xs space-y-1 font-semibold">
                    <span className="font-bold block uppercase text-[9px] mb-1">Validation Errors:</span>
                    {validation.errors.map((err, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 rounded text-emerald-750 dark:text-emerald-400 text-2xs flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                    <span>Rekomendasi tervalidasi lengkap dan siap diajukan untuk review!</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => router.push(`/research/${id}/recommendation/preview`)}
                    className="px-3.5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-750 dark:text-gray-300 rounded text-xs font-semibold bg-white dark:bg-gray-950"
                  >
                    Preview REC
                  </button>
                  <button
                    onClick={() => setIsSubmitOpen(true)}
                    disabled={!validation.isValid}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                  >
                    <Send className="h-4 w-4" />
                    <span>Submit for Review</span>
                  </button>
                </div>

              </CardContent>
            </Card>
          )}

          {/* Recipient Details & Supportings */}
          {rec.status !== 'NOT_STARTED' && (
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Target Perangkat Daerah Penerima (Recipient OPDs)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-3 border rounded bg-indigo-50/5">
                    <span className="text-[8px] text-gray-400 uppercase font-bold block">Penerima Utama (Primary)</span>
                    <span className="font-bold text-gray-800 block text-xs mt-1">{primaryOpdName}</span>
                  </div>
                  
                  {supportingOpdNames.length > 0 && (
                    <div className="p-3 border rounded bg-gray-50/50">
                      <span className="text-[8px] text-gray-400 uppercase font-bold block">Penerima Pendukung (Supportings)</span>
                      <div className="mt-1 space-y-1">
                        {supportingOpdNames.map((name, idx) => (
                          <span key={idx} className="font-bold text-gray-700 block text-xs">• {name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* ================= RIGHT SECTION (Audit timeline & completeness indicator) ================= */}
        <div className="space-y-6">
          
          {/* Recommendation Completeness Indicator score (Section 40) */}
          <Card>
            <CardContent className="p-6 space-y-3 font-semibold select-none">
              <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider">
                Recommendation Completeness
              </span>
              
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-extrabold text-indigo-755">{completenessScore} / 6</span>
                <span className="text-2xs text-gray-450 uppercase font-bold">
                  {completenessScore === 6 ? 'Complete' : 'Incomplete'}
                </span>
              </div>

              <div className="w-full bg-gray-150 h-2 rounded overflow-hidden">
                <div className="bg-indigo-650 h-full rounded transition-all" style={{ width: `${(completenessScore / 6) * 100}%` }} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[8px] text-gray-450 pt-1">
                <div className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Research Basis</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Linked Findings</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Problem Statement</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Recipient OPD</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Trail Timeline */}
          <Card>
            <CardHeader className="pb-2 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <History className="h-4 w-4" />
                <span>Audit Timeline Logs</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {activities.length === 0 ? (
                <p className="text-[11px] text-gray-400 italic">Belum ada riwayat aktivitas rekomendasi.</p>
              ) : (
                <div className="relative border-l pl-3.5 space-y-4 py-2">
                  {activities.map((act) => (
                    <div key={act.id} className="relative text-xs space-y-0.5 font-semibold">
                      <span className="absolute -left-[19.5px] top-1 h-2 w-2 rounded-full border border-white bg-indigo-650" />
                      <div className="flex justify-between items-center text-[9px] text-gray-450 font-semibold">
                        <span>{act.date}</span>
                        <span>{act.user}</span>
                      </div>
                      <p className="font-bold text-gray-800">{act.action}</p>
                      <p className="text-[10px] text-gray-455 italic leading-relaxed font-normal">{act.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ================= MODAL: CONFIRM SUBMIT FOR REVIEW ================= */}
      <Dialog
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        title="Ajukan Review Rekomendasi"
        description="Submit recommendation for review?"
        footer={
          <>
            <button
              onClick={handleConfirmSubmit}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition-all"
            >
              Kirim Review
            </button>
            <button
              onClick={() => setIsSubmitOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-750 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <p className="text-xs text-gray-500 leading-relaxed">
          Setelah diajukan, status Rekomendasi berubah menjadi **Under Review** dan dikirim secara resmi kepada Kepala BRIDA. Dokumen akan dikunci dari penyuntingan BRIDA selama peninjauan berlangsung.
        </p>
      </Dialog>

      {/* ================= MODAL: CONFIRM PUBLISH (Section 27) ================= */}
      <Dialog
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        title="Terbitkan Rekomendasi kepada OPD"
        description="Publish recommendation to recipient OPDs?"
        footer={
          <>
            <button
              onClick={handleConfirmPublish}
              className="px-4 py-2 bg-emerald-650 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-all"
            >
              Publish & Kirim
            </button>
            <button
              onClick={() => setIsPublishOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-750 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <p className="text-xs text-gray-500 leading-relaxed font-semibold">
          Rekomendasi resmi yang telah disetujui akan diterbitkan kepada OPD penerima terkait (**Dinas Kesehatan**). OPD akan menerima notifikasi masuk serta berhak mengakses dan membaca detail rekomendasi ini secara eksklusif.
        </p>
      </Dialog>

    </div>
  );
}
