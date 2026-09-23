'use client';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface KakPdfData {
  proposalCode: string;
  proposalTitle: string;
  opdName: string;
  fiscalYear?: number | string;
  allocatedBudget: number;
  durationMonths: number;
  kakStatus: string;
  background: string;
  objectives: string;
  scopeAndMethodology: string;
  targetOutput: string;
  signedBy?: string;
  signedNip?: string;
  certificateNumber?: string;
}

export interface PolicyBriefPdfData {
  officialNumber?: string;
  title: string;
  targetOpdNames?: string;
  targetPolicyType?: string;
  impactLevel?: string;
  subject?: string;
  executiveSummary: string;
  background: string;
  policyRecommendations: string;
  conclusion: string;
  correlatedDocs?: string;
  isFinalized?: boolean;
  signedBy?: string;
  signedNip?: string;
  certificateNumber?: string;
}

export interface GeneralDocPdfData {
  title: string;
  typeBadge?: string;
  registrationNumber?: string;
  targetAgency?: string;
  dateStr?: string;
  sections: Array<{
    heading: string;
    content: string;
  }>;
  metadata?: Array<{
    label: string;
    value: string;
  }>;
  signedBy?: string;
  signedRole?: string;
  certificateNumber?: string;
}

/**
 * Membuka jendela pop-up pratinjau PDF secara instan saat user klik tombol
 * untuk menghindari pemblokiran pop-up oleh browser.
 */
