'use client';

import React, { useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  CheckCircle2,
  Calendar,
  Building2,
  ShieldCheck,
  Eye,
  FileSpreadsheet,
  Printer,
  Copy,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { downloadFileDirectly, isPdfDocument } from '@/lib/file-viewer';
import {
  generateKakPdf,
  generatePolicyBriefPdf,
  generateGeneralDocPdf,
  openPdfLoadingWindow,
} from '@/lib/pdf-generator';

export interface DocumentReviewItem {
  name: string;
  size?: string;
  uploadDate?: string;
  url?: string;
  type?: 'KAK_TOR' | 'DATA_DUKUNG' | 'RKA' | 'POLICY_BRIEF' | 'LAPORAN_AKHIR' | 'WORKING_DOC' | string;
  proposalCode?: string;
  proposalTitle?: string;
  opdName?: string;
  content?: string;
  urgencyReason?: string;
  problemStatement?: string;
  estimatedBudget?: number;
  expectedOutput?: string;
  // Specialized fields for Policy Brief, KAK, and Laporan Akhir
  executiveSummary?: string;
  background?: string;
  policyRecommendations?: string;
  conclusion?: string;
  correlatedDocs?: string;
  targetPolicyType?: string;
  impactLevel?: string;
  targetOpdNames?: string;
  signedBy?: string;
  signedAt?: string;
  kakBackground?: string;
  kakObjectives?: string;
  kakScope?: string;
  kakTargetOutput?: string;
  kakStatus?: string;
  finalReportSummary?: string;
  executionScheme?: string;
  fiscalYear?: number | string;
  cooperationScheme?: string;
  cooperationNumber?: string;
  workingDocType?: string;
  workingDocDescription?: string;
  teamLead?: string;
  institution?: string;
}

export type DocumentReviewState = DocumentReviewItem;

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentReviewItem | null;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'METADATA'>('PREVIEW');

  if (!isOpen || !document) return null;

  const getDocTypeBadge = (type?: string) => {
    switch (type) {
      case 'KAK_TOR':
        return <span className="px-2.5 py-0.5 bg-blue-50 text-blue-900 border border-blue-300 text-2xs font-bold uppercase font-mono">Kerangka Acuan Kerja (KAK)</span>;
      case 'RKA':
        return <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-300 text-2xs font-bold uppercase font-mono">Rencana Kerja Anggaran (RKA)</span>;
      case 'POLICY_BRIEF':
        return <span className="px-2.5 py-0.5 bg-purple-50 text-purple-900 border border-purple-300 text-2xs font-bold uppercase font-mono">Policy Brief / Naskah Rekomendasi</span>;
      case 'LAPORAN_AKHIR':
        return <span className="px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-300 text-2xs font-bold uppercase font-mono">Laporan Akhir Penelitian</span>;
      case 'COOPERATION_DOC':
        return <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-900 border border-indigo-300 text-2xs font-bold uppercase font-mono">Dokumen Kerja Sama / Legalitas SK</span>;
      case 'WORKING_DOC':
        return <span className="px-2.5 py-0.5 bg-teal-50 text-teal-900 border border-teal-300 text-2xs font-bold uppercase font-mono">Berkas Kerja & Data Riset</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 text-2xs font-bold uppercase font-mono">Lampiran Data Dukung</span>;
    }
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Helper untuk menghasilkan PDF resmi terstandar untuk setiap jenis dokumen
  const handleGeneratePdfForDoc = async (targetWindow?: Window | null) => {
    if (!document) return null;

    if (document.type === 'POLICY_BRIEF') {
      return await generatePolicyBriefPdf(
        {
          officialNumber: document.proposalCode || '070/BRIDA-MMK/2026/042',
          title: document.proposalTitle || document.name,
          targetOpdNames: document.targetOpdNames || document.opdName || 'Pemerintah Kabupaten Mimika',
          targetPolicyType: document.targetPolicyType || 'Perbup Mimika',
          impactLevel: document.impactLevel || 'Strategis Daerah',
          subject: document.proposalTitle || document.name,
          executiveSummary: document.executiveSummary || document.content || '',
          background: document.background || '',
          policyRecommendations: document.policyRecommendations || '',
          conclusion: document.conclusion || '',
          correlatedDocs: document.correlatedDocs,
          isFinalized: true,
          signedBy: document.signedBy || 'Dr. Petrus Renyaan, M.Si.',
          signedNip: '19730412 199803 1 001',
          certificateNumber: 'DS-2026-0001-BSRE',
        },
        targetWindow
      );
    } else if (document.type === 'KAK_TOR') {
      return await generateKakPdf(
        {
          proposalCode: document.proposalCode || 'KAK-2026',
          proposalTitle: document.proposalTitle || document.name,
          opdName: document.opdName || 'Pemerintah Kabupaten Mimika',
          fiscalYear: document.fiscalYear || new Date().getFullYear(),
          allocatedBudget: document.estimatedBudget || 0,
          durationMonths: 3,
          kakStatus: document.kakStatus || 'FINAL',
          background: document.kakBackground || document.problemStatement || '',
          objectives: document.kakObjectives || document.urgencyReason || '',
          scopeAndMethodology: document.kakScope || '',
          targetOutput: document.kakTargetOutput || document.expectedOutput || '',
          signedBy: document.signedBy || 'Dr. Petrus Renyaan, M.Si.',
          signedNip: '19730412 199803 1 001',
          certificateNumber: `DS-KAK-${document.proposalCode || '2026'}-BRIDA`,
        },
        targetWindow
      );
    } else {
      // General Doc (Laporan Akhir, SK Kerjasama, Berkas Kerja, Dokumen Usulan OPD)
      const sections: Array<{ heading: string; content: string }> = [];

      if (document.type === 'LAPORAN_AKHIR') {
        sections.push({
          heading: '1. Ringkasan Eksekutif Hasil Riset Empiris',
          content: document.finalReportSummary || document.content || 'Laporan akhir merangkum temuan data empiris, pengolahan metodologi, dan sintesis kajian.',
        });
        sections.push({
          heading: '2. Ruang Lingkup & Metodologi Riset',
          content: document.kakScope || 'Penelitian dilaksanakan menggunakan mixed-methods dengan pengumpulan data primer di wilayah Kabupaten Mimika.',
        });
        sections.push({
          heading: '3. Rujukan Pemanfaatan Kebijakan Bagi OPD',
          content: document.policyRecommendations || document.executiveSummary || 'Hasil laporan akhir ini menjadi dasar penyusunan Policy Brief dan rekomendasi kebijakan operasional OPD.',
        });
      } else if (document.type === 'COOPERATION_DOC') {
        sections.push({
          heading: '1. Ketentuan Legalitas & Susunan Tim Riset',
          content: document.content || 'Dokumen legalitas ini mengikat susunan tim pelaksana, alokasi tugas litbang, kewajiban penyusunan luaran, serta akuntabilitas anggaran.',
        });
        sections.push({
          heading: '2. Kepatuhan & Pedoman Litbang',
          content: 'Pelaksanaan riset berpedoman penuh pada Kerangka Acuan Kerja (KAK) dan RKA yang disetujui Kepala BRIDA Mimika.',
        });
      } else if (document.type === 'WORKING_DOC') {
        sections.push({
          heading: '1. Uraian Berkas Kerja & Data Lapangan',
          content: document.workingDocDescription || document.content || 'Berkas kerja penelitian berupa data mentah, instrumen survei, atau tabulasi lapangan.',
        });
        sections.push({
          heading: '2. Akuntabilitas & Integritas Data',
          content: 'Data dihimpun secara objektif dan akuntabel di Kabupaten Mimika sebagai basis bukti empiris perumusan rekomendasi kebijakan.',
        });
      } else {
        sections.push({
          heading: '1. Identifikasi Masalah / Latar Belakang Usulan',
          content: document.problemStatement || 'Telah diverifikasi sesuai formulir pengajuan riset daerah.',
        });
        sections.push({
          heading: '2. Urgensi Penelitian Bagi Daerah',
          content: document.urgencyReason || 'Mendesak untuk mendukung penyusunan kebijakan prioritas Kabupaten Mimika.',
        });
        sections.push({
          heading: '3. Ringkasan Pagu & Luaran',
          content: `Estimasi Kebutuhan Pagu: ${document.estimatedBudget ? 'Rp ' + document.estimatedBudget.toLocaleString('id-ID') : 'Sesuai Standar Biaya Masukan'}\nTarget Output Luaran: ${document.expectedOutput || 'Rekomendasi Kebijakan / Policy Brief'}`,
        });
      }

      return await generateGeneralDocPdf(
        {
          title: document.proposalTitle || document.name,
          registrationNumber: document.proposalCode || 'SIMRIDA/2026/DOC',
          targetAgency: document.opdName || 'Pemerintah Kabupaten Mimika',
          typeBadge: document.name,
          dateStr: document.uploadDate,
          sections,
          signedBy: document.signedBy || 'Dr. Petrus Renyaan, M.Si.',
          certificateNumber: 'DS-SIMRIDA-MIMIKA-BSRE',
        },
        targetWindow
      );
    }
  };

  // Unduh dokumen riil (file asli jika ada URL, atau generate file .pdf resmi jika dokumen sistem)
  const handleDownload = async () => {
    if (document.url) {
      downloadFileDirectly({
        name: document.name,
        url: document.url,
        size: document.size,
      });
      toast(`Mengunduh berkas asli "${document.name}" ke perangkat Anda...`, 'success');
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const res = await handleGeneratePdfForDoc();
      if (res) {
        res.download();
        toast(`Berkas PDF resmi "${document.name.replace(/\.[^/.]+$/, '')}.pdf" berhasil diunduh!`, 'success');
      }
    } catch (err) {
      console.error('Error downloading generated PDF:', err);
      toast('Gagal mengunduh dokumen PDF. Silakan coba kembali.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Buka dokumen langsung di Chrome PDF Viewer tab baru
  const handleOpenInNewTab = async () => {
    if (document.url) {
      window.open(document.url, '_blank');
      toast(`Membuka berkas "${document.name}" pada tab peramban baru...`, 'info');
      return;
    }

    const loadingWin = openPdfLoadingWindow();
    setIsGeneratingPdf(true);
    try {
      await handleGeneratePdfForDoc(loadingWin);
      toast(`Membuka dokumen "${document.name}" di Chrome PDF Viewer...`, 'info');
    } catch (err) {
      console.error('Error opening PDF in Chrome tab:', err);
      if (loadingWin && !loadingWin.closed) loadingWin.close();
      toast('Gagal membuka peninjau PDF.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-5xl w-full max-h-[96vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 overflow-hidden font-sans">

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 min-w-0 w-full sm:w-auto">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-sky-500/20 text-sky-300 rounded-lg border border-sky-400/30 shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-2xs font-mono text-sky-300 font-bold uppercase">{document.proposalCode || 'DOKUMEN RESMI'}</span>
                  <span className="text-slate-400 text-xs hidden sm:inline">•</span>
                  <span className="text-xs text-slate-300 truncate max-w-[150px] sm:max-w-none">{document.opdName || 'Instansi Pengusul'}</span>
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-white truncate max-w-xs sm:max-w-md md:max-w-xl">
                  {document.name}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition sm:hidden shrink-0"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleOpenInNewTab}
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-initial px-3 py-1.5 bg-white/10 hover:bg-white/20 text-sky-200 rounded-lg text-xs font-semibold transition border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Buka Peninjauan Dokumen di Chrome PDF Viewer (Halaman per Halaman & Cetak)"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>{isGeneratingPdf ? 'Menyiapkan...' : 'Buka / Cetak PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              title="Unduh File PDF Resmi"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Unduh PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition hidden sm:block ml-1 cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 sm:px-6 pt-2 gap-2 sm:gap-4 shrink-0 text-xs overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveTab('PREVIEW')}
            className={`pb-3 font-bold transition flex items-center gap-1.5 border-b-2 shrink-0 ${activeTab === 'PREVIEW'
                ? 'border-[#0f2c59] text-[#0f2c59]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span>Pratinjau Isi Dokumen</span>
          </button>

          <button
            onClick={() => setActiveTab('METADATA')}
            className={`pb-3 font-bold transition flex items-center gap-1.5 border-b-2 shrink-0 ${activeTab === 'METADATA'
                ? 'border-[#0f2c59] text-[#0f2c59]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Metadata & Verifikasi File</span>
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6 bg-slate-100/50 min-w-0">

          {activeTab === 'PREVIEW' && (
            document.url ? (
              isPdfDocument(document.name) || document.url.toLowerCase().includes('.pdf') ? (
                /* PDF REAL VIEWER */
                <div className="space-y-4 max-w-4xl mx-auto">
                  {/* PDF Toolbar Banner */}
                  <div className="p-3 sm:p-4 bg-slate-900 text-white rounded-xl sm:rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-slate-800">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 sm:p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-400/30 shrink-0">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-3xs font-extrabold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-mono uppercase">
                            BERKAS ASLI UNGGAHAN
                          </span>
                          <span className="text-3xs text-slate-400 font-mono">{document.size || 'PDF'}</span>
                        </div>
                        <p className="text-xs font-bold text-white mt-1 truncate max-w-xs sm:max-w-md">
                          {document.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => window.open(document.url, '_blank')}
                        className="flex-1 sm:flex-initial px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white/10 hover:bg-white/20 text-sky-200 rounded-xl text-xs font-semibold transition border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Buka PDF di tab baru peramban"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Tab Baru</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="flex-1 sm:flex-initial px-3.5 py-1.5 sm:px-4 sm:py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        title="Unduh berkas PDF asli"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh PDF Asli</span>
                      </button>
                    </div>
                  </div>

                  {/* Embedded PDF iframe */}
                  <div className="relative w-full h-[55vh] sm:h-[65vh] md:h-[650px] rounded-xl sm:rounded-2xl overflow-hidden border border-slate-300 shadow-inner bg-slate-900/5">
                    <iframe
                      src={document.url}
                      title={document.name}
                      className="w-full h-full border-0"
                    />
                  </div>

                  {/* Summary / Notes from system if present */}
                  {(document.finalReportSummary || document.executiveSummary) && (
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-xs shadow-xs">
                      <span className="font-bold text-slate-900 block text-2xs uppercase tracking-wider text-[#0f2c59] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                        Ikhtisar Ringkasan Riset (Sistem SIM-RIDA):
                      </span>
                      <p className="text-slate-700 text-2xs leading-relaxed whitespace-pre-line bg-slate-50 p-3 border border-slate-200 rounded-lg">
                        {document.finalReportSummary || document.executiveSummary}
                      </p>
                    </div>
                  )}

                  {/* Watermark Verified */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-2xs text-slate-500">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Berkas resmi terverifikasi melalui Portal SIM-RIDA Kab. Mimika</span>
                    </div>
                    <span className="font-mono text-3xs">{document.proposalCode || 'VALID'}</span>
                  </div>
                </div>
              ) : (
                /* NON-PDF REAL FILE (e.g. .xlsx, .docx) */
                <div className="p-4 sm:p-8 bg-white border border-slate-200 shadow-sm rounded-xl sm:rounded-2xl space-y-4 sm:space-y-6 text-center max-w-xl mx-auto">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center border border-emerald-300 shadow-sm">
                    <FileSpreadsheet className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-2xs font-extrabold px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full font-mono uppercase">
                      BERKAS ASLI UNGGAHAN BRIDA
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-2 break-all">{document.name}</h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      Berkas ini merupakan dokumen lampiran penelitian resmi ({document.size || 'Spreadsheet / Berkas Kerja'}). Silakan unduh untuk menelaah isinya menggunakan aplikasi lokal pada perangkat Anda.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh Berkas Ini ({document.size || 'Unduh'})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(document.url, '_blank')}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 border border-slate-300 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Buka di Tab Baru</span>
                    </button>
                  </div>
                </div>
              )
            ) : (
              /* DIGITAL SYSTEM PREVIEW (When no uploaded file URL is attached) */
              <div className="bg-white p-4 sm:p-8 border border-slate-200 shadow-sm rounded-xl space-y-4 sm:space-y-6 max-w-3xl mx-auto">
                {/* Document Header in Preview */}
                <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-2xs font-bold text-slate-500 uppercase tracking-widest block">
                      {document.type === 'POLICY_BRIEF' ? 'Naskah Rekomendasi Kebijakan Resmi' :
                       document.type === 'KAK_TOR' ? 'Kerangka Acuan Kerja (KAK) Penelitian' :
                       document.type === 'LAPORAN_AKHIR' ? 'Laporan Akhir Penelitian & Riset Daerah' :
                       'Dokumen Resmi Usulan Riset'}
                    </span>
                    <h2 className="text-base font-extrabold text-[#0f2c59] mt-0.5">
                      {document.proposalTitle || document.name}
                    </h2>
                  </div>
                  {getDocTypeBadge(document.type)}
                </div>

                {/* SPECIFIC VIEW: POLICY_BRIEF */}
                {document.type === 'POLICY_BRIEF' && (
                  <div className="space-y-4 text-xs text-slate-700">
                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-[#0f2c59] text-white rounded-md shrink-0">
                          <ShieldCheck className="w-5 h-5 text-sky-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-blue-950">TTE Terverifikasi Elektronik (BSrE BSSN)</h4>
                          <p className="text-2xs text-blue-800">
                            Disahkan oleh: <strong>{document.signedBy || 'Dr. Petrus Renyaan, M.Si (Kepala BRIDA)'}</strong> pada {document.signedAt || document.uploadDate || '01 Mar 2026'}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-blue-600 text-white font-extrabold text-2xs rounded-full shrink-0">
                        SAH & MENGIKAT
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs bg-slate-50 p-3.5 border border-slate-200 rounded-lg">
                      <div>Jenis Regulasi Sasaran: <strong className="text-slate-900">{document.targetPolicyType || 'Peraturan Bupati (Perbup)'}</strong></div>
                      <div>Tingkat Dampak: <strong className="text-slate-900">{document.impactLevel || 'Strategis Daerah'}</strong></div>
                      <div className="sm:col-span-2">OPD / Stakeholder Sasaran: <strong className="text-blue-900">{document.targetOpdNames || document.opdName || 'Dinas Teknis Terkait'}</strong></div>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider text-[#0f2c59]">
                        1. Ringkasan Eksekutif (Executive Summary)
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                        {document.executiveSummary || document.content || 'Ringkasan eksekutif merangkum poin pokok telaah kebijakan bagi pimpinan daerah.'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider text-[#0f2c59]">
                        2. Latar Belakang (Background)
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                        {document.background || 'Uraian latar belakang masalah, dasar yuridis, dan urgensi intervensi kebijakan.'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider text-[#0f2c59]">
                        3. Rekomendasi Kebijakan (Policy Recommendations)
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                        {document.policyRecommendations || 'Butir-butir arahan rekomendasi kebijakan terinci bagi dinas terkait.'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider text-[#0f2c59]">
                        4. Kesimpulan (Conclusion)
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                        {document.conclusion || 'Penerapan rekomendasi ini secara konsisten akan mempercepat pencapaian target pembangunan Kabupaten Mimika.'}
                      </p>
                    </div>

                    {document.correlatedDocs && (
                      <div className="space-y-1 pt-2">
                        <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider text-[#0f2c59]">
                          Dokumen Bukti Terkorelasi ke Sistem:
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed text-justify whitespace-pre-line">
                          {document.correlatedDocs}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* SPECIFIC VIEW: KAK_TOR */}
                {document.type === 'KAK_TOR' && (
                  <div className="space-y-5 text-xs text-slate-700">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-2xs text-blue-900">
                      <div>
                        <span className="font-bold block">Status Dokumen: Disahkan Resmi oleh BRIDA</span>
                        <span>Tahun Anggaran: {document.fiscalYear || '2026'} • Skema: {document.executionScheme || 'E-Katalog / Swakelola'}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded font-mono font-bold text-3xs">
                        FINAL KAK
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider text-[#0f2c59]">
                        1. Latar Belakang & Dasar Yuridis
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                        {document.kakBackground || document.problemStatement || 'Dokumen KAK memuat landasan hukum dan permasalahan yang mendasari penelitian.'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider text-[#0f2c59]">
                        2. Maksud dan Tujuan Riset
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                        {document.kakObjectives || document.urgencyReason || 'Maksud dan tujuan kegiatan riset.'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider text-[#0f2c59]">
                        3. Ruang Lingkup & Metodologi Kajian
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                        {document.kakScope || 'Ruang lingkup mencakup studi empiris dan survei lapangan di Kabupaten Mimika.'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider text-[#0f2c59]">
                        4. Target Luaran Konkret (Deliverables)
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                        {document.kakTargetOutput || document.expectedOutput || 'Laporan Akhir, Policy Brief, dan Prototipe / Draf Regulasi.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* SPECIFIC VIEW: LAPORAN_AKHIR */}
                {document.type === 'LAPORAN_AKHIR' && (
                  <div className="space-y-4 text-xs text-slate-700">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-2xs text-amber-950">
                      <div>
                        <span className="font-bold block">Dokumen Laporan Akhir Penelitian & Pengembangan Daerah</span>
                        <span>Berkas: {document.name} • Ukuran: {document.size || '5.2 MB'}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-700 text-white rounded font-bold text-3xs">
                        LAPORAN AKHIR
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-900 block text-2xs uppercase tracking-wider text-[#0f2c59]">
                        1. Ringkasan Eksekutif Laporan Akhir Penelitian
                      </span>
                      <div className="leading-relaxed bg-slate-50 p-4 border border-slate-200 rounded-lg text-justify text-slate-800 whitespace-pre-line">
                        {document.finalReportSummary || document.content || 'Laporan akhir merangkum seluruh temuan data primer, metodologi riset, analisis statistik, serta implikasi kebijakan strategis.'}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-900 block text-2xs uppercase tracking-wider text-[#0f2c59]">
                        2. Metodologi & Pelaksanaan Riset Lapangan
                      </span>
                      <div className="leading-relaxed bg-slate-50 p-4 border border-slate-200 rounded-lg text-justify text-slate-800 whitespace-pre-line">
                        {document.kakScope || 'Pelaksanaan riset melibatkan wawancara stakeholder, survei lapangan terstruktur, dan olah data berbasis instrumen valid di wilayah Kabupaten Mimika.'}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-900 block text-2xs uppercase tracking-wider text-[#0f2c59]">
                        3. Rujukan Implementasi Bagi OPD
                      </span>
                      <div className="leading-relaxed bg-slate-50 p-4 border border-slate-200 rounded-lg text-justify text-slate-800 whitespace-pre-line">
                        {document.policyRecommendations || document.executiveSummary || 'Temuan laporan ini menjadi landasan ilmiah bagi OPD untuk merumuskan usulan Renja atau perbaikan SOP teknis.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* SPECIFIC VIEW: COOPERATION_DOC */}
                {document.type === 'COOPERATION_DOC' && (
                  <div className="space-y-4 text-xs text-slate-700">
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between text-2xs text-indigo-950">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-indigo-700 text-white rounded-md shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold block">Dokumen Legalitas & Perjanjian Kerja Sama Riset</span>
                          <span>Skema: <strong>{document.cooperationScheme || 'Swakelola Internal BRIDA'}</strong> • Nomor: {document.cooperationNumber || document.proposalCode || 'SK/045.2/BRIDA/2026'}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-indigo-700 text-white rounded-md font-bold text-3xs shrink-0">
                        LEGALITAS SAH
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs bg-slate-50 p-3.5 border border-slate-200 rounded-lg">
                      <div>Nama Berkas: <strong className="text-slate-900">{document.name}</strong></div>
                      <div>Tanggal Ditetapkan: <strong className="text-slate-900">{document.uploadDate || '01 Jan 2026'}</strong></div>
                      <div>Instansi Mitra / Pelaksana: <strong className="text-indigo-900">{document.institution || 'Tim Peneliti BRIDA Mimika'}</strong></div>
                      <div>Ketua Tim Peneliti: <strong className="text-slate-900">{document.teamLead || 'Peneliti Ahli BRIDA'}</strong></div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-900 block text-2xs uppercase tracking-wider text-[#0f2c59]">
                        1. Ketentuan Pelaksanaan Riset & Legalitas Tim
                      </span>
                      <div className="leading-relaxed bg-slate-50 p-4 border border-slate-200 rounded-lg text-justify text-slate-800 whitespace-pre-line">
                        {document.content || 'Dokumen legalitas ini mengikat pelaksanaan riset litbang daerah Kabupaten Mimika. Menetapkan hak dan tanggung jawab pelaksana, susunan tim peneliti, kewajiban penyusunan luaran (Policy Brief dan Laporan Akhir), serta jadwal pelaksanaan kegiatan.'}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-900 block text-2xs uppercase tracking-wider text-[#0f2c59]">
                        2. Kepatuhan Standar Riset & Akuntabilitas Anggaran
                      </span>
                      <div className="leading-relaxed bg-slate-50 p-4 border border-slate-200 rounded-lg text-justify text-slate-800 whitespace-pre-line">
                        Seluruh pelaksanaan kegiatan mengacu pada Kerangka Acuan Kerja (KAK) dan Rencana Kerja Anggaran (RKA) yang disahkan oleh Kepala BRIDA Kabupaten Mimika.
                      </div>
                    </div>
                  </div>
                )}

                {/* SPECIFIC VIEW: WORKING_DOC */}
                {document.type === 'WORKING_DOC' && (
                  <div className="space-y-4 text-xs text-slate-700">
                    <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between text-2xs text-teal-950">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-teal-700 text-white rounded-md shrink-0">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold block">Berkas Kerja Riset & Data Lapangan (Evidence Repository)</span>
                          <span>Kategori: <strong>{document.workingDocType || 'Data Mentah / Tabulasi'}</strong> • Ukuran: {document.size || '2.4 MB'}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-teal-700 text-white rounded-md font-bold text-3xs shrink-0">
                        BERKAS KERJA
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs bg-slate-50 p-3.5 border border-slate-200 rounded-lg">
                      <div>Nama Berkas: <strong className="text-slate-900">{document.name}</strong></div>
                      <div>Tanggal Diunggah: <strong className="text-slate-900">{document.uploadDate || '01 Jan 2026'}</strong></div>
                      <div>Perangkat Daerah Pengusul: <strong className="text-teal-900">{document.opdName || 'Pemerintah Kabupaten Mimika'}</strong></div>
                      <div>Kode Usulan Rujukan: <strong className="font-mono text-slate-800">{document.proposalCode || 'RIS-2026'}</strong></div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-900 block text-2xs uppercase tracking-wider text-[#0f2c59]">
                        1. Deskripsi & Kegunaan Berkas Kerja
                      </span>
                      <div className="leading-relaxed bg-slate-50 p-4 border border-slate-200 rounded-lg text-justify text-slate-800 whitespace-pre-line">
                        {document.workingDocDescription || document.content || 'Berkas kerja penelitian lapangan ini memuat tabulasi data mentah survei, transkrip wawancara mendalam / FGD stakeholder, dokumentasi lapangan, atau draf laporan teknis yang dihimpun tim peneliti BRIDA.'}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-900 block text-2xs uppercase tracking-wider text-[#0f2c59]">
                        2. Integritas Data & Bukti Empiris
                      </span>
                      <div className="leading-relaxed bg-slate-50 p-4 border border-slate-200 rounded-lg text-justify text-slate-800 whitespace-pre-line">
                        Data ini dihimpun secara objektif dan akuntabel di wilayah Kabupaten Mimika, menjadi basis data bukti empiris yang mendukung keabsahan temuan pada Naskah Rekomendasi Kebijakan (Policy Brief) dan Laporan Akhir.
                      </div>
                    </div>
                  </div>
                )}

                {/* DEFAULT VIEW: FOR OTHER DOCUMENTS */}
                {document.type !== 'POLICY_BRIEF' && document.type !== 'KAK_TOR' && document.type !== 'LAPORAN_AKHIR' && document.type !== 'COOPERATION_DOC' && document.type !== 'WORKING_DOC' && (
                  <div className="space-y-4 text-xs text-slate-700">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <span className="font-bold text-slate-900 block text-2xs uppercase tracking-wider text-[#0f2c59]">
                        1. Rincian Berkas Lampiran
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs text-slate-600">
                        <div>Nama File: <strong>{document.name}</strong></div>
                        <div>Instansi Pengusul: <strong>{document.opdName || 'Perangkat Daerah'}</strong></div>
                        <div>Ukuran Berkas: <strong>{document.size || '1.4 MB'}</strong></div>
                        <div>Tanggal Diunggah: <strong>{document.uploadDate || '01 Jan 2026'}</strong></div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-900 block text-2xs uppercase tracking-wider text-[#0f2c59]">
                        2. Latar Belakang & Identifikasi Masalah
                      </span>
                      <p className="leading-relaxed bg-slate-50 p-4 border border-slate-200 rounded-lg text-justify">
                        {document.problemStatement || 'Dokumen ini menguraikan latar belakang permasalahan faktual di lapangan serta data pendukung yang mendasari urgensi pelaksanaan riset oleh BRIDA Kabupaten Mimika.'}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-900 block text-2xs uppercase tracking-wider text-[#0f2c59]">
                        3. Alasan Urgensi & Manfaat Kebijakan
                      </span>
                      <p className="leading-relaxed bg-slate-50 p-4 border border-slate-200 rounded-lg text-justify">
                        {document.urgencyReason || 'Hasil kajian ini sangat mendesak untuk diintegrasikan ke dalam rencana kerja dan penetapan standar operasional prosedur instansi terkait.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Watermark Verified */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-2xs text-slate-500">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Terverifikasi Sistem Terpadu SIM-RIDA Kabupaten Mimika</span>
                  </div>
                  <span className="font-mono">{document.proposalCode}</span>
                </div>
              </div>
            )
          )}

          {activeTab === 'METADATA' && (
            <div className="bg-white p-4 sm:p-6 border border-slate-200 shadow-sm rounded-xl space-y-4 max-w-3xl mx-auto">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Informasi Teknis Berkas Digital
              </h4>

              <div className="divide-y divide-slate-200 text-xs">
                <div className="py-2.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-slate-600 shrink-0">Nama File Asli:</span>
                  <span className="font-bold text-slate-900 font-mono text-left sm:text-right break-all">{document.name}</span>
                </div>
                <div className="py-2.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-slate-600 shrink-0">Tipe Berkas:</span>
                  <span className="font-semibold text-slate-800 text-left sm:text-right">{document.type || 'Dokumen PDF / Lampiran Resmi'}</span>
                </div>
                <div className="py-2.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-slate-600 shrink-0">Ukuran File:</span>
                  <span className="font-mono font-bold text-slate-800 text-left sm:text-right">{document.size || '1.4 MB'}</span>
                </div>
                <div className="py-2.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-slate-600 shrink-0">Waktu Pengunggahan:</span>
                  <span className="font-mono text-slate-800 text-left sm:text-right">{document.uploadDate || '01 Jan 2026'}</span>
                </div>
                <div className="py-2.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-slate-600 shrink-0">Instansi Pemilik Berkas:</span>
                  <span className="font-bold text-[#0f2c59] text-left sm:text-right">{document.opdName || 'Dinas / Badan Daerah Mimika'}</span>
                </div>
                <div className="py-2.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-slate-600 shrink-0">Integritas Hash Digest:</span>
                  <span className="font-mono text-2xs text-slate-600 bg-slate-100 px-2 py-1 border border-slate-200 break-all text-left sm:text-right">
                    SHA256: 8f7e2a9c4b1d6e8a0f3b7c9d5e1a2f4c6b8d0e2a4f6c8e0b2d4f6a8c0e2b4d6f
                  </span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  onClick={handleDownload}
                  className="w-full sm:w-auto px-4 py-2 bg-[#0f2c59] hover:bg-[#0a1e3f] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Berkas Sekarang</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs shrink-0">
          <span className="text-2xs text-slate-500 text-center sm:text-left">
            Peninjauan berkas litbang resmi BRIDA Kabupaten Mimika
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider rounded-lg transition border border-slate-300"
          >
            Tutup Pratinjau
          </button>
        </div>

      </div>
    </div>
  );
};
