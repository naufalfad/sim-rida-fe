'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRecommendationStore } from '@/store/useRecommendationStore';
import { useReportStore } from '@/store/useReportStore';
import { useResearchStore } from '@/store/useResearchStore';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_OPDS } from '@/mock/opd';
import {
  ArrowLeft,
  Award,
  History,
  Workflow,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

export default function RecommendationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { researchRecords } = useResearchStore();
  const { getReport, getFindings, getPolicyBrief } = useReportStore();
  const { getAllRecommendations, getActivities } = useRecommendationStore();

  const id = params?.id || '';

  // Find recommendation by id (REC-2026-xxx)
  const rec = useMemo(() => {
    const all = getAllRecommendations();
    return all.find(r => r.id === id);
  }, [getAllRecommendations, id]);

  const researchId = rec ? rec.researchId : '';
  const activities = getActivities(researchId);

  const record = useMemo(() => {
    return researchRecords.find((r) => r.id === researchId);
  }, [researchRecords, researchId]);

  const report = getReport(researchId);
  const findings = getFindings(researchId);
  const brief = getPolicyBrief(researchId);

  const selectedFindings = useMemo(() => {
    return findings.filter(f => rec?.findingIds.includes(f.id));
  }, [findings, rec]);

  const primaryOpdName = useMemo(() => {
    if (!rec) return '-';
    const opd = MOCK_OPDS.find(o => o.id === rec.primaryRecipientId);
    return opd ? opd.name : '-';
  }, [rec]);

  const supportingOpdNames = useMemo(() => {
    if (!rec) return [];
    return rec.supportingRecipientIds.map(sId => {
      const opd = MOCK_OPDS.find(o => o.id === sId);
      return opd ? opd.name : '';
    }).filter(Boolean);
  }, [rec]);

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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-350';
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-250';
      case 'UNDER_REVIEW':
        return 'bg-amber-50 text-amber-700 border-amber-250';
      case 'REVISION_REQUIRED':
        return 'bg-rose-50 text-rose-700 border-rose-250';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-250';
    }
  };

  if (!rec || !record) {
    return (
      <div className="space-y-6 text-center py-12 font-sans">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Rekomendasi Tidak Ditemukan</h2>
        <button
          onClick={() => router.push('/recommendations')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold"
        >
          Kembali ke Center
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push('/recommendations')}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Recommendation Center</span>
        </button>
      </div>

      <PageHeader
        title="Recommendation Detail"
        description={`Inventori detail surat rekomendasi resmi BRIDA: "${rec.title}"`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left column: main recommendation contents */}
        <div className="md:col-span-2 space-y-6 text-xs font-semibold leading-relaxed">
          
          {/* Card Summary details */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">Surat Rekomendasi Resmi BRIDA</span>
                  <h2 className="text-sm font-bold text-gray-800 leading-snug mt-1">{rec.title}</h2>
                </div>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-bold border ${getStatusBadgeClass(rec.status)}`}>
                  {rec.status.replace('_', ' ')}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-4 text-3xs font-semibold">
                <div>Nomor Surat: <span className="font-extrabold text-slate-800">{rec.id}</span></div>
                <div>Versi: <span className="font-extrabold text-slate-800">v{rec.version}</span></div>
                <div>Priority Level: <span className="font-extrabold text-rose-700">{rec.priority}</span></div>
                <div>Tanggal Rilis: <span className="font-extrabold text-slate-800">{rec.publishedDate || '-'}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Research Basis & Traceability links (Section 38 & 39) */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Workflow className="h-4 w-4 text-indigo-650" />
                <span>Referensi Penelitian Acuan (Research Traceability)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 font-semibold">
              <div className="p-3 border rounded bg-indigo-50/5 text-3xs font-bold leading-normal">
                <span className="text-[8px] text-indigo-650 uppercase font-extrabold block">Research Title</span>
                <span className="font-bold text-indigo-900 block text-xs mt-1">{record.title}</span>
                <span className="text-[9px] text-gray-400 block font-normal mt-0.5">ID: {record.id} • OPD Pengusul: {record.opd}</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-3xs">
                <div className="p-3 border rounded bg-slate-50/50">
                  <span className="text-[8px] text-gray-400 uppercase block font-bold">Research Report</span>
                  <span className="font-bold text-gray-700 block mt-1">Laporan Hasil Penelitian v{report.version}</span>
                  <span className="text-[9px] text-gray-450 block font-normal">Status: {report.status}</span>
                </div>
                <div className="p-3 border rounded bg-slate-50/50">
                  <span className="text-[8px] text-gray-400 uppercase block font-bold">Policy Brief</span>
                  <span className="font-bold text-gray-700 block mt-1">Policy Brief Kebijakan v{brief.version}</span>
                  <span className="text-[9px] text-gray-455 block font-normal">Status: {brief.status}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Problem Statement & Description */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider">Masalah & Rekomendasi Teknis</span>
              
              <div>
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Problem Statement</span>
                <pre className="whitespace-pre-wrap font-sans text-xs text-gray-700 leading-relaxed text-justify mt-0.5 font-semibold">{rec.problemStatement}</pre>
              </div>

              <div className="pt-3 border-t">
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Rekomendasi BRIDA Kepada OPD</span>
                <p className="text-indigo-900 font-bold bg-indigo-50/20 p-3.5 border rounded leading-relaxed text-justify mt-0.5">"{rec.recommendationDescription}"</p>
              </div>

              <div className="pt-3 border-t">
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Dampak Kebijakan yang Diharapkan (Expected Policy Impact)</span>
                <p className="text-slate-800 mt-0.5 leading-relaxed text-justify font-bold">{rec.expectedPolicyImpact}</p>
              </div>
            </CardContent>
          </Card>

          {/* Linked Findings references list (Section 38 & 39) */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Temuan Lapangan Terkait (Linked Findings References)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 font-sans">
              {selectedFindings.length === 0 ? (
                <span className="text-xs italic text-gray-400 font-normal">Tidak ada temuan lapangan terkait.</span>
              ) : (
                <div className="space-y-2.5">
                  {selectedFindings.map((f, idx) => (
                    <div key={f.id} className="p-3 border rounded bg-slate-50/50 space-y-1 text-3xs font-semibold leading-relaxed">
                      <div className="flex justify-between font-extrabold">
                        <span>{idx + 1}. {f.title}</span>
                        <span className="text-[8px] uppercase border px-1 rounded">{f.severity}</span>
                      </div>
                      <p className="text-gray-500 font-normal">{f.description}</p>
                      <p className="text-red-750 font-bold">Dampak: <span className="font-normal italic text-gray-700">{f.impact}</span></p>
                      <span className="text-[8px] text-gray-400 font-normal block pt-0.5">Evidence: {f.evidence}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right column: approvals, recipient OPDs lists, activities logs */}
        <div className="space-y-6">
          
          {/* Target recipients */}
          <Card>
            <CardContent className="p-6 space-y-4 text-xs font-semibold select-none">
              <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider">OPD Penerima Rekomendasi</span>
              
              <div className="p-3 border rounded bg-indigo-50/5">
                <span className="text-[8px] text-gray-400 uppercase font-bold block">Penerima Utama</span>
                <span className="font-bold text-gray-800 block text-xs mt-1">{primaryOpdName}</span>
              </div>

              {supportingOpdNames.length > 0 && (
                <div className="p-3 border rounded bg-gray-50/50">
                  <span className="text-[8px] text-gray-400 uppercase font-bold block">Penerima Pendukung</span>
                  <div className="mt-1 space-y-1">
                    {supportingOpdNames.map((name, idx) => (
                      <span key={idx} className="font-bold text-gray-700 block text-xs">• {name}</span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit activities logs */}
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
                      <p className="font-bold text-gray-850">{act.action}</p>
                      <p className="text-[10px] text-gray-450 italic leading-relaxed font-normal">{act.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
