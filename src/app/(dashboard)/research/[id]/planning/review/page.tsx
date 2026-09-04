'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlanningStore } from '@/store/usePlanningStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  ClipboardList,
  AlertTriangle,
  Info,
  Check,
  X
} from 'lucide-react';

export default function PlanningReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { getKak, getRab, approvePlanning, returnPlanningForRevision, fetchPlanning, isLoaded } = usePlanningStore();
  const { researchRecords, proposals, fetchProposals } = useResearchStore();

  const isKepalaBrida = user?.role === 'KEPALA_BRIDA';
  const id = params?.id || '';

  // Access check
  useEffect(() => {
    if (user && !['KEPALA_BRIDA', 'ADMIN_BRIDA', 'BRIDA'].includes(user.role)) {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchPlanning();
    fetchProposals();
  }, [id, fetchPlanning, fetchProposals]);

  // Find target research record
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

  const kak = useMemo(() => getKak(id), [getKak, id]);
  const rab = useMemo(() => getRab(id), [getRab, id]);

  // Redirect if status is not UNDER_REVIEW once data is loaded
  useEffect(() => {
    if (isLoaded && kak && kak.status !== 'UNDER_REVIEW') {
      toast('Dokumen tidak sedang dalam tahapan review KAK & RAB.', 'warning');
      router.replace(`/research/${id}/planning`);
    }
  }, [isLoaded, kak, id, router, toast]);

  // Math tally for RAB
  const rabTotal = useMemo(() => {
    return rab.items.reduce((sum, item) => sum + item.subtotal, 0);
  }, [rab]);

  // Checklist interactive state
  const [kakChecked1, setKakChecked1] = useState(false);
  const [kakChecked2, setKakChecked2] = useState(false);
  const [kakChecked3, setKakChecked3] = useState(false);
  const [kakChecked4, setKakChecked4] = useState(false);
  const [kakChecked5, setKakChecked5] = useState(false);
  const [kakChecked6, setKakChecked6] = useState(false);

  const [rabChecked1, setRabChecked1] = useState(false);
  const [rabChecked2, setRabChecked2] = useState(false);
  const [rabChecked3, setRabChecked3] = useState(false);
  const [rabChecked4, setRabChecked4] = useState(false);
  const [rabChecked5, setRabChecked5] = useState(false);

  // Review notes state
  const [reviewNotes, setReviewNotes] = useState('');

  // Modals state
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  const handleApproveClick = () => {
    setIsApproveOpen(true);
  };

  const handleReturnClick = () => {
    if (!reviewNotes.trim()) {
      toast('Catatan review (Review Notes) wajib diisi untuk mengembalikan dokumen.', 'warning');
      return;
    }
    setIsReturnOpen(true);
  };

  const handleConfirmApprove = async () => {
    try {
      await approvePlanning(id, reviewNotes, user?.name || 'Kepala BRIDA');
      setIsApproveOpen(false);
      toast('Dokumen KAK & RAB berhasil disetujui (Approved).', 'success');
      router.push(`/research/${id}/planning`);
    } catch (err: any) {
      toast('Gagal menyetujui KAK & RAB: ' + (err.message || 'Terjadi kesalahan.'), 'error');
    }
  };

  const handleConfirmReturn = async () => {
    try {
      await returnPlanningForRevision(id, reviewNotes, user?.name || 'Kepala BRIDA');
      setIsReturnOpen(false);
      toast('Dokumen dikembalikan ke BRIDA untuk direvisi.', 'success');
      router.push(`/research/${id}/planning`);
    } catch (err: any) {
      toast('Gagal mengembalikan dokumen: ' + (err.message || 'Terjadi kesalahan.'), 'error');
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

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back link */}
      <div>
        <button
          onClick={() => router.push(`/research/${record.id}/planning`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Planning</span>
        </button>
      </div>

      <PageHeader
        title="Review KAK & RAB Penelitian"
        description={`Peninjauan dan penetapan anggaran administrasi KAK & RAB untuk riset: "${record.title}"`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* ================= LEFT SECTION (Summaries of documents) ================= */}
        <div className="md:col-span-2 space-y-6">
          
          {/* KAK Summary */}
          <Card>
            <CardHeader className="pb-3 border-b flex flex-row justify-between items-center">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Ringkasan Kerangka Acuan Kerja (KAK)</span>
              </CardTitle>
              <button
                onClick={() => router.push(`/research/${record.id}/kak`)}
                className="px-2 py-1 border border-blue-200 hover:bg-blue-50 text-blue-600 text-3xs font-bold rounded uppercase transition-colors"
              >
                Open Full KAK
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs leading-normal select-none">
              <div>
                <span className="text-gray-400 font-bold block uppercase text-[9px]">Judul Kegiatan</span>
                <span className="font-semibold text-gray-800 dark:text-gray-250 block mt-0.5">{kak.title}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-gray-400 font-bold block uppercase text-[9px]">Jangka Waktu</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-250 block mt-0.5">{kak.duration}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block uppercase text-[9px]">Pagu Anggaran Kasar KAK</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{formatIDR(kak.budgetEstimates)}</span>
                </div>
              </div>
              <div>
                <span className="text-gray-400 font-bold block uppercase text-[9px]">Latar Belakang Singkat</span>
                <p className="text-gray-600 dark:text-gray-400 truncate max-w-xl mt-0.5">{kak.background}</p>
              </div>
              <div>
                <span className="text-gray-400 font-bold block uppercase text-[9px]">Output yang Dijanjikan</span>
                <p className="text-gray-700 dark:text-gray-300 font-semibold">{kak.output}</p>
              </div>
            </CardContent>
          </Card>

          {/* RAB Summary */}
          <Card>
            <CardHeader className="pb-3 border-b flex flex-row justify-between items-center">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-purple-650" />
                <span>Ringkasan Rencana Anggaran Biaya (RAB)</span>
              </CardTitle>
              <button
                onClick={() => router.push(`/research/${record.id}/rab`)}
                className="px-2 py-1 border border-purple-200 hover:bg-purple-50 text-purple-650 text-3xs font-bold rounded uppercase transition-colors"
              >
                Open Full RAB
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs font-semibold leading-normal select-none">
              <div className="grid gap-4 sm:grid-cols-3 text-center p-3 bg-gray-50 dark:bg-gray-900 border rounded">
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase mb-0.5">Total Belanja RAB</span>
                  <span className="text-sm font-extrabold text-purple-750 dark:text-purple-400">{formatIDR(rabTotal)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase mb-0.5">Jumlah Item</span>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-250">{rab.items.length} Komponen</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase mb-0.5">Kesesuaian Pagu</span>
                  {kak.budgetEstimates === rabTotal ? (
                    <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-600 dark:text-emerald-450 mt-1">
                      <Check className="h-3.5 w-3.5" />
                      <span>Consistent</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-2xs font-bold text-rose-600 dark:text-rose-450 mt-1">
                      <X className="h-3.5 w-3.5" />
                      <span>Mismatch</span>
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ================= RIGHT SECTION (Review Checklist & Decision Notes) ================= */}
        <div className="space-y-6">
          
          {/* Review Checklist Panel (Section 22) */}
          <Card>
            <CardHeader className="pb-2 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4" />
                <span>Checklist Evaluasi Kelayakan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs font-medium font-sans">
              
              {/* KAK Checklist */}
              <div className="space-y-2">
                <span className="text-3xs font-bold text-gray-400 block uppercase">1. Penilaian KAK</span>
                
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={kakChecked1}
                    onChange={(e) => setKakChecked1(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <span>Latar belakang sesuai kebutuhan daerah</span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={kakChecked2}
                    onChange={(e) => setKakChecked2(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <span>Tujuan riset jelas & terukur</span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={kakChecked3}
                    onChange={(e) => setKakChecked3(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <span>Ruang lingkup teridentifikasi jelas</span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={kakChecked4}
                    onChange={(e) => setKakChecked4(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <span>Metodologi sesuai kaidah akademis</span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={kakChecked5}
                    onChange={(e) => setKakChecked5(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <span>Keluaran (Output) konkrit</span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={kakChecked6}
                    onChange={(e) => setKakChecked6(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <span>Durasi waktu riset realistis</span>
                </label>
              </div>

              {/* RAB Checklist */}
              <div className="space-y-2 pt-3 border-t dark:border-gray-850">
                <span className="text-3xs font-bold text-gray-400 block uppercase">2. Penilaian RAB</span>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rabChecked1}
                    onChange={(e) => setRabChecked1(e.target.checked)}
                    className="rounded border-gray-300 text-purple-650 focus:ring-purple-500 mt-0.5"
                  />
                  <span>Komponen anggaran wajar & legal</span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rabChecked2}
                    onChange={(e) => setRabChecked2(e.target.checked)}
                    className="rounded border-gray-300 text-purple-650 focus:ring-purple-500 mt-0.5"
                  />
                  <span>Volume belanja wajar</span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rabChecked3}
                    onChange={(e) => setRabChecked3(e.target.checked)}
                    className="rounded border-gray-300 text-purple-650 focus:ring-purple-500 mt-0.5"
                  />
                  <span>Harga satuan sesuai SBU daerah</span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rabChecked4}
                    onChange={(e) => setRabChecked4(e.target.checked)}
                    className="rounded border-gray-300 text-purple-650 focus:ring-purple-500 mt-0.5"
                  />
                  <span>Total alokasi anggaran mencukupi</span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rabChecked5}
                    onChange={(e) => setRabChecked5(e.target.checked)}
                    className="rounded border-gray-300 text-purple-650 focus:ring-purple-500 mt-0.5"
                  />
                  <span>RAB konsisten dengan estimasi KAK</span>
                </label>
              </div>

            </CardContent>
          </Card>

          {/* Decision actions & Notes */}
          <Card>
            <CardHeader className="pb-2 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Catatan Review & Keputusan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              
              {/* Review Notes */}
              <div className="space-y-1.5">
                <label className="block text-3xs font-bold text-gray-500 uppercase">
                  Catatan Tinjauan Kepala BRIDA (Review Notes) *
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Wajib diisi jika dikembalikan untuk revisi..."
                  rows={3}
                  className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 focus:outline-none resize-none text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="grid gap-2 grid-cols-2 pt-2">
                <button
                  onClick={handleReturnClick}
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Return Revision</span>
                </button>
                <button
                  onClick={handleApproveClick}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Approve KAK & RAB</span>
                </button>
              </div>

            </CardContent>
          </Card>

        </div>
      </div>

      {/* ================= MODAL: APPROVE CONFIRMATION ================= */}
      <Dialog
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        title="Setujui KAK & RAB"
        description="Setujui KAK dan RAB penelitian ini?"
        footer={
          <>
            <button
              onClick={handleConfirmApprove}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-all"
            >
              Approve
            </button>
            <button
              onClick={() => setIsApproveOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <p className="text-xs text-gray-500 leading-relaxed">
          Setelah disetujui, KAK dan RAB akan menjadi dasar persiapan tahap pelaksanaan penelitian. Status KAK dan RAB akan diubah menjadi **APPROVED** secara permanen dan dikunci dari penyuntingan oleh BRIDA.
        </p>
      </Dialog>

      {/* ================= MODAL: RETURN REVISION CONFIRMATION ================= */}
      <Dialog
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        title="Kembalikan untuk Perbaikan"
        description="Kembalikan KAK & RAB untuk diperbaiki?"
        footer={
          <>
            <button
              onClick={handleConfirmReturn}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold transition-all"
            >
              Return for Revision
            </button>
            <button
              onClick={() => setIsReturnOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <p className="text-xs text-gray-500 leading-relaxed">
          Dokumen KAK dan RAB akan diubah menjadi status **REVISION_REQUIRED** dan dikembalikan kepada BRIDA. Versi dokumen akan otomatis dinaikkan (v1.1) untuk menampung draf perbaikan.
        </p>
      </Dialog>

    </div>
  );
}
