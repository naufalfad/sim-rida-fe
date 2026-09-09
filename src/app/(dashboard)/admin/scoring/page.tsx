'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOpdStore, OpdProposal, AdminScoringData, ExecutionMethod } from '@/store/useOpdStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import {
  Award,
  Search,
  CheckCircle2,
  Clock,
  Building,
  ArrowRight,
  Save,
  FileText,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export default function AdminScoringPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { proposals, saveScoring, approveToResearch, fetchScoringQueue, fetchProposals, isLoadingProposals } = useOpdStore();

  const [search, setSearch] = useState('');
  const [selectedProposal, setSelectedProposal] = useState<OpdProposal | null>(null);
  const [isScoringModalOpen, setIsScoringModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchScoringQueue();
    fetchProposals();
  }, [fetchScoringQueue, fetchProposals]);

  const handleRefresh = () => {
    fetchScoringQueue();
    fetchProposals();
  };

  // Scoring form states
  const [visionAlignmentScore, setVisionAlignmentScore] = useState(85);
  const [urgencyScore, setUrgencyScore] = useState(85);
  const [budgetFeasibilityScore, setBudgetFeasibilityScore] = useState(80);
  const [dataReadinessScore, setDataReadinessScore] = useState(80);
  const [fieldClassification, setFieldClassification] = useState<AdminScoringData['fieldClassification']>('Sosial Budaya & Kesejahteraan');
  const [executionMethod, setExecutionMethod] = useState<ExecutionMethod>('SWAKELOLA');
  const [researchScheme, setResearchScheme] = useState<AdminScoringData['researchScheme']>('INTERNAL_BRIDA');
  const [evaluatorNotes, setEvaluatorNotes] = useState('');
  const [targetCompletionDate, setTargetCompletionDate] = useState('2026-06-30');

  // Proposals ready for scoring (IN_REVIEW, SCORED, APPROVED, IN_PROGRESS, COMPLETED)
  const scorableProposals = useMemo(() => {
    return proposals.filter((p) => ['IN_REVIEW', 'SCORED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(p.status)).filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.opdName.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [proposals, search]);

  const totalScore = useMemo(() => {
    const total = (visionAlignmentScore * 0.3) + (urgencyScore * 0.3) + (budgetFeasibilityScore * 0.2) + (dataReadinessScore * 0.2);
    return Math.round(total);
  }, [visionAlignmentScore, urgencyScore, budgetFeasibilityScore, dataReadinessScore]);

  const handleOpenScoring = (proposal: OpdProposal) => {
    setSelectedProposal(proposal);
    if (proposal.scoringData) {
      setVisionAlignmentScore(proposal.scoringData.visionAlignmentScore);
      setUrgencyScore(proposal.scoringData.urgencyScore);
      setBudgetFeasibilityScore(proposal.scoringData.budgetFeasibilityScore);
      setDataReadinessScore(proposal.scoringData.dataReadinessScore ?? 80);
      setFieldClassification(proposal.scoringData.fieldClassification);
      setExecutionMethod(proposal.scoringData.executionMethod || 'SWAKELOLA');
      setResearchScheme(proposal.scoringData.researchScheme);
      setEvaluatorNotes(proposal.scoringData.evaluatorNotes);
    } else {
      setVisionAlignmentScore(85);
      setUrgencyScore(proposal.urgencyLevel === 'TINGGI' ? 90 : proposal.urgencyLevel === 'SEDANG' ? 80 : 70);
      setBudgetFeasibilityScore(80);
      setDataReadinessScore(80);
      setFieldClassification('Sosial Budaya & Kesejahteraan');
      setExecutionMethod('SWAKELOLA');
      setResearchScheme('INTERNAL_BRIDA');
      setEvaluatorNotes('Usulan dinilai memenuhi kriteria keselarasan prioritas daerah dan siap ditindaklanjuti.');
    }
    setIsScoringModalOpen(true);
  };

  const handleSaveScoringOnly = async () => {
    if (!selectedProposal) return;
    setIsSaving(true);
    try {
      await saveScoring(selectedProposal.id, {
        visionAlignmentScore,
        urgencyScore,
        budgetFeasibilityScore,
        dataReadinessScore,
        totalScore,
        fieldClassification,
        executionMethod,
        researchScheme: executionMethod === 'SWAKELOLA' ? 'INTERNAL_BRIDA' : 'KERJASAMA',
        evaluatorNotes,
        scoredAt: new Date().toISOString().split('T')[0],
        scoredBy: user?.name || 'Admin Litbang BRIDA',
      });
      toast(`Penilaian instrumen usulan ${selectedProposal.code} berhasil disimpan (Skor: ${totalScore}).`, 'success');
      setIsScoringModalOpen(false);
    } catch (err: any) {
      toast('Gagal menyimpan scoring: ' + (err.message || 'Terjadi kesalahan sistem'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveResearch = async () => {
    if (!selectedProposal) return;
    setIsSaving(true);
    try {
      await saveScoring(selectedProposal.id, {
        visionAlignmentScore,
        urgencyScore,
        budgetFeasibilityScore,
        dataReadinessScore,
        totalScore,
        fieldClassification,
        executionMethod,
        researchScheme: executionMethod === 'SWAKELOLA' ? 'INTERNAL_BRIDA' : 'KERJASAMA',
        evaluatorNotes,
        scoredAt: new Date().toISOString().split('T')[0],
        scoredBy: user?.name || 'Admin Litbang BRIDA',
      });
      approveToResearch(selectedProposal.id, targetCompletionDate);
      toast(`Usulan ${selectedProposal.code} disetujui untuk masuk ke agenda riset daerah (Status: APPROVED).`, 'success');
      setIsScoringModalOpen(false);
    } catch (err: any) {
      toast('Gagal memproses persetujuan riset: ' + (err.message || 'Terjadi kesalahan sistem'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Header Banner */}
      <div className="border border-slate-200 bg-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-[#0f2c59]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#0f2c59] text-xs font-bold uppercase tracking-widest">
            <Award className="w-4 h-4" />
            Modul Penelaahan & Scoring (Prioritasi Riset)
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Penelaahan Teknis & Pembobotan Usulan Riset
          </h1>
          <p className="text-slate-600 text-xs max-w-3xl leading-relaxed">
            Instrumen penilaian digital untuk mengukur keselarasan visi-misi daerah (30%), tingkat urgensi masalah (30%), ketersediaan anggaran (20%), dan kesiapan data & kapasitas riset (20%), serta penetapan klasifikasi bidang dan metode pengadaan kajian.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isLoadingProposals}
            className="p-2 border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            title="Segarkan data antrean scoring"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProposals ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <span className="px-3.5 py-1.5 bg-[#dde6f2] text-[#0f2c59] font-mono font-bold text-xs border border-[#bfd2e6]">
            {scorableProposals.filter((p) => p.status === 'IN_REVIEW').length} Menunggu Penilaian
          </span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="border border-slate-200 bg-white">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-[#0f2c59]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Daftar Usulan Terverifikasi untuk Penelaahan & Scoring ({scorableProposals.length})
            </h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari OPD, kode, atau judul usulan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 bg-white focus:border-[#0f2c59] focus:outline-none focus:ring-1 focus:ring-[#0f2c59]"
            />
          </div>
        </div>

        <div>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 text-2xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200">
                <TableHead className="w-14 text-center py-3">No.</TableHead>
                <TableHead className="w-28 text-center py-3">Kode</TableHead>
                <TableHead className="w-48 text-left py-3">Instansi OPD</TableHead>
                <TableHead className="text-left py-3">Judul Usulan Masalah</TableHead>
                <TableHead className="w-32 text-center py-3">Skor Prioritas</TableHead>
                <TableHead className="w-40 text-center py-3">Bidang / Skema</TableHead>
                <TableHead className="w-32 text-center py-3">Status</TableHead>
                <TableHead className="w-36 text-center py-3">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-200">
              {scorableProposals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Belum ada usulan yang terverifikasi untuk dinilai.
                  </TableCell>
                </TableRow>
              ) : (
                scorableProposals.map((item, idx) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* No. (Centered) */}
                    <TableCell className="text-center align-middle text-xs font-semibold text-slate-500 py-3.5">
                      {idx + 1}
                    </TableCell>

                    {/* Kode (Centered) */}
                    <TableCell className="text-center align-middle py-3.5">
                      <span className="font-mono text-xs font-bold text-[#0f2c59] block">
                        {item.code}
                      </span>
                    </TableCell>

                    {/* Instansi OPD (Left) */}
                    <TableCell className="text-left align-middle py-3.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-44">{item.opdName}</span>
                      </div>
                      <span className="text-2xs text-slate-500 block mt-0.5 uppercase tracking-wider">{item.category}</span>
                    </TableCell>

                    {/* Judul Usulan Masalah (Left) */}
                    <TableCell className="text-left align-middle py-3.5">
                      <span className="font-bold text-xs text-slate-900 block leading-snug">
                        {item.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {item.estimatedBudget && (
                          <span className="inline-flex items-center gap-1 text-2xs font-mono font-bold text-[#0f2c59] bg-[#dde6f2] px-2 py-0.5 border border-[#bfd2e6]">
                            Pagu: Rp {item.estimatedBudget.toLocaleString('id-ID')}
                          </span>
                        )}
                        {item.torDocument && (
                          <span className="inline-flex items-center gap-1 text-2xs font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 border border-blue-200">
                            <FileText className="h-3 w-3 text-blue-700" /> KAK / TOR Ada
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-1">
                        {item.problemStatement}
                      </p>
                    </TableCell>

                    {/* Skor Prioritas (Centered) */}
                    <TableCell className="text-center align-middle py-3.5">
                      {item.scoringData ? (
                        <div className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-300 font-mono font-bold text-xs">
                          {item.scoringData.totalScore} / 100
                        </div>
                      ) : (
                        <span className="text-2xs text-slate-400 font-semibold italic">Belum Dinilai</span>
                      )}
                    </TableCell>

                    {/* Bidang / Skema (Centered) */}
                    <TableCell className="text-center align-middle py-3.5 text-xs">
                      {item.scoringData ? (
                        <div>
                          <span className="font-bold text-slate-900 block text-2xs truncate max-w-36 mx-auto">
                            {item.scoringData.fieldClassification}
                          </span>
                          <span className="text-2xs font-semibold text-[#0f2c59] block mt-0.5">
                            {item.scoringData.executionMethod === 'SWAKELOLA' 
                              ? 'Swakelola' 
                              : item.scoringData.executionMethod === 'PENUNJUKAN_LANGSUNG' 
                              ? 'Penunjukan Langsung' 
                              : item.scoringData.executionMethod === 'E_KATALOG' 
                              ? 'E-Katalog' 
                              : item.scoringData.executionMethod === 'TENDER' 
                              ? 'Tender' 
                              : (item.scoringData.researchScheme === 'INTERNAL_BRIDA' ? 'Swakelola' : 'Kerjasama')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-2xs text-slate-400">-</span>
                      )}
                    </TableCell>

                    {/* Status (Centered) */}
                    <TableCell className="text-center align-middle py-3.5">
                      {item.status === 'IN_REVIEW' ? (
                        <span className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200">
                          <Clock className="h-3 w-3" />
                          Siap Scoring
                        </span>
                      ) : item.status === 'APPROVED' ? (
                        <span className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-wider bg-[#dde6f2] text-[#0f2c59] border-[#bfd2e6]">
                          <CheckCircle2 className="h-3 w-3" />
                          Disetujui
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          Selesai
                        </span>
                      )}
                    </TableCell>

                    {/* Aksi (Centered) */}
                    <TableCell className="text-center align-middle py-3.5">
                      <button
                        onClick={() => router.push(`/admin/scoring/${item.id}`)}
                        className="px-3 py-1.5 bg-[#0f2c59] hover:bg-[#0a1e3f] text-white text-xs font-semibold uppercase tracking-wider transition border border-[#0f2c59] inline-flex items-center justify-center gap-1.5 mx-auto"
                      >
                        <Award className="h-3.5 w-3.5" />
                        <span>{item.scoringData ? 'Edit Skor' : 'Mulai Skor'}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>

                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ================= SCORING MODAL DIALOG ================= */}
      <Dialog
        isOpen={isScoringModalOpen}
        onClose={() => setIsScoringModalOpen(false)}
        title={`Instrumen Scoring Digital: ${selectedProposal?.code || ''}`}
        description={`Penetapan skor kelayakan, klasifikasi bidang, dan skema riset untuk "${selectedProposal?.title || ''}"`}
        size="lg"
      >
        {selectedProposal && (
          <div className="space-y-4 text-xs font-sans">
            
            {/* Total Score Highlight */}
            <div className="p-3 border border-[#bfd2e6] bg-[#f0f4f9] flex items-center justify-between">
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-[#0f2c59] block">Total Skor Tertimbang</span>
                <h3 className="text-xl font-black text-[#0f2c59] font-mono">
                  {totalScore} <span className="text-xs font-normal text-slate-500">/ 100 Poin</span>
                </h3>
              </div>
              <span className={`px-2.5 py-1 text-2xs font-bold uppercase tracking-wider border ${
                totalScore >= 80 ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : totalScore >= 65 ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-rose-50 text-rose-900 border-rose-300'
              }`}>
                {totalScore >= 80 ? 'Prioritas Utama' : totalScore >= 65 ? 'Prioritas Kedua' : 'Tidak Prioritas'}
              </span>
            </div>

            {/* 4 Criteria Sliders */}
            <div className="space-y-3 p-3 bg-slate-50 border border-slate-200">
              
              {/* Kriteria 1: Kesesuaian Visi-Misi (Bobot 30%) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-2xs font-bold">
                  <span>1. Kesesuaian dengan Visi-Misi Daerah & RPJMD (Bobot 30%)</span>
                  <span className="text-[#0f2c59] font-mono">{visionAlignmentScore} Poin</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={visionAlignmentScore}
                  onChange={(e) => setVisionAlignmentScore(Number(e.target.value))}
                  className="w-full accent-[#0f2c59] cursor-pointer"
                />
              </div>

              {/* Kriteria 2: Urgensi Masalah (Bobot 30%) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-2xs font-bold">
                  <span>2. Tingkat Urgensi Masalah Lapangan (Bobot 30%)</span>
                  <span className="text-[#0f2c59] font-mono">{urgencyScore} Poin</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={urgencyScore}
                  onChange={(e) => setUrgencyScore(Number(e.target.value))}
                  className="w-full accent-[#0f2c59] cursor-pointer"
                />
              </div>

              {/* Kriteria 3: Ketersediaan Anggaran / Kelayakan (Bobot 20%) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-2xs font-bold">
                  <span>3. Kelayakan Teknis & Ketersediaan Anggaran Riset (Bobot 20%)</span>
                  <span className="text-[#0f2c59] font-mono">{budgetFeasibilityScore} Poin</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={budgetFeasibilityScore}
                  onChange={(e) => setBudgetFeasibilityScore(Number(e.target.value))}
                  className="w-full accent-[#0f2c59] cursor-pointer"
                />
              </div>

              {/* Kriteria 4: Kesiapan Data & Kapasitas (Bobot 20%) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-2xs font-bold">
                  <span>4. Kesiapan Data & Kapasitas Pelaksanaan Riset (Bobot 20%)</span>
                  <span className="text-[#0f2c59] font-mono">{dataReadinessScore} Poin</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={dataReadinessScore}
                  onChange={(e) => setDataReadinessScore(Number(e.target.value))}
                  className="w-full accent-[#0f2c59] cursor-pointer"
                />
              </div>

            </div>

            {/* Klasifikasi Bidang & Skema Riset */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block text-2xs uppercase">
                  Klasifikasi Bidang Kajian:
                </label>
                <select
                  value={fieldClassification}
                  onChange={(e) => setFieldClassification(e.target.value as any)}
                  className="w-full p-2 text-xs border border-slate-300 bg-white font-medium"
                >
                  <option value="Ekonomi">Ekonomi</option>
                  <option value="Pemerintahan & Tata Kelola">Pemerintahan & Tata Kelola</option>
                  <option value="Sosial Budaya & Kesejahteraan">Sosial Budaya & Kesejahteraan</option>
                  <option value="Inovasi & Teknologi">Inovasi & Teknologi</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block text-2xs uppercase">
                  Penetapan Skema Riset:
                </label>
                <select
                  value={researchScheme}
                  onChange={(e) => setResearchScheme(e.target.value as any)}
                  className="w-full p-2 text-xs border border-slate-300 bg-white font-medium"
                >
                  <option value="INTERNAL_BRIDA">Swakelola Internal Tim Litbang BRIDA</option>
                  <option value="KERJASAMA">Mekanisme Kerjasama Perguruan Tinggi / Pakar</option>
                </select>
              </div>
            </div>

            {/* Catatan Evaluator */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block text-2xs uppercase">
                Catatan Telaah & Rekomendasi Evaluator:
              </label>
              <textarea
                rows={2}
                value={evaluatorNotes}
                onChange={(e) => setEvaluatorNotes(e.target.value)}
                placeholder="Catatan justifikasi kelayakan dan arahan metode kajian..."
                className="w-full p-2 text-xs border border-slate-300 bg-white"
              />
            </div>

            {/* Target Selesai */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block text-2xs uppercase">
                Target Batas Waktu Penyelesaian Kajian:
              </label>
              <input
                type="date"
                value={targetCompletionDate}
                onChange={(e) => setTargetCompletionDate(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 bg-white font-medium"
              />
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsScoringModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 uppercase tracking-wider"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveScoringOnly}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-slate-300"
              >
                <Save className="h-4 w-4" />
                <span>Simpan Skor</span>
              </button>

              <button
                type="button"
                onClick={handleApproveResearch}
                className="px-4 py-2 bg-[#0f2c59] hover:bg-[#0a1e3f] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-[#0f2c59]"
              >
                <CheckCircle2 className="h-4 w-4 text-sky-300" />
                <span>Setujui Masuk Agenda Riset</span>
              </button>
            </div>

          </div>
        )}
      </Dialog>

    </div>
  );
}
