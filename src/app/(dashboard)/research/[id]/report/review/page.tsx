'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReportStore } from '@/store/useReportStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { usePartnerStore } from '@/store/usePartnerStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { FileText, ArrowLeft, CheckCircle2, AlertTriangle, Send, X, Check } from 'lucide-react';

export default function ReportReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { researchRecords } = useResearchStore();
  const { getReport, getFindings, getPolicyBrief, approveReport, returnReportForRevision } = useReportStore();
  const { getMethod } = usePartnerStore();

  const id = params?.id || '';
  const isKepalaBrida = user?.role === 'KEPALA_BRIDA';

  // Access check
  useEffect(() => {
    if (user && user.role !== 'KEPALA_BRIDA') {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  // Find target research record
  const record = useMemo(() => {
    return researchRecords.find((r) => r.id === id);
  }, [researchRecords, id]);

  const report = getReport(id);
  const findings = getFindings(id);
  const brief = getPolicyBrief(id);
  const method = getMethod(id);

  // Redirect if not in UNDER_REVIEW status (already decided)
  useEffect(() => {
    if (report && report.status !== 'UNDER_REVIEW') {
      toast('Laporan tidak sedang dalam status menunggu review.', 'warning');
      router.replace(`/research/${id}/report`);
    }
  }, [report, id, router, toast]);

  // Checklist states (Section 31)
  const [rep1, setRep1] = useState(false);
  const [rep2, setRep2] = useState(false);
  const [rep3, setRep3] = useState(false);
  const [rep4, setRep4] = useState(false);
  const [rep5, setRep5] = useState(false);

  const [pol1, setPol1] = useState(false);
  const [pol2, setPol2] = useState(false);
  const [pol3, setPol3] = useState(false);
  const [pol4, setPol4] = useState(false);
  const [pol5, setPol5] = useState(false);

  // Notes state
  const [reviewNotes, setReviewNotes] = useState('');

  // Confirmation modals state
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  const handleApprove = () => {
    approveReport(id, reviewNotes, user?.name || 'Kepala BRIDA');
    setIsApproveOpen(false);
    toast('Laporan hasil penelitian & policy brief resmi disetujui (APPROVED).', 'success');
    router.push(`/research/${id}/report`);
  };

  const handleReturn = () => {
    if (!reviewNotes.trim()) {
      toast('Catatan review/catatan revisi wajib diisi jika laporan dikembalikan.', 'warning');
      return;
    }

    returnReportForRevision(id, reviewNotes, user?.name || 'Kepala BRIDA');
    setIsReturnOpen(false);
    toast('Laporan dikembalikan untuk revisi. Versi dokumen ditingkatkan.', 'warning');
    router.push(`/research/${id}/report`);
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
          onClick={() => router.push(`/research/${id}/report`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Overview</span>
        </button>
      </div>

      <PageHeader
        title="Tinjauan Kelayakan Laporan & Policy Brief"
        description={`Keputusan verifikasi dokumen akhir dan rangkuman temuan riset: "${record.title}"`}
      />

      {/* Main split screens: left (Report review details) & right (Decision checkboxes) */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Column: Report summary display */}
        <div className="md:col-span-2 space-y-6 text-xs font-semibold select-none leading-relaxed">
          
          {/* Cover & metadata info */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider">
                1. Metadata Kajian & Laporan
              </span>
              <div>
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Judul Kegiatan Penelitian</span>
                <span className="text-sm font-bold text-gray-900 leading-snug block">{report.title || record.title}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 text-3xs font-semibold">
                <div>Research ID: <span className="font-bold text-gray-800">{record.id}</span></div>
                <div>Mitra Pelaksana: <span className="font-bold text-gray-800">{method.method === 'SWAKELOLA' ? 'Tim Internal' : 'PT Nusantara Health'}</span></div>
                <div>Diajukan Oleh: <span className="font-bold text-gray-800">{report.submittedBy}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Executive Summary & Results */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider">
                2. Rangkuman & Pembahasan Hasil
              </span>
              <div>
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Executive Summary</span>
                <p className="italic text-gray-655 text-justify mt-0.5 leading-relaxed">{report.executiveSummary}</p>
              </div>
              <div className="pt-3 border-t">
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Ringkasan Hasil Lapangan (Results)</span>
                <p className="text-gray-700 text-justify mt-0.5 leading-relaxed">{report.results}</p>
              </div>
            </CardContent>
          </Card>

          {/* Findings lists */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider">
                3. Daftar Temuan Hambatan (Findings)
              </span>
              {findings.length === 0 ? (
                <p className="text-gray-450 italic">Tidak ada temuan terlampir.</p>
              ) : (
                <div className="space-y-3.5 divide-y">
                  {findings.map((f, idx) => (
                    <div key={f.id} className="pt-2 first:pt-0 space-y-1 text-3xs leading-relaxed text-justify">
                      <div className="flex justify-between font-extrabold items-center">
                        <span className="text-gray-800 text-2xs">{idx + 1}. {f.title}</span>
                        <span className="text-[8px] uppercase border px-1 rounded">{f.severity}</span>
                      </div>
                      <p className="text-gray-500 font-normal leading-relaxed">{f.description}</p>
                      <p className="text-rose-750 font-bold">Dampak: <span className="font-normal italic text-gray-700">{f.impact}</span></p>
                      <span className="text-[8px] text-gray-400 font-normal">Evidence: {f.evidence}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Review Checklist & Notes controls */}
        <div className="space-y-6">
          
          {/* Review Checklists (Section 31) */}
          <Card>
            <CardContent className="p-6 space-y-4 text-xs font-semibold select-none">
              <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider">
                Penilaian Kelayakan Output
              </span>

              {/* Laporan Checklist */}
              <div className="space-y-2">
                <span className="text-2xs text-gray-450 uppercase block font-bold border-b pb-1">Checklist Laporan</span>
                
                <label className="flex items-start gap-2 py-1 cursor-pointer text-3xs">
                  <input
                    type="checkbox" checked={rep1} onChange={() => setRep1(!rep1)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                  />
                  <span>Tujuan penelitian jelas</span>
                </label>

                <label className="flex items-start gap-2 py-1 cursor-pointer text-3xs">
                  <input
                    type="checkbox" checked={rep2} onChange={() => setRep2(!rep2)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                  />
                  <span>Metodologi terdokumentasi</span>
                </label>

                <label className="flex items-start gap-2 py-1 cursor-pointer text-3xs">
                  <input
                    type="checkbox" checked={rep3} onChange={() => setRep3(!rep3)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                  />
                  <span>Hasil penelitian jelas</span>
                </label>

                <label className="flex items-start gap-2 py-1 cursor-pointer text-3xs">
                  <input
                    type="checkbox" checked={rep4} onChange={() => setRep4(!rep4)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                  />
                  <span>Findings didukung evidence</span>
                </label>

                <label className="flex items-start gap-2 py-1 cursor-pointer text-3xs">
                  <input
                    type="checkbox" checked={rep5} onChange={() => setRep5(!rep5)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                  />
                  <span>Kesimpulan sesuai findings</span>
                </label>
              </div>

              {/* Policy Brief Checklist */}
              <div className="space-y-2 pt-2 border-t">
                <span className="text-2xs text-gray-450 uppercase block font-bold border-b pb-1">Checklist Policy Brief</span>
                
                <label className="flex items-start gap-2 py-1 cursor-pointer text-3xs">
                  <input
                    type="checkbox" checked={pol1} onChange={() => setPol1(!pol1)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                  />
                  <span>Masalah jelas</span>
                </label>

                <label className="flex items-start gap-2 py-1 cursor-pointer text-3xs">
                  <input
                    type="checkbox" checked={pol2} onChange={() => setPol2(!pol2)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                  />
                  <span>Evidence tersedia</span>
                </label>

                <label className="flex items-start gap-2 py-1 cursor-pointer text-3xs">
                  <input
                    type="checkbox" checked={pol3} onChange={() => setPol3(!pol3)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                  />
                  <span>Key findings jelas</span>
                </label>

                <label className="flex items-start gap-2 py-1 cursor-pointer text-3xs">
                  <input
                    type="checkbox" checked={pol4} onChange={() => setPol4(!pol4)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                  />
                  <span>Kesimpulan sesuai penelitian</span>
                </label>

                <label className="flex items-start gap-2 py-1 cursor-pointer text-3xs">
                  <input
                    type="checkbox" checked={pol5} onChange={() => setPol5(!pol5)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                  />
                  <span>Policy implication jelas</span>
                </label>
              </div>

            </CardContent>
          </Card>

          {/* Notes & Actions buttons (Section 32 & 33 & 34) */}
          <Card>
            <CardContent className="p-6 space-y-4 text-xs font-semibold">
              
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-755 uppercase">Review Notes / Catatan Verifikasi *</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Catatan detail kesalahan penulisan bab atau arahan perbaikan jika dikembalikan..."
                  rows={4}
                  className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 font-semibold leading-relaxed"
                />
                <span className="text-[9px] text-gray-400 block italic leading-normal font-normal">
                  * Catatan wajib diisi jika Anda memilih "Return for Revision" untuk membimbing perbaikan BRIDA.
                </span>
              </div>

              <div className="grid gap-2 grid-cols-2 pt-2 border-t">
                <button
                  onClick={() => setIsReturnOpen(true)}
                  className="px-3 py-2 border border-rose-300 hover:bg-rose-50/20 text-rose-650 rounded font-bold text-xs transition-all uppercase text-center bg-white"
                >
                  Return
                </button>
                <button
                  onClick={() => setIsApproveOpen(true)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs transition-all uppercase text-center shadow"
                >
                  Approve Report
                </button>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>

      {/* ================= MODAL: CONFIRM RETURN FOR REVISION ================= */}
      <Dialog
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        title="Return Laporan untuk Revisi"
        description="Kembalikan laporan untuk revisi?"
        footer={
          <>
            <button
              onClick={handleReturn}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold transition-all"
            >
              Kembalikan Dokumen
            </button>
            <button
              onClick={() => setIsReturnOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-55 text-gray-700 rounded text-xs font-semibold bg-white"
            >
              Batal
            </button>
          </>
        }
      >
        <p className="text-xs text-gray-500 leading-relaxed">
          Pernyataan ini akan mengembalikan status Laporan Hasil Riset & Policy Brief ke **Revision Required**. BRIDA Litbang dapat melakukan sunting ulang dan perbaikan. Versi dokumen desimal akan dinaikkan (misal `v1.0 ➔ v1.1`).
        </p>
      </Dialog>

      {/* ================= MODAL: CONFIRM APPROVAL ================= */}
      <Dialog
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        title="Setujui Laporan Hasil & Policy Brief"
        description="Setujui laporan hasil penelitian dan policy brief?"
        footer={
          <>
            <button
              onClick={handleApprove}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-all"
            >
              Setujui Dokumen
            </button>
            <button
              onClick={() => setIsApproveOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-55 text-gray-700 rounded text-xs font-semibold bg-white"
            >
              Batal
            </button>
          </>
        }
      >
        <p className="text-xs text-gray-500 leading-relaxed">
          Dokumen akan ditetapkan secara sah sebagai output final penelitian. Status laporan akan diubah menjadi **APPROVED** dan seluruh isian data dikunci permanen (**Read-Only**). Sistem akan mengaktifkan bendera **Ready for Recommendation = TRUE**.
        </p>
      </Dialog>

    </div>
  );
}
