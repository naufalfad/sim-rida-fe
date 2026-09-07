'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useImplementationStore } from '@/store/useImplementationStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { usePartnerStore } from '@/store/usePartnerStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { downloadTimelineTemplate } from '@/utils/excelTemplate';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  History,
  Clock,
  Briefcase,
  Users,
  Compass,
  FileCheck,
  FolderOpen,
  UserCheck,
  FileSpreadsheet,
  Download,
  UploadCloud,
  FileText,
  AlertCircle,
  X,
  Check
} from 'lucide-react';

export default function ImplementationOverviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { researchRecords } = useResearchStore();
  const { getMethod } = usePartnerStore();
  const {
    getImplementation,
    getDocuments,
    getTimelineDocument,
    getMonitoring,
    getActivities,
    markResearchAsCompleted,
  } = useImplementationStore();

  const id = params?.id || '';
  const isBrida = user?.role === 'BRIDA' || user?.role === 'ADMIN_BRIDA';

  const [isCompleteOpen, setIsCompleteOpen] = useState(false);

  const impl = getImplementation(id);
  const documents = getDocuments(id);
  const timelineDoc = getTimelineDocument(id);
  const monitoring = getMonitoring(id);
  const activities = getActivities(id);
  const method = getMethod(id);

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

  // Handle Download Active Timeline
  const handleDownloadActiveTimeline = () => {
    if (!timelineDoc) return;
    if (timelineDoc.fileUrl) {
      const fullUrl = timelineDoc.fileUrl.startsWith('http')
        ? timelineDoc.fileUrl
        : `http://localhost:5000/${timelineDoc.fileUrl.replace(/\\/g, '/')}`;
      window.open(fullUrl, '_blank');
    } else {
      downloadTimelineTemplate(record.title, record.opd);
      toast('Mengunduh salinan berkas timeline...', 'info');
    }
  };

  const handleDownloadTemplate = () => {
    try {
      downloadTimelineTemplate(record.title, record.opd);
      toast('Format template Excel timeline berhasil diunduh.', 'success');
    } catch (err: any) {
      toast('Gagal mengunduh template: ' + err.message, 'error');
    }
  };

  // Completion validation simplified (requires timeline upload)
  const completionValidation = useMemo(() => {
    const errors: string[] = [];

    if (!timelineDoc) {
      errors.push('Dokumen Timeline pelaksanaan riset belum diunggah.');
    }

    const isValid = errors.length === 0;
    return { isValid, errors };
  }, [timelineDoc]);

  const handleConfirmComplete = async () => {
    try {
      await markResearchAsCompleted(id, user?.name || 'BRIDA Litbang');
      setIsCompleteOpen(false);
      toast('Penelitian dinyatakan selesai! Status riset kini COMPLETED dan siap pelaporan.', 'success');
      useResearchStore.getState().fetchProposals();
    } catch (err: any) {
      toast(err.message || 'Gagal menyelesaikan penelitian', 'error');
    }
  };

  if (!record) {
    return (
      <div className="space-y-6 text-center py-12 font-sans">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Rekod Penelitian Tidak Ditemukan</h2>
        <button
          onClick={() => router.push('/research')}
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
          onClick={() => router.push(`/research/${record.id}`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Detail Penelitian</span>
        </button>
      </div>

      <PageHeader
        title="Pelaksanaan Penelitian"
        description="Monitoring dan manajemen pelaksanaan kegiatan riset berbasis berkas timeline Excel dan dokumen pendukung."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow"
            >
              <Download className="h-4 w-4" />
              <span>Format Timeline Excel</span>
            </button>
            <button
              onClick={() => router.push(`/research/${record.id}/implementation/timeline`)}
              className="px-3.5 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Kelola Timeline (Excel)</span>
            </button>
          </div>
        }
      />

      {/* Banner Ready for Reporting / Research Completed */}
      {impl.status === 'COMPLETED' && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-850 rounded text-emerald-700 dark:text-emerald-400 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">Pelaksanaan Selesai & Siap Penyusunan Laporan</h4>
              <p className="text-xs font-medium leading-relaxed text-emerald-750 dark:text-emerald-400">
                Penelitian telah ditandai selesai. Dokumen pelaksanaan tersimpan dan sistem siap masuk ke tahap penyusunan Laporan Akhir & Rekomendasi Kebijakan (Policy Brief).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded text-2xs font-extrabold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-350">
              COMPLETED
            </span>
            <button
              onClick={() => router.push(`/research/${record.id}/report`)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all shadow flex items-center gap-1.5"
            >
              <FileText className="h-4 w-4" />
              <span>Buka Modul Laporan & Rekomendasi</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Metadata Info Card */}
      <Card>
        <CardContent className="p-4 text-xs font-semibold grid gap-4 sm:grid-cols-4 select-none">
          <div>
            <span className="text-gray-400 block font-bold text-[8px] uppercase">Judul Kegiatan</span>
            <span className="text-gray-800 dark:text-gray-250 block truncate max-w-xs">{record.title}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-bold text-[8px] uppercase">Status Pelaksanaan</span>
            <span className="text-purple-750 dark:text-purple-400 block mt-0.5 font-bold">
              {impl.status === 'COMPLETED' ? 'SELESAI' : impl.status === 'ACTIVE' ? 'SEDANG BERJALAN' : 'DIRENCANAKAN'}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block font-bold text-[8px] uppercase">Pelaksana / Mitra</span>
            <span className="text-gray-800 dark:text-gray-205 block truncate">
              {method.method === 'SWAKELOLA' ? 'Tim Internal BRIDA' : 'Mitra Eksternal Pelaksana'}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block font-bold text-[8px] uppercase">Metode Pemilihan</span>
            <span className="text-gray-800 dark:text-gray-255 block">{method.method || 'SWAKELOLA'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Document Focus Section */}
      <Card className="border-t-4 border-t-purple-650 shadow-sm">
        <CardHeader className="pb-3 border-b dark:border-gray-850">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-purple-650" />
              <span>Dokumen Timeline & Jadwal Pelaksanaan Riset</span>
            </div>
            {timelineDoc ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                <span>TIMELINE TERSEDIA</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="h-3 w-3" />
                <span>BELUM DIUNGGAH</span>
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-xs font-medium">
          {timelineDoc ? (
            <div className="p-4 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-850 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-purple-650 text-white rounded-md shadow shrink-0">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">{timelineDoc.name}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-2xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Diupload: {timelineDoc.uploadDate || '01 Sep 2026'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3" />
                      <span>Oleh: {timelineDoc.uploadedBy || 'BRIDA Litbang'}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 italic mt-0.5">
                    File Excel resmi acuan jadwal & tahapan pelaksanaan riset daerah.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={handleDownloadActiveTimeline}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md shadow flex items-center gap-1.5 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Unduh File Timeline</span>
                </button>
                {isBrida && !isResearchCompleted && (
                  <button
                    onClick={() => router.push(`/research/${record.id}/implementation/timeline`)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md shadow flex items-center gap-1.5 transition-all"
                  >
                    <UploadCloud className="h-4 w-4" />
                    <span>Ganti / Update File</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center bg-gray-50 dark:bg-gray-900 border border-dashed rounded-lg space-y-3">
              <FileSpreadsheet className="h-8 w-8 text-amber-500 mx-auto" />
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="font-bold text-xs text-gray-850 dark:text-gray-200">Berkas Timeline Pelaksanaan Belum Diunggah</h4>
                <p className="text-2xs text-gray-500 leading-relaxed">
                  Pengguna dapat mengunduh format standar yang disediakan oleh BRIDA atau mengunggah format timeline mandiri berformat Excel.
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-1">
                <button
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-2xs font-bold transition-all shadow flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Unduh Format Template (.xlsx)</span>
                </button>
                {isBrida && !isResearchCompleted && (
                  <button
                    onClick={() => router.push(`/research/${record.id}/implementation/timeline`)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-2xs font-bold transition-all shadow flex items-center gap-1.5"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>Upload Timeline Excel</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Contents split panels */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* ================= LEFT SECTION (Validation & Documents) ================= */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Completion Validation Card */}
          {isBrida && impl.status !== 'COMPLETED' && (
            <Card>
              <CardHeader className="pb-3 border-b dark:border-gray-850">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-gray-400" />
                  <span>Validasi Penyelesaian Pelaksanaan Riset</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                
                <div className="grid gap-2 sm:grid-cols-2 text-2xs font-bold">
                  <div className="flex items-center gap-2">
                    {timelineDoc ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-rose-600" />
                    )}
                    <span className={timelineDoc ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                      Dokumen Timeline Pelaksanaan Terunggah
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Administrasi Pelaksanaan Terkonfirmasi
                    </span>
                  </div>
                </div>

                {!completionValidation.isValid ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 rounded text-amber-800 dark:text-amber-400 text-2xs space-y-1">
                    <span className="font-bold block uppercase text-[9px] mb-0.5">Syarat Penyelesaian:</span>
                    {completionValidation.errors.map((err, idx) => (
                      <div key={idx} className="flex items-center gap-1 font-medium">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 rounded text-emerald-750 dark:text-emerald-400 text-2xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Dokumen timeline telah lengkap. Anda dapat menandai penelitian ini selesai untuk melangkah ke fase pelaporan hasil.</span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setIsCompleteOpen(true)}
                    disabled={!completionValidation.isValid}
                    className="px-4 py-2 bg-emerald-650 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Tandai Penelitian Selesai</span>
                  </button>
                </div>

              </CardContent>
            </Card>
          )}

          {/* Implementation Documents List */}
          <Card>
            <CardHeader className="pb-3 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center justify-between">
                <span>Dokumen Pelaksanaan & Berkas Evidence</span>
                <span className="text-[10px] text-gray-400 font-bold bg-gray-50 dark:bg-gray-900 px-2 py-0.5 border rounded">
                  {documents.length} Dokumen
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs font-semibold">
              {documents.length === 0 ? (
                <p className="text-2xs text-gray-400 italic py-2">Belum ada dokumen lampiran tambahan.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-3 bg-gray-50 dark:bg-gray-900 border rounded flex justify-between items-center text-3xs">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-slate-400" />
                        <div>
                          <span className="font-bold text-gray-700 dark:text-gray-300 truncate max-w-40 block">{doc.name}</span>
                          <span className="text-[9px] text-gray-400 block font-normal mt-0.5">{doc.type} • {doc.uploadDate || '01 Sep 2026'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (doc.fileUrl) {
                            const fullUrl = doc.fileUrl.startsWith('http') ? doc.fileUrl : `http://localhost:5000/${doc.fileUrl.replace(/\\/g, '/')}`;
                            window.open(fullUrl, '_blank');
                          } else {
                            toast(`Mengunduh berkas: ${doc.name}`, 'info');
                          }
                        }}
                        className="text-blue-600 font-extrabold hover:underline uppercase text-3xs"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* ================= RIGHT SECTION (Team pelaksana & summary) ================= */}
        <div className="space-y-6">
          
          {/* Research Team list */}
          <Card>
            <CardHeader className="pb-2 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-gray-400" />
                <span>Tim Pelaksana Lapangan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900 border rounded">
                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-2xs">
                  KP
                </div>
                <div>
                  <span className="font-bold block text-gray-800 dark:text-gray-200">Dr. Ir. Ahmad Sudrajat, M.Si</span>
                  <span className="text-[9px] text-gray-400 block font-normal">Ketua Tim Peneliti (Lead Researcher)</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900 border rounded">
                <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-2xs">
                  AS
                </div>
                <div>
                  <span className="font-bold block text-gray-800 dark:text-gray-200">Siti Rahmawati, S.Stat, M.Sc</span>
                  <span className="text-[9px] text-gray-400 block font-normal">Analis Data & Kuantitatif</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900 border rounded">
                <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-2xs">
                  BR
                </div>
                <div>
                  <span className="font-bold block text-gray-800 dark:text-gray-200">Tim Bidang Litbang BRIDA</span>
                  <span className="text-[9px] text-gray-400 block font-normal">Pengawas & Pendamping Lapangan</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* Confirmation Dialog for Completion */}
      <Dialog
        isOpen={isCompleteOpen}
        onClose={() => setIsCompleteOpen(false)}
        title="Konfirmasi Penyelesaian Penelitian"
        description="Apakah Anda yakin ingin menandai pelaksanaan penelitian ini selesai? Status akan diubah menjadi COMPLETED dan siap masuk tahap pelaporan."
      >
        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={() => setIsCompleteOpen(false)}
            className="px-4 py-2 border rounded text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            Batal
          </button>
          <button
            onClick={handleConfirmComplete}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow"
          >
            Ya, Tandai Selesai
          </button>
        </div>
      </Dialog>
    </div>
  );
}
