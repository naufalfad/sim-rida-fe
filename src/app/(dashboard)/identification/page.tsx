'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIdentificationStore } from '@/store/useIdentificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { masterService, MasterOPD } from '@/services/master.service';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
  FileSearch,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Plus,
  Eye,
  RotateCcw,
  Building2,
  Calendar,
  Layers,
  FileText,
  Edit2
} from 'lucide-react';

export default function IdentificationListPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { identifications, isLoading, fetchIdentifications } = useIdentificationStore();

  const isBrida = user?.role === 'BRIDA' || user?.role === 'ADMIN_BRIDA' || user?.role === 'KEPALA_BRIDA';
  const canCreate = user?.role === 'BRIDA' || user?.role === 'ADMIN_BRIDA';

  // Filters state
  const [search, setSearch] = useState('');
  const [opdFilter, setOpdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [opds, setOpds] = useState<MasterOPD[]>([]);

  useEffect(() => {
    fetchIdentifications();
    masterService.getOpds().then((data) => {
      if (data) setOpds(data);
    }).catch(console.error);
  }, [fetchIdentifications]);

  // Dashboard calculations
  const totalCount = identifications.length;
  const draftCount = identifications.filter((i) => i.status === 'DRAFT').length;
  const reviewCount = identifications.filter((i) => i.status === 'UNDER_REVIEW').length;
  const approvedCount = identifications.filter((i) => i.status === 'APPROVED').length;
  const rejectedCount = identifications.filter((i) => i.status === 'REJECTED').length;

  // Available unique fields & years
  const availableFields = useMemo(() => {
    const fields = new Set(identifications.map((i) => i.field).filter(Boolean));
    return Array.from(fields);
  }, [identifications]);

  const availableYears = useMemo(() => {
    const years = new Set(identifications.map((i) => i.year).filter(Boolean));
    return Array.from(years);
  }, [identifications]);

  // Reset filters
  const handleResetFilters = () => {
    setSearch('');
    setOpdFilter('');
    setStatusFilter('');
    setPriorityFilter('');
    setFieldFilter('');
    setYearFilter('');
  };

  // Filter logic
  const filteredIdentifications = useMemo(() => {
    return identifications.filter((item) => {
      // Search text
      const term = search.toLowerCase();
      const matchesSearch =
        !term ||
        item.code.toLowerCase().includes(term) ||
        item.opdName.toLowerCase().includes(term) ||
        item.title.toLowerCase().includes(term) ||
        item.problemStatement.toLowerCase().includes(term) ||
        item.potentialNeed.toLowerCase().includes(term);

      // OPD
      const matchesOpd = !opdFilter || item.opdId === opdFilter || item.opdName === opdFilter;

      // Status
      const matchesStatus = !statusFilter || item.status === statusFilter;

      // Priority
      const matchesPriority = !priorityFilter || item.priority === priorityFilter;

      // Field
      const matchesField = !fieldFilter || item.field === fieldFilter;

      // Year
      const matchesYear = !yearFilter || item.year.toString() === yearFilter;

      return matchesSearch && matchesOpd && matchesStatus && matchesPriority && matchesField && matchesYear;
    });
  }, [identifications, search, opdFilter, statusFilter, priorityFilter, fieldFilter, yearFilter]);

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold border border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            DRAFT
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-400">
            DALAM TELAAH
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400">
            DISETUJUI
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold border border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-400">
            DITOLAK
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold border border-gray-300 bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-400">
            TINGGI
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/40 dark:text-blue-400">
            SEDANG
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400">
            RENDAH
          </span>
        );
      default:
        return <span>{priority}</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <PageHeader
        title="Identifikasi Kebutuhan OPD"
        description="Pengelolaan identifikasi kebutuhan riset & kajian OPD berdasarkan telaah pemantauan BRIDA dan dokumen baseline daerah."
        action={
          canCreate && (
            <button
              onClick={() => router.push('/identification/new')}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Identifikasi Kebutuhan</span>
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
            <p className="text-[9px] text-gray-400 font-medium mt-1">Total telaah kebutuhan OPD</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Draft</span>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{draftCount}</div>
            <p className="text-[9px] text-gray-400 font-medium mt-1">Belum diajukan ke telaah</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Dalam Telaah</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{reviewCount}</div>
            <p className="text-[9px] text-gray-400 font-medium mt-1">Menunggu persetujuan BRIDA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Disetujui</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{approvedCount}</div>
            <p className="text-[9px] text-gray-400 font-medium mt-1">Siap dijadikan Usulan Riset</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Ditolak</span>
            <AlertCircle className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400">{rejectedCount}</div>
            <p className="text-[9px] text-gray-400 font-medium mt-1">Ditolak / Perlu perbaikan</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Panel */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-6 items-end">
            {/* Search */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">Cari Kebutuhan / Kata Kunci</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nomor PRI, OPD, judul, permasalahan..."
                  className="block w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* OPD Filter */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">Perangkat Daerah (OPD)</label>
              <select
                value={opdFilter}
                onChange={(e) => setOpdFilter(e.target.value)}
                className="block w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="">Semua OPD</option>
                {opds.map((opd) => (
                  <option key={opd.id} value={opd.name}>
                    {opd.shortName || opd.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bidang / Sektor Filter */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">Bidang / Sektor</label>
              <select
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
                className="block w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="">Semua Bidang</option>
                {availableFields.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="">Semua Status</option>
                <option value="DRAFT">Draft</option>
                <option value="UNDER_REVIEW">Dalam Telaah</option>
                <option value="APPROVED">Disetujui</option>
                <option value="REJECTED">Ditolak</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">Prioritas</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="block w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="">Semua Prioritas</option>
                <option value="HIGH">Tinggi</option>
                <option value="MEDIUM">Sedang</option>
                <option value="LOW">Rendah</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-850 pt-2.5">
            <span className="text-3xs text-gray-400 font-medium">
              Menampilkan {filteredIdentifications.length} dari {totalCount} identifikasi kebutuhan
            </span>
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1 text-2xs font-semibold border border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400 rounded flex items-center gap-1.5 transition-all bg-white dark:bg-gray-950"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filter</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Identifications Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-gray-400">Memuat data identifikasi kebutuhan...</div>
          ) : filteredIdentifications.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <FileSearch className="h-10 w-10 text-gray-300" />
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Belum ada identifikasi kebutuhan.</h3>
              <p className="text-xs text-gray-450 max-w-sm">
                Mulai catat identifikasi kebutuhan OPD berdasarkan observasi pemantauan dan dokumen baseline daerah.
              </p>
              {canCreate && (
                <button
                  onClick={() => router.push('/identification/new')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-2xs font-bold transition-all flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Identifikasi Baru</span>
                </button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold w-28">Kode</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold">Perangkat Daerah (OPD)</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold">Bidang & Judul Kebutuhan</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold w-48">Rujukan Baseline</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-24">Prioritas</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-28">Status</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-24">Tahun</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIdentifications.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                    <TableCell className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {item.code}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span>{item.opdName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 tracking-wider">
                        {item.field}
                      </div>
                      <div className="font-semibold text-xs text-gray-850 dark:text-gray-200 mt-0.5 leading-snug line-clamp-2">
                        {item.title}
                      </div>
                      <div className="text-3xs text-gray-450 mt-1 line-clamp-1 italic">
                        {item.problemStatement}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {item.evidenceSources.length > 0 ? (
                        <div className="flex items-start gap-1.5 text-gray-700 dark:text-gray-300">
                          <FileText className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span className="text-3xs line-clamp-2 font-medium">
                            {item.evidenceSources[0].documentName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-3xs text-gray-400 italic">Tanpa dokumen rujukan</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{renderPriorityBadge(item.priority)}</TableCell>
                    <TableCell className="text-center">{renderStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {item.year}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => router.push(`/identification/${item.id}`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-900/50"
                          title="Lihat Detail Telaah"
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

