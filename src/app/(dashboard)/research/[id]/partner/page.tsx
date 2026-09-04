'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { usePlanningStore } from '@/store/usePlanningStore';
import { usePartnerStore } from '@/store/usePartnerStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import {
  ArrowLeft,
  Sparkles,
  Link,
  ClipboardList,
  CheckCircle2,
  FileText,
  UserCheck,
  Award,
  AlertTriangle,
  History,
  Clock,
  DollarSign,
  Send,
  Check,
  X,
  Info
} from 'lucide-react';

export default function PartnerOverviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { researchRecords, proposals, fetchProposals } = useResearchStore();
  const { getRab, fetchPlanning } = usePlanningStore();
  const { getMethod, getCandidates, getActivities, submitPartnerForReview, fetchPartners } = usePartnerStore();

  const isBrida = user?.role === 'BRIDA';
  const isKepalaBrida = user?.role === 'KEPALA_BRIDA';
  const id = params?.id || '';

  useEffect(() => {
    fetchPartners();
    fetchProposals();
    fetchPlanning();
  }, [id, fetchPartners, fetchProposals, fetchPlanning]);

  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

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

  const activities = useMemo(() => getActivities(id), [getActivities, id]);

  // Tally totals
  const rabTotal = useMemo(() => {
    return rab.items.reduce((sum, item) => sum + item.subtotal, 0);
  }, [rab]);

  // Find recommended candidate
  const recommendedCandidate = useMemo(() => {
    return candidates.find(c => c.evaluation?.recommendation === 'RECOMMENDED');
  }, [candidates]);

  // Stepper: KAK & RAB APPROVED ➔ METHOD ➔ CANDIDATE ➔ EVALUATION ➔ APPROVAL ➔ SELECTED PARTNER
  const stepperStates = useMemo(() => {
    const states = {
      approved: 'completed',
      method: 'future',
      candidate: 'future',
      evaluation: 'future',
      finalApprove: 'future',
    };

    if (method.method) {
      states.method = method.status === 'APPROVED' ? 'completed' : 'active';
    }
    if (method.method === 'SWAKELOLA') {
      states.candidate = 'completed'; // Swakelola skips external candidate
      states.evaluation = 'completed';
    } else if (candidates.length > 0) {
      states.candidate = method.status === 'APPROVED' ? 'completed' : 'active';
      if (candidates.some(c => !!c.evaluation)) {
        states.evaluation = method.status === 'APPROVED' ? 'completed' : 'active';
      }
    }

    if (method.status === 'UNDER_REVIEW') {
      states.method = 'completed';
      states.candidate = 'completed';
      states.evaluation = 'completed';
      states.finalApprove = 'active';
    }

    if (method.status === 'APPROVED') {
      states.method = 'completed';
      states.candidate = 'completed';
      states.evaluation = 'completed';
      states.finalApprove = 'completed';
    }

    return states;
  }, [method, candidates]);

  // Budget validation check
  // Compare candidate price vs RAB
  const budgetValidation = useMemo(() => {
    if (method.method === 'SWAKELOLA' || !recommendedCandidate) {
      return { status: 'Within RAB', isAbove: false };
    }
    const isAbove = recommendedCandidate.price > rabTotal;
    return {
      status: isAbove ? 'Above RAB' : 'Within RAB',
      isAbove,
    };
  }, [method, recommendedCandidate, rabTotal]);

  // Phase 6 Validation Rule
  const partnerValidation = useMemo(() => {
    const errors: string[] = [];

    // Rule 1: Method selected?
    if (!method.method) {
      errors.push('Metode pelaksanaan belum ditentukan');
    }
    // Rule 2: Reason filled?
    if (method.method && !method.justification?.trim()) {
      errors.push('Alasan/justifikasi pemilihan metode wajib diisi');
    }

    // Swakelola validation
    if (method.method === 'SWAKELOLA') {
      // Swakelola valid by default if justification is provided
    } else if (method.method) {
      // External methods validation
      if (candidates.length === 0) {
        errors.push('Calon penyedia/mitra belum didaftarkan');
      } else {
        // Evaluation completed?
        const evaluatedCount = candidates.filter(c => !!c.evaluation).length;
        if (evaluatedCount === 0) {
          errors.push('Belum ada evaluasi kelayakan calon mitra');
        }
        if (!recommendedCandidate) {
          errors.push('Belum ada kandidat yang mendapatkan rekomendasi (RECOMMENDED)');
        }
      }
    }

    const isValid = errors.length === 0;

    return { isValid, errors };
  }, [method, candidates, recommendedCandidate]);

  const handleConfirmSubmit = async () => {
    try {
      await submitPartnerForReview(id, user?.name || 'BRIDA Litbang');
      setIsSubmitOpen(false);
      toast('Pemilihan metode & hasil evaluasi mitra berhasil dikirim ke Kepala BRIDA.', 'success');
    } catch (err: any) {
      toast('Gagal mengajukan review mitra: ' + (err.message || 'Terjadi kesalahan.'), 'error');
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
      
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push(`/research/${record.id}/planning`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Planning Overview</span>
        </button>
      </div>

      <PageHeader
        title="Penentuan Metode & Mitra Penelitian"
        description={`Manajemen penentuan metode kerja dan pencatatan mitra terpilih untuk Penelitian #${record.id}`}
        action={
          isKepalaBrida && method.status === 'UNDER_REVIEW' && (
            <button
              onClick={() => router.push(`/research/${record.id}/partner/review`)}
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
              <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-355 flex items-center justify-center text-[10px]">✓</span>
              <span className="text-emerald-700 text-[10px]">KAK & RAB APPROVED</span>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-800 grow hidden md:block mx-1" />

            <div className="flex items-center gap-2">
              {stepperStates.method === 'completed' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-355 flex items-center justify-center text-[10px]">✓</span>
              ) : stepperStates.method === 'active' ? (
                <span className="h-5 w-5 rounded-full bg-blue-50 text-blue-700 border border-blue-600 flex items-center justify-center text-[10px] animate-pulse">●</span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={stepperStates.method === 'completed' ? 'text-emerald-700' : stepperStates.method === 'active' ? 'text-blue-600' : 'text-gray-400'}>
                METHOD SELECTED
              </span>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-800 grow hidden md:block mx-1" />

            <div className="flex items-center gap-2">
              {stepperStates.candidate === 'completed' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-355 flex items-center justify-center text-[10px]">✓</span>
              ) : stepperStates.candidate === 'active' ? (
                <span className="h-5 w-5 rounded-full bg-blue-50 text-blue-700 border border-blue-600 flex items-center justify-center text-[10px] animate-pulse">●</span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={stepperStates.candidate === 'completed' ? 'text-emerald-700' : stepperStates.candidate === 'active' ? 'text-blue-600' : 'text-gray-400'}>
                CANDIDATE REGISTERED
              </span>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-800 grow hidden md:block mx-1" />

            <div className="flex items-center gap-2">
              {stepperStates.evaluation === 'completed' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-355 flex items-center justify-center text-[10px]">✓</span>
              ) : stepperStates.evaluation === 'active' ? (
                <span className="h-5 w-5 rounded-full bg-blue-50 text-blue-700 border border-blue-600 flex items-center justify-center text-[10px] animate-pulse">●</span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={stepperStates.evaluation === 'completed' ? 'text-emerald-700' : stepperStates.evaluation === 'active' ? 'text-blue-600' : 'text-gray-400'}>
                EVALUATION DONE
              </span>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-800 grow hidden md:block mx-1" />

            <div className="flex items-center gap-2">
              {stepperStates.finalApprove === 'completed' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-355 flex items-center justify-center text-[10px]">✓</span>
              ) : stepperStates.finalApprove === 'active' ? (
                <span className="h-5 w-5 rounded-full bg-blue-50 text-blue-700 border border-blue-600 flex items-center justify-center text-[10px] animate-pulse">●</span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={stepperStates.finalApprove === 'completed' ? 'text-emerald-700' : stepperStates.finalApprove === 'active' ? 'text-blue-600' : 'text-gray-400'}>
                SELECTED PARTNER
              </span>
            </div>

          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* ================= LEFT SECTION (Method card & Candidates Summary) ================= */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Method Selection Card */}
          <Card>
            <CardHeader className="pb-3 border-b dark:border-gray-850 flex flex-row justify-between items-center">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Pencatatan Metode Pelaksanaan
              </CardTitle>
              <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                method.status === 'APPROVED' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                  : method.status === 'UNDER_REVIEW'
                  ? 'bg-amber-50 text-amber-700 border-amber-250'
                  : method.status === 'REVISION_REQUIRED'
                  ? 'bg-rose-50 text-rose-700 border-rose-250'
                  : method.status === 'DRAFT'
                  ? 'bg-gray-100 text-gray-650 border-gray-250'
                  : 'bg-gray-50 text-gray-400 border-gray-200'
              }`}>
                {method.status === 'NOT_STARTED' ? 'Not Selected' : method.status}
              </span>
            </CardHeader>
            <CardContent className="pt-4 text-xs space-y-4">
              {(!method.method || method.status === 'NOT_STARTED') && !method.justification ? (
                <div className="text-center py-6 space-y-3">
                  <p className="text-gray-450 italic">Metode pelaksanaan pengadaan belum ditentukan.</p>
                  {isBrida && (
                    <button
                      onClick={() => router.push(`/research/${record.id}/partner/method`)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-3xs uppercase transition-all"
                    >
                      Pilih Metode
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <span className="text-gray-400 block font-bold text-[9px] uppercase">Metode Pemilihan</span>
                      <span className="font-extrabold text-gray-800 dark:text-gray-200 text-sm">{method.method}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-bold text-[9px] uppercase">Ditetapkan Oleh</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{method.updatedBy || '-'} ({method.updatedAt})</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-400 block font-bold text-[9px] uppercase">Alasan Pemilihan Metode</span>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900 p-3 border rounded mt-1">
                      {method.justification}
                    </p>
                  </div>

                  {isBrida && method.status !== 'APPROVED' && method.status !== 'UNDER_REVIEW' && (
                    <div className="pt-2 border-t dark:border-gray-850 flex justify-end">
                      <button
                        onClick={() => router.push(`/research/${record.id}/partner/method`)}
                        className="px-3 py-1 border border-blue-200 hover:bg-blue-50/20 text-blue-650 font-bold text-3xs uppercase rounded transition-all bg-white dark:bg-gray-950"
                      >
                        Sunting Metode
                      </button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Calon Mitra & Evaluasi Card (Not started / Swakelola / External Methods) */}
          {method.method && (
            <Card>
              <CardHeader className="pb-3 border-b dark:border-gray-850 flex flex-row justify-between items-center">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {method.method === 'SWAKELOLA' ? 'Tim Pelaksana Internal' : 'Calon Mitra & Evaluasi Penilaian'}
                </CardTitle>
                {isBrida && method.status !== 'APPROVED' && method.status !== 'UNDER_REVIEW' && (
                  <div className="flex gap-1.5">
                    {method.method === 'SWAKELOLA' ? (
                      <button
                        onClick={() => router.push(`/research/${record.id}/partner/method`)}
                        className="px-2 py-1 border border-gray-300 hover:bg-gray-50 rounded text-3xs font-bold uppercase bg-white dark:bg-gray-950 text-gray-700 dark:border-gray-800 dark:text-gray-300"
                      >
                        Manage Team
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => router.push(`/research/${record.id}/partner/candidates`)}
                          className="px-2 py-1 border border-gray-300 hover:bg-gray-50 rounded text-3xs font-bold uppercase bg-white dark:bg-gray-950 text-gray-700 dark:border-gray-800 dark:text-gray-300"
                        >
                          Calon Mitra
                        </button>
                        <button
                          onClick={() => router.push(`/research/${record.id}/partner/evaluation`)}
                          disabled={candidates.length === 0}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-3xs font-bold uppercase transition-all"
                        >
                          Evaluasi Mitra
                        </button>
                      </>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-4 text-xs">
                {method.method === 'SWAKELOLA' ? (
                  <div className="space-y-4">
                    <p className="text-gray-450 italic leading-normal">
                      * Penyelarasan riset Swakelola menggunakan Tim Pelaksana Internal BRIDA daerah:
                    </p>
                    {(!method.swakelolaDetails?.internalTeam || method.swakelolaDetails.internalTeam.length === 0) ? (
                      <p className="text-rose-600 font-bold">Belum ada personil tim internal yang ditambahkan.</p>
                    ) : (
                      <div className="border rounded divide-y dark:divide-gray-850 bg-gray-50/50 dark:bg-gray-900/50">
                        {method.swakelolaDetails.internalTeam.map((member) => (
                          <div key={member.id} className="p-3 flex justify-between items-start">
                            <div>
                              <span className="font-bold text-gray-800 dark:text-gray-250 block">{member.name}</span>
                              <span className="text-[10px] text-gray-400 font-semibold">{member.position} • {member.expertise}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-3xs bg-blue-50 text-blue-700 font-bold border border-blue-200">
                              {member.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {candidates.length === 0 ? (
                      <div className="text-center py-4 space-y-2">
                        <p className="text-gray-450 italic">Belum ada calon mitra yang didaftarkan.</p>
                        {isBrida && (
                          <button
                            onClick={() => router.push(`/research/${record.id}/partner/candidates`)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-3xs uppercase transition-all"
                          >
                            Tambah Calon
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* List candidates simple summaries */}
                        <div className="border rounded divide-y dark:divide-gray-850">
                          {candidates.map((c) => {
                            const score = c.evaluation 
                              ? c.evaluation.competence + c.evaluation.experience + c.evaluation.capacity + c.evaluation.methodology + c.evaluation.cost + c.evaluation.availability
                              : null;
                            const percentage = score ? Number(((score / 30) * 100).toFixed(0)) : null;

                            return (
                              <div key={c.id} className="p-3 flex justify-between items-center">
                                <div>
                                  <span className="font-bold text-gray-800 dark:text-gray-250 block">{c.name}</span>
                                  <span className="text-[10px] text-gray-400 font-semibold">
                                    {c.type} • {formatIDR(c.price)} • {c.documents.length} Dokumen
                                  </span>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                  <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                                    c.status === 'SELECTED'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                                      : c.status === 'RECOMMENDED'
                                      ? 'bg-blue-50 text-blue-700 border-blue-250'
                                      : c.status === 'EVALUATED'
                                      ? 'bg-purple-50 text-purple-700 border-purple-250'
                                      : 'bg-gray-100 text-gray-600 border-gray-250'
                                  }`}>
                                    {c.status}
                                  </span>
                                  {percentage !== null && (
                                    <span className="text-2xs font-bold text-purple-750 dark:text-purple-400">Score: {percentage}%</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Recommended Partner Box */}
                        {recommendedCandidate && (
                          <div className="p-3 border border-emerald-200 bg-emerald-50/5 rounded space-y-2">
                            <span className="text-[9px] text-emerald-600 font-bold block uppercase tracking-wider">
                              Rekomendasi Hasil Evaluasi (Terbaik)
                            </span>
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">{recommendedCandidate.name}</span>
                              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-450">
                                {formatIDR(recommendedCandidate.price)}
                              </span>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 text-2xs">
                              <div>
                                <span className="text-gray-400 font-bold block uppercase text-[8px]">Nilai Kelayakan</span>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                  {recommendedCandidate.evaluation ? (
                                    `${recommendedCandidate.evaluation.competence + recommendedCandidate.evaluation.experience + recommendedCandidate.evaluation.capacity + recommendedCandidate.evaluation.methodology + recommendedCandidate.evaluation.cost + recommendedCandidate.evaluation.availability} / 30 Score`
                                  ) : '-'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 font-bold block uppercase text-[8px]">Status Anggaran vs RAB</span>
                                <span className={`font-bold ${budgetValidation.isAbove ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  {budgetValidation.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Validation & Submit Panel (Section 39) */}
          {isBrida && method.status !== 'APPROVED' && method.status !== 'UNDER_REVIEW' && (
            <Card>
              <CardHeader className="pb-3 border-b dark:border-gray-850">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-gray-400" />
                  <span>Partner Validation Checklist</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                
                <div className="grid gap-2 sm:grid-cols-2 text-2xs font-bold">
                  <div className="flex items-center gap-2">
                    {method.method ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-rose-600" />
                    )}
                    <span className={method.method ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                      Metode Pelaksanaan Terpilih
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {(method.method && !!method.justification.trim()) ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-rose-600" />
                    )}
                    <span className={(method.method && !!method.justification.trim()) ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                      Justifikasi / Alasan Terisi
                    </span>
                  </div>

                  {method.method === 'SWAKELOLA' ? (
                    <div className="flex items-center gap-2">
                      {((method.swakelolaDetails?.internalTeam || []).length > 0) ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <X className="h-4 w-4 text-rose-600" />
                      )}
                      <span className={((method.swakelolaDetails?.internalTeam || []).length > 0) ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                        Tim Pelaksana Internal Ditunjuk
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        {candidates.length > 0 ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <X className="h-4 w-4 text-rose-600" />
                        )}
                        <span className={candidates.length > 0 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                          Calon Mitra Terdaftar
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {recommendedCandidate ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <X className="h-4 w-4 text-rose-600" />
                        )}
                        <span className={recommendedCandidate ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                          Rekomendasi Evaluasi Selesai
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {!partnerValidation.isValid ? (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 rounded text-rose-750 dark:text-rose-400 text-2xs space-y-1">
                    <span className="font-bold block uppercase text-[9px] mb-1">Partner Validation Errors:</span>
                    {partnerValidation.errors.map((err, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 rounded text-emerald-750 dark:text-emerald-400 text-2xs flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                    <span>Seluruh data metode dan penunjukan mitra tervalidasi lengkap dan siap diajukan untuk review!</span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setIsSubmitOpen(true)}
                    disabled={!partnerValidation.isValid}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                  >
                    <Send className="h-4 w-4" />
                    <span>Submit Partner for Review</span>
                  </button>
                </div>

              </CardContent>
            </Card>
          )}

        </div>

        {/* ================= RIGHT SECTION (Research Info & audit trails) ================= */}
        <div className="space-y-6">
          
          {/* Research Information */}
          <Card>
            <CardHeader className="pb-2 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Link className="h-4 w-4 text-gray-400" />
                <span>Referensi Asal Penelitian</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs">
              <div>
                <span className="text-gray-400 block font-bold text-[9px] uppercase">Research ID</span>
                <span className="font-bold text-gray-900 dark:text-white">{record.id}</span>
              </div>
              
              <div>
                <span className="text-gray-400 block font-bold text-[9px] uppercase">Judul Penelitian</span>
                <span className="font-semibold text-gray-800 dark:text-gray-250 leading-relaxed block mt-0.5">{record.title}</span>
              </div>

              <div>
                <span className="text-gray-400 block font-bold text-[9px] uppercase">RAB Total Anggaran</span>
                <span className="font-bold text-purple-750 dark:text-purple-400">{formatIDR(rabTotal)}</span>
              </div>

              <div className="pt-2 border-t dark:border-gray-850 flex flex-wrap gap-1.5">
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-200">
                  KAK APPROVED
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-200">
                  RAB APPROVED
                </span>
                {method.status === 'APPROVED' && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    <span>Ready for Implementation</span>
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Audit trail information */}
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
                  <span className="font-semibold text-gray-850 dark:text-gray-250">{method.updatedBy || 'BRIDA'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase text-[8px]">Created Date</span>
                  <span className="font-semibold text-gray-850 dark:text-gray-250">{record.approvedDate}</span>
                </div>
                {method.status === 'APPROVED' && (
                  <>
                    <div>
                      <span className="text-gray-400 block font-bold uppercase text-[8px]">Approved By</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-450">{method.decisionBy}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-bold uppercase text-[8px]">Approved Date</span>
                      <span className="font-semibold text-gray-850 dark:text-gray-250">{method.decisionDate}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline Partner Activities */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <History className="h-4 w-4" />
                <span>Timeline Activities</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {activities.length === 0 ? (
                <p className="text-[11px] text-gray-400 italic">Belum ada riwayat aktivitas penentuan mitra.</p>
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
                      <p className="text-[10px] text-gray-455 italic leading-relaxed">{act.details}</p>
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
        title="Ajukan Review Metode & Calon Mitra"
        description="Submit partner selection details for review?"
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
          Setelah diajukan, status metode pelaksanaan akan diubah menjadi **Under Review** dan dikirim secara resmi kepada Kepala BRIDA. Dokumen dan calon mitra akan dikunci dari penyuntingan lebih lanjut selama proses peninjauan berlangsung.
        </p>
      </Dialog>

    </div>
  );
}
