'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReportStore } from '@/store/useReportStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useImplementationStore } from '@/store/useImplementationStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import {
  ArrowLeft,
  FileText,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  History,
  Clock,
  TrendingUp,
  FolderOpen,
  PieChart,
  UserCheck,
  Send,
  Eye,
  Check,
  X,
  ClipboardList
} from 'lucide-react';

export default function ReportOverviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { researchRecords } = useResearchStore();
  const { getImplementation, getOverallProgress } = useImplementationStore();
  const {
    getReport,
    getFindings,
    getPolicyBrief,
    getActivities,
    submitReportForReview
  } = useReportStore();

  const id = params?.id || '';
  const isBrida = user?.role === 'BRIDA';
  const isKepalaBrida = user?.role === 'KEPALA_BRIDA';

  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  // Find target research record
  const record = useMemo(() => {
    return researchRecords.find((r) => r.id === id);
  }, [researchRecords, id]);

  const impl = getImplementation(id);
  const report = getReport(id);
  const findings = getFindings(id);
  const policyBrief = getPolicyBrief(id);
  const activities = getActivities(id);
  const overallProgress = getOverallProgress(id);

  // Findings severity counts (Section 41)
  const severityStats = useMemo(() => {
    const stats = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    findings.forEach(f => {
      if (stats[f.severity] !== undefined) {
        stats[f.severity]++;
      }
    });
    return stats;
  }, [findings]);

  // Stepper workflow: RESEARCH COMPLETED ➔ REPORT DRAFT ➔ FINDINGS ➔ CONCLUSION ➔ POLICY BRIEF ➔ REVIEW ➔ APPROVED ➔ READY FOR RECOMMENDATION
  const stepperStates = useMemo(() => {
    const states = {
      completed: 'completed', // since report page is only accessible if research completed
      draft: 'future',
      findings: 'future',
      conclusion: 'future',
      brief: 'future',
      review: 'future',
      approved: 'future',
    };

    if (report.status !== 'NOT_STARTED') {
      states.draft = report.status === 'APPROVED' ? 'completed' : 'active';
    }
    if (findings.length > 0) {
      states.findings = report.status === 'APPROVED' ? 'completed' : 'active';
    }
    if (report.conclusion.trim() !== '') {
      states.conclusion = report.status === 'APPROVED' ? 'completed' : 'active';
    }
    if (policyBrief.status !== 'NOT_STARTED') {
      states.brief = report.status === 'APPROVED' ? 'completed' : 'active';
    }
    if (report.status === 'UNDER_REVIEW') {
      states.draft = 'completed';
      states.findings = 'completed';
      states.conclusion = 'completed';
      states.brief = 'completed';
      states.review = 'active';
    }
    if (report.status === 'APPROVED') {
      states.draft = 'completed';
      states.findings = 'completed';
      states.conclusion = 'completed';
      states.brief = 'completed';
      states.review = 'completed';
      states.approved = 'completed';
    }

    return states;
  }, [report, findings, policyBrief]);

  // Report & Brief Validation checkers (Section 27 & 28)
  const reportValidation = useMemo(() => {
    const errors: string[] = [];

    if (!report.title.trim()) {
      errors.push('Judul Laporan Hasil belum terisi');
    }
    if (!report.executiveSummary.trim()) {
      errors.push('Executive Summary laporan wajib diisi');
    }
    if (!report.results.trim()) {
      errors.push('Ringkasan Hasil Penelitian (Results) belum diisi');
    }
    if (findings.length === 0) {
      errors.push('Belum ada Temuan Riset (Research Findings) yang ditambahkan (minimal 1)');
    }
    if (!report.conclusion.trim()) {
      errors.push('Kesimpulan Laporan (Conclusion) wajib diisi');
    }

    const isReportValid = errors.length === 0;

    return { isValid: isReportValid, errors };
  }, [report, findings]);

  const briefValidation = useMemo(() => {
    const errors: string[] = [];

    if (!policyBrief.title.trim()) {
      errors.push('Judul Policy Brief belum ditentukan');
    }
    if (!policyBrief.executiveSummary.trim()) {
      errors.push('Rangkuman eksekutif policy brief belum diisi');
    }
    if (!policyBrief.policyContext.trim()) {
      errors.push('Konteks kebijakan (Policy Context) belum diisi');
    }
    if (!policyBrief.keyProblem.trim()) {
      errors.push('Fokus masalah utama (Key Problem) belum diisi');
    }
    if (policyBrief.keyFindings.length === 0) {
      errors.push('Belum ada temuan riset terpilih untuk ditautkan ke Policy Brief (minimal 1)');
    }
    if (!policyBrief.conclusion.trim()) {
      errors.push('Kesimpulan policy brief wajib diisi');
    }
    if (!policyBrief.policyImplication.trim()) {
      errors.push('Implikasi kebijakan (Policy Implication) wajib diisi');
    }

    const isBriefValid = errors.length === 0;

    return { isValid: isBriefValid, errors };
  }, [policyBrief]);

  const overallValidation = {
    isValid: reportValidation.isValid && briefValidation.isValid,
    errors: [...reportValidation.errors, ...briefValidation.errors]
  };

  const handleConfirmSubmit = () => {
    submitReportForReview(id, user?.name || 'BRIDA Litbang');
    setIsSubmitOpen(false);
    toast('Laporan hasil penelitian & policy brief berhasil diajukan untuk review Kepala BRIDA.', 'success');
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
        title="Laporan Hasil Penelitian & Policy Brief"
        description="Dokumentasi output formal riset kebijakan daerah, ringkasan eksekutif, temuan kualitatif, dan implikasi strategis."
        action={
          isKepalaBrida && report.status === 'UNDER_REVIEW' && (
            <button
              onClick={() => router.push(`/research/${record.id}/report/review`)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow animate-pulse"
            >
              <ClipboardList className="h-4 w-4" />
              <span>Review Laporan & Brief</span>
            </button>
          )
        }
      />

      {/* Stepper timeline */}
      <Card>
        <CardContent className="p-4 overflow-x-auto">
          <div className="flex justify-between items-center gap-4 text-xs font-bold min-w-[700px] select-none">
            
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-355 flex items-center justify-center text-[10px]">✓</span>
              <span className="text-emerald-700 text-[10px]">COMPLETED</span>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-800 grow" />

            {/* DRAFT */}
            <div className="flex items-center gap-1.5 shrink-0">
              {stepperStates.draft === 'completed' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-355 flex items-center justify-center text-[10px]">✓</span>
              ) : stepperStates.draft === 'active' ? (
                <span className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-750 border border-indigo-650 flex items-center justify-center text-[10px] animate-pulse">●</span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={stepperStates.draft === 'completed' ? 'text-emerald-700' : stepperStates.draft === 'active' ? 'text-indigo-700' : 'text-gray-400'}>
                DRAFT
              </span>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-800 grow" />

            {/* FINDINGS */}
            <div className="flex items-center gap-1.5 shrink-0">
              {stepperStates.findings === 'completed' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-355 flex items-center justify-center text-[10px]">✓</span>
              ) : stepperStates.findings === 'active' ? (
                <span className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-750 border border-indigo-650 flex items-center justify-center text-[10px] animate-pulse">●</span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={stepperStates.findings === 'completed' ? 'text-emerald-700' : stepperStates.findings === 'active' ? 'text-indigo-700' : 'text-gray-400'}>
                FINDINGS
              </span>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-800 grow" />

            {/* BRIEF */}
            <div className="flex items-center gap-1.5 shrink-0">
              {stepperStates.brief === 'completed' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-355 flex items-center justify-center text-[10px]">✓</span>
              ) : stepperStates.brief === 'active' ? (
                <span className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-750 border border-indigo-650 flex items-center justify-center text-[10px] animate-pulse">●</span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={stepperStates.brief === 'completed' ? 'text-emerald-700' : stepperStates.brief === 'active' ? 'text-indigo-700' : 'text-gray-400'}>
                POLICY BRIEF
              </span>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-800 grow" />

            {/* REVIEW */}
            <div className="flex items-center gap-1.5 shrink-0">
              {stepperStates.review === 'completed' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-355 flex items-center justify-center text-[10px]">✓</span>
              ) : stepperStates.review === 'active' ? (
                <span className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-750 border border-indigo-650 flex items-center justify-center text-[10px] animate-pulse">●</span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={stepperStates.review === 'completed' ? 'text-emerald-700' : stepperStates.review === 'active' ? 'text-indigo-700' : 'text-gray-400'}>
                REVIEW KEPALA
              </span>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-800 grow" />

            {/* APPROVED */}
            <div className="flex items-center gap-1.5 shrink-0">
              {stepperStates.approved === 'completed' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-355 flex items-center justify-center text-[10px]">✓</span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={stepperStates.approved === 'completed' ? 'text-emerald-700' : 'text-gray-400'}>
                APPROVED Output
              </span>
            </div>

          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* ================= LEFT CONTENT (Severity charts & listings) ================= */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Main overview status cards */}
          <div className="grid gap-4 sm:grid-cols-3 font-semibold select-none">
            <Card>
              <CardContent className="p-4 text-xs space-y-1">
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Laporan Hasil Status</span>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold border ${
                  report.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-650'
                }`}>
                  {report.status === 'NOT_STARTED' ? 'NOT STARTED' : `v${report.version} • ${report.status}`}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-xs space-y-1">
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Policy Brief Status</span>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold border ${
                  policyBrief.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-650'
                }`}>
                  {policyBrief.status === 'NOT_STARTED' ? 'NOT STARTED' : `v${policyBrief.version} • ${policyBrief.status}`}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-xs space-y-1">
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Ready for Recommendation</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                  (report.status === 'APPROVED' && policyBrief.status === 'APPROVED') ? 'text-emerald-600' : 'text-gray-400'
                }`}>
                  {(report.status === 'APPROVED' && policyBrief.status === 'APPROVED') ? '✓ TRUE' : '❌ FALSE'}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Finding Severity Horizontal Bar Chart (Section 42) */}
          <Card>
            <CardHeader className="pb-3 border-b flex flex-row justify-between items-center">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <PieChart className="h-4 w-4 text-indigo-650" />
                <span>Peta Hambatan & Keparahan Temuan (Findings Severity)</span>
              </CardTitle>
              {isBrida && report.status !== 'APPROVED' && report.status !== 'UNDER_REVIEW' && (
                <button
                  onClick={() => router.push(`/research/${record.id}/report/findings`)}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-3xs font-bold uppercase"
                >
                  Manage Findings
                </button>
              )}
            </CardHeader>
            <CardContent className="pt-6 text-xs font-semibold space-y-4">
              {findings.length === 0 ? (
                <p className="text-[11px] text-gray-450 italic text-center py-4">Belum ada temuan riset yang ditambahkan.</p>
              ) : (
                <div className="space-y-3.5">
                  {/* CRITICAL */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-2xs">
                      <span className="text-red-700 font-bold">Critical ({severityStats.CRITICAL})</span>
                      <span>{findings.length ? Number(((severityStats.CRITICAL / findings.length) * 100).toFixed(0)) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded overflow-hidden">
                      <div className="bg-red-650 h-full rounded" style={{ width: `${findings.length ? (severityStats.CRITICAL / findings.length) * 100 : 0}%` }} />
                    </div>
                  </div>

                  {/* HIGH */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-2xs">
                      <span className="text-rose-700 font-bold">High ({severityStats.HIGH})</span>
                      <span>{findings.length ? Number(((severityStats.HIGH / findings.length) * 100).toFixed(0)) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded overflow-hidden">
                      <div className="bg-rose-500 h-full rounded" style={{ width: `${findings.length ? (severityStats.HIGH / findings.length) * 100 : 0}%` }} />
                    </div>
                  </div>

                  {/* MEDIUM */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-2xs">
                      <span className="text-amber-700 font-bold">Medium ({severityStats.MEDIUM})</span>
                      <span>{findings.length ? Number(((severityStats.MEDIUM / findings.length) * 100).toFixed(0)) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded overflow-hidden">
                      <div className="bg-amber-500 h-full rounded" style={{ width: `${findings.length ? (severityStats.MEDIUM / findings.length) * 100 : 0}%` }} />
                    </div>
                  </div>

                  {/* LOW */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-2xs">
                      <span className="text-slate-600 font-bold">Low ({severityStats.LOW})</span>
                      <span>{findings.length ? Number(((severityStats.LOW / findings.length) * 100).toFixed(0)) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded overflow-hidden">
                      <div className="bg-slate-400 h-full rounded" style={{ width: `${findings.length ? (severityStats.LOW / findings.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Management table list (Section 43) */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Berkas Hasil Output Administrasi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs font-semibold">
              <div className="grid gap-4 sm:grid-cols-2">
                
                {/* Report file */}
                <div className="p-3 border rounded bg-gray-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4.5 w-4.5 text-indigo-650" />
                    <div>
                      <span className="font-bold text-gray-800 block">Laporan_Penelitian_RES-2026.pdf</span>
                      <span className="text-[10px] text-gray-400 block font-normal mt-0.5">Laporan • v{report.version} • Status: {report.status}</span>
                    </div>
                  </div>
                  {report.status !== 'NOT_STARTED' && (
                    <button
                      onClick={() => router.push(`/research/${record.id}/report/preview`)}
                      className="text-blue-600 font-bold hover:underline uppercase text-3xs"
                    >
                      Preview
                    </button>
                  )}
                </div>

                {/* Policy brief file */}
                <div className="p-3 border rounded bg-gray-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4.5 w-4.5 text-indigo-655" />
                    <div>
                      <span className="font-bold text-gray-800 block">Policy_Brief_RES-2026.pdf</span>
                      <span className="text-[10px] text-gray-400 block font-normal mt-0.5">Policy Brief • v{policyBrief.version} • Status: {policyBrief.status}</span>
                    </div>
                  </div>
                  {policyBrief.status !== 'NOT_STARTED' && (
                    <button
                      onClick={() => router.push(`/research/${record.id}/policy-brief`)}
                      className="text-blue-600 font-bold hover:underline uppercase text-3xs"
                    >
                      Preview
                    </button>
                  )}
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Validation Checklist Panel (Section 27 & 28) */}
          {isBrida && report.status !== 'APPROVED' && report.status !== 'UNDER_REVIEW' && (
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-gray-400" />
                  <span>Output Validation Checklist</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                
                <div className="grid gap-2 sm:grid-cols-2 text-2xs font-bold">
                  <div className="flex items-center gap-2">
                    {reportValidation.isValid ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-rose-600" />
                    )}
                    <span className={reportValidation.isValid ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                      Kelengkapan Laporan Riset
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {briefValidation.isValid ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-rose-600" />
                    )}
                    <span className={briefValidation.isValid ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                      Kelengkapan Policy Brief
                    </span>
                  </div>
                </div>

                {!overallValidation.isValid ? (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 rounded text-rose-750 dark:text-rose-400 text-2xs space-y-1">
                    <span className="font-bold block uppercase text-[9px] mb-1">Output Validation Errors:</span>
                    {overallValidation.errors.map((err, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 rounded text-emerald-750 dark:text-emerald-400 text-2xs flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                    <span>Laporan hasil riset & policy brief tervalidasi lengkap dan siap diajukan untuk review!</span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setIsSubmitOpen(true)}
                    disabled={!overallValidation.isValid}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                  >
                    <Send className="h-4 w-4" />
                    <span>Submit for Review</span>
                  </button>
                </div>

              </CardContent>
            </Card>
          )}

        </div>

        {/* ================= RIGHT SECTION (Audit info & Timeline logs) ================= */}
        <div className="space-y-6">
          
          {/* Audit trail information */}
          <Card>
            <CardHeader className="pb-2 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>Audit Trail Informasi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs font-semibold leading-normal select-none">
              <div>
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Research ID</span>
                <span className="font-bold text-gray-900">{record.id}</span>
              </div>
              
              <div>
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Judul Kegiatan Penelitian</span>
                <span className="font-semibold text-gray-800 leading-relaxed block mt-0.5">{record.title}</span>
              </div>

              <div>
                <span className="text-gray-400 block font-bold text-[8px] uppercase">OPD Pelaksana</span>
                <span className="font-semibold text-gray-805 block">{record.opd}</span>
              </div>

              <div className="grid gap-2 grid-cols-2 text-2xs pt-2 border-t">
                <div>
                  <span className="text-gray-400 block font-bold uppercase text-[8px]">Created By</span>
                  <span className="font-semibold text-gray-700">{report.submittedBy || 'BRIDA'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase text-[8px]">Research Status</span>
                  <span className="font-bold text-emerald-650">{record.status}</span>
                </div>
                {report.status === 'APPROVED' && (
                  <>
                    <div>
                      <span className="text-gray-400 block font-bold uppercase text-[8px]">Approved By</span>
                      <span className="font-semibold text-emerald-650">{report.decisionBy}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-bold uppercase text-[8px]">Approved Date</span>
                      <span className="font-semibold text-gray-700">{report.decisionDate}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline report Activities */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <History className="h-4 w-4" />
                <span>Timeline Activities</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {activities.length === 0 ? (
                <p className="text-[11px] text-gray-400 italic">Belum ada riwayat aktivitas laporan.</p>
              ) : (
                <div className="relative border-l pl-3.5 space-y-4 py-2">
                  {activities.map((act) => (
                    <div key={act.id} className="relative text-xs space-y-0.5">
                      <span className="absolute -left-[19.5px] top-1 h-2 w-2 rounded-full border border-white bg-indigo-650" />
                      <div className="flex justify-between items-center text-[9px] text-gray-450 font-semibold">
                        <span>{act.date}</span>
                        <span>{act.user}</span>
                      </div>
                      <p className="font-bold text-gray-800">{act.action}</p>
                      <p className="text-[10px] text-gray-455 italic leading-relaxed">{act.details}</p>
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
        title="Ajukan Review Laporan & Policy Brief"
        description="Submit outputs detail for review?"
        footer={
          <>
            <button
              onClick={handleConfirmSubmit}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition-all"
            >
              Ajukan Peninjauan
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
          Setelah diajukan, status Laporan & Policy Brief akan diubah menjadi **Under Review** dan dikirim secara resmi kepada Kepala BRIDA. Dokumen akan dikunci dari penyuntingan lebih lanjut selama proses peninjauan berlangsung.
        </p>
      </Dialog>

    </div>
  );
}
