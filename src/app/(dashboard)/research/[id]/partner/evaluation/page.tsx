'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePartnerStore } from '@/store/usePartnerStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { usePlanningStore } from '@/store/usePlanningStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Candidate, CandidateEvaluation } from '@/mock/partners/candidates';
import {
  ArrowLeft,
  Award,
  Save,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  TrendingUp,
  DollarSign
} from 'lucide-react';

export default function PartnerEvaluationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { getMethod, getCandidates, saveEvaluation, fetchPartners, isLoaded } = usePartnerStore();
  const { researchRecords, proposals, fetchProposals } = useResearchStore();
  const { getRab, fetchPlanning } = usePlanningStore();

  const id = params?.id || '';

  // Access check
  useEffect(() => {
    if (user && !['BRIDA', 'ADMIN_BRIDA', 'KEPALA_BRIDA'].includes(user.role)) {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchPartners();
    fetchProposals();
    fetchPlanning();
  }, [id, fetchPartners, fetchProposals, fetchPlanning]);

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

  // Redirect if locked once loaded
  useEffect(() => {
    if (isLoaded && method && ['APPROVED', 'UNDER_REVIEW'].includes(method.status)) {
      toast('Proses evaluasi mitra sudah dikunci (Approved/Under Review).', 'warning');
      router.replace(`/research/${id}/partner`);
    }
  }, [isLoaded, method, id, router, toast]);

  // Tally approved RAB total
  const rabTotal = useMemo(() => {
    return rab.items.reduce((sum, item) => sum + item.subtotal, 0);
  }, [rab]);

  // Select active candidate to evaluate
  const [selectedCandId, setSelectedCandId] = useState('');

  const activeCandidate = useMemo(() => {
    return candidates.find(c => c.id === selectedCandId) || candidates[0] || null;
  }, [candidates, selectedCandId]);

  // Sync active candidate ID
  useEffect(() => {
    if (candidates.length > 0 && !selectedCandId) {
      setSelectedCandId(candidates[0].id);
    }
  }, [candidates, selectedCandId]);

  // Evaluation Form States
  const [competence, setCompetence] = useState(5);
  const [experience, setExperience] = useState(5);
  const [capacity, setCapacity] = useState(5);
  const [methodology, setMethodology] = useState(5);
  const [cost, setCost] = useState(5);
  const [availability, setAvailability] = useState(5);

  const [strength, setStrength] = useState('');
  const [weakness, setWeakness] = useState('');
  const [risk, setRisk] = useState('');
  const [notes, setNotes] = useState('');
  const [recommendation, setRecommendation] = useState<'RECOMMENDED' | 'NOT_RECOMMENDED'>('RECOMMENDED');

  // Load existing evaluation data if present
  useEffect(() => {
    if (activeCandidate) {
      const evalData = activeCandidate.evaluation;
      if (evalData) {
        setCompetence(evalData.competence);
        setExperience(evalData.experience);
        setCapacity(evalData.capacity);
        setMethodology(evalData.methodology);
        setCost(evalData.cost);
        setAvailability(evalData.availability);
        setStrength(evalData.strength);
        setWeakness(evalData.weakness);
        setRisk(evalData.risk);
        setNotes(evalData.notes);
        setRecommendation(evalData.recommendation);
      } else {
        // Reset to default
        setCompetence(5);
        setExperience(5);
        setCapacity(5);
        setMethodology(5);
        setCost(5);
        setAvailability(5);
        setStrength('');
        setWeakness('');
        setRisk('');
        setNotes('');
        setRecommendation('RECOMMENDED');
      }
    }
  }, [activeCandidate]);

  // Math tally
  const totalScore = competence + experience + capacity + methodology + cost + availability;
  const maxScore = 30;
  const percentage = Number(((totalScore / maxScore) * 100).toFixed(0));

  // Budget comparison calculation (Section 25)
  const budgetStatus = useMemo(() => {
    if (!activeCandidate) return { status: 'Within RAB', isAbove: false };
    const isAbove = activeCandidate.price > rabTotal;
    return {
      status: isAbove ? 'Above RAB' : 'Within RAB',
      isAbove,
    };
  }, [activeCandidate, rabTotal]);

  const handleSaveEvaluation = async () => {
    if (!activeCandidate) return;

    const payload: CandidateEvaluation = {
      competence,
      experience,
      capacity,
      methodology,
      cost,
      availability,
      strength: strength.trim() || 'Kualifikasi dan kompetensi teknis memadai',
      weakness: weakness.trim() || 'Perlu koordinasi timeline kerja',
      risk: risk.trim() || 'Rendah',
      notes: notes.trim(),
      recommendation,
    };

    try {
      await saveEvaluation(id, activeCandidate.id, payload);
      toast(`Hasil evaluasi kelayakan untuk "${activeCandidate.name}" berhasil disimpan.`, 'success');
    } catch (err: any) {
      toast('Gagal menyimpan evaluasi: ' + (err.message || 'Terjadi kesalahan.'), 'error');
    }
  };

  if (!record || candidates.length === 0) {
    return (
      <div className="space-y-6 text-center py-12 font-sans">
        <h2 className="text-sm font-bold text-gray-800 dark:text-white">Tidak Ada Calon Mitra yang Terdaftar</h2>
        <p className="text-xs text-gray-500">Silakan daftarkan calon mitra terlebih dahulu pada tab Calon Mitra.</p>
        <button
          onClick={() => router.push(`/research/${id}/partner/candidates`)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold"
        >
          Ke Daftar Calon Mitra
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
          onClick={() => router.push(`/research/${id}/partner`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Overview</span>
        </button>
      </div>

      <PageHeader
        title="Evaluasi Kelayakan Calon Mitra"
        description={`Penilaian kelayakan calon penyedia jasa luar untuk riset: "${record.title}"`}
      />

      <div className="grid gap-6 md:grid-cols-4 items-stretch">
        
        {/* ================= LEFT SIDEBAR (Candidates selector list) ================= */}
        <div className="space-y-3">
          <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider pl-1">
            Pilih Calon Mitra
          </span>
          <div className="space-y-2 select-none">
            {candidates.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCandId(c.id)}
                className={`p-3 rounded border cursor-pointer transition-all flex justify-between items-center text-xs ${
                  c.id === activeCandidate?.id
                    ? 'border-blue-500 bg-blue-50/5 font-bold text-blue-700'
                    : 'bg-white dark:bg-gray-900 border-gray-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="truncate pr-2">
                  <span className="block truncate">{c.name}</span>
                  <span className="text-[10px] text-gray-400 font-semibold leading-none mt-1 block">
                    {c.type}
                  </span>
                </div>
                <ChevronRight className={`h-4 w-4 shrink-0 ${c.id === activeCandidate?.id ? 'text-blue-600' : 'text-gray-350'}`} />
              </div>
            ))}
          </div>
        </div>

        {/* ================= RIGHT FORM (Matrix & Notes) ================= */}
        <div className="md:col-span-3 space-y-6">
          
          {activeCandidate && (
            <Card>
              <CardContent className="p-6 space-y-6 text-xs font-sans">
                
                {/* Header Profile */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2 border-b pb-3">
                  <div>
                    <h3 className="font-extrabold text-gray-850 dark:text-gray-200 text-sm">{activeCandidate.name}</h3>
                    <span className="text-[10px] text-gray-400 font-semibold">{activeCandidate.type} • Penawaran: {formatIDR(activeCandidate.price)}</span>
                  </div>

                  {/* Budget Validation Check status */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-400 font-bold uppercase">Budget Check:</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                      budgetStatus.isAbove 
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {budgetStatus.status}
                    </span>
                  </div>
                </div>

                {/* Budget mismatch warning block */}
                {budgetStatus.isAbove && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 rounded text-amber-750 dark:text-amber-400 text-2xs flex items-center gap-2 font-semibold">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Nilai penawaran kandidat melebihi nilai total RAB yang telah disetujui ({formatIDR(rabTotal)}).</span>
                  </div>
                )}

                {/* Score slider/inputs matrix */}
                <div className="space-y-4">
                  <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider">
                    Matriks Penilaian Kriteria Kelayakan (Skor 1 - 5)
                  </span>

                  <div className="grid gap-4 sm:grid-cols-2">
                    
                    {/* 1. Kompetensi */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline text-2xs">
                        <label className="font-bold text-gray-700 uppercase">1. Kesesuaian Kompetensi *</label>
                        <span className="font-bold text-blue-600">{competence} / 5</span>
                      </div>
                      <input
                        type="range" min="1" max="5" value={competence}
                        onChange={(e) => setCompetence(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* 2. Pengalaman */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline text-2xs">
                        <label className="font-bold text-gray-700 uppercase">2. Pengalaman Kerja *</label>
                        <span className="font-bold text-blue-600">{experience} / 5</span>
                      </div>
                      <input
                        type="range" min="1" max="5" value={experience}
                        onChange={(e) => setExperience(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* 3. Kapasitas */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline text-2xs">
                        <label className="font-bold text-gray-700 uppercase">3. Kapasitas Pelaksanaan *</label>
                        <span className="font-bold text-blue-600">{capacity} / 5</span>
                      </div>
                      <input
                        type="range" min="1" max="5" value={capacity}
                        onChange={(e) => setCapacity(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* 4. Metodologi */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline text-2xs">
                        <label className="font-bold text-gray-700 uppercase">4. Metodologi Penelitian *</label>
                        <span className="font-bold text-blue-600">{methodology} / 5</span>
                      </div>
                      <input
                        type="range" min="1" max="5" value={methodology}
                        onChange={(e) => setMethodology(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* 5. Kesesuaian Biaya */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline text-2xs">
                        <label className="font-bold text-gray-700 uppercase">5. Kesesuaian Biaya Penawaran *</label>
                        <span className="font-bold text-blue-600">{cost} / 5</span>
                      </div>
                      <input
                        type="range" min="1" max="5" value={cost}
                        onChange={(e) => setCost(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* 6. Ketersediaan */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline text-2xs">
                        <label className="font-bold text-gray-700 uppercase">6. Ketersediaan Waktu *</label>
                        <span className="font-bold text-blue-600">{availability} / 5</span>
                      </div>
                      <input
                        type="range" min="1" max="5" value={availability}
                        onChange={(e) => setAvailability(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>

                  </div>

                  {/* Math score display block */}
                  <div className="p-3 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 rounded flex justify-between items-baseline font-bold select-none mt-4">
                    <span className="text-[10px] text-purple-750 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>Akumulasi Nilai Kelayakan Kelompok</span>
                    </span>
                    <span className="text-purple-750 dark:text-purple-400 text-sm">
                      {totalScore} / {maxScore} Score ({percentage}%)
                    </span>
                  </div>
                </div>

                {/* SWOT/Strengths Textareas */}
                <div className="space-y-4 pt-3 border-t">
                  <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider">
                    Analisis Kualitatif & Mitigasi Risiko
                  </span>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="block text-2xs font-bold text-gray-750 uppercase">Kekuatan (Strength) *</label>
                      <textarea
                        value={strength}
                        onChange={(e) => setStrength(e.target.value)}
                        placeholder="Kelebihan utama calon..."
                        rows={2}
                        className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-2xs font-bold text-gray-750 uppercase">Kelemahan (Weakness) *</label>
                      <textarea
                        value={weakness}
                        onChange={(e) => setWeakness(e.target.value)}
                        placeholder="Kekurangan utama..."
                        rows={2}
                        className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-2xs font-bold text-gray-750 uppercase">Risiko Pelaksanaan (Risk) *</label>
                      <textarea
                        value={risk}
                        onChange={(e) => setRisk(e.target.value)}
                        placeholder="Identifikasi potensi risiko..."
                        rows={2}
                        className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-2xs font-bold text-gray-750 uppercase">Catatan Tambahan Evaluasi</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Informasi pelengkap..."
                      rows={2}
                      className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900"
                    />
                  </div>
                </div>

                {/* Recommendation Radio buttons */}
                <div className="space-y-2 pt-3 border-t">
                  <label className="block text-2xs font-bold text-gray-500 uppercase">
                    Rekomendasi Keputusan Akhir BRIDA
                  </label>
                  <div className="flex gap-4 font-bold">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio" name="recommendation" value="RECOMMENDED"
                        checked={recommendation === 'RECOMMENDED'}
                        onChange={() => setRecommendation('RECOMMENDED')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-emerald-700">RECOMMENDED (Direkomendasikan Terpilih)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio" name="recommendation" value="NOT_RECOMMENDED"
                        checked={recommendation === 'NOT_RECOMMENDED'}
                        onChange={() => setRecommendation('NOT_RECOMMENDED')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-rose-700">NOT RECOMMENDED (Tidak Direkomendasikan)</span>
                    </label>
                  </div>
                </div>

                {/* Save Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    onClick={() => router.push(`/research/${id}/partner`)}
                    className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-750 dark:text-gray-300 rounded text-xs font-semibold bg-white dark:bg-gray-950"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleSaveEvaluation}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Evaluation</span>
                  </button>
                </div>

              </CardContent>
            </Card>
          )}

        </div>
      </div>

    </div>
  );
}
