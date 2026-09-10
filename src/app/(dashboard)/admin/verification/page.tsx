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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-900 border border-black">
            <AlertTriangle className="h-3 w-3 text-slate-800" />
            Dikembalikan (Perlu Revisi)
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-900 text-white border border-black">
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
        <Card className="bg-white border-black shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-blue-600" />
          <CardContent className="p-4.5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Menunggu Validasi
              </span>
              <div className="text-2xl font-bold text-blue-900">{pendingList.length}</div>
              <p className="text-[11px] text-slate-500">Usulan OPD masuk</p>
            </div>
            <div className="h-10 w-10 border border-blue-200 bg-blue-50 flex items-center justify-center text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-black shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-[#0f2c59]" />
          <CardContent className="p-4.5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Lolos Validasi (Siap KAK)
              </span>
              <div className="text-2xl font-bold text-[#0f2c59]">{approvedList.length}</div>
              <p className="text-[11px] text-slate-500">Memenuhi 5 pilar</p>
            </div>
            <div className="h-10 w-10 border border-blue-200 bg-blue-50 flex items-center justify-center text-[#0f2c59]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-black shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-blue-800" />
          <CardContent className="p-4.5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Perlu Revisi OPD
              </span>
              <div className="text-2xl font-bold text-blue-950">
                {opdProposals.filter((p) => p.status === 'RETURNED').length}
              </div>
              <p className="text-[11px] text-slate-500">Menunggu perbaikan</p>
            </div>
            <div className="h-10 w-10 border border-blue-200 bg-blue-50 flex items-center justify-center text-blue-800">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-black shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-slate-400" />
          <CardContent className="p-4.5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Total Usulan OPD
              </span>
              <div className="text-2xl font-bold text-slate-900">{opdProposals.length}</div>
              <p className="text-[11px] text-slate-500">Seluruh perangkat daerah</p>
            </div>
            <div className="h-10 w-10 border border-slate-300 bg-slate-100 flex items-center justify-center text-slate-700">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* INFORMATIONAL 5 PILARS BANNER */}
      <div className="border border-black bg-blue-50 p-4 text-xs text-blue-950 flex items-start gap-3.5 shadow-sm">
        <div className="p-2 bg-[#0f2c59] text-white shrink-0 mt-0.5">
          <ShieldCheck className="h-4 w-4 text-sky-300" />
        </div>
        <div className="space-y-1 leading-relaxed">
          <span className="font-bold text-[#0f2c59] block text-xs">
            5 Pilar Penilaian Validasi Kelayakan Usulan Masuk dari OPD:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 pt-1 text-[11px]">
            <div className="bg-white p-2 border border-slate-300">
              <strong>1. Validasi Masalah:</strong> Kejelasan rumusan & fakta empiris lapangan.
            </div>
            <div className="bg-white p-2 border border-slate-300">
              <strong>2. Kebaruan / Bebas Duplikasi:</strong> Belum pernah diteliti/diselesaikan sebelumnya.
            </div>
            <div className="bg-white p-2 border border-slate-300">
              <strong>3. Urgensi:</strong> Skala prioritas waktu & dampak jika ditunda.
            </div>
            <div className="bg-white p-2 border border-slate-300">
              <strong>4. Keselarasan Strategis:</strong> Kesesuaian visi-misi RPJMD daerah.
            </div>
            <div className="bg-white p-2 border border-slate-300">
              <strong>5. Kelayakan Riset:</strong> Kesiapan data, estimasi anggaran & metodologi.
            </div>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <Card className="bg-white border-black shadow-sm">
        {/* TABS & SEARCH */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 shrink-0 border border-slate-300">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer',
                activeTab === 'PENDING'
                  ? 'bg-[#0f2c59] text-white border border-black'
                  : 'text-slate-700 hover:text-slate-900'
              )}
            >
              <Clock className="h-3.5 w-3.5 text-sky-400" />
              Menunggu Validasi
              <span className={cn('px-1.5 py-0.2 text-[10px] font-bold', activeTab === 'PENDING' ? 'bg-[#1b3b6f] text-white' : 'bg-slate-200 text-slate-800')}>
                {pendingList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('APPROVED')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer',
                activeTab === 'APPROVED'
                  ? 'bg-[#0f2c59] text-white border border-black'
                  : 'text-slate-700 hover:text-slate-900'
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
              Lolos Validasi
              <span className={cn('px-1.5 py-0.2 text-[10px] font-bold', activeTab === 'APPROVED' ? 'bg-[#1b3b6f] text-white' : 'bg-slate-200 text-slate-800')}>
                {approvedList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('RETURNED')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer',
                activeTab === 'RETURNED'
                  ? 'bg-[#0f2c59] text-white border border-black'
                  : 'text-slate-700 hover:text-slate-900'
              )}
            >
              Revisi / Ditolak
              <span className={cn('px-1.5 py-0.2 text-[10px] font-bold', activeTab === 'RETURNED' ? 'bg-[#1b3b6f] text-white' : 'bg-slate-200 text-slate-800')}>
                {returnedOrRejectedList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ALL')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer',
                activeTab === 'ALL'
                  ? 'bg-[#0f2c59] text-white border border-black'
                  : 'text-slate-700 hover:text-slate-900'
              )}
            >
              Semua Usulan
              <span className={cn('px-1.5 py-0.2 text-[10px]', activeTab === 'ALL' ? 'bg-[#1b3b6f] text-white' : 'bg-slate-200 text-slate-800')}>
                {opdProposals.length}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px] flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari usulan OPD..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>

            <select
              value={selectedOpdId}
              onChange={(e) => setSelectedOpdId(e.target.value)}
              className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-300 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 max-w-[180px] truncate"
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
              <div className="h-12 w-12 bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-300">
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
                className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700 px-2 py-0.5 bg-slate-100 border border-slate-300">
                      {item.code}
                    </span>
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-900 border border-blue-300 flex items-center gap-1">
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

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <span>
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
                <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 shrink-0 self-stretch md:self-auto border-t md:border-t-0 pt-3 md:pt-0">
                  {getStatusBadge(item)}

                  <div className="flex items-center gap-2">
                    {item.status === 'PENDING' ? (
                      <Link
                        href={`/admin/verification/${item.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border border-blue-700 shadow-sm transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Validasi Usulan
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <Link
                        href={`/admin/verification/${item.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
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
