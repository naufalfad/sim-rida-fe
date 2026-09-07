'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useIdentificationStore } from '@/store/useIdentificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { problemIdentificationService, ProblemIdentification } from '@/services/problemIdentification.service';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Layers,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Send,
  Plus,
  AlertTriangle,
  FileCheck,
  User,
  ShieldCheck,
  Info
} from 'lucide-react';

export default function IdentificationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const {
    identifications,
    approveIdentification,
    rejectIdentification,
    deleteIdentification,
    updateIdentification
  } = useIdentificationStore();

  const id = params?.id;
  const isBridaOrAdmin = user?.role === 'BRIDA' || user?.role === 'ADMIN_BRIDA' || user?.role === 'KEPALA_BRIDA';
  const canApprove = user?.role === 'KEPALA_BRIDA' || user?.role === 'ADMIN_BRIDA' || user?.role === 'BRIDA';

  const [detailData, setDetailData] = useState<ProblemIdentification | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load data directly from backend to guarantee fresh state and support page refresh
  const loadDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await problemIdentificationService.getById(id);
      setDetailData(data);
    } catch (err: any) {
      console.error('Error loading identification detail:', err);
      toast('Gagal memuat data identifikasi kebutuhan.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const handleApprove = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      await approveIdentification(id, approvalNote);
      toast('Identifikasi kebutuhan berhasil disetujui (Approved).', 'success');
      setIsApproveOpen(false);
      setApprovalNote('');
      await loadDetail();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Gagal menyetujui identifikasi.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    if (!rejectReason.trim()) {
      toast('Alasan penolakan wajib diisi.', 'warning');
      return;
    }
    setIsProcessing(true);
    try {
      await rejectIdentification(id, rejectReason);
      toast('Identifikasi kebutuhan ditolak (Rejected).', 'success');
      setIsRejectOpen(false);
      setRejectReason('');
      await loadDetail();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Gagal menolak identifikasi.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      await updateIdentification(id, { status: 'UNDER_REVIEW' });
      toast('Identifikasi kebutuhan diajukan untuk telaah resmi.', 'success');
      await loadDetail();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Gagal mengajukan telaah.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      await deleteIdentification(id);
      toast('Identifikasi kebutuhan berhasil dihapus.', 'success');
      router.push('/identification');
    } catch (err: any) {
      toast(err.response?.data?.message || 'Gagal menghapus identifikasi.', 'error');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 font-sans max-w-5xl mx-auto py-12 text-center text-xs text-gray-400">
        Memuat detail identifikasi kebutuhan...
      </div>
    );
  }

  if (!detailData) {
    return (
      <div className="space-y-6 font-sans max-w-5xl mx-auto py-12 text-center">
        <h2 className="text-base font-bold text-gray-800 dark:text-white">Identifikasi Tidak Ditemukan</h2>
        <p className="text-xs text-gray-500 mt-1">Data identifikasi dengan kode/ID tersebut tidak ditemukan.</p>
        <button
          onClick={() => router.push('/identification')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-2xs font-bold border border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            DRAFT
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-2xs font-bold border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-400">
            DALAM TELAAH
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-2xs font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400">
            DISETUJUI (APPROVED)
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-2xs font-bold border border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-400">
            DITOLAK (REJECTED)
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-3xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-400">
            PRIORITAS TINGGI
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-3xs font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/40 dark:text-blue-400">
            PRIORITAS SEDANG
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-3xs font-bold bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400">
            PRIORITAS RENDAH
          </span>
        );
      default:
        return <span>{priority}</span>;
    }
  };

  const opdName = detailData.opd?.name || detailData.relatedOpds?.[0]?.opd?.name || 'Perangkat Daerah';
  const baselineDoc = detailData.sourceVersion?.externalSource;

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto pb-12">
      {/* Back link */}
      <div>
        <button
          onClick={() => router.push('/identification')}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Identifikasi</span>
        </button>
      </div>

      {/* Page Header */}
      <PageHeader
        title={`${detailData.code} — ${detailData.title}`}
        description="Hasil telaah identifikasi kebutuhan riset & kajian perangkat daerah berdasarkan analisis pemantauan BRIDA."
        action={
          isBridaOrAdmin && (
            <div className="flex flex-wrap items-center gap-2">
              {detailData.status === 'APPROVED' && (
                <button
                  onClick={() => router.push(`/research-proposals/new?identificationId=${detailData.id}`)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Buat Usulan Penelitian</span>
                </button>
              )}

              {detailData.status === 'DRAFT' && (
                <>
                  <button
                    onClick={() => router.push(`/identification/${detailData.id}/edit`)}
                    className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-750 dark:text-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-white dark:bg-gray-950"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={isProcessing}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Ajukan Telaah</span>
                  </button>
                </>
              )}

              {detailData.status === 'UNDER_REVIEW' && canApprove && (
                <>
                  <button
                    onClick={() => router.push(`/identification/${detailData.id}/edit`)}
                    className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-750 dark:text-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-white dark:bg-gray-950"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit Data</span>
                  </button>
                  <button
                    onClick={() => setIsRejectOpen(true)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Tolak</span>
                  </button>
                  <button
                    onClick={() => setIsApproveOpen(true)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Setujui (Approve)</span>
                  </button>
                </>
              )}

              {detailData.status === 'REJECTED' && (
                <button
                  onClick={() => router.push(`/identification/${detailData.id}/edit`)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Edit className="h-4 w-4" />
                  <span>Perbaiki & Ajukan Ulang</span>
                </button>
              )}
            </div>
          )
        }
      />

      {/* Main Grid: Left Details & Right Metadata/Review */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* LEFT COLUMN: 5 Analysis Blocks & Baseline Alignment */}
        <div className="md:col-span-2 space-y-6">
          {/* Header Summary Card */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Status:</span>
                  {renderStatusBadge(detailData.status)}
                </div>
                <div>{renderPriorityBadge(detailData.priority)}</div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Perangkat Daerah</span>
                  <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>{opdName}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Bidang Pembangunan</span>
                  <div className="font-semibold text-blue-700 dark:text-blue-400 mt-0.5">
                    {detailData.field}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Tahun Anggaran</span>
                  <div className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                    Tahun {detailData.year}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Disusun Oleh</span>
                  <div className="font-semibold text-gray-700 dark:text-gray-300 mt-0.5 flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    <span>{detailData.createdBy?.name || 'BRIDA Litbang'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5 Core Structural Analysis Blocks */}
          <Card>
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <span>5 Elemen Telaah Identifikasi Kebutuhan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              {/* 1. Temuan Pemantauan BRIDA */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-2xs flex items-center justify-center font-bold">1</span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Temuan Pemantauan BRIDA</span>
                </div>
                <div className="pl-7 text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-150 dark:border-gray-800 whitespace-pre-wrap">
                  {detailData.bridaFindings || detailData.description || 'Tidak ada catatan temuan.'}
                </div>
              </div>

              {/* 2. Kondisi Saat Ini */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-2xs flex items-center justify-center font-bold">2</span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Kondisi Saat Ini (Faktual di OPD)</span>
                </div>
                <div className="pl-7 text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-150 dark:border-gray-800 whitespace-pre-wrap">
                  {detailData.currentCondition || 'Belum diisi.'}
                </div>
              </div>

              {/* 3. Permasalahan Utama */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 text-2xs flex items-center justify-center font-bold">3</span>
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-400">Permasalahan Utama (Akar Masalah)</span>
                </div>
                <div className="pl-7 text-xs font-semibold text-gray-900 dark:text-white leading-relaxed bg-amber-50/40 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/40 whitespace-pre-wrap">
                  {detailData.problemStatement || detailData.title}
                </div>
              </div>

              {/* 4. Dampak Permasalahan */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 text-2xs flex items-center justify-center font-bold">4</span>
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Dampak Permasalahan terhadap Capaian Kinerja / SPM</span>
                </div>
                <div className="pl-7 text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-rose-50/40 dark:bg-rose-950/20 p-3 rounded-lg border border-rose-200 dark:border-rose-900/40 whitespace-pre-wrap">
                  {detailData.impact || 'Belum diisi.'}
                </div>
              </div>

              {/* 5. Kebutuhan Intervensi / Kajian */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-2xs flex items-center justify-center font-bold">5</span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Kebutuhan Intervensi / Kajian Litbang</span>
                </div>
                <div className="pl-7 text-xs font-semibold text-blue-900 dark:text-blue-300 leading-relaxed bg-blue-50/40 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-900/40 whitespace-pre-wrap">
                  {detailData.potentialNeed}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Baseline Alignment Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Dokumen Baseline & Keterkaitan Regulasi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              {baselineDoc ? (
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white block">
                        {baselineDoc.title} ({baselineDoc.code})
                      </span>
                      <span className="text-[10px] text-gray-400 block">
                        Versi Rujukan: v{detailData.sourceVersion?.versionNumber || '1'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-xs italic">
                  Tidak ada dokumen baseline resmi yang dilampirkan.
                </div>
              )}

              {detailData.baselineRelationship && (
                <div className="pt-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">
                    Analisis Keterkaitan Sasaran / Indikator:
                  </span>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-950 p-2.5 rounded border border-gray-200 dark:border-gray-800">
                    {detailData.baselineRelationship}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Review Status, Notes, & Meta */}
        <div className="space-y-6">
          {/* Review Status Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Status & Catatan Telaah</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Status Saat Ini</span>
                <div className="mt-1">{renderStatusBadge(detailData.status)}</div>
              </div>

              {detailData.reviewedBy && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Diteliti / Ditelaah Oleh</span>
                  <div className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                    {detailData.reviewedBy.name} ({detailData.reviewedBy.role})
                  </div>
                  {detailData.reviewedAt && (
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      {new Date(detailData.reviewedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              )}

              {detailData.reviewNote && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">
                    Catatan Tinjauan Penelaah
                  </span>
                  <div
                    className={`p-2.5 rounded text-xs leading-relaxed ${
                      detailData.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-300'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-300'
                    }`}
                  >
                    {detailData.reviewNote}
                  </div>
                </div>
              )}

              {detailData.analysisNotes && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">
                    Catatan Internal Analis BRIDA
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-900 p-2.5 rounded border border-gray-150 dark:border-gray-800">
                    {detailData.analysisNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Research Proposal Connection Card */}
          {detailData.status === 'APPROVED' && (
            <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-xs">
                  <FileCheck className="h-4.5 w-4.5" />
                  <span>Siap Masuk Modul Penelitian</span>
                </div>
                <p className="text-2xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Identifikasi kebutuhan ini telah divalidasi dan memenuhi syarat untuk dijadikan rujukan penyusunan Usulan Penelitian (Research Proposal).
                </p>
                <button
                  onClick={() => router.push(`/research-proposals/new?identificationId=${detailData.id}`)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Buat Usulan Penelitian</span>
                </button>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardContent className="p-4 space-y-2 text-2xs text-gray-400">
              <div className="flex justify-between">
                <span>Dibuat pada:</span>
                <span className="font-semibold text-gray-600 dark:text-gray-300">
                  {new Date(detailData.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Terakhir diperbarui:</span>
                <span className="font-semibold text-gray-600 dark:text-gray-300">
                  {new Date(detailData.updatedAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ================= MODAL: APPROVE ================= */}
      <Dialog
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        title="Setujui Identifikasi Kebutuhan OPD"
        description="Persetujuan resmi terhadap hasil telaah identifikasi kebutuhan."
        footer={
          <>
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all"
            >
              {isProcessing ? 'Memproses...' : 'Setujui (Approve)'}
            </button>
            <button
              onClick={() => setIsApproveOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-750 dark:text-gray-300 rounded-lg text-xs font-semibold bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Dengan menyetujui identifikasi ini, status akan berubah menjadi <strong>APPROVED</strong> dan dapat langsung dikonversi menjadi Usulan Penelitian pada Modul Penelitian SIM-RIDA.
          </p>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Catatan Persetujuan (Opsional)
            </label>
            <textarea
              rows={3}
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              placeholder="Contoh: Telah sesuai dengan prioritas pembangunan daerah dan siap ditindaklanjuti untuk usulan riset..."
              className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </Dialog>

      {/* ================= MODAL: REJECT ================= */}
      <Dialog
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="Tolak / Minta Revisi Identifikasi Kebutuhan"
        description="Penolakan telaah identifikasi kebutuhan dengan catatan perbaikan."
        footer={
          <>
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all"
            >
              {isProcessing ? 'Memproses...' : 'Tolak Identifikasi'}
            </button>
            <button
              onClick={() => setIsRejectOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-750 dark:text-gray-300 rounded-lg text-xs font-semibold bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Berikan alasan penolakan atau catatan perbaikan yang harus dilengkapi oleh tim analis litbang.
          </p>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Alasan Penolakan / Catatan Revisi *
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Jelaskan alasan penolakan dan bagian yang perlu diperbaiki..."
              className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

