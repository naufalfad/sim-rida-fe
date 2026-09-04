'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useIdentificationStore } from '@/store/useIdentificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DUMMY_OPDS } from '@/mock/knowledge-base/opd';
import {
  FileSearch,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Plus,
  Eye,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function IdentificationListPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { identifications } = useIdentificationStore();

  const isBrida = user?.role === 'BRIDA';

  // Filters state
  const [search, setSearch] = useState('');
  const [opdFilter, setOpdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Dashboard calculations
  const totalCount = identifications.length;
  const draftCount = identifications.filter(i => i.status === 'DRAFT').length;
  const reviewCount = identifications.filter(i => i.status === 'IN_REVIEW').length;
  const validatedCount = identifications.filter(i => i.status === 'VALIDATED').length;
  const rejectedCount = identifications.filter(i => i.status === 'REJECTED').length;

  // Available dates for filter
  const availableDates = useMemo(() => {
    const dates = new Set(identifications.map(i => i.date));
    return Array.from(dates);
  }, [identifications]);

  // Reset filters
  const handleResetFilters = () => {
    setSearch('');
    setOpdFilter('');
    setStatusFilter('');
    setConfidenceFilter('');
    setDateFilter('');
  };

  // Filter logic
  const filteredIdentifications = useMemo(() => {
    return identifications.filter((item) => {
      // Search text
      const matchesSearch = item.opd.toLowerCase().includes(search.toLowerCase()) ||
        item.topic.toLowerCase().includes(search.toLowerCase()) ||
        item.primaryIssue.toLowerCase().includes(search.toLowerCase());

      // OPD
      const matchesOpd = !opdFilter || item.opd === opdFilter;

      // Status
      const matchesStatus = !statusFilter || item.status === statusFilter;

      // Confidence
      let matchesConfidence = true;
      if (confidenceFilter === 'HIGH') {
        matchesConfidence = item.confidence >= 90;
      } else if (confidenceFilter === 'MED') {
        matchesConfidence = item.confidence >= 80 && item.confidence < 90;
      } else if (confidenceFilter === 'LOW') {
        matchesConfidence = item.confidence < 80;
      }

      // Date
      const matchesDate = !dateFilter || item.date === dateFilter;

      return matchesSearch && matchesOpd && matchesStatus && matchesConfidence && matchesDate;
    });
  }, [identifications, search, opdFilter, statusFilter, confidenceFilter, dateFilter]);

  // Render Status Badge
  const renderStatusBadge = (status: 'DRAFT' | 'ANALYZING' | 'IN_REVIEW' | 'VALIDATED' | 'REJECTED') => {
    let bg = '';
    let text = '';
    let label = '';
    switch (status) {
      case 'DRAFT':
        bg = 'bg-gray-150 dark:bg-gray-800';
        text = 'text-gray-700 dark:text-gray-300';
        label = 'Draft';
        break;
      case 'ANALYZING':
        bg = 'bg-blue-50 dark:bg-blue-950/40';
        text = 'text-blue-600 dark:text-blue-400';
        label = 'Analyzing';
        break;
      case 'IN_REVIEW':
        bg = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400';
        text = 'text-amber-700 dark:text-amber-400';
        label = 'In Review';
        break;
      case 'VALIDATED':
        bg = 'bg-emerald-50 dark:bg-emerald-950/40';
        text = 'text-emerald-700 dark:text-emerald-400';
        label = 'Validated';
        break;
      case 'REJECTED':
        bg = 'bg-rose-50 dark:bg-rose-950/40';
        text = 'text-rose-700 dark:text-rose-450';
        label = 'Rejected';
        break;
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-3xs font-bold border border-transparent ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <PageHeader
        title="Identifikasi Kebutuhan"
        description="Identifikasi kebutuhan dan permasalahan OPD berdasarkan sumber pengetahuan BRIDA."
        action={
          isBrida && (
            <button
              onClick={() => router.push('/identification/new')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Identifikasi Kebutuhan</span>
            </button>
          )
        }
      />

      {/* Metrics Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Total Identifikasi</span>
            <FileSearch className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{totalCount}</div>
            <p className="text-[9px] text-gray-400 font-medium mt-1">Total run analisis kebutuhan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Draft</span>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{draftCount}</div>
            <p className="text-[9px] text-gray-400 font-medium mt-1">Belum diajukan ke peninjauan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Dalam Review</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{reviewCount}</div>
            <p className="text-[9px] text-gray-400 font-medium mt-1">Menunggu validasi BRIDA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Tervalidasi</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{validatedCount}</div>
            <p className="text-[9px] text-gray-400 font-medium mt-1">Telah disetujui tim BRIDA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Ditolak</span>
            <AlertCircle className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{rejectedCount}</div>
            <p className="text-[9px] text-gray-400 font-medium mt-1">Hasil analisis ditolak/revisi</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Panel */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5 items-end">
            
            {/* Search */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">Cari OPD / Permasalahan</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari OPD, permasalahan utama, topik..."
                  className="block w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* OPD Filter */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">Organisasi Perangkat Daerah</label>
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
              <label className="text-3xs font-bold text-gray-500 uppercase">Status Validasi</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="">Semua Status</option>
                <option value="DRAFT">Draft</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="VALIDATED">Validated</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Confidence Filter */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">AI Confidence Score</label>
              <select
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(e.target.value)}
                className="block w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="">Semua Tingkat</option>
                <option value="HIGH">Tinggi (&gt;= 90%)</option>
                <option value="MED">Sedang (80% - 89%)</option>
                <option value="LOW">Rendah (&lt; 80%)</option>
              </select>
            </div>

          </div>

          <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-850 pt-3">
            <span className="text-[10px] text-gray-400 font-semibold italic flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-blue-500" />
              <span>Analisis AI bertindak sebagai indikator kesesuaian prioritas riset.</span>
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

      {/* Identifications Table */}
      <Card>
        <CardContent className="p-0">
          {filteredIdentifications.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <FileSearch className="h-10 w-10 text-gray-300" />
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Belum ada identifikasi kebutuhan.</h3>
              <p className="text-xs text-gray-450 max-w-sm">
                Mulai analisis kebutuhan OPD berdasarkan dokumen acuan pengetahunan BRIDA.
              </p>
              {isBrida && (
                <button
                  onClick={() => router.push('/identification/new')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-2xs font-bold transition-all flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Mulai Analisis</span>
                </button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold w-24">ID</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold">Organisasi Perangkat Daerah (OPD)</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold">Topik / Masalah Utama</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-36">Tanggal Analisis</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-28">AI Confidence</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-28">Status</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold">Diperbarui Oleh</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-20">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIdentifications.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-bold text-gray-500">{item.id}</TableCell>
                    <TableCell className="font-bold text-gray-900 dark:text-white">{item.opd}</TableCell>
                    <TableCell className="max-w-xs truncate" title={item.primaryIssue}>
                      <div className="font-semibold text-gray-800 dark:text-gray-200 truncate">{item.topic}</div>
                      <div className="text-3xs text-gray-400 truncate mt-0.5">{item.primaryIssue}</div>
                    </TableCell>
                    <TableCell className="text-2xs text-center font-medium text-gray-500">{item.date}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-block font-bold text-xs ${
                        item.confidence >= 90
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : item.confidence >= 80
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {item.confidence}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{renderStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-3xs text-gray-400 font-semibold">{item.updatedBy}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => router.push(`/identification/${item.id}`)}
                          className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800/40 flex items-center justify-center"
                          title="Lihat Detail Analisis"
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
