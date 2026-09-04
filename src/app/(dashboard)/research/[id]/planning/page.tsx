'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useIdentificationStore } from '@/store/useIdentificationStore';
import { usePlanningStore } from '@/store/usePlanningStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import {
  ArrowLeft,
  FileText,
  DollarSign,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Link,
  History,
  Check,
  X,
  Info,
  Send
} from 'lucide-react';

export default function PlanningOverviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { researchRecords, proposals, fetchProposals } = useResearchStore();
  const { identifications } = useIdentificationStore();
  const { getKak, getRab, getActivities, fetchPlanning, submitPlanningForReview } = usePlanningStore();

  const isBrida = user?.role === 'BRIDA';
  const isKepalaBrida = user?.role === 'KEPALA_BRIDA';
  const id = params?.id || '';

  // Auto-fetch fresh planning and proposals on mount
  useEffect(() => {
    fetchPlanning();
    fetchProposals();
  }, [id, fetchPlanning, fetchProposals]);

  // Confirm dialog state
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  // Find target research record with fallback
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

  // Find target proposal & identification
  const sourceProposal = useMemo(() => {
    if (!record) return null;
    return proposals.find((p) => p.id === record.proposalId || p.code === record.proposalId || p.id === id || p.code === id);
  }, [proposals, record, id]);

  const sourceIdent = useMemo(() => {
    if (!record) return null;
    return identifications.find((i) => i.id === record.identificationId);
  }, [identifications, record]);

  // Retrieve current KAK, RAB, activities
  const kak = useMemo(() => getKak(id), [getKak, id]);
  const rab = useMemo(() => getRab(id), [getRab, id]);
  const activities = useMemo(() => getActivities(id), [getActivities, id]);

  // Math tally for RAB
  const rabTotal = useMemo(() => {
    return rab.items.reduce((sum, item) => sum + item.subtotal, 0);
  }, [rab]);

  // Stepper calculations: RESEARCH APPROVED ➔ KAK ➔ RAB ➔ REVIEW ➔ APPROVED ➔ READY FOR IMPLEMENTATION
  const stepperStates = useMemo(() => {
    const states = {
      approved: 'completed',
      kak: 'future',
      rab: 'future',
      review: 'future',
      finalApprove: 'future',
    };

    if (kak.status !== 'NOT_STARTED') {
      states.kak = kak.status === 'APPROVED' ? 'completed' : 'active';
    }
    if (rab.items.length > 0) {
      states.rab = rab.status === 'APPROVED' ? 'completed' : 'active';
    }
    if (kak.status === 'UNDER_REVIEW' || rab.status === 'UNDER_REVIEW') {
      states.kak = 'completed';
      states.rab = 'completed';
      states.review = 'active';
    }
    if (kak.status === 'APPROVED' && rab.status === 'APPROVED') {
      states.kak = 'completed';
      states.rab = 'completed';
      states.review = 'completed';
      states.finalApprove = 'completed';
    }

    return states;
  }, [kak, rab]);

  // Budget Consistency Check
  const isBudgetConsistent = useMemo(() => {
    if (kak.status === 'NOT_STARTED') return false;
    return kak.budgetEstimates === 0 || kak.budgetEstimates === rabTotal || rabTotal > 0;
  }, [kak, rabTotal]);

  // Validation checks before submit
  const validationChecks = useMemo(() => {
    const checks = {
      kakComplete: kak.status !== 'NOT_STARTED' && !!kak.title && !!kak.background && !!kak.objective && !!kak.methodology && !!kak.output,
      rabComplete: rab.items.length > 0,
      rabTotalValid: rabTotal > 0,
      budgetConsistent: isBudgetConsistent,
    };

    const errors: string[] = [];
    if (kak.status === 'NOT_STARTED') errors.push('Dokumen KAK belum dibuat (Not Started)');
    else if (!checks.kakComplete) errors.push('Pengisian field wajib KAK belum lengkap');
    
    if (rab.items.length === 0) errors.push('Rincian item RAB masih kosong');
    else if (!checks.rabTotalValid) errors.push('Total anggaran RAB harus lebih dari Rp 0');

    const isValid = errors.length === 0;

    return { isValid, errors, checks };
  }, [kak, rab, rabTotal, isBudgetConsistent]);

  const handleConfirmSubmit = async () => {
    try {
      await submitPlanningForReview(id, user?.name || 'BRIDA Litbang');
      setIsSubmitOpen(false);
      toast('Dokumen KAK & RAB berhasil diajukan untuk review Kepala BRIDA.', 'success');
    } catch (err: any) {
      toast('Gagal mengajukan review: ' + (err.message || 'Terjadi kesalahan.'), 'error');
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

  // Format currency helper
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push(`/research/${record.id}`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Detail Penelitian</span>
        </button>
      </div>

      <PageHeader
        title="Research Planning Overview"
        description={`Penyusunan KAK & RAB Administrasi Perencanaan untuk Penelitian #${record.id}`}
        action={
          isKepalaBrida && kak.status === 'UNDER_REVIEW' && (
            <button
              onClick={() => router.push(`/research/${record.id}/planning/review`)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow"
            >
              <ClipboardList className="h-4 w-4" />
              <span>Go to Review Page</span>
            </button>
          )
        }
      />

      {/* Stepper timeline */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs font-bold">
            
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-350 flex items-center justify-center text-[10px]">✓</span>
              <span className="text-emerald-700 text-[10px]">APPROVED RECORD</span>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-800 grow hidden md:block mx-1" />

            <div className="flex items-center gap-2">
              {stepperStates.kak === 'completed' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-350 flex items-center justify-center text-[10px]">✓</span>
              ) : stepperStates.kak === 'active' ? (
                <span className="h-5 w-5 rounded-full bg-blue-50 text-blue-700 border border-blue-600 flex items-center justify-center text-[10px] animate-pulse">●</span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={stepperStates.kak === 'completed' ? 'text-emerald-700' : stepperStates.kak === 'active' ? 'text-blue-600' : 'text-gray-400'}>
                KAK DRAFT
              </span>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-800 grow hidden md:block mx-1" />

            <div className="flex items-center gap-2">
              {stepperStates.rab === 'completed' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-350 flex items-center justify-center text-[10px]">✓</span>
              ) : stepperStates.rab === 'active' ? (
                <span className="h-5 w-5 rounded-full bg-blue-50 text-blue-700 border border-blue-600 flex items-center justify-center text-[10px] animate-pulse">●</span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={stepperStates.rab === 'completed' ? 'text-emerald-700' : stepperStates.rab === 'active' ? 'text-blue-600' : 'text-gray-400'}>
                RAB ITEMS
              </span>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-800 grow hidden md:block mx-1" />

            <div className="flex items-center gap-2">
              {stepperStates.review === 'completed' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-350 flex items-center justify-center text-[10px]">✓</span>
              ) : stepperStates.review === 'active' ? (
                <span className="h-5 w-5 rounded-full bg-blue-50 text-blue-700 border border-blue-600 flex items-center justify-center text-[10px] animate-pulse">●</span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={stepperStates.review === 'completed' ? 'text-emerald-700' : stepperStates.review === 'active' ? 'text-blue-600' : 'text-gray-400'}>
                UNDER REVIEW
              </span>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-800 grow hidden md:block mx-1" />

            <div className="flex items-center gap-2">
              {stepperStates.finalApprove === 'completed' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-350 flex items-center justify-center text-[10px]">✓</span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={stepperStates.finalApprove === 'completed' ? 'text-emerald-700' : 'text-gray-400'}>
                APPROVED
              </span>
            </div>

          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* ================= LEFT SECTION (Document cards & consistency validation) ================= */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Document Status Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            
            {/* KAK Card */}
            <Card>
              <CardHeader className="pb-3 border-b dark:border-gray-850">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex justify-between items-center">
                  <span>Kerangka Acuan Kerja (KAK)</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">v{kak.version}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-2xs">
                    <span className="text-gray-400">Status Dokumen:</span>
                    <span className="font-bold">{kak.status === 'NOT_STARTED' ? 'Not Started' : kak.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-2xs">
                    <span className="text-gray-400">Pagu Anggaran:</span>
                    <span className="font-semibold">{formatIDR(kak.budgetEstimates)}</span>
                  </div>
                  <div className="flex justify-between items-center text-2xs">
                    <span className="text-gray-400">Diupdate Oleh:</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{kak.updatedBy || '-'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t dark:border-gray-850 flex gap-2">
                  {kak.status === 'NOT_STARTED' ? (
                    <button
                      onClick={() => router.push(`/research/${record.id}/kak/edit`)}
                      disabled={!isBrida}
                      className="w-full text-center py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-3xs uppercase rounded transition-all"
                    >
                      Create KAK
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => router.push(`/research/${record.id}/kak`)}
                        className="grow text-center py-1.5 border border-gray-300 hover:bg-gray-50 rounded text-gray-700 font-bold text-3xs uppercase transition-all bg-white dark:bg-gray-950 dark:border-gray-800 dark:text-gray-300"
                      >
                        Preview
                      </button>
                      {isBrida && kak.status !== 'APPROVED' && kak.status !== 'UNDER_REVIEW' && (
                        <button
                          onClick={() => router.push(`/research/${record.id}/kak/edit`)}
                          className="px-3 text-center py-1.5 border border-blue-200 hover:bg-blue-50/20 text-blue-600 font-bold text-3xs uppercase rounded transition-all bg-white dark:bg-gray-950"
                        >
                          Edit
                        </button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* RAB Card */}
            <Card>
              <CardHeader className="pb-3 border-b dark:border-gray-850">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex justify-between items-center">
                  <span>Rencana Anggaran Biaya (RAB)</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">v{rab.version}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-2xs">
                    <span className="text-gray-400">Status Dokumen:</span>
                    <span className="font-bold">{rab.status === 'NOT_STARTED' ? 'Not Started' : rab.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-2xs">
                    <span className="text-gray-400">Total Belanja (RAB):</span>
                    <span className="font-bold text-purple-700 dark:text-purple-400">{formatIDR(rabTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-2xs">
                    <span className="text-gray-400">Total Item Belanja:</span>
                    <span className="font-semibold">{rab.items.length} Komponen</span>
                  </div>
                </div>

                <div className="pt-3 border-t dark:border-gray-850 flex gap-2">
                  {rab.status === 'NOT_STARTED' ? (
                    <button
                      onClick={() => {
                        if (kak.status === 'NOT_STARTED') {
                          toast('Penyusunan RAB dapat dilakukan setelah KAK minimal selesai disimpan (DRAFT).', 'warning');
                        } else {
                          router.push(`/research/${record.id}/rab/edit`);
                        }
                      }}
                      disabled={!isBrida || kak.status === 'NOT_STARTED'}
                      className="w-full text-center py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-3xs uppercase rounded transition-all"
                    >
                      Create RAB
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => router.push(`/research/${record.id}/rab`)}
                        className="grow text-center py-1.5 border border-gray-300 hover:bg-gray-50 rounded text-gray-700 font-bold text-3xs uppercase transition-all bg-white dark:bg-gray-950 dark:border-gray-800 dark:text-gray-300"
                      >
                        Preview
                      </button>
                      {isBrida && rab.status !== 'APPROVED' && rab.status !== 'UNDER_REVIEW' && (
                        <button
                          onClick={() => router.push(`/research/${record.id}/rab/edit`)}
                          className="px-3 text-center py-1.5 border border-blue-200 hover:bg-blue-50/20 text-blue-600 font-bold text-3xs uppercase rounded transition-all bg-white dark:bg-gray-950"
                        >
                          Edit
                        </button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Budget Consistency check panel */}
          <Card>
            <CardHeader className="pb-2 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <span>Anggaran & Konsistensi Belanja (KAK vs RAB)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs font-semibold">
              <div className="grid gap-4 sm:grid-cols-3 text-center p-3 bg-gray-50 dark:bg-gray-900 border rounded">
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase mb-0.5">Pagu Anggaran KAK</span>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-250">{formatIDR(kak.budgetEstimates)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase mb-0.5">Total Belanja RAB</span>
                  <span className="text-sm font-bold text-purple-750 dark:text-purple-400">{formatIDR(rabTotal)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase mb-0.5">Status Sinkronisasi</span>
                  {kak.status !== 'NOT_STARTED' && isBudgetConsistent ? (
                    <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-600 dark:text-emerald-450 mt-1">
                      <Check className="h-4 w-4" />
                      <span>Budget Consistent</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-2xs font-bold text-rose-600 dark:text-rose-450 mt-1">
                      <X className="h-4 w-4" />
                      <span>Budget Mismatch</span>
                    </span>
                  )}
                </div>
              </div>

              {kak.status !== 'NOT_STARTED' && !isBudgetConsistent && (
                <p className="text-[11px] text-gray-400 font-medium leading-relaxed italic text-center">
                  * Total RAB tidak sesuai dengan pagu anggaran kasar yang tercantum pada dokumen KAK. Selaraskan pagu KAK atau item belanja RAB terlebih dahulu.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Planning Validation panel (Section 39) */}
          {isBrida && kak.status !== 'APPROVED' && kak.status !== 'UNDER_REVIEW' && (
            <Card>
              <CardHeader className="pb-3 border-b dark:border-gray-850">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-gray-400" />
                  <span>Planning Validation Checklist</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                
                <div className="grid gap-2 sm:grid-cols-2 text-2xs font-bold">
                  <div className="flex items-center gap-2">
                    {validationChecks.checks.kakComplete ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-rose-600" />
                    )}
                    <span className={validationChecks.checks.kakComplete ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                      Dokumen KAK Lengkap & Disimpan
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {validationChecks.checks.rabComplete ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-rose-600" />
                    )}
                    <span className={validationChecks.checks.rabComplete ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                      RAB Memiliki Minimal 1 Item
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {validationChecks.checks.rabTotalValid ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-rose-600" />
                    )}
                    <span className={validationChecks.checks.rabTotalValid ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                      Anggaran RAB Lebih dari Rp 0
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {validationChecks.checks.budgetConsistent ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-rose-600" />
                    )}
                    <span className={validationChecks.checks.budgetConsistent ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                      Konsistensi Anggaran KAK & RAB
                    </span>
                  </div>
                </div>

                {!validationChecks.isValid ? (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 rounded text-rose-750 dark:text-rose-400 text-2xs space-y-1">
                    <span className="font-bold block uppercase text-[9px] mb-1">Planning Validation Errors:</span>
                    {validationChecks.errors.map((err, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 rounded text-emerald-750 dark:text-emerald-400 text-2xs flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                    <span>Seluruh komponen perencanaan KAK & RAB tervalidasi sinkron dan siap diajukan untuk review!</span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setIsSubmitOpen(true)}
                    disabled={!validationChecks.isValid}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                  >
                    <Send className="h-4 w-4" />
                    <span>Submit for Review</span>
                  </button>
                </div>

              </CardContent>
            </Card>
          )}

          {/* Next Step: Penentuan Metode & Mitra Card */}
          <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/10">
            <CardHeader className="pb-3 border-b border-blue-100 dark:border-blue-900/50">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-455 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                <span>Next Step: Penentuan Metode & Mitra</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs font-medium">
              <p className="text-gray-650 dark:text-gray-300 leading-normal">
                Setelah Kerangka Acuan Kerja (KAK) dan Rencana Anggaran Biaya (RAB) disetujui, tahap berikutnya adalah memilih metode pelaksanaan pengadaan (Swakelola, E-Katalog, Penunjukan Langsung, Tender) serta menetapkan mitra pelaksana riset.
              </p>

              {kak.status === 'APPROVED' && rab.status === 'APPROVED' ? (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => router.push(`/research/${record.id}/partner`)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow animate-pulse"
                  >
                    <span>Mulai Penentuan Metode</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 rounded text-amber-750 dark:text-amber-400 text-2xs flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Metode pelaksanaan belum dapat ditentukan karena KAK dan RAB belum disetujui.</span>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* ================= RIGHT SECTION (Research Info & audit trails) ================= */}
        <div className="space-y-6">
          
          {/* Research Information linking to Phase 4 items */}
          <Card>
            <CardHeader className="pb-2 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Link className="h-4 w-4 text-gray-400" />
                <span>Referensi Asal Penelitian</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs">
              <div>
                <span className="text-gray-405 block font-bold text-[9px] uppercase">Research ID</span>
                <span className="font-bold text-gray-900 dark:text-white">{record.id}</span>
              </div>
              
              <div>
                <span className="text-gray-405 block font-bold text-[9px] uppercase">Judul Penelitian</span>
                <span className="font-semibold text-gray-800 dark:text-gray-250 leading-relaxed block mt-0.5">{record.title}</span>
              </div>

              {sourceProposal && (
                <div className="pt-2 border-t dark:border-gray-850">
                  <span className="text-gray-405 block font-bold text-[9px] uppercase mb-1">Proposal Asal</span>
                  <div className="flex justify-between items-center text-2xs p-2 bg-gray-50 dark:bg-gray-900 border rounded">
                    <span className="font-bold text-gray-800 dark:text-gray-250">{sourceProposal.id}</span>
                    <button
                      onClick={() => router.push(`/research-proposals/${sourceProposal.id}`)}
                      className="text-blue-600 font-bold text-3xs uppercase"
                    >
                      View Proposal
                    </button>
                  </div>
                </div>
              )}

              {sourceIdent && (
                <div className="pt-2">
                  <span className="text-gray-405 block font-bold text-[9px] uppercase mb-1">Identifikasi Asal</span>
                  <div className="flex justify-between items-center text-2xs p-2 bg-gray-50 dark:bg-gray-900 border rounded">
                    <span className="font-bold text-gray-800 dark:text-gray-250">{sourceIdent.id}</span>
                    <button
                      onClick={() => router.push(`/identification/${sourceIdent.id}`)}
                      className="text-blue-600 font-bold text-3xs uppercase"
                    >
                      View Ident
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit trail information box */}
          <Card>
            <CardHeader className="pb-2 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Audit Trail Informasi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs leading-normal">
              <div className="grid grid-cols-2 gap-2 text-2xs">
                <div>
                  <span className="text-gray-400 block font-bold uppercase text-[8px]">Created By</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-250">{kak.updatedBy || 'BRIDA'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase text-[8px]">Created Date</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-250">{record.approvedDate}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase text-[8px]">Last Updated</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-250">{kak.updatedAt || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase text-[8px]">Version</span>
                  <span className="font-bold text-blue-600 dark:text-blue-450">v{kak.version}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Planning Activities */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <History className="h-4 w-4" />
                <span>Timeline Activities</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {activities.length === 0 ? (
                <p className="text-[11px] text-gray-400 italic">Belum ada riwayat aktivitas perencanaan.</p>
              ) : (
                <div className="relative border-l border-gray-200 dark:border-gray-800 pl-3.5 space-y-4 py-2">
                  {activities.map((act) => (
                    <div key={act.id} className="relative text-xs space-y-0.5">
                      <span className="absolute -left-[19.5px] top-1 h-2 w-2 rounded-full border border-white bg-blue-650" />
                      <div className="flex justify-between items-center text-[9px] text-gray-450 font-semibold">
                        <span>{act.date}</span>
                        <span>{act.user}</span>
                      </div>
                      <p className="font-bold text-gray-800 dark:text-gray-200">{act.action}</p>
                      <p className="text-[10px] text-gray-450 italic leading-relaxed">{act.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ================= MODAL: CONFIRM SUBMIT FOR REVIEW ================= */}
      <Dialog
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        title="Ajukan Review KAK & RAB"
        description="Submit KAK & RAB for review?"
        footer={
          <>
            <button
              onClick={handleConfirmSubmit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-all"
            >
              Ajukan Peninjauan
            </button>
            <button
              onClick={() => setIsSubmitOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <p className="text-xs text-gray-500 leading-relaxed">
          Setelah diajukan, status KAK dan RAB akan diubah menjadi **Under Review** dan dikirim secara resmi kepada Kepala BRIDA. Dokumen akan dikunci dari penyuntingan lebih lanjut selama proses peninjauan berlangsung.
        </p>
      </Dialog>

    </div>
  );
}
