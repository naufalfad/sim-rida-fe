'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useResearchStore } from '@/store/useResearchStore';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DUMMY_OPDS } from '@/mock/knowledge-base/opd';
import {
  FileStack,
  Clock,
  Activity,
  CheckCircle2,
  Search,
  Eye,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function ResearchListPage() {
  const router = useRouter();
  const { researchRecords } = useResearchStore();

  // Filters state
  const [search, setSearch] = useState('');
  const [opdFilter, setOpdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Stats calculation
  const totalCount = researchRecords.length;
  const plannedCount = researchRecords.filter(r => r.status === 'PLANNED').length;
  const activeCount = researchRecords.filter(r => r.status === 'ACTIVE').length;
  const completedCount = researchRecords.filter(r => r.status === 'COMPLETED').length;

  // Filtered research list
  const filteredRecords = useMemo(() => {
    return researchRecords.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.opd.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase());

      const matchesOpd = !opdFilter || item.opd === opdFilter;
      const matchesStatus = !statusFilter || item.status === statusFilter;
      const matchesPriority = !priorityFilter || item.priority === priorityFilter;

      return matchesSearch && matchesOpd && matchesStatus && matchesPriority;
    });
  }, [researchRecords, search, opdFilter, statusFilter, priorityFilter]);

  const handleResetFilters = () => {
    setSearch('');
    setOpdFilter('');
    setStatusFilter('');
    setPriorityFilter('');
  };

  // Render Status Badge
  const renderStatusBadge = (status: 'PLANNED' | 'ACTIVE' | 'COMPLETED') => {
    let bg = '';
    let text = '';
    let label = '';
    switch (status) {
      case 'PLANNED':
        bg = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200';
        label = 'Planned';
        break;
      case 'ACTIVE':
        bg = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200';
        label = 'Active';
        break;
      case 'COMPLETED':
        bg = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200';
        label = 'Completed';
        break;
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold border ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <PageHeader
        title="Penelitian"
        description="Daftar penelitian yang telah ditetapkan secara resmi oleh Kepala BRIDA."
      />

      {/* Metrics Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Total Penelitian</span>
            <FileStack className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{totalCount}</div>
            <p className="text-[9px] text-gray-400 mt-1">Total program kerja penelitian</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Planned</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{plannedCount}</div>
            <p className="text-[9px] text-gray-400 mt-1">Penelitian disetujui & terencana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Active</span>
            <Activity className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{activeCount}</div>
            <p className="text-[9px] text-gray-400 mt-1">Penelitian berjalan di lapangan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{completedCount}</div>
            <p className="text-[9px] text-gray-400 mt-1">Kajian selesai & rilis rekomendasi</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Panel */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 items-end">
            
            {/* Search */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">Cari Penelitian / OPD</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari judul, OPD, ID..."
                  className="block w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* OPD Filter */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">OPD Pelaksana</label>
              <select
                value={opdFilter}
                onChange={(e) => setOpdFilter(e.target.value)}
                className="block w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="">Semua OPD</option>
                {DUMMY_OPDS.map(opd => (
                  <option key={opd} value={opd}>{opd}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">Status Penelitian</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="">Semua Status</option>
                <option value="PLANNED">Planned</option>
                <option value="ACTIVE">Active (Dummy)</option>
                <option value="COMPLETED">Completed (Dummy)</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">Urgensi Sektoral</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="block w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="">Semua Prioritas</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

          </div>

          <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-850 pt-3">
            <span className="text-[10px] text-gray-400 font-semibold italic flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-blue-500" />
              <span>Seluruh penetapan baru dimulai dari status PLANNED (Penyusunan KAK/RAB belum dibuat).</span>
            </span>
            <button
              onClick={handleResetFilters}
              className="px-3 py-1 text-2xs font-semibold border border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400 rounded flex items-center gap-1.5 transition-all bg-white dark:bg-gray-950"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Table grid */}
      <Card>
        <CardContent className="p-0">
          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <FileStack className="h-10 w-10 text-gray-300" />
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Belum ada penelitian yang ditetapkan.</h3>
              <p className="text-xs text-gray-450 max-w-sm">
                Hubungkan dengan usulan penelitian tervalidasi yang telah disetujui Kepala BRIDA.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold w-32">Research ID</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold">Judul Penelitian</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold">OPD Pelaksana</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-28">Status</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-24">Prioritas</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-28">Skor Seleksi</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-36">Tanggal Penetapan</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-20">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-bold text-gray-500">{item.proposalId || item.id}</TableCell>
                    <TableCell className="font-bold text-gray-900 dark:text-white max-w-md truncate" title={item.title}>
                      {item.title}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-700 dark:text-gray-300">{item.opd}</TableCell>
                    <TableCell className="text-center">{renderStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-center font-bold">
                      <span className={
                        item.priority === 'HIGH' ? 'text-rose-600' : item.priority === 'MEDIUM' ? 'text-amber-600' : 'text-blue-600'
                      }>
                        {item.priority}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.selection?.totalScore !== null && item.selection?.totalScore !== undefined ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-3xs font-extrabold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-250">
                          {item.selection.totalScore} / 100
                        </span>
                      ) : item.totalScore !== null && item.totalScore !== undefined ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-3xs font-extrabold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-250">
                          {item.totalScore} / 100
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-300 dark:text-gray-600 italic">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-2xs text-center font-medium text-gray-500">{item.approvedDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => router.push(`/research/${item.id}`)}
                          className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800/40 flex items-center justify-center"
                          title="Lihat Detail Penelitian"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
