'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOpdStore, OpdProposal } from '@/store/useOpdStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sparkles,
  Save,
  CheckCircle2,
  ArrowLeft,
  FileText,
  DollarSign,
  Clock,
  Printer,
  AlertTriangle,
  Building2,
  Layers,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Calendar,
  X,
  Sliders,
  Award,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function KakLiveEditorPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;

  const { proposals, fetchProposals, generateKakAi, saveKakStudy, isLoadingStudies } = useOpdStore();

  const [proposal, setProposal] = useState<OpdProposal | null>(null);

  // KAK Form States (fokus murni pada substansi dokumen KAK)
  const [background, setBackground] = useState('');
  const [objectives, setObjectives] = useState('');
  const [scopeAndMethodology, setScopeAndMethodology] = useState('');
  const [targetOutput, setTargetOutput] = useState('');
  const [kakStatus, setKakStatus] = useState<'NOT_STARTED' | 'DRAFT' | 'FINAL'>('NOT_STARTED');

  // Anggaran Pagu dan Durasi Riset bersumber dari Identifikasi Masalah (Tahap 1)
  const allocatedBudget = proposal?.estimatedBudget ? Number(proposal.estimatedBudget) : 0;
  const durationMonths = proposal?.estimatedDuration ? Number(proposal.estimatedDuration) : 3;

  // AI Assistant Modal & Status States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Print/Export Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load Proposal and Existing KAK data
  useEffect(() => {
    const found = proposals.find((p) => p.id === proposalId);
    if (found) {
      setProposal(found);
      const study = (found as any).researchStudy;
      if (study && study.kakDocument) {
        setBackground(study.kakDocument.background || '');
        setObjectives(study.kakDocument.objectives || '');
        setScopeAndMethodology(study.kakDocument.scopeAndMethodology || '');
        setTargetOutput(study.kakDocument.targetOutput || '');
        setKakStatus(study.kakDocument.status || 'DRAFT');
      } else {
        // Inisialisasi default dari data usulan jika belum ada draf KAK
        setBackground(
          `1. Latar Belakang Masalah:\n${found.problemStatement}\n\n2. Urgensi Riset Daerah:\n${found.urgencyReason}`
        );
        setObjectives(
          `1. Maksud Kegiatan:\nMenghasilkan kajian ilmiah dan rekomendasi berbasis bukti terkait ${found.title}.\n\n2. Tujuan Riset:\n- Mengidentifikasi faktor determinan dan akar permasalahan di lapangan.\n- Merumuskan opsi kebijakan strategis bagi ${found.opdName}.\n- Menyusun rencana aksi implementatif yang aplikatif.`
        );
        setScopeAndMethodology(
          `1. Ruang Lingkup:\nWilayah Kabupaten Mimika dengan lokus kajian pada instansi ${found.opdName} serta stakeholder terkait.\n\n2. Metodologi:\nKajian menggunakan pendekatan mixed-methods (kuantitatif dan kualitatif) melalui survei lapangan, wawancara mendalam, dan Focus Group Discussion (FGD).`
        );
        setTargetOutput(found.expectedOutput || 'Kajian Kebijakan / Policy Brief');
      }
    } else {
      fetchProposals();
    }
  }, [proposalId, proposals, fetchProposals]);

  // Handle Generate KAK with AI (Hanya merumuskan substansi KAK)
  const handleGenerateAi = async (promptToUse = customPrompt) => {
    try {
      setIsGeneratingAi(true);
      setAiStatus(null);
      setSaveMessage(null);

      const result = await generateKakAi(proposalId, promptToUse);

      if (result) {
        if (result.background) setBackground(result.background);
        if (result.objectives) setObjectives(result.objectives);
        if (result.scopeAndMethodology) setScopeAndMethodology(result.scopeAndMethodology);
        if (result.targetOutput) setTargetOutput(result.targetOutput);

        setAiStatus({
          type: 'success',
          text: 'Draf Kerangka Acuan Kerja (KAK) berhasil dirumuskan secara komprehensif oleh AI!',
        });

        if (isAiModalOpen) {
          setIsAiModalOpen(false);
        }
      }
    } catch (err: any) {
      console.error('Error generating KAK with AI:', err);
      setAiStatus({
        type: 'error',
        text: err.message || 'Gagal memproses generate KAK dengan AI. Silakan coba kembali atau periksa koneksi backend.',
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Handle Save / Finalize (Murni menyimpan dokumen KAK)
  const handleSave = async (statusToSave: 'DRAFT' | 'FINAL') => {
    try {
      setIsSaving(true);
      setSaveMessage(null);

      const payload = {
        background,
        objectives,
        scopeAndMethodology,
        targetOutput,
        status: statusToSave,
      };

      await saveKakStudy(proposalId, payload);
      setKakStatus(statusToSave);
      setSaveMessage({
        type: 'success',
        text:
          statusToSave === 'FINAL'
            ? 'Dokumen KAK berhasil DIFINALISASI. Riset resmi siap diteruskan ke Tahap 4 (Penetapan Pelaksana & Pelaksanaan Riset)!'
            : 'Draf KAK berhasil disimpan ke database SIM-RIDA.',
      });

      // Refresh proposal list
      fetchProposals();
    } catch (err: any) {
      setSaveMessage({
        type: 'error',
        text: err.message || 'Gagal menyimpan KAK',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!proposal) {
    return (
      <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-[#0f2c59]" />
        <span>Memuat data usulan untuk live editor KAK...</span>
      </div>
    );
  }

  const isBrida = proposal.source === 'BRIDA_ANALYSIS' || proposal.code.includes('BRIDA');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 font-sans">
      {/* TOP NAVIGATION & ACTIONS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/kak-builder"
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-600 px-2 py-0.5 bg-slate-100 rounded">
                {proposal.code}
              </span>
              {isBrida ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-100 text-sky-900 border border-sky-200 flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  Inisiatif BRIDA
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Usulan OPD Lolos Validasi
                </span>
              )}
              {kakStatus === 'FINAL' ? (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-600 text-white flex items-center gap-1 shadow-2xs">
                  <CheckCircle2 className="h-3 w-3" />
                  KAK FINAL
                </span>
              ) : kakStatus === 'DRAFT' ? (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-900 border border-blue-200 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  DRAF KAK TERSIMPAN
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  BELUM DISUSUN KAK
                </span>
              )}
            </div>
            <h1 className="text-base font-bold text-slate-900 mt-1 line-clamp-1">{proposal.title}</h1>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleGenerateAi()}
            disabled={isGeneratingAi}
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all cursor-pointer border border-blue-700',
              isGeneratingAi
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            )}
            title="Generate KAK secara otomatis dengan AI"
          >
            <Sparkles className={cn('h-4 w-4 text-sky-200', isGeneratingAi && 'animate-spin')} />
            <span>{isGeneratingAi ? 'Menyusun KAK...' : 'Generate AI (1-Klik)'}</span>
          </button>

          <button
            onClick={() => setIsAiModalOpen(true)}
            disabled={isGeneratingAi}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer"
            title="Berikan panduan atau instruksi khusus sebelum generate AI"
          >
            <Sliders className="h-3.5 w-3.5 text-blue-700" />
            <span>Panduan Khusus AI</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Printer className="h-3.5 w-3.5 text-slate-600" />
            <span>Pratinjau / Cetak</span>
          </button>

          <button
            onClick={() => handleSave('DRAFT')}
            disabled={isSaving || isGeneratingAi}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 text-slate-700" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Draf KAK'}</span>
          </button>

          <button
            onClick={() => handleSave('FINAL')}
            disabled={isSaving || isGeneratingAi}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all cursor-pointer border border-blue-700',
              isGeneratingAi
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Finalisasi KAK</span>
          </button>
        </div>
      </div>

      {/* LIVE AI GENERATING STATUS BANNER */}
      {isGeneratingAi && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-white to-sky-50 border border-blue-200 text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-lg shrink-0">
              <Sparkles className="h-5 w-5 animate-spin text-white" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900">AI Assistant sedang merumuskan draf KAK...</h4>
              <p className="text-3xs text-slate-600 mt-0.5 leading-relaxed">
                Menganalisis uraian masalah, menyintesis landasan yuridis, merumuskan 5 bab narasi KAK, dan menyimulasikan plafon anggaran.
              </p>
            </div>
          </div>
          <span className="text-3xs px-2.5 py-1 bg-blue-600 text-white rounded font-bold uppercase tracking-wider shrink-0 border border-blue-700 self-start sm:self-auto">
            Memproses Otomatis...
          </span>
        </div>
      )}

      {/* AI STATUS FEEDBACK */}
      {aiStatus && !isGeneratingAi && (
        <div
          className={cn(
            'p-3.5 rounded-lg text-xs font-medium flex items-center justify-between shadow-2xs border',
            aiStatus.type === 'success'
              ? 'bg-blue-50 text-blue-900 border-blue-200'
              : 'bg-slate-100 text-slate-900 border-black'
          )}
        >
          <div className="flex items-center gap-2">
            {aiStatus.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-blue-700 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-black shrink-0" />
            )}
            <span>{aiStatus.text}</span>
          </div>
          <button onClick={() => setAiStatus(null)} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* NOTIFICATION SAVE FEEDBACK */}
      {saveMessage && (
        <div
          className={cn(
            'p-3.5 rounded-lg text-xs font-medium flex items-center justify-between shadow-2xs border',
            saveMessage.type === 'success'
              ? 'bg-blue-50 text-blue-900 border-blue-200'
              : 'bg-slate-100 text-slate-900 border-black'
          )}
        >
          <div className="flex items-center gap-2">
            {saveMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-blue-700 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-black shrink-0" />
            )}
            <span>{saveMessage.text}</span>
          </div>
          {kakStatus === 'FINAL' && (
            <Link
              href={`/admin/research/${proposalId}`}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs border border-blue-700"
            >
              <span>Lanjut ke Tahap 4 (Pelaksanaan Riset)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
          <button onClick={() => setSaveMessage(null)} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* METADATA INFO CARD */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Instansi Pengusul</span>
            <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
              <Building2 className="h-3.5 w-3.5 text-slate-600 shrink-0" />
              <span>{proposal.opdName}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Bidang Riset Daerah</span>
            <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
              <Layers className="h-3.5 w-3.5 text-slate-600 shrink-0" />
              <span>{proposal.category}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Kebutuhan Output Usulan</span>
            <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
              <Award className="h-3.5 w-3.5 text-slate-600 shrink-0" />
              <span>{proposal.expectedOutput}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MAIN KAK EDITOR FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 5 Main KAK Chapters (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Chapter 1: Latar Belakang & Urgensi */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center font-black text-xs">
                  I
                </span>
                Latar Belakang & Urgensi Masalah Daerah
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">Bab 1 KAK</span>
            </div>
            <p className="text-xs text-slate-600">
              Uraikan konteks masalah, data dukung empiris di Kabupaten Mimika, serta alasan mengapa riset ini sangat mendesak.
            </p>
            <textarea
              rows={8}
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="Tuliskan latar belakang dan urgensi riset..."
              className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 leading-relaxed focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition"
            />
          </div>

          {/* Chapter 2: Maksud, Tujuan & Sasaran */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center font-black text-xs">
                  II
                </span>
                Maksud, Tujuan & Sasaran Riset
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">Bab 2 KAK</span>
            </div>
            <p className="text-xs text-slate-600">
              Rumuskan maksud umum kajian serta target-target capaian terukur yang diharapkan.
            </p>
            <textarea
              rows={7}
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Tuliskan maksud dan tujuan riset..."
              className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 leading-relaxed focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition"
            />
          </div>

          {/* Chapter 3: Ruang Lingkup & Metodologi */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center font-black text-xs">
                  III
                </span>
                Ruang Lingkup & Metodologi Riset
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">Bab 3 KAK</span>
            </div>
            <p className="text-xs text-slate-600">
              Tentukan batasan wilayah kajian, sasaran populasi/sampel, pendekatan penelitian (kuantitatif/kualitatif), teknik survei, dan FGD.
            </p>
            <textarea
              rows={7}
              value={scopeAndMethodology}
              onChange={(e) => setScopeAndMethodology(e.target.value)}
              placeholder="Tuliskan ruang lingkup dan metodologi riset..."
              className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 leading-relaxed focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition"
            />
          </div>

          {/* Chapter 4: Target Output & Luaran */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center font-black text-xs">
                  IV
                </span>
                Target Output & Luaran Kebijakan
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">Bab 4 KAK</span>
            </div>
            <p className="text-xs text-slate-600">
              Format luaran akhir riset (Laporan Akhir, Policy Brief, Naskah Akademik / Draf Perbup, dll).
            </p>
            <textarea
              rows={4}
              value={targetOutput}
              onChange={(e) => setTargetOutput(e.target.value)}
              placeholder="Tuliskan target luaran riset..."
              className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 leading-relaxed focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition"
            />
          </div>
        </div>

        {/* Right Column: Parameters (Plafon Pagu & Durasi dari Identifikasi Masalah) (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card Rujukan Anggaran & Durasi Usulan */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-5 sticky top-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-700" />
                Rujukan Anggaran & Durasi Riset
              </h3>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Pagu batas atas dan estimasi durasi riset ini telah ditetapkan saat <strong>Tahap 1 (Identifikasi Masalah)</strong>.
              </p>
            </div>

            <div className="space-y-3">
              {/* Plafon Anggaran Display */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-300 space-y-1">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                  Pagu Indikatif Riset
                </span>
                <p className="text-base font-bold font-mono text-blue-800">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(allocatedBudget)}
                </p>
                <p className="text-[10px] text-slate-500">
                  * Rincian akun belanja (RKA) disusun di Tahap 4 Pelaksanaan Riset.
                </p>
              </div>

              {/* Durasi Riset Display */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-300 space-y-1">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                  Estimasi Waktu Pelaksanaan
                </span>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-blue-700" />
                  <span>{durationMonths} Bulan Pelaksanaan</span>
                </p>
              </div>

              {/* Notice Box */}
              <div className="p-4 bg-blue-50/70 rounded-lg border border-blue-200 space-y-1.5 text-xs">
                <span className="font-bold text-blue-950 block flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-700" />
                  Alur Setelah KAK Final:
                </span>
                <p className="text-blue-900 text-[11px] leading-relaxed">
                  Setelah KAK difinalisasi, agenda riset ini otomatis masuk ke <strong>Tahap 4 (Pelaksanaan Riset)</strong>. Di sana Anda dapat menentukan skema pelaksana (Swakelola / PKS), menyusun RKA belanja, serta mendaftarkan tim peneliti.
                </p>
              </div>
            </div>

            {/* Finalize Button */}
            <div className="pt-2">
              <button
                onClick={() => handleSave('FINAL')}
                disabled={isSaving || isGeneratingAi}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-md border border-blue-700 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Finalisasi KAK & Lanjut ke Tahap 4'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI CUSTOM PROMPT MODAL */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-none flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-black animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-700" />
                Panduan Khusus untuk AI Assistant
              </h3>
              <button onClick={() => setIsAiModalOpen(false)} className="text-slate-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Tuliskan instruksi tambahan bila ingin AI menekankan metodologi tertentu, landasan regulasi daerah, atau lokus khusus di Mimika:
            </p>
            <textarea
              rows={4}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Contoh: Fokuskan pada survei kuantitatif di wilayah pesisir Mimika dan gunakan pendekatan analisis spasial GIS..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300"
              >
                Batal
              </button>
              <button
                onClick={() => handleGenerateAi(customPrompt)}
                disabled={isGeneratingAi}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 border border-blue-700"
              >
                <Sparkles className="h-3.5 w-3.5 text-sky-200" />
                <span>Mulai Generate AI</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT / PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-none flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-black animate-in fade-in duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-700" />
                Pratinjau Naskah Kerangka Acuan Kerja (KAK)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition flex items-center gap-1.5 shadow border border-blue-700"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak Dokumen</span>
                </button>
                <button onClick={() => setIsPrintModalOpen(false)} className="text-slate-400 hover:text-black p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-900 font-serif leading-relaxed">
              <div className="text-center border-b-2 border-black pb-4 space-y-1 font-sans">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Pemerintah Kabupaten Mimika</h2>
                <h3 className="text-base font-extrabold uppercase text-[#0f2c59]">Badan Riset dan Inovasi Daerah (BRIDA)</h3>
                <p className="text-[11px] text-slate-600">Kerangka Acuan Kerja (Terms of Reference) Riset Daerah Tahun Anggaran {new Date().getFullYear()}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold font-sans text-xs uppercase bg-blue-50 text-blue-950 p-2 rounded border border-blue-200">Judul Kegiatan Riset</h4>
                <p className="font-sans font-bold text-sm text-slate-900 pl-2">{proposal.title}</p>
                <p className="text-slate-700 pl-2">Instansi Pemrakarsa: {proposal.opdName}</p>
                <p className="text-slate-700 pl-2">Plafon Anggaran: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(allocatedBudget)} ({durationMonths} Bulan Pelaksanaan)</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold font-sans text-xs uppercase bg-slate-100 text-slate-900 p-2 rounded border border-slate-300">BAB I: Latar Belakang & Urgensi</h4>
                <p className="whitespace-pre-line pl-2 text-slate-800">{background || '-'}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold font-sans text-xs uppercase bg-slate-100 text-slate-900 p-2 rounded border border-slate-300">BAB II: Maksud, Tujuan & Sasaran</h4>
                <p className="whitespace-pre-line pl-2 text-slate-800">{objectives || '-'}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold font-sans text-xs uppercase bg-slate-100 text-slate-900 p-2 rounded border border-slate-300">BAB III: Ruang Lingkup & Metodologi</h4>
                <p className="whitespace-pre-line pl-2 text-slate-800">{scopeAndMethodology || '-'}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold font-sans text-xs uppercase bg-slate-100 text-slate-900 p-2 rounded border border-slate-300">BAB IV: Target Luaran Kebijakan</h4>
                <p className="whitespace-pre-line pl-2 text-slate-800">{targetOutput || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
