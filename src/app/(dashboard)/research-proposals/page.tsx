'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useIdentificationStore } from '@/store/useIdentificationStore';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import { DUMMY_OPDS } from '@/mock/knowledge-base/opd';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  Eye,
  RotateCcw,
  Sparkles,
  ClipboardList,
  ChevronRight
} from 'lucide-react';

export default function ResearchProposalsListPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { proposals } = useResearchStore();
  const { identifications } = useIdentificationStore();

  const isBrida = user?.role === 'BRIDA';

  // Filters state
  const [search, setSearch] = useState('');
  const [opdFilter, setOpdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');

  // Validated identification selection modal state (when clicking + Buat Usulan)
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);

  // Filter out validated identifications that don't have proposals yet (or allow all validated)
  const availableIdentifications = useMemo(() => {
    return identifications.filter((i) => i.status === 'VALIDATED');
  }, [identifications]);

  // Dashboard calculation
  const totalCount = proposals.length;
  const draftCount = proposals.filter((p) => p.status === 'DRAFT').length;
  const selectionCount = proposals.filter((p) => p.status === 'SUBMITTED' || p.status === 'UNDER_SELECTION').length;
  const waitingApprovalCount = proposals.filter((p) => p.status === 'WAITING_APPROVAL').length;
  const approvedCount = proposals.filter((p) => p.status === 'APPROVED').length;
  const rejectedCount = proposals.filter((p) => p.status === 'REJECTED').length;

  // Filtered proposal list
  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.opd.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase());

      const matchesOpd = !opdFilter || p.opd === opdFilter;
      const matchesStatus = !statusFilter || p.status === statusFilter;
      const matchesPriority = !priorityFilter || p.priority === priorityFilter;
      const matchesSector = !sectorFilter || p.sector.toLowerCase().includes(sectorFilter.toLowerCase());

      return matchesSearch && matchesOpd && matchesStatus && matchesPriority && matchesSector;
    });
  }, [proposals, search, opdFilter, statusFilter, priorityFilter, sectorFilter]);

  const handleResetFilters = () => {
    setSearch('');
    setOpdFilter('');
    setStatusFilter('');
    setPriorityFilter('');
    setSectorFilter('');
  };

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    let bg = '';
    let text = '';
    let label = '';
    switch (status) {
      case 'DRAFT':
        bg = 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200';
        label = 'Draft';
        break;
      case 'SUBMITTED':
        bg = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200';
        label = 'Submitted';
        break;
      case 'UNDER_SELECTION':
        bg = 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200';
        label = 'Under Selection';
        break;
      case 'WAITING_APPROVAL':
        bg = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200';
        label = 'Waiting Approval';
        break;
      case 'APPROVED':
        bg = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200';
        label = 'Approved / Penetapan';
        break;
      case 'REJECTED':
        bg = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-450 border-rose-200';
        label = 'Rejected';
        break;
      default:
        bg = 'bg-gray-100 text-gray-700';
        label = status;
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold border ${bg}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <PageHeader
        title="Usulan Penelitian"
        description="Kelola usulan penelitian dan kajian yang berasal dari hasil identifikasi kebutuhan daerah."
        action={
          isBrida && (
            <button
              onClick={() => setIsSelectionModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Usulan Penelitian</span>
            </button>
          )
        }
      />

      {/* Metrics Panel */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <span className="text-[9px] font-bold text-gray-500 uppercase">Total Usulan</span>
            <FileText className="h-4 w-4 text-blue-650" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{totalCount}</div>
            <p className="text-[9px] text-gray-400 mt-0.5">Total draf dan usulan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <span className="text-[9px] font-bold text-gray-500 uppercase">Draft</span>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{draftCount}</div>
            <p className="text-[9px] text-gray-400 mt-0.5">Belum diajukan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <span className="text-[9px] font-bold text-gray-500 uppercase">Dalam Seleksi</span>
            <ClipboardList className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{selectionCount}</div>
            <p className="text-[9px] text-gray-400 mt-0.5">Penilaian kelayakan BRIDA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <span className="text-[9px] font-bold text-gray-500 uppercase">Menunggu Penetapan</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{waitingApprovalCount}</div>
            <p className="text-[9px] text-gray-400 mt-0.5">Menunggu Kepala BRIDA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <span className="text-[9px] font-bold text-gray-500 uppercase">Terpilih</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{approvedCount}</div>
            <p className="text-[9px] text-gray-400 mt-0.5">Ditetapkan jadi penelitian</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <span className="text-[9px] font-bold text-gray-500 uppercase">Ditolak</span>
            <XCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{rejectedCount}</div>
            <p className="text-[9px] text-gray-400 mt-0.5">Tidak lolos seleksi/penetapan</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Panel */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5 items-end">
            
            {/* Search */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">Cari Judul / OPD</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari judul, OPD..."
                  className="block w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* OPD Filter */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">OPD Pengusul</label>
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
              <label className="text-3xs font-bold text-gray-500 uppercase">Status Seleksi</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="">Semua Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_SELECTION">Under Selection</option>
                <option value="WAITING_APPROVAL">Waiting Approval</option>
                <option value="APPROVED">Approved / Penetapan</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">Urgensi / Prioritas</label>
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

            {/* Sector Filter */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">Sektor Pembangunan</label>
              <input
                type="text"
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                placeholder="Cari sektor..."
                className="block w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

          </div>

          <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-850 pt-3">
            <span className="text-[10px] text-gray-400 font-semibold italic flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-blue-500" />
              <span>Usulan diselaraskan dengan hasil AI Identifikasi Kebutuhan.</span>
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

      {/* Proposals List Table */}
      <Card>
        <CardContent className="p-0">
          {filteredProposals.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <FileText className="h-10 w-10 text-gray-300" />
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Belum ada usulan penelitian.</h3>
              <p className="text-xs text-gray-450 max-w-sm">
                Susun usulan penelitian berdasarkan indikasi prioritas permasalahan daerah yang telah divalidasi.
              </p>
              {isBrida && (
                <button
                  onClick={() => setIsSelectionModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-2xs font-bold transition-all flex items-center gap-1 shadow"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Buat Usulan Penelitian</span>
                </button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold w-28">Proposal ID</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold">Judul Penelitian / Kajian</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold">Organisasi Perangkat Daerah</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-24">Prioritas</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-36">Status</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-32">Tanggal Diajukan</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-20">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProposals.map((prop) => (
                  <TableRow key={prop.id}>
                    <TableCell className="font-bold text-gray-500">{prop.id}</TableCell>
                    <TableCell className="max-w-sm truncate" title={prop.title}>
                      <div className="font-bold text-gray-800 dark:text-gray-200 truncate">{prop.title}</div>
                      <div className="text-3xs text-gray-400 mt-0.5">Sektor: {prop.sector} • Ref ID: {prop.identificationId}</div>
                    </TableCell>
                    <TableCell className="font-semibold text-gray-700 dark:text-gray-300">{prop.opd}</TableCell>
                    <TableCell className="text-center">
                      <span className={`text-2xs font-bold ${
                        prop.priority === 'HIGH' ? 'text-rose-600' : prop.priority === 'MEDIUM' ? 'text-amber-600' : 'text-blue-600'
                      }`}>
                        {prop.priority}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{renderStatusBadge(prop.status)}</TableCell>
                    <TableCell className="text-2xs text-center font-medium text-gray-500">{prop.submittedDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => router.push(`/research-proposals/${prop.id}`)}
                          className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800/40 flex items-center justify-center"
                          title="Lihat Detail Usulan"
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

      {/* ================= MODAL: SELECT VALIDATED IDENTIFICATION TO INITIATE PROPOSAL ================= */}
      <Dialog
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        title="Pilih Sumber Identifikasi Masalah"
        description="Pilih hasil identifikasi kebutuhan OPD yang berstatus VALIDATED untuk dijadikan usulan riset."
        footer={
          <button
            onClick={() => setIsSelectionModalOpen(false)}
            className="px-4 py-1.5 border border-gray-300 text-gray-750 dark:border-gray-700 dark:text-gray-300 text-xs font-semibold rounded"
          >
            Batal
          </button>
        }
      >
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
          {availableIdentifications.length === 0 ? (
            <div className="text-center p-6 text-xs text-gray-400 italic">
              Tidak ditemukan data identifikasi kebutuhan dengan status VALIDATED. Silakan lakukan tinjauan & validasi di menu Identifikasi Kebutuhan terlebih dahulu.
            </div>
          ) : (
            <div className="space-y-2">
              {availableIdentifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setIsSelectionModalOpen(false);
                    router.push(`/research-proposals/new?identificationId=${item.id}`);
                  }}
                  className="p-3 border border-gray-200 hover:border-blue-450 dark:border-gray-800 dark:hover:border-blue-800 rounded bg-gray-50/50 dark:bg-gray-900/40 flex justify-between items-center cursor-pointer transition-all hover:bg-blue-50/10"
                >
                  <div className="text-xs space-y-1">
                    <div className="flex gap-2 items-center">
                      <span className="font-bold text-gray-600 dark:text-gray-400">{item.id}</span>
                      <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-250">
                        {item.status}
                      </span>
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white leading-normal">{item.topic}</div>
                    <div className="text-3xs text-gray-400 font-semibold">{item.opd}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      </Dialog>

    </div>
  );
}
