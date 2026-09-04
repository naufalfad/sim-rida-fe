'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useIdentificationStore } from '@/store/useIdentificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useKnowledgeBaseStore } from '@/store/useKnowledgeBaseStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { analyzeOPD } from '@/lib/services/aiService';
import { DUMMY_OPDS } from '@/mock/knowledge-base/opd';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  FileText,
  Clock,
  Edit,
  Save,
  Check,
  RotateCcw,
  BookOpen,
  Info,
  Plus
} from 'lucide-react';

export default function IdentificationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { documents } = useKnowledgeBaseStore();
  const {
    identifications,
    activities,
    updateIdentificationResult,
    validateIdentification,
    rejectIdentification,
    reAnalyzeOPD
  } = useIdentificationStore();

  const isBrida = user?.role === 'BRIDA';
  const id = params?.id;

  // Find target identification
  const ident = useMemo(() => {
    return identifications.find((item) => item.id === id);
  }, [identifications, id]);

  // Find audit logs for this specific identification
  const identActivities = useMemo(() => {
    return activities.filter((act) => act.identificationId === id);
  }, [activities, id]);

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTopic, setEditTopic] = useState('');
  const [editProblem, setEditProblem] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editNeed, setEditNeed] = useState('');
  const [editSector, setEditSector] = useState('');
  const [editPriority, setEditPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [editNotes, setEditNotes] = useState('');

  // Modals state
  const [isValidateOpen, setIsValidateOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReasonText, setRejectReasonText] = useState('');
  const [isReAnalyzeOpen, setIsReAnalyzeOpen] = useState(false);
  
  // Re-analysis simulated loading screen state
  const [isReAnalyzing, setIsReAnalyzing] = useState(false);
  const [reAnalyzeStepIdx, setReAnalyzeStepIdx] = useState(0);

  // Original reference templates to check dirty fields [AI Generated] vs [BRIDA Reviewed]
  // We can represent the original AI values by using a snapshot. Since we don't store it explicitly,
  // we can mock-match Dinas Kesehatan templates or check if the fields were customized.
  // A cleaner approach: If BRIDA validatedProblem, validatedNeed, or notes have been filled,
  // or if the problem field is dirty relative to what's in identifications initially, we toggle the label.
  // Let's store the unmodified values when entering Edit Mode!
  const [originalValues, setOriginalValues] = useState<any>(null);

  // Start Edit Mode
  const handleStartEdit = () => {
    if (!ident) return;
    setEditTopic(ident.topic);
    setEditProblem(ident.primaryIssue);
    setEditDescription(ident.problemDescription);
    setEditNeed(ident.potentialNeed);
    setEditSector(ident.sector);
    setEditPriority(ident.priority);
    setEditNotes(ident.bridaNotes || '');

    setOriginalValues({
      topic: ident.topic,
      problem: ident.primaryIssue,
      description: ident.problemDescription,
      need: ident.potentialNeed,
      sector: ident.sector,
      priority: ident.priority,
    });

    setIsEditMode(true);
  };

  // Save Edit Draft
  const handleSaveDraft = () => {
    if (!ident) return;

    updateIdentificationResult(
      ident.id,
      {
        topic: editTopic,
        primaryIssue: editProblem,
        problemDescription: editDescription,
        potentialNeed: editNeed,
        sector: editSector,
        priority: editPriority,
        bridaNotes: editNotes,
      },
      user?.name || 'BRIDA Litbang'
    );

    setIsEditMode(false);
    toast('Draf revisi hasil identifikasi berhasil disimpan.', 'success');
  };

  // Confirm validation
  const handleValidateConfirm = async () => {
    if (!ident) return;
    try {
      await validateIdentification(ident.id, user?.name || 'BRIDA Litbang', editNotes);
      setIsValidateOpen(false);
      setIsEditMode(false);
      toast('Hasil identifikasi kebutuhan berhasil divalidasi (Status: Validated).', 'success');
    } catch (err: any) {
      toast('Gagal memvalidasi identifikasi: ' + (err.message || 'Terjadi kesalahan.'), 'error');
    }
  };

  // Confirm rejection
  const handleRejectConfirm = async () => {
    if (!ident) return;
    if (!rejectReasonText.trim()) {
      toast('Alasan penolakan wajib diisi.', 'warning');
      return;
    }
    try {
      await rejectIdentification(ident.id, user?.name || 'BRIDA Litbang', rejectReasonText);
      setIsRejectOpen(false);
      setIsEditMode(false);
      setRejectReasonText('');
      toast('Validasi ditolak. Status identifikasi berubah menjadi Rejected.', 'success');
    } catch (err: any) {
      toast('Gagal menolak identifikasi: ' + (err.message || 'Terjadi kesalahan.'), 'error');
    }
  };

  // Simulated Re-analysis steps
  const reAnalyzeSteps = [
    'Scanning active knowledge base...',
    'Rerunning contextual similarity index...',
    'Updating development indicator matrices...',
    'Re-evaluating target needs...'
  ];

  // Re-analyze trigger
  const handleReAnalyze = async () => {
    if (!ident) return;
    setIsReAnalyzeOpen(false);
    setIsReAnalyzing(true);
    setReAnalyzeStepIdx(0);

    // Simulate progress ticks
    const tick = setInterval(() => {
      setReAnalyzeStepIdx((prev) => {
        if (prev >= reAnalyzeSteps.length - 1) {
          clearInterval(tick);
          return prev;
        }
        return prev + 1;
      });
    }, 600);

    try {
      const sourceIds = ident.evidenceSources.map(s => s.documentId);
      const aiResponse = await analyzeOPD(ident.opd, sourceIds);
      
      // Update store: saves history run, updates fields to latest AI output, and resets validation markers
      reAnalyzeOPD(
        ident.id,
        aiResponse.confidence,
        aiResponse.primaryIssue,
        aiResponse.problemDescription,
        aiResponse.potentialNeed,
        user?.name || 'BRIDA Litbang'
      );

      setTimeout(() => {
        clearInterval(tick);
        setIsReAnalyzing(false);
        toast('Analisis ulang AI berhasil diselesaikan.', 'success');
      }, 500);

    } catch (err) {
      clearInterval(tick);
      setIsReAnalyzing(false);
      toast('Terjadi kegagalan saat analisis ulang.', 'error');
    }
  };

  if (!ident) {
    return (
      <div className="space-y-6 text-center py-12">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Identifikasi Tidak Ditemukan</h2>
        <p className="text-xs text-gray-500">ID data identifikasi tidak valid.</p>
        <button
          onClick={() => router.push('/identification')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  // Render status badge helper
  const renderStatusBadge = (status: 'DRAFT' | 'ANALYZING' | 'IN_REVIEW' | 'VALIDATED' | 'REJECTED') => {
    let bg = '';
    let text = '';
    let label = '';
    switch (status) {
      case 'DRAFT':
        bg = 'bg-gray-150 dark:bg-gray-850';
        text = 'text-gray-700 dark:text-gray-300';
        label = 'Draft';
        break;
      case 'IN_REVIEW':
        bg = 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50';
        text = 'text-amber-700 dark:text-amber-400';
        label = 'In Review';
        break;
      case 'VALIDATED':
        bg = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50';
        text = 'text-emerald-700 dark:text-emerald-400';
        label = 'Validated';
        break;
      case 'REJECTED':
        bg = 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50';
        text = 'text-rose-700 dark:text-rose-455';
        label = 'Rejected';
        break;
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-3xs font-bold border ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  // Helper to draw [AI Generated] vs [BRIDA Reviewed]
  const renderFieldOriginBadge = (fieldName: string, currentVal: string) => {
    // If not in edit mode and the field was modified from original mock data
    // Or if currently edited and doesn't match originalValues at startup of edit
    const isDirty = originalValues 
      ? currentVal !== originalValues[fieldName]
      : false; // simple fallback

    if (isDirty || ident.updatedBy !== 'AI System') {
      return (
        <span className="ml-2 inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
          BRIDA Reviewed
        </span>
      );
    }
    return (
      <span className="ml-2 inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-800">
        AI Generated
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push('/identification')}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar</span>
        </button>
      </div>

      {/* Page Header */}
      <PageHeader
        title={`Identifikasi Kebutuhan #${ident.id}`}
        description="Hasil rekomendasi identifikasi prioritas permasalahan dan sinkronisasi data program kerja OPD."
        action={
          isBrida && !isEditMode && (
            <div className="flex gap-2">
              {ident.status === 'VALIDATED' ? (
                <button
                  onClick={() => router.push(`/research-proposals/new?identificationId=${ident.id}`)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Buat Usulan Penelitian</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsReAnalyzeOpen(true)}
                    className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-all bg-white dark:bg-gray-950"
                  >
                    <RotateCcw className="h-4 w-4 text-gray-400" />
                    <span>Run New Analysis</span>
                  </button>
                  <button
                    onClick={handleStartEdit}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Review / Edit</span>
                  </button>
                </>
              )}
            </div>
          )
        }
      />

      {/* AI Disclaimer Panel */}
      <div className="flex gap-3 p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/35 rounded text-xs text-blue-800 dark:text-blue-300">
        <Info className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <p className="leading-relaxed">
          <strong>AI Disclaimer:</strong> Analisis AI merupakan alat bantu dan bukan keputusan resmi BRIDA. Validasi oleh BRIDA diperlukan sebelum hasil digunakan dalam proses selanjutnya.
        </p>
      </div>

      {/* Main Details and Sidebars */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* ================= LEFT SECTION (Detail & Edit) ================= */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Status and confidence header */}
          <Card>
            <CardContent className="p-4 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xs text-gray-400 font-bold uppercase block">Status</span>
                {renderStatusBadge(ident.status)}
              </div>
              
              <div className="flex items-center gap-3 border-l md:border-l border-gray-200 dark:border-gray-800 pl-4">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold block uppercase leading-none mb-1">
                    AI Confidence Score
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-blue-600 dark:text-blue-400">
                      {ident.confidence}%
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium max-w-[200px] leading-tight">
                      Bukan tingkat kebenaran absolut.
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Core Findings Panel */}
          <Card>
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex justify-between items-center">
                <span>Temuan Analisis Sektoral</span>
                {!isEditMode && renderFieldOriginBadge('problem', ident.primaryIssue)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              
              {isEditMode ? (
                <div className="space-y-4">
                  {/* Topic / Permasalahan */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Topik Analisis *</label>
                    <input
                      type="text"
                      value={editTopic}
                      onChange={(e) => setEditTopic(e.target.value)}
                      className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  {/* Masalah Utama */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Masalah Utama *</label>
                    <textarea
                      value={editProblem}
                      onChange={(e) => setEditProblem(e.target.value)}
                      rows={2}
                      className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
                    />
                  </div>

                  {/* Deskripsi Masalah */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Deskripsi Masalah *</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
                    />
                  </div>

                  {/* Indikasi Kebutuhan */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Indikasi Kebutuhan Sektoral *</label>
                    <input
                      type="text"
                      value={editNeed}
                      onChange={(e) => setEditNeed(e.target.value)}
                      className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid gap-4 grid-cols-2">
                    {/* Sektor */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Sektor Pembangunan *</label>
                      <input
                        type="text"
                        value={editSector}
                        onChange={(e) => setEditSector(e.target.value)}
                        className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    {/* Prioritas */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Tingkat Prioritas *</label>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as any)}
                        className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                  </div>

                  {/* Catatan Validasi BRIDA */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                      Catatan Validasi BRIDA / Rekomendasi Tindak Lanjut
                    </label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Masukkan catatan tinjauan BRIDA di sini..."
                      rows={2}
                      className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-gray-400 font-bold block uppercase text-[10px]">Topik Masalah</span>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{ident.topic}</span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <span className="text-gray-400 font-bold block uppercase text-[10px]">Sektor Pembangunan</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{ident.sector}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block uppercase text-[10px]">Urgensi / Prioritas</span>
                      <span className={`font-bold uppercase ${
                        ident.priority === 'HIGH' ? 'text-rose-600' : ident.priority === 'MEDIUM' ? 'text-amber-600' : 'text-blue-650'
                      }`}>
                        {ident.priority}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-gray-400 font-bold block uppercase text-[10px] mb-1">Masalah Utama</span>
                    <p className="font-bold text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-900/50 p-3 border border-gray-150 dark:border-gray-800 rounded">
                      {ident.primaryIssue}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-400 font-bold block uppercase text-[10px] mb-1">Deskripsi Pemicu Masalah</span>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {ident.problemDescription}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-850">
                    <span className="text-gray-400 font-bold block uppercase text-[10px] mb-1">Indikasi Kebutuhan Solusi</span>
                    <p className="font-semibold text-blue-750 dark:text-blue-400">
                      {ident.potentialNeed}
                    </p>
                  </div>

                  {ident.rejectionReason && (
                    <div className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded text-red-750 dark:text-red-400">
                      <span className="font-bold block uppercase text-[9px] mb-1">Alasan Penolakan Validasi</span>
                      <p className="italic leading-relaxed">&quot;{ident.rejectionReason}&quot;</p>
                    </div>
                  )}

                  {ident.bridaNotes && (
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded text-emerald-750 dark:text-emerald-400">
                      <span className="font-bold block uppercase text-[9px] mb-1">Catatan Validasi BRIDA</span>
                      <p className="leading-relaxed">{ident.bridaNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evidence and Tracing section */}
          <Card>
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Evidence Sources (Ketertelusuran Sumber Data)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-2xs text-gray-450 leading-relaxed max-w-xl">
                Dokumen acuan pengetahunan BRIDA yang diindikasikan AI memuat kutipan/target penunjang permasalahan ini:
              </p>
              
              <ul className="space-y-3">
                {ident.evidenceSources.map((source, idx) => (
                  <li
                    key={source.documentId}
                    onClick={() => router.push(`/knowledge-base/${source.documentId}`)}
                    className="p-3 border border-gray-200 hover:border-blue-450 dark:border-gray-800 dark:hover:border-blue-800/80 rounded bg-gray-50/50 dark:bg-gray-900/40 flex items-center justify-between cursor-pointer transition-all animate-fade-in group select-none"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-450 group-hover:text-blue-600 transition-colors shrink-0" />
                      <div className="text-xs space-y-0.5">
                        <span className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors block">
                          {source.documentName}
                        </span>
                        <span className="text-[10px] text-gray-400 block font-medium">
                          Versi Snapshot: v{source.version}
                        </span>
                      </div>
                    </div>
                    
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Verified Evidence</span>
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          {/* Save/Action area inside edit mode */}
          {isEditMode && (
            <Card>
              <CardContent className="p-4 flex flex-wrap justify-between items-center gap-3">
                <span className="text-2xs text-gray-400 font-semibold italic">
                  Meninjau draf perubahan hasil identifikasi AI...
                </span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsRejectOpen(true)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => setIsValidateOpen(true)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Check className="h-4 w-4" />
                    <span>Validate</span>
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Draft</span>
                  </button>
                  <button
                    onClick={() => setIsEditMode(false)}
                    className="px-3.5 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-800 dark:text-gray-350 rounded text-xs font-semibold bg-white dark:bg-gray-950"
                  >
                    Batal
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* ================= RIGHT SECTION (AI analysis & logs) ================= */}
        <div className="space-y-6">
          
          {/* AI Analysis Panel Representation */}
          <Card>
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span>Log Penalaran AI</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div>
                <span className="text-gray-400 font-bold block uppercase text-[10px]">Problem Identification</span>
                <p className="font-semibold text-gray-800 dark:text-gray-250 mt-0.5">{ident.topic}</p>
              </div>

              <div>
                <span className="text-gray-400 font-bold block uppercase text-[10px]">Need Identification</span>
                <p className="font-semibold text-gray-800 dark:text-gray-250 mt-0.5">{ident.potentialNeed}</p>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-850">
                <span className="text-gray-400 font-bold block uppercase text-[10px] mb-1">Kesesuaian Urgensi (Reasoning)</span>
                <p className="text-gray-500 dark:text-gray-405 leading-relaxed italic bg-gray-50 dark:bg-gray-900 p-2.5 rounded text-[11px] border dark:border-gray-800">
                  &quot;{ident.reasoningSummary}&quot;
                </p>
              </div>

              <div className="pt-2 text-[10px] text-gray-400 leading-normal bg-gray-50/50 dark:bg-gray-900/40 p-2.5 rounded border border-gray-100 dark:border-gray-800 flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Confidence:</strong> Merepresentasikan keyakinan model terhadap kesesuaian target program kerja berdasarkan parameter data masukan.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Snapshot metadata */}
          <Card>
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>Knowledge Base Snapshot</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <span className="text-gray-400 font-bold block uppercase text-[10px]">Analysis Run Date</span>
                <span className="font-semibold text-gray-800 dark:text-gray-250">{ident.date}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block uppercase text-[10px]">Jumlah Dokumen Aktif</span>
                <span className="font-semibold text-gray-800 dark:text-gray-250">{ident.evidenceSources.length} Berkas</span>
              </div>
              
              <div className="pt-2 border-t border-gray-100 dark:border-gray-850 space-y-1.5">
                <span className="text-gray-400 font-bold block uppercase text-[10px] mb-1">Daftar Versi Aktif</span>
                {ident.evidenceSources.map(s => (
                  <div key={s.documentId} className="flex justify-between items-center text-[11px] py-0.5">
                    <span className="font-medium text-gray-650 dark:text-gray-400 truncate max-w-[150px]">{s.documentName}</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">v{s.version}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Previous AI Runs Analysis History */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <History className="h-4 w-4" />
                <span>Previous AI Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {ident.history.length === 0 ? (
                <p className="text-[11px] text-gray-400 italic">Belum ada riwayat analisis alternatif.</p>
              ) : (
                <div className="space-y-3 py-1">
                  {ident.history.map((hist, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-850 dark:text-gray-200 block">{hist.date}</span>
                        <span className="text-[10px] text-gray-450 block">Status: {hist.status}</span>
                      </div>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {hist.confidence}% Confidence
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit Log / Activity timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Riwayat Validasi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {identActivities.length === 0 ? (
                <p className="text-[11px] text-gray-400 italic">Belum ada catatan validasi.</p>
              ) : (
                <div className="relative border-l border-gray-200 dark:border-gray-800 pl-3.5 space-y-4 py-2">
                  {identActivities.map((act) => (
                    <div key={act.id} className="relative text-xs space-y-0.5">
                      <span className="absolute -left-[19.5px] top-1 h-2 w-2 rounded-full border border-white bg-blue-650" />
                      <div className="flex justify-between items-center text-[9px] text-gray-400 font-medium">
                        <span>{act.date}</span>
                        <span className="font-bold">{act.user}</span>
                      </div>
                      <p className="font-bold text-gray-800 dark:text-gray-200">
                        {act.action}
                      </p>
                      <p className="text-[10px] text-gray-450 italic leading-relaxed">
                        {act.details}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ================= MODAL: VALIDATE CONFIRMATION ================= */}
      <Dialog
        isOpen={isValidateOpen}
        onClose={() => setIsValidateOpen(false)}
        title="Validasi Hasil Identifikasi"
        description="Validate this identification?"
        footer={
          <>
            <button
              onClick={handleValidateConfirm}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-all"
            >
              Validate
            </button>
            <button
              onClick={() => setIsValidateOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            Setelah divalidasi, hasil identifikasi dianggap telah ditinjau secara resmi oleh BRIDA dan siap dijadikan prioritas pengajuan program kerja pembangunan daerah.
          </p>
          
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Catatan Akhir Validasi BRIDA (Opsional)
            </label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Masukkan catatan persetujuan..."
              rows={2}
              className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 focus:outline-none resize-none text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </Dialog>

      {/* ================= MODAL: REJECT CONFIRMATION ================= */}
      <Dialog
        isOpen={isRejectOpen}
        onClose={() => {
          setIsRejectOpen(false);
          setRejectReasonText('');
        }}
        title="Tolak Validasi Identifikasi"
        description="Masukan alasan penolakan hasil identifikasi AI."
        footer={
          <>
            <button
              onClick={handleRejectConfirm}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold transition-all"
            >
              Reject
            </button>
            <button
              onClick={() => {
                setIsRejectOpen(false);
                setRejectReasonText('');
              }}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-750 dark:text-gray-300">
              Alasan Penolakan (Wajib Diisi) *
            </label>
            <textarea
              value={rejectReasonText}
              onChange={(e) => setRejectReasonText(e.target.value)}
              placeholder="Contoh: Dokumen bukti data statistik stunting 2026 belum mendukung urgensi relokasi puskesmas..."
              rows={3}
              className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 focus:outline-none resize-none text-gray-900 dark:text-white"
              required
            />
          </div>
          <p className="text-[10px] text-gray-400">
            Status identifikasi ini akan berubah menjadi <strong>Rejected</strong>. BRIDA dapat merancang analisis ulang setelah menyelaraskan dokumen pendukung di Knowledge Base.
          </p>
        </div>
      </Dialog>

      {/* ================= MODAL: RE-ANALYZE CONFIRMATION ================= */}
      <Dialog
        isOpen={isReAnalyzeOpen}
        onClose={() => setIsReAnalyzeOpen(false)}
        title="Jalankan Ulang Analisis AI"
        description="Run a new AI analysis for this OPD?"
        footer={
          <>
            <button
              onClick={handleReAnalyze}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-all"
            >
              Jalankan Analisis Ulang
            </button>
            <button
              onClick={() => setIsReAnalyzeOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <p className="text-xs text-gray-500 leading-relaxed">
          Analisis baru akan memindai ulang dokumen Knowledge Base yang berstatus **Active** saat ini. Hasil identifikasi sebelumnya tidak akan dihapus, melainkan disimpan ke dalam histori riwayat analisis.
        </p>
      </Dialog>

      {/* ================= SIMULATED RE-ANALYZING SCREEN OVERLAY ================= */}
      {isReAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded bg-white p-6 shadow-xl dark:bg-slate-900 border dark:border-slate-800 text-center space-y-6">
            <div className="relative h-16 w-16 mx-auto flex items-center justify-center">
              <span className="absolute animate-ping h-12 w-12 rounded-full bg-blue-400 opacity-20" />
              <span className="absolute animate-spin h-10 w-10 rounded-full border-t-2 border-b-2 border-blue-600" />
              <Sparkles className="h-5 w-5 text-blue-600 relative z-10 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-950 dark:text-white">Re-Analyzing OPD Needs...</h3>
              <p className="text-3xs text-gray-400">Penyelarasan acuan dokumen...</p>
            </div>

            <div className="space-y-2 text-left border border-gray-150 dark:border-gray-850 p-4 rounded bg-gray-50 dark:bg-gray-900 max-w-xs mx-auto">
              {reAnalyzeSteps.map((stepText, idx) => {
                const isCompleted = reAnalyzeStepIdx > idx;
                const isActive = reAnalyzeStepIdx === idx;

                return (
                  <div key={idx} className="flex items-center gap-2 text-3xs font-bold">
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : isActive ? (
                      <span className="h-4 w-4 rounded-full border border-blue-600 flex items-center justify-center shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                      </span>
                    ) : (
                      <span className="h-4 w-4 rounded-full border border-gray-300 shrink-0" />
                    )}
                    <span className={isCompleted ? 'text-gray-400 line-through' : isActive ? 'text-blue-600' : 'text-gray-300'}>
                      {stepText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
