'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  useOpdStore, 
  OpdProposal, 
  ResearchStudyItem,
  TeamMemberData,
  ResearchWorkingDocItem,
  RkaItemData
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
  ExternalLink,
  Users,
  Award,
  Sparkles,
  ShieldCheck,
  FileCheck2,
  Info,
  Briefcase,
  Database,
  FileCode2,
  RefreshCw,
  Phone,
  Mail,
  DollarSign
} from 'lucide-react';
import { isPdfDocument } from '@/lib/file-viewer';
import { openOrDownloadUploadedFile, uploadAndCacheFile } from '@/lib/file-storage';
import { cn } from '@/lib/utils/cn';

interface RkaRow {
  id?: string;
  category: string;
  description: string;
  volume: number;
  unit: string;
  unitPrice: number;
}

export default function AdminResearchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { token } = useAuthStore();
  const proposalOrStudyId = params.id as string;

  const {
    proposals,
    fetchProposals,
    studies,
    fetchStudies,
    fetchStudyById,
    currentStudy,
    saveStudyTeam,
    saveStudyRka,
    saveStudyCooperationDoc,
    addStudyWorkingDoc,
    deleteStudyWorkingDoc,
    submitStudyFinalReport,
    isLoadingStudies
  } = useOpdStore();

  // Selected proposal & study states
  const [activeTab, setActiveTab] = useState<'TEAM_AND_LEGAL' | 'WORKING_DOCS' | 'FINAL_REPORT'>('TEAM_AND_LEGAL');

  // Load initial data
  useEffect(() => {
    fetchStudies();
    fetchProposals();
  }, [fetchStudies, fetchProposals]);

  // Find corresponding proposal & study
  const matchedProposal = useMemo(() => {
    return proposals.find((p) => p.id === proposalOrStudyId || p.code === proposalOrStudyId);
  }, [proposals, proposalOrStudyId]);

  const matchedStudy = useMemo(() => {
    return studies.find((s) => s.id === proposalOrStudyId || s.proposalId === proposalOrStudyId || s.proposalId === matchedProposal?.id);
  }, [studies, proposalOrStudyId, matchedProposal]);

  // Fetch full detail if study ID exists
  useEffect(() => {
    if (matchedStudy?.id) {
      fetchStudyById(matchedStudy.id);
    }
  }, [matchedStudy?.id, fetchStudyById]);

  const study = currentStudy || matchedStudy;
  const proposal = matchedProposal || study?.proposal;

  // Plafon Pagu dari KAK Tahap 3
  const plafonBudget = study?.allocatedBudget || proposal?.estimatedBudget || 100000000;

  // Tab 1: Team & Legal States
  const [executionScheme, setExecutionScheme] = useState<string>('SWAKELOLA');
  const [teamMembers, setTeamMembers] = useState<TeamMemberData[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Ketua Tim Peneliti');
  const [newMemberInstitution, setNewMemberInstitution] = useState('BRIDA Kab. Mimika');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [isSavingScheme, setIsSavingScheme] = useState(false);

  // Tab 1: RKA Belanja States (Clean, starts empty unless saved in DB)
  const [rkaRows, setRkaRows] = useState<RkaRow[]>([]);
  const [isSavingRka, setIsSavingRka] = useState(false);

  // Cooperation Document states
  const [coopDocName, setCoopDocName] = useState('');
  const [coopDocUrl, setCoopDocUrl] = useState('');
  const [isUploadingCoop, setIsUploadingCoop] = useState(false);
  const coopFileInputRef = React.useRef<HTMLInputElement>(null);

  // Tab 2: Working Documents States
  const [workingDocTitle, setWorkingDocTitle] = useState('');
  const [workingDocType, setWorkingDocType] = useState('Data Tabulasi');
  const [workingDocSize, setWorkingDocSize] = useState('2.4 MB');
  const [isUploadingWorkingDoc, setIsUploadingWorkingDoc] = useState(false);
  const workingDocInputRef = React.useRef<HTMLInputElement>(null);

  // Tab 3: Final Report States
  const [finalReportName, setFinalReportName] = useState('');
  const [finalReportUrl, setFinalReportUrl] = useState('');
  const [finalReportSummary, setFinalReportSummary] = useState('');
  const [isUploadingFinalReport, setIsUploadingFinalReport] = useState(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const finalReportInputRef = React.useRef<HTMLInputElement>(null);

  // Calculate RKA Totals vs Plafon KAK
  const totalRkaBudget = useMemo(() => {
    return rkaRows.reduce((sum, row) => sum + (Number(row.volume) || 0) * (Number(row.unitPrice) || 0), 0);
  }, [rkaRows]);

  const remainingBudget = plafonBudget - totalRkaBudget;
  const isBudgetExceeded = remainingBudget < 0;

  // Initialize form state purely from database
  useEffect(() => {
    if (study) {
      if (study.executionScheme) {
        setExecutionScheme(study.executionScheme);
      }
      if (study.teamMembers && Array.isArray(study.teamMembers) && study.teamMembers.length > 0) {
        setTeamMembers(study.teamMembers);
      } else {
        setTeamMembers([]);
      }

      if (study.rkaItems && Array.isArray(study.rkaItems) && study.rkaItems.length > 0) {
        setRkaRows(
          study.rkaItems.map((item: any) => ({
            id: item.id,
            category: item.category || '',
            description: item.description || '',
            volume: Number(item.volume) || 1,
            unit: item.unit || 'Paket',
            unitPrice: Number(item.unitPrice) || 0,
          }))
        );
      } else {
        setRkaRows([]);
      }

      if (study.cooperationDocName) setCoopDocName(study.cooperationDocName);
      if (study.cooperationDocUrl) setCoopDocUrl(study.cooperationDocUrl);
      if (study.finalReportName) setFinalReportName(study.finalReportName);
      if (study.finalReportUrl) setFinalReportUrl(study.finalReportUrl);
      if (study.finalReportSummary) setFinalReportSummary(study.finalReportSummary);
    }
  }, [study]);

  // Handler: Change Execution Scheme
  const handleSchemeChange = async (scheme: string) => {
    setExecutionScheme(scheme);

    if (study?.id) {
      try {
        setIsSavingScheme(true);
        await saveStudyCooperationDoc(study.id, {
          cooperationDocName: coopDocName || study.cooperationDocName || '',
          cooperationDocUrl: coopDocUrl || study.cooperationDocUrl || '',
          executionScheme: scheme
        } as any);
        toast(`Skema pelaksanaan riset berhasil diubah menjadi "${scheme === 'SWAKELOLA' ? 'Swakelola Internal BRIDA' : scheme}".`, 'success');
      } catch (err: any) {
        toast('Gagal memperbarui skema riset: ' + err.message, 'error');
      } finally {
        setIsSavingScheme(false);
      }
    }
  };

  // Handler: Save RKA Items
  const handleSaveRka = async () => {
    if (!study?.id) {
      toast('Data kajian belum tersinkronisasi.', 'error');
      return;
    }

    if (isBudgetExceeded) {
      toast('Total rincian belanja RKA melebihi batas pagu plafon KAK!', 'error');
      return;
    }

    setIsSavingRka(true);
    try {
      await saveStudyRka(study.id, {
        items: rkaRows.map((r) => ({
          category: r.category,
          description: r.description,
          volume: Number(r.volume) || 1,
          unit: r.unit || 'Paket',
          unitPrice: Number(r.unitPrice) || 0,
        })),
      });
      toast('Rincian Rencana Kerja & Anggaran (RKA) berhasil disimpan.', 'success');
    } catch (err: any) {
      toast('Gagal menyimpan RKA: ' + err.message, 'error');
    } finally {
      setIsSavingRka(false);
    }
  };

  // RKA Row Helpers
  const handleAddRkaRow = () => {
    setRkaRows([
      ...rkaRows,
      {
        category: 'Belanja Operasional Riset',
        description: 'Uraian kebutuhan belanja baru...',
        volume: 1,
        unit: 'Paket',
        unitPrice: 5000000,
      },
    ]);
  };

  const handleRemoveRkaRow = (index: number) => {
    setRkaRows(rkaRows.filter((_, i) => i !== index));
  };

  const handleUpdateRkaRow = (index: number, field: keyof RkaRow, value: any) => {
    const updated = [...rkaRows];
    updated[index] = { ...updated[index], [field]: value };
    setRkaRows(updated);
  };

  // Handler: Add Team Member
  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      toast('Nama anggota tim peneliti wajib diisi.', 'error');
      return;
    }

    const updated = [
      ...teamMembers,
      {
        name: newMemberName.trim(),
        role: newMemberRole,
        institution: newMemberInstitution.trim() || 'BRIDA Kab. Mimika',
        phone: newMemberPhone.trim() || null,
        email: newMemberEmail.trim() || null
      }
    ];

    setTeamMembers(updated);
    setNewMemberName('');
    setIsAddingMember(false);

    if (study?.id) {
      try {
        setIsSavingTeam(true);
        await saveStudyTeam(study.id, { members: updated });
        toast('Anggota tim peneliti berhasil ditambahkan & disimpan.', 'success');
      } catch (err: any) {
        toast('Gagal menyimpan tim ke database: ' + err.message, 'error');
      } finally {
        setIsSavingTeam(false);
      }
    }
  };

  // Handler: Delete Team Member
  const handleDeleteMember = async (index: number) => {
    const updated = teamMembers.filter((_, idx) => idx !== index);
    setTeamMembers(updated);

    if (study?.id) {
      try {
        setIsSavingTeam(true);
        await saveStudyTeam(study.id, { members: updated });
        toast('Anggota tim berhasil dihapus.', 'info');
      } catch (err: any) {
        toast('Gagal memperbarui tim: ' + err.message, 'error');
      } finally {
        setIsSavingTeam(false);
      }
    }
  };

  // Handler: Upload Cooperation Document (SK / PKS)
  const handleCooperationDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCoop(true);
    try {
      const stored = await uploadAndCacheFile(file, token);
      setCoopDocName(stored.name);
      setCoopDocUrl(stored.url || stored.dataUrl || '');

      if (study?.id) {
        await saveStudyCooperationDoc(study.id, {
          cooperationDocName: stored.name,
          cooperationDocUrl: stored.url || stored.dataUrl || '',
          executionScheme: executionScheme
        } as any);
      }
      toast(`Dokumen legalitas "${stored.name}" berhasil diunggah dan disimpan.`, 'success');
    } catch (err: any) {
      toast('Gagal mengunggah dokumen kerja sama: ' + err.message, 'error');
    } finally {
      setIsUploadingCoop(false);
      if (e.target) e.target.value = '';
    }
  };

  // Handler: Upload Working Document
  const handleWorkingDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingWorkingDoc(true);
    try {
      const stored = await uploadAndCacheFile(file, token);
      const title = workingDocTitle.trim() || stored.name;

      if (study?.id) {
        await addStudyWorkingDoc(study.id, {
          title: title,
          type: workingDocType,
          fileUrl: stored.url || stored.dataUrl || '',
          fileSize: stored.size || '2.0 MB'
        });
      }
      setWorkingDocTitle('');
      toast(`Berkas kerja "${title}" berhasil diunggah ke repositori.`, 'success');
    } catch (err: any) {
      toast('Gagal mengunggah berkas kerja: ' + err.message, 'error');
    } finally {
      setIsUploadingWorkingDoc(false);
      if (e.target) e.target.value = '';
    }
  };

  // Handler: Delete Working Doc
  const handleDeleteWorkingDoc = async (docId: string) => {
    if (!study?.id) return;
    try {
      await deleteStudyWorkingDoc(study.id, docId);
      toast('Berkas kerja berhasil dihapus dari repositori.', 'info');
    } catch (err: any) {
      toast('Gagal menghapus berkas kerja: ' + err.message, 'error');
    }
  };

  // Handler: Upload Final Report
  const handleFinalReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFinalReport(true);
    try {
      const stored = await uploadAndCacheFile(file, token);
      setFinalReportName(stored.name);
      setFinalReportUrl(stored.url || stored.dataUrl || '');
      toast(`Laporan Akhir Riset "${stored.name}" berhasil diunggah.`, 'success');
    } catch (err: any) {
      toast('Gagal mengunggah Laporan Akhir: ' + err.message, 'error');
    } finally {
      setIsUploadingFinalReport(false);
      if (e.target) e.target.value = '';
    }
  };

  // Handler: Submit Final Report & Complete Research (Move to Tahap 5)
  const handleSubmitFinalReport = async () => {
    if (!finalReportName && !study?.finalReportName) {
      toast('Silakan unggah Dokumen Laporan Akhir Riset (PDF) terlebih dahulu.', 'error');
      return;
    }
    if (!finalReportSummary.trim() || finalReportSummary.trim().length < 20) {
      toast('Ringkasan temuan kunci riset minimal 20 karakter.', 'error');
      return;
    }

    if (!study?.id) {
      toast('Data ID kajian tidak ditemukan.', 'error');
      return;
    }

    setIsSubmittingFinal(true);
    try {
      await submitStudyFinalReport(study.id, {
        finalReportName: finalReportName || study.finalReportName || `Laporan_Akhir_Riset_${proposal?.code || 'BRIDA'}.pdf`,
        finalReportUrl: finalReportUrl || study.finalReportUrl || '',
        finalReportSummary: finalReportSummary.trim()
      });

      toast('🎉 Pelaksanaan riset resmi diselesaikan (COMPLETED)! Siap diekstraksi ke Tahap 5 Rekomendasi Kebijakan.', 'success');
      // Redirect to Tahap 5
      setTimeout(() => {
        router.push('/admin/recommendation-builder');
      }, 1200);
    } catch (err: any) {
      toast('Gagal menyelesaikan riset: ' + err.message, 'error');
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  const isCompleted = study?.status === 'COMPLETED' || proposal?.status === 'COMPLETED';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={coopFileInputRef}
        onChange={handleCooperationDocUpload}
        accept=".pdf,.doc,.docx"
        className="hidden"
      />
      <input
        type="file"
        ref={workingDocInputRef}
        onChange={handleWorkingDocUpload}
        accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.zip"
        className="hidden"
      />
      <input
        type="file"
        ref={finalReportInputRef}
        onChange={handleFinalReportUpload}
        accept=".pdf,.doc,.docx"
        className="hidden"
      />

      {/* Top Breadcrumb Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/research"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Pelaksanaan Riset</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            ID: {proposalOrStudyId}
          </span>
          {isCompleted && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Riset Selesai (COMPLETED)
            </span>
          )}
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                {proposal?.code || 'RST-BRIDA'}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                Skema: {executionScheme === 'SWAKELOLA' ? 'Swakelola Internal BRIDA' : executionScheme}
              </span>
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> KAK Final
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-snug">
              {proposal?.title || study?.title || 'Pelaksanaan Agenda Riset Daerah'}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs md:text-sm text-slate-500 pt-1">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                <Building2 className="w-4 h-4 text-slate-400" />
                {proposal?.opdName || 'BRIDA Kab. Mimika'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold font-mono bg-emerald-50 px-2.5 py-0.5 rounded-md">
                Plafon Pagu KAK: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(plafonBudget)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Tahun Anggaran: <strong className="text-slate-700">{study?.fiscalYear || new Date().getFullYear()}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href={`/admin/kak-builder/${proposal?.id || proposalOrStudyId}`}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-2 border border-slate-200"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Lihat KAK (Tahap 3)</span>
            </Link>
            <Link
              href="/admin/recommendation-builder"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Ke Tahap 5 (Rekomendasi)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3 Main Tab Navigators */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs gap-2">
        <button
          onClick={() => setActiveTab('TEAM_AND_LEGAL')}
          className={cn(
            'flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold transition flex items-center justify-center gap-2',
            activeTab === 'TEAM_AND_LEGAL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          )}
        >
          <Briefcase className="w-4 h-4" />
          <span>1. Skema Pelaksana, RKA & Legalitas</span>
        </button>

        <button
          onClick={() => setActiveTab('WORKING_DOCS')}
          className={cn(
            'flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold transition flex items-center justify-center gap-2',
            activeTab === 'WORKING_DOCS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          )}
        >
          <Database className="w-4 h-4" />
          <span>2. Berkas Kerja & Data Lapangan ({study?.workingDocuments?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('FINAL_REPORT')}
          className={cn(
            'flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold transition flex items-center justify-center gap-2',
            activeTab === 'FINAL_REPORT'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          )}
        >
          <Award className="w-4 h-4" />
          <span>3. Laporan Akhir & Selesai Riset</span>
          {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* TAB 1: Skema, RKA Belanja & Legalitas Tim */}
      {activeTab === 'TEAM_AND_LEGAL' && (
        <div className="space-y-8">
          {/* Box 0: Penetapan Skema & Metode Pelaksanaan Riset */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-700 mb-1">
                  <Briefcase className="w-4 h-4" />
                  Langkah 1: Penetapan Metode Pelaksanaan Riset Daerah
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Pilih Skema Pelaksanaan Riset
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan apakah riset dikerjakan secara mandiri oleh BRIDA (Swakelola) atau melalui mekanisme kemitraan / pengadaan pihak ketiga. Format belanja RKA di bawah akan otomatis menyesuaikan skema yang dipilih.
                </p>
              </div>

              {isSavingScheme && (
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menyimpan Skema...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Option 1: SWAKELOLA */}
              <div
                onClick={() => handleSchemeChange('SWAKELOLA')}
                className={cn(
                  'p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3',
                  executionScheme === 'SWAKELOLA'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">1. Swakelola BRIDA</span>
                    {executionScheme === 'SWAKELOLA' && (
                      <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Dikerjakan langsung oleh Tim Peneliti & Fungsional internal Litbang BRIDA Mimika.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded w-fit">
                  Wajib: SK Tim Peneliti
                </span>
              </div>

              {/* Option 2: PENUNJUKAN_LANGSUNG */}
              <div
                onClick={() => handleSchemeChange('PENUNJUKAN_LANGSUNG')}
                className={cn(
                  'p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3',
                  executionScheme === 'PENUNJUKAN_LANGSUNG'
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">2. Penunjukan Langsung</span>
                    {executionScheme === 'PENUNJUKAN_LANGSUNG' && (
                      <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Penugasan langsung tenaga ahli pakar perseorangan / lembaga penelitian khusus.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded w-fit">
                  Wajib: SPK Tenaga Ahli
                </span>
              </div>

              {/* Option 3: E_KATALOG */}
              <div
                onClick={() => handleSchemeChange('E_KATALOG')}
                className={cn(
                  'p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3',
                  executionScheme === 'E_KATALOG'
                    ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-2 ring-purple-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">3. E-Katalog Sektoral</span>
                    {executionScheme === 'E_KATALOG' && (
                      <span className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Pembelian jasa konsultansi riset melalui etalase E-Katalog LKPP terdaftar.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-purple-800 bg-purple-100/70 px-2 py-0.5 rounded w-fit">
                  Wajib: Surat Pesanan / Kontrak
                </span>
              </div>

              {/* Option 4: TENDER */}
              <div
                onClick={() => handleSchemeChange('TENDER')}
                className={cn(
                  'p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3',
                  executionScheme === 'TENDER'
                    ? 'border-amber-600 bg-amber-50/50 shadow-xs ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">4. Tender / PKS Mitra</span>
                    {executionScheme === 'TENDER' && (
                      <span className="w-5 h-5 bg-amber-600 text-white rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Kemitraan resmi PKS Perguruan Tinggi atau seleksi pengadaan terbuka (Tender).
                  </p>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded w-fit">
                  Wajib: Dokumen PKS / Kontrak
                </span>
              </div>
            </div>
          </div>

          {/* Box 1: Rincian RKA Anggaran Belanja Riset */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-700 mb-1">
                  <DollarSign className="w-4 h-4" />
                  Langkah 2: Rencana Kerja & Anggaran (RKA)
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Rincian Anggaran Belanja Pelaksanaan Riset
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rincian pos belanja disesuaikan dengan skema ({executionScheme === 'SWAKELOLA' ? 'Swakelola Internal' : executionScheme}). Pastikan total belanja tidak melampaui batas pagu plafon KAK.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddRkaRow}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Pos Belanja</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveRka}
                  disabled={isSavingRka || isBudgetExceeded}
                  className={cn(
                    'px-4 py-2 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5',
                    isBudgetExceeded ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                  )}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingRka ? 'Menyimpan...' : 'Simpan RKA'}</span>
                </button>
              </div>
            </div>

            {/* Budget Summary Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Plafon Batas Pagu (Tahap 3 KAK)</span>
                <p className="text-base font-black text-slate-900 font-mono">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(plafonBudget)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Rincian RKA</span>
                <p className={cn('text-base font-black font-mono', isBudgetExceeded ? 'text-rose-600' : 'text-emerald-700')}>
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalRkaBudget)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sisa Pagu Anggaran</span>
                <p className={cn('text-base font-black font-mono', isBudgetExceeded ? 'text-rose-600' : 'text-blue-700')}>
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(remainingBudget)}
                </p>
              </div>
            </div>

            {isBudgetExceeded && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Peringatan: Total rincian RKA belanja melebihi batas pagu plafon KAK! Mohon sesuaikan nominal volume atau harga satuan.</span>
              </div>
            )}

            {/* RKA Table / Empty State */}
            {rkaRows.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-2">
                <DollarSign className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-700">Belum ada pos rincian belanja RKA</p>
                <p className="text-[11px] text-slate-400">Klik tombol "+ Tambah Pos Belanja" di atas untuk mulai merinci pos anggaran pelaksanaan riset sesuai DPA / RAB.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-extrabold text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Kategori Belanja</th>
                      <th className="px-4 py-3">Uraian Kebutuhan</th>
                      <th className="px-4 py-3 text-center w-20">Volume</th>
                      <th className="px-4 py-3 text-center w-24">Satuan</th>
                      <th className="px-4 py-3 text-right w-36">Harga Satuan (Rp)</th>
                      <th className="px-4 py-3 text-right w-36">Total Biaya (Rp)</th>
                      <th className="px-4 py-3 text-center w-12">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rkaRows.map((row, idx) => {
                      const rowTotal = (Number(row.volume) || 0) * (Number(row.unitPrice) || 0);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={row.category || ''}
                              onChange={(e) => handleUpdateRkaRow(idx, 'category', e.target.value)}
                              placeholder="Kategori Belanja..."
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={row.description || ''}
                              onChange={(e) => handleUpdateRkaRow(idx, 'description', e.target.value)}
                              placeholder="Uraian Pos Belanja..."
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min={1}
                              value={row.volume ?? 1}
                              onChange={(e) => handleUpdateRkaRow(idx, 'volume', Number(e.target.value) || 1)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="text"
                              value={row.unit || ''}
                              onChange={(e) => handleUpdateRkaRow(idx, 'unit', e.target.value)}
                              placeholder="Paket/Kegiatan"
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center text-slate-600 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              value={row.unitPrice ?? 0}
                              onChange={(e) => handleUpdateRkaRow(idx, 'unitPrice', Number(e.target.value) || 0)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right font-mono font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-800">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(rowTotal)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRkaRow(idx)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Pos Belanja"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Box 2: Berkas Legalitas & SK / PKS */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-700 mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  Langkah 3: Dokumen Legalitas Kerja Sama
                </div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  {executionScheme === 'SWAKELOLA'
                    ? 'Dokumen Surat Keputusan (SK) Tim Peneliti BRIDA'
                    : executionScheme === 'PENUNJUKAN_LANGSUNG'
                    ? 'Dokumen Surat Perintah Kerja (SPK) Tenaga Ahli'
                    : executionScheme === 'E_KATALOG'
                    ? 'Dokumen Surat Pesanan E-Katalog & Kontrak Riset'
                    : 'Dokumen Perjanjian Kerja Sama (PKS) / Kontrak Tender'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {executionScheme === 'SWAKELOLA'
                    ? 'Unggah berkas resmi SK Penetapan Tim Peneliti yang telah disahkan oleh Kepala BRIDA.'
                    : 'Unggah berkas legalitas kerja sama (PKS / SPK / Kontrak Pengadaan Jasa) dengan pihak pelaksana.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => coopFileInputRef.current?.click()}
                  disabled={isUploadingCoop}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploadingCoop ? 'Sedang Mengunggah...' : (coopDocName ? 'Ganti Berkas Legalitas' : 'Unggah Berkas Legalitas')}</span>
                </button>
              </div>
            </div>

            {coopDocName ? (
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Dokumen Legalitas Terunggah
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{coopDocName}</h4>
                    <p className="text-xs text-slate-500">Tersimpan dalam repositori legalitas riset SIM-RIDA</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (coopDocName) {
                        openOrDownloadUploadedFile({
                          name: coopDocName,
                          url: coopDocUrl,
                          dataUrl: coopDocUrl,
                          proposalCode: proposal?.code || 'RST',
                          proposalTitle: proposal?.title || 'SK Tim Peneliti',
                          opdName: proposal?.opdName || 'BRIDA',
                          uploadDate: 'Hari Ini',
                          size: '2.4 MB'
                        }, toast);
                      }
                    }}
                    className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Lihat / Unduh Dokumen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => coopFileInputRef.current?.click()}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl transition"
                  >
                    Upload Ulang
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => coopFileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl text-center space-y-3 cursor-pointer bg-slate-50/50 hover:bg-emerald-50/30 transition group"
              >
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto group-hover:scale-105 transition">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Klik di sini untuk mengunggah Berkas {executionScheme === 'SWAKELOLA' ? 'SK Tim Peneliti' : 'PKS / SPK / Kontrak'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Format PDF atau DOCX (Maksimal 25MB)</p>
                </div>
              </div>
            )}
          </div>

          {/* Box 3: Tabel Tim Peneliti */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-700 mb-1">
                  <Users className="w-4 h-4" />
                  Langkah 4: Penetapan Personel Tim Peneliti
                </div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Daftar Anggota Tim Pelaksana Riset ({teamMembers.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Penetapan nama-nama peneliti, tenaga ahli, dan asisten yang bertugas melaksanakan kajian.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingMember(!isAddingMember)}
                className="px-4 py-2 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Anggota Tim</span>
              </button>
            </div>

            {/* Form Tambah Anggota */}
            {isAddingMember && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Form Tambah Anggota Peneliti</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                    <input
                      type="text"
                      placeholder="Contoh: Dr. Ir. John Doe, M.Si."
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Peran dalam Tim *</label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Ketua Tim Peneliti">Ketua Tim Peneliti</option>
                      <option value="Peneliti Anggota (Analis Data)">Peneliti Anggota (Analis Data)</option>
                      <option value="Peneliti Anggota (Kajian Lapangan)">Peneliti Anggota (Kajian Lapangan)</option>
                      <option value="Tenaga Ahli Senior">Tenaga Ahli Senior</option>
                      <option value="Asisten Peneliti / Surveyor">Asisten Peneliti / Surveyor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Institusi / Afiliasi</label>
                    <input
                      type="text"
                      placeholder="Contoh: BRIDA Mimika / Universitas..."
                      value={newMemberInstitution}
                      onChange={(e) => setNewMemberInstitution(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="0812-xxxx-xxxx"
                      value={newMemberPhone}
                      onChange={(e) => setNewMemberPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="peneliti@domain.go.id"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Simpan Anggota</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingMember(false)}
                      className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabel Tim */}
            {teamMembers.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-400 text-xs">
                Belum ada anggota tim peneliti yang ditambahkan. Klik tombol "Tambah Anggota Tim" di atas.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-extrabold text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Nama & Gelar</th>
                      <th className="px-5 py-3.5">Peran / Tugas</th>
                      <th className="px-5 py-3.5">Institusi</th>
                      <th className="px-5 py-3.5">Kontak</th>
                      <th className="px-5 py-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamMembers.map((member, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {member.name.charAt(0)}
                            </div>
                            <span>{member.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-[11px]">
                            {member.role}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 font-medium">
                          {member.institution}
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          <div className="space-y-0.5">
                            {member.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{member.phone}</span>
                              </div>
                            )}
                            {member.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{member.email}</span>
                              </div>
                            )}
                            {!member.phone && !member.email && <span>-</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(idx)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Anggota"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Berkas Kerja & Data Lapangan */}
      {activeTab === 'WORKING_DOCS' && (
        <div className="space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  Repositori Berkas Kerja & Data Lapangan
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Unggah langsung data tabulasi mentah (Excel/CSV), transkrip FGD/wawancara, atau draft laporan antara ke dalam sistem.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => workingDocInputRef.current?.click()}
                  disabled={isUploadingWorkingDoc}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploadingWorkingDoc ? 'Sedang Mengunggah...' : 'Unggah Berkas Baru'}</span>
                </button>
              </div>
            </div>

            {/* Quick Upload Form */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul / Keterangan Berkas</label>
                <input
                  type="text"
                  placeholder="Contoh: Tabulasi Kuesioner Survei Lapangan.xlsx"
                  value={workingDocTitle}
                  onChange={(e) => setWorkingDocTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Dokumen</label>
                <select
                  value={workingDocType}
                  onChange={(e) => setWorkingDocType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Data Tabulasi">Data Tabulasi (Excel / CSV)</option>
                  <option value="Transkrip FGD">Transkrip FGD & Wawancara</option>
                  <option value="Laporan Antara">Laporan Antara / Interim</option>
                  <option value="Dokumentasi Foto">Dokumentasi Survei Lapangan</option>
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => workingDocInputRef.current?.click()}
                  disabled={isUploadingWorkingDoc}
                  className="w-full py-2 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Pilih File & Simpan</span>
                </button>
              </div>
            </div>

            {/* Working Docs Table */}
            {(!study?.workingDocuments || study.workingDocuments.length === 0) ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl text-slate-400 space-y-2 border border-dashed border-slate-200">
                <Paperclip className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-700 text-sm">Belum ada berkas kerja lapangan yang diunggah</p>
                <p className="text-xs text-slate-400">Gunakan form di atas untuk mengunggah data Excel, laporan antara, atau transkrip FGD.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {study.workingDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                        {doc.type.includes('Tabulasi') ? <FileSpreadsheet className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{doc.title}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{doc.type}</span>
                          <span>•</span>
                          <span>{doc.fileSize || '2.4 MB'}</span>
                          <span>•</span>
                          <span>Diunggah: {new Date(doc.uploadDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          openOrDownloadUploadedFile({
                            name: doc.title,
                            url: doc.fileUrl,
                            dataUrl: doc.fileUrl,
                            proposalCode: proposal?.code || 'RST',
                            proposalTitle: doc.title,
                            opdName: proposal?.opdName || 'BRIDA',
                            uploadDate: doc.uploadDate,
                            size: doc.fileSize || '2.4 MB'
                          }, toast);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 transition flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh / Buka</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteWorkingDoc(doc.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Dokumen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Laporan Akhir Riset & Ringkasan Temuan Kunci */}
      {activeTab === 'FINAL_REPORT' && (
        <div className="space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-5">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
                <Award className="w-4 h-4" />
                Tahap Akhir Pelaksanaan Riset
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Dokumen Laporan Akhir Riset & Formulasi Temuan Kunci
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Unggah Dokumen Laporan Akhir Riset lengkap (PDF) beserta uraian temuan kunci & implikasi kebijakan. Setelah diselesaikan, sistem akan mengunci riset (COMPLETED) dan meneruskan data ke Tahap 5 Rekomendasi Kebijakan.
              </p>
            </div>

            {/* Box Upload Laporan Akhir */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Dokumen Laporan Akhir Hasil Riset (PDF) *
              </label>

              {finalReportName || study?.finalReportName ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold">
                      <FileCheck2 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded">
                        Laporan Akhir Terverifikasi
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        {finalReportName || study?.finalReportName}
                      </h4>
                      <p className="text-xs text-slate-500">Berkas siap diekstraksi ke formulasi Policy Brief</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        openOrDownloadUploadedFile({
                          name: finalReportName || study?.finalReportName || 'Laporan_Akhir.pdf',
                          url: finalReportUrl || study?.finalReportUrl || '',
                          dataUrl: finalReportUrl || study?.finalReportUrl || '',
                          proposalCode: proposal?.code || 'RST',
                          proposalTitle: proposal?.title || 'Laporan Akhir Riset',
                          opdName: proposal?.opdName || 'BRIDA',
                          uploadDate: 'Hari Ini',
                          size: '4.8 MB'
                        }, toast);
                      }}
                      className="px-4 py-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Laporan Akhir (PDF)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => finalReportInputRef.current?.click()}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl transition"
                    >
                      Ganti Berkas
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => finalReportInputRef.current?.click()}
                  className="p-8 border-2 border-dashed border-emerald-300 hover:border-emerald-600 rounded-2xl text-center space-y-3 cursor-pointer bg-emerald-50/30 hover:bg-emerald-50/60 transition group"
                >
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto group-hover:scale-105 transition">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Unggah Dokumen Laporan Akhir Riset (PDF)</p>
                    <p className="text-xs text-slate-500 mt-1">Ukuran berkas maksimal 50MB</p>
                  </div>
                  <button
                    type="button"
                    disabled={isUploadingFinalReport}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    {isUploadingFinalReport ? 'Sedang Mengunggah...' : 'Pilih File PDF'}
                  </button>
                </div>
              )}
            </div>

            {/* Box Textarea Ringkasan Temuan Riset */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Ringkasan Temuan Utama & Implikasi Kebijakan *
              </label>
              <p className="text-xs text-slate-500">
                Tuliskan poin-poin kesimpulan krusial hasil riset yang akan menjadi dasar rekomendasi tindakan kepala daerah.
              </p>
              <textarea
                rows={6}
                value={finalReportSummary}
                onChange={(e) => setFinalReportSummary(e.target.value)}
                placeholder="Uraikan temuan utama riset, fakta lapangan, analisis gap, dan rekomendasi kebijakan..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm text-slate-800 leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition"
              />
            </div>

            {/* Bottom Action Footer */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                {isCompleted ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Riset telah berstatus Selesai (COMPLETED).
                  </span>
                ) : (
                  <span>Menyelesaikan riset akan mengunci Tahap 4 dan mengaktifkan Tahap 5 Rekomendasi Kebijakan.</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSubmitFinalReport}
                  disabled={isSubmittingFinal}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-bold rounded-xl transition shadow-lg hover:shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>{isSubmittingFinal ? 'Menyimpan & Menyelesaikan...' : 'Selesaikan Riset & Teruskan ke Tahap 5'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
