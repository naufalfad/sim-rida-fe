'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  useOpdStore, 
  OpdProposal, 
  StudyManagementData 
} from '@/store/useOpdStore';
import { useToast } from '@/components/ui/toast';
import { 
  FlaskConical, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Upload, 
  Plus, 
  Search, 
  ArrowRight, 
  TrendingUp, 
  Building2, 
  Layers, 
  Calendar,
  Sparkles,
  AlertCircle,
  FileCheck2,
  Paperclip,
  Share2,
  BookOpen,
  DollarSign,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  FolderLock,
  Loader2,
  RefreshCw,
  ExternalLink,
  Download,
  Trash2,
  Edit3
} from 'lucide-react';
import { isPdfDocument } from '@/lib/file-viewer';
import { openOrDownloadUploadedFile } from '@/lib/file-storage';

const MILESTONES: Array<{
  id: StudyManagementData['currentMilestone'];
  label: string;
  stepNumber: number;
  description: string;
}> = [
  { id: 'PERSIAPAN', label: 'Persiapan & KAK', stepNumber: 1, description: 'Penyusunan instrumen & metodologi' },
  { id: 'PENGUMPULAN_DATA', label: 'Pengumpulan Data', stepNumber: 2, description: 'Survei lapangan, FGD, & wawancara' },
  { id: 'ANALISIS_DATA', label: 'Analisis Data', stepNumber: 3, description: 'Pengolahan statistik & telaah kritis' },
  { id: 'PENYUSUNAN_DRAF', label: 'Draf Laporan Akhir', stepNumber: 4, description: 'Penyusunan naskah kajian komprehensif' },
  { id: 'FINALISASI', label: 'Finalisasi & Uji Publik', stepNumber: 5, description: 'Seminar hasil & draf rekomendasi' }
];

