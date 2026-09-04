'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReportStore } from '@/store/useReportStore';
import { useResearchStore } from '@/store/useResearchStore';
import { usePartnerStore } from '@/store/usePartnerStore';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Printer, FileText } from 'lucide-react';

export default function ReportPreviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { researchRecords } = useResearchStore();
  const { getReport, getFindings } = useReportStore();
  const { getMethod } = usePartnerStore();

  const id = params?.id || '';

  // Find target research record
  const record = useMemo(() => {
    return researchRecords.find((r) => r.id === id);
  }, [researchRecords, id]);

  const report = getReport(id);
  const findings = getFindings(id);
  const method = getMethod(id);

  // Parse structured conclusion JSON
  const conclusionObj = useMemo(() => {
    try {
      if (report.conclusion.startsWith('{')) {
        return JSON.parse(report.conclusion);
      }
    } catch {
      // fallback
    }
    return {
      mainConclusion: report.conclusion || '',
      keyLessons: '',
      dataLimitation: '',
      methodologicalLimitation: '',
      implementationLimitation: '',
      otherLimitation: '',
    };
  }, [report.conclusion]);

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
        title="Pratinjau Dokumen Laporan"
        description="Dokumen cetak resmi keluaran Laporan Hasil Penelitian SIM-RIDA."
        action={
          <button
            onClick={handlePrint}
            className="print:hidden px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1 shadow"
          >
            <Printer className="h-4 w-4" />
            <span>Print Laporan</span>
          </button>
        }
      />

      {/* Printable Sheet Wrapper (Section 24) */}
      <div className="max-w-3xl mx-auto bg-white text-gray-950 p-10 border shadow-lg print:border-none print:shadow-none print:p-0 print:max-w-full font-serif select-text">
        
        {/* Cover Header */}
        <div className="text-center space-y-3.5 pb-8 border-b-2 border-double border-slate-800">
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500 block">SIM-RIDA</span>
          <span className="text-[10px] uppercase font-bold block">Sistem Informasi Manajemen Riset Daerah</span>
          
          <h1 className="text-xl font-extrabold uppercase tracking-tight text-slate-905 max-w-xl mx-auto pt-4 leading-tight">
            LAPORAN HASIL PENELITIAN & KAJIAN KELAYAKAN DAERAH
          </h1>

          <div className="py-6 space-y-1 text-xs">
            <p className="font-bold text-gray-700">JUDUL RISET:</p>
            <p className="font-extrabold uppercase text-slate-850 max-w-lg mx-auto text-sm">{report.title || record.title}</p>
          </div>

          <div className="grid grid-cols-2 text-left max-w-md mx-auto text-3xs border rounded p-4 font-sans font-semibold">
            <div>Research ID: <span className="font-extrabold text-slate-800">{record.id}</span></div>
            <div>OPD Pengusul: <span className="font-extrabold text-slate-800">{record.opd}</span></div>
            <div className="mt-1">Versi Dokumen: <span className="font-extrabold text-slate-800">v{report.version}</span></div>
            <div className="mt-1">Status Disahkan: <span className="font-extrabold text-slate-800">{report.status}</span></div>
          </div>
        </div>

        {/* Core Contents Sections */}
        <div className="pt-8 space-y-6 text-xs leading-relaxed">
          
          {/* Executive Summary */}
          <div className="space-y-1.5">
            <h2 className="font-extrabold text-sm border-b uppercase pb-1 text-slate-850">1. Executive Summary</h2>
            <p className="italic text-gray-800 indent-8 leading-relaxed text-justify">
              {report.executiveSummary || 'Dokumen ringkasan eksekutif pengerjaan kajian belum lengkap.'}
            </p>
          </div>

          {/* Latar Belakang */}
          {report.background && (
            <div className="space-y-1.5">
              <h2 className="font-extrabold text-sm border-b uppercase pb-1 text-slate-850">2. Latar Belakang</h2>
              <p className="indent-8 text-justify text-gray-800 leading-relaxed">{report.background}</p>
            </div>
          )}

          {/* Tujuan */}
          {report.objective && (
            <div className="space-y-1.5">
              <h2 className="font-extrabold text-sm border-b uppercase pb-1 text-slate-850">3. Tujuan Penelitian</h2>
              <p className="text-gray-800 leading-relaxed text-justify">{report.objective}</p>
            </div>
          )}

          {/* Metodologi & Ruang Lingkup */}
          {(report.methodology || report.scope) && (
            <div className="space-y-1.5">
              <h2 className="font-extrabold text-sm border-b uppercase pb-1 text-slate-850">4. Metodologi & Ruang Lingkup</h2>
              {report.methodology && <p className="text-gray-800 leading-relaxed mb-2 text-justify"><strong>Metodologi:</strong> {report.methodology}</p>}
              {report.scope && <p className="text-gray-800 leading-relaxed text-justify"><strong>Ruang Lingkup:</strong> {report.scope}</p>}
            </div>
          )}

          {/* Hasil Penelitian */}
          <div className="space-y-1.5">
            <h2 className="font-extrabold text-sm border-b uppercase pb-1 text-slate-850">5. Hasil Penelitian (Results)</h2>
            <p className="indent-8 text-justify text-gray-800 leading-relaxed">{report.results || 'Data hasil penelitian primer/sekunder belum lengkap.'}</p>
          </div>

          {/* Research Findings */}
          <div className="space-y-2">
            <h2 className="font-extrabold text-sm border-b uppercase pb-1 text-slate-850">6. Temuan Masalah Penelitian (Research Findings)</h2>
            {findings.length === 0 ? (
              <p className="text-gray-500 italic text-center py-2 font-sans text-3xs">Belum ada temuan pengerjaan terdaftar.</p>
            ) : (
              <div className="space-y-3 font-sans">
                {findings.map((f, idx) => (
                  <div key={f.id} className="p-3.5 border rounded bg-slate-50/50 space-y-1.5 text-3xs">
                    <div className="flex justify-between font-extrabold">
                      <span className="text-slate-850 text-2xs">{idx + 1}. {f.title}</span>
                      <span className="text-[9px] uppercase border px-1 rounded">{f.severity}</span>
                    </div>
                    <p className="text-gray-650 font-normal leading-relaxed text-justify">{f.description}</p>
                    <p className="text-red-750 font-bold">Dampak: <span className="font-normal italic text-gray-800">{f.impact}</span></p>
                    <div className="text-[9px] text-gray-400 font-normal">Evidence File: {f.evidence}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pembahasan */}
          {report.discussion && (
            <div className="space-y-1.5">
              <h2 className="font-extrabold text-sm border-b uppercase pb-1 text-slate-850">7. Pembahasan</h2>
              <p className="indent-8 text-justify text-gray-800 leading-relaxed">{report.discussion}</p>
            </div>
          )}

          {/* Kesimpulan */}
          <div className="space-y-3.5">
            <h2 className="font-extrabold text-sm border-b uppercase pb-1 text-slate-850">8. Kesimpulan & Batasan Studi</h2>
            
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800">Kesimpulan Utama:</h3>
              <p className="indent-8 text-justify text-gray-800 leading-relaxed">{conclusionObj.mainConclusion || 'Kesimpulan pengerjaan riset belum terisi.'}</p>
            </div>

            {conclusionObj.keyLessons && (
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-800">Pelajaran Penting:</h3>
                <p className="text-gray-800 leading-relaxed text-justify">{conclusionObj.keyLessons}</p>
              </div>
            )}

            {/* Limitations block */}
            {(conclusionObj.dataLimitation || conclusionObj.methodologicalLimitation || conclusionObj.implementationLimitation || conclusionObj.otherLimitation) && (
              <div className="pt-2 space-y-1.5">
                <h3 className="font-bold text-slate-800">Batasan Penelitian (Limitations):</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 text-3xs font-sans">
                  {conclusionObj.dataLimitation && <li><strong>Data:</strong> {conclusionObj.dataLimitation}</li>}
                  {conclusionObj.methodologicalLimitation && <li><strong>Metodologis:</strong> {conclusionObj.methodologicalLimitation}</li>}
                  {conclusionObj.implementationLimitation && <li><strong>Pelaksanaan:</strong> {conclusionObj.implementationLimitation}</li>}
                  {conclusionObj.otherLimitation && <li><strong>Lainnya:</strong> {conclusionObj.otherLimitation}</li>}
                </ul>
              </div>
            )}

          </div>

          {/* Lampiran */}
          {report.appendices && (
            <div className="space-y-1.5 pt-4">
              <h2 className="font-extrabold text-sm border-b uppercase pb-1 text-slate-850">9. Lampiran (Appendices)</h2>
              <pre className="whitespace-pre-wrap font-sans text-3xs leading-relaxed text-gray-600 bg-slate-50 p-3.5 rounded border">{report.appendices}</pre>
            </div>
          )}

        </div>

        {/* Footer info print page */}
        <div className="mt-12 text-center text-[10px] text-gray-400 font-sans border-t pt-4 font-bold select-none uppercase tracking-widest">
          Generated from SIM-RIDA • Sistem Informasi Manajemen Riset Daerah
        </div>

      </div>

    </div>
  );
}
