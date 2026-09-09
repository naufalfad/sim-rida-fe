'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  useOpdStore, 
  PolicyRecommendationItem,
  ResearchStudyItem
} from '@/store/useOpdStore';
import { 
  FileCheck, 
  Send, 
  Sparkles, 
  FileText, 
  Building2, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Eye, 
  Printer, 
  Save, 
  Stamp, 
  BookOpen, 
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Award,
  Layers,
  Target,
  RefreshCw
} from 'lucide-react';

const TARGET_POLICY_TYPES = [
  { value: 'DRAFT_PERBUP', label: 'Draf Peraturan Bupati (Perbup)' },
  { value: 'DRAFT_PERDA', label: 'Draf Peraturan Daerah (Perda)' },
  { value: 'SE_BUPATI', label: 'Surat Edaran (SE) Bupati' },
  { value: 'SOP_LAYANAN', label: 'Standar Operasional Prosedur (SOP) Layanan' },
  { value: 'RENCANA_AKSI_DAERAH', label: 'Rencana Aksi Daerah (RAD)' },
  { value: 'PETUNJUK_TEKNIS', label: 'Petunjuk Teknis / Pedoman Pelaksanaan' },
];

const IMPACT_LEVELS = [
  { value: 'STRATEGIS_DAERAH', label: 'Strategis Daerah (Bupati & Sekda)', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  { value: 'SEKTORAL', label: 'Sektoral (Lintas Perangkat Daerah)', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'OPERASIONAL', label: 'Operasional (Internal OPD Pemohon)', color: 'bg-blue-100 text-blue-800 border-blue-200' },
];

export default function AdminRecommendationBuilderPage() {
  const { 
    recommendations,
    availableStudiesForRec,
    fetchRecommendations,
    fetchAvailableStudiesForRec,
    createRecommendation,
    updateRecommendation,
    submitRecommendationToKepala,
    isLoadingRecommendations
  } = useOpdStore();

  const [selectedStudyId, setSelectedStudyId] = useState<string>('');
  const [activeRecId, setActiveRecId] = useState<string | null>(null);

  // Form states
  const [recTitle, setRecTitle] = useState('');
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [keyFindings, setKeyFindings] = useState('');
  const [policyActions, setPolicyActions] = useState('');
  const [targetPolicyType, setTargetPolicyType] = useState<string>('DRAFT_PERBUP');
  const [impactLevel, setImpactLevel] = useState<string>('STRATEGIS_DAERAH');
  const [targetOpdNames, setTargetOpdNames] = useState('');
  const [officialDraftNumber, setOfficialDraftNumber] = useState('');
  const [draftLetterSubject, setDraftLetterSubject] = useState('');

  // UI states
  const [viewMode, setViewMode] = useState<'EDITOR' | 'PREVIEW'>('EDITOR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initial fetch on mount
  useEffect(() => {
    fetchAvailableStudiesForRec();
    fetchRecommendations();
  }, []);

  // Set default selected study when studies are loaded
  useEffect(() => {
    if (availableStudiesForRec.length > 0 && !selectedStudyId) {
      setSelectedStudyId(availableStudiesForRec[0].id);
    }
  }, [availableStudiesForRec]);

  // Sync editor fields when selected study changes
  useEffect(() => {
    if (!selectedStudyId) return;

    // Find if an existing recommendation matches this study
    const existingRec = recommendations.find(r => r.studyId === selectedStudyId);
    const study = availableStudiesForRec.find(s => s.id === selectedStudyId);

    if (existingRec) {
      setActiveRecId(existingRec.id);
      setRecTitle(existingRec.title);
      setExecutiveSummary(existingRec.executiveSummary || '');
      setKeyFindings(existingRec.keyFindings || '');
      setPolicyActions(existingRec.policyActions || '');
      setTargetPolicyType(existingRec.targetPolicyType || 'DRAFT_PERBUP');
      setImpactLevel(existingRec.impactLevel || 'STRATEGIS_DAERAH');
      setTargetOpdNames(existingRec.targetOpdNames || (existingRec.study?.proposal?.opd?.name || ''));
      setOfficialDraftNumber(existingRec.code || `070/BRIDA-MMK/${new Date().getFullYear()}/042`);
      setDraftLetterSubject(`Penyampaian Naskah Rekomendasi Kebijakan: ${existingRec.title}`);
    } else if (study) {
      setActiveRecId(null);
      const studyTitle = study.title;
      const opdName = study.proposal?.opd?.name || 'Instansi Terkait';
      const problem = study.proposal?.problemStatement || '';

      setRecTitle(`Policy Brief: ${studyTitle}`);
      setExecutiveSummary(`Ringkasan eksekutif ini merumuskan rekomendasi kebijakan strategis bagi ${opdName} guna menyelesaikan persoalan ${studyTitle.toLowerCase()} berbasis bukti empiris dan riset terpadu.`);
      setKeyFindings(problem ? `1. Temuan Lapangan: ${problem}\n2. Analisis Data: Terdapat disparitas capaian indikator kinerja pada tingkat operasional.` : '1. Kondisi eksisting menunjukkan perlunya simplifikasi alur layanan dan standardisasi proses kerja.\n2. Hambatan koordinasi antar unit kerja memerlukan payung regulasi formal.');
      setPolicyActions(`1. Penerbitan regulasi operasional dalam bentuk Peraturan Bupati dalam kurun waktu 60 hari kerja.\n2. Pembentukan Gugus Tugas Kolaborasi lintas pemangku kepentingan.\n3. Alokasi dukungan anggaran pada APBD Perubahan untuk pilot implementasi.`);
      setTargetPolicyType('DRAFT_PERBUP');
      setImpactLevel('STRATEGIS_DAERAH');
      setTargetOpdNames(opdName);
      setOfficialDraftNumber(`070/BRIDA-MMK/${new Date().getFullYear()}/042`);
      setDraftLetterSubject(`Penyampaian Naskah Rekomendasi Kebijakan: ${studyTitle}`);
    }
  }, [selectedStudyId, recommendations, availableStudiesForRec]);

  const currentStudy = availableStudiesForRec.find(s => s.id === selectedStudyId);
  const currentRec = recommendations.find(r => (activeRecId ? r.id === activeRecId : r.studyId === selectedStudyId));
  const isFinalized = currentRec?.status === 'FINALIZED';

  const handleCreateNewDraftForStudy = () => {
    if (!currentStudy) return;
    setActiveRecId(null);
    const studyTitle = currentStudy.title;
    const opdName = currentStudy.proposal?.opd?.name || 'Instansi Terkait';
    const problem = currentStudy.proposal?.problemStatement || '';

    setRecTitle(`Policy Brief (Revisi): ${studyTitle}`);
    setExecutiveSummary(`Ringkasan eksekutif ini merumuskan rekomendasi kebijakan strategis bagi ${opdName} guna menyelesaikan persoalan ${studyTitle.toLowerCase()} berbasis bukti empiris dan riset terpadu.`);
    setKeyFindings(problem ? `1. Temuan Lapangan: ${problem}\n2. Analisis Data: Terdapat disparitas capaian indikator kinerja pada tingkat operasional.` : '1. Kondisi eksisting menunjukkan perlunya simplifikasi alur layanan dan standardisasi proses kerja.\n2. Hambatan koordinasi antar unit kerja memerlukan payung regulasi formal.');
    setPolicyActions(`1. Penerbitan regulasi operasional dalam bentuk Peraturan Bupati dalam kurun waktu 60 hari kerja.\n2. Pembentukan Gugus Tugas Kolaborasi lintas pemangku kepentingan.\n3. Alokasi dukungan anggaran pada APBD Perubahan untuk pilot implementasi.`);
    setTargetPolicyType('DRAFT_PERBUP');
    setImpactLevel('STRATEGIS_DAERAH');
    setTargetOpdNames(opdName);
    setOfficialDraftNumber(`070/BRIDA-MMK/${new Date().getFullYear()}/042`);
    setDraftLetterSubject(`Penyampaian Naskah Rekomendasi Kebijakan: ${studyTitle}`);
    setFeedbackMessage({ type: 'success', text: 'Formulir disiapkan untuk menyusun draf rekomendasi baru.' });
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFinalized) {
      setFeedbackMessage({ type: 'error', text: 'Naskah yang telah disahkan (FINALIZED) tidak dapat diedit kembali. Silakan buat draf baru.' });
      return;
    }

    if (!selectedStudyId) {
      setFeedbackMessage({ type: 'error', text: 'Pilih agenda kajian terlebih dahulu.' });
      return;
    }

    if (recTitle.length < 10) {
      setFeedbackMessage({ type: 'error', text: 'Judul rekomendasi minimal 10 karakter.' });
      return;
    }

    if (executiveSummary.length < 20 || keyFindings.length < 20 || policyActions.length < 20) {
      setFeedbackMessage({ type: 'error', text: 'Semua butir telaah naskah (Ringkasan, Temuan, Rekomendasi Aksi) minimal 20 karakter.' });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      if (activeRecId) {
        // Update existing draft
        await updateRecommendation(activeRecId, {
          title: recTitle,
          executiveSummary,
          keyFindings,
          policyActions,
          targetPolicyType: targetPolicyType as any,
          impactLevel: impactLevel as any,
          targetOpdNames,
        });
        setFeedbackMessage({ type: 'success', text: 'Draf rekomendasi kebijakan berhasil diperbarui!' });
      } else {
        // Create new draft
        const created = await createRecommendation({
          studyId: selectedStudyId,
          title: recTitle,
          executiveSummary,
          keyFindings,
          policyActions,
          targetPolicyType: targetPolicyType as any,
          impactLevel: impactLevel as any,
          targetOpdNames,
          status: 'DRAFT',
        });
        setActiveRecId(created.id);
        setFeedbackMessage({ type: 'success', text: 'Draf rekomendasi kebijakan baru berhasil disimpan ke database!' });
      }
      fetchRecommendations();
      fetchAvailableStudiesForRec();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Gagal menyimpan draf rekomendasi.' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  const handleSendToKepala = async () => {
    if (isFinalized) {
      alert('Naskah ini sudah disahkan secara final oleh Kepala BRIDA.');
      return;
    }

    if (!activeRecId && !selectedStudyId) {
      alert('Simpan draf rekomendasi terlebih dahulu sebelum diajukan ke Kepala BRIDA.');
      return;
    }

    if (confirm('Kirimkan draf Policy Brief & Naskah Rekomendasi ini ke Kepala BRIDA untuk ditelaah dan disahkan dengan Tanda Tangan Elektronik (TTE)?')) {
      setIsSubmitting(true);
      setFeedbackMessage(null);

      try {
        let recIdToSubmit = activeRecId;

        // If not saved yet, save first
        if (!recIdToSubmit) {
          const created = await createRecommendation({
            studyId: selectedStudyId,
            title: recTitle,
            executiveSummary,
            keyFindings,
            policyActions,
            targetPolicyType: targetPolicyType as any,
            impactLevel: impactLevel as any,
            targetOpdNames,
            status: 'DRAFT',
          });
          recIdToSubmit = created.id;
          setActiveRecId(created.id);
        } else {
          // Auto update latest form
          await updateRecommendation(recIdToSubmit, {
            title: recTitle,
            executiveSummary,
            keyFindings,
            policyActions,
            targetPolicyType: targetPolicyType as any,
            impactLevel: impactLevel as any,
            targetOpdNames,
          });
        }

        await submitRecommendationToKepala(recIdToSubmit);
        setFeedbackMessage({ type: 'success', text: 'Berhasil! Naskah rekomendasi telah diajukan ke meja kerja Kepala BRIDA untuk pengesahan TTE.' });
        fetchRecommendations();
      } catch (err: any) {
        setFeedbackMessage({ type: 'error', text: err.message || 'Gagal mengajukan rekomendasi ke Kepala BRIDA.' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getStatusBadge = () => {
    const status = currentRec?.status;
    if (status === 'FINALIZED') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Telah Disahkan TTE Kepala BRIDA
        </span>
      );
    }
    if (status === 'SUBMITTED') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shadow-sm">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Menunggu Verifikasi & TTE Kepala BRIDA
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 shadow-sm">
        <FileText className="w-3.5 h-3.5 text-slate-500" />
        Draf Rekomendasi (Internal Litbang)
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 p-8 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-black tracking-widest uppercase mb-2">
            <BookOpen className="w-4 h-4" />
            Modul 4: Admin BRIDA
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Penyusunan Rekomendasi Kebijakan (Policy Brief)</h1>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
            Generator naskah Policy Brief & Surat Rekomendasi Resmi berbasis hasil kajian ilmiah. Naskah diajukan ke Kepala BRIDA untuk pembubuhan Tanda Tangan Elektronik (TTE BSrE) sebelum disalurkan ke OPD pemohon.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'EDITOR' ? 'PREVIEW' : 'EDITOR')}
            className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition text-xs shadow"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            {viewMode === 'EDITOR' ? 'Pratinjau Lembar Naskah' : 'Kembali ke Form Editor'}
          </button>
          
          {!isFinalized && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSendToKepala}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl transition shadow-lg hover:shadow-emerald-500/20 text-xs disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {currentRec?.status === 'SUBMITTED' ? 'Ajukan Ulang ke Kepala' : 'Kirim ke Kepala BRIDA'}
            </button>
          )}

          {isFinalized && (
            <button
              type="button"
              onClick={handleCreateNewDraftForStudy}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2.5 rounded-xl transition shadow text-xs"
            >
              <Sparkles className="w-4 h-4" />
              Buat Draf Rekomendasi Baru
            </button>
          )}
        </div>
      </div>

      {/* Select Study Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="w-full">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Pilih Agenda Kajian Riset Sumber:
            </label>
            <select
              value={selectedStudyId}
              onChange={(e) => setSelectedStudyId(e.target.value)}
              className="mt-1 font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs w-full md:w-[480px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {availableStudiesForRec.length === 0 ? (
                <option value="">(Belum ada agenda kajian riset yang aktif)</option>
              ) : (
                availableStudiesForRec.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.fiscalYear}] {s.proposal?.opd?.name || 'OPD'} - {s.title.slice(0, 60)}...
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-left md:text-right">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Status Naskah:</span>
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {/* Finalized Notice Banner */}
      {isFinalized && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start gap-3 text-emerald-950 text-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-extrabold text-emerald-900">
              Naskah Rekomendasi Telah Disahkan Secara Resmi (Status: FINALIZED)
            </p>
            <p className="text-emerald-800 leading-relaxed text-[11px]">
              Naskah ini telah dibubuhi Tanda Tangan Elektronik (TTE BSrE) oleh Kepala BRIDA Kab. Mimika. Isi naskah terkunci untuk menjaga integritas dokumen hukum dinas. Anda dapat melihat dan mencetak dokumen pada tab <strong>Pratinjau Lembar Naskah</strong>, atau klik tombol <strong>Buat Draf Rekomendasi Baru</strong> untuk menyusun naskah telaah baru.
            </p>
          </div>
        </div>
      )}

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-bold border transition ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Main Workspace: Editor or Preview */}
      {viewMode === 'EDITOR' ? (
        <form onSubmit={handleSaveDraft} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Official Administrative Meta (1 col) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 h-fit">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b pb-3">
                <Stamp className="w-4 h-4 text-emerald-600" />
                Metadata Tata Naskah Dinas
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Target Bentuk Kebijakan:
                </label>
                <select
                  value={targetPolicyType}
                  disabled={isFinalized}
                  onChange={(e) => setTargetPolicyType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  {TARGET_POLICY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tingkat Dampak Kebijakan:
                </label>
                <select
                  value={impactLevel}
                  disabled={isFinalized}
                  onChange={(e) => setImpactLevel(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  {IMPACT_LEVELS.map((imp) => (
                    <option key={imp.value} value={imp.value}>{imp.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nomor Naskah BRIDA:
                </label>
                <input
                  type="text"
                  value={officialDraftNumber}
                  disabled={isFinalized}
                  onChange={(e) => setOfficialDraftNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Perangkat Daerah Sasaran:
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={targetOpdNames}
                    disabled={isFinalized}
                    onChange={(e) => setTargetOpdNames(e.target.value)}
                    placeholder="Nama OPD penerima rekomendasi..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-900 space-y-2">
                <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Sistematika Policy Brief
                </span>
                <p className="text-[11px] leading-relaxed text-emerald-950/80">
                  Naskah ringkas (evidence-based) berisi intisari hasil kajian yang langsung dapat dijadikan dasar regulasi maupun aksi taktis OPD pemohon.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isFinalized}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSubmitting
                  ? 'Menyimpan ke Server...'
                  : isFinalized
                  ? 'Naskah Telah Disahkan (Terkunci)'
                  : activeRecId
                  ? 'Perbarui Draf Rekomendasi'
                  : 'Simpan Draf Rekomendasi'}
              </button>
            </div>

            {/* Right Column: 3 Key Policy Brief Content Sections (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Section 1: Title & Executive Summary */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                    Judul Naskah Rekomendasi Kebijakan:
                  </label>
                  <input
                    type="text"
                    value={recTitle}
                    disabled={isFinalized}
                    onChange={(e) => setRecTitle(e.target.value)}
                    placeholder="Contoh: Policy Brief: Formula Intervensi Pangan Lokal untuk Eliminasi Stunting..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      1. Ringkasan Eksekutif (Executive Summary):
                    </label>
                    <span className="text-[11px] text-slate-400">Minimal 20 karakter</span>
                  </div>
                  <textarea
                    rows={4}
                    value={executiveSummary}
                    disabled={isFinalized}
                    onChange={(e) => setExecutiveSummary(e.target.value)}
                    placeholder="Rangkuman latar belakang, urgensi, dan arah kebijakan yang direkomendasikan..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Section 2: Key Findings / Problem Analysis */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    2. Temuan Utama Riset & Fakta Lapangan (Key Findings):
                  </label>
                  <span className="text-[11px] text-slate-400">Bukti empiris dan telaah data riset</span>
                </div>
                <textarea
                  rows={4}
                  value={keyFindings}
                  disabled={isFinalized}
                  onChange={(e) => setKeyFindings(e.target.value)}
                  placeholder="Butir-butir temuan data, permasalahan struktural, dan hasil analisis litbang..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-mono disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>

              {/* Section 3: Policy Actions / Recommendations */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    3. Butir-butir Rekomendasi Kebijakan & Rencana Aksi (Policy Actions):
                  </label>
                  <span className="text-[11px] text-emerald-600 font-bold">Harus terukur dan dapat dieksekusi OPD</span>
                </div>
                <textarea
                  rows={5}
                  value={policyActions}
                  disabled={isFinalized}
                  onChange={(e) => setPolicyActions(e.target.value)}
                  placeholder="1. Penerbitan payung regulasi...\n2. Alokasi anggaran belanja modal...\n3. Pembentukan tim kerja percepatan..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-mono disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* PREVIEW MODE: Formatted Official Document Sheet */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 sm:p-12 max-w-4xl mx-auto space-y-8 font-sans">
          {/* Official Letterhead */}
          <div className="border-b-4 border-double border-slate-900 pb-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Award className="w-10 h-10 text-emerald-800" />
              <div>
                <h2 className="text-lg font-black tracking-wide uppercase text-slate-900">
                  Pemerintah Daerah Kabupaten Mimika
                </h2>
                <h3 className="text-sm font-extrabold tracking-wider uppercase text-emerald-900">
                  Badan Riset dan Inovasi Daerah (BRIDA)
                </h3>
              </div>
            </div>
            <p className="text-[11px] text-slate-600">
              Jl. Cenderawasih, SP 3, Distrik Kuala Kencana, Kabupaten Mimika, Papua Tengah
            </p>
          </div>

          {/* Letter Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p><span className="font-bold">Nomor :</span> {officialDraftNumber || '070/BRIDA-MMK/2026/042'}</p>
              <p><span className="font-bold">Sifat :</span> Penting / Naskah Rekomendasi Kebijakan</p>
              <p><span className="font-bold">Perihal :</span> {draftLetterSubject || recTitle}</p>
            </div>
            <div className="text-right">
              <p>Mimika, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="mt-2 font-bold">Kepada Yth:</p>
              <p className="text-slate-800 font-bold">{targetOpdNames || currentStudy?.proposal?.opd?.name || 'Kepala Perangkat Daerah Terkait'}</p>
              <p className="text-slate-500">di Tempat</p>
            </div>
          </div>

          {/* Meta Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">
              Bentuk: {TARGET_POLICY_TYPES.find(t => t.value === targetPolicyType)?.label || targetPolicyType}
            </span>
            <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Dampak: {IMPACT_LEVELS.find(i => i.value === impactLevel)?.label || impactLevel}
            </span>
          </div>

          {/* Policy Brief Document Body */}
          <div className="space-y-6 pt-2 text-slate-800 text-xs leading-relaxed">
            <div className="text-center py-3 bg-slate-50 border-y border-slate-200 rounded-lg">
              <h4 className="font-black text-sm text-slate-900 uppercase">{recTitle || 'Naskah Rekomendasi Kebijakan'}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Naskah Rekomendasi Hasil Riset dan Inovasi Daerah (SIM-RIDA)</p>
            </div>

            <div>
              <h5 className="font-black text-xs uppercase text-slate-900 mb-1">A. Ringkasan Eksekutif (Executive Summary)</h5>
              <p className="whitespace-pre-line text-slate-700 text-justify">{executiveSummary || '(Belum ada ringkasan eksekutif)'}</p>
            </div>

            <div>
              <h5 className="font-black text-xs uppercase text-slate-900 mb-1">B. Temuan Utama Riset & Telaah Masalah</h5>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] whitespace-pre-line text-slate-800">
                {keyFindings || '(Belum ada uraian temuan riset)'}
              </div>
            </div>

            <div>
              <h5 className="font-black text-xs uppercase text-slate-900 mb-1">C. Butir-Butir Rekomendasi Kebijakan & Rencana Tindak Lanjut</h5>
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 font-mono text-[11px] whitespace-pre-line text-emerald-950 font-bold">
                {policyActions || '(Belum ada butir rekomendasi kebijakan)'}
              </div>
            </div>
          </div>

          {/* TTE Signature Section */}
          <div className="pt-8 border-t border-slate-200 flex justify-end">
            <div className="text-center w-64 space-y-2">
              <p className="text-xs font-bold text-slate-800">Kepala Badan Riset dan Inovasi Daerah (BRIDA)</p>
              
              <div className="h-28 border border-dashed border-emerald-300 bg-emerald-50/40 rounded-xl flex flex-col items-center justify-center p-2 text-center">
                {currentRec?.status === 'FINALIZED' ? (
                  <div className="text-emerald-700">
                    <ShieldCheck className="w-8 h-8 mx-auto text-emerald-600" />
                    <span className="text-[10px] font-black uppercase block mt-1">Ditandatangani Secara Elektronik (TTE)</span>
                    <span className="text-[9px] text-slate-500 font-mono">BSrE - BSSN Validated</span>
                    <span className="text-[8px] text-emerald-900 font-mono block mt-0.5 font-bold">
                      {currentRec.digitalSignatureLogs?.[0]?.certificateNumber || 'DS-2026-0001'}
                    </span>
                  </div>
                ) : (
                  <div className="text-slate-400">
                    <Stamp className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                    <span className="text-[10px] font-bold block">
                      {currentRec?.status === 'SUBMITTED' ? '[ Menunggu TTE Kepala BRIDA ]' : '[ Draf Internal Litbang ]'}
                    </span>
                    <span className="text-[9px] text-slate-400">Sertifikasi BSrE Mimika</span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-black text-slate-900 underline">Dr. Petrus Renyaan, M.Si.</p>
                <p className="text-[10px] text-slate-500 font-mono">NIP. 19730412 199803 1 001</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

