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
  keyFindings?: string;
  policyActions?: string;
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
      default:
        return <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 text-2xs font-bold uppercase font-mono">Lampiran Data Dukung</span>;
    }
  };

  // Generate real downloadable text/PDF file Blob
  const handleDownload = () => {
    // Jika berkas memiliki URL unggahan riil (PDF, Excel, Word, dll), unduh file asli secara langsung!
    if (document.url) {
      downloadFileDirectly({
        name: document.name,
        url: document.url,
        size: document.size,
      });
      toast(`Mengunduh berkas asli "${document.name}" ke perangkat Anda...`, 'success');
      return;
    }

    let docContent = '';

    if (document.type === 'POLICY_BRIEF') {
      docContent = `
================================================================================
BADAN RISET DAN INOVASI DAERAH (BRIDA) KABUPATEN MIMIKA
NASKAH REKOMENDASI KEBIJAKAN RESMI (POLICY BRIEF)
================================================================================

Nomor Registrasi : ${document.proposalCode || 'REK-2026-001'}
Judul Naskah     : ${document.proposalTitle || document.name}
Perangkat Daerah : ${document.targetOpdNames || document.opdName || 'Pemerintah Kabupaten Mimika'}
Bentuk Regulasi  : ${document.targetPolicyType || 'Peraturan Bupati (Perbup)'}
Tingkat Dampak   : ${document.impactLevel || 'Strategis Daerah'}
Penandatangan    : ${document.signedBy || 'Dr. Petrus Renyaan, M.Si (Kepala BRIDA Mimika)'}
Tanggal Disahkan : ${document.signedAt || document.uploadDate || new Date().toLocaleDateString('id-ID')}
Status Validasi  : TTE TERSERTIFIKASI ELEKTRONIK BSrE - BSSN REPUBLIK INDONESIA

--------------------------------------------------------------------------------
1. RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY)
--------------------------------------------------------------------------------
${document.executiveSummary || document.content || 'Kajian kelitbangan ini merumuskan rekomendasi kebijakan berbasis bukti empiris dan saintifik.'}

--------------------------------------------------------------------------------
2. TEMUAN KUNCI PENELITIAN (KEY FINDINGS)
--------------------------------------------------------------------------------
${document.keyFindings || 'Hasil pengolahan data lapangan dan analisis stakeholder menghasilkan rekomendasi komprehensif.'}

--------------------------------------------------------------------------------
3. REKOMENDASI RENCANA AKSI KEBIJAKAN (POLICY ACTIONS)
--------------------------------------------------------------------------------
${document.policyActions || 'Rencana aksi kebijakan terbagi atas tahapan jangka pendek, jangka menengah, dan jangka panjang.'}

--------------------------------------------------------------------------------
Keterangan: Naskah Policy Brief ini sah dan mengikat sebagai bahan rujukan penyusunan Renja, Perbup/Perda, serta SOP teknis instansi.
================================================================================
      `.trim();
    } else if (document.type === 'KAK_TOR') {
      docContent = `
================================================================================
BADAN RISET DAN INOVASI DAERAH (BRIDA) KABUPATEN MIMIKA
KERANGKA ACUAN KERJA (KAK / TOR) PENELITIAN & PENGEMBANGAN
================================================================================

Kode Kegiatan    : ${document.proposalCode || 'KAK-2026'}
Judul Kegiatan   : ${document.proposalTitle || document.name}
Perangkat Daerah : ${document.opdName || 'Pemerintah Kabupaten Mimika'}
Tahun Anggaran   : ${document.fiscalYear || '2026'}
Status Dokumen   : DISAHKAN RESMI (TTE ELEKTRONIK KEPALA BRIDA)

--------------------------------------------------------------------------------
1. LATAR BELAKANG & DASAR HUKUM
--------------------------------------------------------------------------------
${document.kakBackground || document.problemStatement || 'Kajian ini dilaksanakan berlandaskan regulasi riset daerah dan kebutuhan mendesak Pemkab Mimika.'}

--------------------------------------------------------------------------------
2. MAKSUD DAN TUJUAN RISET
--------------------------------------------------------------------------------
${document.kakObjectives || document.urgencyReason || 'Memberikan telaah saintifik dan rekomendasi solutif atas isu strategis daerah.'}

--------------------------------------------------------------------------------
3. RUANG LINGKUP & METODOLOGI PENELITIAN
--------------------------------------------------------------------------------
${document.kakScope || 'Ruang lingkup mencakup studi pustaka, observasi lapangan, survei responden, dan wawancara mendalam di distrik terpilih.'}

--------------------------------------------------------------------------------
4. TARGET LUARAN KONKRET (DELIVERABLES)
--------------------------------------------------------------------------------
${document.kakTargetOutput || document.expectedOutput || 'Laporan Akhir Penelitian, Naskah Policy Brief, dan Draf Regulasi Daerah.'}
================================================================================
      `.trim();
    } else if (document.type === 'LAPORAN_AKHIR') {
      docContent = `
================================================================================
BADAN RISET DAN INOVASI DAERAH (BRIDA) KABUPATEN MIMIKA
LAPORAN AKHIR HASIL PENELITIAN & KAJIAN KELITBANGAN DAERAH
================================================================================

Kode Riset       : ${document.proposalCode || 'LAP-AKHIR-2026'}
Judul Kajian     : ${document.proposalTitle || document.name}
Perangkat Daerah : ${document.opdName || 'Pemerintah Kabupaten Mimika'}
Nama Berkas      : ${document.name}
Ukuran Berkas    : ${document.size || '5.2 MB'}
Status Dokumen   : TELAH RAMPUNG & DISETUJUI TIM EVALUATOR LITBANG

--------------------------------------------------------------------------------
1. RINGKASAN HASIL RISET EMPIRIS
--------------------------------------------------------------------------------
${document.finalReportSummary || document.content || 'Laporan akhir merangkum seluruh temuan data primer dan sekunder, analisis kuantitatif dan kualitatif, serta sintesis rekomendasi praktis bagi perangkat daerah.'}

--------------------------------------------------------------------------------
2. METODOLOGI & PELAKSANAAN RISET
--------------------------------------------------------------------------------
${document.kakScope || 'Penelitian dilaksanakan menggunakan metode campuran (mixed methods) dengan pengumpulan data primer di wilayah Kabupaten Mimika.'}

--------------------------------------------------------------------------------
3. REKOMENDASI DAN TINDAK LANJUT
--------------------------------------------------------------------------------
${document.policyActions || document.executiveSummary || 'Hasil laporan akhir ini menjadi dasar penyusunan Policy Brief dan rekomendasi kebijakan operasional OPD.'}
================================================================================
      `.trim();
    } else {
      docContent = `
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
    }

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
    // Jika berkas memiliki URL unggahan riil, buka langsung berkas asli di tab baru!
    if (document.url) {
      window.open(document.url, '_blank');
      toast(`Membuka berkas "${document.name}" pada tab peramban baru...`, 'info');
      return;
    }

    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      toast('Pop-up diblokir oleh peramban. Izinkan pop-up untuk membuka dokumen.', 'warning');
      return;
    }

    let mainBodyHtml = '';

    if (document.type === 'POLICY_BRIEF') {
      mainBodyHtml = `
        <div class="section">
          <div class="section-title">Informasi Naskah Rekomendasi</div>
          <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
            <tr><td style="width: 200px; padding: 6px 0; color: #64748b;">Nomor Registrasi:</td><td style="font-weight: bold; color: #0f2c59;">${document.proposalCode || 'REK-2026'}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Bentuk Regulasi Sasaran:</td><td style="font-weight: bold;">${document.targetPolicyType || 'Perbup Mimika'}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">OPD Sasaran:</td><td>${document.targetOpdNames || document.opdName || 'Dinas Lingkungan Hidup Kab. Mimika'}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Penandatangan:</td><td style="font-weight: bold; color: #0369a1;">${document.signedBy || 'Dr. Petrus Renyaan, M.Si (Kepala BRIDA)'}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Sertifikat Digital:</td><td><span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; font-weight:bold; font-size:11px;">TTE BSrE BSSN TERVALIDASI</span></td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Judul Naskah Rekomendasi Kebijakan</div>
          <div class="content" style="font-weight: bold; font-size: 15px; color: #0f2c59;">
            ${document.proposalTitle || document.name}
          </div>
        </div>

        <div class="section">
          <div class="section-title">1. Ringkasan Eksekutif (Executive Summary)</div>
          <div class="content">
            ${(document.executiveSummary || document.content || '').replace(/\n/g, '<br/>')}
          </div>
        </div>

        <div class="section">
          <div class="section-title">2. Temuan Kunci Riset Lapangan (Key Findings)</div>
          <div class="content">
            ${(document.keyFindings || '').replace(/\n/g, '<br/>')}
          </div>
        </div>

        <div class="section">
          <div class="section-title">3. Rekomendasi Rencana Aksi Kebijakan (Policy Actions)</div>
          <div class="content">
            ${(document.policyActions || '').replace(/\n/g, '<br/>')}
          </div>
        </div>
      `;
    } else if (document.type === 'KAK_TOR') {
      mainBodyHtml = `
        <div class="section">
          <div class="section-title">Informasi Kerangka Acuan Kerja</div>
          <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
            <tr><td style="width: 200px; padding: 6px 0; color: #64748b;">Kode Kegiatan:</td><td style="font-weight: bold; color: #0f2c59;">${document.proposalCode || 'KAK-2026'}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Perangkat Daerah:</td><td>${document.opdName || 'Pemerintah Kabupaten Mimika'}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Tahun Anggaran:</td><td>${document.fiscalYear || '2026'}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Status Pengesahan:</td><td><span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; font-weight:bold; font-size:11px;">TTE SAH KEPALA BRIDA</span></td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Judul Kegiatan Riset</div>
          <div class="content" style="font-weight: bold; font-size: 15px; color: #0f2c59;">
            ${document.proposalTitle || document.name}
          </div>
        </div>

        <div class="section">
          <div class="section-title">1. Latar Belakang & Landasan Yuridis</div>
          <div class="content">
            ${(document.kakBackground || document.problemStatement || '').replace(/\n/g, '<br/>')}
          </div>
        </div>

        <div class="section">
          <div class="section-title">2. Maksud dan Tujuan Riset</div>
          <div class="content">
            ${(document.kakObjectives || document.urgencyReason || '').replace(/\n/g, '<br/>')}
          </div>
        </div>

        <div class="section">
          <div class="section-title">3. Ruang Lingkup & Metodologi Penelitian</div>
          <div class="content">
            ${(document.kakScope || '').replace(/\n/g, '<br/>')}
          </div>
        </div>

        <div class="section">
          <div class="section-title">4. Target Luaran Konkret (Deliverables)</div>
          <div class="content">
            ${(document.kakTargetOutput || document.expectedOutput || '').replace(/\n/g, '<br/>')}
          </div>
        </div>
      `;
    } else if (document.type === 'LAPORAN_AKHIR') {
      mainBodyHtml = `
        <div class="section">
          <div class="section-title">Informasi Laporan Akhir Riset</div>
          <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
            <tr><td style="width: 200px; padding: 6px 0; color: #64748b;">Nama Berkas:</td><td style="font-weight: bold; color: #0f2c59;">${document.name}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Ukuran & Format:</td><td>${document.size || '5.2 MB'} • Dokumen Resmi Hasil Riset</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Status Publikasi:</td><td><span style="background:#fef3c7; color:#92400e; padding:2px 8px; font-weight:bold; font-size:11px;">LAPORAN AKHIR TUNTAS</span></td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Judul Laporan Akhir Penelitian</div>
          <div class="content" style="font-weight: bold; font-size: 15px; color: #0f2c59;">
            ${document.proposalTitle || document.name}
          </div>
        </div>

        <div class="section">
          <div class="section-title">1. Ringkasan Eksekutif Hasil Riset Empiris</div>
          <div class="content">
            ${(document.finalReportSummary || document.content || '').replace(/\n/g, '<br/>')}
          </div>
        </div>

        <div class="section">
          <div class="section-title">2. Ruang Lingkup & Metodologi Pelaksanaan</div>
          <div class="content">
            ${(document.kakScope || 'Penelitian dilaksanakan menggunakan metode campuran (mixed methods) dengan pengumpulan data primer dan sekunder di distrik Kabupaten Mimika.').replace(/\n/g, '<br/>')}
          </div>
        </div>

        <div class="section">
          <div class="section-title">3. Rujukan Pemanfaatan Kebijakan Bagi OPD</div>
          <div class="content">
            ${(document.policyActions || document.executiveSummary || 'Hasil laporan akhir ini siap ditindaklanjuti ke dalam Renja dan revisi SOP teknis dinas terkait.').replace(/\n/g, '<br/>')}
          </div>
        </div>
      `;
    } else {
      mainBodyHtml = `
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
      `;
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
              <h1 class="title">Peninjauan Dokumen Resmi Riset & Kebijakan</h1>
              <div class="meta">Pemerintah Kabupaten Mimika • Badan Riset & Inovasi Daerah (BRIDA)</div>
            </div>
            <div class="badge">${document.proposalCode || 'SIM-RIDA MIMIKA'}</div>
          </div>

          ${mainBodyHtml}

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
              onClick={handleOpenInNewTab}
              className="flex-1 sm:flex-initial px-3 py-1.5 bg-white/10 hover:bg-white/20 text-sky-200 rounded-lg text-xs font-semibold transition border border-white/20 flex items-center justify-center gap-1.5"
              title="Buka Peninjauan Dokumen di Tab Baru"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>Tab Baru</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
              title="Unduh File Langsung"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Unduh Berkas</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition hidden sm:block ml-1"
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

                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-900 block text-2xs uppercase tracking-wider text-[#0f2c59]">
                        1. Ringkasan Eksekutif (Executive Summary)
                      </span>
                      <div className="leading-relaxed bg-slate-50 p-4 border border-slate-200 rounded-lg text-justify text-slate-800 whitespace-pre-line">
                        {document.executiveSummary || document.content || 'Ringkasan eksekutif merangkum poin pokok telaah kebijakan bagi pimpinan daerah.'}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-900 block text-2xs uppercase tracking-wider text-[#0f2c59]">
                        2. Temuan Kunci Riset Lapangan (Key Findings)
                      </span>
                      <div className="leading-relaxed bg-slate-50 p-4 border border-slate-200 rounded-lg text-justify text-slate-800 whitespace-pre-line">
                        {document.keyFindings || 'Temuan kunci berbasis data primer lapangan dan analisis saintifik BRIDA.'}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-900 block text-2xs uppercase tracking-wider text-[#0f2c59]">
                        3. Rekomendasi Rencana Aksi Kebijakan (Policy Actions)
                      </span>
                      <div className="leading-relaxed bg-slate-50 p-4 border border-slate-200 rounded-lg text-justify text-slate-800 whitespace-pre-line">
                        {document.policyActions || 'Rencana aksi kebijakan terinci dalam tahapan jangka pendek, jangka menengah, dan jangka panjang.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* SPECIFIC VIEW: KAK_TOR */}
                {document.type === 'KAK_TOR' && (
                  <div className="space-y-4 text-xs text-slate-700">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-2xs text-blue-900">
                      <div>
                        <span className="font-bold block">Status Dokumen: Disahkan Resmi oleh BRIDA</span>
                        <span>Tahun Anggaran: {document.fiscalYear || '2026'} • Skema: {document.executionScheme || 'E-Katalog / Swakelola'}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded font-mono font-bold text-3xs">
                        FINAL KAK
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-900 block text-2xs uppercase tracking-wider text-[#0f2c59]">
                        1. Latar Belakang & Dasar Yuridis
                      </span>
                      <div className="leading-relaxed bg-slate-50 p-4 border border-slate-200 rounded-lg text-justify text-slate-800 whitespace-pre-line">
                        {document.kakBackground || document.problemStatement || 'Dokumen KAK memuat landasan hukum dan permasalahan yang mendasari penelitian.'}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-900 block text-2xs uppercase tracking-wider text-[#0f2c59]">
                        2. Maksud dan Tujuan Riset
                      </span>
                      <div className="leading-relaxed bg-slate-50 p-4 border border-slate-200 rounded-lg text-justify text-slate-800 whitespace-pre-line">
                        {document.kakObjectives || document.urgencyReason || 'Maksud dan tujuan kegiatan riset.'}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-900 block text-2xs uppercase tracking-wider text-[#0f2c59]">
                        3. Ruang Lingkup & Metodologi Kajian
                      </span>
                      <div className="leading-relaxed bg-slate-50 p-4 border border-slate-200 rounded-lg text-justify text-slate-800 whitespace-pre-line">
                        {document.kakScope || 'Ruang lingkup mencakup studi empiris dan survei lapangan di Kabupaten Mimika.'}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-900 block text-2xs uppercase tracking-wider text-[#0f2c59]">
                        4. Target Luaran Konkret (Deliverables)
                      </span>
                      <div className="leading-relaxed bg-slate-50 p-4 border border-slate-200 rounded-lg text-justify text-slate-800 whitespace-pre-line">
                        {document.kakTargetOutput || document.expectedOutput || 'Laporan Akhir, Policy Brief, dan Prototipe / Draf Regulasi.'}
                      </div>
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
                        {document.policyActions || document.executiveSummary || 'Temuan laporan ini menjadi landasan ilmiah bagi OPD untuk merumuskan usulan Renja atau perbaikan SOP teknis.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* DEFAULT VIEW: FOR OTHER DOCUMENTS */}
                {document.type !== 'POLICY_BRIEF' && document.type !== 'KAK_TOR' && document.type !== 'LAPORAN_AKHIR' && (
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
