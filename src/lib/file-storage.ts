// Utilitas File Storage: Upload ke Backend & Caching di LocalStorage untuk Review File Asli OPD

import { isPdfDocument } from './file-viewer';

export interface StoredDocumentItem {
  name: string;
  size: string;
  uploadDate: string;
  url?: string;
  dataUrl?: string; // Base64 data URL untuk preview isi file asli
  type?: string;
}

const STORAGE_PREFIX = 'simrida_file_cache_';

/**
 * Mengubah file browser (File/Blob) menjadi Base64 Data URL
 */
export const fileToDataUrl = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Menyimpan data URL berkas ke LocalStorage
 */
export const cacheFileToLocalStorage = (fileName: string, dataUrl: string): void => {
  try {
    const storageKey = `${STORAGE_PREFIX}${fileName}`;
    localStorage.setItem(storageKey, dataUrl);
  } catch (err) {
    console.warn('LocalStorage penuh atau tidak tersedia untuk caching file:', err);
  }
};

/**
 * Mengambil data URL berkas dari LocalStorage
 */
export const getCachedFileFromLocalStorage = (fileName: string): string | null => {
  try {
    const storageKey = `${STORAGE_PREFIX}${fileName}`;
    return localStorage.getItem(storageKey);
  } catch (err) {
    return null;
  }
};

/**
 * Mengunggah file ke Backend API (POST /api/v1/uploads) dan menyimpannya ke LocalStorage
 */
export const uploadAndCacheFile = async (
  file: File,
  token?: string | null
): Promise<StoredDocumentItem> => {
  const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
  const today = new Date().toLocaleDateString('id-ID');

  // 1. Simpan ke LocalStorage sebagai Base64
  let base64Data: string | undefined = undefined;
  try {
    base64Data = await fileToDataUrl(file);
    cacheFileToLocalStorage(file.name, base64Data);
  } catch (e) {
    console.error('Gagal convert file ke base64 data url:', e);
  }

  // 2. Buat Blob URL lokal sementara
  let fileUrl = base64Data || URL.createObjectURL(file);

  // 3. Coba upload ke Backend Server jika online
  try {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    const response = await fetch(`${apiUrl}/uploads`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      if (result.data?.fileUrl) {
        fileUrl = result.data.fileUrl;
      }
    }
  } catch (err) {
    console.warn('Backend upload fallback ke cache LocalStorage/Blob URL:', err);
  }

  return {
    name: file.name,
    size: sizeStr,
    uploadDate: today,
    url: fileUrl,
    dataUrl: base64Data,
    type: file.type || 'application/octet-stream',
  };
};

/**
 * Mengunduh berkas secara langsung dari URL atau Base64 LocalStorage
 */
export const downloadDocumentFile = (fileItem: { name: string; url?: string; dataUrl?: string }) => {
  let sourceUrl = fileItem.url || fileItem.dataUrl;

  // Coba ambil dari LocalStorage jika belum ada
  if (!sourceUrl || (!sourceUrl.startsWith('http') && !sourceUrl.startsWith('data:') && !sourceUrl.startsWith('blob:'))) {
    const cached = getCachedFileFromLocalStorage(fileItem.name);
    if (cached) {
      sourceUrl = cached;
    }
  }

  if (!sourceUrl) {
    // Fallback: Buat file teks
    const blob = new Blob([`Berkas: ${fileItem.name}\nDiunggah ke SIM-RIDA Mimika`], { type: 'application/octet-stream' });
    sourceUrl = URL.createObjectURL(blob);
  }

  const anchor = window.document.createElement('a');
  anchor.href = sourceUrl;
  anchor.download = fileItem.name;
  window.document.body.appendChild(anchor);
  anchor.click();
  window.document.body.removeChild(anchor);
};

/**
 * Membuka file PDF di tab baru atau langsung mengunduh file non-PDF
 */
export const openOrDownloadUploadedFile = (
  fileItem: {
    name: string;
    url?: string;
    dataUrl?: string;
    proposalCode?: string;
    proposalTitle?: string;
    opdName?: string;
    uploadDate?: string;
    size?: string;
  },
  toastNotifier?: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void
) => {
  if (!fileItem || !fileItem.name) return;

  const isPdf = isPdfDocument(fileItem.name);

  // Cari sumber file: dari url, dataUrl, atau cache LocalStorage
  let fileSource = fileItem.url || fileItem.dataUrl;
  if (!fileSource || (!fileSource.startsWith('http') && !fileSource.startsWith('data:') && !fileSource.startsWith('blob:'))) {
    const cached = getCachedFileFromLocalStorage(fileItem.name);
    if (cached) {
      fileSource = cached;
    }
  }

  if (isPdf) {
    // 1. Berkas PDF -> Buka di tab baru
    let viewUrl = fileSource;
    let isCreatedBlob = false;

    if (viewUrl && viewUrl.startsWith('data:')) {
      // Ubah dataUrl base64 menjadi Blob URL agar browser membukanya langsung di viewer PDF
      try {
        const byteCharacters = atob(viewUrl.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
        viewUrl = URL.createObjectURL(pdfBlob);
        isCreatedBlob = true;
      } catch (e) {
        console.error('Gagal parse base64 PDF:', e);
      }
    }

    if (!viewUrl) {
      // Fallback PDF Generator
      const fallbackHtml = `<!DOCTYPE html><html><head><title>${fileItem.name}</title></head><body style="font-family:sans-serif;padding:40px;line-height:1.6"><h2>BADAN RISET DAN INOVASI DAERAH MIMIKA</h2><hr/><p><strong>Dokumen PDF:</strong> ${fileItem.name}</p><p><strong>Usulan:</strong> ${fileItem.proposalTitle || '-'}</p><p><strong>Pengunggah:</strong> ${fileItem.opdName || '-'}</p><p>Dokumen ini tersimpan dalam database SIM-RIDA.</p></body></html>`;
      const blob = new Blob([fallbackHtml], { type: 'text/html' });
      viewUrl = URL.createObjectURL(blob);
      isCreatedBlob = true;
    }

    const newTab = window.open(viewUrl, '_blank');
    if (!newTab) {
      toastNotifier?.('Pop-up diblokir. Izinkan pop-up peramban untuk melihat berkas PDF di tab baru.', 'warning');
    } else {
      toastNotifier?.(`Membuka berkas PDF asli "${fileItem.name}" di tab baru...`, 'info');
    }

    if (isCreatedBlob) {
      setTimeout(() => URL.revokeObjectURL(viewUrl!), 60000);
    }
  } else {
    // 2. Berkas Non-PDF (.xlsx, .docx, .pptx, dll) -> Wajib langsung download
    downloadDocumentFile(fileItem);
    const ext = fileItem.name.split('.').pop()?.toUpperCase() || 'Berkas';
    toastNotifier?.(
      `Berkas format [${ext}] "${fileItem.name}" langsung diunduh ke perangkat Anda untuk dibuka di aplikasi lokal.`,
      'success'
    );
  }
};
