'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useImplementationStore } from '@/store/useImplementationStore';
import { downloadTimelineTemplate } from '@/utils/excelTemplate';
import {
  ArrowLeft,
  FileSpreadsheet,
  Download,
  UploadCloud,
  FileCheck2,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FileText,
  Layers,
  Sparkles
} from 'lucide-react';

export default function TimelinePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { researchRecords } = useResearchStore();
  const {
    getImplementation,
    getDocuments,
    getTimelineDocument,
    uploadTimelineExcel,
  } = useImplementationStore();

  const id = params?.id || '';
  const isBrida = user?.role === 'BRIDA' || user?.role === 'ADMIN_BRIDA';

  const impl = getImplementation(id);
  const documents = getDocuments(id);
  const timelineDoc = getTimelineDocument(id);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileNotes, setFileNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Find target research record
  const record = useMemo(() => {
    const found = researchRecords.find((r) => r.id === id || r.proposalId === id);
    if (found) return found;
    if (impl?.proposalTitle) {
      return {
        id: impl.researchId || id,
        title: impl.proposalTitle,
        opd: impl.opdName || 'BAPPEDA',
        status: impl.status === 'COMPLETED' ? ('COMPLETED' as const) : ('ACTIVE' as const),
        priority: 'HIGH' as const,
        approvedDate: impl.startedDate || '2026-09-01',
        proposalId: impl.researchId || id,
        identificationId: 'PRI-2026-001',
      };
    }
    return {
      id,
      title: `Penelitian #${id}`,
      opd: 'BAPPEDA',
      status: 'ACTIVE' as const,
      priority: 'HIGH' as const,
      approvedDate: '2026-09-01',
      proposalId: id,
      identificationId: 'PRI-2026-001',
    };
  }, [researchRecords, id, impl]);

  const isResearchCompleted = impl.status === 'COMPLETED';

  // Handle Download Template
  const handleDownloadTemplate = () => {
    try {
      downloadTimelineTemplate(record.title, record.opd);
      toast('Format template Excel timeline berhasil diunduh.', 'success');
    } catch (err: any) {
      toast('Gagal mengunduh template: ' + err.message, 'error');
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExt)) {
        toast('Format file harus berupa Excel (.xlsx, .xls) atau .csv', 'warning');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast('Ukuran file maksimal adalah 10MB.', 'warning');
        return;
      }

      setSelectedFile(file);
    }
  };

  // Handle Upload
  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      toast('Silakan pilih file Excel timeline terlebih dahulu.', 'warning');
      return;
    }

    try {
      setIsUploading(true);
      await uploadTimelineExcel(id, selectedFile, fileNotes || `Timeline Pelaksanaan Riset ${record.title}`);
      setSelectedFile(null);
      setFileNotes('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast('Dokumen Timeline Excel berhasil diunggah.', 'success');
    } catch (err: any) {
      toast('Gagal mengunggah dokumen: ' + (err.message || 'Terjadi kesalahan.'), 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Download Active Timeline
  const handleDownloadActiveTimeline = () => {
    if (!timelineDoc) return;
    if (timelineDoc.fileUrl) {
      const fullUrl = timelineDoc.fileUrl.startsWith('http')
        ? timelineDoc.fileUrl
        : `http://localhost:5000/${timelineDoc.fileUrl.replace(/\\/g, '/')}`;
      window.open(fullUrl, '_blank');
    } else {
      // Fallback download template if local mock
      downloadTimelineTemplate(record.title, record.opd);
      toast('Mengunduh salinan berkas timeline...', 'info');
    }
  };

  if (!record) {
    return (
      <div className="space-y-6 text-center py-12 font-sans">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Rekod Penelitian Tidak Ditemukan</h2>
        <button
          onClick={() => router.push('/implementation')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push(`/research/${id}/implementation`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Ringkasan Pelaksanaan</span>
        </button>
      </div>

      <PageHeader
        title="Dokumen & Timeline Pelaksanaan Riset"
        description={`Manajemen berkas jadwal & timeline kegiatan riset berbasis format Excel untuk: "${record.title}"`}
        action={
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow"
          >
            <Download className="h-4 w-4" />
            <span>Unduh Format Template (.xlsx)</span>
          </button>
        }
      />

      {/* Main Grid: Upload & Download Hub */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* ================= LEFT SECTION (Active Timeline & Download Hub) ================= */}
        <div className="md:col-span-2 space-y-6">

          {/* Active Timeline Status Card */}
          <Card className="border-t-4 border-t-emerald-600 shadow-sm">
            <CardHeader className="pb-3 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <span>Dokumen Timeline Pelaksanaan Aktif</span>
                </div>
                {timelineDoc ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>TERSEDIA (EXCEL)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertCircle className="h-3 w-3" />
                    <span>BELUM DIUNGGAH</span>
                  </span>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-4 space-y-4 text-xs">
              {timelineDoc ? (
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-850 rounded-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-emerald-600 text-white rounded-md shrink-0 shadow">
                        <FileSpreadsheet className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{timelineDoc.name}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-2xs text-gray-500 dark:text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Diupload: {timelineDoc.uploadDate || '01 Sep 2026'}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Pengunggah: {timelineDoc.uploadedBy || 'BRIDA Litbang'}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            <span>Tipe: {timelineDoc.type}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleDownloadActiveTimeline}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md shadow flex items-center justify-center gap-2 transition-all shrink-0"
                    >
                      <Download className="h-4 w-4" />
                      <span>Unduh Timeline</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed border-t border-emerald-200 dark:border-emerald-850/60 pt-2.5 italic">
                    * Dokumen Excel ini merupakan acuan resmi jadwal kegiatan dan tahapan penelitian. Seluruh stakeholder dan Kepala BRIDA dapat mengunduh dokumen di atas untuk memantau detail pelaksanaan.
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-900/50 border border-dashed rounded-lg space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-xs">Belum Ada Dokumen Timeline yang Diunggah</h4>
                    <p className="text-2xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      Silakan unduh template format standar yang telah disediakan di sebelah kanan, isi matriks jadwal kegiatan riset, lalu unggah file Excel Anda ke sistem.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-2xs font-bold transition-all shadow"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Unduh Format Template Excel (.xlsx)</span>
                  </button>
                </div>
              )}

              {/* Upload Form Box (For BRIDA / Researchers) */}
              {isBrida && !isResearchCompleted && (
                <div className="pt-2 border-t dark:border-gray-850 space-y-3">
                  <h4 className="font-bold text-2xs uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <UploadCloud className="h-4 w-4 text-emerald-600" />
                    <span>{timelineDoc ? 'Unggah Versi Baru / Ganti File Timeline' : 'Unggah Berkas Timeline Pelaksanaan (Excel)'}</span>
                  </h4>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-2 space-y-2">
                      <div className="border border-dashed border-emerald-300 dark:border-emerald-700 rounded-md p-3 text-center bg-emerald-50/20 dark:bg-emerald-950/10 hover:bg-emerald-50/40 transition-colors">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleFileChange}
                          className="hidden"
                          id="excel-file-upload"
                        />
                        <label htmlFor="excel-file-upload" className="cursor-pointer space-y-1 block">
                          <UploadCloud className="h-6 w-6 text-emerald-600 mx-auto" />
                          <span className="text-2xs font-bold text-emerald-700 dark:text-emerald-400 block">
                            {selectedFile ? selectedFile.name : 'Klik untuk memilih file Excel (.xlsx, .xls, .csv)'}
                          </span>
                          <span className="text-[10px] text-gray-500 block">
                            {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Format didukung: Template Standar atau Dokumen Excel Mandiri (Maks. 10MB)'}
                          </span>
                        </label>
                      </div>

                      <input
                        type="text"
                        placeholder="Keterangan / Catatan versi timeline (Opsional)..."
                        value={fileNotes}
                        onChange={(e) => setFileNotes(e.target.value)}
                        className="w-full text-2xs p-2 border rounded bg-white dark:bg-gray-950 dark:border-gray-800"
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      <button
                        onClick={handleUploadSubmit}
                        disabled={!selectedFile || isUploading}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded shadow flex items-center justify-center gap-1.5 transition-all"
                      >
                        {isUploading ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Mengunggah...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-3.5 w-3.5" />
                            <span>{timelineDoc ? 'Perbarui File' : 'Simpan & Unggah'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guidelines and Column Structure info card */}
          <Card>
            <CardHeader className="pb-2 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>Panduan Kolom Format Template Excel</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3 text-xs leading-relaxed">
              <p className="text-2xs text-gray-500 dark:text-gray-400">
                Template standar SIM-RIDA telah diformat secara terstruktur untuk memudahkan tim peneliti dan OPD dalam menyusun matriks jadwal kerja riset:
              </p>

              <div className="grid gap-2 sm:grid-cols-2 text-2xs">
                <div className="p-2.5 bg-gray-50 dark:bg-gray-900 border rounded space-y-0.5">
                  <span className="font-bold text-gray-800 dark:text-gray-200">1. Tahapan / Rincian Kegiatan</span>
                  <p className="text-gray-500 text-[11px]">Rangkaian aktivitas riset (Persiapan, Survei Lapangan, FGD, Analisis, Seminar Hasil, Finalisasi).</p>
                </div>
                <div className="p-2.5 bg-gray-50 dark:bg-gray-900 border rounded space-y-0.5">
                  <span className="font-bold text-gray-800 dark:text-gray-200">2. Target Output / Luaran</span>
                  <p className="text-gray-500 text-[11px]">Keluaran nyata pada setiap tahapan (SK Tim, Tabulasi Data, Notula FGD, Naskah Akademis).</p>
                </div>
                <div className="p-2.5 bg-gray-50 dark:bg-gray-900 border rounded space-y-0.5">
                  <span className="font-bold text-gray-800 dark:text-gray-200">3. Waktu Pelaksanaan (Mulai - Selesai)</span>
                  <p className="text-gray-500 text-[11px]">Alokasi pekan/bulan pengerjaan riset (e.g. Bulan 1 - M1 s/d Bulan 2 - M4).</p>
                </div>
                <div className="p-2.5 bg-gray-50 dark:bg-gray-900 border rounded space-y-0.5">
                  <span className="font-bold text-gray-800 dark:text-gray-200">4. Penanggung Jawab (PIC) & Status</span>
                  <p className="text-gray-500 text-[11px]">PIC penanggung jawab (Ketua Peneliti, Surveyor, BRIDA) serta status pelaksanaan.</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ================= RIGHT SECTION (Template Download & Research Info) ================= */}
        <div className="space-y-6">

          {/* Standard Template Card */}
          <Card className="border-t-4 border-t-emerald-600 shadow-sm">
            <CardHeader className="pb-2 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                <FileCheck2 className="h-4 w-4 text-emerald-600" />
                <span>Format Standar BRIDA</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs font-medium font-sans">
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-2xs">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Template_Timeline_Pelaksanaan_Riset.xlsx</span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  Gunakan format standar dari BRIDA atau tim peneliti dipersilakan mengunggah format timeline riset mandiri.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-2xs uppercase rounded flex items-center justify-center gap-1.5 shadow transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Unduh Format Template (.xlsx)</span>
                </button>
              </div>

              <div className="space-y-2 text-2xs text-gray-500">
                <div className="flex justify-between items-center py-1 border-b dark:border-gray-850">
                  <span>Status Pelaksanaan:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{impl.status || 'ACTIVE'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b dark:border-gray-850">
                  <span>Target Selesai:</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{impl.plannedEndDate || '30 Nov 2026'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>Jumlah Dokumen Terlampir:</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{documents.length} Berkas</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
