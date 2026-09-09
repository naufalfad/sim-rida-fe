'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  useOpdStore, 
  StudyManagementData 
} from '@/store/useOpdStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { DocumentViewerModal, DocumentReviewState } from '@/components/ui/document-viewer-modal';
import {
  ArrowLeft,
  FlaskConical,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Building2,
  Calendar,
  Layers,
  Save,
  Download,
  Paperclip,
  Check,
  FileSpreadsheet,
  FolderLock,
  Plus,
  BookOpen,
  ArrowRight,
  Upload,
  Activity,
  Trash2,
  Edit3,
  Copy,
  ChevronDown,
  ChevronUp,
  Tag,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { openOrDownloadFile, downloadFileDirectly, isPdfDocument } from '@/lib/file-viewer';
import { 
  uploadAndCacheFile, 
  openOrDownloadUploadedFile, 
  downloadDocumentFile, 
  cacheFileToLocalStorage 
} from '@/lib/file-storage';

interface PageProps {
  params: Promise<{ id: string }>;
}

const MILESTONES: Array<{
  id: StudyManagementData['currentMilestone'];
  label: string;
  stepNumber: number;
  description: string;
}> = [
  { id: 'PERSIAPAN', label: 'Persiapan & KAK', stepNumber: 1, description: 'Penyusunan instrumen metodologi & instrumen kajian' },
  { id: 'PENGUMPULAN_DATA', label: 'Pengumpulan Data', stepNumber: 2, description: 'Survei lapangan, wawancara mendalam, & FGD' },
  { id: 'ANALISIS_DATA', label: 'Analisis Data', stepNumber: 3, description: 'Pengolahan statistik & telaah komparatif' },
  { id: 'PENYUSUNAN_DRAF', label: 'Draf Laporan Akhir', stepNumber: 4, description: 'Penyusunan naskah kajian komprehensif' },
  { id: 'FINALISASI', label: 'Finalisasi & Uji Publik', stepNumber: 5, description: 'Seminar hasil riset & formulasi rekomendasi' }
];

export default function AdminResearchDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { user, token } = useAuthStore();
  const { 
    proposals, 
    updateStudyMilestone, 
    updateStudyKakRka, 
    addWorkingDocument 
  } = useOpdStore();

  const proposalId = resolvedParams.id;
  const proposal = proposals.find((p) => p.id === proposalId);

  // File input refs for uploading real files
  const kakFileInputRef = React.useRef<HTMLInputElement>(null);
  const rkaFileInputRef = React.useRef<HTMLInputElement>(null);
  const workingDocFileInputRef = React.useRef<HTMLInputElement>(null);

  const [isUploadingKak, setIsUploadingKak] = useState(false);
  const [isUploadingRka, setIsUploadingRka] = useState(false);
  const [isUploadingWorkingDoc, setIsUploadingWorkingDoc] = useState(false);
  const [selectedWorkingDocFile, setSelectedWorkingDocFile] = useState<File | null>(null);

  // Form states for Milestone & Progress
  const [selectedMilestone, setSelectedMilestone] = useState<StudyManagementData['currentMilestone']>(
    proposal?.studyData?.currentMilestone || 'PERSIAPAN'
  );
  const [progressPercent, setProgressPercent] = useState<number>(
    proposal?.studyData?.percentProgress || 25
  );
  const [milestoneNotes, setMilestoneNotes] = useState<string>(
    proposal?.studyData?.milestoneNotes || ''
  );
  const [targetCompletionDate, setTargetCompletionDate] = useState<string>(
    proposal?.studyData?.targetCompletionDate || '2026-11-30'
  );

  // Form states for KAK & RKA
  const [kakDocName, setKakDocName] = useState<string>(
    proposal?.studyData?.kakDocument?.name || `KAK_Pelaksanaan_${proposal?.code || ''}.pdf`
  );
  const [kakDocSize, setKakDocSize] = useState<string>(
    proposal?.studyData?.kakDocument?.size || '2.4 MB'
  );
  const [rkaDocName, setRkaDocName] = useState<string>(
    proposal?.studyData?.rkaDocument?.name || `RKA_Riset_${proposal?.code || ''}.xlsx`
  );
  const [rkaDocSize, setRkaDocSize] = useState<string>(
    proposal?.studyData?.rkaDocument?.size || '1.8 MB'
  );
  const [rkaBudget, setRkaBudget] = useState<number | undefined>(
    proposal?.studyData?.rkaDocument?.budgetNominal ?? (proposal?.estimatedBudget || 75000000)
  );

  const [isEditingKak, setIsEditingKak] = useState(false);
  const [isEditingRka, setIsEditingRka] = useState(false);

  // Working Doc Form states
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<StudyManagementData['internalWorkingDocuments'][0]['type']>('Laporan Antara');
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  // Context Accordion
  const [isContextOpen, setIsContextOpen] = useState(false);

  const [documentReview, setDocumentReview] = useState<DocumentReviewState | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!proposal) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Agenda Riset Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500">Data riset dengan ID tersebut tidak ditemukan dalam sistem.</p>
        <button
          onClick={() => router.push('/admin/research')}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow"
        >
          Kembali ke Manajemen Kajian
        </button>
      </div>
    );
  }

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      updateStudyMilestone(proposal.id, selectedMilestone, progressPercent, milestoneNotes);
      toast('Milestone & kemajuan progres riset berhasil diperbarui.', 'success');
    } catch (err: any) {
      toast('Gagal memperbarui milestone: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Upload Ulang / Ganti Berkas KAK dari Komputer
  const handleKakFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingKak(true);
    try {
      const stored = await uploadAndCacheFile(file, token);
      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      
      const newKakDoc = {
        name: stored.name,
        size: stored.size,
        uploadDate: stored.uploadDate || todayStr,
        url: stored.url,
        dataUrl: stored.dataUrl,
      };

      setKakDocName(stored.name);
      setKakDocSize(stored.size);
      setIsEditingKak(false);

      // Simpan langsung ke state proposal
      updateStudyKakRka(proposal.id, newKakDoc, proposal.studyData?.rkaDocument);
      toast(`Berkas KAK baru "${stored.name}" (${stored.size}) berhasil diunggah dan disimpan.`, 'success');
    } catch (err: any) {
      toast('Gagal mengunggah berkas KAK: ' + err.message, 'error');
    } finally {
      setIsUploadingKak(false);
      if (e.target) e.target.value = '';
    }
  };

  // Handler: Upload Ulang / Ganti Berkas RKA dari Komputer
  const handleRkaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingRka(true);
    try {
      const stored = await uploadAndCacheFile(file, token);
      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      
      const newRkaDoc = {
        name: stored.name,
        size: stored.size,
        uploadDate: stored.uploadDate || todayStr,
        budgetNominal: rkaBudget,
        url: stored.url,
        dataUrl: stored.dataUrl,
      };

      setRkaDocName(stored.name);
      setRkaDocSize(stored.size);
      setIsEditingRka(false);

      updateStudyKakRka(proposal.id, proposal.studyData?.kakDocument, newRkaDoc);
      toast(`Berkas RKA baru "${stored.name}" (${stored.size}) berhasil diunggah dan disimpan.`, 'success');
    } catch (err: any) {
      toast('Gagal mengunggah berkas RKA: ' + err.message, 'error');
    } finally {
      setIsUploadingRka(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDeleteKak = () => {
    if (confirm('Apakah Anda yakin ingin menghapus berkas KAK pelaksanaan riset ini?')) {
      setKakDocName('');
      setKakDocSize('');
      setIsEditingKak(false);
      updateStudyKakRka(proposal.id, null, proposal.studyData?.rkaDocument);
      toast('Berkas KAK riset berhasil dihapus.', 'info');
    }
  };

  const handleDeleteRka = () => {
    if (confirm('Apakah Anda yakin ingin menghapus dokumen RKA dan pagu riset ini?')) {
      setRkaDocName('');
      setRkaDocSize('');
      setRkaBudget(undefined);
      setIsEditingRka(false);
      updateStudyKakRka(proposal.id, proposal.studyData?.kakDocument, null);
      toast('Dokumen RKA dan pagu riset berhasil dihapus.', 'info');
    }
  };

  const handleSaveKakRka = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      
      const kakDoc = kakDocName.trim() ? {
        name: kakDocName.trim(),
        size: kakDocSize || '2.4 MB',
        uploadDate: proposal.studyData?.kakDocument?.uploadDate || todayStr,
        url: proposal.studyData?.kakDocument?.url,
        dataUrl: proposal.studyData?.kakDocument?.dataUrl,
      } : null;

      const rkaDoc = rkaDocName.trim() ? {
        name: rkaDocName.trim(),
        size: rkaDocSize || '1.8 MB',
        uploadDate: proposal.studyData?.rkaDocument?.uploadDate || todayStr,
        budgetNominal: rkaBudget,
        url: proposal.studyData?.rkaDocument?.url,
        dataUrl: proposal.studyData?.rkaDocument?.dataUrl,
      } : null;

      updateStudyKakRka(proposal.id, kakDoc, rkaDoc);
      setIsEditingKak(false);
      setIsEditingRka(false);
      toast('Dokumen KAK & RKA riset berhasil diperbarui.', 'success');
    } catch (err: any) {
      toast('Gagal menyimpan dokumen KAK & RKA: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddWorkingDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() && !selectedWorkingDocFile) return;

    setIsUploadingWorkingDoc(true);
    try {
      let fileSize = '2.5 MB';
      let docName = docTitle.trim();

      if (selectedWorkingDocFile) {
        const stored = await uploadAndCacheFile(selectedWorkingDocFile, token);
        fileSize = stored.size;
        if (!docName) docName = stored.name;
      }

      addWorkingDocument(proposal.id, {
        id: `doc-${Date.now()}`,
        title: docName || 'Dokumen Kerja Lapangan.pdf',
        type: docType,
        uploadDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        fileSize: fileSize,
      });

      setDocTitle('');
      setSelectedWorkingDocFile(null);
      setIsAddingDoc(false);
      toast('Dokumen kerja berhasil ditambahkan ke repositori.', 'success');
    } catch (err: any) {
      toast('Gagal menambahkan dokumen kerja: ' + err.message, 'error');
    } finally {
      setIsUploadingWorkingDoc(false);
    }
  };

  const isKakRkaComplete = !!(proposal.studyData?.kakDocument && proposal.studyData?.rkaDocument);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      
      {/* 1. Breadcrumbs & Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/research"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Manajemen Kajian</span>
        </Link>
        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
          {proposal.id}
        </span>
      </div>

      {/* 2. Clean Executive Header Card */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                {proposal.code}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md flex items-center gap-1.5 border ${
                proposal.scoringData?.executionMethod === 'SWAKELOLA'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : proposal.scoringData?.executionMethod === 'PENUNJUKAN_LANGSUNG'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : proposal.scoringData?.executionMethod === 'E_KATALOG'
                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                  : proposal.scoringData?.executionMethod === 'TENDER'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-teal-50 text-teal-700 border-teal-200'
              }`}>
                <FlaskConical className="w-3.5 h-3.5" />
                {proposal.scoringData?.executionMethod === 'SWAKELOLA'
                  ? 'Metode: Swakelola'
                  : proposal.scoringData?.executionMethod === 'PENUNJUKAN_LANGSUNG'
                  ? 'Metode: Penunjukan Langsung'
                  : proposal.scoringData?.executionMethod === 'E_KATALOG'
                  ? 'Metode: E-Katalog'
                  : proposal.scoringData?.executionMethod === 'TENDER'
                  ? 'Metode: Tender'
                  : (proposal.scoringData?.researchScheme === 'KERJASAMA' ? 'Metode: Kerjasama' : 'Metode: Swakelola')}
              </span>
              <span className="text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-md">
                {proposal.category}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">
              {proposal.title}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-500 pt-1">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                <Building2 className="w-4 h-4 text-slate-400" />
                {proposal.opdName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Target Selesai: <strong className="text-slate-700 font-semibold">{proposal.studyData?.targetCompletionDate || '30 November 2026'}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50/80 px-2.5 py-0.5 rounded-md border border-emerald-200">
                Skor Prioritas: {proposal.scoringData?.totalScore || 85} / 100
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 pt-1">
            <Link
              href="/admin/recommendation-builder"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>Susun Policy Brief</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>

      {/* 3. Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Planning Documents (KAK & RKA), Repository, & Context (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Dokumen Perencanaan Riset (KAK & RKA Pelaksanaan) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FolderLock className="w-5 h-5 text-emerald-600" />
                  Dokumen Perencanaan Riset (KAK & RKA)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kerangka acuan kerja teknis dan rencana anggaran pelaksanaan riset oleh BRIDA.
                </p>
              </div>

              {isKakRkaComplete ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <Check className="w-3.5 h-3.5" /> Berkas Lengkap
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5" /> Perlu Dilengkapi
                </span>
              )}
            </div>

            {/* Hidden File Inputs */}
            <input
              type="file"
              ref={kakFileInputRef}
              onChange={handleKakFileUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              className="hidden"
            />
            <input
              type="file"
              ref={rkaFileInputRef}
              onChange={handleRkaFileUpload}
              accept=".xlsx,.xls,.pdf,.csv,.doc,.docx"
              className="hidden"
            />

            <form onSubmit={handleSaveKakRka} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. KAK Box */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      1. Dokumen KAK
                    </span>
                    {proposal.studyData?.kakDocument ? (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded flex items-center gap-1">
                        <Check className="w-3 h-3" /> Tersedia
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Belum Ada
                      </span>
                    )}
                  </div>

                  {proposal.studyData?.kakDocument ? (
                    <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <p className="text-sm font-semibold text-slate-800 break-words flex-1">
                            {proposal.studyData.kakDocument.name}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 pl-6">
                          Ukuran: {proposal.studyData.kakDocument.size} • Diunggah: {proposal.studyData.kakDocument.uploadDate}
                        </p>
                      </div>

                      {isEditingKak ? (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <label className="block text-2xs font-semibold text-slate-600">
                            Ubah Nama Berkas KAK:
                          </label>
                          <input
                            type="text"
                            value={kakDocName}
                            onChange={(e) => setKakDocName(e.target.value)}
                            placeholder="Nama berkas KAK..."
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => kakFileInputRef.current?.click()}
                              disabled={isUploadingKak}
                              className="px-2.5 py-1 text-2xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition flex items-center gap-1"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Pilih File Baru dari Komputer</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingKak(false)}
                              className="text-2xs text-slate-500 hover:text-slate-700 underline"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-1 border-t border-slate-100">
                          {/* Tombol Buka PDF / Unduh KAK */}
                          <button
                            type="button"
                            onClick={() => {
                              if (proposal.studyData?.kakDocument) {
                                openOrDownloadUploadedFile({
                                  name: proposal.studyData.kakDocument.name,
                                  url: proposal.studyData.kakDocument.url,
                                  dataUrl: proposal.studyData.kakDocument.dataUrl,
                                  proposalCode: proposal.code,
                                  proposalTitle: proposal.title,
                                  opdName: proposal.opdName,
                                  uploadDate: proposal.studyData.kakDocument.uploadDate,
                                  size: proposal.studyData.kakDocument.size,
                                }, toast);
                              }
                            }}
                            className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 border border-blue-200 shadow-2xs"
                          >
                            {isPdfDocument(proposal.studyData.kakDocument.name) ? (
                              <>
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Buka PDF di Tab Baru</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>Unduh Berkas KAK ({proposal.studyData.kakDocument.name.split('.').pop()?.toUpperCase()})</span>
                              </>
                            )}
                          </button>
                          
                          {/* Tombol Aksi: Ganti File, Ubah Nama, Hapus */}
                          <div className="flex items-center justify-between gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => kakFileInputRef.current?.click()}
                              disabled={isUploadingKak}
                              className="flex-1 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 rounded-lg transition flex items-center justify-center gap-1"
                              title="Pilih file dari komputer untuk mengganti berkas KAK ini"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{isUploadingKak ? 'Mengunggah...' : 'Upload Ulang'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setIsEditingKak(true)}
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1"
                              title="Ubah nama berkas"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleDeleteKak}
                              className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition flex items-center gap-1"
                              title="Hapus berkas KAK dari agenda riset ini"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Ketika KAK Belum Ada / Dihapus: Tampilkan Dropzone / Upload Box */
                    <div className="p-4 bg-white rounded-xl border-2 border-dashed border-blue-200 text-center space-y-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Unggah Berkas KAK Riset</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Format didukung: PDF, DOC, DOCX (Maks 25MB)
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => kakFileInputRef.current?.click()}
                          disabled={isUploadingKak}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shadow flex items-center justify-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploadingKak ? 'Sedang Mengunggah...' : 'Pilih Berkas KAK dari Komputer'}</span>
                        </button>

                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const manualName = prompt('Masukkan nama berkas KAK:', `KAK_Kajian_${proposal.code}.pdf`);
                              if (manualName && manualName.trim()) {
                                setKakDocName(manualName.trim());
                                setKakDocSize('2.4 MB');
                                const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                                updateStudyKakRka(proposal.id, {
                                  name: manualName.trim(),
                                  size: '2.4 MB',
                                  uploadDate: todayStr
                                }, proposal.studyData?.rkaDocument);
                                toast('Nama berkas KAK berhasil disimpan.', 'success');
                              }
                            }}
                            className="text-[11px] text-slate-500 hover:text-blue-600 underline"
                          >
                            Atau input nama berkas manual
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. RKA Box */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      2. Dokumen RKA & Pagu
                    </span>
                    {proposal.studyData?.rkaDocument ? (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded flex items-center gap-1">
                        <Check className="w-3 h-3" /> Tervalidasi
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Belum Ada
                      </span>
                    )}
                  </div>

                  {proposal.studyData?.rkaDocument ? (
                    <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <div className="flex items-start gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <p className="text-sm font-semibold text-slate-800 break-words flex-1">
                            {proposal.studyData.rkaDocument.name}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 pl-6">
                          Ukuran: {proposal.studyData.rkaDocument.size} • Diunggah: {proposal.studyData.rkaDocument.uploadDate}
                        </p>
                        {proposal.studyData.rkaDocument.budgetNominal && (
                          <p className="text-sm font-bold text-emerald-700 font-mono mt-1.5 pl-6">
                            Pagu: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(proposal.studyData.rkaDocument.budgetNominal)}
                          </p>
                        )}
                      </div>

                      {isEditingRka ? (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <div>
                            <label className="block text-2xs font-semibold text-slate-600 mb-0.5">
                              Nama Berkas RKA:
                            </label>
                            <input
                              type="text"
                              value={rkaDocName}
                              onChange={(e) => setRkaDocName(e.target.value)}
                              placeholder="Nama berkas RKA..."
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-2xs font-semibold text-slate-600 mb-0.5">
                              Nominal Pagu Anggaran (Rp):
                            </label>
                            <input
                              type="number"
                              value={rkaBudget ?? ''}
                              onChange={(e) => setRkaBudget(e.target.value ? Number(e.target.value) : undefined)}
                              placeholder="Pagu anggaran riset..."
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => rkaFileInputRef.current?.click()}
                              disabled={isUploadingRka}
                              className="px-2.5 py-1 text-2xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition flex items-center gap-1"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Pilih File Baru dari Komputer</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingRka(false)}
                              className="text-2xs text-slate-500 hover:text-slate-700 underline"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-1 border-t border-slate-100">
                          {/* Tombol Buka PDF / Unduh RKA */}
                          <button
                            type="button"
                            onClick={() => {
                              if (proposal.studyData?.rkaDocument) {
                                openOrDownloadUploadedFile({
                                  name: proposal.studyData.rkaDocument.name,
                                  url: proposal.studyData.rkaDocument.url,
                                  dataUrl: proposal.studyData.rkaDocument.dataUrl,
                                  proposalCode: proposal.code,
                                  proposalTitle: proposal.title,
                                  opdName: proposal.opdName,
                                  uploadDate: proposal.studyData.rkaDocument.uploadDate,
                                  size: proposal.studyData.rkaDocument.size,
                                }, toast);
                              }
                            }}
                            className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 border border-emerald-200 shadow-2xs"
                          >
                            {isPdfDocument(proposal.studyData.rkaDocument.name) ? (
                              <>
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Buka PDF di Tab Baru</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>Unduh Berkas RKA ({proposal.studyData.rkaDocument.name.split('.').pop()?.toUpperCase()})</span>
                              </>
                            )}
                          </button>

                          {/* Tombol Aksi: Ganti File, Edit, Hapus */}
                          <div className="flex items-center justify-between gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => rkaFileInputRef.current?.click()}
                              disabled={isUploadingRka}
                              className="flex-1 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200 rounded-lg transition flex items-center justify-center gap-1"
                              title="Pilih file dari komputer untuk mengganti berkas RKA ini"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{isUploadingRka ? 'Mengunggah...' : 'Upload Ulang'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setIsEditingRka(true)}
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1"
                              title="Ubah nominal pagu atau nama file"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleDeleteRka}
                              className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition flex items-center gap-1"
                              title="Hapus berkas RKA dari agenda riset ini"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Ketika RKA Belum Ada / Dihapus: Tampilkan Dropzone / Upload Box */
                    <div className="p-4 bg-white rounded-xl border-2 border-dashed border-emerald-200 text-center space-y-3">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Unggah Berkas RKA & Pagu</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Format: XLSX, XLS, PDF, CSV (Maks 25MB)
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => rkaFileInputRef.current?.click()}
                          disabled={isUploadingRka}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow flex items-center justify-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploadingRka ? 'Sedang Mengunggah...' : 'Pilih Berkas RKA dari Komputer'}</span>
                        </button>

                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const manualName = prompt('Masukkan nama berkas RKA:', `RKA_Riset_${proposal.code}.xlsx`);
                              if (manualName && manualName.trim()) {
                                setRkaDocName(manualName.trim());
                                setRkaDocSize('1.8 MB');
                                const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                                updateStudyKakRka(proposal.id, proposal.studyData?.kakDocument, {
                                  name: manualName.trim(),
                                  size: '1.8 MB',
                                  uploadDate: todayStr,
                                  budgetNominal: rkaBudget || 75000000
                                });
                                toast('Nama berkas RKA berhasil disimpan.', 'success');
                              }
                            }}
                            className="text-[11px] text-slate-500 hover:text-emerald-700 underline"
                          >
                            Atau input nama berkas manual
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {(isEditingKak || isEditingRka) && (
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition shadow flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan Dokumen KAK & RKA</span>
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Card 2: Dokumen Kerja Lapangan & Instrumen Kajian */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Dokumen Kerja Lapangan & Hasil Kajian ({proposal.studyData?.internalWorkingDocuments?.length || 0})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lampiran instrumen kuesioner, data mentah survei, draf laporan antara, hingga laporan akhir komprehensif.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingDoc(!isAddingDoc)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 text-xs font-semibold rounded-xl transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Dokumen</span>
              </button>
            </div>

            {/* Hidden Input for Working Docs */}
            <input
              type="file"
              ref={workingDocFileInputRef}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setSelectedWorkingDocFile(f);
                  if (!docTitle) setDocTitle(f.name);
                }
              }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv"
              className="hidden"
            />

            {/* Form Tambah Dokumen */}
            {isAddingDoc && (
              <form onSubmit={handleAddWorkingDoc} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800">Unggah Dokumen Kerja / Progres</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-2xs font-semibold text-slate-600 mb-1">Judul / Nama Dokumen</label>
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="Contoh: Tabulasi Kuesioner Survei Warga Mimika.xlsx"
                      required
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-semibold text-slate-600 mb-1">Tipe / Kategori Dokumen</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="Data Mentah">Data Mentah (Raw Data / Dataset)</option>
                      <option value="Laporan Antara">Laporan Antara (Midterm Report)</option>
                      <option value="Transkrip FGD / Wawancara">Transkrip FGD / Wawancara</option>
                      <option value="Olah Data Statistik">Olah Data Statistik</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-white border border-dashed border-slate-300 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs text-slate-600 truncate">
                      {selectedWorkingDocFile ? selectedWorkingDocFile.name : 'Pilih file nyata dari komputer (opsional)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => workingDocFileInputRef.current?.click()}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-2xs font-semibold rounded-lg shrink-0 transition"
                  >
                    {selectedWorkingDocFile ? 'Ganti File' : 'Pilih File'}
                  </button>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingDoc(false);
                      setSelectedWorkingDocFile(null);
                    }}
                    className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingWorkingDoc}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isUploadingWorkingDoc ? 'Menyimpan...' : 'Simpan Dokumen'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* List Dokumen Kerja */}
            {(!proposal.studyData?.internalWorkingDocuments || proposal.studyData.internalWorkingDocuments.length === 0) ? (
              <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                Belum ada dokumen kerja lapangan yang diunggah untuk riset ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {proposal.studyData.internalWorkingDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{doc.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          <span className="font-medium text-slate-700">{doc.type}</span> • {doc.fileSize} • Diunggah: {doc.uploadDate}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        openOrDownloadUploadedFile({
                          name: doc.title,
                          proposalCode: proposal.code,
                          proposalTitle: proposal.title,
                          opdName: proposal.opdName,
                          uploadDate: doc.uploadDate,
                          size: doc.fileSize,
                        }, toast);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition shadow-sm shrink-0 flex items-center gap-1"
                    >
                      {isPdfDocument(doc.title) ? (
                        <>
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka PDF</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh File</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 3: Konteks & Uraian Masalah Usulan (Collapsible / Clean) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setIsContextOpen(!isContextOpen)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-slate-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Uraian Masalah & Urgensi dari OPD</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Latar belakang permasalahan lapangan dan justifikasi kebijakan pengusul.</p>
                </div>
              </div>
              {isContextOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>

            {isContextOpen && (
              <div className="p-6 pt-0 border-t border-slate-100 space-y-4 text-sm text-slate-700">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">1. Identifikasi Masalah Lapangan:</span>
                  <p className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed text-justify">
                    {proposal.problemStatement}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">2. Urgensi & Target Dampak Kebijakan:</span>
                  <p className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed text-justify">
                    {proposal.urgencyReason}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Milestone Roadmap & Progress Form (5 cols, Sticky) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 sticky top-6">
            
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
                <Activity className="w-4 h-4" />
                Monitoring & Update Kemajuan
              </div>
              <h3 className="text-lg font-bold text-slate-900">Tahapan Milestone Riset</h3>
              <p className="text-xs text-slate-500 mt-0.5">Perbarui milestone aktif, persentase capaian, dan catatan kemajuan.</p>
            </div>

            <form onSubmit={handleSaveMilestone} className="space-y-5">
              
              {/* Stepper Milestone Radio Cards */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pilih Tahapan Milestone:
                </label>

                <div className="space-y-2">
                  {MILESTONES.map((m) => {
                    const isSelected = selectedMilestone === m.id;
                    return (
                      <label
                        key={m.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600 shadow-sm'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="milestoneRadio"
                          checked={isSelected}
                          onChange={() => setSelectedMilestone(m.id)}
                          className="mt-1 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-slate-900 block">{m.stepNumber}. {m.label}</span>
                          <span className="text-xs text-slate-500 block mt-0.5">{m.description}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Progress Slider with Presets */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Persentase Capaian:
                  </label>
                  <span className="text-sm font-bold text-emerald-700 font-mono bg-emerald-100 px-3 py-0.5 rounded-lg border border-emerald-200">
                    {progressPercent}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressPercent}
                  onChange={(e) => setProgressPercent(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />

                <div className="flex items-center justify-between gap-1.5 pt-1">
                  {[25, 50, 75, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setProgressPercent(preset)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg border transition ${
                        progressPercent === preset
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Catatan Kemajuan */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Catatan Kemajuan & Log Lapangan:
                </label>
                <textarea
                  rows={3}
                  value={milestoneNotes}
                  onChange={(e) => setMilestoneNotes(e.target.value)}
                  placeholder="Contoh: Tim telah menyelesaikan survei di 15 kecamatan dan sedang menyusun tabulasi data..."
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm leading-relaxed text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Target Selesai */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Target Tanggal Penyelesaian:
                </label>
                <input
                  type="date"
                  value={targetCompletionDate}
                  onChange={(e) => setTargetCompletionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Pembaruan Milestone</span>
              </button>
            </form>

            {/* Policy Brief Recommendation Bridge Box */}
            <div className={`p-4 rounded-xl border transition-all ${
              isKakRkaComplete
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-amber-50/70 border-amber-200'
            }`}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-slate-900">Tahap Rekomendasi Kebijakan</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isKakRkaComplete
                    ? 'Dokumen KAK & RKA telah lengkap. Anda dapat langsung menyusun naskah Policy Brief dan Surat Rekomendasi Resmi.'
                    : 'Disarankan melengkapi dokumen KAK & RKA terlebih dahulu sebelum menyusun naskah rekomendasi.'}
                </p>
                <Link
                  href="/admin/recommendation-builder"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow flex items-center justify-center gap-1.5"
                >
                  <span>Buka Policy Brief Generator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Document Review & Viewer Modal */}
      {documentReview && (
        <DocumentViewerModal
          isOpen={!!documentReview}
          onClose={() => setDocumentReview(null)}
          document={documentReview}
        />
      )}
    </div>
  );
}
