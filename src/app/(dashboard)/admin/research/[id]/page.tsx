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
  Sparkles
} from 'lucide-react';

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
  const { user } = useAuthStore();
  const { 
    proposals, 
    updateStudyMilestone, 
    updateStudyKakRka, 
    addWorkingDocument 
  } = useOpdStore();

  const proposalId = resolvedParams.id;
  const proposal = proposals.find((p) => p.id === proposalId);

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

  const handleDeleteKak = () => {
    if (confirm('Apakah Anda yakin ingin menghapus berkas KAK pelaksanaan riset ini?')) {
      setKakDocName('');
      setKakDocSize('');
      setIsEditingKak(false);
      updateStudyKakRka(proposal.id, undefined, proposal.studyData?.rkaDocument);
      toast('Berkas KAK riset berhasil dihapus.', 'info');
    }
  };

  const handleDeleteRka = () => {
    if (confirm('Apakah Anda yakin ingin menghapus dokumen RKA dan pagu riset ini?')) {
      setRkaDocName('');
      setRkaDocSize('');
      setRkaBudget(undefined);
      setIsEditingRka(false);
      updateStudyKakRka(proposal.id, proposal.studyData?.kakDocument, undefined);
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
        uploadDate: todayStr
      } : undefined;

      const rkaDoc = rkaDocName.trim() ? {
        name: rkaDocName.trim(),
        size: rkaDocSize || '1.8 MB',
        uploadDate: todayStr,
        budgetNominal: rkaBudget
      } : undefined;

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

  const handleAddWorkingDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    try {
      addWorkingDocument(proposal.id, {
        id: `doc-${Date.now()}`,
        title: docTitle.trim(),
        type: docType,
        uploadDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        fileSize: '2.5 MB'
      });
      setDocTitle('');
      setIsAddingDoc(false);
      toast('Dokumen kerja berhasil ditambahkan ke repositori.', 'success');
    } catch (err: any) {
      toast('Gagal menambahkan dokumen kerja: ' + err.message, 'error');
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
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                        Tersedia
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                        Belum Ada
                      </span>
                    )}
                  </div>

                  {proposal.studyData?.kakDocument && !isEditingKak ? (
                    <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 break-words">
                          {proposal.studyData.kakDocument.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Ukuran: {proposal.studyData.kakDocument.size} • Diunggah: {proposal.studyData.kakDocument.uploadDate}
                        </p>
                      </div>

                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => alert(`Mengunduh KAK: ${proposal.studyData?.kakDocument?.name}`)}
                          className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 border border-blue-200"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh Dokumen KAK</span>
                        </button>
                        
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setIsEditingKak(true)}
                            className="flex-1 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center justify-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Ganti File</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteKak}
                            className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition flex items-center gap-1"
                            title="Hapus KAK"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <label className="block text-xs font-medium text-slate-600">
                        {isEditingKak ? 'Nama Berkas KAK Baru:' : 'Input Nama Berkas KAK:'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: KAK_Kajian_Revisi_2026.pdf"
                        value={kakDocName}
                        onChange={(e) => setKakDocName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />

                      {isEditingKak && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setIsEditingKak(false)}
                            className="text-xs font-medium text-slate-500 hover:text-slate-700 underline"
                          >
                            Batal
                          </button>
                        </div>
                      )}
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
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                        Tervalidasi
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                        Belum Ada
                      </span>
                    )}
                  </div>

                  {proposal.studyData?.rkaDocument && !isEditingRka ? (
                    <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 break-words">
                          {proposal.studyData.rkaDocument.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Ukuran: {proposal.studyData.rkaDocument.size} • Diunggah: {proposal.studyData.rkaDocument.uploadDate}
                        </p>
                        {proposal.studyData.rkaDocument.budgetNominal && (
                          <p className="text-sm font-bold text-emerald-700 font-mono mt-1.5">
                            Pagu: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(proposal.studyData.rkaDocument.budgetNominal)}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => alert(`Mengunduh RKA: ${proposal.studyData?.rkaDocument?.name}`)}
                          className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 border border-emerald-200"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh Dokumen RKA</span>
                        </button>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setIsEditingRka(true)}
                            className="flex-1 py-1.5 text-xs font-medium text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center justify-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Ganti File & Pagu</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteRka}
                            className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition flex items-center gap-1"
                            title="Hapus RKA"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <label className="block text-xs font-medium text-slate-600">
                        {isEditingRka ? 'Nama Berkas RKA Baru:' : 'Input Nama Berkas RKA:'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: RKA_Kajian_2026.xlsx"
                        value={rkaDocName}
                        onChange={(e) => setRkaDocName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-600">
                          Alokasi Pagu Belanja Riset (Rp):
                        </label>
                        <input
                          type="number"
                          value={rkaBudget ?? ''}
                          onChange={(e) => setRkaBudget(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="85000000"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                        {rkaBudget !== undefined && (
                          <span className="text-xs font-bold text-emerald-800 block pt-0.5">
                            Terbaca: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(rkaBudget)}
                          </span>
                        )}
                      </div>

                      {isEditingRka && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setIsEditingRka(false)}
                            className="text-xs font-medium text-slate-500 hover:text-slate-700 underline"
                          >
                            Batal
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

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
            </form>
          </div>

          {/* Card 2: Repositori Dokumen Kerja Internal */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-emerald-600" />
                  Dokumen Kerja Riset ({proposal.studyData?.internalWorkingDocuments?.length || 0})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Arsip data mentah survei, transkrip FGD/wawancara, olah statistik, dan laporan antara.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingDoc(!isAddingDoc)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition border border-emerald-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingDoc ? 'Tutup Form' : 'Tambah Berkas Kerja'}</span>
              </button>
            </div>

            {/* Form Tambah Dokumen */}
            {isAddingDoc && (
              <form onSubmit={handleAddWorkingDoc} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-medium text-slate-700">Judul Berkas:</label>
                    <input
                      type="text"
                      required
                      placeholder="Misal: Transkrip FGD Pakar Kebijakan 14 Maret..."
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">Jenis Dokumen:</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Data Mentah">Data Mentah</option>
                      <option value="Laporan Antara">Laporan Antara</option>
                      <option value="Transkrip FGD / Wawancara">Transkrip FGD / Wawancara</option>
                      <option value="Olah Data Statistik">Olah Data Statistik</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingDoc(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow"
                  >
                    Simpan Dokumen
                  </button>
                </div>
              </form>
            )}

            {/* List Dokumen */}
            {(!proposal.studyData?.internalWorkingDocuments || proposal.studyData.internalWorkingDocuments.length === 0) ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
                Belum ada berkas kerja internal yang diunggah.
              </div>
            ) : (
              <div className="space-y-2">
                {proposal.studyData.internalWorkingDocuments.map((doc) => (
                  <div key={doc.id} className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between gap-3 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
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
                      onClick={() => alert(`Mengunduh file: ${doc.title}`)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition shadow-sm shrink-0"
                    >
                      Unduh
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
    </div>
  );
}
