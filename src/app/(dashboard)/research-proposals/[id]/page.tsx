'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useIdentificationStore } from '@/store/useIdentificationStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import {
  ArrowLeft,
  Edit,
  Send,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Link,
  History,
  FileText,
  Activity,
  AlertTriangle,
  Info,
  Award
} from 'lucide-react';

export default function ProposalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { proposals, submitForSelection, startSelection, approveResearch, rejectResearch } = useResearchStore();
  const { identifications } = useIdentificationStore();

  const isBrida = user?.role === 'BRIDA';
  const isKepalaBrida = user?.role === 'KEPALA_BRIDA';
  const id = params?.id;

  // Modals state
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isStartSelectionOpen, setIsStartSelectionOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Find target proposal
  const proposal = useMemo(() => {
    return proposals.find((p) => p.id === id);
  }, [proposals, id]);

  // Find source identification
  const sourceIdent = useMemo(() => {
    if (!proposal) return null;
    return identifications.find((i) => i.id === proposal.identificationId);
  }, [identifications, proposal]);

  if (!proposal) {
    return (
      <div className="space-y-6 text-center py-12 font-sans">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Usulan Tidak Ditemukan</h2>
        <p className="text-xs text-gray-500">ID data usulan penelitian tidak valid.</p>
        <button
          onClick={() => router.push('/research-proposals')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  // Calculate Selection Score metrics
  const selectionScoreInfo = useMemo(() => {
    if (!proposal.selectionDetails) return null;
    const {
      relevance,
      urgency,
      priorityAlignment,
      benefits,
      feasibility,
      dataAvailability,
      recommendationPotential
    } = proposal.selectionDetails;

    const total =
      relevance +
      urgency +
      priorityAlignment +
      benefits +
      feasibility +
      dataAvailability +
      recommendationPotential;

    const max = 35;
    const percentage = Number(((total / max) * 100).toFixed(2));

    return { total, max, percentage };
  }, [proposal]);

  // Workflow Stepper Calculations
  // IDENTIFICATION ➔ PROPOSAL ➔ SELECTION ➔ APPROVAL ➔ RESEARCH
  const stepperStates = useMemo(() => {
    const states = {
      ident: 'completed',
      prop: 'future',
      select: 'future',
      approve: 'future',
      research: 'future',
    };

    switch (proposal.status) {
      case 'DRAFT':
        states.prop = 'active';
        break;
      case 'SUBMITTED':
      case 'UNDER_SELECTION':
        states.prop = 'completed';
        states.select = 'active';
        break;
      case 'WAITING_APPROVAL':
        states.prop = 'completed';
        states.select = 'completed';
        states.approve = 'active';
        break;
      case 'APPROVED':
        states.prop = 'completed';
        states.select = 'completed';
        states.approve = 'completed';
        states.research = 'active'; // or completed
        break;
      case 'REJECTED':
        // Display rejected timeline representation
        states.prop = 'completed';
        states.select = 'completed';
        states.approve = 'active'; // rejected here
        break;
    }

    return states;
  }, [proposal]);

  // Action Triggers
  const handleConfirmSubmit = () => {
    submitForSelection(proposal.id, user?.name || 'BRIDA Litbang');
    setIsSubmitOpen(false);
    toast('Draf usulan berhasil diajukan untuk proses seleksi kelayakan.', 'success');
  };

  const handleConfirmStartSelection = async () => {
    try {
      await startSelection(proposal.id, user?.name || 'BRIDA Litbang');
      setIsStartSelectionOpen(false);
      toast('Proses seleksi dimulai. Silakan isi penilaian kelayakan usulan.', 'success');
      router.push(`/research-proposals/${proposal.id}/selection`);
    } catch (err) {
      toast('Gagal memulai seleksi usulan.', 'error');
    }
  };

  const handleConfirmApprove = () => {
    approveResearch(proposal.id, user?.name || 'Kepala BRIDA');
    setIsApproveOpen(false);
    toast('Persetujuan berhasil disimpan. Rekod Penelitian (PLANNED) telah dibuat.', 'success');
    router.push('/research');
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      toast('Alasan penolakan wajib diisi.', 'warning');
      return;
    }
    rejectResearch(proposal.id, rejectReason, user?.name || 'Kepala BRIDA');
    setIsRejectOpen(false);
    toast('Usulan resmi ditolak oleh Kepala BRIDA.', 'success');
  };

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    let bg = '';
    let text = '';
    let label = '';
    switch (status) {
      case 'DRAFT':
        bg = 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200';
        label = 'Draft';
        break;
      case 'SUBMITTED':
        bg = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200';
        label = 'Submitted';
        break;
      case 'UNDER_SELECTION':
        bg = 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200';
        label = 'Under Selection';
        break;
      case 'WAITING_APPROVAL':
        bg = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200';
        label = 'Waiting Approval';
        break;
      case 'APPROVED':
        bg = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200';
        label = 'Approved / Penetapan';
        break;
      case 'REJECTED':
        bg = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-450 border-rose-200';
        label = 'Rejected';
        break;
      default:
        bg = 'bg-gray-100 text-gray-700';
        label = status;
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-3xs font-bold border ${bg}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push('/research-proposals')}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Usulan</span>
        </button>
      </div>

      {/* Page Header */}
      <PageHeader
        title={proposal.title}
        description={`OPD Pengusul: ${proposal.opd}`}
        action={
          <div className="flex gap-2">
            
            {/* BRIDA actions on DRAFT */}
            {isBrida && proposal.status === 'DRAFT' && (
              <>
                <button
                  onClick={() => router.push(`/research-proposals/${proposal.id}/edit`)}
                  className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-all bg-white dark:bg-gray-950"
                >
                  <Edit className="h-4 w-4 text-gray-400" />
                  <span>Edit Usulan</span>
                </button>
                <button
                  onClick={() => setIsSubmitOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                >
                  <Send className="h-4 w-4" />
                  <span>Submit for Selection</span>
                </button>
              </>
            )}

            {/* BRIDA actions on SUBMITTED */}
            {isBrida && proposal.status === 'SUBMITTED' && (
              <button
                onClick={() => setIsStartSelectionOpen(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow"
              >
                <ClipboardList className="h-4 w-4" />
                <span>Start Selection</span>
              </button>
            )}

            {/* BRIDA actions on UNDER_SELECTION (direct link to selection form) */}
            {isBrida && proposal.status === 'UNDER_SELECTION' && (
              <button
                onClick={() => router.push(`/research-proposals/${proposal.id}/selection`)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow"
              >
                <ClipboardList className="h-4 w-4" />
                <span>Lanjutkan Seleksi</span>
              </button>
            )}

            {/* KEPALA BRIDA actions on WAITING_APPROVAL */}
            {isKepalaBrida && proposal.status === 'WAITING_APPROVAL' && (
              <>
                <button
                  onClick={() => setIsRejectOpen(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Reject Proposal</span>
                </button>
                <button
                  onClick={() => setIsApproveOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Approve Research</span>
                </button>
              </>
            )}

          </div>
        }
      />

      {/* ================= WORKFLOW STEPPER VISUAL (Stepping progress) ================= */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs font-bold">
            
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-350 flex items-center justify-center text-[10px]">✓</span>
              <span className="text-emerald-700">IDENTIFICATION</span>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-800 grow hidden md:block mx-2" />

            <div className="flex items-center gap-2">
              {stepperStates.prop === 'completed' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-350 flex items-center justify-center text-[10px]">✓</span>
              ) : stepperStates.prop === 'active' ? (
                <span className="h-5 w-5 rounded-full bg-blue-50 text-blue-700 border border-blue-600 flex items-center justify-center text-[10px] animate-pulse">●</span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={stepperStates.prop === 'completed' ? 'text-emerald-700' : stepperStates.prop === 'active' ? 'text-blue-600' : 'text-gray-400'}>
                PROPOSAL
              </span>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-800 grow hidden md:block mx-2" />

            <div className="flex items-center gap-2">
              {stepperStates.select === 'completed' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-350 flex items-center justify-center text-[10px]">✓</span>
              ) : stepperStates.select === 'active' ? (
                <span className="h-5 w-5 rounded-full bg-blue-50 text-blue-700 border border-blue-600 flex items-center justify-center text-[10px] animate-pulse">●</span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={stepperStates.select === 'completed' ? 'text-emerald-700' : stepperStates.select === 'active' ? 'text-blue-600' : 'text-gray-400'}>
                SELEKSI KELAYAKAN
              </span>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-800 grow hidden md:block mx-2" />

            <div className="flex items-center gap-2">
              {stepperStates.approve === 'completed' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-350 flex items-center justify-center text-[10px]">✓</span>
              ) : stepperStates.approve === 'active' ? (
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${
                  proposal.status === 'REJECTED' 
                    ? 'bg-rose-50 text-rose-700 border-rose-400' 
                    : 'bg-blue-50 text-blue-700 border-blue-600 animate-pulse'
                }`}>
                  {proposal.status === 'REJECTED' ? '✕' : '●'}
                </span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={
                stepperStates.approve === 'completed' 
                  ? 'text-emerald-700' 
                  : proposal.status === 'REJECTED' 
                  ? 'text-rose-700' 
                  : stepperStates.approve === 'active' 
                  ? 'text-blue-600' 
                  : 'text-gray-400'
              }>
                PENETAPAN KEPALA
              </span>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-800 grow hidden md:block mx-2" />

            <div className="flex items-center gap-2">
              {proposal.status === 'APPROVED' ? (
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-350 flex items-center justify-center text-[10px]">✓</span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">○</span>
              )}
              <span className={proposal.status === 'APPROVED' ? 'text-emerald-700' : 'text-gray-400'}>
                RESEARCH (PLANNED)
              </span>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Main details content grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* ================= LEFT SECTION (Overview & Text Content) ================= */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Metadata overview card */}
          <Card>
            <CardContent className="p-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3 text-xs">
              <div>
                <span className="text-gray-400 font-bold block uppercase text-[9px] mb-0.5">Status Usulan</span>
                {renderStatusBadge(proposal.status)}
              </div>
              <div>
                <span className="text-gray-400 font-bold block uppercase text-[9px] mb-0.5">Sektor</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{proposal.sector}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block uppercase text-[9px] mb-0.5">Prioritas Urgensi</span>
                <span className={`font-bold ${
                  proposal.priority === 'HIGH' ? 'text-rose-600' : proposal.priority === 'MEDIUM' ? 'text-amber-600' : 'text-blue-650'
                }`}>
                  {proposal.priority}
                </span>
              </div>
              <div className="pt-2 border-t dark:border-gray-800">
                <span className="text-gray-400 font-bold block uppercase text-[9px] mb-0.5">Durasi Kajian</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{proposal.duration}</span>
              </div>
              <div className="pt-2 border-t dark:border-gray-800">
                <span className="text-gray-400 font-bold block uppercase text-[9px] mb-0.5">Tanggal Pengajuan</span>
                <span className="font-medium text-gray-600 dark:text-gray-400">{proposal.submittedDate}</span>
              </div>
              <div className="pt-2 border-t dark:border-gray-800">
                <span className="text-gray-400 font-bold block uppercase text-[9px] mb-0.5">Pembaruan Terakhir</span>
                <span className="font-medium text-gray-600 dark:text-gray-400">{proposal.updatedDate}</span>
              </div>
            </CardContent>
          </Card>

          {/* Proposal Text Contents */}
          <Card>
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Rincian Usulan Kajian
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-5 text-xs leading-relaxed">
              
              <div>
                <span className="text-gray-400 font-bold block uppercase text-[9px] mb-1">Latar Belakang Permasalahan</span>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{proposal.background}</p>
              </div>

              <div className="pt-3 border-t dark:border-gray-850">
                <span className="text-gray-400 font-bold block uppercase text-[9px] mb-1">Rumusan Masalah</span>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line bg-gray-50/50 dark:bg-gray-900/50 p-3 border rounded border-gray-150 dark:border-gray-800">
                  {proposal.problemStatement}
                </p>
              </div>

              <div className="pt-3 border-t dark:border-gray-850">
                <span className="text-gray-400 font-bold block uppercase text-[9px] mb-1">Tujuan Penelitian</span>
                <p className="text-gray-700 dark:text-gray-300">{proposal.objective}</p>
              </div>

              {proposal.researchQuestions && (
                <div className="pt-3 border-t dark:border-gray-850">
                  <span className="text-gray-400 font-bold block uppercase text-[9px] mb-1">Pertanyaan Penelitian</span>
                  <p className="text-gray-705 dark:text-gray-300 whitespace-pre-line italic">{proposal.researchQuestions}</p>
                </div>
              )}

              <div className="pt-3 border-t dark:border-gray-850">
                <span className="text-gray-400 font-bold block uppercase text-[9px] mb-1">Ruang Lingkup Kajian</span>
                <p className="text-gray-700 dark:text-gray-300">{proposal.scope}</p>
              </div>

              <div className="pt-3 border-t dark:border-gray-850">
                <span className="text-gray-400 font-bold block uppercase text-[9px] mb-1">Output yang Diharapkan</span>
                <p className="font-semibold text-blue-750 dark:text-blue-400 bg-blue-50/5 dark:bg-blue-950/10 p-2.5 border rounded border-blue-200/50">
                  {proposal.expectedOutput}
                </p>
              </div>

              {proposal.expectedBenefits && (
                <div className="pt-3 border-t dark:border-gray-850">
                  <span className="text-gray-400 font-bold block uppercase text-[9px] mb-1">Manfaat Penelitian</span>
                  <p className="text-gray-700 dark:text-gray-300">{proposal.expectedBenefits}</p>
                </div>
              )}

              {proposal.rejectionReason && (
                <div className="p-3.5 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-250 rounded text-rose-750 dark:text-rose-400 mt-4">
                  <span className="font-bold block uppercase text-[9px] mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Catatan Penolakan Kepala BRIDA (Rejection Reason)</span>
                  </span>
                  <p className="italic font-semibold leading-relaxed mt-1">
                    &quot;{proposal.rejectionReason}&quot;
                  </p>
                  <div className="text-[9px] text-gray-400 font-bold mt-2">
                    Ditolak oleh: {proposal.rejectedBy} • Tanggal: {proposal.rejectedDate}
                  </div>
                </div>
              )}

              {proposal.bridaNotes && (
                <div className="pt-3 border-t dark:border-gray-850">
                  <span className="text-gray-400 font-bold block uppercase text-[9px] mb-1">Catatan Tambahan BRIDA</span>
                  <p className="text-gray-650 dark:text-gray-400">{proposal.bridaNotes}</p>
                </div>
              )}

            </CardContent>
          </Card>

          {/* ================= HASIL SELEKSI & PENETAPAN SKOR RISET (RUBRIK PENILAIAN) ================= */}
          {proposal.selection && (
            <Card className="border-purple-200 dark:border-purple-900/60 bg-gradient-to-b from-purple-50/20 to-transparent shadow-sm">
              <CardHeader className="pb-3 border-b border-purple-100 dark:border-purple-900/40">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-purple-600" />
                    <span>Hasil Seleksi & Penetapan Skor Riset</span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-3xs font-mono text-gray-500 bg-white dark:bg-gray-900 px-2 py-0.5 border rounded">
                      {proposal.selection.code}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold border ${
                      proposal.selection.result === 'SELECTED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : proposal.selection.result === 'NOT_SELECTED'
                        ? 'bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/40 dark:text-rose-400'
                        : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400'
                    }`}>
                      {proposal.selection.result === 'SELECTED' ? '✓ LOLOS SELEKSI' : proposal.selection.result === 'NOT_SELECTED' ? '✕ TIDAK LOLOS' : proposal.selection.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                {/* Score Summary Box */}
                <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-purple-100 dark:border-purple-900/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Nilai Total Akhir</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-purple-700 dark:text-purple-400">
                        {proposal.selection.totalScore ?? proposal.totalScore ?? '-'}
                      </span>
                      <span className="text-xs text-gray-400 font-semibold">/ 100 Poin</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs">
                    <div className="bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded border border-gray-200/60 dark:border-gray-750">
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Evaluator / Penilai</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        {proposal.selection.finalizedBy?.name || proposal.selection.createdBy?.name || 'Tim Litbang BRIDA'}
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded border border-gray-200/60 dark:border-gray-750">
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Waktu Penetapan</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {proposal.selection.finalizedAt ? new Date(proposal.selection.finalizedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : proposal.updatedDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Criteria Breakdown Rubric Table */}
                {proposal.selection.scores && proposal.selection.scores.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">
                      Rincian Rubrik Penilaian Kriteria Seleksi
                    </span>
                    <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-850/80 text-gray-600 dark:text-gray-300 text-3xs uppercase tracking-wider font-semibold border-b dark:border-gray-800">
                            <th className="py-2 px-3 w-10 text-center">No</th>
                            <th className="py-2 px-3 w-20">Kode</th>
                            <th className="py-2 px-3">Kriteria Penilaian</th>
                            <th className="py-2 px-3 w-20 text-center">Bobot</th>
                            <th className="py-2 px-3 w-24 text-center">Skor (0-100)</th>
                            <th className="py-2 px-3 w-28 text-right">Nilai Tertimbang</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150 dark:divide-gray-800 bg-white dark:bg-gray-900">
                          {proposal.selection.scores.map((sc, idx) => (
                            <tr key={sc.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/30">
                              <td className="py-2.5 px-3 text-center text-gray-400 font-bold">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-gray-600 dark:text-gray-300">{sc.code}</td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-gray-900 dark:text-white">{sc.name}</div>
                                {sc.description && (
                                  <div className="text-[10px] text-gray-400 mt-0.5">{sc.description}</div>
                                )}
                                {sc.note && (
                                  <div className="text-[10px] text-purple-700 dark:text-purple-400 italic mt-0.5">Catatan: {sc.note}</div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center font-semibold text-gray-700 dark:text-gray-300">{sc.weight}%</td>
                              <td className="py-2.5 px-3 text-center font-bold text-purple-700 dark:text-purple-400">{sc.score}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-extrabold text-gray-900 dark:text-white">{sc.weightedScore ?? ((sc.score * sc.weight) / 100).toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-purple-50/50 dark:bg-purple-950/20 font-bold text-gray-900 dark:text-white border-t border-purple-200 dark:border-purple-800">
                            <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-3xs tracking-wider">Total Skor Kelayakan:</td>
                            <td className="py-2.5 px-3 text-center text-purple-700 dark:text-purple-400">100%</td>
                            <td className="py-2.5 px-3"></td>
                            <td className="py-2.5 px-3 text-right font-mono text-sm text-purple-700 dark:text-purple-400">
                              {proposal.selection.totalScore ?? '-'}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Catatan / Justifikasi Penetapan */}
                {proposal.selection.selectionNote && (
                  <div className="p-3 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 rounded text-xs">
                    <span className="text-[10px] text-purple-700 dark:text-purple-400 font-bold uppercase block mb-1">
                      Catatan / Justifikasi Penetapan Seleksi
                    </span>
                    <p className="italic text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                      &quot;{proposal.selection.selectionNote}&quot;
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>

        {/* ================= RIGHT SECTION (Source ID, Selection notes, history logs) ================= */}
        <div className="space-y-6">
          
          {/* A. Sumber Identifikasi reference card */}
          {sourceIdent && (
            <Card>
              <CardHeader className="pb-2 border-b dark:border-gray-850">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Link className="h-4 w-4 text-gray-400" />
                  <span>Sumber Identifikasi</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-3 text-xs leading-normal">
                <div>
                  <span className="text-gray-450 block font-semibold text-[10px]">Identification ID</span>
                  <span className="font-bold text-gray-850 dark:text-gray-200">{sourceIdent.id}</span>
                </div>
                <div>
                  <span className="text-gray-455 block font-semibold text-[10px]">Identified Topic</span>
                  <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{sourceIdent.topic}</p>
                </div>
                
                <div className="pt-2 border-t dark:border-gray-850">
                  <button
                    onClick={() => router.push(`/identification/${sourceIdent.id}`)}
                    className="w-full text-center py-1.5 border border-blue-200 hover:border-blue-500 rounded bg-blue-50/5 hover:bg-blue-50/20 text-blue-600 text-3xs font-bold transition-all uppercase"
                  >
                    View Identification
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selection Rating Score metric representation (if selection completed) */}
          {(proposal.selection || (selectionScoreInfo && proposal.selectionNotes)) && (
            <Card>
              <CardHeader className="pb-2 border-b dark:border-gray-850">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4 text-purple-600" />
                  <span>Ringkasan Skor Seleksi</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                
                {/* Score percentage progress */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline font-bold">
                    <span className="text-gray-400 text-[10px] uppercase">Skor Kelayakan</span>
                    <span className="text-purple-700 dark:text-purple-400 text-sm">
                      {proposal.selection?.totalScore ?? selectionScoreInfo?.total ?? '-'} / 100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, proposal.selection?.totalScore ?? selectionScoreInfo?.percentage ?? 0)}%` }}
                    />
                  </div>
                </div>

                {/* Selection details */}
                <div className="pt-2 border-t dark:border-gray-850 space-y-2">
                  <div>
                    <span className="text-gray-450 block font-bold text-[9px] uppercase">Keputusan Seleksi</span>
                    <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border mt-0.5 ${
                      (proposal.selection?.result || proposal.selectionNotes?.recommendation) === 'SELECTED' || (proposal.selection?.result || proposal.selectionNotes?.recommendation) === 'SELECT'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950 dark:text-rose-400'
                    }`}>
                      {proposal.selection?.result || proposal.selectionNotes?.recommendation}
                    </span>
                  </div>

                  {(proposal.selection?.selectionNote || proposal.selectionNotes?.summary) && (
                    <div>
                      <span className="text-gray-450 block font-bold text-[9px] uppercase">Catatan Seleksi</span>
                      <p className="italic text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed mt-0.5">
                        &quot;{proposal.selection?.selectionNote || proposal.selectionNotes?.summary}&quot;
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selection History Timeline representation */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <History className="h-4 w-4" />
                <span>Selection History</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {!proposal.selectionHistory || proposal.selectionHistory.length === 0 ? (
                <p className="text-[11px] text-gray-400 italic">Belum ada riwayat seleksi kelayakan.</p>
              ) : (
                <div className="space-y-3 py-1 text-xs">
                  {(proposal.selectionHistory || []).map((hist, idx) => (
                    <div key={idx} className="p-2.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded space-y-1">
                      <div className="flex justify-between items-center font-bold text-gray-850 dark:text-gray-200">
                        <span>{hist.date}</span>
                        <span className="text-purple-650 font-bold">{hist.score}</span>
                      </div>
                      <div className="text-[10px] text-gray-400">
                        Penilai: {hist.user} • Rekomendasi: <strong>{hist.recommendation}</strong>
                      </div>
                      <p className="italic text-gray-550 text-[10px] leading-relaxed">&quot;{hist.summary}&quot;</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity timeline representation */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Activity className="h-4 w-4" />
                <span>Activity History</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="relative border-l border-gray-200 dark:border-gray-800 pl-3.5 space-y-4 py-2">
                {proposal.activities.map((act) => (
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
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ================= MODAL: SUBMIT TO SELECTION ================= */}
      <Dialog
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        title="Ajukan Usulan Penelitian"
        description="Ajukan usulan ini untuk proses seleksi?"
        footer={
          <>
            <button
              onClick={handleConfirmSubmit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-all"
            >
              Confirm Submit
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
          Usulan akan masuk ke tahap seleksi BRIDA dan tidak lagi berstatus Draft. Setelah diajukan, usulan tidak dapat dimodifikasi secara langsung kecuali dikembalikan untuk revisi oleh tim penilai.
        </p>
      </Dialog>

      {/* ================= MODAL: START SELECTION PROCESS ================= */}
      <Dialog
        isOpen={isStartSelectionOpen}
        onClose={() => setIsStartSelectionOpen(false)}
        title="Mulai Proses Seleksi"
        description="Memulai penilaian kelayakan usulan penelitian?"
        footer={
          <>
            <button
              onClick={handleConfirmStartSelection}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold transition-all"
            >
              Mulai Penilaian
            </button>
            <button
              onClick={() => setIsStartSelectionOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <p className="text-xs text-gray-500 leading-relaxed">
          Status usulan ini akan diubah menjadi **Under Selection**. Anda akan diarahkan ke halaman penilaian kriteria teknis untuk memberikan skor kelayakan kelayakan secara menyeluruh.
        </p>
      </Dialog>

      {/* ================= MODAL: APPROVE RESEARCH Penetapan ================= */}
      <Dialog
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        title="Setujui Usulan Penelitian"
        description="Setujui usulan ini sebagai penelitian?"
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
          Usulan akan ditetapkan sebagai penelitian dan dapat dilanjutkan ke tahap penyusunan KAK dan RAB pada fase berikutnya. Sistem akan otomatis meluncurkan satu berkas Penelitian baru dengan status **PLANNED**.
        </p>
      </Dialog>

      {/* ================= MODAL: REJECT PROPOSAL (Kepala BRIDA) ================= */}
      <Dialog
        isOpen={isRejectOpen}
        onClose={() => {
          setIsRejectOpen(false);
          setRejectReason('');
        }}
        title="Reject Proposal Usulan"
        description="Berikan alasan penolakan penetapan usulan."
        footer={
          <>
            <button
              onClick={handleConfirmReject}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold transition-all"
            >
              Reject
            </button>
            <button
              onClick={() => {
                setIsRejectOpen(false);
                setRejectReason('');
              }}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Alasan Penolakan (Wajib Diisi) *
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Contoh: Dokumen prioritas data sektoral pendukung belum mencukupi aspek kelayakan pelaksanaan anggaran tahun ini..."
              rows={3}
              className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 focus:outline-none resize-none text-gray-900 dark:text-white"
              required
            />
          </div>
          <p className="text-[10px] text-gray-400">
            Penolakan ini bersifat final untuk siklus berjalan. Usulan status akan diubah menjadi **Rejected** permanen.
          </p>
        </div>
      </Dialog>

    </div>
  );
}
