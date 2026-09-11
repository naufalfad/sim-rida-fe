'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  useOpdStore, 
  OpdProposal, 
  ResearchStudyItem 
} from '@/store/useOpdStore';
import { useToast } from '@/components/ui/toast';
import { 
  FlaskConical, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Plus, 
  Search, 
  ArrowRight, 
  Building2, 
  Layers, 
  Calendar,
  Sparkles,
  AlertCircle,
  FileCheck2,
  Paperclip,
  BookOpen,
  DollarSign,
  RefreshCw,
  ExternalLink,
  Download,
  Users,
  Award,
  Check,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function AdminResearchPage() {
  const { toast } = useToast();
  const { 
    proposals, 
    fetchProposals,
    studies,
    fetchStudies,
    isLoadingStudies
  } = useOpdStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [filterScheme, setFilterScheme] = useState<string>('ALL');

  useEffect(() => {
    fetchStudies();
    fetchProposals();
  }, [fetchStudies, fetchProposals]);

  // Combined list of active research (from studies table and finalized KAK proposals)
  const researchList = useMemo(() => {
    const list: Array<{
      id: string;
      studyId?: string;
      proposalId: string;
      code: string;
      title: string;
      opdName: string;
      category: string;
      fiscalYear: number;
      allocatedBudget: number;
      executionScheme: string;
      status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED';
      kakStatus: string;
      teamCount: number;
      hasCooperationDoc: boolean;
      hasFinalReport: boolean;
      finalReportSummary?: string | null;
      updatedAt?: string;
    }> = [];

    // 1. Add from studies API
    studies.forEach((s) => {
      const prop = proposals.find((p) => p.id === s.proposalId || p.code === s.proposal?.code) || s.proposal;
      list.push({
        id: s.id,
        studyId: s.id,
        proposalId: s.proposalId || prop?.id || s.id,
        code: prop?.code || `RST-${s.id.substring(0, 5).toUpperCase()}`,
        title: s.title || prop?.title || 'Kajian Riset BRIDA',
        opdName: prop?.opdName || 'BRIDA Kab. Mimika',
        category: prop?.category || 'Sosial Budaya & Kesejahteraan',
        fiscalYear: s.fiscalYear || new Date().getFullYear(),
        allocatedBudget: s.allocatedBudget || 0,
        executionScheme: s.executionScheme || 'SWAKELOLA',
        status: s.status || 'IN_PROGRESS',
        kakStatus: s.kakDocument?.status || 'FINAL',
        teamCount: s.teamMembers?.length || 0,
        hasCooperationDoc: !!s.cooperationDocUrl || !!s.cooperationDocName,
        hasFinalReport: !!s.finalReportUrl || !!s.finalReportName || s.status === 'COMPLETED',
        finalReportSummary: s.finalReportSummary,
        updatedAt: s.updatedAt || s.createdAt,
      });
    });

    // 2. Add proposals that have FINAL KAK but not yet in studies array
    proposals.forEach((p) => {
      const alreadyInList = list.some((item) => item.proposalId === p.id);
      const isKakFinal = p.researchStudy?.kakDocument?.status === 'FINAL' || p.status === 'IN_PROGRESS' || p.status === 'COMPLETED';
      
      if (!alreadyInList && isKakFinal) {
        list.push({
          id: p.researchStudy?.id || p.id,
          studyId: p.researchStudy?.id,
          proposalId: p.id,
          code: p.code,
          title: p.title,
          opdName: p.opdName,
          category: p.category,
          fiscalYear: p.researchStudy?.fiscalYear || new Date().getFullYear(),
          allocatedBudget: p.researchStudy?.allocatedBudget || p.estimatedBudget || 75000000,
          executionScheme: p.researchStudy?.executionScheme || p.scoringData?.executionMethod || 'SWAKELOLA',
          status: (p.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS'),
          kakStatus: 'FINAL',
          teamCount: p.researchStudy?.teamMembers?.length || 0,
          hasCooperationDoc: !!p.researchStudy?.cooperationDocUrl || !!p.researchStudy?.cooperationDocName,
          hasFinalReport: p.status === 'COMPLETED',
          finalReportSummary: p.researchStudy?.finalReportSummary,
          updatedAt: p.lastUpdated,
        });
      }
    });

    return list;
  }, [studies, proposals]);

  // Filtered research list
  const filteredResearch = useMemo(() => {
    return researchList.filter((item) => {
      const matchSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.opdName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = 
        filterStatus === 'ALL' || 
        (filterStatus === 'IN_PROGRESS' && item.status !== 'COMPLETED') ||
        (filterStatus === 'COMPLETED' && item.status === 'COMPLETED');

      const matchScheme = 
        filterScheme === 'ALL' || item.executionScheme === filterScheme;

      return matchSearch && matchStatus && matchScheme;
    });
  }, [researchList, searchQuery, filterStatus, filterScheme]);

  // Statistics
  const totalStudies = researchList.length;
  const inProgressStudies = researchList.filter((r) => r.status !== 'COMPLETED').length;
  const completedStudies = researchList.filter((r) => r.status === 'COMPLETED').length;
  const totalBudget = researchList.reduce((sum, r) => sum + (r.allocatedBudget || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-[#0f2c59] border border-slate-200 p-8 text-white">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sky-300 text-xs font-bold tracking-wider uppercase">
            <FlaskConical className="w-4 h-4" />
            Tahap 4: Pelaksanaan Riset Daerah
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Pelaksanaan Riset & Pengelolaan Laporan Akhir
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Kelola penetapan pelaksana riset, unggah berkas legalitas kerja sama (SK / PKS), repositori berkas kerja lapangan, serta penerimaan Laporan Akhir Hasil Riset untuk diteruskan ke Tahap 5 Rekomendasi Kebijakan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => { fetchStudies(); fetchProposals(); }}
            className="flex items-center gap-2 bg-[#1b3b6f] hover:bg-[#15325b] text-white font-semibold px-4 py-2.5 transition text-xs border border-[#264978]"
            title="Muat Ulang Data Riset"
          >
            <RefreshCw className={cn('w-4 h-4 text-sky-300', isLoadingStudies && 'animate-spin')} />
            <span>Refresh</span>
          </button>
          <Link
            href="/admin/kak-builder"
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 font-bold px-4 py-2.5 transition text-xs border border-slate-200"
          >
            <Layers className="w-4 h-4 text-blue-700" />
            <span>Tahap 3 (Penyusunan KAK)</span>
          </Link>
          <Link
            href="/admin/recommendation-builder"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 transition text-xs border border-blue-700"
          >
            <BookOpen className="w-4 h-4" />
            <span>Tahap 5 (Rekomendasi)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 border border-blue-200 text-[#0f2c59] flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Riset Masuk</p>
            <p className="text-2xl font-black text-[#0f2c59]">{totalStudies}</p>
          </div>
        </div>

        <div className="bg-white p-6 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sedang Berjalan</p>
            <p className="text-2xl font-black text-blue-900">{inProgressStudies}</p>
          </div>
        </div>

        <div className="bg-white p-6 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 border border-blue-200 text-[#0f2c59] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Laporan Akhir Terbit</p>
            <p className="text-2xl font-black text-[#0f2c59]">{completedStudies}</p>
          </div>
        </div>

        <div className="bg-white p-6 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Alokasi Anggaran</p>
            <p className="text-lg font-black text-blue-900 font-mono">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalBudget)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul riset, OPD pengusul, atau kode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold gap-1">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition',
                filterStatus === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Semua ({totalStudies})
            </button>
            <button
              onClick={() => setFilterStatus('IN_PROGRESS')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition',
                filterStatus === 'IN_PROGRESS' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Sedang Berjalan ({inProgressStudies})
            </button>
            <button
              onClick={() => setFilterStatus('COMPLETED')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition',
                filterStatus === 'COMPLETED' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Selesai ({completedStudies})
            </button>
          </div>

          <select
            value={filterScheme}
            onChange={(e) => setFilterScheme(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Skema</option>
            <option value="SWAKELOLA">Swakelola BRIDA</option>
            <option value="PENUNJUKAN_LANGSUNG">Penunjukan Langsung</option>
            <option value="E_KATALOG">E-Katalog</option>
            <option value="TENDER">Tender Terbuka</option>
          </select>
        </div>
      </div>

      {/* Main Research Cards Grid */}
      {filteredResearch.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <FlaskConical className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-800 text-lg">Belum Ada Riset dalam Pelaksanaan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Usulan yang telah lolos validasi (Tahap 2) dan telah diselesaikan dokumen KAK & RKA (Tahap 3) akan otomatis masuk ke daftar pelaksanaan riset ini.
          </p>
          <Link
            href="/admin/kak-builder"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Ke Modul Penyusunan KAK (Tahap 3)</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResearch.map((item) => {
            const isDone = item.status === 'COMPLETED';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                      {item.code}
                    </span>
                    <span className={cn(
                      'text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border',
                      isDone
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    )}>
                      {isDone ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Laporan Akhir Selesai</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 animate-pulse" />
                          <span>Sedang Dilaksanakan</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-emerald-700 transition">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.opdName}</span>
                    </div>
                  </div>

                  {/* Badges / Metrics */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Skema Riset:</span>
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {item.executionScheme === 'SWAKELOLA' ? 'Swakelola BRIDA' : item.executionScheme}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Pagu Anggaran:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.allocatedBudget)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Tim Peneliti:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {item.teamCount > 0 ? `${item.teamCount} Anggota` : 'Belum Ditetapkan'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Dokumen SK / PKS:</span>
                      <span className={cn(
                        'font-semibold px-2 py-0.5 rounded text-[11px]',
                        item.hasCooperationDoc ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      )}>
                        {item.hasCooperationDoc ? 'Tersedia' : 'Belum Diunggah'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Button */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/research/${item.proposalId}`}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-2"
                  >
                    <span>Kelola Pelaksanaan Riset</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
