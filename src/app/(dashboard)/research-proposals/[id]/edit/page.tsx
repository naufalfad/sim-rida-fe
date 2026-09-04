'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function EditProposalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { proposals, updateProposal } = useResearchStore();

  const id = params?.id;
  const isBrida = user?.role === 'BRIDA';

  // Access control check
  useEffect(() => {
    if (user && user.role !== 'BRIDA') {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  // Find target proposal
  const proposal = useMemo(() => {
    return proposals.find((p) => p.id === id);
  }, [proposals, id]);

  // Redirect if status is not DRAFT
  useEffect(() => {
    if (proposal && proposal.status !== 'DRAFT') {
      toast('Hanya usulan berstatus DRAFT yang dapat diedit.', 'warning');
      router.replace(`/research-proposals/${proposal.id}`);
    }
  }, [proposal, router, toast]);

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

  const [validationError, setValidationError] = useState('');

  // Pre-fill form values
  useEffect(() => {
    if (proposal) {
      setTitle(proposal.title);
      setSector(proposal.sector);
      setPriority(proposal.priority);
      setDuration(proposal.duration);
      setBackground(proposal.background);
      setProblemStatement(proposal.problemStatement);
      setObjective(proposal.objective);
      setResearchQuestions(proposal.researchQuestions || '');
      setScope(proposal.scope);
      setExpectedOutput(proposal.expectedOutput);
      setExpectedBenefits(proposal.expectedBenefits || '');
      setBridaNotes(proposal.bridaNotes || '');
    }
  }, [proposal]);

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

  const handleSaveChanges = () => {
    if (!proposal) return;

    const errorMsg = getValidationErrorMsg();
    if (errorMsg) {
      setValidationError(errorMsg);
      toast(errorMsg, 'warning');
      return;
    }

    setValidationError('');

    updateProposal(
      proposal.id,
      {
        title,
        sector,
        priority,
        duration,
        background,
        problemStatement,
        objective,
        researchQuestions,
        scope,
        expectedOutput,
        expectedBenefits,
        bridaNotes,
      },
      user?.name || 'BRIDA Litbang'
    );

    toast('Perubahan draf usulan berhasil disimpan.', 'success');
    router.push(`/research-proposals/${proposal.id}`);
  };

  if (!proposal) {
    return (
      <div className="space-y-6 text-center py-12 font-sans">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Usulan Tidak Ditemukan</h2>
        <button
          onClick={() => router.push('/research-proposals')}
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
          onClick={() => router.push(`/research-proposals/${proposal.id}`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Detail</span>
        </button>
      </div>

      <PageHeader
        title={`Edit Usulan Penelitian #${proposal.id}`}
        description="Lakukan penyesuaian konten draf usulan penelitian atau kajian strategis daerah."
      />

      {/* Form Card */}
      <Card>
        <CardContent className="p-6 space-y-6">
          
          <div className="space-y-4 text-xs">
            
            {/* Judul */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Judul Penelitian / Kajian *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Sector, Priority, Duration */}
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
                rows={4}
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
                rows={4}
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
                rows={3}
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
                rows={3}
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
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

          </div>

          {/* Validation warning */}
          {validationError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded text-red-750 dark:text-red-400 text-2xs flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0 text-red-650" />
              <span><strong>Validation Error:</strong> {validationError}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-150 dark:border-gray-850">
            <span className="text-[10px] text-gray-400 font-medium">
              * Menandakan field wajib (mandatory) untuk seleksi.
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/research-proposals/${proposal.id}`)}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold bg-white dark:bg-gray-950"
              >
                Batal
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow"
              >
                <Save className="h-4 w-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}
