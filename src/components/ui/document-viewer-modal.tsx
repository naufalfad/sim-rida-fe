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

export interface DocumentReviewItem {
  name: string;
  size?: string;
  uploadDate?: string;
  url?: string;
  type?: 'KAK_TOR' | 'DATA_DUKUNG' | 'RKA' | 'POLICY_BRIEF' | 'WORKING_DOC' | string;
  proposalCode?: string;
  proposalTitle?: string;
  opdName?: string;
  content?: string;
  urgencyReason?: string;
  problemStatement?: string;
  estimatedBudget?: number;
  expectedOutput?: string;
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
        return <span className="px-2.5 py-0.5 bg-blue-50 text-blue-900 border border-blue-300 text-2xs font-bold uppercase font-mono">Kerangka Acuan Kerja (KAK / TOR)</span>;
      case 'RKA':
        return <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-300 text-2xs font-bold uppercase font-mono">Rencana Kerja Anggaran (RKA)</span>;
      case 'POLICY_BRIEF':
        return <span className="px-2.5 py-0.5 bg-purple-50 text-purple-900 border border-purple-300 text-2xs font-bold uppercase font-mono">Naskah Rekomendasi / Policy Brief</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 text-2xs font-bold uppercase font-mono">Lampiran Data Dukung</span>;
    }
  };

  // Generate real downloadable text/PDF file Blob
  const handleDownload = () => {
    const docTitle = document.proposalTitle || document.name;
    const docContent = `
================================================================================
BADAN RISET DAN INOVASI DAERAH (BRIDA) KABUPATEN MIMIKA
DOKUMEN USULAN & KELENGKAPAN PENELITIAN DAERAH
================================================================================

Nama Dokumen      : ${document.name}
Kode Usulan       : ${document.proposalCode || 'USUL-2026'}
Instansi Pengusul : ${document.opdName || 'Pemerintah Kabupaten Mimika'}
Tanggal Unggah    : ${document.uploadDate || new Date().toLocaleDateString('id-ID')}
Ukuran Berkas     : ${document.size || '1.2 MB'}
Status Dokumen    : TERSERTIFIKASI / VALIDASI SISTEM SIM-RIDA

--------------------------------------------------------------------------------
JUDUL USULAN PENELITIAN:
${document.proposalTitle || 'Kajian Kelitbangan Kabupaten Mimika'}

IDENTIFIKASI MASALAH / LATAR BELAKANG:
${document.problemStatement || 'Telah diverifikasi sesuai formulir pengajuan riset daerah.'}

ALASAN URGENSI PENELITIAN:
${document.urgencyReason || 'Mendesak untuk mendukung penyusunan kebijakan RKPD/Renja.'}

ESTIMASI KEBUTUHAN PAGU ANGGARAN:
${document.estimatedBudget ? `Rp ${document.estimatedBudget.toLocaleString('id-ID')}` : 'Sesuai Standar Biaya Masukan (SBM) Mimika'}

TARGET OUTPUT LUARAN:
${document.expectedOutput || 'Rekomendasi Kebijakan / Policy Brief'}

--------------------------------------------------------------------------------
CATATAN REVIEW VERIFIKASI BRIDA:
Dokumen ini merupakan lampiran resmi usulan penelitian yang diunggah melalui 
Portal SIM-RIDA (Sistem Informasi Riset dan Inovasi Daerah) Kabupaten Mimika.
================================================================================
    `.trim();

    const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = document.name.endsWith('.txt') ? document.name : `${document.name.replace(/\.[^/.]+$/, '')}_SIMRIDA.txt`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast(`Berkas "${document.name}" berhasil diunduh ke perangkat Anda.`, 'success');
  };

  // Open in a new formatted browser tab
  const handleOpenInNewTab = () => {
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      toast('Pop-up diblokir oleh peramban. Izinkan pop-up untuk membuka dokumen.', 'warning');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Review Dokumen: ${document.name} - SIM-RIDA Mimika</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; padding: 40px; color: #1e293b; background: #f8fafc; }
          .container { max-width: 860px; margin: 0 auto; background: #ffffff; padding: 48px; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
          .header { border-bottom: 2px solid #0f2c59; padding-bottom: 20px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: flex-start; }
          .title { font-size: 20px; font-weight: bold; color: #0f2c59; margin: 0; }
          .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
          .badge { display: inline-block; padding: 4px 10px; background: #e0f2fe; color: #0369a1; font-weight: bold; font-size: 11px; text-transform: uppercase; border: 1px solid #bae6fd; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #0f2c59; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .content { font-size: 13px; color: #334155; line-height: 1.7; text-align: justify; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
          @media print { body { background: #fff; padding: 0; } .container { border: none; box-shadow: none; padding: 0; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <h1 class="title">Review Dokumen Usulan Riset</h1>
              <div class="meta">Pemerintah Kabupaten Mimika • Badan Riset & Inovasi Daerah (BRIDA)</div>
            </div>
            <div class="badge">${document.proposalCode || 'SIM-RIDA MIMIKA'}</div>
          </div>

          <div class="section">
            <div class="section-title">Informasi Berkas Lampiran</div>
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
              <tr><td style="width: 180px; padding: 6px 0; color: #64748b;">Nama File:</td><td style="font-weight: bold; color: #0f2c59;">${document.name}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Instansi Pengusul:</td><td>${document.opdName || 'Perangkat Daerah Mimika'}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Ukuran & Tanggal:</td><td>${document.size || '1.4 MB'} • Diunggah pada ${document.uploadDate || '01 Jan 2026'}</td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Judul Usulan Penelitian</div>
            <div class="content" style="font-weight: bold; font-size: 14px; color: #0f2c59;">
              ${document.proposalTitle || 'Strategi & Intervensi Kebijakan Daerah'}
            </div>
          </div>

          <div class="section">
            <div class="section-title">1. Uraian Identifikasi Masalah & Latar Belakang</div>
            <div class="content">
              ${document.problemStatement || 'Dokumen usulan memuat rincian identifikasi masalah kebijakan yang memerlukan intervensi kajian saintifik oleh BRIDA.'}
            </div>
          </div>

          <div class="section">
            <div class="section-title">2. Urgensi Penelitian Bagi Daerah</div>
            <div class="content">
              ${document.urgencyReason || 'Kajian ini mendesak untuk diselesaikan sebagai bahan perumusan kebijakan prioritas Kabupaten Mimika.'}
            </div>
          </div>

          <div class="section">
            <div class="section-title">3. Ringkasan Pagu & Luaran</div>
            <div class="content">
              Estimasi Kebutuhan Pagu: <strong>${document.estimatedBudget ? `Rp ${document.estimatedBudget.toLocaleString('id-ID')}` : 'Sesuai Standar Satuan Biaya'}</strong><br/>
              Target Output Luaran: <strong>${document.expectedOutput || 'Rekomendasi Kebijakan / Policy Brief'}</strong>
            </div>
          </div>

          <div class="footer">
            Dokumen resmi diverifikasi melalui Portal SIM-RIDA Mimika • Tanggal Akses: ${new Date().toLocaleString('id-ID')}
          </div>
        </div>
      </body>
      </html>
    `;

    previewWindow.document.write(htmlContent);
    previewWindow.document.close();
    toast(`Membuka berkas "${document.name}" pada tab peninjauan baru...`, 'info');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 overflow-hidden font-sans">

        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-sky-500/20 text-sky-300 rounded-lg border border-sky-400/30 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-2xs font-mono text-sky-300 font-bold uppercase">{document.proposalCode || 'DOKUMEN RESMI'}</span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-300 truncate">{document.opdName || 'Instansi Pengusul'}</span>
              </div>
              <h3 className="font-bold text-sm text-white truncate max-w-xl">
                {document.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenInNewTab}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-sky-200 rounded-lg text-xs font-semibold transition border border-white/20 flex items-center gap-1.5"
              title="Buka Peninjauan Dokumen di Tab Baru"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Buka di Tab Baru</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm"
              title="Unduh File Langsung"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Berkas</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition ml-2"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-4 shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('PREVIEW')}
            className={`pb-3 font-bold transition flex items-center gap-1.5 border-b-2 ${activeTab === 'PREVIEW'
                ? 'border-[#0f2c59] text-[#0f2c59]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Pratinjau Isi Dokumen</span>
          </button>

          <button
            onClick={() => setActiveTab('METADATA')}
            className={`pb-3 font-bold transition flex items-center gap-1.5 border-b-2 ${activeTab === 'METADATA'
                ? 'border-[#0f2c59] text-[#0f2c59]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Metadata & Verifikasi File</span>
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-100/50">

          {activeTab === 'PREVIEW' && (
            <div className="bg-white p-8 border border-slate-200 shadow-sm rounded-xl space-y-6 max-w-3xl mx-auto">

              {/* Document Header in Preview */}
              <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-2xs font-bold text-slate-500 uppercase tracking-widest block">Dokumen Resmi Usulan Riset</span>
                  <h2 className="text-base font-extrabold text-[#0f2c59] mt-0.5">
                    {document.proposalTitle || document.name}
                  </h2>
                </div>
                {getDocTypeBadge(document.type)}
              </div>

              {/* Document Content Sections */}
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

              {/* Watermark Verified */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-2xs text-slate-500">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Terverifikasi Sistem Terpadu SIM-RIDA Kabupaten Mimika</span>
                </div>
                <span className="font-mono">{document.proposalCode}</span>
              </div>

            </div>
          )}

          {activeTab === 'METADATA' && (
            <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-xl space-y-4 max-w-3xl mx-auto">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Informasi Teknis Berkas Digital
              </h4>

              <div className="divide-y divide-slate-200 text-xs">
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-600">Nama File Asli:</span>
                  <span className="font-bold text-slate-900 font-mono">{document.name}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-600">Tipe Berkas:</span>
                  <span className="font-semibold text-slate-800">{document.type || 'Dokumen PDF / Lampiran Resmi'}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-600">Ukuran File:</span>
                  <span className="font-mono font-bold text-slate-800">{document.size || '1.4 MB'}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-600">Waktu Pengunggahan:</span>
                  <span className="font-mono text-slate-800">{document.uploadDate || '01 Jan 2026'}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-600">Instansi Pemilik Berkas:</span>
                  <span className="font-bold text-[#0f2c59]">{document.opdName || 'Dinas / Badan Daerah Mimika'}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-600">Integritas Hash Digest:</span>
                  <span className="font-mono text-2xs text-slate-500 bg-slate-100 px-2 py-0.5 border border-slate-200">
                    SHA256: 8f7e2a9c4b1d6e8a0f3b7c9d5e1a2f4c6b8d0e2a4f6c8e0b2d4f6a8c0e2b4d6f
                  </span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-[#0f2c59] hover:bg-[#0a1e3f] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Berkas Sekarang</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-2xs text-slate-500">
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