export function openPdfLoadingWindow(): Window | null {
  if (typeof window === 'undefined') return null;
  const newWin = window.open('about:blank', '_blank');
  if (newWin) {
    try {
      newWin.document.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <title>Memuat Dokumen PDF Resmi - SIM-RIDA Mimika</title>
          <style>
            body {
              margin: 0;
              background-color: #525659;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #ffffff;
            }
            .card {
              background: #ffffff;
              color: #0f2c59;
              padding: 32px 40px;
              border-radius: 12px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 420px;
            }
            .spinner {
              width: 36px;
              height: 36px;
              border: 4px solid #e2e8f0;
              border-top-color: #0284c7;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
              margin: 0 auto 16px auto;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            h3 { margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #0f2c59; }
            p { margin: 0; font-size: 12px; color: #64748b; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="spinner"></div>
            <h3>Menyiapkan Dokumen PDF Resmi...</h3>
            <p>Sistem sedang merender naskah resmi, tata letak multi-halaman A4, dan sertifikasi TTE BSrE.</p>
          </div>
        </body>
        </html>
      `);
      newWin.document.close();
    } catch {
      // Abaikan error lintas origin jika ada
    }
  }
  return newWin;
}

/**
 * Menampilkan PDF di dalam jendela tab baru menggunakan native Chrome PDF viewer.
 * Menggunakan iframe terisolasi agar Chrome tidak memblokir navigasi top-level blob:.
 */
export function displayPdfInWindow(targetWindow: Window, blobUrl: string, title: string) {
  try {
    targetWindow.document.open();
    targetWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #525659;
          }
          iframe {
            border: none;
            width: 100%;
            height: 100%;
            display: block;
          }
        </style>
      </head>
      <body>
        <iframe src="${blobUrl}#toolbar=1&navpanes=0" type="application/pdf"></iframe>
      </body>
      </html>
    `);
    targetWindow.document.close();
  } catch (err) {
    console.warn('Gagal memuat iframe pada target window, mencoba navigasi langsung:', err);
    try {
      targetWindow.location.href = blobUrl;
    } catch (e) {
      window.open(blobUrl, '_blank');
    }
  }
}

/**
 * Menghasilkan PDF dari string HTML terisolasi dengan resolusi tinggi (A4 portrait)
 * menggunakan html2canvas langsung pada koordinat (0,0) di layer latar belakang (z-index: -99999).
 */
async function renderHtmlToPdf(
  htmlContent: string,
  filename: string
): Promise<{ doc: jsPDF; blob: Blob; blobUrl: string; download: () => void }> {
  // Buat kontainer di posisi (0, 0) tersembunyi di belakang layar
  // PENTING: Jangan gunakan left: -9999px karena html2canvas akan menghasilkan kanvas kosong!
  const container = document.createElement('div');
  container.id = 'pdf-render-temp-container';
  container.style.position = 'fixed';
  container.style.top = '0px';
  container.style.left = '0px';
  container.style.width = '794px'; // Lebar standar A4 pada 96 DPI (210mm)
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#000000';
  container.style.zIndex = '-99999';
  container.style.opacity = '1'; // Harus 1 agar html2canvas tidak mengabaikan elemen
  container.style.visibility = 'visible';
  container.style.pointerEvents = 'none';
  container.innerHTML = htmlContent;

  document.body.appendChild(container);

  try {
    // Berikan jeda 150ms agar DOM selesai layout dan font termuat sempurna
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Render kanvas menggunakan html2canvas dengan resolusi tajam (scale: 2)
    const canvas = await html2canvas(container, {
      scale: 2, // 2x resolusi retina (setara ~300 DPI)
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      width: 794,
      windowWidth: 794,
    });

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const imgWidth = 210; // Lebar kertas A4 dalam mm
    const pageHeight = 297; // Tinggi kertas A4 dalam mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    let heightLeft = imgHeight;
    let position = 0;

    // Tambahkan halaman pertama
    doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Tambahkan halaman berikutnya jika naskah multi-halaman
    while (heightLeft > 5) {
      position -= pageHeight;
      doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    const download = () => {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    return { doc, blob, blobUrl, download };
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Helper HTML Kop Surat Resmi Ganda Mimika & BRIDA
 */
function getOfficialKopHtml(): string {
  return `
    <div style="border-bottom: 4px double #000000; padding-bottom: 12px; margin-bottom: 16px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="margin-bottom: 4px;">
        <span style="font-size: 15px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; color: #000000; display: block;">
          PEMERINTAH DAERAH KABUPATEN MIMIKA
        </span>
        <span style="font-size: 13px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: #0f2c59; display: block; margin-top: 2px;">
          BADAN RISET DAN INOVASI DAERAH (BRIDA)
        </span>
      </div>
      <div style="font-size: 9px; color: #475569; line-height: 1.4;">
        Jl. Cenderawasih, SP 3, Distrik Kuala Kencana, Kabupaten Mimika, Papua Tengah<br/>
        Laman: brida.mimikakab.go.id • Pos-el: brida@mimikakab.go.id
      </div>
    </div>
  `;
}

/**
 * Helper HTML Blok TTE Resmi BSrE
 */
function getOfficialTteHtml(
  signedBy: string = 'Dr. Petrus Renyaan, M.Si.',
  signedNip: string = '19730412 199803 1 001',
  certNumber: string = 'DS-2026-BRIDA-MIMIKA',
  isFinal: boolean = true
): string {
  return `
    <div style="page-break-inside: avoid; break-inside: avoid; margin-top: 28px; display: flex; justify-content: flex-end; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="width: 250px; text-align: center;">
        <div style="font-size: 10.5px; font-weight: 700; color: #000000; margin-bottom: 8px;">
          Kepala Badan Riset dan Inovasi Daerah (BRIDA)
        </div>
        
        <div style="border: 1px dashed #3b82f6; background-color: #eff6ff; padding: 10px; border-radius: 4px; margin-bottom: 8px; text-align: center;">
          <div style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #1e3a8a; letter-spacing: 0.03em;">
            ${isFinal ? 'DITANDATANGANI SECARA ELEKTRONIK (TTE)' : '[ DRAF NASKAH LITBANG ]'}
          </div>
          <div style="font-size: 8px; color: #475569; margin-top: 3px; font-family: monospace;">
            Sertifikasi BSrE - BSSN Republik Indonesia
          </div>
          <div style="font-size: 7.5px; font-weight: 700; color: #172554; font-family: monospace; margin-top: 2px;">
            ${certNumber}
          </div>
        </div>

        <div>
          <div style="font-size: 11px; font-weight: 900; color: #000000; text-decoration: underline;">
            ${signedBy}
          </div>
          <div style="font-size: 8.5px; color: #475569; font-family: monospace; margin-top: 2px;">
            NIP. ${signedNip}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 1. GENERATE DOKUMEN RESMI KERANGKA ACUAN KERJA (KAK) PDF
 */
export async function generateKakPdf(
  data: KakPdfData,
  targetWindow?: Window | null
): Promise<{ doc: jsPDF; blob: Blob; blobUrl: string; download: () => void }> {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedBudget = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(data.allocatedBudget || 0);

  const htmlContent = `
    <div style="width: 794px; min-height: 1123px; padding: 44px 52px; box-sizing: border-box; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; line-height: 1.6; font-size: 11px;">
      
      <!-- HEADER BLOK (Hanya di Halaman 1) -->
      <div style="page-break-after: avoid; break-after: avoid; margin-bottom: 20px;">
        ${getOfficialKopHtml()}

        <!-- Meta Persuratan -->
        <table style="width: 100%; font-size: 10px; border-collapse: collapse; margin-bottom: 12px;">
          <tr>
            <td style="width: 60%; vertical-align: top;">
              <table style="border-collapse: collapse; font-size: 10px;">
                <tr><td style="font-weight: 700; width: 65px; padding: 2px 0;">Nomor</td><td>: 070/BRIDA-MMK/KAK/${new Date().getFullYear()}/${data.proposalCode || '001'}</td></tr>
                <tr><td style="font-weight: 700; padding: 2px 0;">Sifat</td><td>: Penting / Kerangka Acuan Kerja</td></tr>
                <tr><td style="font-weight: 700; padding: 2px 0;">Lampiran</td><td>: 1 (Satu) Berkas Naskah KAK</td></tr>
                <tr><td style="font-weight: 700; padding: 2px 0;">Perihal</td><td>: Kerangka Acuan Kerja (KAK) Riset Daerah</td></tr>
              </table>
            </td>
            <td style="width: 40%; vertical-align: top; text-align: right;">
              <div>Mimika, ${currentDate}</div>
              <div style="margin-top: 6px; font-weight: 700;">Perangkat Daerah Pemrakarsa:</div>
              <div style="font-weight: 700; color: #0f2c59;">${data.opdName || 'Pemerintah Kabupaten Mimika'}</div>
              <div style="color: #64748b;">di Tempat</div>
            </td>
          </tr>
        </table>

        <!-- Ringkasan Anggaran & Status -->
        <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 6px 0; margin-bottom: 14px; font-size: 9.5px; color: #334155; display: flex; justify-content: space-between;">
          <span><strong>Tahun Anggaran:</strong> ${data.fiscalYear || new Date().getFullYear()}</span>
          <span><strong>Pagu Anggaran:</strong> ${formattedBudget}</span>
          <span><strong>Durasi:</strong> ${data.durationMonths || 3} Bulan</span>
          <span><strong>Status:</strong> ${data.kakStatus === 'FINAL' ? 'FINAL TERVERIFIKASI' : 'DRAF KAK'}</span>
        </div>

        <!-- Judul Naskah KAK -->
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="font-size: 13px; font-weight: 900; text-transform: uppercase; color: #000000; letter-spacing: 0.02em;">
            ${data.proposalTitle || 'KERANGKA ACUAN KERJA RISET DAERAH'}
          </div>
          <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">
            Kerangka Acuan Kerja (Terms of Reference) Riset Daerah Kabupaten Mimika
          </div>
        </div>
      </div>

      <!-- ISI BAB I - BAB IV (Mengalir Alami Tanpa Border Frame Seperti Word) -->
      <div style="font-size: 11px; color: #1e293b; text-align: justify; line-height: 1.65;">
        
        <div style="margin-bottom: 16px;">
          <div style="font-weight: 800; font-size: 11px; text-transform: uppercase; color: #000000; margin-bottom: 4px; page-break-after: avoid; break-after: avoid;">
            BAB I. Latar Belakang & Urgensi Penelitian
          </div>
          <div style="white-space: pre-line;">
            ${data.background || '(Uraian latar belakang belum diisi)'}
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="font-weight: 800; font-size: 11px; text-transform: uppercase; color: #000000; margin-bottom: 4px; page-break-after: avoid; break-after: avoid;">
            BAB II. Maksud, Tujuan & Sasaran Riset
          </div>
          <div style="white-space: pre-line;">
            ${data.objectives || '(Uraian maksud dan tujuan belum diisi)'}
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="font-weight: 800; font-size: 11px; text-transform: uppercase; color: #000000; margin-bottom: 4px; page-break-after: avoid; break-after: avoid;">
            BAB III. Ruang Lingkup & Metodologi Kajian
          </div>
          <div style="white-space: pre-line;">
            ${data.scopeAndMethodology || '(Uraian ruang lingkup dan metodologi belum diisi)'}
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="font-weight: 800; font-size: 11px; text-transform: uppercase; color: #000000; margin-bottom: 4px; page-break-after: avoid; break-after: avoid;">
            BAB IV. Target Luaran Kebijakan (Deliverables)
          </div>
          <div style="white-space: pre-line;">
            ${data.targetOutput || '(Uraian target luaran belum diisi)'}
          </div>
        </div>

      </div>

      <!-- TTE PENGESAHAN KEPALA BRIDA (Halaman Akhir Tepat di Bawah Paragraf) -->
      ${getOfficialTteHtml(
        data.signedBy || 'Dr. Petrus Renyaan, M.Si.',
        data.signedNip || '19730412 199803 1 001',
        data.certificateNumber || `DS-KAK-${data.proposalCode || '2026'}-BRIDA`,
        data.kakStatus === 'FINAL'
      )}

    </div>
  `;

  const cleanTitle = (data.proposalTitle || 'KAK_Riset').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
  const filename = `Kerangka_Acuan_Kerja_KAK_${data.proposalCode || '2026'}_${cleanTitle}.pdf`;

  const result = await renderHtmlToPdf(htmlContent, filename);

  if (targetWindow && !targetWindow.closed) {
    displayPdfInWindow(targetWindow, result.blobUrl, filename);
  }

  return result;
}

/**
 * 2. GENERATE POLICY BRIEF / NASKAH REKOMENDASI KEBIJAKAN PDF
 */
export async function generatePolicyBriefPdf(
  data: PolicyBriefPdfData,
  targetWindow?: Window | null
): Promise<{ doc: jsPDF; blob: Blob; blobUrl: string; download: () => void }> {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const htmlContent = `
    <div style="width: 794px; min-height: 1123px; padding: 44px 52px; box-sizing: border-box; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; line-height: 1.6; font-size: 11px;">
      
      <!-- HEADER BLOK -->
      <div style="page-break-after: avoid; break-after: avoid; margin-bottom: 20px;">
        ${getOfficialKopHtml()}

        <!-- Meta Persuratan -->
        <table style="width: 100%; font-size: 10px; border-collapse: collapse; margin-bottom: 12px;">
          <tr>
            <td style="width: 60%; vertical-align: top;">
              <table style="border-collapse: collapse; font-size: 10px;">
                <tr><td style="font-weight: 700; width: 65px; padding: 2px 0;">Nomor</td><td>: ${data.officialNumber || '070/BRIDA-MMK/' + new Date().getFullYear() + '/042'}</td></tr>
                <tr><td style="font-weight: 700; padding: 2px 0;">Sifat</td><td>: Penting / Naskah Rekomendasi Kebijakan</td></tr>
                <tr><td style="font-weight: 700; padding: 2px 0;">Lampiran</td><td>: 1 (Satu) Berkas Policy Brief</td></tr>
                <tr><td style="font-weight: 700; padding: 2px 0;">Perihal</td><td>: ${data.subject || data.title}</td></tr>
              </table>
            </td>
            <td style="width: 40%; vertical-align: top; text-align: right;">
              <div>Mimika, ${currentDate}</div>
              <div style="margin-top: 6px; font-weight: 700;">Kepada Yth:</div>
              <div style="font-weight: 700; color: #0f2c59;">${data.targetOpdNames || 'Kepala Perangkat Daerah Terkait'}</div>
              <div style="color: #64748b;">di Tempat</div>
            </td>
          </tr>
        </table>

        <!-- Metadata Regulasi Sasaran & Dampak -->
        <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 6px 0; margin-bottom: 14px; font-size: 9.5px; color: #334155; display: flex; justify-content: space-between;">
          <span><strong>Bentuk Regulasi Sasaran:</strong> ${data.targetPolicyType || 'Peraturan Bupati (Perbup)'}</span>
          <span><strong>Tingkat Dampak Kebijakan:</strong> ${data.impactLevel || 'Strategis Daerah'}</span>
          <span><strong>Validasi:</strong> TTE Tersertifikasi BSrE</span>
        </div>

        <!-- Judul Naskah Rekomendasi -->
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="font-size: 13px; font-weight: 900; text-transform: uppercase; color: #000000; letter-spacing: 0.02em;">
            ${data.title || 'NASKAH REKOMENDASI KEBIJAKAN (POLICY BRIEF)'}
          </div>
          <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">
            Naskah Rekomendasi Hasil Riset dan Inovasi Daerah (SIM-RIDA) Kabupaten Mimika
          </div>
        </div>
      </div>

      <!-- ISI 4 BAGIAN BAKU POLICY BRIEF + BUKTI TERKORELASI -->
      <div style="font-size: 11px; color: #1e293b; text-align: justify; line-height: 1.65;">
        
        <div style="margin-bottom: 16px;">
          <div style="font-weight: 800; font-size: 11px; text-transform: uppercase; color: #000000; margin-bottom: 4px; page-break-after: avoid; break-after: avoid;">
            A. Ringkasan Eksekutif (Executive Summary)
          </div>
          <div style="white-space: pre-line;">
            ${data.executiveSummary || '(Ringkasan eksekutif belum tersedia)'}
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="font-weight: 800; font-size: 11px; text-transform: uppercase; color: #000000; margin-bottom: 4px; page-break-after: avoid; break-after: avoid;">
            B. Latar Belakang (Background)
          </div>
          <div style="white-space: pre-line;">
            ${data.background || '(Latar belakang belum tersedia)'}
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="font-weight: 800; font-size: 11px; text-transform: uppercase; color: #000000; margin-bottom: 4px; page-break-after: avoid; break-after: avoid;">
            C. Rekomendasi Kebijakan (Policy Recommendations)
          </div>
          <div style="white-space: pre-line;">
            ${data.policyRecommendations || '(Rekomendasi kebijakan belum tersedia)'}
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="font-weight: 800; font-size: 11px; text-transform: uppercase; color: #000000; margin-bottom: 4px; page-break-after: avoid; break-after: avoid;">
            D. Kesimpulan (Conclusion)
          </div>
          <div style="white-space: pre-line;">
            ${data.conclusion || '(Kesimpulan belum tersedia)'}
          </div>
        </div>

        ${data.correlatedDocs ? `
          <div style="margin-bottom: 16px;">
            <div style="font-weight: 800; font-size: 11px; text-transform: uppercase; color: #000000; margin-bottom: 4px; page-break-after: avoid; break-after: avoid;">
              E. Dokumen Bukti yang Dikorelasikan ke Sistem
            </div>
            <div style="white-space: pre-line; color: #334155;">
              ${data.correlatedDocs}
            </div>
          </div>
        ` : ''}

      </div>

      <!-- TTE PENGESAHAN KEPALA BRIDA -->
      ${getOfficialTteHtml(
        data.signedBy || 'Dr. Petrus Renyaan, M.Si.',
        data.signedNip || '19730412 199803 1 001',
        data.certificateNumber || 'DS-2026-0001',
        data.isFinalized ?? true
      )}

    </div>
  `;

  const cleanTitle = (data.title || 'Policy_Brief').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
  const filename = `Policy_Brief_Rekomendasi_${cleanTitle}.pdf`;

  const result = await renderHtmlToPdf(htmlContent, filename);

  if (targetWindow && !targetWindow.closed) {
    displayPdfInWindow(targetWindow, result.blobUrl, filename);
  }

  return result;
}

/**
 * 3. GENERATE DOKUMEN GENERAL RESMI (Laporan Akhir, SK Kerjasama, Dokumen Usulan) PDF
 */
export async function generateGeneralDocPdf(
  data: GeneralDocPdfData,
  targetWindow?: Window | null
): Promise<{ doc: jsPDF; blob: Blob; blobUrl: string; download: () => void }> {
  const currentDate = data.dateStr || new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const metadataHtml = data.metadata && data.metadata.length > 0 ? `
    <table style="width: 100%; font-size: 10px; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #cbd5e1;">
      ${data.metadata.map((item) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="width: 200px; padding: 4px 8px; background: #f8fafc; font-weight: 700; color: #334155;">${item.label}</td>
          <td style="padding: 4px 8px; color: #0f172a;">${item.value}</td>
        </tr>
      `).join('')}
    </table>
  ` : '';

  const sectionsHtml = data.sections.map((sec) => `
    <div style="margin-bottom: 16px;">
      <div style="font-weight: 800; font-size: 11px; text-transform: uppercase; color: #000000; margin-bottom: 4px; page-break-after: avoid; break-after: avoid;">
        ${sec.heading}
      </div>
      <div style="white-space: pre-line;">
        ${sec.content}
      </div>
    </div>
  `).join('');

  const htmlContent = `
    <div style="width: 794px; min-height: 1123px; padding: 44px 52px; box-sizing: border-box; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; line-height: 1.6; font-size: 11px;">
      
      <!-- HEADER BLOK -->
      <div style="page-break-after: avoid; break-after: avoid; margin-bottom: 20px;">
        ${getOfficialKopHtml()}

        <!-- Info Registrasi Dokumen -->
        <table style="width: 100%; font-size: 10px; border-collapse: collapse; margin-bottom: 12px;">
          <tr>
            <td style="width: 60%; vertical-align: top;">
              <table style="border-collapse: collapse; font-size: 10px;">
                <tr><td style="font-weight: 700; width: 85px; padding: 2px 0;">No. Registrasi</td><td>: ${data.registrationNumber || 'SIMRIDA/2026/DOC'}</td></tr>
                <tr><td style="font-weight: 700; padding: 2px 0;">Kategori Berkas</td><td>: ${data.typeBadge || 'Dokumen Resmi Kelitbangan'}</td></tr>
                <tr><td style="font-weight: 700; padding: 2px 0;">Perangkat Daerah</td><td>: ${data.targetAgency || 'Pemerintah Kabupaten Mimika'}</td></tr>
              </table>
            </td>
            <td style="width: 40%; vertical-align: top; text-align: right;">
              <div>Mimika, ${currentDate}</div>
              <div style="margin-top: 4px; font-weight: 700; color: #0369a1;">DOKUMEN RESMI TERSERTIFIKASI</div>
              <div style="color: #64748b;">Portal SIM-RIDA Mimika</div>
            </td>
          </tr>
        </table>

        <!-- Judul Dokumen -->
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="font-size: 13px; font-weight: 900; text-transform: uppercase; color: #000000; letter-spacing: 0.02em;">
            ${data.title}
          </div>
          <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">
            Dokumen Resmi Hasil Riset dan Inovasi Daerah (SIM-RIDA) Kabupaten Mimika
          </div>
        </div>

        ${metadataHtml}
      </div>

      <!-- SEKSI KONTEN -->
      <div style="font-size: 11px; color: #1e293b; text-align: justify; line-height: 1.65;">
        ${sectionsHtml}
      </div>

      <!-- BLOK TTE / PENGESAHAN DOKUMEN -->
      ${getOfficialTteHtml(
        data.signedBy || 'Dr. Petrus Renyaan, M.Si.',
        '19730412 199803 1 001',
        data.certificateNumber || 'DS-SIMRIDA-MIMIKA-BSRE',
        true
      )}

    </div>
  `;

  const cleanTitle = (data.title || 'Dokumen_SIMRIDA').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
  const filename = `${cleanTitle}.pdf`;

  const result = await renderHtmlToPdf(htmlContent, filename);

  if (targetWindow && !targetWindow.closed) {
    displayPdfInWindow(targetWindow, result.blobUrl, filename);
  }

  return result;
}
