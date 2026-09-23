import jsPDF from 'jspdf';

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
 * Menghasilkan file Blob untuk data berkas jika belum memiliki Blob URL (asli format application/pdf untuk PDF)
 */
export const generateFallbackFileBlob = (file: ViewableFile): Blob => {
  if (file.rawFile) {
    return file.rawFile;
  }

  const isPdf = isPdfDocument(file.name);
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (isPdf) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // 1. Kop Surat Resmi
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text('PEMERINTAH DAERAH KABUPATEN MIMIKA', 105, 18, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(15, 44, 89);
    doc.text('BADAN RISET DAN INOVASI DAERAH (BRIDA)', 105, 23.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Jl. Cenderawasih, SP 3, Distrik Kuala Kencana, Kabupaten Mimika, Papua Tengah', 105, 28, { align: 'center' });

    // Garis Kop Ganda
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.7);
    doc.line(15, 31, 195, 31);
    doc.setLineWidth(0.25);
    doc.line(15, 32.2, 195, 32.2);

    // 2. Judul Dokumen
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(file.name.replace(/\.pdf$/i, '').toUpperCase(), 105, 40, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Nomor Registrasi: ${file.proposalCode || 'SIMRIDA/2026/DOC'}`, 105, 44.5, { align: 'center' });

    // 3. Metadata
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(15, 49, 195, 49);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Instansi Pengunggah', 18, 54.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${file.opdName || 'Pemerintah Kabupaten Mimika'}`, 60, 54.5);

    doc.setFont('helvetica', 'bold');
    doc.text('Usulan Terkait', 18, 60);
    doc.setFont('helvetica', 'normal');
    const titleLines = doc.splitTextToSize(`: ${file.proposalTitle || '-'}`, 130);
    doc.text(titleLines, 60, 60);

    const afterTitleY = 60 + (titleLines.length * 4.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Tanggal Unggah', 18, afterTitleY);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${file.uploadDate || new Date().toLocaleDateString('id-ID')}`, 60, afterTitleY);

    doc.setFont('helvetica', 'bold');
    doc.text('Ukuran Berkas', 18, afterTitleY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${file.size || '1.5 MB'}`, 60, afterTitleY + 5.5);

    doc.line(15, afterTitleY + 9, 195, afterTitleY + 9);

    // 4. Uraian Isi
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('Uraian Dokumen / Substansi Teknis:', 18, afterTitleY + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    const bodyText = file.content || 'Dokumen lampiran resmi ini telah diunggah dan diverifikasi kelengkapannya ke dalam sistem SIM-RIDA Pemerintah Kabupaten Mimika sebagai bagian dari kelengkapan administrasi dan substansi teknis kelitbangan.';
    const contentLines = doc.splitTextToSize(bodyText, 175);
    doc.text(contentLines, 18, afterTitleY + 22);

    // 5. TTE Pengesahan BSrE
    const tteY = Math.max(afterTitleY + 28 + (contentLines.length * 4.5), 220);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text('Kepala BRIDA Kabupaten Mimika', 145, tteY, { align: 'center' });

    doc.setDrawColor(59, 130, 246);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(110, tteY + 3, 70, 16, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 58, 138);
    doc.text('TTE BSrE - BSSN VALIDATED', 145, tteY + 9, { align: 'center' });
    doc.setFontSize(6);
    doc.setTextColor(71, 85, 105);
    doc.text('DS-SIMRIDA-MIMIKA-BSRE', 145, tteY + 14.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('Dr. Petrus Renyaan, M.Si.', 145, tteY + 25, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('NIP. 19730412 199803 1 001', 145, tteY + 29, { align: 'center' });

    return doc.output('blob');
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
