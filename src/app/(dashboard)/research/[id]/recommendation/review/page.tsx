'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRecommendationStore } from '@/store/useRecommendationStore';
import { useReportStore } from '@/store/useReportStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { usePartnerStore } from '@/store/usePartnerStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { MOCK_OPDS } from '@/mock/opd';
import { FileText, ArrowLeft, CheckCircle2, AlertTriangle, Send, X, Check, ClipboardList } from 'lucide-react';

export default function RecommendationReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { researchRecords } = useResearchStore();
  const { getReport, getFindings, getPolicyBrief } = useReportStore();
  const {
    getRecommendation,
    approveRecommendation,
    returnRecommendationForRevision
  } = useRecommendationStore();
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
  const rec = getRecommendation(id);
  const method = getMethod(id);

  // Redirect if not in UNDER_REVIEW status
  useEffect(() => {
    if (rec && rec.status !== 'UNDER_REVIEW') {
      toast('Rekomendasi tidak sedang dalam status menunggu review.', 'warning');
      router.replace(`/research/${id}/recommendation`);
    }
  }, [rec, id, router, toast]);

  // Checklists (Section 23)
  const [chk1, setChk1] = useState(false);
  const [chk2, setChk2] = useState(false);
  const [chk3, setChk3] = useState(false);
  const [chk4, setChk4] = useState(false);
  const [chk5, setChk5] = useState(false);
  const [chk6, setChk6] = useState(false);
  const [chk7, setChk7] = useState(false);

  // Notes state
  const [reviewNotes, setReviewNotes] = useState('');

  // Confirmation modals state
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  const primaryOpdName = useMemo(() => {
    const opd = MOCK_OPDS.find(o => o.id === rec.primaryRecipientId);
    return opd ? opd.name : '-';
  }, [rec.primaryRecipientId]);

  const handleApprove = () => {
    approveRecommendation(id, reviewNotes, user?.name || 'Kepala BRIDA');
    setIsApproveOpen(false);
    toast('Rekomendasi resmi disetujui (APPROVED) dan siap diterbitkan.', 'success');
    router.push(`/research/${id}/recommendation`);
  };

  const handleReturn = () => {
    if (!reviewNotes.trim()) {
      toast('Catatan review/catatan revisi wajib diisi jika rekomendasi dikembalikan.', 'warning');
      return;
    }

    returnRecommendationForRevision(id, reviewNotes, user?.name || 'Kepala BRIDA');
    setIsReturnOpen(false);
    toast('Rekomendasi dikembalikan untuk revisi. Versi dokumen ditingkatkan.', 'warning');
    router.push(`/research/${id}/recommendation`);
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
          onClick={() => router.push(`/research/${id}/recommendation`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Overview</span>
        </button>
      </div>

      <PageHeader
        title="Tinjauan Rekomendasi BRIDA"
        description={`Keputusan verifikasi rekomendasi resmi untuk riset: "${record.title}"`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Column: Recommendation summary display */}
        <div className="md:col-span-2 space-y-6 text-xs font-semibold leading-relaxed">
          
          {/* Metadata */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider">
                1. Draf Rekomendasi
              </span>
              <div>
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Judul Rekomendasi</span>
                <span className="text-sm font-bold text-gray-900 leading-snug block">{rec.title}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 text-3xs font-semibold">
                <div>Recommendation ID: <span className="font-bold text-gray-850">{rec.id}</span></div>
                <div>Target OPD Utama: <span className="font-bold text-gray-850">{primaryOpdName}</span></div>
                <div>Priority Level: <span className="font-bold text-rose-700">{rec.priority}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Details Descriptions */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider">
                2. Rincian Usulan & Dampak Kebijakan
              </span>
              <div>
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Fokus Permasalahan (Problem Statement)</span>
                <pre className="whitespace-pre-wrap font-sans text-xs text-gray-700 leading-relaxed text-justify mt-0.5 font-semibold">{rec.problemStatement}</pre>
              </div>
              <div className="pt-3 border-t">
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Usulan Rekomendasi BRIDA</span>
                <p className="text-indigo-900 font-bold bg-indigo-50/20 p-3.5 border rounded leading-relaxed text-justify mt-0.5">{rec.recommendationDescription}</p>
              </div>
              <div className="pt-3 border-t">
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Dampak Kebijakan Publik yang Diharapkan</span>
                <p className="text-gray-805 leading-relaxed text-justify mt-0.5 font-bold">{rec.expectedPolicyImpact}</p>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Review Checklist & Notes controls */}
        <div className="space-y-6">
          
          {/* Review Checklists (Section 23) */}
          <Card>
            <CardContent className="p-6 space-y-4 text-xs font-semibold select-none">
              <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider">
                Penilaian Kelayakan Rekomendasi
              </span>

              <div className="space-y-2">
                <label className="flex items-start gap-2 py-1 cursor-pointer text-3xs">
                  <input
                    type="checkbox" checked={chk1} onChange={() => setChk1(!chk1)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                  />
                  <span>Recommendation based on research findings</span>
                </label>

                <label className="flex items-start gap-2 py-1 cursor-pointer text-3xs">
                  <input
                    type="checkbox" checked={chk2} onChange={() => setChk2(!chk2)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                  />
                  <span>Problem statement is clear</span>
                </label>

                <label className="flex items-start gap-2 py-1 cursor-pointer text-3xs">
                  <input
                    type="checkbox" checked={chk3} onChange={() => setChk3(!chk3)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                  />
                  <span>Recommendation is relevant</span>
                </label>

                <label className="flex items-start gap-2 py-1 cursor-pointer text-3xs">
                  <input
                    type="checkbox" checked={chk4} onChange={() => setChk4(!chk4)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                  />
                  <span>Recommendation is consistent with policy brief</span>
                </label>

                <label className="flex items-start gap-2 py-1 cursor-pointer text-3xs">
                  <input
                    type="checkbox" checked={chk5} onChange={() => setChk5(!chk5)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                  />
                  <span>Expected policy impact is clear</span>
                </label>

                <label className="flex items-start gap-2 py-1 cursor-pointer text-3xs">
                  <input
                    type="checkbox" checked={chk6} onChange={() => setChk6(!chk6)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                  />
                  <span>Recipient OPD is appropriate</span>
                </label>

                <label className="flex items-start gap-2 py-1 cursor-pointer text-3xs">
                  <input
                    type="checkbox" checked={chk7} onChange={() => setChk7(!chk7)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                  />
                  <span>Supporting evidence is available</span>
                </label>
              </div>

            </CardContent>
          </Card>

          {/* Notes & Actions buttons */}
          <Card>
            <CardContent className="p-6 space-y-4 text-xs font-semibold">
              
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-755 uppercase">Review Notes / Catatan Verifikasi *</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Catatan detail alasan perbaikan jika rekomendasi dikembalikan..."
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
                  Approve REC
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
        title="Return Rekomendasi untuk Revisi"
        description="Kembalikan rekomendasi untuk revisi?"
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
              className="px-4 py-2 border border-gray-300 hover:bg-gray-55 text-gray-705 rounded text-xs font-semibold bg-white"
            >
              Batal
            </button>
          </>
        }
      >
        <p className="text-xs text-gray-500 leading-relaxed">
          Pernyataan ini akan mengembalikan status Rekomendasi ke **Revision Required**. BRIDA Litbang dapat melakukan sunting ulang dan perbaikan. Versi dokumen desimal akan dinaikkan (misal `v1.0 ➔ v1.1`).
        </p>
      </Dialog>

      {/* ================= MODAL: CONFIRM APPROVAL ================= */}
      <Dialog
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        title="Setujui Rekomendasi"
        description="Setujui rekomendasi ini?"
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
              className="px-4 py-2 border border-gray-300 hover:bg-gray-55 text-gray-755 rounded text-xs font-semibold bg-white"
            >
              Batal
            </button>
          </>
        }
      >
        <p className="text-xs text-gray-500 leading-relaxed font-semibold">
          Dokumen akan ditetapkan secara sah sebagai Rekomendasi resmi BRIDA. Status akan diubah menjadi **APPROVED** dan siap diterbitkan (PUBLISH) kepada OPD terkait.
        </p>
      </Dialog>

    </div>
  );
}
