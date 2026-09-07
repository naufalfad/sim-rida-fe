'use client';

import React, { useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useResearchStore } from '@/store/useResearchStore';
import { useIdentificationStore } from '@/store/useIdentificationStore';
import { usePlanningStore } from '@/store/usePlanningStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePartnerStore } from '@/store/usePartnerStore';
import { useImplementationStore } from '@/store/useImplementationStore';
import { useReportStore } from '@/store/useReportStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useRecommendationStore } from '@/store/useRecommendationStore';
import {
  ArrowLeft,
  Sparkles,
  Link,
  ClipboardList,
  CheckCircle2,
  FileText,
  Bookmark,
  Award,
  Info,
  Play,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';

export default function ResearchDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { user } = useAuthStore();
  const { researchRecords, proposals, fetchProposals } = useResearchStore();
  const { identifications } = useIdentificationStore();
  const { getKak, getRab, fetchPlanning } = usePlanningStore();
  const { getMethod, fetchPartners } = usePartnerStore();
  const { getImplementation, getOverallProgress, fetchImplementations } = useImplementationStore();
  const { getReport, getPolicyBrief, fetchReportsAndPolicyBriefs } = useReportStore();
  const { getRecommendation, fetchRecommendations } = useRecommendationStore();
  const { toast } = useToast();

  const id = params?.id;
  const isBrida = user?.role === 'BRIDA';
  const isKepalaBrida = user?.role === 'KEPALA_BRIDA';
  const isAdminBrida = user?.role === 'ADMIN_BRIDA';

  // Auto-fetch fresh data from all stores on mount
  useEffect(() => {
    fetchProposals();
    fetchPlanning();
    fetchPartners();
    fetchImplementations();
    fetchReportsAndPolicyBriefs();
    fetchRecommendations();
  }, [id, fetchProposals, fetchPlanning, fetchPartners, fetchImplementations, fetchReportsAndPolicyBriefs, fetchRecommendations]);

  // Find target research record with fallback
  const record = useMemo(() => {
    const found = researchRecords.find((r) => r.id === id || r.proposalId === id);
    if (found) return found;
    const prop = proposals.find((p) => p.id === id || p.code === id);
    if (prop) {
      return {
        id: prop.id,
        title: prop.title,
        proposalId: prop.code || prop.id,
        identificationId: prop.identificationId || 'ID-001',
        opd: prop.opd || 'Dinas Terkait',
        status: 'PLANNED' as const,
        priority: prop.priority || 'HIGH',
        approvedDate: prop.updatedDate || '2026',
      };
    }
    return null;
  }, [researchRecords, proposals, id]);

  // Find source proposal
  const sourceProposal = useMemo(() => {
    if (!record) return null;
    return proposals.find((p) => p.id === record.proposalId || p.code === record.proposalId || p.id === id || p.code === id);
  }, [proposals, record, id]);

  // Find source identification
  const sourceIdent = useMemo(() => {
    if (!record) return null;
    return identifications.find((i) => i.id === record.identificationId);
  }, [identifications, record]);

  const kak = useMemo(() => {
    return getKak(id || '') || (record ? getKak(record.id) : null) || (sourceProposal ? getKak(sourceProposal.id) : null) || getKak(record?.proposalId || '');
  }, [getKak, id, record, sourceProposal]);

  const rab = useMemo(() => {
    return getRab(id || '') || (record ? getRab(record.id) : null) || (sourceProposal ? getRab(sourceProposal.id) : null) || getRab(record?.proposalId || '');
  }, [getRab, id, record, sourceProposal]);

  const method = useMemo(() => {
    return getMethod(id || '') || (record ? getMethod(record.id) : null) || (sourceProposal ? getMethod(sourceProposal.id) : null) || getMethod(record?.proposalId || '');
  }, [getMethod, id, record, sourceProposal]);

  const impl = useMemo(() => {
    return getImplementation(id || '') || (record ? getImplementation(record.id) : null) || (sourceProposal ? getImplementation(sourceProposal.id) : null) || getImplementation(record?.proposalId || '');
  }, [getImplementation, id, record, sourceProposal]);

  const overallProgress = useMemo(() => {
    return getOverallProgress(id || '') || (record ? getOverallProgress(record.id) : 0);
  }, [getOverallProgress, id, record]);

  const report = useMemo(() => {
    return getReport(id || '') || (record ? getReport(record.id) : null) || getReport(record?.proposalId || '');
  }, [getReport, id, record]);

  const policyBrief = useMemo(() => {
    return getPolicyBrief(id || '') || (record ? getPolicyBrief(record.id) : null) || getPolicyBrief(record?.proposalId || '');
  }, [getPolicyBrief, id, record]);

  const recommendation = useMemo(() => {
    return getRecommendation(id || '') || (record ? getRecommendation(record.id) : null) || getRecommendation(record?.proposalId || '');
  }, [getRecommendation, id, record]);

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

  // Calculate score percentage
  const selectionScoreInfo = useMemo(() => {
    if (!sourceProposal?.selectionDetails) return null;
    const {
      relevance,
      urgency,
      priorityAlignment,
      benefits,
      feasibility,
      dataAvailability,
      recommendationPotential
    } = sourceProposal.selectionDetails;

    const total =
      relevance +
      urgency +
      priorityAlignment +
      benefits +
      feasibility +
      dataAvailability +
      recommendationPotential;

    const max = 35;
    const percentage = Number(((total / max) * 100).toFixed(2));

    return { total, max, percentage };
  }, [sourceProposal]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push('/research')}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Penelitian</span>
        </button>
      </div>

      <PageHeader
        title={`Rekod Penelitian #${record.id}`}
        description="Hasil penetapan program kerja penelitian/kajian daerah berdasarkan usulan terakreditasi BRIDA."
      />

      {/* Origin/Traceability Stepper Breadcrumb representation */}
      <Card>
        <CardHeader className="pb-2 border-b dark:border-gray-850">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <Link className="h-4 w-4 text-gray-400" />
            <span>Traceability Origin (Ketertelusuran Alur Penyelarasan)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-xs font-semibold text-gray-500">
          <div className="grid gap-4 md:grid-cols-4 items-stretch">
            
            {/* 1. Identification */}
            <div className="p-3 border rounded bg-gray-50/50 dark:bg-gray-900/50 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase leading-none mb-1">
                  1. Identification
                </span>
                {sourceIdent ? (
                  <>
                    <span className="font-bold text-gray-900 dark:text-white block truncate mb-1">
                      {sourceIdent.id}
                    </span>
                    <span className="text-[11px] text-gray-500 block leading-tight truncate">
                      {sourceIdent.topic}
                    </span>
                  </>
                ) : (
                  <span className="italic text-gray-400 block">External Source</span>
                )}
              </div>
              {sourceIdent && (
                <button
                  onClick={() => router.push(`/identification/${sourceIdent.id}`)}
                  className="w-full text-center py-1 border border-blue-200 hover:border-blue-500 rounded bg-white dark:bg-gray-950 text-blue-600 font-bold text-3xs uppercase transition-all mt-2"
                >
                  View Ident
                </button>
              )}
            </div>

            {/* 2. Proposal */}
            <div className="p-3 border rounded bg-gray-50/50 dark:bg-gray-900/50 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase leading-none mb-1">
                  2. Research Proposal
                </span>
                {sourceProposal ? (
                  <>
                    <span className="font-bold text-gray-900 dark:text-white block truncate mb-1">
                      {sourceProposal.id}
                    </span>
                    <span className="text-[11px] text-gray-500 block leading-tight truncate">
                      {sourceProposal.title}
                    </span>
                  </>
                ) : (
                  <span className="italic text-gray-400 block">No proposal trace</span>
                )}
              </div>
              {sourceProposal && (
                <button
                  onClick={() => router.push(`/research-proposals/${sourceProposal.id}`)}
                  className="w-full text-center py-1 border border-blue-200 hover:border-blue-500 rounded bg-white dark:bg-gray-950 text-blue-600 font-bold text-3xs uppercase transition-all mt-2"
                >
                  View Proposal
                </button>
              )}
            </div>

            {/* 3. Selection Result */}
            <div className="p-3 border rounded bg-purple-50/10 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/40 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-purple-600 font-bold block uppercase leading-none mb-1">
                  3. Selection Score
                </span>
                {sourceProposal?.selection || record?.selection || sourceProposal?.totalScore !== undefined || record?.totalScore !== undefined ? (
                  <>
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className="font-extrabold text-purple-700 dark:text-purple-400 text-sm">
                        {sourceProposal?.selection?.totalScore ?? record?.selection?.totalScore ?? sourceProposal?.totalScore ?? record?.totalScore ?? '-'} / 100
                      </span>
                      <span className="text-[10px] text-gray-400">Poin</span>
                    </div>
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200">
                      {sourceProposal?.selection?.result === 'SELECTED' ? '✓ LOLOS' : sourceProposal?.selection?.result || 'FINALIZED'}
                    </span>
                  </>
                ) : selectionScoreInfo && sourceProposal ? (
                  <>
                    <span className="font-bold text-purple-700 dark:text-purple-400 block mb-1">
                      {selectionScoreInfo.total} / {selectionScoreInfo.max} Score
                    </span>
                    <span className="text-[11px] text-gray-500 block">
                      Percentage: {selectionScoreInfo.percentage}%
                    </span>
                  </>
                ) : (
                  <span className="italic text-gray-400 block">Belum ada nilai seleksi</span>
                )}
              </div>
              {sourceProposal && (
                <button
                  onClick={() => router.push(`/research-proposals/${sourceProposal.id}`)}
                  className="w-full text-center py-1 border border-purple-200 hover:border-purple-500 rounded bg-white dark:bg-gray-950 text-purple-600 font-bold text-3xs uppercase transition-all mt-2"
                >
                  Lihat Hasil Seleksi
                </button>
              )}
            </div>

            {/* 4. Research Penetapan */}
            <div className="p-3 border rounded bg-blue-50/5 dark:bg-blue-950/10 border-blue-250 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-blue-600 font-bold block uppercase leading-none mb-1">
                  4. Penetapan Program
                </span>
                <span className="font-bold text-gray-900 dark:text-white block mb-1">
                  {record.id}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-200 mt-1">
                  {record.status}
                </span>
              </div>
              <span className="text-[9px] text-gray-400 font-bold text-right">
                Approved: {record.approvedDate}
              </span>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Hasil Seleksi & Penetapan Skor Riset Detail Card */}
      {(sourceProposal?.selection || record?.selection) && (
        <Card className="border-purple-200 dark:border-purple-900/60 bg-gradient-to-b from-purple-50/20 to-transparent shadow-sm">
          <CardHeader className="pb-3 border-b border-purple-100 dark:border-purple-900/40">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-purple-600" />
                <span>Hasil Seleksi & Penetapan Skor Riset</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-3xs font-mono text-gray-500 bg-white dark:bg-gray-900 px-2 py-0.5 border rounded">
                  {sourceProposal?.selection?.code || record?.selection?.code}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-400">
                  ✓ LOLOS SELEKSI LITBANG
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            {/* Score Summary Box */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-purple-100 dark:border-purple-900/30 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Nilai Total Akhir Seleksi</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-purple-700 dark:text-purple-400">
                    {sourceProposal?.selection?.totalScore ?? record?.selection?.totalScore ?? sourceProposal?.totalScore ?? '-'}
                  </span>
                  <span className="text-xs text-gray-400 font-semibold">/ 100 Poin</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs">
                <div className="bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded border border-gray-200/60 dark:border-gray-750">
                  <span className="text-[9px] text-gray-400 font-bold uppercase block">Evaluator / Penilai</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {sourceProposal?.selection?.finalizedBy?.name || record?.selection?.finalizedBy?.name || 'Tim Litbang BRIDA'}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded border border-gray-200/60 dark:border-gray-750">
                  <span className="text-[9px] text-gray-400 font-bold uppercase block">Waktu Penetapan</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {(sourceProposal?.selection?.finalizedAt || record?.selection?.finalizedAt)
                      ? new Date(sourceProposal?.selection?.finalizedAt || record?.selection?.finalizedAt || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      : record.approvedDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Criteria Breakdown Rubric Table */}
            {((sourceProposal?.selection?.scores && sourceProposal.selection.scores.length > 0) || (record?.selection?.scores && record.selection.scores.length > 0)) && (
              <div className="space-y-2">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">
                  Rincian Rubrik Penilaian Kriteria Seleksi
                </span>
                <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-850/80 text-gray-600 dark:text-gray-300 text-3xs uppercase tracking-wider font-semibold border-b dark:border-gray-800">
                        <th className="py-2 px-3 w-10 text-center">No</th>
                        <th className="py-2 px-3 w-20">Kode</th>
                        <th className="py-2 px-3">Kriteria Penilaian</th>
                        <th className="py-2 px-3 w-20 text-center">Bobot</th>
                        <th className="py-2 px-3 w-24 text-center">Skor (0-100)</th>
                        <th className="py-2 px-3 w-28 text-right">Nilai Tertimbang</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 dark:divide-gray-800 bg-white dark:bg-gray-900">
                      {(sourceProposal?.selection?.scores || record?.selection?.scores || []).map((sc: any, idx: number) => (
                        <tr key={sc.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/30">
                          <td className="py-2.5 px-3 text-center text-gray-400 font-bold">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-gray-600 dark:text-gray-300">{sc.code}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-gray-900 dark:text-white">{sc.name}</div>
                            {sc.description && (
                              <div className="text-[10px] text-gray-400 mt-0.5">{sc.description}</div>
                            )}
                            {sc.note && (
                              <div className="text-[10px] text-purple-700 dark:text-purple-400 italic mt-0.5">Catatan: {sc.note}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold text-gray-700 dark:text-gray-300">{sc.weight}%</td>
                          <td className="py-2.5 px-3 text-center font-bold text-purple-700 dark:text-purple-400">{sc.score}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-extrabold text-gray-900 dark:text-white">{sc.weightedScore ?? ((sc.score * sc.weight) / 100).toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-purple-50/50 dark:bg-purple-950/20 font-bold text-gray-900 dark:text-white border-t border-purple-200 dark:border-purple-800">
                        <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-3xs tracking-wider">Total Skor Kelayakan:</td>
                        <td className="py-2.5 px-3 text-center text-purple-700 dark:text-purple-400">100%</td>
                        <td className="py-2.5 px-3"></td>
                        <td className="py-2.5 px-3 text-right font-mono text-sm text-purple-700 dark:text-purple-400">
                          {sourceProposal?.selection?.totalScore ?? record?.selection?.totalScore ?? '-'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Catatan / Justifikasi Penetapan */}
            {(sourceProposal?.selection?.selectionNote || record?.selection?.selectionNote) && (
              <div className="p-3 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 rounded text-xs">
                <span className="text-[10px] text-purple-700 dark:text-purple-400 font-bold uppercase block mb-1">
                  Catatan / Justifikasi Penetapan Seleksi
                </span>
                <p className="italic text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                  &quot;{sourceProposal?.selection?.selectionNote || record?.selection?.selectionNote}&quot;
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Research Planning Section */}
      <Card className="border-blue-200 dark:border-blue-900/60 bg-blue-50/5 dark:bg-blue-950/5">
        <CardHeader className="pb-3 border-b border-blue-100 dark:border-blue-900/40">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-405 flex items-center justify-between">
            <span>Administrasi Perencanaan (Research Planning)</span>
            <div className="flex items-center gap-2">
              {(kak.status === 'UNDER_REVIEW' || rab.status === 'UNDER_REVIEW') && (
                <button
                  onClick={() => router.push(`/research/${record.id}/planning/review`)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-3xs font-bold transition-all uppercase shadow"
                >
                  Review KAK & RAB
                </button>
              )}
              <button
                onClick={() => router.push(`/research/${record.id}/planning`)}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-3xs font-bold transition-all uppercase"
              >
                Open Planning Overview
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid gap-6 sm:grid-cols-2 text-xs">
          {/* KAK Card */}
          <div className="p-4 border rounded bg-white dark:bg-gray-900 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="font-bold text-gray-800 dark:text-gray-250 block">Kerangka Acuan Kerja (KAK)</span>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                  kak.status === 'APPROVED' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                    : kak.status === 'UNDER_REVIEW'
                    ? 'bg-amber-50 text-amber-700 border-amber-250'
                    : kak.status === 'REVISION_REQUIRED'
                    ? 'bg-rose-50 text-rose-700 border-rose-250'
                    : kak.status === 'DRAFT'
                    ? 'bg-gray-100 text-gray-600 border-gray-250'
                    : 'bg-gray-50 text-gray-400 border-gray-200'
                }`}>
                  {kak.status === 'NOT_STARTED' ? 'Not Started' : kak.status}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                Penyusunan latar belakang, metodologi, dan keluaran kegiatan riset terstruktur (v{kak.version}).
              </p>
            </div>

            <div className="pt-2 border-t dark:border-gray-800 flex gap-2">
              {kak.status === 'NOT_STARTED' ? (
                <button
                  onClick={() => router.push(`/research/${record.id}/kak/edit`)}
                  className="w-full text-center py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-3xs uppercase rounded transition-all"
                >
                  Create KAK
                </button>
              ) : (
                <>
                  <button
                    onClick={() => router.push(`/research/${record.id}/kak`)}
                    className="grow text-center py-1 border border-gray-300 hover:bg-gray-50 rounded text-gray-705 font-bold text-3xs uppercase transition-all bg-white dark:bg-gray-950 dark:border-gray-800 dark:text-gray-300"
                  >
                    Open KAK
                  </button>
                  {kak.status !== 'APPROVED' && kak.status !== 'UNDER_REVIEW' && (
                    <button
                      onClick={() => router.push(`/research/${record.id}/kak/edit`)}
                      className="px-3 text-center py-1 border border-blue-200 hover:bg-blue-50/20 text-blue-650 font-bold text-3xs uppercase rounded transition-all bg-white dark:bg-gray-950"
                    >
                      Edit
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RAB Card */}
          <div className="p-4 border rounded bg-white dark:bg-gray-900 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="font-bold text-gray-800 dark:text-gray-250 block">Rencana Anggaran Biaya (RAB)</span>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                  rab.status === 'APPROVED' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                    : rab.status === 'UNDER_REVIEW'
                    ? 'bg-amber-50 text-amber-700 border-amber-250'
                    : rab.status === 'REVISION_REQUIRED'
                    ? 'bg-rose-50 text-rose-700 border-rose-250'
                    : rab.status === 'DRAFT'
                    ? 'bg-gray-100 text-gray-600 border-gray-250'
                    : 'bg-gray-50 text-gray-400 border-gray-200'
                }`}>
                  {rab.status === 'NOT_STARTED' ? 'Not Started' : rab.status}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                Rincian pembelanjaan honorarium peneliti, perjalanan dinas, workshop, dan administrasi ({rab.items.length} item).
              </p>
            </div>

            <div className="pt-2 border-t dark:border-gray-800 flex gap-2">
              {rab.status === 'NOT_STARTED' ? (
                <button
                  onClick={() => {
                    if (kak.status === 'NOT_STARTED') {
                      toast('Penyusunan RAB dapat dilakukan setelah KAK minimal selesai disimpan (DRAFT).', 'warning');
                    } else {
                      router.push(`/research/${record.id}/rab/edit`);
                    }
                  }}
                  disabled={kak.status === 'NOT_STARTED'}
                  className="w-full text-center py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-3xs uppercase rounded transition-all"
                >
                  Create RAB
                </button>
              ) : (
                <>
                  <button
                    onClick={() => router.push(`/research/${record.id}/rab`)}
                    className="grow text-center py-1 border border-gray-300 hover:bg-gray-50 rounded text-gray-705 font-bold text-3xs uppercase transition-all bg-white dark:bg-gray-950 dark:border-gray-800 dark:text-gray-300"
                  >
                    Open RAB
                  </button>
                  {rab.status !== 'APPROVED' && rab.status !== 'UNDER_REVIEW' && (
                    <button
                      onClick={() => router.push(`/research/${record.id}/rab/edit`)}
                      className="px-3 text-center py-1 border border-blue-200 hover:bg-blue-50/20 text-blue-655 font-bold text-3xs uppercase rounded transition-all bg-white dark:bg-gray-950"
                    >
                      Edit
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Research Partner Selection Card Section */}
      <Card className="border-teal-200 dark:border-teal-900/60 bg-teal-50/5 dark:bg-teal-950/5">
        <CardHeader className="pb-3 border-b border-teal-100 dark:border-teal-900/40">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center justify-between">
            <span>Administrasi Pemilihan Mitra & Metode Pelaksanaan (Partner Selection)</span>
            <div className="flex items-center gap-2">
              {method.status === 'UNDER_REVIEW' && (
                <button
                  onClick={() => router.push(`/research/${record.id}/partner/review`)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-3xs font-bold transition-all uppercase shadow"
                >
                  Review Mitra
                </button>
              )}
              <button
                onClick={() => router.push(`/research/${record.id}/partner`)}
                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-3xs font-bold transition-all uppercase"
              >
                Open Partner Overview
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid gap-6 sm:grid-cols-2 text-xs font-medium">
          {/* Method Card */}
          <div className="p-4 border rounded bg-white dark:bg-gray-900 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="font-bold text-gray-800 dark:text-gray-250 block">Metode Pengadaan / Pelaksanaan</span>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                  method.status === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                    : method.status === 'UNDER_REVIEW'
                    ? 'bg-amber-50 text-amber-700 border-amber-250'
                    : method.status === 'REVISION_REQUIRED'
                    ? 'bg-rose-50 text-rose-700 border-rose-250'
                    : method.status === 'DRAFT'
                    ? 'bg-gray-100 text-gray-600 border-gray-250'
                    : 'bg-gray-50 text-gray-400 border-gray-200'
                }`}>
                  {method.status === 'NOT_STARTED' ? 'Not Started' : method.status}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 leading-normal font-semibold">
                Metode: <span className="text-teal-700 dark:text-teal-400 font-bold uppercase">{method.method || 'SWAKELOLA'}</span>
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-normal">
                {method.justification || 'Pelaksanaan riset operasional litbang daerah.'}
              </p>
            </div>
            <div className="pt-2 border-t dark:border-gray-800 flex gap-2">
              <button
                onClick={() => router.push(`/research/${record.id}/partner/method`)}
                className="w-full text-center py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-3xs uppercase rounded transition-all"
              >
                {method.status === 'NOT_STARTED' ? 'Pilih Metode' : 'Kelola / Ubah Metode'}
              </button>
            </div>
          </div>

          {/* Mitra / Pelaksana Card */}
          <div className="p-4 border rounded bg-white dark:bg-gray-900 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="font-bold text-gray-800 dark:text-gray-250 block">Pelaksana / Mitra Riset</span>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                  method.partnerStatus === 'SELECTED' || method.method === 'SWAKELOLA'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                    : 'bg-amber-50 text-amber-700 border-amber-250'
                }`}>
                  {method.method === 'SWAKELOLA' ? 'INTERNAL BRIDA' : method.partnerStatus === 'SELECTED' ? 'MITRA TERPILIH' : 'BELUM DITETAPKAN'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 leading-normal font-semibold">
                {method.method === 'SWAKELOLA' 
                  ? 'Dikerjakan secara mandiri oleh Tim Peneliti Internal BRIDA.'
                  : 'Pelaksanaan riset melibatkan mitra eksternal (Universitas/Konsultan/Lembaga Riset).'}
              </p>
            </div>
            <div className="pt-2 border-t dark:border-gray-800 flex gap-2">
              {method.status === 'UNDER_REVIEW' ? (
                <button
                  onClick={() => router.push(`/research/${record.id}/partner/review`)}
                  className="w-full text-center py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-3xs uppercase rounded transition-all"
                >
                  Review & Setujui Mitra
                </button>
              ) : (
                <button
                  onClick={() => router.push(`/research/${record.id}/partner/candidates`)}
                  className="w-full text-center py-1 border border-teal-200 hover:bg-teal-50/20 text-teal-700 dark:text-teal-300 font-bold text-3xs uppercase rounded transition-all bg-white dark:bg-gray-950"
                >
                  {method.method === 'SWAKELOLA' ? 'Kelola Tim Peneliti' : 'Daftar Kandidat Mitra'}
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Research Implementation Card Section */}
      <Card className="border-purple-200 dark:border-purple-900/60 bg-purple-50/5 dark:bg-purple-950/5">
        <CardHeader className="pb-3 border-b border-purple-100 dark:border-purple-900/40">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center justify-between">
            <span>Administrasi Pelaksanaan & Monitoring (Research Implementation)</span>
            {impl.status === 'ACTIVE' && (
              <button
                onClick={() => router.push(`/research/${record.id}/implementation`)}
                className="px-2.5 py-1 bg-purple-650 hover:bg-purple-700 text-white rounded text-3xs font-bold transition-all uppercase"
              >
                Open Implementation Dashboard
              </button>
            )}
            {impl.status === 'COMPLETED' && (
              <button
                onClick={() => router.push(`/research/${record.id}/implementation`)}
                className="px-2.5 py-1 bg-emerald-650 hover:bg-emerald-700 text-white rounded text-3xs font-bold transition-all uppercase"
              >
                Open Completed Log
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-xs font-medium space-y-4">
          {impl.status === 'READY' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-400 font-bold block uppercase text-[9px]">Status Pelaksanaan</span>
                {kak.status === 'APPROVED' && rab.status === 'APPROVED' && method.status === 'APPROVED' && (method.partnerStatus === 'SELECTED' || method.method === 'SWAKELOLA') ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-450">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Ready for Implementation</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-450">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Belum Dimulai (Menunggu Persetujuan Perencanaan / Mitra)</span>
                  </span>
                )}
              </div>

              {kak.status === 'APPROVED' && rab.status === 'APPROVED' && method.status === 'APPROVED' && (method.partnerStatus === 'SELECTED' || method.method === 'SWAKELOLA') ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 rounded text-emerald-750 dark:text-emerald-400 text-2xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <span className="font-bold block uppercase text-[8px] mb-0.5">Persyaratan Terpenuhi:</span>
                    <span>Seluruh komponen KAK, RAB, dan pemilihan mitra telah disetujui (Approved). Penelitian siap dimulai.</span>
                  </div>
                  <button
                    onClick={() => router.push(`/research/${record.id}/implementation/start`)}
                    className="px-3.5 py-1.5 bg-blue-650 hover:bg-blue-700 text-white font-bold text-3xs uppercase rounded transition-all flex items-center gap-1 self-end sm:self-auto shrink-0 shadow"
                  >
                    <Play className="h-3 w-3 fill-white" />
                    <span>Start Implementation</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 rounded text-amber-750 dark:text-amber-400 text-2xs space-y-2 font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="font-bold block uppercase text-[8px]">Prasyarat Memulai Pelaksanaan:</span>
                    <span className="text-[10px] text-gray-500 font-normal">
                      Persetujuan dilakukan oleh <strong className="text-gray-700 dark:text-gray-200">BRIDA / Kepala BRIDA</strong>
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 text-3xs">
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 border rounded">
                      <div className="flex items-center gap-1.5">
                        {kak.status === 'APPROVED' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-rose-600" />}
                        <span>KAK Disetujui (Status: {kak.status})</span>
                      </div>
                      {kak.status !== 'APPROVED' && (
                        <button
                          onClick={() => router.push(kak.status === 'UNDER_REVIEW' ? `/research/${record.id}/planning/review` : `/research/${record.id}/kak`)}
                          className="px-2 py-0.5 text-[9px] bg-blue-50 text-blue-600 border border-blue-200 rounded font-bold hover:bg-blue-100"
                        >
                          {kak.status === 'UNDER_REVIEW' ? 'Review' : 'Buka KAK'}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 border rounded">
                      <div className="flex items-center gap-1.5">
                        {rab.status === 'APPROVED' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-rose-600" />}
                        <span>RAB Disetujui (Status: {rab.status})</span>
                      </div>
                      {rab.status !== 'APPROVED' && (
                        <button
                          onClick={() => router.push(rab.status === 'UNDER_REVIEW' ? `/research/${record.id}/planning/review` : `/research/${record.id}/rab`)}
                          className="px-2 py-0.5 text-[9px] bg-blue-50 text-blue-600 border border-blue-200 rounded font-bold hover:bg-blue-100"
                        >
                          {rab.status === 'UNDER_REVIEW' ? 'Review' : 'Buka RAB'}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 border rounded">
                      <div className="flex items-center gap-1.5">
                        {method.status === 'APPROVED' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-rose-600" />}
                        <span>Metode Disetujui (Status: {method.status})</span>
                      </div>
                      {method.status !== 'APPROVED' && (
                        <button
                          onClick={() => router.push(method.status === 'UNDER_REVIEW' ? `/research/${record.id}/partner/review` : `/research/${record.id}/partner/method`)}
                          className="px-2 py-0.5 text-[9px] bg-teal-50 text-teal-600 border border-teal-200 rounded font-bold hover:bg-teal-100"
                        >
                          {method.status === 'UNDER_REVIEW' ? 'Review' : 'Kelola'}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 border rounded">
                      <div className="flex items-center gap-1.5">
                        {(method.partnerStatus === 'SELECTED' || method.method === 'SWAKELOLA') ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-rose-600" />}
                        <span>Mitra Terpilih / Swakelola ({method.method === 'SWAKELOLA' ? 'SWAKELOLA' : method.partnerStatus})</span>
                      </div>
                      {!(method.partnerStatus === 'SELECTED' || method.method === 'SWAKELOLA') && (
                        <button
                          onClick={() => router.push(`/research/${record.id}/partner/candidates`)}
                          className="px-2 py-0.5 text-[9px] bg-teal-50 text-teal-600 border border-teal-200 rounded font-bold hover:bg-teal-100"
                        >
                          Pilih Mitra
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : impl.status === 'ACTIVE' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-400 font-bold block uppercase text-[9px]">Status Pelaksanaan</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-50 text-purple-750 dark:bg-purple-950/20 dark:text-purple-400 font-bold border border-purple-200">
                  ACTIVE
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-2xs font-bold text-gray-500">
                  <span>Overall Monitoring Progress:</span>
                  <span>{overallProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 rounded text-emerald-750 dark:text-emerald-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <div>
                    <span className="font-bold block uppercase text-[9px] mb-0.5">Research Completed</span>
                    <span className="text-2xs font-semibold">Penelitian telah selesai dilaksanakan dan siap masuk ke tahap penyusunan laporan.</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-350">
                  READY FOR REPORTING
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Research Output Card Section (FASE 8) */}
      <Card className="border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/5 dark:bg-indigo-950/5">
        <CardHeader className="pb-3 border-b border-indigo-100 dark:border-indigo-900/40">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center justify-between">
            <span>Administrasi Output Penelitian & Kebijakan (Research Output)</span>
            {(impl.status === 'COMPLETED' || report.status !== 'NOT_STARTED') && (
              <button
                onClick={() => router.push(`/research/${record.id}/report`)}
                className="px-2.5 py-1 bg-indigo-605 hover:bg-indigo-700 text-white rounded text-3xs font-bold transition-all uppercase"
              >
                Open Output Overview
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-xs font-medium space-y-4">
          <div className="grid gap-6 sm:grid-cols-2">
            
            {/* Laporan Card */}
            <div className="p-4 border rounded bg-white dark:bg-gray-900 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="font-bold text-gray-800 dark:text-gray-250 block">Laporan Hasil Penelitian</span>
                  <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                    report.status === 'APPROVED' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                      : report.status === 'UNDER_REVIEW'
                      ? 'bg-amber-50 text-amber-700 border-amber-250'
                      : report.status === 'REVISION_REQUIRED'
                      ? 'bg-rose-50 text-rose-700 border-rose-250'
                      : report.status === 'DRAFT'
                      ? 'bg-gray-100 text-gray-600 border-gray-250'
                      : 'bg-gray-50 text-gray-400 border-gray-200'
                  }`}>
                    {report.status === 'NOT_STARTED' ? 'Not Started' : `v${report.version} • ${report.status}`}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                  Dokumen laporan riset, rangkuman eksekutif, temuan kualitatif, hambatan, serta kesimpulan studi.
                </p>
              </div>

              <div className="pt-2 border-t dark:border-gray-800 flex gap-2">
                {impl.status === 'COMPLETED' ? (
                  report.status === 'NOT_STARTED' ? (
                    isBrida ? (
                      <button
                        onClick={() => router.push(`/research/${record.id}/report/edit`)}
                        className="w-full text-center py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-3xs uppercase rounded transition-all shadow"
                      >
                        Create Report
                      </button>
                    ) : (
                      <span className="italic text-gray-400">Belum dimulai oleh BRIDA</span>
                    )
                  ) : (
                    <>
                      <button
                        onClick={() => router.push(`/research/${record.id}/report/preview`)}
                        className="grow text-center py-1 border border-gray-300 hover:bg-gray-55 rounded text-gray-705 font-bold text-3xs uppercase bg-white dark:bg-gray-950 dark:border-gray-800 dark:text-gray-300"
                      >
                        Preview
                      </button>
                      {isBrida && report.status !== 'APPROVED' && report.status !== 'UNDER_REVIEW' && (
                        <button
                          onClick={() => router.push(`/research/${record.id}/report/edit`)}
                          className="px-3 text-center py-1 border border-indigo-200 hover:bg-indigo-50/20 text-indigo-650 font-bold text-3xs uppercase rounded bg-white dark:bg-gray-950"
                        >
                          Edit
                        </button>
                      )}
                    </>
                  )
                ) : (
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/10 border border-amber-250 rounded text-amber-750 text-[10px] w-full text-center font-semibold">
                    Report can only be created after the research is completed.
                  </div>
                )}
              </div>
            </div>

            {/* Policy Brief Card */}
            <div className="p-4 border rounded bg-white dark:bg-gray-900 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="font-bold text-gray-800 dark:text-gray-250 block">Policy Brief Riset</span>
                  <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                    policyBrief.status === 'APPROVED' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                      : policyBrief.status === 'UNDER_REVIEW'
                      ? 'bg-amber-50 text-amber-700 border-amber-250'
                      : policyBrief.status === 'REVISION_REQUIRED'
                      ? 'bg-rose-50 text-rose-700 border-rose-250'
                      : policyBrief.status === 'DRAFT'
                      ? 'bg-gray-105 text-gray-650 border-gray-250'
                      : 'bg-gray-50 text-gray-400 border-gray-200'
                  }`}>
                    {policyBrief.status === 'NOT_STARTED' ? 'Not Started' : `v${policyBrief.version} • ${policyBrief.status}`}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                  Rangkuman padat rekomendasi kebijakan publik berbasis temuan kualitatif keparahan riset.
                </p>
              </div>

              <div className="pt-2 border-t dark:border-gray-800 flex gap-2">
                {impl.status === 'COMPLETED' ? (
                  policyBrief.status === 'NOT_STARTED' ? (
                    isBrida ? (
                      <button
                        onClick={() => router.push(`/research/${record.id}/policy-brief/edit`)}
                        className="w-full text-center py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-3xs uppercase rounded transition-all shadow"
                      >
                        Create Policy Brief
                      </button>
                    ) : (
                      <span className="italic text-gray-400">Belum dimulai oleh BRIDA</span>
                    )
                  ) : (
                    <>
                      <button
                        onClick={() => router.push(`/research/${record.id}/policy-brief`)}
                        className="grow text-center py-1 border border-gray-300 hover:bg-gray-55 rounded text-gray-705 font-bold text-3xs uppercase bg-white dark:bg-gray-950 dark:border-gray-800 dark:text-gray-300"
                      >
                        Preview
                      </button>
                      {isBrida && policyBrief.status !== 'APPROVED' && policyBrief.status !== 'UNDER_REVIEW' && (
                        <button
                          onClick={() => router.push(`/research/${record.id}/policy-brief/edit`)}
                          className="px-3 text-center py-1 border border-indigo-200 hover:bg-indigo-50/20 text-indigo-650 font-bold text-3xs uppercase rounded bg-white dark:bg-gray-950"
                        >
                          Edit
                        </button>
                      )}
                    </>
                  )
                ) : (
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/10 border border-amber-250 rounded text-amber-750 text-[10px] w-full text-center font-semibold">
                    Policy brief can only be created after the research is completed.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Ready for Recommendation Banner */}
          {report.status === 'APPROVED' && policyBrief.status === 'APPROVED' && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 rounded text-emerald-750 dark:text-emerald-450 flex items-center justify-between font-bold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <span className="block uppercase text-[9px] mb-0.5">Ready for Recommendation</span>
                  <span className="text-3xs font-semibold leading-normal block">Dokumen disetujui. Langkah selanjutnya penyusunan matriks rekomendasi Dinas Daerah (Fase 9).</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-350">
                TRUE
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Research Recommendation Card Section (FASE 9) */}
      <Card className="border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/5 dark:bg-indigo-950/5">
        <CardHeader className="pb-3 border-b border-indigo-100 dark:border-indigo-900/40">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center justify-between">
            <span>Rekomendasi Kebijakan BRIDA kepada OPD (Research Recommendation)</span>
            {recommendation.status !== 'NOT_STARTED' && (
              <button
                onClick={() => router.push(`/research/${record.id}/recommendation`)}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-3xs font-bold transition-all uppercase"
              >
                Open Recommendation Overview
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-xs font-medium space-y-4">
          <div className="p-4 border rounded bg-white dark:bg-gray-900 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-bold text-gray-800 dark:text-gray-250 block text-xs">
                  {recommendation.status === 'NOT_STARTED' ? 'Rekomendasi Belum Dibuat' : recommendation.title || 'Draf Rekomendasi'}
                </span>
                {recommendation.status !== 'NOT_STARTED' && (
                  <span className="text-[10px] text-gray-400 block font-normal mt-0.5">
                    Nomor: {recommendation.id} • Versi: v{recommendation.version}
                  </span>
                )}
              </div>
              <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                recommendation.status === 'PUBLISHED'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-350'
                  : recommendation.status === 'APPROVED' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                  : recommendation.status === 'UNDER_REVIEW'
                  ? 'bg-amber-50 text-amber-700 border-amber-250'
                  : recommendation.status === 'REVISION_REQUIRED'
                  ? 'bg-rose-50 text-rose-700 border-rose-250'
                  : recommendation.status === 'DRAFT'
                  ? 'bg-gray-100 text-gray-600 border-gray-250'
                  : 'bg-gray-50 text-gray-400 border-gray-200'
              }`}>
                {recommendation.status.replace('_', ' ')}
              </span>
            </div>

            <p className="text-[11px] text-gray-400 leading-normal">
              {recommendation.status === 'NOT_STARTED'
                ? 'Rekomendasi resmi yang ditujukan kepada Perangkat Daerah terkait berdasarkan temuan masalah hasil penelitian.'
                : recommendation.recommendationDescription}
            </p>

            <div className="pt-2 border-t dark:border-gray-800 flex flex-wrap gap-2 items-center justify-between">
              {/* Recipient info if drafted */}
              {recommendation.status !== 'NOT_STARTED' && (
                <div className="text-[10px] text-gray-400">
                  Target OPD: <span className="font-bold text-gray-700">Dinas Kesehatan (Dinkes)</span>
                </div>
              )}

              <div className="flex gap-2">
                {record.status === 'COMPLETED' && report.status === 'APPROVED' && policyBrief.status === 'APPROVED' ? (
                  recommendation.status === 'NOT_STARTED' ? (
                    isBrida ? (
                      <button
                        onClick={() => router.push(`/research/${record.id}/recommendation/new`)}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-3xs uppercase rounded transition-all shadow"
                      >
                        Create Recommendation
                      </button>
                    ) : (
                      <span className="italic text-gray-400 text-2xs">Belum dimulai oleh BRIDA Litbang</span>
                    )
                  ) : (
                    <>
                      <button
                        onClick={() => router.push(`/research/${record.id}/recommendation/preview`)}
                        className="px-3 py-1 border border-gray-300 hover:bg-gray-55 rounded text-gray-705 font-bold text-3xs uppercase bg-white dark:bg-gray-950 dark:border-gray-800 dark:text-gray-300"
                      >
                        Preview REC
                      </button>
                      
                      {isBrida && recommendation.status !== 'APPROVED' && recommendation.status !== 'PUBLISHED' && recommendation.status !== 'UNDER_REVIEW' && (
                        <button
                          onClick={() => router.push(`/research/${record.id}/recommendation/edit`)}
                          className="px-3 text-center py-1 border border-indigo-200 hover:bg-indigo-50/20 text-indigo-650 font-bold text-3xs uppercase rounded bg-white dark:bg-gray-950"
                        >
                          Edit
                        </button>
                      )}

                      {isKepalaBrida && recommendation.status === 'UNDER_REVIEW' && (
                        <button
                          onClick={() => router.push(`/research/${record.id}/recommendation/review`)}
                          className="px-3 text-center py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-3xs uppercase rounded shadow"
                        >
                          Review REC
                        </button>
                      )}
                    </>
                  )
                ) : (
                  <div className="p-2 bg-amber-50 dark:bg-amber-955/10 border border-amber-250 rounded text-amber-750 text-[10px] w-full text-left font-semibold">
                    Recommendation can only be created after the research report and policy brief are approved.
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Core Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* ================= LEFT SECTION (Title & Core Descriptions) ================= */}
        <div className="md:col-span-2 space-y-6">
          
          <Card>
            <CardHeader className="pb-3 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Bookmark className="h-4 w-4 text-blue-650" />
                <span>Dokumen Kebijakan & Permasalahan Acuan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs leading-relaxed">
              
              <div>
                <span className="text-gray-400 font-bold block uppercase text-[10px] mb-0.5">Judul Kegiatan Penelitian</span>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{record.title}</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div>
                  <span className="text-gray-400 font-bold block uppercase text-[10px]">Organisasi Pelaksana (OPD)</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-250">{record.opd}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block uppercase text-[10px]">Tingkat Prioritas</span>
                  <span className="font-bold text-rose-600 dark:text-rose-450 uppercase">{record.priority}</span>
                </div>
              </div>

              {sourceProposal && (
                <>
                  <div className="pt-3 border-t dark:border-gray-850">
                    <span className="text-gray-400 font-bold block uppercase text-[10px] mb-1">Rumusan Masalah Penelitian</span>
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50/50 dark:bg-gray-900/50 p-3 border rounded">
                      {sourceProposal.problemStatement}
                    </p>
                  </div>

                  <div className="pt-2">
                    <span className="text-gray-400 font-bold block uppercase text-[10px] mb-1">Tujuan Penelitian</span>
                    <p className="text-gray-750 dark:text-gray-300">{sourceProposal.objective}</p>
                  </div>

                  <div className="pt-2">
                    <span className="text-gray-400 font-bold block uppercase text-[10px] mb-1">Luaran yang Diharapkan</span>
                    <p className="font-semibold text-blue-750 dark:text-blue-400">{sourceProposal.expectedOutput}</p>
                  </div>
                </>
              )}

            </CardContent>
          </Card>

        </div>

        {/* ================= RIGHT SECTION (Status Metadata Info) ================= */}
        <div className="space-y-6">
          
          <Card>
            <CardHeader className="pb-3 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-emerald-600" />
                <span>Status Rekod</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div>
                <span className="text-gray-400 font-bold block uppercase text-[10px] mb-1">Status Penelitian</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold border bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200">
                  {record.status}
                </span>
              </div>

              <div>
                <span className="text-gray-400 font-bold block uppercase text-[10px]">Tanggal Penetapan</span>
                <span className="font-bold text-gray-800 dark:text-gray-250 block mt-0.5">{record.approvedDate}</span>
              </div>

              <div className="pt-3 border-t dark:border-gray-850 text-[10px] text-gray-400 leading-relaxed flex items-start gap-2 bg-gray-50 dark:bg-gray-900 p-3 rounded">
                <Info className="h-4.5 w-4.5 text-blue-650 shrink-0 mt-0.5" />
                <p>
                  <strong>Catatan Fase:</strong> Rekod Penelitian baru berada di tahap perencanaan (**PLANNED**). Penyusunan dokumen KAK (Kerangka Acuan Kerja) dan RAB (Rencana Anggaran Biaya) akan diselesaikan pada tahapan pengerjaan fase berikutnya.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

    </div>
  );
}