export default function AdminResearchPage() {
  const { toast } = useToast();
  const { 
    proposals, 
    updateStudyMilestone, 
    updateStudyKakRka, 
    addWorkingDocument,
    fetchStudies,
    fetchApprovedProposals,
    initializeStudy,
    approvedProposals,
    studies,
    isLoadingStudies
  } = useOpdStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterScheme, setFilterScheme] = useState<'ALL' | 'SWAKELOLA' | 'PENUNJUKAN_LANGSUNG' | 'E_KATALOG' | 'TENDER'>('ALL');
  const [selectedProposal, setSelectedProposal] = useState<OpdProposal | null>(null);

  // Inisiasi Riset Modal
  const [isInitModalOpen, setIsInitModalOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState<string | null>(null);

  // Form update milestone modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<StudyManagementData['currentMilestone']>('PENGUMPULAN_DATA');
  const [progressPercent, setProgressPercent] = useState(50);
  const [milestoneNotes, setMilestoneNotes] = useState('');

  // Form KAK & RKA modal
  const [isKakRkaModalOpen, setIsKakRkaModalOpen] = useState(false);
  const [kakDocName, setKakDocName] = useState('');
  const [kakDocSize, setKakDocSize] = useState('2.4 MB');
  const [rkaDocName, setRkaDocName] = useState('');
  const [rkaDocSize, setRkaDocSize] = useState('1.8 MB');
  const [rkaBudget, setRkaBudget] = useState<number | undefined>(undefined);

  // Form upload working doc modal
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<StudyManagementData['internalWorkingDocuments'][0]['type']>('Laporan Antara');
  const [docFileSize, setDocFileSize] = useState('2.5 MB');

  useEffect(() => {
    fetchStudies();
    fetchApprovedProposals();
  }, [fetchStudies, fetchApprovedProposals]);

  // Filter proposals that are approved into research (status IN_PROGRESS or COMPLETED or has studyData)
  const researchProposals = proposals.filter((p) => {
    const isResearchState = p.status === 'IN_PROGRESS' || p.status === 'COMPLETED' || !!p.studyData;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.opdName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const propMethod = p.scoringData?.executionMethod || (p.scoringData?.researchScheme === 'INTERNAL_BRIDA' ? 'SWAKELOLA' : 'KERJASAMA');
    const matchesScheme = filterScheme === 'ALL' || propMethod === filterScheme;
    return isResearchState && matchesSearch && matchesScheme;
  });

  // KPI Calculations
  const totalStudies = proposals.filter(p => p.status === 'IN_PROGRESS' || p.status === 'COMPLETED' || !!p.studyData).length;
  const inProgressStudies = proposals.filter(p => p.status === 'IN_PROGRESS').length;
  const internalStudies = proposals.filter(p => (p.status === 'IN_PROGRESS' || p.status === 'COMPLETED') && p.scoringData?.researchScheme === 'INTERNAL_BRIDA').length;
  const partnershipStudies = proposals.filter(p => (p.status === 'IN_PROGRESS' || p.status === 'COMPLETED') && p.scoringData?.researchScheme === 'KERJASAMA').length;

  const handleOpenUpdateModal = (prop: OpdProposal) => {
    setSelectedProposal(prop);
    setSelectedMilestone(prop.studyData?.currentMilestone || 'PERSIAPAN');
    setProgressPercent(prop.studyData?.percentProgress || 20);
    setMilestoneNotes(prop.studyData?.milestoneNotes || '');
    setIsUpdateModalOpen(true);
  };

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal) return;
    updateStudyMilestone(selectedProposal.id, selectedMilestone, progressPercent, milestoneNotes);
    setIsUpdateModalOpen(false);
    toast('Milestone & progres riset berhasil diperbarui.', 'success');
    // Refresh selected proposal
    const updated = proposals.find(p => p.id === selectedProposal.id);
    if (updated) setSelectedProposal(updated);
  };

  const handleOpenKakRkaModal = (prop: OpdProposal) => {
    setSelectedProposal(prop);
    setKakDocName(prop.studyData?.kakDocument?.name || (prop.torDocument ? prop.torDocument.name : `KAK_Pelaksanaan_${prop.code}.pdf`));
    setKakDocSize(prop.studyData?.kakDocument?.size || '2.4 MB');
    setRkaDocName(prop.studyData?.rkaDocument?.name || `RKA_Riset_${prop.code}.xlsx`);
    setRkaDocSize(prop.studyData?.rkaDocument?.size || '1.8 MB');
    setRkaBudget(prop.studyData?.rkaDocument?.budgetNominal ?? (prop.estimatedBudget || 75000000));
    setIsKakRkaModalOpen(true);
  };

  const handleSaveKakRka = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal) return;

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

    updateStudyKakRka(selectedProposal.id, kakDoc, rkaDoc);
    setIsKakRkaModalOpen(false);
    toast('Dokumen KAK & RKA pelaksanaan riset berhasil disimpan.', 'success');

    // Refresh
    const updated = proposals.find(p => p.id === selectedProposal.id);
    if (updated) setSelectedProposal(updated);
  };

  const handleOpenUploadDocModal = (prop: OpdProposal) => {
    setSelectedProposal(prop);
    setDocTitle('');
    setDocType('Laporan Antara');
    setIsUploadDocModalOpen(true);
  };

  const handleSaveWorkingDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal || !docTitle.trim()) return;

    addWorkingDocument(selectedProposal.id, {
      id: `doc-${Date.now()}`,
      title: docTitle.trim(),
      type: docType,
      uploadDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      fileSize: docFileSize || '2.0 MB'
    });

    setIsUploadDocModalOpen(false);
    toast('Berkas kerja berhasil ditambahkan ke repositori.', 'success');
    // Refresh
    const updated = proposals.find(p => p.id === selectedProposal.id);
    if (updated) setSelectedProposal(updated);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-8 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold tracking-wide uppercase mb-2">
            <FlaskConical className="w-5 h-5" />
            Modul 3: Admin BRIDA
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Manajemen Kajian & Monitoring Progres</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Kelola tahapan milestone riset, dokumentasi berkas kerja tim peneliti internal/mitra, serta pantau persentase progres menuju draf rekomendasi kebijakan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchStudies(); fetchApprovedProposals(); }}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3.5 py-2.5 rounded-xl transition text-xs border border-slate-700"
            title="Muat Ulang Kajian"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStudies ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsInitModalOpen(true)}
            className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-bold px-4 py-2.5 rounded-xl transition shadow text-xs"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Inisiasi Riset ({approvedProposals.length})</span>
          </button>
          <Link
            href="/admin/recommendation-builder"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition shadow-lg hover:shadow-emerald-500/20 text-xs"
          >
            <BookOpen className="w-4 h-4" />
            <span>Susun Policy Brief</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Kajian Terdaftar</p>
            <p className="text-2xl font-black text-slate-800">{totalStudies}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sedang Berjalan</p>
            <p className="text-2xl font-black text-amber-600">{inProgressStudies}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kajian Mandiri BRIDA</p>
            <p className="text-2xl font-black text-blue-600">{internalStudies}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kajian Kerjasama / PT</p>
            <p className="text-2xl font-black text-purple-600">{partnershipStudies}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul riset atau OPD..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase">Metode:</span>
          <div className="flex flex-wrap rounded-lg bg-slate-100 p-1 text-xs font-bold gap-1">
            <button
              onClick={() => setFilterScheme('ALL')}
              className={`px-2.5 py-1 rounded-md transition ${filterScheme === 'ALL' ? 'bg-white text-slate-900 shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterScheme('SWAKELOLA')}
              className={`px-2.5 py-1 rounded-md transition ${filterScheme === 'SWAKELOLA' ? 'bg-white text-emerald-700 shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Swakelola
            </button>
            <button
              onClick={() => setFilterScheme('PENUNJUKAN_LANGSUNG')}
              className={`px-2.5 py-1 rounded-md transition ${filterScheme === 'PENUNJUKAN_LANGSUNG' ? 'bg-white text-blue-700 shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Penunjukan Langsung
            </button>
            <button
              onClick={() => setFilterScheme('E_KATALOG')}
              className={`px-2.5 py-1 rounded-md transition ${filterScheme === 'E_KATALOG' ? 'bg-white text-purple-700 shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              E-Katalog
            </button>
            <button
              onClick={() => setFilterScheme('TENDER')}
              className={`px-2.5 py-1 rounded-md transition ${filterScheme === 'TENDER' ? 'bg-white text-amber-700 shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Tender
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Left list, Right active study details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Research Project Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Daftar Agenda Riset Aktif ({researchProposals.length})
          </h2>

          {researchProposals.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
              <FlaskConical className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">Belum ada riset yang aktif</p>
              <p className="text-xs text-slate-400 mt-1">Usulan yang telah lolos scoring di Modul 2 akan masuk ke sini.</p>
            </div>
          ) : (
            researchProposals.map((prop) => {
              const isSelected = selectedProposal?.id === prop.id;
              const progress = prop.studyData?.percentProgress || (prop.status === 'COMPLETED' ? 100 : 25);
              const milestoneObj = MILESTONES.find(m => m.id === prop.studyData?.currentMilestone) || MILESTONES[0];
              const method = prop.scoringData?.executionMethod || (prop.scoringData?.researchScheme === 'INTERNAL_BRIDA' ? 'SWAKELOLA' : 'KERJASAMA');

              return (
                <div
                  key={prop.id}
                  onClick={() => setSelectedProposal(prop)}
                  className={`cursor-pointer bg-white p-5 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md ${
                    isSelected ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded">
                      {prop.code}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      method === 'SWAKELOLA' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : method === 'PENUNJUKAN_LANGSUNG' 
                        ? 'bg-blue-100 text-blue-800'
                        : method === 'E_KATALOG'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {method === 'SWAKELOLA' 
                        ? 'Swakelola' 
                        : method === 'PENUNJUKAN_LANGSUNG' 
                        ? 'Penunjukan Langsung' 
                        : method === 'E_KATALOG' 
                        ? 'E-Katalog' 
                        : method === 'TENDER' 
                        ? 'Tender' 
                        : 'Kerjasama'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mb-1">{prop.title}</h3>
                  <p className="text-xs text-slate-500 mb-3">{prop.opdName}</p>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {milestoneObj.label}
                      </span>
                      <span className="text-emerald-700 font-bold">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          progress === 100 ? 'bg-emerald-600' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Management of Selected Study (7 cols) */}
        <div className="lg:col-span-7">
          {selectedProposal ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
              {/* Card Header */}
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md">
                    {selectedProposal.code}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/research/${selectedProposal.id}`}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Kelola di Halaman Penuh
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    <button
                      onClick={() => handleOpenUpdateModal(selectedProposal)}
                      className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                    >
                      Quick Update
                    </button>
                    <button
                      onClick={() => handleOpenUploadDocModal(selectedProposal)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Unggah Berkas
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedProposal.title}</h3>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {selectedProposal.opdName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Target Selesai: {selectedProposal.studyData?.targetCompletionDate || '30 November 2026'}
                    </span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Skor Penelaahan: {selectedProposal.scoringData?.totalScore || 85} / 100
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-8">
                {/* 1. Dokumen Perencanaan Riset: KAK & RKA */}
                <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <FolderLock className="w-4 h-4 text-emerald-600" />
                        Dokumen Perencanaan Riset (KAK & RKA Pelaksanaan)
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Wajib dilengkapi oleh Tim Litbang BRIDA / Mitra sebelum memfinalisasi naskah rekomendasi Policy Brief.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenKakRkaModal(selectedProposal)}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{selectedProposal.studyData?.kakDocument || selectedProposal.studyData?.rkaDocument ? 'Kelola / Edit KAK & RKA' : 'Tambah KAK & RKA'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* KAK Card */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          1. Kerangka Acuan Kerja (KAK)
                        </span>
                        {selectedProposal.studyData?.kakDocument ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                            <Check className="w-3 h-3" /> Tersedia
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" /> Belum Diunggah
                          </span>
                        )}
                      </div>

                      {selectedProposal.studyData?.kakDocument ? (
                        <div className="space-y-2">
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-800 truncate">{selectedProposal.studyData.kakDocument.name}</p>
                            <p className="text-[10px] text-slate-400">{selectedProposal.studyData.kakDocument.size} • Diunggah {selectedProposal.studyData.kakDocument.uploadDate}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedProposal.studyData?.kakDocument) {
                                openOrDownloadUploadedFile({
                                  name: selectedProposal.studyData.kakDocument.name,
                                  url: selectedProposal.studyData.kakDocument.url,
                                  dataUrl: selectedProposal.studyData.kakDocument.dataUrl,
                                  proposalCode: selectedProposal.code,
                                  proposalTitle: selectedProposal.title,
                                  opdName: selectedProposal.opdName,
                                  uploadDate: selectedProposal.studyData.kakDocument.uploadDate,
                                  size: selectedProposal.studyData.kakDocument.size,
                                }, toast);
                              }
                            }}
                            className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-2xs rounded-lg transition border border-blue-200 flex items-center justify-center gap-1.5"
                          >
                            {isPdfDocument(selectedProposal.studyData.kakDocument.name) ? (
                              <>
                                <ExternalLink className="w-3 h-3" />
                                <span>Buka PDF di Tab Baru</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3 h-3" />
                                <span>Unduh Dokumen KAK</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-2 space-y-1">
                          <p className="text-2xs text-slate-400 italic">Belum ada KAK pelaksanaan riset.</p>
                          <button
                            type="button"
                            onClick={() => handleOpenKakRkaModal(selectedProposal)}
                            className="text-2xs text-blue-600 hover:text-blue-700 font-bold"
                          >
                            + Unggah KAK Riset
                          </button>
                        </div>
                      )}
                    </div>

                    {/* RKA Card */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          2. Rencana Kerja & Anggaran (RKA)
                        </span>
                        {selectedProposal.studyData?.rkaDocument ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                            <Check className="w-3 h-3" /> Tervalidasi
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" /> Belum Diunggah
                          </span>
                        )}
                      </div>

                      {selectedProposal.studyData?.rkaDocument ? (
                        <div className="space-y-2">
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-800 truncate">{selectedProposal.studyData.rkaDocument.name}</p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                              <span>{selectedProposal.studyData.rkaDocument.size} • Diunggah {selectedProposal.studyData.rkaDocument.uploadDate}</span>
                            </div>
                            {selectedProposal.studyData.rkaDocument.budgetNominal && (
                              <p className="text-xs font-black text-emerald-700 font-mono mt-1">
                                Pagu RKA: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedProposal.studyData.rkaDocument.budgetNominal)}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedProposal.studyData?.rkaDocument) {
                                openOrDownloadUploadedFile({
                                  name: selectedProposal.studyData.rkaDocument.name,
                                  url: selectedProposal.studyData.rkaDocument.url,
                                  dataUrl: selectedProposal.studyData.rkaDocument.dataUrl,
                                  proposalCode: selectedProposal.code,
                                  proposalTitle: selectedProposal.title,
                                  opdName: selectedProposal.opdName,
                                  uploadDate: selectedProposal.studyData.rkaDocument.uploadDate,
                                  size: selectedProposal.studyData.rkaDocument.size,
                                }, toast);
                              }
                            }}
                            className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-2xs rounded-lg transition border border-emerald-200 flex items-center justify-center gap-1.5"
                          >
                            {isPdfDocument(selectedProposal.studyData.rkaDocument.name) ? (
                              <>
                                <ExternalLink className="w-3 h-3" />
                                <span>Buka PDF di Tab Baru</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3 h-3" />
                                <span>Unduh Berkas RKA</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-2 space-y-1">
                          <p className="text-2xs text-slate-400 italic">Belum ada RKA belanja riset.</p>
                          <button
                            type="button"
                            onClick={() => handleOpenKakRkaModal(selectedProposal)}
                            className="text-2xs text-emerald-600 hover:text-emerald-700 font-bold"
                          >
                            + Unggah RKA & Pagu
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Milestone Roadmap Step Indicator */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    Tahapan Milestone Kajian
                  </h4>

                  <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
                    {MILESTONES.map((m, idx) => {
                      const currentMilestoneIndex = MILESTONES.findIndex(x => x.id === (selectedProposal.studyData?.currentMilestone || 'PERSIAPAN'));
                      const isPast = idx < currentMilestoneIndex;
                      const isCurrent = idx === currentMilestoneIndex;

                      return (
                        <div key={m.id} className="relative">
                          {/* Circle on line */}
                          <div className={`absolute -left-[33px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isPast 
                              ? 'bg-emerald-600 text-white' 
                              : isCurrent 
                              ? 'bg-emerald-100 text-emerald-700 ring-4 ring-emerald-500/20 border-2 border-emerald-600' 
                              : 'bg-slate-200 text-slate-500'
                          }`}>
                            {isPast ? <CheckCircle2 className="w-4 h-4" /> : m.stepNumber}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${isCurrent ? 'text-emerald-700 font-extrabold' : isPast ? 'text-slate-800' : 'text-slate-400'}`}>
                                {m.label}
                              </span>
                              {isCurrent && (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                  Tahap Saat Ini ({selectedProposal.studyData?.percentProgress || 25}%)
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Milestone Notes box */}
                  {selectedProposal.studyData?.milestoneNotes && (
                    <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                      <span className="font-bold text-slate-900 block mb-1">Catatan Kemajuan Terakhir:</span>
                      {selectedProposal.studyData.milestoneNotes}
                    </div>
                  )}
                </div>

                {/* 3. Repositori Dokumen Internal / Berkas Kerja Riset */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-emerald-600" />
                      Repositori Dokumen Kerja Internal ({selectedProposal.studyData?.internalWorkingDocuments?.length || 0})
                    </h4>
                    <button
                      onClick={() => handleOpenUploadDocModal(selectedProposal)}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah Dokumen
                    </button>
                  </div>

                  {(!selectedProposal.studyData?.internalWorkingDocuments || selectedProposal.studyData.internalWorkingDocuments.length === 0) ? (
                    <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                      Belum ada berkas kerja yang diunggah (Data mentah, Laporan antara, FGD).
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedProposal.studyData.internalWorkingDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{doc.title}</p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                <span className="bg-slate-200/70 text-slate-700 px-1.5 py-0.2 rounded font-semibold">{doc.type}</span>
                                <span>•</span>
                                <span>{doc.fileSize}</span>
                                <span>•</span>
                                <span>Diunggah: {doc.uploadDate}</span>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => alert(`Mengunduh file: ${doc.title}`)}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition"
                          >
                            Unduh
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Action Bridge to Policy Brief Generator */}
                <div className={`p-4 rounded-xl border transition-all ${
                  selectedProposal.studyData?.kakDocument && selectedProposal.studyData?.rkaDocument
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : 'bg-amber-50/70 border-amber-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-black text-slate-900">Kajian Siap Direkomendasikan?</h5>
                        {selectedProposal.studyData?.kakDocument && selectedProposal.studyData?.rkaDocument ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> KAK & RKA Terpenuhi
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Lengkapi KAK & RKA
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">
                        {selectedProposal.studyData?.kakDocument && selectedProposal.studyData?.rkaDocument
                          ? 'Dokumen KAK & RKA telah lengkap. Anda dapat langsung menyusun naskah Policy Brief dan Rekomendasi Resmi.'
                          : 'Pastikan dokumen KAK & RKA telah diunggah sebelum memfinalisasi naskah rekomendasi untuk Kepala BRIDA.'}
                      </p>
                    </div>
                    <Link
                      href="/admin/recommendation-builder"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-2 shrink-0"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Buka Policy Brief Generator</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
              <FileCheck2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-800 text-base">Pilih Agenda Riset</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Klik salah satu usulan riset pada daftar sebelah kiri untuk memperbarui tahapan milestone atau mengunggah berkas kerja.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Update Milestone & Progress */}
      {isUpdateModalOpen && selectedProposal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6">
              <h3 className="font-black text-lg">Update Milestone & Kemajuan Kajian</h3>
              <p className="text-xs text-emerald-200 mt-1">{selectedProposal.title}</p>
            </div>

            <form onSubmit={handleSaveMilestone} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tahapan Milestone Saat Ini:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {MILESTONES.map((m) => (
                    <label 
                      key={m.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        selectedMilestone === m.id ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="milestone"
                        value={m.id}
                        checked={selectedMilestone === m.id}
                        onChange={() => setSelectedMilestone(m.id)}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{m.stepNumber}. {m.label}</span>
                        <span className="text-[11px] text-slate-500">{m.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Persentase Progres:
                  </label>
                  <span className="text-sm font-black text-emerald-700">{progressPercent}%</span>
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
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan Kemajuan / Kendala Riset:
                </label>
                <textarea
                  rows={3}
                  value={milestoneNotes}
                  onChange={(e) => setMilestoneNotes(e.target.value)}
                  placeholder="Contoh: FGD tahap pertama selesai dengan 15 narasumber ahli. Draft tabulasi data sedang disusun..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Unggah Berkas Kerja Internal */}
      {isUploadDocModalOpen && selectedProposal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6">
              <h3 className="font-black text-lg">Unggah Dokumen Kerja Internal</h3>
              <p className="text-xs text-emerald-200 mt-1">Tambahkan berkas pendukung riset untuk tim internal BRIDA.</p>
            </div>

            <form onSubmit={handleSaveWorkingDoc} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Judul Dokumen:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Transkrip FGD Pakar Tata Kota 12 Maret"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Jenis Dokumen:
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                >
                  <option value="Data Mentah">Data Mentah</option>
                  <option value="Laporan Antara">Laporan Antara</option>
                  <option value="Transkrip FGD / Wawancara">Transkrip FGD / Wawancara</option>
                  <option value="Olah Data Statistik">Olah Data Statistik</option>
                </select>
              </div>

              <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-center">
                <Upload className="w-8 h-8 mx-auto text-emerald-600 mb-1" />
                <p className="text-xs font-bold text-slate-700">Simulasi Pilih File (PDF, DOCX, XLSX)</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Maksimum ukuran 25MB</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadDocModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow"
                >
                  Simpan Dokumen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Kelola Dokumen KAK & RKA Riset */}
      {isKakRkaModalOpen && selectedProposal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6">
              <h3 className="font-black text-lg flex items-center gap-2">
                <FolderLock className="w-5 h-5" />
                Kelola Dokumen KAK & RKA Pelaksanaan Riset
              </h3>
              <p className="text-xs text-emerald-200 mt-1">{selectedProposal.title} ({selectedProposal.code})</p>
            </div>

            <form onSubmit={handleSaveKakRka} className="p-6 space-y-5">
              
              {/* KAK Field */}
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>1. Dokumen Kerangka Acuan Kerja (KAK) Riset:</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: KAK_Kajian_Stunting_BRIDA_2026.pdf"
                  value={kakDocName}
                  onChange={(e) => setKakDocName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Format: PDF / DOCX (Maks 25MB)</span>
                  <span className="font-semibold text-blue-700">Berkas Terlampir</span>
                </div>
              </div>

              {/* RKA Field & Nominal */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>2. Dokumen Rencana Kerja & Anggaran (RKA):</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: RKA_Belanja_Kajian_2026.xlsx"
                  value={rkaDocName}
                  onChange={(e) => setRkaDocName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Alokasi Pagu Belanja Riset (Rp):
                  </label>
                  <input
                    type="number"
                    value={rkaBudget ?? ''}
                    onChange={(e) => setRkaBudget(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Contoh: 85000000"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  {rkaBudget !== undefined && (
                    <span className="text-[11px] font-black text-emerald-800 block">
                      Terbaca: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(rkaBudget)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsKakRkaModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Dokumen KAK & RKA</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Inisiasi Usulan Approved Menjadi Kajian Riset */}
      {isInitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-6 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg flex items-center gap-2">
                    <Plus className="w-5 h-5 text-emerald-400" />
                    Inisiasi Kajian Riset dari Usulan Disetujui
                  </h3>
                  <p className="text-xs text-emerald-200 mt-1">
                    Pilih usulan penelitian yang telah disetujui Kepala BRIDA untuk dijadikan agenda riset aktif dan dibuatkan draf KAK awal.
                  </p>
                </div>
                <button
                  onClick={() => setIsInitModalOpen(false)}
                  className="text-white/70 hover:text-white text-lg font-bold px-2 py-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {approvedProposals.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700 text-sm">Tidak ada usulan berstatus APPROVED yang belum diinisiasi</p>
                  <p className="text-xs text-slate-400 mt-1">Seluruh usulan yang telah disetujui Kepala BRIDA sudah diinisiasi menjadi kajian riset aktif.</p>
                </div>
              ) : (
                approvedProposals.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-4 bg-slate-50 hover:bg-emerald-50/40 rounded-xl border border-slate-200 hover:border-emerald-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                          {prop.code}
                        </span>
                        <span className="text-xs font-bold text-slate-600">
                          {prop.opdName}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{prop.title}</h4>
                      <p className="text-xs text-slate-500">
                        Pagu Disetujui: <strong className="text-emerald-700 font-mono font-bold">
                          {prop.estimatedBudget ? `Rp ${prop.estimatedBudget.toLocaleString('id-ID')}` : 'Sesuai Standar'}
                        </strong>
                      </p>
                    </div>

                    <button
                      disabled={isInitializing === prop.id}
                      onClick={async () => {
                        setIsInitializing(prop.id);
                        try {
                          await initializeStudy(prop.id);
                          toast(`Kajian riset untuk usulan ${prop.code} berhasil diinisiasi.`, 'success');
                          fetchStudies();
                        } catch (err: any) {
                          toast(err.message || 'Gagal menginisiasi kajian', 'error');
                        } finally {
                          setIsInitializing(null);
                        }
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                    >
                      {isInitializing === prop.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      <span>Inisiasi Riset</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setIsInitModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
