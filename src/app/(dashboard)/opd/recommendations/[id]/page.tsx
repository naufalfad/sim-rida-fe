'use client';

import React, { useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRecommendationStore } from '@/store/useRecommendationStore';
import { useReportStore } from '@/store/useReportStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_OPDS } from '@/mock/opd';
import {
  ArrowLeft,
  Printer,
  Workflow,
  CheckCircle2,
  Info,
  Layers,
  FileText
} from 'lucide-react';

export default function OpdRecommendationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { user } = useAuthStore();
  const { researchRecords } = useResearchStore();
  const { getReport, getFindings, getPolicyBrief } = useReportStore();
  const { getAllRecommendations } = useRecommendationStore();

  const id = params?.id || '';

  // Access checks
  useEffect(() => {
    if (user && user.role !== 'OPD') {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  // Find recommendation by id (REC-2026-xxx)
  const rec = useMemo(() => {
    const all = getAllRecommendations();
    return all.find(r => r.id === id && r.status === 'PUBLISHED');
  }, [getAllRecommendations, id]);

  const researchId = rec ? rec.researchId : '';

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

  const handlePrint = () => {
    window.print();
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

  if (!rec || !record) {
    return (
      <div className="space-y-6 text-center py-12 font-sans">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Rekomendasi Tidak Ditemukan</h2>
        <button
          onClick={() => router.push('/opd/recommendations')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back button (hidden during print) */}
      <div className="print:hidden">
        <button
          onClick={() => router.push('/opd/recommendations')}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Rekomendasi</span>
        </button>
      </div>

      <PageHeader
        title="Detail Rekomendasi OPD"
        description="Lembar resmi rekomendasi BRIDA yang wajib diakomodasi untuk implementasi perbaikan pelayanan daerah."
        action={
          <button
            onClick={handlePrint}
            className="print:hidden px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1 shadow"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Cetak</span>
          </button>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Column: Core contents */}
        <div className="md:col-span-2 space-y-6 text-xs font-semibold leading-relaxed">
          
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">Surat Rekomendasi BRIDA</span>
                  <h2 className="text-sm font-bold text-gray-800 leading-snug mt-1">{rec.title}</h2>
                </div>
                <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-bold border bg-emerald-100 text-emerald-800 border-emerald-350">
                  RECEIVED
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 text-3xs font-semibold">
                <div>Nomor: <span className="font-extrabold text-slate-800">{rec.id}</span></div>
                <div>Issued By: <span className="font-extrabold text-slate-800">BRIDA Kabupaten</span></div>
                <div>Published Date: <span className="font-extrabold text-slate-800">{rec.publishedDate || '-'}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Research Basis Traceability */}
          <Card className="print:hidden">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Workflow className="h-4 w-4 text-indigo-650" />
                <span>Riset Acuan (Research Traceability)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="p-3 border rounded bg-indigo-50/5 text-3xs font-bold leading-normal">
                <span className="text-[8px] text-indigo-650 uppercase font-extrabold block">Research Title</span>
                <span className="font-bold text-indigo-900 block text-xs mt-1">{record.title}</span>
                <span className="text-[9px] text-gray-400 block font-normal mt-0.5">ID: {record.id} • OPD Pengusul: {record.opd}</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-3xs font-semibold">
                <div className="p-3 border rounded bg-slate-50/50">
                  <span className="text-[8px] text-gray-400 block font-bold uppercase">Research Report</span>
                  <span className="font-bold text-gray-700 block mt-1">Laporan Hasil Penelitian v{report.version}</span>
                </div>
                <div className="p-3 border rounded bg-slate-50/50">
                  <span className="text-[8px] text-gray-400 block font-bold uppercase">Policy Brief</span>
                  <span className="font-bold text-gray-700 block mt-1">Policy Brief Kebijakan v{brief.version}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Problem, recommendation description & impact */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Fokus Permasalahan (Problem Statement)</span>
                <pre className="whitespace-pre-wrap font-sans text-xs text-gray-700 leading-relaxed text-justify mt-0.5 font-semibold">{rec.problemStatement}</pre>
              </div>

              <div className="pt-3 border-t">
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Rekomendasi Kebijakan BRIDA</span>
                <p className="text-indigo-900 font-bold bg-indigo-50/20 p-3.5 border rounded leading-relaxed text-justify mt-0.5">"{rec.recommendationDescription}"</p>
              </div>

              <div className="pt-3 border-t">
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Dampak Kebijakan yang Diharapkan</span>
                <p className="text-slate-800 leading-relaxed mt-0.5 text-justify font-bold">{rec.expectedPolicyImpact}</p>
              </div>
            </CardContent>
          </Card>

          {/* Linked Findings references list (Section 38 & 39) */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Daftar Temuan Lapangan & Berkas Pendukung (Linked Findings)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 font-sans">
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
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Priority & Issued By signs */}
        <div className="space-y-6">
          
          <Card>
            <CardContent className="p-6 space-y-4 text-xs font-semibold select-none">
              <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider">Priority Level</span>
              <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold border ${getPriorityBadgeClass(rec.priority)}`}>
                {rec.priority}
              </span>
            </CardContent>
          </Card>

          {/* Issued block */}
          <Card>
            <CardContent className="p-6 space-y-4 text-xs font-semibold select-none text-center">
              <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider text-left border-b pb-1">Penetap Dokumen</span>
              <div className="space-y-12 pt-2">
                <div className="space-y-0.5">
                  <p className="font-extrabold text-slate-800">BADAN RISET & INOVASI DAERAH</p>
                  <p className="text-[10px] text-gray-400">Kepala BRIDA,</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-extrabold underline text-slate-900">Dr. Ahmad Dahlan, M.Si.</p>
                  <p className="text-[9px] text-gray-400 font-semibold">NIP. 19780512 200312 1 002</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
