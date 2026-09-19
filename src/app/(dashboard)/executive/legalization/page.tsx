'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  useOpdStore, 
  TteInboxItem,
  DigitalSignatureLogItem
} from '@/store/useOpdStore';
import { useAuthStore } from '@/store/useAuthStore';
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
  QrCode,
  AlertCircle,
  Calendar,
  Layers,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function ExecutiveLegalizationPage() {
  const { user } = useAuthStore();
  const { 
    tteInbox,
    tteHistory,
    fetchTteInbox,
    fetchTteHistory,
    fetchTteDocumentDetail,
    signTteDocument,
    isLoadingTte
  } = useOpdStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'PENDING_TTE' | 'SIGNED'>('PENDING_TTE');
  
  // Selection & Detail state
  const [selectedInboxItem, setSelectedInboxItem] = useState<TteInboxItem | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<DigitalSignatureLogItem | null>(null);
  const [activeDocumentDetail, setActiveDocumentDetail] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // TTE Signing Modal State
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [passphrase, setPassphrase] = useState('password123');
  const [signType, setSignType] = useState<'SINGLE' | 'MULTI_SEKDA'>('SINGLE');
  const [signingNotes, setSigningNotes] = useState('');
  const [isSigningLoading, setIsSigningLoading] = useState(false);
  const [signingError, setSigningError] = useState<string | null>(null);
  const [signSuccessInfo, setSignSuccessInfo] = useState<DigitalSignatureLogItem | null>(null);

  // Initial fetch
  useEffect(() => {
    fetchTteInbox();
    fetchTteHistory();
  }, []);

  // Set default selection when inbox loads
  useEffect(() => {
    if (filterTab === 'PENDING_TTE' && tteInbox.length > 0 && !selectedInboxItem) {
      handleSelectInboxItem(tteInbox[0]);
    } else if (filterTab === 'SIGNED' && tteHistory.length > 0 && !selectedHistoryItem) {
      handleSelectHistoryItem(tteHistory[0]);
    }
  }, [tteInbox, tteHistory, filterTab]);

  const handleSelectInboxItem = async (item: TteInboxItem) => {
    setSelectedInboxItem(item);
    setSelectedHistoryItem(null);
    setIsLoadingDetail(true);
    try {
      const detail = await fetchTteDocumentDetail(item.documentType, item.id);
      setActiveDocumentDetail(detail?.document || detail);
    } catch (err) {
      console.error('Failed to load document detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSelectHistoryItem = async (log: DigitalSignatureLogItem) => {
    setSelectedHistoryItem(log);
    setSelectedInboxItem(null);
    setIsLoadingDetail(true);
    try {
      if (log.documentType === 'POLICY_RECOMMENDATION' || log.documentType === 'KAK_DOCUMENT') {
        const detail = await fetchTteDocumentDetail(log.documentType, log.documentId);
        setActiveDocumentDetail(detail?.document || detail);
      } else {
        setActiveDocumentDetail(null);
      }
    } catch (err) {
      console.error('Failed to load history document detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const filteredInbox = tteInbox.filter((item) => {
    const q = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(q) ||
      item.documentCode.toLowerCase().includes(q) ||
      (item.opdName && item.opdName.toLowerCase().includes(q)) ||
      (item.studyTitle && item.studyTitle.toLowerCase().includes(q));
  });

  const filteredHistory = tteHistory.filter((log) => {
    const q = searchQuery.toLowerCase();
    return log.documentTitle.toLowerCase().includes(q) ||
      log.certificateNumber.toLowerCase().includes(q) ||
      (log.documentCode && log.documentCode.toLowerCase().includes(q)) ||
      log.signerName.toLowerCase().includes(q);
  });

  const handleOpenSignModal = (item: TteInboxItem) => {
    setSelectedInboxItem(item);
    setPassphrase('password123');
    setSignType('SINGLE');
    setSigningNotes(`Naskah telah diverifikasi substansinya dan disahkan melalui TTE Kepala BRIDA.`);
    setSigningError(null);
    setSignSuccessInfo(null);
    setIsSignModalOpen(true);
  };

  const handleExecuteTTE = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInboxItem || !passphrase) return;

    setIsSigningLoading(true);
    setSigningError(null);

    try {
      const result = await signTteDocument({
        documentType: selectedInboxItem.documentType,
        documentId: selectedInboxItem.id,
        passphrase,
        notes: signingNotes || (signType === 'MULTI_SEKDA' ? 'Multi-Sign Kepala BRIDA & Sekda Mimika' : 'TTE Tunggal Kepala BRIDA')
      });

      setSignSuccessInfo(result);
      setSelectedInboxItem(null);
      await fetchTteInbox();
      await fetchTteHistory();
    } catch (err: any) {
      setSigningError(err.message || 'Passphrase salah atau gagal menandatangani dokumen.');
    } finally {
      setIsSigningLoading(false);
    }
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
            Pusat legalisasi naskah kebijakan dan surat rekomendasi resmi. Bubuhkan Tanda Tangan Elektronik (TTE) tersertifikasi BSrE BSSN agar naskah sah dan resmi diterbitkan ke OPD pemohon.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchTteInbox(); fetchTteHistory(); }}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 transition text-xs shadow"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Segarkan</span>
          </button>
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
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              filterTab === 'PENDING_TTE' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu Pengesahan TTE</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              filterTab === 'PENDING_TTE' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {tteInbox.length}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('SIGNED')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              filterTab === 'SIGNED' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Telah Disahkan (Arsip TTE)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              filterTab === 'SIGNED' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {tteHistory.length}
            </span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={filterTab === 'PENDING_TTE' ? 'Cari antrean naskah...' : 'Cari sertifikat TTE...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Main Layout: Left list (5 cols), Right document viewer & action (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: List of Items */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            {filterTab === 'PENDING_TTE' 
              ? `Antrean Naskah Masuk (${filteredInbox.length})` 
              : `Daftar Sertifikat Terbit (${filteredHistory.length})`}
          </h2>

          {filterTab === 'PENDING_TTE' ? (
            filteredInbox.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 shadow-sm">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                <p className="font-bold text-slate-700 text-sm">Semua Naskah Telah Disahkan</p>
                <p className="text-xs text-slate-400 mt-1">Tidak ada dokumen yang menunggu tanda tangan elektronik saat ini.</p>
              </div>
            ) : (
              filteredInbox.map((item) => {
                const isSelected = selectedInboxItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectInboxItem(item)}
                    className={`cursor-pointer bg-white p-5 rounded-2xl border transition shadow-sm hover:shadow-md ${
                      isSelected ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {item.documentCode}
                      </span>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 bg-amber-100 text-amber-800">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Menunggu TTE
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1.5 mb-3">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.opdName || 'Instansi Terkait'}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400">
                        Tipe: <strong className="text-slate-700">{item.documentType === 'POLICY_RECOMMENDATION' ? 'Policy Brief' : 'Dokumen KAK'}</strong>
                      </span>
                      <span className="text-emerald-700 font-bold">
                        Telaah & Sahkan →
                      </span>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            filteredHistory.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 shadow-sm">
                <FileCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="font-bold text-slate-700 text-sm">Belum Ada Riwayat TTE</p>
                <p className="text-xs text-slate-400 mt-1">Dokumen yang telah ditandatangani akan terarsip di sini.</p>
              </div>
            ) : (
              filteredHistory.map((log) => {
                const isSelected = selectedHistoryItem?.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => handleSelectHistoryItem(log)}
                    className={`cursor-pointer bg-white p-5 rounded-2xl border transition shadow-sm hover:shadow-md ${
                      isSelected ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {log.certificateNumber}
                      </span>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        TTE Sah (Valid)
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                      {log.documentTitle}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1.5 mb-3">
                      <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Oleh: {log.signerName}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400 font-mono text-[10px]">
                        {new Date(log.signedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-emerald-700 font-bold">
                        Buka Arsip →
                      </span>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Right Column: Interactive Document Viewer & TTE Signing */}
        <div className="lg:col-span-7">
          {(selectedInboxItem || selectedHistoryItem) ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 sticky top-6">
              {/* Header inside card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">
                    {selectedInboxItem ? selectedInboxItem.documentCode : selectedHistoryItem?.certificateNumber}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 mt-1.5 leading-snug">
                    {selectedInboxItem ? selectedInboxItem.title : selectedHistoryItem?.documentTitle}
                  </h3>
                </div>

                <div className="shrink-0">
                  {selectedInboxItem ? (
                    <button
                      onClick={() => handleOpenSignModal(selectedInboxItem)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-lg flex items-center gap-2 hover:shadow-emerald-600/20"
                    >
                      <Stamp className="w-4 h-4" />
                      Sahkan & Bubuhkan TTE BSrE
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Dokumen Sah Terverifikasi TTE
                    </div>
                  )}
                </div>
              </div>

              {/* Document Content Preview */}
              {isLoadingDetail ? (
                <div className="p-12 text-center text-slate-400">
                  <Clock className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
                  <p className="text-xs font-bold">Memuat lembar naskah resmi...</p>
                </div>
              ) : activeDocumentDetail ? (
                <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-200 text-xs leading-relaxed space-y-5">
                  <div className="text-center border-b border-slate-200 pb-3">
                    <h4 className="font-black text-slate-900 uppercase">
                      Pemerintah Kabupaten Mimika • BRIDA
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Tujuan OPD: <strong className="text-slate-800">
                        {activeDocumentDetail.targetOpdNames || 
                         activeDocumentDetail.study?.proposal?.opd?.name || 
                         selectedInboxItem?.opdName || 
                         'Instansi Terkait'}
                      </strong>
                    </p>
                  </div>

                  {/* If Policy Recommendation */}
                  {(selectedInboxItem?.documentType === 'POLICY_RECOMMENDATION' || selectedHistoryItem?.documentType === 'POLICY_RECOMMENDATION') && (
                    <>
                      <div className="space-y-1">
                        <h5 className="font-bold text-[#0f2c59] uppercase text-xs tracking-wider">
                          A. Ringkasan Eksekutif (Executive Summary):
                        </h5>
                        <p className="text-xs text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                          {activeDocumentDetail.executiveSummary || 'Ringkasan naskah rekomendasi belum terisi.'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-bold text-[#0f2c59] uppercase text-xs tracking-wider">
                          B. Latar Belakang (Background):
                        </h5>
                        <p className="text-xs text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                          {activeDocumentDetail.background || 'Uraian latar belakang masalah dan urgensi regulasi daerah.'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-bold text-[#0f2c59] uppercase text-xs tracking-wider">
                          C. Rekomendasi Kebijakan (Policy Recommendations):
                        </h5>
                        <p className="text-xs text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                          {activeDocumentDetail.policyRecommendations || 'Butir-butir arahan rekomendasi kebijakan operasional bagi OPD.'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-bold text-[#0f2c59] uppercase text-xs tracking-wider">
                          D. Kesimpulan (Conclusion):
                        </h5>
                        <p className="text-xs text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                          {activeDocumentDetail.conclusion || 'Penerapan rekomendasi ini secara konsisten akan mempercepat pencapaian target pembangunan Kabupaten Mimika.'}
                        </p>
                      </div>

                      {activeDocumentDetail.correlatedDocs && (
                        <div className="space-y-1 pt-1">
                          <h5 className="font-bold text-[#0f2c59] uppercase text-xs tracking-wider">
                            E. Dokumen Bukti yang Dikorelasikan ke Sistem:
                          </h5>
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                            {activeDocumentDetail.correlatedDocs}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* If KAK Document */}
                  {(selectedInboxItem?.documentType === 'KAK_DOCUMENT' || selectedHistoryItem?.documentType === 'KAK_DOCUMENT') && (
                    <>
                      <div className="space-y-1">
                        <h5 className="font-bold text-[#0f2c59] uppercase text-xs tracking-wider">
                          A. Latar Belakang KAK:
                        </h5>
                        <p className="text-xs text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                          {activeDocumentDetail.background || 'Latar belakang pelaksanaan kajian.'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-bold text-[#0f2c59] uppercase text-xs tracking-wider">
                          B. Tujuan & Sasaran:
                        </h5>
                        <p className="text-xs text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                          {activeDocumentDetail.objectives || 'Tujuan riset kelitbangan.'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-bold text-[#0f2c59] uppercase text-xs tracking-wider">
                          C. Ruang Lingkup & Metodologi:
                        </h5>
                        <p className="text-xs text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                          {activeDocumentDetail.scopeAndMethodology || 'Metodologi dan ruang lingkup.'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-bold text-[#0f2c59] uppercase text-xs tracking-wider">
                          D. Target Output:
                        </h5>
                        <p className="text-xs text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                          {activeDocumentDetail.targetOutput || 'Dokumen Laporan Akhir & Policy Brief.'}
                        </p>
                      </div>
                    </>
                  )}

                  {/* TTE Signature Box in live preview */}
                  <div className="pt-4 border-t border-slate-200 flex justify-end">
                    <div className="text-center w-60 space-y-1">
                      <p className="text-[11px] font-bold text-slate-800">Kepala BRIDA Kab. Mimika</p>
                      
                      {selectedHistoryItem ? (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-col items-center justify-center text-emerald-800 shadow-sm">
                          <QrCode className="w-10 h-10 mx-auto text-emerald-700" />
                          <span className="text-[9px] font-black uppercase mt-1">Ditandatangani Secara Elektronik (TTE)</span>
                          <span className="text-[8px] font-mono text-slate-500">BSrE - BSSN Validated</span>
                          <span className="text-[8px] font-mono text-emerald-900 mt-0.5 font-bold">
                            {selectedHistoryItem.certificateNumber}
                          </span>
                        </div>
                      ) : (
                        <div className="h-20 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 text-[10px]">
                          <Stamp className="w-5 h-5 text-slate-300 mb-1" />
                          <span>[ Menunggu Pengesahan TTE ]</span>
                        </div>
                      )}

                      <p className="text-[11px] font-black text-slate-900 pt-1">
                        {selectedHistoryItem?.signerName || user?.name || 'Dr. Petrus Renyaan, M.Si.'}
                      </p>
                      <p className="text-[9px] font-mono text-slate-400">
                        {selectedHistoryItem?.signerNip
                          ? `NIP. ${selectedHistoryItem.signerNip}`
                          : (user?.nip ? `NIP. ${user.nip}` : 'NIP. 197304121998031001')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-8 rounded-2xl text-center text-slate-400">
                  <p className="text-xs">Lembar naskah siap ditelaah.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 shadow-sm">
              <FileCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700 text-base">Pilih Naskah Dokumen</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Pilih naskah di sebelah kiri untuk membaca lembar telaah dan membubuhkan Tanda Tangan Elektronik resmi BSrE.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* TTE Signing Modal */}
      {isSignModalOpen && selectedInboxItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans">
            <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white p-6">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase mb-1">
                <ShieldCheck className="w-4 h-4" />
                Sertifikasi Digital BSrE - BSSN
              </div>
              <h3 className="font-black text-base">Legalisasi Tanda Tangan Elektronik</h3>
              <p className="text-xs text-slate-300 mt-1 leading-snug line-clamp-2">{selectedInboxItem.title}</p>
            </div>

            {signSuccessInfo ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">TTE Berhasil Dibubuhkan!</h4>
                  <p className="text-xs text-slate-500 mt-1">Dokumen resmi telah disahkan dan otomatis terarsip dalam database SIM-RIDA.</p>
                  
                  <div className="bg-slate-50 rounded-xl p-3.5 mt-3 border border-slate-200 text-left space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nomor Sertifikat:</span>
                      <span className="font-mono font-bold text-emerald-800">{signSuccessInfo.certificateNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Penandatangan:</span>
                      <span className="font-bold text-slate-800">{signSuccessInfo.signerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status Sertifikat:</span>
                      <span className="font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">VALID (BSrE)</span>
                    </div>
                    <div className="pt-1 text-[10px] text-slate-400 font-mono break-all">
                      Hash: {signSuccessInfo.signatureHash}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const signedItem = signSuccessInfo;
                    setIsSignModalOpen(false);
                    setFilterTab('SIGNED');
                    if (signedItem) {
                      handleSelectHistoryItem(signedItem);
                    }
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Selesai & Buka Arsip
                </button>
              </div>
            ) : (
              <form onSubmit={handleExecuteTTE} className="p-6 space-y-4">
                {signingError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{signingError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Skema Penandatanganan:
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
                  <span className="text-[10px] text-slate-400 mt-1 block">Default akun uji: <code>password123</code></span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Catatan Pengesahan (Opsional):
                  </label>
                  <input
                    type="text"
                    value={signingNotes}
                    onChange={(e) => setSigningNotes(e.target.value)}
                    placeholder="Catatan telaah..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
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
                    className="px-5 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSigningLoading ? (
                      <>
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        Memproses TTE BSrE...
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

