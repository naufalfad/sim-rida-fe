'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useImplementationStore } from '@/store/useImplementationStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
  ClipboardList,
  Play,
  CheckCircle2,
  Clock,
  Activity,
  Search,
  Filter,
  Eye,
  RotateCcw,
  Calendar,
  Building,
  UserCheck,
  ArrowRight,
  TrendingUp,
  Layers
} from 'lucide-react';

export default function ImplementationListPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { rawImplementations, fetchImplementations, isLoading } = useImplementationStore();
  const { researchRecords } = useResearchStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [opdFilter, setOpdFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  useEffect(() => {
    fetchImplementations();
  }, [fetchImplementations]);

  // Combine raw implementations with research records
  const items = useMemo(() => {
    // Collect all proposals that are ready for implementation or already have an implementation
    const mappedList: Array<{
      id: string; // implementation id or research id
      researchId: string;
      code: string;
      proposalCode: string;
      title: string;
      opd: string;
      method: string;
      partnerName: string;
      startDate: string;
      endDate: string;
      durationDays: number;
      progress: number;
      status: 'READY' | 'ACTIVE' | 'COMPLETED';
      year: string;
    }> = [];

    // First map from rawImplementations from backend
    rawImplementations.forEach((impl) => {
      let status: 'READY' | 'ACTIVE' | 'COMPLETED' = 'READY';
      if (impl.status === 'ONGOING') status = 'ACTIVE';
      else if (impl.status === 'COMPLETED') status = 'COMPLETED';

      const sDate = impl.startDate ? new Date(impl.startDate).toISOString().split('T')[0] : '2026-09-01';
      const eDate = impl.endDate ? new Date(impl.endDate).toISOString().split('T')[0] : '2026-11-30';
      const startObj = new Date(sDate);
      const endObj = new Date(eDate);
      const diff = Math.ceil(Math.abs(endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)) || 90;

      const year = sDate.split('-')[0] || '2026';

      mappedList.push({
        id: impl.id,
        researchId: impl.researchProposalId || impl.id,
        code: impl.code || `IMP-${year}-001`,
        proposalCode: impl.researchProposal?.code || 'PROP-2026-001',
        title: impl.researchProposal?.title || 'Penelitian Daerah',
        opd: impl.researchProposal?.targetOpd || 'BAPPEDA',
        method: impl.partnerSelection?.method || 'SWAKELOLA',
        partnerName: impl.partnerSelection?.partner?.name || (impl.partnerSelection?.method === 'SWAKELOLA' ? 'Tim Internal BRIDA' : 'PT Mitra Pelaksana'),
        startDate: sDate,
        endDate: eDate,
        durationDays: diff,
        progress: impl.progress || 0,
        status,
        year,
      });
    });

    // Also include research records from researchRecords that have no implementation record yet but are ready
    researchRecords.forEach((r) => {
      const alreadyMapped = mappedList.some((m) => m.researchId === r.id || m.proposalCode === r.id);
      if (!alreadyMapped) {
        let status: 'READY' | 'ACTIVE' | 'COMPLETED' = 'READY';
        if (r.status === 'ACTIVE') status = 'ACTIVE';
        else if (r.status === 'COMPLETED') status = 'COMPLETED';

        mappedList.push({
          id: r.id,
          researchId: r.id,
          code: `IMP-2026-${r.id.slice(-3)}`,
          proposalCode: r.id,
          title: r.title,
          opd: r.opd,
          method: 'SWAKELOLA',
          partnerName: 'Tim Internal BRIDA',
          startDate: '2026-09-01',
          endDate: '2026-11-30',
          durationDays: 90,
          progress: r.status === 'COMPLETED' ? 100 : (r.status === 'ACTIVE' ? 35 : 0),
          status,
          year: '2026',
        });
      }
    });

    return mappedList;
  }, [rawImplementations, researchRecords]);

  // Unique OPDs & Years for filtering
  const opdList = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.opd) set.add(i.opd);
    });
    return Array.from(set);
  }, [items]);

  const yearList = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.year) set.add(i.year);
    });
    return Array.from(set);
  }, [items]);

  // Filtered List
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        item.proposalCode.toLowerCase().includes(search.toLowerCase()) ||
        item.opd.toLowerCase().includes(search.toLowerCase()) ||
        item.partnerName.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesOpd = !opdFilter || item.opd === opdFilter;
      const matchesYear = !yearFilter || item.year === yearFilter;

      return matchesSearch && matchesStatus && matchesOpd && matchesYear;
    });
  }, [items, search, statusFilter, opdFilter, yearFilter]);

  // Summary counts
  const totalCount = items.length;
  const readyCount = items.filter((i) => i.status === 'READY').length;
  const activeCount = items.filter((i) => i.status === 'ACTIVE').length;
  const completedCount = items.filter((i) => i.status === 'COMPLETED').length;

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setOpdFilter('');
    setYearFilter('');
  };

  const getStatusBadge = (status: 'READY' | 'ACTIVE' | 'COMPLETED') => {
    switch (status) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="h-3 w-3" />
            <span>BELUM DIMULAI</span>
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">
            <Activity className="h-3 w-3" />
            <span>SEDANG BERJALAN</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>SELESAI</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <PageHeader
        title="Pelaksanaan Penelitian"
        description="Kelola jadwal, tim kerja lapangan, kemajuan target capaian, dan monitoring pelaksanaan riset daerah."
      />

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Pelaksanaan</span>
            <ClipboardList className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{totalCount}</div>
            <p className="text-[9px] text-gray-400 mt-1">Total program riset dalam siklus pelaksanaan</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Belum Dimulai</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">{readyCount}</div>
            <p className="text-[9px] text-gray-400 mt-1">KAK & Mitra disetujui, siap diinisiasi</p>
          </CardContent>
        </Card>

        <Card className="border-purple-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Sedang Berjalan</span>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-purple-700 dark:text-purple-400">{activeCount}</div>
            <p className="text-[9px] text-gray-400 mt-1">Riset aktif dalam proses survei/kajian</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Selesai Pelaksanaan</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">{completedCount}</div>
            <p className="text-[9px] text-gray-400 mt-1">Milestone 100%, siap penyusunan laporan</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Panel */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 items-end">
            
            {/* Search */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">Cari Judul / Kode / Mitra</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ketik kata kunci pencarian..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border rounded focus:outline-none focus:border-purple-600 bg-white dark:bg-gray-900"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">Status Pelaksanaan</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border rounded focus:outline-none focus:border-purple-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200"
              >
                <option value="ALL">Semua Status</option>
                <option value="READY">Belum Dimulai (READY)</option>
                <option value="ACTIVE">Sedang Berjalan (ACTIVE)</option>
                <option value="COMPLETED">Selesai (COMPLETED)</option>
              </select>
            </div>

            {/* OPD Filter */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">OPD Pengusul</label>
              <select
                value={opdFilter}
                onChange={(e) => setOpdFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border rounded focus:outline-none focus:border-purple-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200"
              >
                <option value="">Semua OPD</option>
                {opdList.map((opd) => (
                  <option key={opd} value={opd}>
                    {opd}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter & Reset */}
            <div className="flex gap-2">
              <div className="space-y-1 flex-1">
                <label className="text-3xs font-bold text-gray-500 uppercase">Tahun</label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border rounded focus:outline-none focus:border-purple-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200"
                >
                  <option value="">Semua</option>
                  {yearList.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              {(search || statusFilter !== 'ALL' || opdFilter || yearFilter) && (
                <button
                  onClick={handleResetFilters}
                  className="self-end px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded text-xs font-semibold flex items-center gap-1 transition-all"
                  title="Reset Filter"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-850">
                <TableHead className="w-36 text-2xs font-extrabold uppercase">Kode Pelaksanaan</TableHead>
                <TableHead className="min-w-60 text-2xs font-extrabold uppercase">Judul Penelitian & OPD</TableHead>
                <TableHead className="w-48 text-2xs font-extrabold uppercase">Pelaksana / Mitra</TableHead>
                <TableHead className="w-44 text-2xs font-extrabold uppercase">Periode & Durasi</TableHead>
                <TableHead className="w-36 text-2xs font-extrabold uppercase">Progress & Status</TableHead>
                <TableHead className="w-36 text-right text-2xs font-extrabold uppercase pr-4">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full" />
                      <span className="text-xs">Memuat data pelaksanaan penelitian...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-1">
                      <ClipboardList className="h-8 w-8 text-gray-300 mb-1" />
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-300">Tidak ada data pelaksanaan riset.</p>
                      <p className="text-3xs text-gray-400">Sesuaikan kata kunci atau filter pencarian.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-purple-50/10 transition-colors">
                    <TableCell className="align-top py-3">
                      <span className="font-extrabold text-xs text-purple-700 dark:text-purple-400 block font-mono">
                        {item.code}
                      </span>
                      <span className="text-[10px] text-gray-400 block font-mono mt-0.5">
                        {item.proposalCode}
                      </span>
                    </TableCell>

                    <TableCell className="align-top py-3">
                      <span className="font-bold text-xs text-gray-900 dark:text-white block leading-snug">
                        {item.title}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500">
                        <Building className="h-3 w-3 text-gray-400 shrink-0" />
                        <span className="font-semibold">{item.opd}</span>
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-3 text-xs">
                      <span className="font-bold text-gray-800 dark:text-gray-200 block truncate max-w-44">
                        {item.partnerName}
                      </span>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200">
                        {item.method}
                      </span>
                    </TableCell>

                    <TableCell className="align-top py-3 text-xs font-medium">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[11px] text-gray-750 dark:text-gray-300 font-semibold">
                          <Calendar className="h-3 w-3 text-gray-400 shrink-0" />
                          <span>{item.startDate}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 block pl-4">s.d. {item.endDate}</span>
                        <span className="text-[10px] font-bold text-purple-600 block pl-4">
                          ({item.durationDays} hari kalender)
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-gray-500">Progress:</span>
                          <span className="text-purple-700 dark:text-purple-400">{item.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-purple-600 h-full rounded-full transition-all"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <div>{getStatusBadge(item.status)}</div>
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-3 text-right pr-4">
                      {item.status === 'READY' ? (
                        <button
                          onClick={() => router.push(`/research/${item.researchId}/implementation/start`)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-2xs font-bold transition-all shadow flex items-center gap-1 ml-auto"
                        >
                          <Play className="h-3 w-3 fill-white" />
                          <span>Mulai Pelaksanaan</span>
                        </button>
                      ) : item.status === 'ACTIVE' ? (
                        <button
                          onClick={() => router.push(`/research/${item.researchId}/implementation`)}
                          className="px-3 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded text-2xs font-bold transition-all shadow flex items-center gap-1 ml-auto"
                        >
                          <Activity className="h-3 w-3" />
                          <span>Kelola / Monitoring</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push(`/research/${item.researchId}/implementation`)}
                          className="px-3 py-1.5 border border-emerald-300 hover:bg-emerald-50 text-emerald-700 dark:text-emerald-400 rounded text-2xs font-bold transition-all flex items-center gap-1 ml-auto bg-white dark:bg-gray-950"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Lihat Detail</span>
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
