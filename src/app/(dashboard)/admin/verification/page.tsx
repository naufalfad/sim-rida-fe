'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOpdStore, OpdProposal } from '@/store/useOpdStore';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  ClipboardList,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Building2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  XCircle,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function AdminVerificationPage() {
  const router = useRouter();
  const { proposals, fetchVerificationInbox, fetchProposals, isLoadingProposals, opds, fetchOpds } = useOpdStore();

  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'RETURNED' | 'ALL'>('PENDING');
  const [search, setSearch] = useState('');
  const [selectedOpdId, setSelectedOpdId] = useState('ALL');

  useEffect(() => {
    fetchVerificationInbox();
    fetchProposals();
    fetchOpds();
  }, [fetchVerificationInbox, fetchProposals, fetchOpds]);

  const handleRefresh = () => {
    fetchVerificationInbox();
    fetchProposals();
  };

  // Filter khusus usulan OPD (OPD_PROPOSAL)
  const opdProposals = useMemo(() => {
    return proposals.filter((p) => p.source === 'OPD_PROPOSAL' || !p.code.includes('BRIDA'));
  }, [proposals]);

  const pendingList = useMemo(() => opdProposals.filter((p) => p.status === 'PENDING'), [opdProposals]);
  const approvedList = useMemo(() => opdProposals.filter((p) => p.status === 'APPROVED' || p.status === 'IN_PROGRESS' || p.status === 'COMPLETED'), [opdProposals]);
  const returnedOrRejectedList = useMemo(() => opdProposals.filter((p) => p.status === 'RETURNED' || p.status === 'REJECTED'), [opdProposals]);

  const getFilteredList = () => {
    let baseList = opdProposals;
    if (activeTab === 'PENDING') baseList = pendingList;
    else if (activeTab === 'APPROVED') baseList = approvedList;
    else if (activeTab === 'RETURNED') baseList = returnedOrRejectedList;

    return baseList.filter((p) => {
      const matchSearch =
        search === '' ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.opdName.toLowerCase().includes(search.toLowerCase()) ||
        p.problemStatement.toLowerCase().includes(search.toLowerCase());

      const matchOpd = selectedOpdId === 'ALL' || p.opdId === selectedOpdId;

      return matchSearch && matchOpd;
    });
  };

  const filteredList = getFilteredList();

  const getStatusBadge = (proposal: OpdProposal) => {
    switch (proposal.status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-300">
            <Clock className="h-3 w-3 text-blue-700" />
            Menunggu Validasi
          </span>
        );
      case 'APPROVED':
      case 'IN_PROGRESS':
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white border border-blue-700">
            <CheckCircle2 className="h-3 w-3 text-white" />
            Lolos Validasi (Siap KAK)
          </span>
        );
      case 'RETURNED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-900 border border-slate-300">
            <AlertTriangle className="h-3 w-3 text-slate-800" />
            Dikembalikan (Perlu Revisi)
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-900 text-white border border-slate-800">
            <XCircle className="h-3 w-3 text-white" />
            Ditolak (Tidak Layak)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            {proposal.status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* HEADER */}
      <PageHeader
        title="Validasi Usulan OPD (Tahap 2)"
        description="Penilaian kelayakan usulan riset Perangkat Daerah melalui 5 pilar instrumen: Validasi Masalah, Kebaruan/Bebas Duplikasi, Tingkat Urgensi, Keselarasan Strategis RPJMD, dan Kelayakan Penelitian."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoadingProposals}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-[#0f2c59]', isLoadingProposals && 'animate-spin')} />
              Segarkan
            </button>
            <Link
              href="/admin/identification"
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#0f2c59] bg-blue-50 border border-blue-300 hover:bg-blue-100 transition-colors"
            >
              <Layers className="h-3.5 w-3.5" />
              Lihat Identifikasi Masalah
            </Link>
          </div>
        }
      />

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 border border-slate-200 rounded-xl shadow-xs flex items-center gap-3.5 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold shrink-0 rounded-lg">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Menunggu Validasi
            </p>
            <p className="text-2xl font-black text-blue-900 font-mono">{pendingList.length}</p>
            <p className="text-xs text-slate-500 truncate">Usulan OPD masuk</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 border border-slate-200 rounded-xl shadow-xs flex items-center gap-3.5 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 bg-blue-50 border border-blue-200 text-[#0f2c59] flex items-center justify-center font-bold shrink-0 rounded-lg">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Lolos Validasi (Siap KAK)
            </p>
            <p className="text-2xl font-black text-[#0f2c59] font-mono">{approvedList.length}</p>
            <p className="text-xs text-slate-500 truncate">Memenuhi 5 pilar</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 border border-slate-200 rounded-xl shadow-xs flex items-center gap-3.5 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center font-bold shrink-0 rounded-lg">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Perlu Revisi OPD
            </p>
            <p className="text-2xl font-black text-blue-950 font-mono">
              {opdProposals.filter((p) => p.status === 'RETURNED').length}
            </p>
            <p className="text-xs text-slate-500 truncate">Menunggu perbaikan</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 border border-slate-200 rounded-xl shadow-xs flex items-center gap-3.5 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center font-bold shrink-0 rounded-lg">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Total Usulan OPD
            </p>
            <p className="text-2xl font-black text-slate-900 font-mono">{opdProposals.length}</p>
            <p className="text-xs text-slate-500 truncate">Seluruh perangkat daerah</p>
          </div>
        </div>
      </div>

      {/* INFORMATIONAL 5 PILARS BANNER */}
      <div className="border border-slate-200 bg-blue-50/60 p-4 rounded-xl text-xs text-blue-950 flex items-start gap-3.5 shadow-2xs">
        <div className="p-2 bg-[#0f2c59] text-white shrink-0 mt-0.5 rounded-lg">
          <ShieldCheck className="h-4 w-4 text-sky-300" />
        </div>
        <div className="space-y-1 leading-relaxed flex-1 min-w-0">
          <span className="font-bold text-[#0f2c59] block text-xs">
            5 Pilar Penilaian Validasi Kelayakan Usulan Masuk dari OPD:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-1 text-[11px]">
            <div className="bg-white p-2.5 border border-slate-200 rounded-lg shadow-2xs">
              <strong className="text-slate-900 block">1. Validasi Masalah:</strong> Kejelasan rumusan & fakta empiris lapangan.
            </div>
            <div className="bg-white p-2.5 border border-slate-200 rounded-lg shadow-2xs">
              <strong className="text-slate-900 block">2. Kebaruan:</strong> Bebas duplikasi kajian sebelumnya.
            </div>
            <div className="bg-white p-2.5 border border-slate-200 rounded-lg shadow-2xs">
              <strong className="text-slate-900 block">3. Urgensi:</strong> Skala prioritas waktu & dampak bila tunda.
            </div>
            <div className="bg-white p-2.5 border border-slate-200 rounded-lg shadow-2xs">
              <strong className="text-slate-900 block">4. Keselarasan:</strong> Sesuai arah visi-misi RPJMD Mimika.
            </div>
            <div className="bg-white p-2.5 border border-slate-200 rounded-lg shadow-2xs">
              <strong className="text-slate-900 block">5. Kelayakan Riset:</strong> Kesiapan data, anggaran & metode.
            </div>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <Card className="bg-white border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* TABS & SEARCH */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 shrink-0 border border-slate-200 rounded-lg overflow-x-auto whitespace-nowrap scrollbar-none max-w-full">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 cursor-pointer shrink-0',
                activeTab === 'PENDING'
                  ? 'bg-[#0f2c59] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              )}
            >
              <Clock className="h-3.5 w-3.5 text-sky-400" />
              Menunggu Validasi
              <span className={cn('px-1.5 py-0.2 text-[10px] font-bold rounded', activeTab === 'PENDING' ? 'bg-[#1b3b6f] text-white' : 'bg-slate-200 text-slate-800')}>
                {pendingList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('APPROVED')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 cursor-pointer shrink-0',
                activeTab === 'APPROVED'
                  ? 'bg-[#0f2c59] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
              Lolos Validasi
              <span className={cn('px-1.5 py-0.2 text-[10px] font-bold rounded', activeTab === 'APPROVED' ? 'bg-[#1b3b6f] text-white' : 'bg-slate-200 text-slate-800')}>
                {approvedList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('RETURNED')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 cursor-pointer shrink-0',
                activeTab === 'RETURNED'
                  ? 'bg-[#0f2c59] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              )}
            >
              Revisi / Ditolak
              <span className={cn('px-1.5 py-0.2 text-[10px] font-bold rounded', activeTab === 'RETURNED' ? 'bg-[#1b3b6f] text-white' : 'bg-slate-200 text-slate-800')}>
                {returnedOrRejectedList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ALL')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 cursor-pointer shrink-0',
                activeTab === 'ALL'
                  ? 'bg-[#0f2c59] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              )}
            >
              Semua Usulan
              <span className={cn('px-1.5 py-0.2 text-[10px] rounded', activeTab === 'ALL' ? 'bg-[#1b3b6f] text-white' : 'bg-slate-200 text-slate-800')}>
                {opdProposals.length}
              </span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari usulan OPD..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>

            <select
              value={selectedOpdId}
              onChange={(e) => setSelectedOpdId(e.target.value)}
              className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-600 max-w-full sm:max-w-[180px] truncate"
            >
              <option value="ALL">Semua OPD Pengusul</option>
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
              <span>Memuat antrean validasi usulan OPD...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
              <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-300">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-700">Tidak ada usulan dalam kategori ini</p>
                <p className="text-slate-400 mt-0.5">
                  {activeTab === 'PENDING'
                    ? 'Seluruh usulan yang masuk dari OPD telah selesai divalidasi.'
                    : 'Tidak ada data yang sesuai dengan filter pencarian.'}
                </p>
              </div>
            </div>
          ) : (
            filteredList.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700 px-2 py-0.5 bg-slate-100 border border-slate-300 rounded">
                      {item.code}
                    </span>
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-900 border border-blue-300 rounded flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-blue-700" />
                      Usulan OPD
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-500">{item.category}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug hover:text-[#0f2c59] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.problemStatement}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        Pengusul: <strong className="text-slate-800">{item.opdName}</strong>
                      </span>
                    </div>

                    {item.estimatedBudget && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Pagu:</span>
                        <strong className="text-blue-900 font-mono">
                          Rp {Number(item.estimatedBudget).toLocaleString('id-ID')}
                        </strong>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Target:</span>
                      <span className="text-slate-800 font-medium">{item.expectedOutput}</span>
                    </div>
                  </div>
                </div>

                {/* STATUS & ACTIONS */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2.5 sm:gap-3 shrink-0 self-stretch md:self-auto border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="self-start sm:self-auto">
                    {getStatusBadge(item)}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {item.status === 'PENDING' ? (
                      <Link
                        href={`/admin/verification/${item.id}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border border-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Validasi Usulan
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <Link
                        href={`/admin/verification/${item.id}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-600" />
                        Lihat Hasil Validasi
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
