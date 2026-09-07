'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  useOpdStore, 
  OpdProposal 
} from '@/store/useOpdStore';
import { 
  FileCheck, 
  ShieldCheck, 
  Key, 
  Stamp, 
  CheckCircle2, 
  Clock, 
  Award, 
  Building2, 
  FileText, 
  ArrowRight, 
  Eye, 
  Search, 
  Users, 
  Lock,
  Sparkles,
  Printer,
  QrCode
} from 'lucide-react';

export default function ExecutiveLegalizationPage() {
  const { proposals, signRecommendationTTE } = useOpdStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'PENDING_TTE' | 'SIGNED'>('PENDING_TTE');
  const [selectedProposal, setSelectedProposal] = useState<OpdProposal | null>(null);

  // TTE Signing Modal State
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [signType, setSignType] = useState<'SINGLE' | 'MULTI_SEKDA'>('SINGLE');
  const [isSigningLoading, setIsSigningLoading] = useState(false);
  const [signSuccessInfo, setSignSuccessInfo] = useState<{ hash: string } | null>(null);

  // Eligible proposals for recommendation legalization
  const recommendationProposals = proposals.filter(p => !!p.policyBriefDraft || p.status === 'COMPLETED' || (p.status === 'IN_PROGRESS' && (p.studyData?.percentProgress || 0) >= 70));

  const filteredProposals = recommendationProposals.filter((p) => {
    const isSigned = p.policyBriefDraft?.tteStatus === 'TERVERIFIKASI_TTE' || p.status === 'COMPLETED';
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.opdName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterTab === 'PENDING_TTE') return !isSigned && matchesSearch;
    if (filterTab === 'SIGNED') return isSigned && matchesSearch;
    return matchesSearch;
  });

  const handleOpenSignModal = (prop: OpdProposal) => {
    setSelectedProposal(prop);
    setPassphrase('slemapass2026');
    setSignType('SINGLE');
    setSignSuccessInfo(null);
    setIsSignModalOpen(true);
  };

  const handleExecuteTTE = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal || !passphrase) return;

    setIsSigningLoading(true);

    setTimeout(() => {
      signRecommendationTTE(selectedProposal.id, passphrase, signType);
      setIsSigningLoading(false);
      setSignSuccessInfo({
        hash: `BSRE-SHA256-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`
      });

      // Refresh
      const updated = proposals.find(p => p.id === selectedProposal.id);
      if (updated) setSelectedProposal(updated);
    }, 1200);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 p-8 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-black tracking-widest uppercase mb-2">
            <ShieldCheck className="w-4 h-4" />
            Modul 4: Kepala BRIDA
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Pengesahan & Legalisasi TTE Rekomendasi
          </h1>
          <p className="text-slate-300 text-xs mt-1.5 max-w-2xl leading-relaxed">
            Pusat legalisasi naskah kebijakan dan surat rekomendasi resmi. Bubuhkan Tanda Tangan Elektronik (TTE) tersertifikasi BSrE BSSN agar rekomendasi sah disalurkan ke OPD pemohon.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/executive/impact-tracking"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition shadow text-xs"
          >
            <span>Analisis Dampak & RPJMD</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterTab('PENDING_TTE')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              filterTab === 'PENDING_TTE' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Menunggu Pengesahan TTE ({recommendationProposals.filter(p => p.policyBriefDraft?.tteStatus !== 'TERVERIFIKASI_TTE' && p.status !== 'COMPLETED').length})
          </button>
          <button
            onClick={() => setFilterTab('SIGNED')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              filterTab === 'SIGNED' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Telah Disahkan ({recommendationProposals.filter(p => p.policyBriefDraft?.tteStatus === 'TERVERIFIKASI_TTE' || p.status === 'COMPLETED').length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari naskah rekomendasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Main Layout: Left list (5 cols), Right document viewer & action (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: List of Policy Briefs */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Daftar Draf Rekomendasi ({filteredProposals.length})
          </h2>

          {filteredProposals.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 shadow-sm">
              <FileCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-bold text-slate-700 text-sm">Tidak ada dokumen di daftar ini</p>
            </div>
          ) : (
            filteredProposals.map((prop) => {
              const isSelected = selectedProposal?.id === prop.id;
              const isSigned = prop.policyBriefDraft?.tteStatus === 'TERVERIFIKASI_TTE' || prop.status === 'COMPLETED';

              return (
                <div
                  key={prop.id}
                  onClick={() => setSelectedProposal(prop)}
                  className={`cursor-pointer bg-white p-5 rounded-2xl border transition shadow-sm hover:shadow-md ${
                    isSelected ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {prop.code}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                      isSigned ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isSigned ? <ShieldCheck className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                      {isSigned ? 'TTE Sah' : 'Menunggu TTE'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm line-clamp-2">
                    {prop.policyBriefDraft?.title || `Policy Brief: ${prop.title}`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 mb-3">{prop.opdName}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">
                      No: {prop.policyBriefDraft?.officialDraftNumber || '070/BRIDA/2026'}
                    </span>
                    <span className="text-emerald-700 font-bold">
                      Lihat Lembar Dokumen →
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Interactive Document Viewer & TTE Signing */}
        <div className="lg:col-span-7">
          {selectedProposal ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 sticky top-6">
              {/* Header inside card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded">
                    {selectedProposal.policyBriefDraft?.officialDraftNumber || '070/BRIDA-SLM/2026/042'}
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1">
                    {selectedProposal.policyBriefDraft?.title || `Policy Brief: ${selectedProposal.title}`}
                  </h3>
                </div>

                <div className="shrink-0">
                  {selectedProposal.policyBriefDraft?.tteStatus === 'TERVERIFIKASI_TTE' || selectedProposal.status === 'COMPLETED' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Dokumen Sah Terverifikasi TTE
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenSignModal(selectedProposal)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-lg flex items-center gap-2"
                    >
                      <Stamp className="w-4 h-4" />
                      Sahkan & Bubuhkan TTE BSrE
                    </button>
                  )}
                </div>
              </div>

              {/* Policy Brief Document Content Preview */}
              <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 text-xs leading-relaxed space-y-5">
                <div className="text-center border-b border-slate-200 pb-3">
                  <h4 className="font-black text-slate-900 uppercase">
                    Pemerintah Kabupaten Sleman • BRIDA
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Tujuan Penerima: <span className="font-bold text-slate-700">{selectedProposal.opdName}</span>
                  </p>
                </div>

                <div>
                  <h5 className="font-black text-slate-900 uppercase text-[11px] mb-1">A. Ringkasan Eksekutif:</h5>
                  <p className="text-slate-700 whitespace-pre-line">
                    {selectedProposal.policyBriefDraft?.executiveSummary || 
                     'Kajian empiris ini merumuskan intervensi kebijakan prioritas untuk percepatan pembangunan daerah berbasis data presisi.'}
                  </p>
                </div>

                <div>
                  <h5 className="font-black text-slate-900 uppercase text-[11px] mb-1">B. Analisis Masalah & Kondisi Lapangan:</h5>
                  <p className="text-slate-700 whitespace-pre-line">
                    {selectedProposal.policyBriefDraft?.problemAnalysis || selectedProposal.problemStatement}
                  </p>
                </div>

                <div>
                  <h5 className="font-black text-slate-900 uppercase text-[11px] mb-1">C. Rekomendasi Aksi Nyata OPD:</h5>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-900 font-mono text-[11px] whitespace-pre-line">
                    {selectedProposal.policyBriefDraft?.actionRecommendations || 
                     '1. Penyusunan SOP terpadu lintas sektor.\n2. Alokasi program inovasi pada RKPD perubahan.'}
                  </div>
                </div>

                {/* TTE Stamp Box in preview */}
                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <div className="text-center w-56 space-y-1">
                    <p className="text-[11px] font-bold text-slate-800">Kepala BRIDA Kab. Sleman</p>
                    
                    {selectedProposal.policyBriefDraft?.tteStatus === 'TERVERIFIKASI_TTE' || selectedProposal.status === 'COMPLETED' ? (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-col items-center justify-center text-emerald-800">
                        <QrCode className="w-10 h-10 mx-auto text-emerald-700" />
                        <span className="text-[9px] font-black uppercase mt-1">Ditandatangani Secara Elektronik (TTE)</span>
                        <span className="text-[8px] font-mono text-slate-500">BSrE - BSSN Validated</span>
                        <span className="text-[8px] font-mono text-emerald-900 mt-0.5">
                          {selectedProposal.recommendationDoc?.signatureHash || 'BSRE-VALID-9941'}
                        </span>
                      </div>
                    ) : (
                      <div className="h-20 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-[10px]">
                        [ Menunggu Legalisasi TTE ]
                      </div>
                    )}

                    <p className="text-[11px] font-black text-slate-900 pt-1">Dr. H. Bambang Suherman, M.Si.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 shadow-sm">
              <FileCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700 text-base">Pilih Naskah Rekomendasi</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Pilih draf rekomendasi di sebelah kiri untuk membaca substansi policy brief dan membubuhkan TTE digital.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* TTE Signing Modal */}
      {isSignModalOpen && selectedProposal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase mb-1">
                <ShieldCheck className="w-4 h-4" />
                Sertifikasi Digital BSrE - BSSN
              </div>
              <h3 className="font-black text-lg">Legalisasi Tanda Tangan Elektronik</h3>
              <p className="text-xs text-slate-300 mt-1">{selectedProposal.title}</p>
            </div>

            {signSuccessInfo ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">TTE Berhasil Dibubuhkan!</h4>
                  <p className="text-xs text-slate-500 mt-1">Dokumen resmi telah disahkan dan otomatis diterbitkan ke OPD pemohon.</p>
                  <div className="p-2.5 bg-slate-50 rounded-lg font-mono text-[11px] text-emerald-800 font-bold mt-3 border border-slate-200">
                    Hash: {signSuccessInfo.hash}
                  </div>
                </div>
                <button
                  onClick={() => setIsSignModalOpen(false)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow"
                >
                  Selesai & Tutup
                </button>
              </div>
            ) : (
              <form onSubmit={handleExecuteTTE} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Skema Penandatanganan (Multi-Sign Option):
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs ${
                      signType === 'SINGLE' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold' : 'border-slate-200 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="signtype"
                        checked={signType === 'SINGLE'}
                        onChange={() => setSignType('SINGLE')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Tanda Tangan Tunggal (Kepala BRIDA)</span>
                    </label>

                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs ${
                      signType === 'MULTI_SEKDA' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold' : 'border-slate-200 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="signtype"
                        checked={signType === 'MULTI_SEKDA'}
                        onChange={() => setSignType('MULTI_SEKDA')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Multi-Sign (Kepala BRIDA & Sekretaris Daerah)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Passphrase Sertifikat Digital Kepala BRIDA:
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Masukkan passphrase sertifikat..."
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Tersambung ke Node BSrE Kabupaten Sleman.</span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSignModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSigningLoading}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow flex items-center gap-2"
                  >
                    {isSigningLoading ? (
                      <>
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        Memproses TTE...
                      </>
                    ) : (
                      <>
                        <Stamp className="w-3.5 h-3.5" />
                        Tanda Tangani Sekarang
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
