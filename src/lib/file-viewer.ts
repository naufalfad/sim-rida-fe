// Helper utilitas untuk membuka berkas PDF di tab baru atau langsung mengunduh berkas non-PDF

export interface ViewableFile {
  name: string;
  size?: string;
  uploadDate?: string;
  url?: string;
  type?: string;
  content?: string;
  rawFile?: File | Blob;
  proposalCode?: string;
  proposalTitle?: string;
  opdName?: string;
  estimatedBudget?: number;
}

/**
 * Memeriksa apakah berkas merupakan dokumen PDF berdasarkan ekstensi nama berkas
 */
export const isPdfDocument = (fileName: string): boolean => {
  if (!fileName) return false;
  return fileName.toLowerCase().trim().endsWith('.pdf');
};

/**
 * Menghasilkan file Blob untuk data berkas jika belum memiliki Blob URL
 */
export const generateFallbackFileBlob = (file: ViewableFile): Blob => {
  if (file.rawFile) {
    return file.rawFile;
  }

  const isPdf = isPdfDocument(file.name);
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (isPdf) {
    // Generate dokumen PDF / HTML viewer di tab baru
    const htmlPdfContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${file.name} - Peninjau Dokumen SIM-RIDA</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body {
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.6;
      color: #000;
      background: #525659;
      margin: 0;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .page-container {
      width: 210mm;
      min-height: 297mm;
      padding: 25mm 25mm 20mm 25mm;
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      box-sizing: border-box;
      position: relative;
    }
    .header-kop {
      text-align: center;
      border-bottom: 3px double #000;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .header-kop h3 { margin: 0; font-size: 16pt; font-weight: bold; text-transform: uppercase; }
    .header-kop h2 { margin: 2px 0; font-size: 18pt; font-weight: bold; text-transform: uppercase; }
    .header-kop p { margin: 0; font-size: 10pt; font-family: Arial, sans-serif; }
    .doc-title { text-align: center; margin: 20px 0; }
    .doc-title h4 { margin: 0; font-size: 13pt; text-decoration: underline; text-transform: uppercase; font-weight: bold; }
    .doc-title span { font-size: 10pt; font-family: Arial, sans-serif; color: #333; }
    .content-body { font-size: 12pt; text-align: justify; }
    .content-body p { text-indent: 30px; margin: 10px 0; }
    .meta-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 11pt; }
    .meta-table td { padding: 4px 6px; vertical-align: top; }
    .meta-table td.label { width: 30%; font-weight: bold; }
    .meta-table td.colon { width: 3%; }
    .footer-sign { margin-top: 40px; float: right; width: 220px; text-align: center; font-size: 11pt; }
    .print-bar {
      position: fixed;
      top: 12px;
      right: 24px;
      background: #0f2c59;
      color: #fff;
      padding: 8px 16px;
      border-radius: 6px;
      font-family: Arial, sans-serif;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      z-index: 999;
    }
    @media print {
      body { background: transparent; padding: 0; }
      .page-container { box-shadow: none; width: 100%; min-height: auto; padding: 0; }
      .print-bar { display: none; }
    }
  </style>
</head>
<body>
  <button class="print-bar" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
  <div class="page-container">
    <div class="header-kop">
      <h3>Pemerintah Kabupaten Mimika</h3>
      <h2>Badan Riset dan Inovasi Daerah</h2>
      <p>Jl. Cenderawasih, SP 3, Distrik Kuala Kencana, Kabupaten Mimika, Papua Tengah</p>
      <p>Laman: brida.mimikakab.go.id | Pos-el: brida@mimikakab.go.id</p>
    </div>

    <div class="doc-title">
      <h4>${file.name.replace(/\.pdf$/i, '')}</h4>
      <span>Nomor Registrasi Sistem: ${file.proposalCode || 'SIMRIDA/2026/DOC'}</span>
    </div>

    <table class="meta-table">
      <tr>
        <td class="label">Nama Dokumen</td>
        <td class="colon">:</td>
        <td>${file.name}</td>
      </tr>
      <tr>
        <td class="label">Perangkat Daerah Pengunggah</td>
        <td class="colon">:</td>
        <td>${file.opdName || 'Pemerintah Kabupaten Mimika'}</td>
      </tr>
      <tr>
        <td class="label">Usulan Terkait</td>
        <td class="colon">:</td>
        <td>${file.proposalTitle || '-'}</td>
      </tr>
      <tr>
        <td class="label">Tanggal Unggah</td>
        <td class="colon">:</td>
        <td>${file.uploadDate || new Date().toLocaleDateString('id-ID')}</td>
      </tr>
      <tr>
        <td class="label">Ukuran Berkas</td>
        <td class="colon">:</td>
        <td>${file.size || '1.5 MB'}</td>
      </tr>
    </table>

    <div class="content-body">
      <h5 style="margin-top: 15px; margin-bottom: 5px; font-size: 11pt; text-transform: uppercase;">Uraian Dokumen / Keterangan Berkas:</h5>
      <p>
        ${file.content ? file.content.replace(/\n/g, '<br/>') : 'Dokumen lampiran resmi ini telah diunggah dan diverifikasi kelengkapannya ke dalam sistem SIM-RIDA Pemerintah Kabupaten Mimika.'}
      </p>
      <p>
        Dokumen ini merupakan bagian dari kelengkapan administrasi dan substansi teknis kelitbangan tahun anggaran berjalan.
      </p>
    </div>

    <div class="footer-sign">
      <p>Mimika, ${file.uploadDate || new Date().toLocaleDateString('id-ID')}</p>
      <p>Pemverifikasi Dokumen,</p>
      <br/><br/><br/>
      <p style="font-weight: bold; text-decoration: underline;">BRIDA KABUPATEN MIMIKA</p>
    </div>
  </div>
</body>
</html>`;
    return new Blob([htmlPdfContent], { type: 'text/html' });
  }

  // Jika format berkas non-PDF (misal .xlsx, .docx, .csv, dll)
  let mimeType = 'application/octet-stream';
  let placeholderContent = `BERKAS RESMI: ${file.name}\nUsulan: ${file.proposalTitle || ''}\nOPD: ${file.opdName || ''}\nTanggal: ${file.uploadDate || ''}\n\n${file.content || 'Isi berkas lampiran pendukung riset daerah.'}`;

  if (ext === 'xlsx' || ext === 'xls') {
    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else if (ext === 'docx' || ext === 'doc') {
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  } else if (ext === 'csv') {
    mimeType = 'text/csv';
  }

  return new Blob([placeholderContent], { type: mimeType });
};

/**
 * Mengunduh file secara langsung ke penyimpanan lokal pengguna
 */
export const downloadFileDirectly = async (file: ViewableFile) => {
  if (file.url) {
    try {
      const response = await fetch(file.url);
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const anchor = window.document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = file.name;
        window.document.body.appendChild(anchor);
        anchor.click();
        window.document.body.removeChild(anchor);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
        return;
      }
    } catch {
      // If direct fetch fails (e.g. offline/network), fall through to standard anchor navigation
    }
  }

  let downloadUrl = file.url;
  let createdUrl = false;

  if (!downloadUrl) {
    const blob = generateFallbackFileBlob(file);
    downloadUrl = URL.createObjectURL(blob);
    createdUrl = true;
  }

  const anchor = window.document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = file.name;
  anchor.target = '_blank';
  window.document.body.appendChild(anchor);
  anchor.click();
  window.document.body.removeChild(anchor);

  if (createdUrl) {
    setTimeout(() => {
      URL.revokeObjectURL(downloadUrl!);
    }, 5000);
  }
};

/**
 * Aturan Utama:
 * - Jika PDF: Dilihat / dibuka di tab baru (Preview di tab baru).
 * - Jika selain PDF: Diwajibkan langsung download file tersebut agar pengguna dapat membuka di aplikasi lokal.
 */
export const openOrDownloadFile = (
  file: ViewableFile,
  toastNotifier?: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void
) => {
  if (!file || !file.name) return;

  const isPdf = isPdfDocument(file.name);

  if (isPdf) {
    // 1. Berkas PDF -> Buka di tab baru
    let targetUrl = file.url;
    let isBlobCreated = false;

    if (!targetUrl) {
      const blob = generateFallbackFileBlob(file);
      targetUrl = URL.createObjectURL(blob);
      isBlobCreated = true;
    }

    const newWindow = window.open(targetUrl, '_blank');
    if (!newWindow) {
      toastNotifier?.('Pop-up peramban diblokir. Izinkan pop-up untuk melihat berkas PDF di tab baru.', 'warning');
    } else {
      toastNotifier?.(`Membuka berkas PDF "${file.name}" di tab baru...`, 'info');
    }

    if (isBlobCreated) {
      setTimeout(() => {
        if (targetUrl) URL.revokeObjectURL(targetUrl);
      }, 60000);
    }
  } else {
    // 2. Berkas Non-PDF (.xlsx, .docx, .zip, dll) -> Wajib langsung download
    downloadFileDirectly(file);
    const ext = file.name.split('.').pop()?.toUpperCase() || 'Berkas';
    toastNotifier?.(
      `Berkas format [${ext}] "${file.name}" langsung diunduh ke perangkat Anda.`,
      'success'
    );
  }
};
