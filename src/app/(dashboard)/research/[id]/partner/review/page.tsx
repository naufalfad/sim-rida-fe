'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePartnerStore } from '@/store/usePartnerStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { usePlanningStore } from '@/store/usePlanningStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { SupportingDocument } from '@/mock/partners/candidates';
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
  X,
  Users
} from 'lucide-react';

export default function PartnerReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { getMethod, getCandidates, approvePartner, returnPartnerForRevision, fetchPartners, isLoaded } = usePartnerStore();
  const { researchRecords, proposals, fetchProposals } = useResearchStore();
  const { getRab, fetchPlanning } = usePlanningStore();

  const id = params?.id || '';
  const isKepalaBrida = user?.role === 'KEPALA_BRIDA';

  // Access check
  useEffect(() => {
    if (user && !['KEPALA_BRIDA', 'ADMIN_BRIDA', 'BRIDA'].includes(user.role)) {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchPartners();
    fetchProposals();
    fetchPlanning();
  }, [id, fetchPartners, fetchProposals, fetchPlanning]);

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

  const method = useMemo(() => {
    if (record?.id) {
      const m = getMethod(record.id);
      if (m && (m.status !== 'NOT_STARTED' || m.justification)) return m;
    }
    if (record?.proposalId) {
      const m = getMethod(record.proposalId);
      if (m && (m.status !== 'NOT_STARTED' || m.justification)) return m;
    }
    return getMethod(id);
  }, [getMethod, id, record]);

  const candidates = useMemo(() => {
    if (record?.id) {
      const list = getCandidates(record.id);
      if (list && list.length > 0) return list;
    }
    if (record?.proposalId) {
      const list = getCandidates(record.proposalId);
      if (list && list.length > 0) return list;
    }
    return getCandidates(id);
  }, [getCandidates, id, record]);

  const rab = useMemo(() => {
    if (record?.id) {
      const r = getRab(record.id);
      if (r && r.items && r.items.length > 0) return r;
    }
    if (record?.proposalId) {
      const r = getRab(record.proposalId);
      if (r && r.items && r.items.length > 0) return r;
    }
    return getRab(id);
  }, [getRab, id, record]);

  // Redirect if not UNDER_REVIEW once loaded
  useEffect(() => {
    if (isLoaded && method && method.status !== 'UNDER_REVIEW') {
      toast('Dokumen tidak dalam proses review pemilihan mitra.', 'warning');
      router.replace(`/research/${id}/partner`);
    }
  }, [isLoaded, method, id, router, toast]);

  // Math tally
  const rabTotal = useMemo(() => {
    return rab.items.reduce((sum, item) => sum + item.subtotal, 0);
  }, [rab]);

  const recommendedCandidate = useMemo(() => {
    return candidates.find(c => c.evaluation?.recommendation === 'RECOMMENDED') || candidates[0];
  }, [candidates]);

  // Budget checks
  const budgetValidation = useMemo(() => {
    if (method.method === 'SWAKELOLA' || !recommendedCandidate) {
      return { status: 'Within RAB', isAbove: false };
    }
    const isAbove = recommendedCandidate.price > rabTotal && rabTotal > 0;
    return {
      status: isAbove ? 'Above RAB' : 'Within RAB',
      isAbove,
    };
  }, [method, recommendedCandidate, rabTotal]);

  // Form states
  const [reviewNotes, setReviewNotes] = useState('');
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  // Doc preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<SupportingDocument | null>(null);

  const handleApproveClick = () => {
    setIsApproveOpen(true);
  };

  const handleReturnClick = () => {
    if (!reviewNotes.trim()) {
      toast('Catatan review (Review Notes) wajib diisi untuk mengembalikan pemilihan mitra.', 'warning');
      return;
    }
    setIsReturnOpen(true);
  };

  const handleConfirmApprove = async () => {
    try {
      await approvePartner(id, reviewNotes, user?.name || 'Kepala BRIDA');
      setIsApproveOpen(false);
      toast('Pemilihan metode & mitra berhasil disetujui (Approved).', 'success');
      router.push(`/research/${id}/partner`);
    } catch (err: any) {
      toast('Gagal menyetujui mitra: ' + (err.message || 'Terjadi kesalahan.'), 'error');
    }
  };

  const handleConfirmReturn = async () => {
    try {
      await returnPartnerForRevision(id, reviewNotes, user?.name || 'Kepala BRIDA');
      setIsReturnOpen(false);
      toast('Pemilihan mitra dikembalikan ke BRIDA untuk direvisi.', 'success');
      router.push(`/research/${id}/partner`);
    } catch (err: any) {
      toast('Gagal mengembalikan mitra: ' + (err.message || 'Terjadi kesalahan.'), 'error');
    }
  };

  const handleOpenPreview = (doc: SupportingDocument) => {
    setPreviewDoc(doc);
    setIsPreviewOpen(true);
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
          onClick={() => router.push(`/research/${record.id}/partner`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Overview</span>
        </button>
      </div>

      <PageHeader
        title="Review Penentuan Metode & Mitra"
        description={`Peninjauan dan keputusan penetapan metode & kandidat terpilih untuk Penelitian #${record.id}`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* ================= LEFT CONTENT (Summaries of documents) ================= */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Method Selected details */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Justifikasi Metode Pelaksanaan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs leading-normal select-none">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-gray-400 block font-bold text-[9px] uppercase">Metode Pemilihan</span>
                  <span className="font-extrabold text-gray-800 dark:text-gray-200 text-sm">{method.method}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold text-[9px] uppercase">Diusulkan Oleh</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{method.updatedBy || 'BRIDA'} ({method.updatedAt})</span>
                </div>
              </div>
              <div>
                <span className="text-gray-400 block font-bold text-[9px] uppercase">Alasan Pemilihan Metode</span>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 border rounded mt-1">
                  {method.justification}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Partner & Candidates Summary */}
          {method.method === 'SWAKELOLA' ? (
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Users className="h-4.5 w-4.5 text-blue-600" />
                  <span>Tim Pelaksana Swakelola Internal</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs leading-normal select-none">
                <div className="border rounded divide-y bg-gray-50/50">
                  {(method.swakelolaDetails?.internalTeam || []).map((member) => (
                    <div key={member.id} className="p-3 flex justify-between items-start">
                      <div>
                        <span className="font-bold text-gray-800 block">{member.name}</span>
                        <span className="text-[10px] text-gray-400 font-semibold">{member.position} • {member.expertise}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-3xs bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4 text-purple-650" />
                  <span>Rekomendasi Kandidat Calon Mitra Terpilih</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs font-semibold leading-normal select-none">
                {recommendedCandidate ? (
                  <div className="space-y-4">
                    <div className="p-3 border border-emerald-250 bg-emerald-50/5 rounded space-y-2">
                      <span className="text-[9px] text-emerald-600 font-bold block uppercase tracking-wider">
                        Kandidat Direkomendasikan
                      </span>
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-gray-850 dark:text-gray-200 text-sm">{recommendedCandidate.name}</span>
                        <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                          {formatIDR(recommendedCandidate.price)}
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3 text-2xs pt-1">
                        <div>
                          <span className="text-gray-400 block font-bold uppercase text-[8px]">Skor Kelayakan</span>
                          <span className="font-bold text-purple-750 dark:text-purple-400">
                            {recommendedCandidate.evaluation ? (
                              `${recommendedCandidate.evaluation.competence + recommendedCandidate.evaluation.experience + recommendedCandidate.evaluation.capacity + recommendedCandidate.evaluation.methodology + recommendedCandidate.evaluation.cost + recommendedCandidate.evaluation.availability} / 30 Score`
                            ) : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block font-bold uppercase text-[8px]">RAB Disetujui</span>
                          <span className="font-semibold text-gray-700">{formatIDR(rabTotal)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block font-bold uppercase text-[8px]">Status Anggaran</span>
                          <span className={`font-bold ${budgetValidation.isAbove ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {budgetValidation.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SWOT Qualitative parameters */}
                    {recommendedCandidate.evaluation && (
                      <div className="grid gap-4 sm:grid-cols-3 text-2xs bg-gray-50 p-3 border rounded">
                        <div>
                          <span className="text-gray-400 font-bold block uppercase text-[8px] mb-0.5">Kekuatan (Strengths)</span>
                          <p className="text-gray-650 italic leading-relaxed">{recommendedCandidate.evaluation.strength}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 font-bold block uppercase text-[8px] mb-0.5">Kelemahan (Weaknesses)</span>
                          <p className="text-gray-650 italic leading-relaxed">{recommendedCandidate.evaluation.weakness}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 font-bold block uppercase text-[8px] mb-0.5">Risiko Pelaksanaan</span>
                          <p className="text-gray-650 italic leading-relaxed text-rose-650">{recommendedCandidate.evaluation.risk}</p>
                        </div>
                      </div>
                    )}

                    {/* Supporting files for recommended partner */}
                    <div className="space-y-2">
                      <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">
                        Dokumen Penawaran Lampiran
                      </span>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {recommendedCandidate.documents.map((doc) => (
                          <div key={doc.id} className="p-2 bg-white border rounded flex justify-between items-center text-3xs">
                            <div className="flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-gray-400" />
                              <span className="font-bold text-gray-700 truncate max-w-40">{doc.name}</span>
                            </div>
                            <button
                              onClick={() => handleOpenPreview(doc)}
                              className="text-blue-600 font-bold hover:underline uppercase text-3xs"
                            >
                              View
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  <p className="text-rose-600">Kesalahan: Belum ada kandidat terpilih.</p>
                )}
              </CardContent>
            </Card>
          )}

        </div>

        {/* ================= RIGHT SECTION (Decision Notes) ================= */}
        <div className="space-y-6">
          
          <Card>
            <CardHeader className="pb-2 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Keputusan Kepala BRIDA
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs font-sans">
              
              {/* Review Notes */}
              <div className="space-y-1.5">
                <label className="block text-3xs font-bold text-gray-500 uppercase">
                  Catatan Tinjauan Kepala BRIDA (Review Notes) *
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Wajib diisi jika dikembalikan untuk revisi..."
                  rows={4}
                  className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 focus:outline-none resize-none text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Action buttons */}
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
                  <span>Approve Selection</span>
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
        title="Setujui Metode & Mitra"
        description="Setujui metode pelaksanaan dan hasil pemilihan mitra?"
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
          Persetujuan ini menetapkan hasil proses pada SIM-RIDA dan menjadi dasar untuk tahap pelaksanaan berikutnya. Status metode akan diubah menjadi **APPROVED** dan mitra terpilih menjadi **SELECTED**.
        </p>
      </Dialog>

      {/* ================= MODAL: RETURN REVISION CONFIRMATION ================= */}
      <Dialog
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        title="Kembalikan Pemilihan Mitra"
        description="Kembalikan pemilihan mitra untuk direvisi?"
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
          Proses penentuan mitra akan diubah menjadi status **REVISION_REQUIRED** dan dikembalikan kepada BRIDA untuk disunting ulang.
        </p>
      </Dialog>

      {/* ================= MODAL: MOCK DOCUMENT PREVIEW ================= */}
      <Dialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`Preview Lampiran: ${previewDoc?.name || ''}`}
        description="Pencatatan Dokumen Pendukung Administrasi SIM-RIDA"
        footer={
          <button
            onClick={() => setIsPreviewOpen(false)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
          >
            Tutup Preview
          </button>
        }
      >
        <div className="p-6 bg-slate-50 border rounded text-center space-y-3 font-sans text-xs">
          <FileText className="h-10 w-10 text-slate-400 mx-auto" />
          <div>
            <h4 className="font-bold text-slate-800">{previewDoc?.name}</h4>
            <p className="text-gray-450 mt-1">Jenis Berkas: {previewDoc?.type} • Status: {previewDoc?.status}</p>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed italic max-w-sm mx-auto">
            (Ini merupakan simulasi pratinjau dokumen. Pada aplikasi produksi nyata, area ini memuat PDF Viewer terintegrasi).
          </p>
        </div>
      </Dialog>

    </div>
  );
}
