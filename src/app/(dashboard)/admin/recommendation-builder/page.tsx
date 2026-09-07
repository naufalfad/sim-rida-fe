'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  useOpdStore, 
  OpdProposal, 
  PolicyBriefDraft 
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
  Award
} from 'lucide-react';

export default function AdminRecommendationBuilderPage() {
  const { proposals, savePolicyBrief, sendToKepalaBrida } = useOpdStore();

  // Pick research proposals that are in progress or completed
  const eligibleProposals = proposals.filter(p => p.status === 'IN_PROGRESS' || p.status === 'COMPLETED' || !!p.studyData);

  const [selectedProposalId, setSelectedProposalId] = useState<string>(eligibleProposals[0]?.id || '');
  const selectedProposal = proposals.find(p => p.id === selectedProposalId) || eligibleProposals[0];

  // Editor states
  const [briefTitle, setBriefTitle] = useState('');
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [problemAnalysis, setProblemAnalysis] = useState('');
  const [policyOptions, setPolicyOptions] = useState('');
  const [actionRecommendations, setActionRecommendations] = useState('');
  const [officialDraftNumber, setOfficialDraftNumber] = useState('');
  const [draftLetterSubject, setDraftLetterSubject] = useState('');

  // Active Tab for Editor or Preview
  const [viewMode, setViewMode] = useState<'EDITOR' | 'PREVIEW'>('EDITOR');
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Sync editor fields when selected proposal changes
  useEffect(() => {
    if (!selectedProposal) return;
    const existing = selectedProposal.policyBriefDraft;

    if (existing) {
      setBriefTitle(existing.title || `Policy Brief: ${selectedProposal.title}`);
      setExecutiveSummary(existing.executiveSummary || '');
      setProblemAnalysis(existing.problemAnalysis || selectedProposal.problemStatement || '');
      setPolicyOptions(existing.policyOptions || '');
      setActionRecommendations(existing.actionRecommendations || '');
      setOfficialDraftNumber(existing.officialDraftNumber || `070/BRIDA-SLM/${new Date().getFullYear()}/042`);
      setDraftLetterSubject(existing.draftLetterSubject || `Penyampaian Hasil Kajian dan Rekomendasi Kebijakan: ${selectedProposal.title}`);
    } else {
      setBriefTitle(`Policy Brief: ${selectedProposal.title}`);
      setExecutiveSummary(`Ringkasan kajian ini memberikan rekomendasi strategis bagi ${selectedProposal.opdName} guna menyelesaikan persoalan ${selectedProposal.title.toLowerCase()} berbasis bukti (evidence-based policy).`);
      setProblemAnalysis(selectedProposal.problemStatement || '');
      setPolicyOptions(`1. Opsi A: Intervensi regulasi operasional tingkat OPD.\n2. Opsi B: Pemanfaatan platform teknologi terintegrasi dan kolaborasi lintas sektor.`);
      setActionRecommendations(`1. Pembentukan tim kerja percepatan dalam jangka waktu 30 hari kalender.\n2. Alokasi anggaran perubahan untuk implementasi pilot project.\n3. Monitoring berkala indikator kinerja triwulanan.`);
      setOfficialDraftNumber(`070/BRIDA-SLM/${new Date().getFullYear()}/042`);
      setDraftLetterSubject(`Penyampaian Hasil Kajian dan Rekomendasi Kebijakan: ${selectedProposal.title}`);
    }
  }, [selectedProposalId]);

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal) return;

    const draft: PolicyBriefDraft = {
      title: briefTitle,
      executiveSummary,
      problemAnalysis,
      policyOptions,
      actionRecommendations,
      officialDraftNumber,
      draftLetterSubject,
      tteStatus: selectedProposal.policyBriefDraft?.tteStatus || 'DRAFT'
    };

    savePolicyBrief(selectedProposal.id, draft);
    setIsSavedSuccess(true);
    setTimeout(() => setIsSavedSuccess(false), 3000);
  };

  const handleSendToKepala = () => {
    if (!selectedProposal) return;
    if (confirm('Kirimkan draf Policy Brief & Surat Rekomendasi ini ke Kepala BRIDA untuk ditelaah dan ditandatangani secara elektronik (TTE)?')) {
      // Auto save first
      savePolicyBrief(selectedProposal.id, {
        title: briefTitle,
        executiveSummary,
        problemAnalysis,
        policyOptions,
        actionRecommendations,
        officialDraftNumber,
        draftLetterSubject,
        tteStatus: 'PENDING_KEPALA_APPROVAL'
      });
      sendToKepalaBrida(selectedProposal.id);
      alert('Berhasil! Draf rekomendasi telah dikirimkan ke meja kerja Kepala BRIDA.');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-8 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold tracking-wide uppercase mb-2">
            <BookOpen className="w-5 h-5" />
            Modul 4: Admin BRIDA
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Penyusunan Rekomendasi Kebijakan</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Generator draf Policy Brief & Naskah Rekomendasi Resmi berbasis hasil kajian ilmiah. Draf akan diajukan ke Kepala BRIDA untuk pengesahan TTE dan disalurkan ke OPD pemohon.
          </p>
        </div>

        {selectedProposal && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'EDITOR' ? 'PREVIEW' : 'EDITOR')}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition text-xs"
            >
              <Eye className="w-4 h-4" />
              {viewMode === 'EDITOR' ? 'Lihat Lembar Dokumen' : 'Kembali ke Editor'}
            </button>
            <button
              onClick={handleSendToKepala}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition shadow-lg hover:shadow-emerald-500/20 text-xs"
            >
              <Send className="w-4 h-4" />
              Kirim ke Kepala BRIDA
            </button>
          </div>
        )}
      </div>

      {/* Select Proposal Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pilih Agenda Riset yang Disusunkan Rekomendasi:</label>
            <select
              value={selectedProposalId}
              onChange={(e) => setSelectedProposalId(e.target.value)}
              className="mt-1 font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {eligibleProposals.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.opdName} - {p.title.slice(0, 60)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedProposal && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Status Rekomendasi:</span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full ${
                selectedProposal.policyBriefDraft?.tteStatus === 'TERVERIFIKASI_TTE'
                  ? 'bg-emerald-100 text-emerald-800'
                  : selectedProposal.policyBriefDraft?.tteStatus === 'PENDING_KEPALA_APPROVAL'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {selectedProposal.policyBriefDraft?.tteStatus === 'TERVERIFIKASI_TTE' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Terverifikasi TTE Kepala BRIDA
                  </>
                ) : selectedProposal.policyBriefDraft?.tteStatus === 'PENDING_KEPALA_APPROVAL' ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Menunggu Persetujuan Kepala BRIDA
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    Draf Rekomendasi (Internal)
                  </>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {isSavedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Draf naskah Policy Brief berhasil disimpan dalam sistem!
          </div>
        </div>
      )}

      {/* Main Workspace: Editor or Preview */}
      {viewMode === 'EDITOR' ? (
        <form onSubmit={handleSaveDraft} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Official Administrative Meta (1 col) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 h-fit">
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b pb-3">
                <Stamp className="w-4 h-4 text-emerald-600" />
                Format Tata Naskah Dinas
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nomor Surat Dinas BRIDA:
                </label>
                <input
                  type="text"
                  value={officialDraftNumber}
                  onChange={(e) => setOfficialDraftNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Perihal Surat:
                </label>
                <textarea
                  rows={3}
                  value={draftLetterSubject}
                  onChange={(e) => setDraftLetterSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tujuan OPD Penerima:
                </label>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {selectedProposal?.opdName}
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 space-y-2">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Struktur Policy Brief
                </span>
                <p className="text-[11px] leading-relaxed text-emerald-900/80">
                  Naskah ini merangkum esensi riset menjadi arahan kebijakan ringkas (2-4 halaman) yang langsung dapat dieksekusi oleh kepala dinas/badan pemohon.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Simpan Draf Policy Brief
              </button>
            </div>

            {/* Right Column: 4 Key Policy Brief Sections (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Section 1: Title & Executive Summary */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                    Judul Naskah Policy Brief:
                  </label>
                  <input
                    type="text"
                    value={briefTitle}
                    onChange={(e) => setBriefTitle(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      1. Ringkasan Eksekutif (Executive Summary):
                    </label>
                    <span className="text-[11px] text-slate-400">Ikhtisar singkat masalah dan solusi utama</span>
                  </div>
                  <textarea
                    rows={4}
                    value={executiveSummary}
                    onChange={(e) => setExecutiveSummary(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Section 2: Problem Analysis */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    2. Telaah Masalah & Fakta Lapangan (Problem Analysis):
                  </label>
                  <span className="text-[11px] text-slate-400">Temuan empiris dari kajian litbang</span>
                </div>
                <textarea
                  rows={4}
                  value={problemAnalysis}
                  onChange={(e) => setProblemAnalysis(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Section 3: Policy Options */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    3. Alternatif & Opsi Intervensi Kebijakan (Policy Options):
                  </label>
                  <span className="text-[11px] text-slate-400">Perbandingan opsi regulasi / program</span>
                </div>
                <textarea
                  rows={4}
                  value={policyOptions}
                  onChange={(e) => setPolicyOptions(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-mono"
                />
              </div>

              {/* Section 4: Action Recommendations */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    4. Rekomendasi Aksi Nyata & Rencana Tindak Lanjut:
                  </label>
                  <span className="text-[11px] text-emerald-600 font-bold">Harus terukur dan dapat dieksekusi OPD</span>
                </div>
                <textarea
                  rows={4}
                  value={actionRecommendations}
                  onChange={(e) => setActionRecommendations(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* PREVIEW MODE: Formatted Document Sheet */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 sm:p-12 max-w-4xl mx-auto space-y-8 font-sans">
          {/* Official Letterhead */}
          <div className="border-b-4 border-double border-slate-900 pb-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Award className="w-10 h-10 text-emerald-800" />
              <div>
                <h2 className="text-lg font-black tracking-wide uppercase text-slate-900">
                  Pemerintah Daerah Kabupaten Sleman
                </h2>
                <h3 className="text-sm font-extrabold tracking-wider uppercase text-emerald-900">
                  Badan Riset dan Inovasi Daerah (BRIDA)
                </h3>
              </div>
            </div>
            <p className="text-[11px] text-slate-600">
              Jl. Parasamya No. 1, Beran, Tridadi, Kec. Sleman, Kabupaten Sleman, D.I. Yogyakarta 55511
            </p>
          </div>

          {/* Letter Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p><span className="font-bold">Nomor :</span> {officialDraftNumber}</p>
              <p><span className="font-bold">Sifat :</span> Penting / Rekomendasi Kebijakan</p>
              <p><span className="font-bold">Perihal :</span> {draftLetterSubject}</p>
            </div>
            <div className="text-right">
              <p>Sleman, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="mt-2 font-bold">Kepada Yth:</p>
              <p className="text-slate-800 font-bold">{selectedProposal?.opdName}</p>
              <p className="text-slate-500">di Tempat</p>
            </div>
          </div>

          {/* Policy Brief Document Body */}
          <div className="space-y-6 pt-4 text-slate-800 text-xs leading-relaxed">
            <div className="text-center py-2 bg-slate-50 border-y border-slate-200">
              <h4 className="font-black text-sm text-slate-900 uppercase">{briefTitle}</h4>
              <p className="text-[11px] text-slate-500">Naskah Rekomendasi Hasil Kajian Kelitbangan BRIDA</p>
            </div>

            <div>
              <h5 className="font-black text-xs uppercase text-slate-900 mb-1">A. Ringkasan Eksekutif</h5>
              <p className="whitespace-pre-line text-slate-700 text-justify">{executiveSummary}</p>
            </div>

            <div>
              <h5 className="font-black text-xs uppercase text-slate-900 mb-1">B. Analisis Masalah & Kondisi Eksisting</h5>
              <p className="whitespace-pre-line text-slate-700 text-justify">{problemAnalysis}</p>
            </div>

            <div>
              <h5 className="font-black text-xs uppercase text-slate-900 mb-1">C. Pilihan Intervensi Kebijakan</h5>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] whitespace-pre-line">
                {policyOptions}
              </div>
            </div>

            <div>
              <h5 className="font-black text-xs uppercase text-slate-900 mb-1">D. Rekomendasi Aksi Nyata Untuk OPD Pemohon</h5>
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 font-mono text-[11px] whitespace-pre-line text-emerald-950">
                {actionRecommendations}
              </div>
            </div>
          </div>

          {/* TTE Signature Section */}
          <div className="pt-8 border-t border-slate-200 flex justify-end">
            <div className="text-center w-64 space-y-2">
              <p className="text-xs font-bold text-slate-800">Kepala Badan Riset dan Inovasi Daerah (BRIDA)</p>
              
              <div className="h-24 border border-dashed border-emerald-300 bg-emerald-50/40 rounded-xl flex flex-col items-center justify-center p-2 text-center">
                {selectedProposal?.policyBriefDraft?.tteStatus === 'TERVERIFIKASI_TTE' ? (
                  <div className="text-emerald-700">
                    <ShieldCheck className="w-8 h-8 mx-auto" />
                    <span className="text-[10px] font-black uppercase block mt-1">Ditandatangani Secara Elektronik (TTE)</span>
                    <span className="text-[9px] text-slate-500 font-mono">BSrE - BSSN Validated</span>
                  </div>
                ) : (
                  <div className="text-slate-400">
                    <Stamp className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                    <span className="text-[10px] font-bold block">[ Menunggu Tanda Tangan TTE ]</span>
                    <span className="text-[9px] text-slate-400">Oleh Kepala BRIDA</span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-black text-slate-900 underline">Dr. H. Bambang Suherman, M.Si.</p>
                <p className="text-[10px] text-slate-500 font-mono">NIP. 19740512 199903 1 002</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
