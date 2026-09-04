'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReportStore } from '@/store/useReportStore';
import { useResearchStore } from '@/store/useResearchStore';
import { PageHeader } from '@/components/ui/page-header';
import { Printer, ArrowLeft, FileText } from 'lucide-react';

export default function PolicyBriefPreviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { researchRecords } = useResearchStore();
  const { getFindings, getPolicyBrief } = useReportStore();

  const id = params?.id || '';

  // Find target research record
  const record = useMemo(() => {
    return researchRecords.find((r) => r.id === id);
  }, [researchRecords, id]);

  const brief = getPolicyBrief(id);
  const findings = getFindings(id);

  // Selected findings details and evidences
  const selectedFindings = useMemo(() => {
    return findings.filter(f => brief.keyFindings.includes(f.id));
  }, [findings, brief.keyFindings]);

  const policyEvidences = useMemo(() => {
    const list: string[] = [];
    selectedFindings.forEach(f => {
      if (f.evidence && !list.includes(f.evidence)) {
        list.push(f.evidence);
      }
    });
    return list;
  }, [selectedFindings]);

  const handlePrint = () => {
    window.print();
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
      
      {/* Back button (hidden during print) */}
      <div className="print:hidden">
        <button
          onClick={() => router.push(`/research/${id}/report`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Overview</span>
        </button>
      </div>

      <PageHeader
        title="Pratinjau Policy Brief"
        description="Ringkasan eksekutif kebijakan publik terbitan SIM-RIDA."
        action={
          <button
            onClick={handlePrint}
            className="print:hidden px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1 shadow"
          >
            <Printer className="h-4 w-4" />
            <span>Print Policy Brief</span>
          </button>
        }
      />

      {/* Printable Sheet Wrapper (Section 25) */}
      <div className="max-w-3xl mx-auto bg-white text-gray-950 p-10 border shadow-lg print:border-none print:shadow-none print:p-0 print:max-w-full font-serif select-text">
        
        {/* Cover Header */}
        <div className="text-center space-y-3.5 pb-8 border-b-2 border-double border-slate-800">
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500 block">SIM-RIDA</span>
          <span className="text-[10px] uppercase font-bold block">Sistem Informasi Manajemen Riset Daerah</span>
          
          <h1 className="text-xl font-extrabold uppercase tracking-tight text-slate-905 max-w-xl mx-auto pt-4 leading-tight">
            POLICY BRIEF REKOMENDASI KEBIJAKAN
          </h1>

          <div className="py-6 space-y-1 text-xs">
            <p className="font-bold text-gray-700">TOPIK KEBIJAKAN:</p>
            <p className="font-extrabold uppercase text-slate-850 max-w-lg mx-auto text-sm">{brief.title || record.title}</p>
          </div>

          <div className="grid grid-cols-2 text-left max-w-md mx-auto text-3xs border rounded p-4 font-sans font-semibold">
            <div>Research ID: <span className="font-extrabold text-slate-800">{record.id}</span></div>
            <div>OPD Pengusul: <span className="font-extrabold text-slate-800">{record.opd}</span></div>
            <div className="mt-1">Versi Dokumen: <span className="font-extrabold text-slate-800">v{brief.version}</span></div>
            <div className="mt-1">Status Disetujui: <span className="font-extrabold text-slate-800">{brief.status}</span></div>
          </div>
        </div>

        {/* Policy Brief Sections */}
        <div className="pt-8 space-y-6 text-xs leading-relaxed">
          
          {/* Executive Summary */}
          <div className="space-y-1.5">
            <h2 className="font-extrabold text-sm border-b uppercase pb-1 text-slate-850">I. Executive Summary</h2>
            <p className="italic text-gray-800 indent-8 leading-relaxed text-justify">
              {brief.executiveSummary || 'Ringkasan eksekutif policy brief belum tersedia.'}
            </p>
          </div>

          {/* Policy Context */}
          <div className="space-y-1.5">
            <h2 className="font-extrabold text-sm border-b uppercase pb-1 text-slate-850">II. Policy Context (Konteks Kebijakan)</h2>
            <p className="indent-8 text-justify text-gray-800 leading-relaxed">
              {brief.policyContext || 'Konteks regulasi acuan atau dasar kebutuhan kebijakan daerah.'}
            </p>
          </div>

          {/* Key Problem */}
          <div className="space-y-1.5">
            <h2 className="font-extrabold text-sm border-b uppercase pb-1 text-slate-850">III. Fokus Masalah Utama (Key Problem)</h2>
            <pre className="whitespace-pre-wrap font-serif text-xs leading-relaxed text-gray-800 text-justify">
              {brief.keyProblem || 'Fokus permasalahan utama yang diidentifikasi.'}
            </pre>
          </div>

          {/* Evidence reference cards */}
          <div className="space-y-2">
            <h2 className="font-extrabold text-sm border-b uppercase pb-1 text-slate-850">IV. Policy Evidence (Bukti Dokumen Pendukung)</h2>
            {policyEvidences.length === 0 ? (
              <p className="text-gray-500 italic text-center py-2 font-sans text-3xs">Belum ada dokumen pembuktian kualitatif terpilih.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 font-sans">
                {policyEvidences.map((ev, idx) => (
                  <div key={idx} className="p-3.5 border rounded bg-slate-50/50 flex items-center gap-2 text-3xs">
                    <FileText className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <span className="font-bold text-gray-700 block truncate">{ev}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Key Findings list */}
          <div className="space-y-2">
            <h2 className="font-extrabold text-sm border-b uppercase pb-1 text-slate-850">V. Temuan Kunci Riset (Key Findings Mapping)</h2>
            {selectedFindings.length === 0 ? (
              <p className="text-gray-500 italic text-center py-2 font-sans text-3xs">Belum ada temuan riset terpilih.</p>
            ) : (
              <div className="space-y-3 font-sans">
                {selectedFindings.map((f, idx) => (
                  <div key={f.id} className="p-3 border rounded bg-slate-50/50 space-y-1 text-3xs">
                    <div className="flex justify-between font-extrabold">
                      <span className="text-slate-850 text-2xs">{idx + 1}. {f.title}</span>
                      <span className="text-[8px] border px-1 rounded">{f.severity}</span>
                    </div>
                    <p className="text-gray-600 leading-normal text-justify">{f.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conclusion */}
          <div className="space-y-1.5">
            <h2 className="font-extrabold text-sm border-b uppercase pb-1 text-slate-850">VI. Kesimpulan Kebijakan</h2>
            <p className="indent-8 text-justify text-gray-800 leading-relaxed">
              {brief.conclusion || 'Kesimpulan policy brief belum lengkap.'}
            </p>
          </div>

          {/* Policy Implication */}
          <div className="space-y-1.5">
            <h2 className="font-extrabold text-sm border-b uppercase pb-1 text-slate-850">VII. Implikasi Kebijakan (Policy Implication)</h2>
            <p className="indent-8 text-justify text-gray-800 leading-relaxed font-bold">
              {brief.policyImplication || 'Implikasi jika tidak dilakukan standardisasi kebijakan secara mendalam.'}
            </p>
          </div>

        </div>

        {/* Footer info print page */}
        <div className="mt-12 text-center text-[10px] text-gray-400 font-sans border-t pt-4 font-bold select-none uppercase tracking-widest">
          Generated from SIM-RIDA • Policy Brief Publik Daerah
        </div>

      </div>

    </div>
  );
}
