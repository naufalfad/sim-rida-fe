'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { researchSelectionService, SelectionCriterion } from '@/services/researchSelection.service';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Award,
  BookOpen,
  Scale,
  Sparkles
} from 'lucide-react';

interface FormCriterionScore {
  criteriaId: string;
  code: string;
  name: string;
  description: string;
  weight: number;
  score: number;
  note: string;
}

const DEFAULT_CRITERIA: FormCriterionScore[] = [
  {
    criteriaId: 'ad7e831f-32f6-4e37-af2e-7e6ff378b7f2',
    code: 'SC-01',
    name: 'Relevansi terhadap kebutuhan daerah',
    description: 'Kesesuaian usulan topik penelitian dengan arah kebijakan dan isu strategis pembangunan dalam RPJMD/RKPD.',
    weight: 30,
    score: 80,
    note: '',
  },
  {
    criteriaId: '1bf7db3b-3319-47d8-9974-b3a9bb790cd1',
    code: 'SC-02',
    name: 'Urgensi permasalahan',
    description: 'Tingkat kemendesakan pemecahan masalah dan dampak risiko jika permasalahan tidak segera diteliti.',
    weight: 25,
    score: 80,
    note: '',
  },
  {
    criteriaId: '4e26b725-3ce7-4dc5-8abf-ebfea0ebc318',
    code: 'SC-03',
    name: 'Dampak yang diharapkan',
    description: 'Signifikansi kontribusi hasil riset terhadap peningkatan kualitas pelayanan publik, efisiensi anggaran, atau inovasi daerah.',
    weight: 20,
    score: 80,
    note: '',
  },
  {
    criteriaId: 'd4f8c9c1-92d7-4e6a-9d46-58964df4027c',
    code: 'SC-04',
    name: 'Kelayakan penelitian',
    description: 'Kelayakan teknis pelaksanaan mencakup ketersediaan data sekunder/primer, estimasi waktu, dan sumber daya.',
    weight: 15,
    score: 80,
    note: '',
  },
  {
    criteriaId: '596f39ec-58cb-4f41-a89a-a44b759b4169',
    code: 'SC-05',
    name: 'Kejelasan metodologi',
    description: 'Ketepatan dan ketajaman pendekatan metodologi, instrumen pengumpulan data, dan rancangan analisis kebijakan.',
    weight: 10,
    score: 80,
    note: '',
  },
];

