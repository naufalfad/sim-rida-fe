'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useIdentificationStore } from '@/store/useIdentificationStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import {
  ArrowLeft,
  Sparkles,
  Save,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Info
} from 'lucide-react';

function NewProposalForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { identifications } = useIdentificationStore();
  const { addProposal } = useResearchStore();

  const identificationId = searchParams.get('identificationId');

  // Verify role
  useEffect(() => {
    if (user && user.role !== 'BRIDA') {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  // Find source identification
  const sourceIdent = useMemo(() => {
    if (!identificationId) return null;
    return identifications.find((i) => i.id === identificationId && i.status === 'VALIDATED');
  }, [identifications, identificationId]);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [sector, setSector] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [duration, setDuration] = useState('6 Bulan');
  const [background, setBackground] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [objective, setObjective] = useState('');
  const [researchQuestions, setResearchQuestions] = useState('');
  const [scope, setScope] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [expectedBenefits, setExpectedBenefits] = useState('');
  const [bridaNotes, setBridaNotes] = useState('');

  // Confirmation Modals State
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Pre-fill form when sourceIdent is loaded
  useEffect(() => {
    if (sourceIdent) {
      setTitle(`Kajian Kebutuhan ${sourceIdent.topic} Kabupaten`);
      setSector(sourceIdent.sector);
      setPriority(sourceIdent.priority);
      setBackground(sourceIdent.problemDescription);
      setProblemStatement(sourceIdent.primaryIssue);
      setObjective(`Merumuskan rekomendasi kebijakan dan model implementasi mengenai ${sourceIdent.potentialNeed}.`);
      setExpectedOutput(`Naskah Kebijakan (Policy Brief) dan Peta Jalan ${sourceIdent.potentialNeed}.`);
      setBridaNotes(sourceIdent.bridaNotes || '');
    }
  }, [sourceIdent]);

  // Helper to validate mandatory fields
  const getValidationErrorMsg = () => {
    if (!title.trim()) return 'Judul Penelitian wajib diisi.';
    if (!background.trim()) return 'Latar Belakang wajib diisi.';
    if (!problemStatement.trim()) return 'Rumusan Masalah wajib diisi.';
    if (!objective.trim()) return 'Tujuan Penelitian wajib diisi.';
    if (!scope.trim()) return 'Ruang Lingkup wajib diisi.';
    if (!expectedOutput.trim()) return 'Output yang Diharapkan wajib diisi.';
    if (!sector.trim()) return 'Sektor/Bidang wajib diisi.';
    return '';
  };

  // Action: Save Draft
  const handleSaveDraft = async () => {
    if (!sourceIdent) return;
    
    // Save draft doesn't strictly check all mandatory fields but requires a title
    if (!title.trim()) {
      toast('Judul usulan wajib diisi untuk menyimpan draf.', 'warning');
      return;
    }

    try {
      await addProposal(
        sourceIdent.id,
        sourceIdent.opd,
        title,
        background,
        problemStatement,
        objective,
        researchQuestions,
        scope,
        expectedOutput,
        expectedBenefits,
        sector,
        priority,
        duration,
        bridaNotes,
        user?.name || 'BRIDA Litbang',
        sourceIdent.opdId
      );

      toast('Draf usulan penelitian berhasil disimpan.', 'success');
      router.push('/research-proposals');
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || 'Gagal menyimpan draf usulan.', 'error');
    }
  };

  // Action: Submit for Selection
  const handleSubmitClick = () => {
    const errorMsg = getValidationErrorMsg();
    if (errorMsg) {
      setValidationError(errorMsg);
      toast(errorMsg, 'warning');
      return;
    }
    setValidationError('');
    setIsSubmitOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!sourceIdent) return;

    try {
      // Create proposal first
      const propId = await addProposal(
        sourceIdent.id,
        sourceIdent.opd,
        title,
        background,
        problemStatement,
        objective,
        researchQuestions,
        scope,
        expectedOutput,
        expectedBenefits,
        sector,
        priority,
        duration,
        bridaNotes,
        user?.name || 'BRIDA Litbang',
        sourceIdent.opdId
      );

      // Update status to SUBMITTED
      const { submitForSelection } = useResearchStore.getState();
      await submitForSelection(propId, user?.name || 'BRIDA Litbang');

      setIsSubmitOpen(false);
      toast('Usulan berhasil diajukan untuk proses seleksi kelayakan.', 'success');
      router.push('/research-proposals');
    } catch (err: any) {
      setIsSubmitOpen(false);
      toast(err?.response?.data?.message || err?.message || 'Gagal mengajukan usulan penelitian.', 'error');
    }
  };

  if (!sourceIdent) {
    return (
      <div className="space-y-6 text-center py-12">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-sm font-bold text-gray-800 dark:text-white">Sumber Identifikasi Tidak Valid</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Usulan penelitian harus diawali dari Identifikasi Kebutuhan yang sudah divalidasi (VALIDATED) oleh BRIDA.
        </p>
        <button
          onClick={() => router.push('/research-proposals')}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold"
        >
          Kembali ke Usulan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back link */}
      <div>
        <button
          onClick={() => router.push('/research-proposals')}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </button>
      </div>

      <PageHeader
        title="Buat Usulan Penelitian"
        description="Susun usulan penelitian atau kajian berdasarkan permasalahan yang telah divalidasi oleh BRIDA."
      />

      {/* ================= SECTION A: SUMBER IDENTIFIKASI (Read-Only) ================= */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b pb-2">
            A. Sumber Identifikasi Masalah
          </h3>
          
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 text-2xs">
            <div>
              <span className="text-gray-400 block font-medium">Identification ID</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{sourceIdent.id}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Organisasi Perangkat Daerah</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{sourceIdent.opd}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Validation Status</span>
              <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-250 mt-0.5">
                {sourceIdent.status}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">AI Confidence Score</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{sourceIdent.confidence}%</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-2xs pt-2 border-t border-gray-150 dark:border-gray-850">
            <div>
              <span className="text-gray-400 block font-medium">Identified Problem</span>
              <p className="font-semibold text-gray-850 dark:text-gray-250 mt-0.5 leading-relaxed bg-gray-50/50 dark:bg-gray-900/50 p-2 border rounded">
                {sourceIdent.primaryIssue}
              </p>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Identified Need</span>
              <p className="font-semibold text-blue-800 dark:text-blue-450 mt-0.5 leading-relaxed bg-blue-50/10 p-2 border rounded border-blue-200">
                {sourceIdent.potentialNeed}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================= SECTION B: FORM USULAN PENELITIAN ================= */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              B. Formulir Usulan Penelitian / Kajian
            </h3>
            <span className="text-[10px] text-gray-400 font-semibold italic flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-blue-500" />
              <span>Autofilled from Identification</span>
            </span>
          </div>

          {/* Form Fields Grid */}
          <div className="space-y-4 text-xs">
            
            {/* Judul Penelitian */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                  Judul Penelitian / Kajian *
                </label>
                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.2 rounded border border-blue-250">
                  Based on validated identification
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan judul riset komprehensif..."
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Sector, Priority, Duration Row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                  Sektor / Bidang Pembangunan *
                </label>
                <input
                  type="text"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                  Skala Prioritas Urgensi *
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
                >
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                  Perkiraan Durasi Kajian *
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Contoh: 6 Bulan"
                  className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Latar Belakang */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Latar Belakang Kajian *
              </label>
              <textarea
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                rows={3}
                placeholder="Deskripsikan latar belakang masalah..."
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

            {/* Rumusan Masalah */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Rumusan Masalah Utama *
              </label>
              <textarea
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                rows={3}
                placeholder="Rincikan poin-poin permasalahan teknis..."
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

            {/* Tujuan Penelitian */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Tujuan Penelitian / Kajian *
              </label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                rows={2}
                placeholder="Tuliskan tujuan strategis riset..."
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

            {/* Pertanyaan Penelitian */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Pertanyaan Penelitian (Optional)
              </label>
              <textarea
                value={researchQuestions}
                onChange={(e) => setResearchQuestions(e.target.value)}
                rows={2}
                placeholder="Contoh: 1. Bagaimana disparitas akses logistik antar pulau?..."
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

            {/* Ruang Lingkup */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Ruang Lingkup Kajian *
              </label>
              <textarea
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                rows={2}
                placeholder="Tuliskan batas demografis/geografis serta objek riset..."
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

            {/* Output yang Diharapkan */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Output yang Diharapkan *
              </label>
              <textarea
                value={expectedOutput}
                onChange={(e) => setExpectedOutput(e.target.value)}
                rows={2}
                placeholder="Contoh: Naskah Akademis Kebijakan APBD 2027..."
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

            {/* Manfaat Penelitian */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Manfaat Penelitian (Optional)
              </label>
              <textarea
                value={expectedBenefits}
                onChange={(e) => setExpectedBenefits(e.target.value)}
                rows={2}
                placeholder="Manfaat sosial, ekonomi, maupun tata kelola..."
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

            {/* Catatan BRIDA */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Catatan Penyelarasan BRIDA (Optional)
              </label>
              <textarea
                value={bridaNotes}
                onChange={(e) => setBridaNotes(e.target.value)}
                rows={2}
                placeholder="Catatan pemicu penyusunan usulan..."
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

          </div>

          {/* Validation warning feedback */}
          {validationError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded text-red-750 dark:text-red-400 text-2xs flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0 text-red-650" />
              <span><strong>Validation Error:</strong> {validationError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-150 dark:border-gray-850">
            <span className="text-[10px] text-gray-400 font-medium">
              * Menandakan field wajib (mandatory) untuk seleksi.
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-all bg-white dark:bg-gray-950"
              >
                <Save className="h-4 w-4 text-gray-400" />
                <span>Save Draft</span>
              </button>
              <button
                onClick={handleSubmitClick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Submit for Selection</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================= MODAL: SUBMIT CONFIRMATION ================= */}
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

    </div>
  );
}

export default function NewResearchProposalPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading form parameters...</div>}>
      <NewProposalForm />
    </Suspense>
  );
}
