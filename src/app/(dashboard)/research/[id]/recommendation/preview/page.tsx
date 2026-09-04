'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRecommendationStore } from '@/store/useRecommendationStore';
import { useReportStore } from '@/store/useReportStore';
import { useResearchStore } from '@/store/useResearchStore';
import { PageHeader } from '@/components/ui/page-header';
import { MOCK_OPDS } from '@/mock/opd';
import { ArrowLeft, Printer } from 'lucide-react';

export default function RecommendationPreviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { researchRecords } = useResearchStore();
  const { getFindings } = useReportStore();
  const { getRecommendation } = useRecommendationStore();

  const id = params?.id || '';

  // Find target research record
  const record = useMemo(() => {
    return researchRecords.find((r) => r.id === id);
  }, [researchRecords, id]);

  const rec = getRecommendation(id);
  const findings = getFindings(id);

  const selectedFindings = useMemo(() => {
    return findings.filter(f => rec.findingIds.includes(f.id));
  }, [findings, rec.findingIds]);

  const primaryOpdName = useMemo(() => {
    const opd = MOCK_OPDS.find(o => o.id === rec.primaryRecipientId);
    return opd ? opd.name : '-';
  }, [rec.primaryRecipientId]);

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
          onClick={() => router.push(`/research/${id}/recommendation`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Overview</span>
        </button>
      </div>

      <PageHeader
        title="Pratinjau Surat Rekomendasi"
        description="Dokumen cetak keputusan resmi Rekomendasi BRIDA kepada OPD."
        action={
          <button
            onClick={handlePrint}
            className="print:hidden px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1 shadow"
          >
            <Printer className="h-4 w-4" />
            <span>Print Rekomendasi</span>
          </button>
        }
      />

      {/* Printable Sheet Wrapper (Section 31) */}
      <div className="max-w-3xl mx-auto bg-white text-gray-950 p-12 border shadow-lg print:border-none print:shadow-none print:p-0 print:max-w-full font-serif select-text">
        
        {/* Government Header Prints */}
        <div className="text-center space-y-1.5 pb-6 border-b-4 border-slate-900 leading-normal select-none">
          <h2 className="text-base font-extrabold uppercase tracking-wide">PEMERINTAH KABUPATEN INDONESIA</h2>
          <h1 className="text-lg font-extrabold uppercase tracking-tight">BADAN RISET DAN INOVASI DAERAH (BRIDA)</h1>
          <p className="text-[10px] font-sans font-semibold text-gray-500">
            Jalan Lingkar Kabupaten No. 45, Gedung Litbang Lantai 2 • Telp: (021) 855-4321 • Email: brida@kabupaten.go.id
          </p>
        </div>

        {/* Document Meta Info */}
        <div className="pt-8 space-y-4 text-xs font-sans font-semibold select-none leading-relaxed">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <div>Nomor: <span className="font-extrabold text-slate-800">{rec.id}</span></div>
              <div>Perihal: <span className="font-extrabold text-slate-800">Rekomendasi Hasil Penelitian Kebijakan Daerah</span></div>
            </div>
            <div className="text-right">
              <div>Tanggal: <span className="font-bold text-slate-700">{rec.publishedDate || '10 October 2026'}</span></div>
            </div>
          </div>

          <div className="pt-2">
            <p className="font-bold text-slate-600 uppercase text-[9px]">Ditujukan Kepada Yth:</p>
            <p className="font-extrabold text-slate-900 text-sm">{primaryOpdName}</p>
            <p className="text-[10px] text-gray-500 font-normal leading-normal italic mt-0.5">Kabupaten Indonesia</p>
          </div>
        </div>

        {/* Recommendation formal letter contents */}
        <div className="pt-8 space-y-6 text-xs leading-relaxed text-justify text-slate-900">
          
          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 border-b uppercase pb-0.5">I. Latar Belakang Masalah</h3>
            <p className="indent-8 text-gray-805">
              Berdasarkan hasil pelaksanaan riset daerah dengan topik: <strong className="italic text-slate-850">"{record.title}"</strong>, diidentifikasi adanya beberapa hambatan koordinasi teknis dan keterbatasan infrastruktur pelayanan publik yang membutuhkan intervensi perbaikan kebijakan sesegera mungkin.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 border-b uppercase pb-0.5">II. Dasar Referensi Penelitian</h3>
            <p className="text-gray-800">Dokumen analisis ini disusun secara sah mengacu pada dokumen output riset:</p>
            <ul className="list-disc pl-5 space-y-1 text-3xs font-sans text-gray-700">
              {rec.researchBasis.map((basis, idx) => (
                <li key={idx} className="font-semibold">• Dokumen Administrasi: {basis} (v{rec.version})</li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 border-b uppercase pb-0.5">III. Permasalahan (Problem Statement)</h3>
            <pre className="whitespace-pre-wrap font-serif text-xs text-gray-800 leading-relaxed text-justify">
              {rec.problemStatement}
            </pre>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 border-b uppercase pb-0.5">IV. Temuan Utama & Berkas Pendukung (Findings)</h3>
            <div className="space-y-2.5 font-sans">
              {selectedFindings.map((f, idx) => (
                <div key={f.id} className="p-3 border rounded bg-slate-50/50 space-y-1 text-3xs leading-relaxed">
                  <div className="flex justify-between font-extrabold">
                    <span>{idx + 1}. {f.title}</span>
                    <span className="text-[8px] uppercase border px-1 rounded">{f.severity}</span>
                  </div>
                  <p className="text-gray-600 font-normal">{f.description}</p>
                  <p className="text-red-750 font-bold">Dampak: <span className="font-normal italic text-gray-700">{f.impact}</span></p>
                  <span className="text-[8px] text-gray-400 font-normal">Evidence: {f.evidence}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 border-b uppercase pb-0.5">V. Rekomendasi BRIDA</h3>
            <p className="indent-8 font-bold text-slate-950 bg-indigo-50/20 p-4 border border-indigo-150 rounded leading-relaxed text-justify">
              "{rec.recommendationDescription}"
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 border-b uppercase pb-0.5">VI. Dampak yang Diharapkan (Expected Policy Impact)</h3>
            <p className="indent-8 text-gray-850 font-bold">{rec.expectedPolicyImpact}</p>
          </div>

          <div className="space-y-1.5 pt-2">
            <h3 className="font-bold text-slate-900 border-b uppercase pb-0.5">VII. Penutup</h3>
            <p className="indent-8 text-gray-750">
              Demikian surat rekomendasi hasil riset kebijakan daerah ini diterbitkan secara resmi untuk dapat diakomodasi dan ditindaklanjuti sebagaimana mestinya oleh perangkat daerah terkait demi optimalisasi pelayanan masyarakat kabupaten.
            </p>
          </div>

        </div>

        {/* Sign-off Footer block (Section 31) */}
        <div className="mt-14 flex justify-end font-sans select-none text-xs">
          <div className="text-center space-y-16">
            <div className="space-y-1 font-semibold">
              <p className="font-bold">BADAN RISET & INOVASI DAERAH</p>
              <p>Kepala BRIDA,</p>
            </div>
            <div className="space-y-0.5">
              <p className="font-extrabold underline text-slate-900">Dr. Ahmad Dahlan, M.Si.</p>
              <p className="text-[10px] text-gray-400 font-semibold">NIP. 19780512 200312 1 002</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
