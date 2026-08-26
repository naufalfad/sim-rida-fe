'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  Eye,
  AlertTriangle,
  Award,
  BookOpen
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';
import { AttachmentPreview } from '@/components/ui/attachment-preview';

export default function BridaReviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;
  const { toast } = useToast();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'problem' | 'research' | 'kak'>('problem');

  // Scoring States (default 75)
  const [relevansi, setRelevansi] = useState(75);
  const [urgensi, setUrgensi] = useState(75);
  const [novelty, setNovelty] = useState(75);
  const [feasibility, setFeasibility] = useState(75);
  const [impact, setImpact] = useState(75);
  const [alignment, setAlignment] = useState(75);

  const [recommendation, setRecommendation] = useState<'RECOMMENDED' | 'RESERVE' | 'REJECTED'>('RECOMMENDED');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isSubmitSaving, setIsSubmitSaving] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const data = await proposalService.getProposalById(proposalId);
        setProposal(data);
        if (data && data.review) {
          // Pre-populate if already exists
          setRelevansi(data.review.relevansi);
          setUrgensi(data.review.urgensi);
          setNovelty(data.review.novelty);
          setFeasibility(data.review.feasibility);
          setImpact(data.review.impact);
          setAlignment(data.review.alignment);
          setRecommendation(data.review.recommendation);
          setReviewerNotes(data.review.reviewerNotes);
        }
      } catch (err) {
        console.error('Failed to load proposal details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [proposalId]);

  if (isLoading) {
    return <LoadingState message="Memuat penilaian dokumen..." />;
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-base font-semibold">Usulan Tidak Ditemukan</h3>
        <Button onClick={() => router.push('/brida/review')} className="mt-4" variant="outline">
          Kembali
        </Button>
      </div>
    );
  }

  // Calculate dynamic average score
  const totalScore = parseFloat(
    ((relevansi + urgensi + novelty + feasibility + impact + alignment) / 6).toFixed(1)
  );

  const handleScoreSubmit = async () => {
    if (!reviewerNotes) {
      toast('Mohon berikan catatan penilaian kualitatif (Reviewer Notes).', 'error');
      return;
    }

    setIsSubmitSaving(true);
    try {
      const updated = await proposalService.submitSubstantiveReview(proposal.id, {
        relevansi,
        urgensi,
        novelty,
        feasibility,
        impact,
        alignment,
        totalScore,
        recommendation,
        reviewerNotes,
      });

      if (updated) {
        toast(`Penilaian usulan ${proposal.id} berhasil disubmit dengan total skor ${totalScore}!`, 'success');
        router.push('/brida/review');
      }
    } catch {
      toast('Gagal mengirimkan penilaian.', 'error');
    } finally {
      setIsSubmitSaving(false);
    }
  };

  const sliders = [
    { label: 'Relevansi Isu', value: relevansi, setter: setRelevansi, desc: 'Kesesuaian masalah dengan bidang kepakaran dan usulan.' },
    { label: 'Urgensi Pembangunan', value: urgensi, setter: setUrgensi, desc: 'Kemendesakan penyelesaian masalah bagi program daerah.' },
    { label: 'Novelty (Kebaruan)', value: novelty, setter: setNovelty, desc: 'Orisinalitas ide kajian dan ketiadaan tumpang tindih riset lampau.' },
    { label: 'Feasibility (Kelayakan)', value: feasibility, setter: setFeasibility, desc: 'Kelayakan alokasi anggaran, waktu, dan ketersediaan data.' },
    { label: 'Impact (Dampak)', value: impact, setter: setImpact, desc: 'Signifikansi luaran/outcomes riset bagi masyarakat luas.' },
    { label: 'Alignment (Keselarasan)', value: alignment, setter: setAlignment, desc: 'Keselarasan terhadap dokumen RPJMD dan isu prioritas Bupati.' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/brida/review')}
          className="h-9 w-9 p-0 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <span className="font-mono text-2xs font-bold text-blue-650 dark:text-blue-400">
            Penilaian Substansi / {proposal.id}
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200 mt-0.5 truncate max-w-sm sm:max-w-md">
            {proposal.title}
          </h1>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: scoring parameter sliders */}
        <div className="md:col-span-2 space-y-6">
          {/* COLLAPSIBLE DETAILS CARD */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 border-b hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <BookOpen className="h-4 w-4 text-blue-650" />
                <span className="font-bold text-xs uppercase tracking-wider">Detail Usulan & Dokumen Pendukung</span>
              </div>
              <span className="text-2xs text-blue-650 hover:underline font-semibold">
                {showDetails ? 'Sembunyikan' : 'Tampilkan'}
              </span>
            </button>
            
            {showDetails && (
              <div className="p-0 border-t border-slate-200 dark:border-slate-800 text-xs leading-relaxed animate-fade-in">
                {/* Tabs bar */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('problem')}
                    className={`flex-1 py-2 px-3 text-center font-bold uppercase text-[10px] tracking-wider transition-all ${
                      activeTab === 'problem'
                        ? 'bg-white dark:bg-slate-900 text-blue-650 shadow-sm border border-slate-200 dark:border-slate-800 font-extrabold'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    1. Masalah (OPD)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('research')}
                    disabled={!proposal.research}
                    className={`flex-1 py-2 px-3 text-center font-bold uppercase text-[10px] tracking-wider transition-all ${
                      !proposal.research ? 'opacity-40 cursor-not-allowed' : ''
                    } ${
                      activeTab === 'research'
                        ? 'bg-white dark:bg-slate-900 text-blue-650 shadow-sm border border-slate-200 dark:border-slate-800 font-extrabold'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    2. Usulan Riset
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('kak')}
                    disabled={!proposal.kak}
                    className={`flex-1 py-2 px-3 text-center font-bold uppercase text-[10px] tracking-wider transition-all ${
                      !proposal.kak ? 'opacity-40 cursor-not-allowed' : ''
                    } ${
                      activeTab === 'kak'
                        ? 'bg-white dark:bg-slate-900 text-blue-650 shadow-sm border border-slate-200 dark:border-slate-800 font-extrabold'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    3. KAK & RAB
                  </button>
                </div>

                <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
                  {/* TAB 1: IDENTIFIKASI MASALAH */}
                  {activeTab === 'problem' && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Judul Masalah</h4>
                        <p className="text-slate-850 dark:text-slate-200 mt-1 font-bold text-sm leading-snug">{proposal.title}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Bidang / Sektor</h4>
                        <p className="text-slate-800 dark:text-slate-250 mt-1">{proposal.problem.bidang}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Latar Belakang</h4>
                        <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">{proposal.problem.latarBelakang}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Fokus Utama</h4>
                        <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">{proposal.problem.masalahUtama}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Dampak Jika Dibiarkan</h4>
                        <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">{proposal.problem.dampak}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Urgensi</h4>
                        <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">{proposal.problem.urgensi}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Target Waktu Penyelesaian</h4>
                        <p className="text-slate-800 dark:text-slate-250 mt-1">{proposal.problem.targetPenyelesaian}</p>
                      </div>
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                        <h4 className="font-bold text-slate-500 uppercase text-[9px] tracking-wider mb-3">Dokumen Pendukung</h4>
                        <AttachmentPreview files={proposal.problem.dokumenPendukungList} />
                      </div>
                    </div>
                  )}

                  {/* TAB 2: USULAN RISET */}
                  {activeTab === 'research' && proposal.research && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Judul Usulan Riset</h4>
                        <p className="text-slate-850 dark:text-slate-200 mt-1 font-bold text-sm leading-snug">{proposal.research.judul}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 border-b border-t border-slate-100 dark:border-slate-800 py-3">
                        <div>
                          <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Perkiraan Anggaran</h4>
                          <p className="text-slate-850 dark:text-slate-100 mt-1 font-bold text-blue-650">
                            Rp {proposal.research.estimasiAnggaran?.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Perkiraan Durasi</h4>
                          <p className="text-slate-800 dark:text-slate-250 mt-1">{proposal.research.estimasiWaktu}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Tujuan Penelitian</h4>
                        <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">{proposal.research.tujuan}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Pertanyaan Penelitian</h4>
                        <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">{proposal.research.pertanyaanPenelitian}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Ruang Lingkup</h4>
                        <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">{proposal.research.ruangLingkup}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <div>
                          <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Output Diharapkan</h4>
                          <p className="text-slate-700 dark:text-slate-300 mt-1">{proposal.research.outputDiharapkan}</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Outcome Diharapkan</h4>
                          <p className="text-slate-700 dark:text-slate-300 mt-1">{proposal.research.outcomeDiharapkan}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: KAK & RAB */}
                  {activeTab === 'kak' && proposal.kak && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Maksud & Tujuan KAK</h4>
                        <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">{proposal.kak.maksudTujuan}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Metodologi</h4>
                        <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">{proposal.kak.metodologi}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Jadwal Pelaksanaan</h4>
                        <p className="text-slate-800 dark:text-slate-250 mt-1">{proposal.kak.jadwal}</p>
                      </div>

                      {/* RAB TABLE */}
                      {proposal.kak.rabItems && proposal.kak.rabItems.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-bold text-slate-500 uppercase text-[9px] tracking-wider mb-2">Rincian Anggaran Biaya (RAB)</h4>
                          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded">
                            <table className="w-full text-left text-2xs">
                              <thead className="bg-slate-50 dark:bg-slate-900">
                                <tr>
                                  <th className="p-2 font-semibold text-slate-600">Deskripsi</th>
                                  <th className="p-2 font-semibold text-slate-600 text-right">Vol</th>
                                  <th className="p-2 font-semibold text-slate-600 text-center">Sat</th>
                                  <th className="p-2 font-semibold text-slate-600 text-right">Harga Satuan</th>
                                  <th className="p-2 font-semibold text-slate-600 text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {proposal.kak.rabItems.map((item: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                                    <td className="p-2">{item.description}</td>
                                    <td className="p-2 text-right">{item.volume}</td>
                                    <td className="p-2 text-center">{item.unit}</td>
                                    <td className="p-2 text-right">Rp {item.unitPrice?.toLocaleString('id-ID')}</td>
                                    <td className="p-2 text-right font-medium">Rp {(item.volume * item.unitPrice)?.toLocaleString('id-ID')}</td>
                                  </tr>
                                ))}
                                <tr className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-850 dark:text-slate-100">
                                  <td colSpan={4} className="p-2 text-right">TOTAL ESTIMASI ANGGARAN</td>
                                  <td className="p-2 text-right text-blue-650 font-bold">
                                    Rp {proposal.kak.rabItems.reduce((acc: number, curr: any) => acc + (curr.volume * curr.unitPrice), 0).toLocaleString('id-ID')}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Parameter Penilaian Substansi Riset
            </h3>

            {sliders.map((s, idx) => (
              <div key={idx} className="space-y-1.5 border-b pb-4 last:border-0 last:pb-0 dark:border-slate-850">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <div>
                    <span className="text-slate-850 dark:text-slate-200">{s.label}</span>
                    <p className="text-[10px] text-slate-500 font-normal">{s.desc}</p>
                  </div>
                  <span className="font-mono font-bold text-blue-650 dark:text-blue-450 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded text-sm">
                    {s.value}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold">0</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={s.value}
                    onChange={(e) => s.setter(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-800 accent-blue-600"
                  />
                  <span className="text-[10px] text-slate-400 font-bold">100</span>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Right column: score recap and recommendation notes */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850">
              Ringkasan Skor Substansi
            </h3>

            {/* Score Card Circle */}
            <div className="py-4 flex flex-col items-center">
              <div className="h-24 w-24 rounded-full border-4 border-blue-600 flex flex-col items-center justify-center bg-blue-50/20 dark:bg-blue-950/10">
                <span className="font-mono text-3xl font-extrabold text-blue-600 dark:text-blue-400">{totalScore}</span>
                <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">Rata-Rata</span>
              </div>
            </div>

            {/* Recommendation Select */}
            <Select
              label="Rekomendasi Reviewer"
              options={[
                { value: 'RECOMMENDED', label: 'Recommended (Direkomendasikan Lolos)' },
                { value: 'RESERVE', label: 'Reserve (Masuk Cadangan)' },
                { value: 'REJECTED', label: 'Rejected (Ditolak Substansi)' },
              ]}
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value as any)}
              className="bg-white dark:bg-slate-950 dark:border-slate-800 border-slate-300"
            />

            {/* Reviewer notes */}
            <Textarea
              label="Reviewer Notes"
              placeholder="Jelaskan secara ringkas kekuatan/kelemahan metodologi usulan serta relevansi hasil terhadap daerah..."
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              rows={4}
            />

            {/* Submit */}
            <div className="border-t pt-4 dark:border-slate-850">
              <Button
                onClick={handleScoreSubmit}
                isLoading={isSubmitSaving}
                className="w-full bg-blue-650 hover:bg-blue-750 text-white flex items-center justify-center gap-1.5 shadow"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Submit Penilaian</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
