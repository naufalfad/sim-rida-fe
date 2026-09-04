'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
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
  Scale
} from 'lucide-react';

export default function SelectionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { proposals, saveSelectionResult } = useResearchStore();

  const id = params?.id;
  const isBrida = user?.role === 'BRIDA';

  // Access control
  useEffect(() => {
    if (user && user.role !== 'BRIDA') {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  // Find target proposal
  const proposal = useMemo(() => {
    return proposals.find((p) => p.id === id);
  }, [proposals, id]);

  // Redirect if proposal status is invalid
  useEffect(() => {
    if (proposal && !['SUBMITTED', 'UNDER_SELECTION'].includes(proposal.status)) {
      toast('Usulan tidak sedang dalam tahapan proses seleksi.', 'warning');
      router.replace(`/research-proposals/${proposal.id}`);
    }
  }, [proposal, router, toast]);

  // Kriteria Scores & Notes State (1-5 range)
  const [relevance, setRelevance] = useState(4);
  const [relevanceNotes, setRelevanceNotes] = useState('');

  const [urgency, setUrgency] = useState(4);
  const [urgencyNotes, setUrgencyNotes] = useState('');

  const [priorityAlignment, setPriorityAlignment] = useState(4);
  const [priorityAlignmentNotes, setPriorityAlignmentNotes] = useState('');

  const [benefits, setBenefits] = useState(4);
  const [benefitsNotes, setBenefitsNotes] = useState('');

  const [feasibility, setFeasibility] = useState(4);
  const [feasibilityNotes, setFeasibilityNotes] = useState('');

  const [dataAvailability, setDataAvailability] = useState(4);
  const [dataAvailabilityNotes, setDataAvailabilityNotes] = useState('');

  const [recommendationPotential, setRecommendationPotential] = useState(4);
  const [recommendationPotentialNotes, setRecommendationPotentialNotes] = useState('');

  // Selection notes & summary
  const [recommendation, setRecommendation] = useState<'SELECT' | 'REJECT' | 'NEED REVISION'>('SELECT');
  const [summary, setSummary] = useState('');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [risks, setRisks] = useState('');

  // Modals state
  const [isSaveOpen, setIsSaveOpen] = useState(false);

  // Live Score Calculator
  const scoreStats = useMemo(() => {
    const total =
      Number(relevance) +
      Number(urgency) +
      Number(priorityAlignment) +
      Number(benefits) +
      Number(feasibility) +
      Number(dataAvailability) +
      Number(recommendationPotential);

    const max = 35;
    const percentage = Number(((total / max) * 100).toFixed(2));

    return { total, max, percentage };
  }, [
    relevance,
    urgency,
    priorityAlignment,
    benefits,
    feasibility,
    dataAvailability,
    recommendationPotential
  ]);

  const handleSaveClick = () => {
    if (!summary.trim()) {
      toast('Ringkasan hasil seleksi (Selection Summary) wajib diisi.', 'warning');
      return;
    }
    setIsSaveOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!proposal) return;

    const scores = {
      relevance: Number(relevance),
      relevanceNotes,
      urgency: Number(urgency),
      urgencyNotes,
      priorityAlignment: Number(priorityAlignment),
      priorityAlignmentNotes,
      benefits: Number(benefits),
      benefitsNotes,
      feasibility: Number(feasibility),
      feasibilityNotes,
      dataAvailability: Number(dataAvailability),
      dataAvailabilityNotes,
      recommendationPotential: Number(recommendationPotential),
      recommendationPotentialNotes,
    };

    const notes = {
      summary,
      strengths,
      weaknesses,
      risks,
      recommendation,
    };

    try {
      await saveSelectionResult(proposal.id, scores, notes, user?.name || 'BRIDA Litbang');
      setIsSaveOpen(false);
      toast('Hasil penilaian seleksi kelayakan usulan berhasil disimpan.', 'success');
      router.push(`/research-proposals/${proposal.id}`);
    } catch (err: any) {
      toast('Gagal menyimpan hasil seleksi: ' + (err.message || 'Terjadi kesalahan.'), 'error');
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

  const scoreOptions = [1, 2, 3, 4, 5];

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
        title="Seleksi Usulan Penelitian"
        description={`Penilaian kriteria kelayakan teknis internal BRIDA untuk usulan: "${proposal.title}"`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* ================= LEFT SECTION (7 Criteria Assessment) ================= */}
        <div className="md:col-span-2 space-y-6">
          
          <Card>
            <CardHeader className="pb-3 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-gray-400" />
                <span>Kriteria Kelayakan Teknis (Skor 1-5)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-6">
              
              {/* 1. Relevansi */}
              <div className="space-y-2 pb-4 border-b dark:border-gray-850">
                <div className="flex flex-wrap justify-between items-baseline gap-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-250">
                    1. Relevansi Permasalahan dengan Bidang Urusan *
                  </span>
                  <select
                    value={relevance}
                    onChange={(e) => setRelevance(Number(e.target.value))}
                    className="px-2 py-1 text-2xs border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    {scoreOptions.map(val => (
                      <option key={val} value={val}>Skor {val}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={relevanceNotes}
                  onChange={(e) => setRelevanceNotes(e.target.value)}
                  placeholder="Catatan relevansi permasalahan..."
                  className="block w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* 2. Urgensi */}
              <div className="space-y-2 pb-4 border-b dark:border-gray-850">
                <div className="flex flex-wrap justify-between items-baseline gap-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-250">
                    2. Urgensi dan Kedesakan Solusi Masalah *
                  </span>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(Number(e.target.value))}
                    className="px-2 py-1 text-2xs border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    {scoreOptions.map(val => (
                      <option key={val} value={val}>Skor {val}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={urgencyNotes}
                  onChange={(e) => setUrgencyNotes(e.target.value)}
                  placeholder="Catatan kedesakan solusi..."
                  className="block w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* 3. Kesesuaian Prioritas */}
              <div className="space-y-2 pb-4 border-b dark:border-gray-850">
                <div className="flex flex-wrap justify-between items-baseline gap-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-250">
                    3. Kesesuaian dengan Rencana Prioritas Kerja Daerah *
                  </span>
                  <select
                    value={priorityAlignment}
                    onChange={(e) => setPriorityAlignment(Number(e.target.value))}
                    className="px-2 py-1 text-2xs border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    {scoreOptions.map(val => (
                      <option key={val} value={val}>Skor {val}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={priorityAlignmentNotes}
                  onChange={(e) => setPriorityAlignmentNotes(e.target.value)}
                  placeholder="Catatan kesesuaian target kerja daerah..."
                  className="block w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* 4. Potensi Manfaat */}
              <div className="space-y-2 pb-4 border-b dark:border-gray-850">
                <div className="flex flex-wrap justify-between items-baseline gap-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-250">
                    4. Potensi Manfaat Riset terhadap Kebijakan Sektoral *
                  </span>
                  <select
                    value={benefits}
                    onChange={(e) => setBenefits(Number(e.target.value))}
                    className="px-2 py-1 text-2xs border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    {scoreOptions.map(val => (
                      <option key={val} value={val}>Skor {val}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={benefitsNotes}
                  onChange={(e) => setBenefitsNotes(e.target.value)}
                  placeholder="Catatan manfaat riset kebijakan..."
                  className="block w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* 5. Kelayakan Pelaksanaan */}
              <div className="space-y-2 pb-4 border-b dark:border-gray-850">
                <div className="flex flex-wrap justify-between items-baseline gap-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-250">
                    5. Kelayakan Teknis Pelaksanaan Riset *
                  </span>
                  <select
                    value={feasibility}
                    onChange={(e) => setFeasibility(Number(e.target.value))}
                    className="px-2 py-1 text-2xs border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    {scoreOptions.map(val => (
                      <option key={val} value={val}>Skor {val}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={feasibilityNotes}
                  onChange={(e) => setFeasibilityNotes(e.target.value)}
                  placeholder="Catatan kelayakan durasi & logistik..."
                  className="block w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* 6. Ketersediaan Data */}
              <div className="space-y-2 pb-4 border-b dark:border-gray-850">
                <div className="flex flex-wrap justify-between items-baseline gap-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-250">
                    6. Ketersediaan Data Pendukung / Evidence Awal *
                  </span>
                  <select
                    value={dataAvailability}
                    onChange={(e) => setDataAvailability(Number(e.target.value))}
                    className="px-2 py-1 text-2xs border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    {scoreOptions.map(val => (
                      <option key={val} value={val}>Skor {val}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={dataAvailabilityNotes}
                  onChange={(e) => setDataAvailabilityNotes(e.target.value)}
                  placeholder="Catatan ketercukupan evidence/bukti..."
                  className="block w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* 7. Potensi Menghasilkan Rekomendasi */}
              <div className="space-y-2">
                <div className="flex flex-wrap justify-between items-baseline gap-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-250">
                    7. Potensi Hasil untuk Rekomendasi Tindak Lanjut *
                  </span>
                  <select
                    value={recommendationPotential}
                    onChange={(e) => setRecommendationPotential(Number(e.target.value))}
                    className="px-2 py-1 text-2xs border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    {scoreOptions.map(val => (
                      <option key={val} value={val}>Skor {val}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={recommendationPotentialNotes}
                  onChange={(e) => setRecommendationPotentialNotes(e.target.value)}
                  placeholder="Catatan keluaran policy brief..."
                  className="block w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

            </CardContent>
          </Card>

        </div>

        {/* ================= RIGHT SECTION (Summary & Action Decisions) ================= */}
        <div className="space-y-6">
          
          {/* Live score card */}
          <Card>
            <CardHeader className="pb-2 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-purple-600" />
                <span>Akumulasi Kelayakan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs font-bold">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-400 text-[10px] uppercase">Live Total Score</span>
                <span className="text-purple-700 dark:text-purple-400 text-lg">
                  {scoreStats.total} / {scoreStats.max}
                </span>
              </div>
              <div className="flex justify-between items-baseline border-b pb-3">
                <span className="text-gray-400 text-[10px] uppercase">Persentase</span>
                <span className="text-purple-700 dark:text-purple-400 text-base">
                  {scoreStats.percentage}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-purple-650 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${scoreStats.percentage}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Decisions selection card */}
          <Card>
            <CardHeader className="pb-2 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-gray-400" />
                <span>Keputusan Seleksi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs font-sans">
              
              {/* Option dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  Rekomendasi Hasil Seleksi *
                </label>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value as any)}
                  className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold focus:outline-none"
                >
                  <option value="SELECT">SELECT (Kirim ke Kepala BRIDA)</option>
                  <option value="NEED REVISION">NEED REVISION (Kembalikan ke BRIDA)</option>
                  <option value="REJECT">REJECT (Tolak Usulan)</option>
                </select>
              </div>

              {/* Selection Summary */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  Ringkasan Seleksi (Summary) *
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Berikan ringkasan akhir kelayakan usulan ini..."
                  rows={3}
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
                  className="w-full text-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all shadow"
                >
                  Save Selection Result
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
        title="Simpan Hasil Seleksi"
        description="Simpan hasil penilaian seleksi?"
        footer={
          <>
            <button
              onClick={handleConfirmSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-all"
            >
              Simpan Penilaian
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
          Menyimpan hasil penilaian ini akan merubah status usulan menjadi:{' '}
          <strong>
            {recommendation === 'SELECT'
              ? 'WAITING_APPROVAL (Menunggu Penetapan Kepala BRIDA)'
              : recommendation === 'REJECT'
              ? 'REJECTED (Usulan ditolak)'
              : 'DRAFT (Kembali disunting BRIDA)'}
          </strong>
          . Pastikan skor dan ringkasan audit telah sesuai dengan kesepakatan internal.
        </p>
      </Dialog>

    </div>
  );
}
