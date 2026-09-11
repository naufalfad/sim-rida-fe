'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOpdStore, OpdProposal } from '@/store/useOpdStore';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Building2,
  Layers,
  RefreshCw,
  Edit3,
  Calendar,
  Wallet,
  ChevronRight,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function KakBuilderDashboardPage() {
  const router = useRouter();
  const { proposals, fetchProposals, fetchApprovedProposals, isLoadingProposals, opds, fetchOpds } = useOpdStore();

  const [activeTab, setActiveTab] = useState<'ALL' | 'UNTOUCHED' | 'DRAFT' | 'FINAL'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedSource, setSelectedSource] = useState<'ALL' | 'BRIDA_ANALYSIS' | 'OPD_PROPOSAL'>('ALL');

  useEffect(() => {
    fetchApprovedProposals();
    fetchProposals();
    fetchOpds();
  }, [fetchApprovedProposals, fetchProposals, fetchOpds]);

  const handleRefresh = () => {
    fetchApprovedProposals();
    fetchProposals();
  };

  // Hanya ambil usulan yang statusnya APPROVED, IN_PROGRESS, atau COMPLETED (siap disusun/telah disusun KAK)
  const approvedProposals = useMemo(() => {
    return proposals.filter((p) => ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(p.status));
  }, [proposals]);

  // Kategorisasi status KAK
  const untouchedList = useMemo(() => {
    return approvedProposals.filter((p) => {
      const kakStatus = (p as any).researchStudy?.kakDocument?.status;
      return !kakStatus && p.status === 'APPROVED';
    });
  }, [approvedProposals]);

  const draftKakList = useMemo(() => {
    return approvedProposals.filter((p) => {
      const kakStatus = (p as any).researchStudy?.kakDocument?.status;
      return kakStatus === 'DRAFT';
    });
  }, [approvedProposals]);

  const finalKakList = useMemo(() => {
    return approvedProposals.filter((p) => {
      const kakStatus = (p as any).researchStudy?.kakDocument?.status;
      return kakStatus === 'FINAL' || p.status === 'IN_PROGRESS' || p.status === 'COMPLETED';
    });
  }, [approvedProposals]);

  const getFilteredList = () => {
    let list = approvedProposals;
    if (activeTab === 'UNTOUCHED') list = untouchedList;
    else if (activeTab === 'DRAFT') list = draftKakList;
    else if (activeTab === 'FINAL') list = finalKakList;

    return list.filter((p) => {
      const matchSearch =
        search === '' ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.opdName.toLowerCase().includes(search.toLowerCase()) ||
        p.problemStatement.toLowerCase().includes(search.toLowerCase());

      const matchSource =
        selectedSource === 'ALL' ||
        (selectedSource === 'BRIDA_ANALYSIS' && (p.source === 'BRIDA_ANALYSIS' || p.code.includes('BRIDA'))) ||
        (selectedSource === 'OPD_PROPOSAL' && (p.source === 'OPD_PROPOSAL' || !p.code.includes('BRIDA')));

      return matchSearch && matchSource;
    });
  };

  const filteredList = getFilteredList();

  const getKakStatusBadge = (proposal: OpdProposal) => {
    const kakStatus = (proposal as any).researchStudy?.kakDocument?.status;
    if (kakStatus === 'FINAL' || proposal.status === 'IN_PROGRESS' || proposal.status === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-600 text-white border border-blue-700">
          <CheckCircle2 className="h-3 w-3" />
          KAK Final
        </span>
      );
    }
    if (kakStatus === 'DRAFT') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200">
          <Edit3 className="h-3 w-3" />
          Draf KAK Tersimpan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
        <Clock className="h-3 w-3 text-slate-500" />
        Belum Disusun KAK
      </span>
    );
  };

  const isBridaAnalysis = (p: OpdProposal) => p.source === 'BRIDA_ANALYSIS' || p.code.includes('BRIDA');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* HEADER */}
      <PageHeader
        title="Penyusunan KAK (Tahap 3)"
        description="Modul perumusan Kerangka Acuan Kerja (KAK) riset berbasis AI Assistant dan In-System Live Editor terpadu tanpa unduh/unggah manual."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoadingProposals}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isLoadingProposals && 'animate-spin')} />
              Segarkan
            </button>
            <Link
              href="/admin/verification"
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-blue-600 border border-blue-700 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Lihat Validasi BRIDA
            </Link>
          </div>
        }
      />

      {/* BANNER AI ASSISTANT & LIVE EDITOR */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 border-l-4 border-l-[#0f2c59] bg-gradient-to-r from-white via-blue-50/30 to-slate-50/60 p-5 shadow-xs">
        <div className="flex items-start gap-4 relative z-10">
          <div className="p-2.5 rounded-lg bg-blue-50 text-[#0f2c59] border border-blue-200 shrink-0">
            <Sparkles className="h-5 w-5 text-blue-700" />
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">
                Alur Otomasi KAK dengan AI Terpadu (In-System Live Editor)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200 uppercase tracking-wider">
                AI-Powered Workflow
              </span>
            </div>

            <p className="text-slate-600 leading-relaxed text-xs max-w-4xl font-sans">
              Admin BRIDA dapat menggunakan fitur <strong className="text-slate-900 font-semibold">&quot;Susun KAK dengan AI&quot;</strong> untuk merumuskan secara otomatis 5 struktur narasi KAK (Latar Belakang, Permasalahan, Maksud/Tujuan, Metodologi, dan Target Luaran). Seluruh draf dapat <strong className="text-slate-900 font-semibold">langsung disunting secara real-time</strong> di dalam sistem tanpa perlu proses unduh dan unggah dokumen manual.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-slate-200 text-3xs font-semibold text-slate-700 shadow-2xs">
                <Sparkles className="h-3 w-3 text-blue-600" />
                <span>Otomasi 5 Bab Narasi KAK</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-slate-200 text-3xs font-semibold text-slate-700 shadow-2xs">
                <Edit3 className="h-3 w-3 text-blue-600" />
                <span>Live Editor Tanpa Berkas Manual</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-slate-200 text-3xs font-semibold text-slate-700 shadow-2xs">
                <Wallet className="h-3 w-3 text-blue-600" />
                <span>Simulasi Plafon RKA Pagu APBD</span>
              </span>
            </div>
          </div>
        </div>

        {/* Subtle Decorative Watermark Icon */}
        <Sparkles className="absolute -right-3 -bottom-4 h-24 w-24 text-blue-100/50 pointer-events-none" />
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center font-bold shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Belum Disusun KAK
            </p>
            <p className="text-2xl font-black text-slate-800 font-mono">{untouchedList.length}</p>
            <p className="text-xs text-slate-500 truncate">Usulan siap dirumuskan</p>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold shrink-0">
            <Edit3 className="w-6 h-6" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Draf KAK In-System
            </p>
            <p className="text-2xl font-black text-blue-700 font-mono">{draftKakList.length}</p>
            <p className="text-xs text-slate-500 truncate">Sedang diedit di sistem</p>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              KAK Final
            </p>
            <p className="text-2xl font-black text-blue-600 font-mono">{finalKakList.length}</p>
            <p className="text-xs text-slate-500 truncate">Siap pelaksanaan riset</p>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 border border-blue-200 text-[#0f2c59] flex items-center justify-center font-bold shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Total Usulan Siap KAK
            </p>
            <p className="text-2xl font-black text-[#0f2c59] font-mono">{approvedProposals.length}</p>
            <p className="text-xs text-slate-500 truncate">Inisiatif BRIDA & OPD Lolos</p>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <Card className="bg-white border-slate-200">
        {/* TABS & SEARCH */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg shrink-0 overflow-x-auto border border-slate-200">
            <button
              onClick={() => setActiveTab('ALL')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
                activeTab === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              )}
            >
              Semua Usulan
              <span className={cn("px-1.5 py-0.2 rounded text-[10px]", activeTab === 'ALL' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700')}>
                {approvedProposals.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('UNTOUCHED')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
                activeTab === 'UNTOUCHED'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              Belum Disusun
              <span className={cn("px-1.5 py-0.2 rounded text-[10px]", activeTab === 'UNTOUCHED' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700')}>
                {untouchedList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('DRAFT')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
                activeTab === 'DRAFT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              )}
            >
              <Edit3 className="h-3.5 w-3.5" />
              Draf KAK
              <span className={cn("px-1.5 py-0.2 rounded text-[10px]", activeTab === 'DRAFT' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700')}>
                {draftKakList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('FINAL')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
                activeTab === 'FINAL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              KAK Final
              <span className={cn("px-1.5 py-0.2 rounded text-[10px]", activeTab === 'FINAL' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700')}>
                {finalKakList.length}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px] flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari judul / OPD..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>

            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as any)}
              className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">Semua Jalur Usulan</option>
              <option value="BRIDA_ANALYSIS">💡 Inisiatif Mandiri BRIDA</option>
              <option value="OPD_PROPOSAL">🏢 Usulan OPD (Lolos Validasi)</option>
            </select>
          </div>
        </div>

        {/* LIST VIEW */}
        <div className="divide-y divide-slate-200">
          {isLoadingProposals ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span>Memuat data usulan untuk penyusunan KAK...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-500">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Tidak ada usulan dalam daftar ini</p>
                <p className="text-slate-500 mt-0.5">
                  Pastikan usulan OPD telah Lolos Validasi pada Tahap 2 atau input Analisis Mandiri BRIDA pada Tahap 1.
                </p>
              </div>
            </div>
          ) : (
            filteredList.map((item) => {
              const isBrida = isBridaAnalysis(item);
              const kakDoc = (item as any).researchStudy?.kakDocument;
              const hasKak = !!kakDoc;
              const isKakFinal = kakDoc?.status === 'FINAL' || item.status === 'IN_PROGRESS' || item.status === 'COMPLETED';

              return (
                <div
                  key={item.id}
                  className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 px-2 py-0.5 bg-slate-100 border border-slate-300 rounded">
                        {item.code}
                      </span>

                      {isBrida ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-900 border border-blue-200 flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          Inisiatif BRIDA (Top-Down)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-950 border border-blue-300 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Usulan OPD Lolos Validasi
                        </span>
                      )}

                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-600">{item.category}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug hover:text-blue-700 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.problemStatement}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          Instansi: <strong className="text-slate-800">{item.opdName}</strong>
                        </span>
                      </div>

                      {item.estimatedBudget && (
                        <div className="flex items-center gap-1.5">
                          <Wallet className="h-3.5 w-3.5 text-slate-400" />
                          <span>Pagu:</span>
                          <strong className="text-blue-800 font-mono">
                            Rp {Number(item.estimatedBudget).toLocaleString('id-ID')}
                          </strong>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Target Output:</span>
                        <span className="text-slate-800 font-medium">{item.expectedOutput}</span>
                      </div>
                    </div>
                  </div>

                  {/* STATUS & ACTIONS */}
                  <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 shrink-0 self-stretch md:self-auto border-t md:border-t-0 pt-3 md:pt-0">
                    {getKakStatusBadge(item)}

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/kak-builder/${item.id}`}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer border',
                          isKakFinal
                            ? 'text-slate-800 bg-white border-slate-300 hover:bg-slate-50'
                            : 'text-white bg-blue-600 hover:bg-blue-700 border-blue-700'
                        )}
                      >
                        {!hasKak && <Sparkles className="h-3.5 w-3.5 text-sky-200" />}
                        {hasKak && <Edit3 className="h-3.5 w-3.5" />}
                        {isKakFinal ? 'Buka Dokumen KAK' : hasKak ? 'Lanjutkan Edit KAK' : 'Susun KAK dengan AI'}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
