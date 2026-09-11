'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  PlusCircle,
  Search,
  Building2,
  Calendar,
  DollarSign,
  ArrowRight,
  Sparkles,
  Layers,
  Inbox,
  CheckCircle2,
  Clock,
  RefreshCw,
  Eye,
  AlertCircle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useOpdStore, OpdProposal } from '@/store/useOpdStore';
import { useAuthStore } from '@/store/useAuthStore';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

export default function AdminIdentificationPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    proposals,
    fetchProposals,
    isLoadingProposals,
    opds,
    fetchOpds,
    categories,
    fetchCategories,
  } = useOpdStore();

  const [activeTab, setActiveTab] = useState<'BRIDA' | 'OPD' | 'ALL'>('BRIDA');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedOpdId, setSelectedOpdId] = useState('ALL');
  const [selectedProposal, setSelectedProposal] = useState<OpdProposal | null>(null);

  useEffect(() => {
    fetchProposals();
    fetchOpds();
    fetchCategories();
  }, [fetchProposals, fetchOpds, fetchCategories]);

  // Pisahkan proposal berdasarkan sumber inisiasi
  const bridaAnalyses = proposals.filter(
    (p) => p.source === 'BRIDA_ANALYSIS' || p.code.includes('BRIDA')
  );
  const opdProposals = proposals.filter(
    (p) => p.source !== 'BRIDA_ANALYSIS' && !p.code.includes('BRIDA')
  );

  // Filter daftar berdasarkan tab & filter
  const getFilteredList = () => {
    let list = proposals;
    if (activeTab === 'BRIDA') {
      list = bridaAnalyses;
    } else if (activeTab === 'OPD') {
      list = opdProposals;
    }

    return list.filter((item) => {
      const matchSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.opdName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.problemStatement.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        selectedCategory === 'ALL' || item.category === selectedCategory;

      const matchOpd =
        selectedOpdId === 'ALL' || item.opdId === selectedOpdId;

      return matchSearch && matchCategory && matchOpd;
    });
  };

  const filteredList = getFilteredList();

  const getStatusBadge = (proposal: OpdProposal) => {
    if (proposal.source === 'BRIDA_ANALYSIS') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white border border-blue-700">
          <CheckCircle2 className="h-3 w-3 text-white" />
          Siap Masuk KAK (Tahap 3)
        </span>
      );
    }

    switch (proposal.status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-300">
            <Clock className="h-3 w-3 text-blue-700" />
            Menunggu Validasi BRIDA
          </span>
        );
      case 'IN_REVIEW':
      case 'SCORED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-950 border border-blue-400">
            <Sparkles className="h-3 w-3 text-blue-700" />
            Dalam Proses Penilaian
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white border border-blue-700">
            <CheckCircle2 className="h-3 w-3 text-white" />
            Tervalidasi / Siap KAK
          </span>
        );
      case 'RETURNED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 rounded">
            <AlertCircle className="h-3 w-3 text-amber-800" />
            Perlu Revisi OPD
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            {proposal.status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <PageHeader
        title="Identifikasi Masalah & Analisis Riset"
        description="Tahap 1 Alur SIM-RIDA: Pengelolaan isu strategis daerah melalui Analisis Mandiri Tim Litbang BRIDA (Top-Down) dan Usulan Masalah dari Perangkat Daerah (Bottom-Up)."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchProposals()}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Segarkan Data"
            >
              <RefreshCw className={cn('h-3.5 w-3.5 text-[#0f2c59]', isLoadingProposals && 'animate-spin')} />
              Segarkan
            </button>
            <Link
              href="/admin/identification/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0f2c59] hover:bg-[#1a3d70] border border-[#0f2c59] rounded-lg transition-colors shadow-xs"
            >
              <PlusCircle className="h-4 w-4" />
              Input Analisis BRIDA Baru
            </Link>
          </div>
        }
      />

      {/* STATS METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 border border-blue-200 bg-blue-50 flex items-center justify-center text-[#0f2c59] font-bold shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
              Analisis Mandiri BRIDA
            </p>
            <p className="text-2xl font-black text-[#0f2c59] font-mono">{bridaAnalyses.length}</p>
            <p className="text-xs text-slate-500 truncate">Inisiatif Top-Down (By-pass validasi)</p>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 border border-blue-200 bg-blue-50 flex items-center justify-center text-blue-700 font-bold shrink-0">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
              Usulan Masuk dari OPD
            </p>
            <p className="text-2xl font-black text-blue-900 font-mono">{opdProposals.length}</p>
            <p className="text-xs text-slate-500 truncate">
              {opdProposals.filter((p) => p.status === 'PENDING').length} menunggu validasi BRIDA
            </p>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 border border-blue-200 bg-blue-50 flex items-center justify-center text-[#0f2c59] font-bold shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
              Siap Masuk Tahap KAK
            </p>
            <p className="text-2xl font-black text-[#0f2c59] font-mono">
              {proposals.filter((p) => p.status === 'APPROVED').length}
            </p>
            <p className="text-xs text-slate-500 truncate">Siap disusun KAK & didukung AI</p>
          </div>
        </div>
      </div>

      {/* INFORMATIONAL BANNER */}
      <div className="border border-slate-200 bg-blue-50/70 p-4 text-xs text-blue-950 flex items-start gap-3.5">
        <div className="p-2 bg-[#0f2c59] text-white shrink-0 mt-0.5">
          <TrendingUp className="h-4 w-4 text-sky-300" />
        </div>
        <div className="space-y-1 leading-relaxed">
          <span className="font-bold text-[#0f2c59] block text-sm">
            Alur Pembeda Tahap 1 Identifikasi Masalah:
          </span>
          <p>
            <strong>• Analisis Mandiri BRIDA:</strong> Diformulasikan langsung oleh Tim Peneliti BRIDA dengan menargetkan OPD lokus kebijakan. Usulan ini <em>tidak perlu melalui Tahap 2 Validasi</em> dan otomatis siap menuju <strong>Tahap 3: Penyusunan KAK (Didukung AI)</strong>.
          </p>
          <p>
            <strong>• Usulan Masuk dari OPD:</strong> Diajukan oleh Perangkat Daerah dan wajib melalui <strong>Tahap 2: Validasi BRIDA</strong> untuk dinilai urgensi, keselarasan strategis, dan kelayakan risetnya.
          </p>
        </div>
      </div>

      {/* MAIN CONTENT CARD */}
      <Card className="bg-white border-slate-200">
        {/* TABS & CONTROLS */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* TABS */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 shrink-0 border border-slate-200">
            <button
              onClick={() => setActiveTab('BRIDA')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer',
                activeTab === 'BRIDA'
                  ? 'bg-[#0f2c59] text-white'
                  : 'text-slate-700 hover:text-slate-900'
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              Analisis BRIDA
              <span className={cn('px-1.5 py-0.2 text-[10px]', activeTab === 'BRIDA' ? 'bg-[#1b3b6f] text-white' : 'bg-slate-200 text-slate-800')}>
                {bridaAnalyses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('OPD')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer',
                activeTab === 'OPD'
                  ? 'bg-[#0f2c59] text-white'
                  : 'text-slate-700 hover:text-slate-900'
              )}
            >
              <Building2 className="h-3.5 w-3.5 text-sky-400" />
              Usulan dari OPD
              <span className={cn('px-1.5 py-0.2 text-[10px]', activeTab === 'OPD' ? 'bg-[#1b3b6f] text-white' : 'bg-slate-200 text-slate-800')}>
                {opdProposals.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ALL')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer',
                activeTab === 'ALL'
                  ? 'bg-[#0f2c59] text-white'
                  : 'text-slate-700 hover:text-slate-900'
              )}
            >
              Semua Usulan
              <span className={cn('px-1.5 py-0.2 text-[10px]', activeTab === 'ALL' ? 'bg-[#1b3b6f] text-white' : 'bg-slate-200 text-slate-800')}>
                {proposals.length}
              </span>
            </button>
          </div>

          {/* SEARCH & FILTERS */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px] flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari isu, kode, OPD..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-300 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">Semua Bidang</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={selectedOpdId}
              onChange={(e) => setSelectedOpdId(e.target.value)}
              className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-300 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 max-w-[180px] truncate"
            >
              <option value="ALL">Semua OPD Target</option>
              {opds.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* LIST VIEW */}
        <div className="divide-y divide-slate-100">
          {isLoadingProposals ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-[#0f2c59]" />
              <span>Memuat daftar identifikasi masalah...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
              <div className="h-12 w-12 bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-300">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-700">Tidak ada data identifikasi masalah ditemukan</p>
                <p className="text-slate-400 mt-0.5">
                  Coba ubah kata kunci pencarian atau buat analisis baru.
                </p>
              </div>
              {activeTab === 'BRIDA' && (
                <Link
                  href="/admin/identification/new"
                  className="mt-2 inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0f2c59] hover:bg-[#1a3d70] border border-[#0f2c59] rounded-lg transition-colors shadow-xs"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Buat Analisis BRIDA Pertama
                </Link>
              )}
            </div>
          ) : (
            filteredList.map((item) => {
              const isBrida = item.source === 'BRIDA_ANALYSIS' || item.code.includes('BRIDA');

              return (
                <div
                  key={item.id}
                  className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 px-2 py-0.5 bg-slate-100 border border-slate-300">
                        {item.code}
                      </span>
                      {isBrida ? (
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-600 text-white border border-blue-700 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Analisis Mandiri BRIDA
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-900 border border-blue-300 flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-blue-700" />
                          Usulan OPD
                        </span>
                      )}
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-500">{item.category}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug hover:text-[#0f2c59] transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.problemStatement}
                    </p>

                    {item.strategicImpact && (
                      <div className="text-xs text-blue-950 bg-blue-50 px-2.5 py-1 border border-blue-200 inline-flex items-center gap-1.5">
                        <span className="font-semibold text-[#0f2c59]">Dampak Strategis:</span>
                        <span className="line-clamp-1">{item.strategicImpact}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {isBrida ? 'Target OPD: ' : 'Pengusul: '}
                          <strong className="text-slate-800">{item.opdName}</strong>
                        </span>
                      </div>

                      {item.estimatedBudget && (
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-blue-700" />
                          <span>
                            Pagu:{' '}
                            <strong className="text-slate-800 font-mono">
                              Rp {Number(item.estimatedBudget).toLocaleString('id-ID')}
                            </strong>
                          </span>
                        </div>
                      )}

                      {item.estimatedDuration && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-blue-600" />
                          <span>
                            Durasi: <strong className="text-slate-800">{item.estimatedDuration} Bulan</strong>
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.createdAt || item.submittedAt || '2026-09-01'}</span>
                      </div>
                    </div>
                  </div>

                  {/* STATUS & ACTIONS */}
                  <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 shrink-0 self-stretch md:self-auto border-t md:border-t-0 pt-3 md:pt-0">
                    {getStatusBadge(item)}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedProposal(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-600" />
                        Detail
                      </button>

                      {!isBrida && item.status === 'PENDING' && (
                        <Link
                          href={`/admin/verification/${item.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-300 transition-colors cursor-pointer shadow-xs"
                        >
                          <span>Validasi Usulan (Tahap 2)</span>
                          <ArrowRight className="h-3.5 w-3.5 text-blue-700" />
                        </Link>
                      )}

                      {(isBrida || item.status === 'APPROVED') && (
                        <Link
                          href={`/admin/kak-builder/${item.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0f2c59] hover:bg-[#1a3a6c] border border-[#0f2c59] rounded-lg transition-colors cursor-pointer shadow-xs"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                          <span>Susun KAK (Tahap 3)</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* MODAL DETAIL PROPOSAL / ANALISIS */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#0f2c59] text-white">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white bg-[#1b3b6f] px-2 py-0.5 border border-[#264978]">
                    {selectedProposal.code}
                  </span>
                  {selectedProposal.source === 'BRIDA_ANALYSIS' ? (
                    <span className="text-[11px] font-semibold text-white bg-blue-600 px-2 py-0.5 border border-blue-400">
                      Inisiatif Mandiri Litbang BRIDA
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-blue-900 bg-white px-2 py-0.5 border border-slate-300">
                      Usulan OPD
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">
                  {selectedProposal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProposal(null)}
                className="p-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 bg-white">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-300">
                <div>
                  <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">
                    {selectedProposal.source === 'BRIDA_ANALYSIS' ? 'Target OPD' : 'OPD Pengusul'}
                  </span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate" title={selectedProposal.opdName}>
                    {selectedProposal.opdName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">
                    Bidang Riset
                  </span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
                    {selectedProposal.category}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">
                    Pagu Anggaran
                  </span>
                  <span className="text-xs font-bold text-blue-900 mt-0.5 block font-mono">
                    Rp {Number(selectedProposal.estimatedBudget || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">
                    Durasi Riset
                  </span>
                  <span className="text-xs font-bold text-blue-900 mt-0.5 block">
                    {selectedProposal.estimatedDuration || 3} Bulan
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">
                  {selectedProposal.source === 'BRIDA_ANALYSIS'
                    ? 'Latar Belakang & Analisis Permasalahan'
                    : 'Identifikasi Permasalahan Lapangan'}
                </h4>
                <div className="p-3.5 bg-slate-50 border border-slate-300 leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {selectedProposal.problemStatement}
                </div>
              </div>

              {selectedProposal.strategicImpact && (
                <div className="space-y-2">
                  <h4 className="font-bold text-blue-950 text-sm">
                    Urgensi & Dampak Strategis Daerah
                  </h4>
                  <div className="p-3.5 bg-blue-50 border border-blue-200 leading-relaxed text-blue-950 whitespace-pre-wrap">
                    {selectedProposal.strategicImpact}
                  </div>
                </div>
              )}

              {selectedProposal.urgencyReason && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">Alasan Urgensi Riset</h4>
                  <div className="p-3.5 bg-slate-50 border border-slate-300 leading-relaxed text-slate-800 whitespace-pre-wrap">
                    {selectedProposal.urgencyReason}
                  </div>
                </div>
              )}

              {selectedProposal.supportingDocuments &&
                selectedProposal.supportingDocuments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">Dokumen Pendukung / Data Awal</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedProposal.supportingDocuments.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-300 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="h-4 w-4 text-[#0f2c59] shrink-0" />
                            <span className="truncate font-medium text-slate-800">{doc.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0 ml-2">{doc.size}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setSelectedProposal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg bg-white cursor-pointer"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                {selectedProposal.source === 'BRIDA_ANALYSIS' ||
                  selectedProposal.status === 'APPROVED' ? (
                  <Link
                    href="/admin/kak-builder"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0f2c59] hover:bg-[#1a3d70] border border-[#0f2c59] rounded-lg transition-colors shadow-xs"
                  >
                    Lanjut ke Penyusunan KAK (Tahap 3)
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <Link
                    href="/admin/verification"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 border border-blue-700 transition-colors"
                  >
                    Validasi Usulan OPD Ini
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
