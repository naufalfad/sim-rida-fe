'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useKnowledgeBaseStore } from '@/store/useKnowledgeBaseStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import {
  ArrowLeft,
  FileText,
  Clock,
  Download,
  Upload,
  Check,
  Eye,
  AlertTriangle,
  History,
  Info
} from 'lucide-react';

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const docId = params?.id;
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const {
    documents,
    versions,
    categories,
    activities,
    fetchDocuments,
    fetchDocumentDetail,
    uploadNewVersion,
    setActiveVersion,
  } = useKnowledgeBaseStore();

  React.useEffect(() => {
    if (docId) {
      fetchDocumentDetail(docId);
    } else {
      fetchDocuments();
    }
  }, [docId, fetchDocumentDetail, fetchDocuments]);

  const isAdmin = user?.role === 'ADMIN_BRIDA';

  // Find document
  const doc = useMemo(() => {
    return documents.find((d) => d.id === docId);
  }, [documents, docId]);

  // Find versions
  const docVersions = useMemo(() => {
    return versions.filter((v) => v.documentId === docId).sort((a, b) => b.version.localeCompare(a.version));
  }, [versions, docId]);

  // Find active version
  const activeVer = useMemo(() => {
    return docVersions.find((v) => v.status === 'ACTIVE');
  }, [docVersions]);

  // Find activities for this document
  const docActivities = useMemo(() => {
    return activities.filter((act) => act.documentName === doc?.name);
  }, [activities, doc?.name]);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSetActiveOpen, setIsSetActiveOpen] = useState(false);
  const [selectedVerToActivate, setSelectedVerToActivate] = useState<string | null>(null);
  const [selectedVerNumber, setSelectedVerNumber] = useState<string>('');

  // Form states
  const [newVersionNum, setNewVersionNum] = useState('');
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString());
  const [newFileName, setNewFileName] = useState('');
  const [newChangeSummary, setNewChangeSummary] = useState('');
  const [formError, setFormError] = useState('');

  // Preview state (dummy)
  const [selectedPreviewVer, setSelectedPreviewVer] = useState<string | null>(null);

  if (!doc) {
    return (
      <div className="space-y-6 text-center py-12">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Dokumen Tidak Ditemukan</h2>
        <p className="text-xs text-gray-500">Dokumen yang Anda cari tidak terdaftar di sistem.</p>
        <button
          onClick={() => router.push('/knowledge-base')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold"
        >
          Kembali ke Daftar Dokumen
        </button>
      </div>
    );
  }

  const categoryName = categories.find((c) => c.id === doc.categoryId)?.name || 'Kategori';
  const opdScopeLabel = doc.opdScope === 'ALL' ? 'Semua OPD (Umum)' : doc.specificOpds.join(', ');

  // Active version info card display
  const currentPreviewVer = selectedPreviewVer 
    ? docVersions.find(v => v.version === selectedPreviewVer) 
    : activeVer || docVersions[0];

  // Upload new version handler
  const handleUploadVersion = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newVersionNum.trim()) {
      setFormError('Nomor versi wajib diisi.');
      return;
    }
    if (!newYear || isNaN(Number(newYear))) {
      setFormError('Tahun dokumen wajib diisi dengan angka.');
      return;
    }
    if (!newFileName.trim()) {
      setFormError('Nama file wajib dimasukkan.');
      return;
    }
    if (!newChangeSummary.trim()) {
      setFormError('Ringkasan perubahan wajib diisi.');
      return;
    }

    // Call store
    uploadNewVersion(
      doc.id,
      newVersionNum,
      Number(newYear),
      newFileName,
      newChangeSummary,
      user?.name || 'Admin'
    );

    // Reset Form
    setNewVersionNum('');
    setNewYear(new Date().getFullYear().toString());
    setNewFileName('');
    setNewChangeSummary('');
    setIsUploadOpen(false);

    toast(`Versi v${newVersionNum} berhasil diunggah sebagai DRAFT.`, 'success');
  };

  // Set active version handler
  const handleActivateConfirm = () => {
    if (selectedVerToActivate) {
      setActiveVersion(doc.id, selectedVerToActivate, user?.name || 'Admin');
      setIsSetActiveOpen(false);
      setSelectedVerToActivate(null);
      setSelectedVerNumber('');
      toast(`Versi baru berhasil diaktifkan. Versi sebelumnya otomatis diarsipkan.`, 'success');
    }
  };

  // Status badge colors helper
  const renderStatusBadge = (status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'EXPIRED') => {
    let bg = '';
    let text = '';
    let label = '';
    switch (status) {
      case 'DRAFT':
        bg = 'bg-gray-100 dark:bg-gray-800';
        text = 'text-gray-800 dark:text-gray-300';
        label = 'Draft';
        break;
      case 'ACTIVE':
        bg = 'bg-emerald-50 dark:bg-emerald-950/40';
        text = 'text-emerald-700 dark:text-emerald-400';
        label = 'Active';
        break;
      case 'ARCHIVED':
        bg = 'bg-amber-50 dark:bg-amber-950/40';
        text = 'text-amber-700 dark:text-amber-400';
        label = 'Archived';
        break;
      case 'EXPIRED':
        bg = 'bg-red-50 dark:bg-red-950/40';
        text = 'text-red-700 dark:text-red-405';
        label = 'Expired';
        break;
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold border border-transparent ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back Link */}
      <div>
        <button
          onClick={() => router.push('/knowledge-base')}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Dokumen</span>
        </button>
      </div>

      {/* Page Header */}
      <PageHeader
        title={doc.name}
        description="Detail informasi, pratinjau berkas, dan histori versi acuan dokumen BRIDA."
        action={
          isAdmin && doc.status !== 'ARCHIVED' && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Upload className="h-4 w-4" />
              <span>Upload New Version</span>
            </button>
          )
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* ================= LEFT / COLUMN 1 & 2 ================= */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Document Information Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Informasi Dokumen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <span className="text-gray-400 font-medium block">Nama Dokumen</span>
                  <span className="font-bold text-gray-900 dark:text-white">{doc.name}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Kategori</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{categoryName}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Cakupan OPD</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{opdScopeLabel}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Tahun Terbit</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{doc.year}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Status Dokumen</span>
                  <span className="mt-0.5 inline-block">{renderStatusBadge(doc.status)}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Versi Aktif Saat Ini</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    v{activeVer?.version || 'Tidak ada versi aktif'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Tanggal Upload</span>
                  <span className="text-gray-550">{doc.createdAt}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Pembaruan Terakhir</span>
                  <span className="text-gray-550">{doc.updatedAt} oleh {doc.updatedBy}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-850">
                <span className="text-xs text-gray-400 font-medium block mb-1">Deskripsi Dokumen</span>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50/50 dark:bg-gray-900/40 p-3 rounded border border-gray-150 dark:border-gray-850">
                  {doc.description || 'Tidak ada deskripsi ditambahkan.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Version History Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <History className="h-4 w-4" />
                <span>Histori Versi Dokumen</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-3xs uppercase tracking-wider font-semibold">Versi</TableHead>
                    <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center">Tahun</TableHead>
                    <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center">Status</TableHead>
                    <TableHead className="text-3xs uppercase tracking-wider font-semibold">Tanggal Upload</TableHead>
                    <TableHead className="text-3xs uppercase tracking-wider font-semibold">Oleh</TableHead>
                    <TableHead className="text-3xs uppercase tracking-wider font-semibold">Perubahan</TableHead>
                    <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-28">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docVersions.map((ver) => (
                    <TableRow key={ver.id} className={ver.version === currentPreviewVer?.version ? "bg-blue-50/20 dark:bg-blue-950/10" : ""}>
                      <TableCell className="font-bold text-gray-900 dark:text-white">v{ver.version}</TableCell>
                      <TableCell className="text-center font-semibold">{ver.year}</TableCell>
                      <TableCell className="text-center">{renderStatusBadge(ver.status)}</TableCell>
                      <TableCell className="text-3xs text-gray-400 font-medium">{ver.uploadedDate}</TableCell>
                      <TableCell className="text-3xs text-gray-400 font-semibold">{ver.uploadedBy}</TableCell>
                      <TableCell className="text-2xs max-w-xs truncate" title={ver.changeSummary}>
                        {ver.changeSummary}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedPreviewVer(ver.version)}
                            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800/40"
                            title="Pratinjau Versi Ini"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {isAdmin && ver.status !== 'ACTIVE' && doc.status !== 'ARCHIVED' && (
                            <button
                              onClick={() => {
                                setSelectedVerToActivate(ver.id);
                                setSelectedVerNumber(ver.version);
                                setIsSetActiveOpen(true);
                              }}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded border border-emerald-200 dark:border-emerald-800/40"
                              title="Set Aktif"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* ================= RIGHT / COLUMN 3 ================= */}
        <div className="space-y-6">
          
          {/* Document Preview Panel */}
          <Card>
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-850">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>Pratinjau Dokumen</span>
                </CardTitle>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                  v{currentPreviewVer?.version}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 truncate">
                File: {currentPreviewVer?.fileName || 'dokumen.pdf'} ({currentPreviewVer?.fileSize || '2.5 MB'})
              </p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* PDF Document Viewer Panel */}
              {currentPreviewVer?.filePath ? (
                <div className="aspect-[3/4] w-full border border-gray-200 dark:border-gray-800 rounded bg-gray-900 overflow-hidden shadow-inner relative flex flex-col">
                  <iframe
                    src={`${currentPreviewVer.filePath}#toolbar=0&navpanes=0`}
                    className="w-full h-full border-0 rounded"
                    title={currentPreviewVer.fileName || 'Pratinjau PDF Dokumen'}
                  />
                </div>
              ) : (
                <div className="aspect-[3/4] w-full border border-dashed border-amber-300 dark:border-amber-800 rounded bg-amber-50/60 dark:bg-amber-950/20 flex flex-col items-center justify-center p-6 text-center select-none shadow-inner">
                  <AlertTriangle className="h-10 w-10 text-amber-500 mb-2.5" />
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    Berkas Fisik Belum Tersedia
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 max-w-[200px] leading-relaxed">
                    Dokumen ini berstatus <strong>NOT_FOUND / DRAFT</strong> secara daring sehingga berkas PDF belum dapat diunduh atau dipratinjau.
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (currentPreviewVer?.filePath) {
                      window.open(currentPreviewVer.filePath, '_blank');
                    } else {
                      toast('Berkas PDF belum tersedia fisik di server (Status: NOT_FOUND).', 'warning');
                    }
                  }}
                  className="flex-1 py-1.5 border border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all bg-white dark:bg-gray-950"
                >
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => {
                    if (currentPreviewVer?.filePath) {
                      const link = document.createElement('a');
                      link.href = currentPreviewVer.filePath;
                      link.download = currentPreviewVer.fileName || 'dokumen.pdf';
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      toast(`Mengunduh berkas ${currentPreviewVer.fileName}...`, 'success');
                    } else {
                      toast('Berkas PDF belum tersedia fisik di server (Status: NOT_FOUND).', 'warning');
                    }
                  }}
                  className="flex-1 py-1.5 border border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all bg-white dark:bg-gray-950"
                >
                  <Download className="h-4 w-4 text-gray-400" />
                  <span>Download</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Audit / Update Activity Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Riwayat Aktifitas Dokumen</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {docActivities.length === 0 ? (
                <p className="text-[11px] text-gray-400 italic">Belum ada riwayat aktivitas tercatat.</p>
              ) : (
                <div className="relative border-l border-gray-200 dark:border-gray-800 pl-3.5 space-y-4 py-2">
                  {docActivities.map((log) => (
                    <div key={log.id} className="relative text-xs space-y-0.5">
                      {/* Timeline dot */}
                      <span className="absolute -left-[19.5px] top-1 h-2 w-2 rounded-full border border-white bg-blue-600" />
                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium">
                        <span>{log.date}</span>
                        <span className="font-bold">{log.user}</span>
                      </div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        {log.action} {log.version !== '-' && <span className="text-blue-600 dark:text-blue-400">{log.version}</span>}
                      </p>
                      <p className="text-[10px] text-gray-450 italic leading-relaxed">
                        &quot;{log.changeSummary}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ================= MODAL: UPLOAD NEW VERSION ================= */}
      <Dialog
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setFormError('');
        }}
        title="Upload New Version"
        description="Unggah versi pembaruan terbaru untuk acuan dokumen ini."
        footer={
          <>
            <button
              onClick={handleUploadVersion}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-all"
            >
              Upload Version
            </button>
            <button
              onClick={() => {
                setIsUploadOpen(false);
                setFormError('');
              }}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <form onSubmit={handleUploadVersion} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-750 dark:text-red-400 text-xs rounded">
              {formError}
            </div>
          )}

          {/* Document Name */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-400">Nama Dokumen</label>
            <input
              type="text"
              value={doc.name}
              disabled
              className="block w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div className="grid gap-4 grid-cols-2">
            {/* Version Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Nomor Versi Baru *</label>
              <input
                type="text"
                value={newVersionNum}
                onChange={(e) => setNewVersionNum(e.target.value)}
                placeholder="Contoh: 3.0"
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
                required
              />
            </div>

            {/* Year */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Tahun Dokumen *</label>
              <input
                type="number"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
                required
              />
            </div>
          </div>

          {/* File Input Dummy */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Nama File Berkas *</label>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Contoh: RPJMD_Final_v3.pdf"
              className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              required
            />
            <p className="text-[9px] text-gray-400">Simulasi unggahan file.</p>
          </div>

          {/* Change Summary */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Ringkasan Perubahan *</label>
            <textarea
              value={newChangeSummary}
              onChange={(e) => setNewChangeSummary(e.target.value)}
              placeholder="Jelaskan ringkasan revisi prioritas pembangunan..."
              rows={2}
              className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              required
            />
          </div>
        </form>
      </Dialog>

      {/* ================= CONFIRMATION: SET ACTIVE VERSION ================= */}
      <Dialog
        isOpen={isSetActiveOpen}
        onClose={() => {
          setIsSetActiveOpen(false);
          setSelectedVerToActivate(null);
          setSelectedVerNumber('');
        }}
        title="Aktifkan Versi Dokumen"
        description={`Set version v${selectedVerNumber} as active?`}
        footer={
          <>
            <button
              onClick={handleActivateConfirm}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-all"
            >
              Set Active
            </button>
            <button
              onClick={() => {
                setIsSetActiveOpen(false);
                setSelectedVerToActivate(null);
                setSelectedVerNumber('');
              }}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex gap-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded text-xs text-blue-700 dark:text-blue-300">
            <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Versi aktif akan digunakan sebagai sumber pengetahuan utama untuk proses analisis riset daerah di masa mendatang oleh asisten kecerdasan buatan (AI).
            </p>
          </div>
          <p className="text-xs text-gray-500">
            Versi aktif sebelumnya otomatis dipindahkan statusnya menjadi <strong>Archived</strong>.
          </p>
        </div>
      </Dialog>

    </div>
  );
}