export default function SelectionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { proposals, saveSelectionResult, fetchProposals } = useResearchStore();

  const id = params?.id;
  const isBrida = user?.role === 'BRIDA' || user?.role === 'ADMIN_BRIDA';

  // Access control
  useEffect(() => {
    if (user && user.role !== 'BRIDA' && user.role !== 'ADMIN_BRIDA') {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  // Find target proposal
  const proposal = useMemo(() => {
    return proposals.find((p) => p.id === id);
  }, [proposals, id]);

  // Redirect if proposal status is invalid
  useEffect(() => {
    if (proposal && !['SUBMITTED', 'UNDER_SELECTION', 'APPROVED_FOR_SELECTION'].includes(proposal.status)) {
      toast('Usulan tidak sedang dalam tahapan proses seleksi.', 'warning');
      router.replace(`/research-proposals/${proposal.id}`);
    }
  }, [proposal, router, toast]);

  // Criteria Scores State
  const [criteriaScores, setCriteriaScores] = useState<FormCriterionScore[]>(DEFAULT_CRITERIA);
  const [recommendation, setRecommendation] = useState<'SELECT' | 'REJECT' | 'NEED REVISION'>('SELECT');
  const [summary, setSummary] = useState('');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [risks, setRisks] = useState('');
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load criteria from backend on mount
  useEffect(() => {
    const loadCriteria = async () => {
      try {
        const criteriaData = await researchSelectionService.getCriteria();
        if (criteriaData && criteriaData.length > 0) {
          // If proposal already has scores, prefill
          const existingScores = proposal?.selection?.scores || [];
          const mapped: FormCriterionScore[] = criteriaData.map((c) => {
            const match = existingScores.find((es) => es.criteriaId === c.id || es.code === c.code);
            return {
              criteriaId: c.id,
              code: c.code,
              name: c.name,
              description: c.description || '',
              weight: c.weight,
              score: match?.score ?? 80,
              note: match?.note ?? '',
            };
          });
          setCriteriaScores(mapped);
        }
      } catch (err) {
        console.warn('Could not load criteria from backend, using defaults:', err);
      }
    };
    loadCriteria();
  }, [proposal]);

  // Prefill existing selection notes if any
  useEffect(() => {
    if (proposal?.selection?.selectionNote) {
      setSummary(proposal.selection.selectionNote);
    }
  }, [proposal]);

  // Update specific criterion score
  const handleScoreChange = (criteriaId: string, score: number) => {
    const clamped = Math.max(0, Math.min(100, score));
    setCriteriaScores((prev) =>
      prev.map((c) => (c.criteriaId === criteriaId ? { ...c, score: clamped } : c))
    );
  };

  // Update specific criterion note
  const handleNoteChange = (criteriaId: string, note: string) => {
    setCriteriaScores((prev) =>
      prev.map((c) => (c.criteriaId === criteriaId ? { ...c, note } : c))
    );
  };

  // Live Score Calculator
  const scoreStats = useMemo(() => {
    let totalScore = 0;
    let totalWeight = 0;

    criteriaScores.forEach((c) => {
      totalWeight += c.weight;
      totalScore += (c.score * c.weight) / 100;
    });

    const roundedScore = Math.round(totalScore * 100) / 100;
    return {
      totalScore: roundedScore,
      totalWeight,
      isPassing: roundedScore >= 70,
    };
  }, [criteriaScores]);

  const handleSaveClick = () => {
    if (!summary.trim()) {
      toast('Ringkasan penetapan hasil seleksi (Selection Summary) wajib diisi.', 'warning');
      return;
    }
    setIsSaveOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!proposal) return;
    setIsSubmitting(true);

    const scoresPayload = criteriaScores.map((c) => ({
      criteriaId: c.criteriaId,
      score: Number(c.score),
      note: c.note || undefined,
    }));

    const notesPayload = {
      summary,
      strengths,
      weaknesses,
      risks,
      recommendation,
    };

    try {
      await saveSelectionResult(
        proposal.id,
        scoresPayload,
        notesPayload,
        user?.name || 'BRIDA Litbang'
      );
      await fetchProposals();
      setIsSaveOpen(false);
      toast('Penetapan skor dan hasil seleksi kelayakan usulan berhasil disimpan.', 'success');
      router.push(`/research-proposals/${proposal.id}`);
    } catch (err: any) {
      toast('Gagal menyimpan hasil seleksi: ' + (err.message || 'Terjadi kesalahan.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
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

  const quickScores = [60, 70, 75, 80, 85, 90, 95, 100];

  return (
    <div className="space-y-6 font-sans">
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push(`/research-proposals/${proposal.id}`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Detail Usulan</span>
        </button>
      </div>

      <PageHeader
        title="Penilaian & Penetapan Seleksi Usulan Riset"
        description={`Evaluasi kelayakan teknis dan penetapan skor rubrik untuk usulan: "${proposal.title}" (${proposal.code || proposal.id})`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* ================= LEFT SECTION (Official Rubric Assessment) ================= */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-purple-600" />
                  <span>Rubrik Penilaian Kriteria Seleksi (Bobot Total 100%)</span>
                </span>
                <span className="text-3xs font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 border border-purple-200 rounded">
                  Skala Nilai: 0 - 100 Poin
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-6">
              {criteriaScores.map((c, index) => {
                const weightedVal = Math.round(((c.score * c.weight) / 100) * 100) / 100;

                return (
                  <div key={c.criteriaId} className="space-y-3 pb-5 border-b last:border-b-0 dark:border-gray-850">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div className="space-y-0.5 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-3xs font-extrabold px-1.5 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800">
                            {c.code}
                          </span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {index + 1}. {c.name}
                          </span>
                          <span className="text-3xs font-semibold text-gray-400">
                            (Bobot: <strong>{c.weight}%</strong>)
                          </span>
                        </div>
                        {c.description && (
                          <p className="text-[11px] text-gray-500 leading-normal pl-8">
                            {c.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[9px] text-gray-400 uppercase font-bold block">Nilai Tertimbang</span>
                          <span className="font-mono font-extrabold text-sm text-purple-700 dark:text-purple-400">
                            {weightedVal} pts
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 p-1.5 border rounded">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={c.score}
                            onChange={(e) => handleScoreChange(c.criteriaId, Number(e.target.value))}
                            className="w-16 px-2 py-1 text-xs text-center font-bold border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
                          />
                          <span className="text-2xs text-gray-400 font-bold">/ 100</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick score pill buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 pl-8">
                      <span className="text-[10px] text-gray-400 font-semibold mr-1">Skor Cepat:</span>
                      {quickScores.map((scoreVal) => (
                        <button
                          key={scoreVal}
                          type="button"
                          onClick={() => handleScoreChange(c.criteriaId, scoreVal)}
                          className={`px-2 py-0.5 text-3xs font-bold rounded transition-all border ${
                            c.score === scoreVal
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-white dark:bg-gray-900 text-gray-650 dark:text-gray-300 border-gray-200 dark:border-gray-750 hover:border-purple-300'
                          }`}
                        >
                          {scoreVal}
                        </button>
                      ))}
                    </div>

                    {/* Evaluator Notes per criteria */}
                    <div className="pl-8">
                      <input
                        type="text"
                        value={c.note}
                        onChange={(e) => handleNoteChange(c.criteriaId, e.target.value)}
                        placeholder={`Catatan evaluator untuk ${c.name.toLowerCase()}...`}
                        className="block w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none placeholder:italic placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* ================= RIGHT SECTION (Summary & Action Decisions) ================= */}
        <div className="space-y-6">
          {/* Live score card */}
          <Card className="border-purple-200 dark:border-purple-900/60 bg-gradient-to-b from-purple-50/20 to-transparent">
            <CardHeader className="pb-2 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-purple-600" />
                <span>Akumulasi Nilai Seleksi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs font-bold">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-400 text-[10px] uppercase">Nilai Total Akhir</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-purple-700 dark:text-purple-400">
                    {scoreStats.totalScore}
                  </span>
                  <span className="text-xs text-gray-400">/ 100</span>
                </div>
              </div>

              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-gray-400 text-[10px] uppercase">Status Kelayakan</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold border ${
                    scoreStats.isPassing
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/40 dark:text-rose-400'
                  }`}
                >
                  {scoreStats.isPassing ? '✓ MEMENUHI AMBANG BATAS' : '✕ DI BAWAH STANDAR'}
                </span>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    scoreStats.isPassing ? 'bg-purple-600' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, scoreStats.totalScore)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Decisions selection card */}
          <Card>
            <CardHeader className="pb-2 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-gray-400" />
                <span>Keputusan & Rekomendasi Seleksi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs font-sans">
              {/* Option dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  Keputusan Seleksi *
                </label>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value as any)}
                  className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold focus:outline-none"
                >
                  <option value="SELECT">SELECT (Rekomendasikan Lolos Seleksi)</option>
                  <option value="NEED REVISION">NEED REVISION (Kembalikan Perbaikan)</option>
                  <option value="REJECT">REJECT (Tolak Usulan Penelitian)</option>
                </select>
              </div>

              {/* Selection Summary */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  Ringkasan & Justifikasi Penetapan Seleksi *
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Berikan ringkasan justifikasi hasil penilaian kriteria kelayakan usulan ini..."
                  rows={4}
                  className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 focus:outline-none resize-none text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Strengths */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  Kekuatan Usulan (Strengths)
                </label>
                <textarea
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="Poin keunggulan draf..."
                  rows={2}
                  className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 focus:outline-none resize-none text-gray-900 dark:text-white"
                />
              </div>

              {/* Weaknesses */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  Kelemahan Usulan (Weaknesses)
                </label>
                <textarea
                  value={weaknesses}
                  onChange={(e) => setWeaknesses(e.target.value)}
                  placeholder="Kelemahan atau batasan..."
                  rows={2}
                  className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 focus:outline-none resize-none text-gray-900 dark:text-white"
                />
              </div>

              {/* Risks */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  Identifikasi Risiko (Risks)
                </label>
                <textarea
                  value={risks}
                  onChange={(e) => setRisks(e.target.value)}
                  placeholder="Risiko pelaksanaan anggaran/data..."
                  rows={2}
                  className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 focus:outline-none resize-none text-gray-900 dark:text-white"
                />
              </div>

              {/* Save trigger */}
              <div className="pt-2">
                <button
                  onClick={handleSaveClick}
                  disabled={isSubmitting}
                  className="w-full text-center py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold transition-all shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Penetapan Hasil Seleksi'}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ================= MODAL: SAVE CONFIRMATION ================= */}
      <Dialog
        isOpen={isSaveOpen}
        onClose={() => setIsSaveOpen(false)}
        title="Simpan Penetapan Hasil Seleksi"
        description="Apakah Anda yakin ingin menetapkan hasil penilaian seleksi ini?"
        footer={
          <>
            <button
              onClick={handleConfirmSave}
              disabled={isSubmitting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold transition-all shadow disabled:opacity-50"
            >
              {isSubmitting ? 'Memproses...' : 'Ya, Tetapkan Hasil Seleksi'}
            </button>
            <button
              onClick={() => setIsSaveOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <p className="text-xs text-gray-500 leading-relaxed">
          Skor Akhir:{' '}
          <strong className="text-purple-700 dark:text-purple-400 font-extrabold text-sm">
            {scoreStats.totalScore} / 100 Poin
          </strong>
          . Keputusan:{' '}
          <strong>
            {recommendation === 'SELECT'
              ? 'Lolos Seleksi (Dilanjutkan ke Penetapan Riset)'
              : recommendation === 'REJECT'
              ? 'Ditolak (Tidak Lolos)'
              : 'Perbaikan Diperlukan'}
          </strong>
          . Rincian rubrik skor kriteria akan tersimpan secara permanen pada sistem.
        </p>
      </Dialog>
    </div>
  );
}
