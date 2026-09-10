'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOpdStore, OpdProposal, TrackingStep } from '@/store/useOpdStore';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { DocumentViewerModal, DocumentReviewState } from '@/components/ui/document-viewer-modal';
import {
  Activity,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award,
  AlertCircle,
  FileText,
  Calendar,
  Send,
  FilePlus2,
  Eye,
  ArrowRight,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  Building,
  Layers,
  Sparkles,
  Download,
  ExternalLink,
  X
} from 'lucide-react';
import { openOrDownloadFile, downloadFileDirectly, isPdfDocument } from '@/lib/file-viewer';

export default function OpdTrackingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { proposals, submitDraft, getTrackingSteps, fetchProposals } = useOpdStore();

  const [documentReview, setDocumentReview] = useState<DocumentReviewState | null>(null);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State for viewing specific proposal details
  const [selectedProposal, setSelectedProposal] = useState<OpdProposal | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'TRACKING' | 'DETAIL'>('TRACKING');

  // Filtered proposal list
  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.problemStatement.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;

      return matchSearch && matchStatus && matchCat;
    });
  }, [proposals, search, statusFilter, categoryFilter]);

  // Statistics Summary counts
  const totalCount = proposals.length;
  const pendingCount = proposals.filter((p) => p.status === 'PENDING').length;
  const inReviewCount = proposals.filter((p) => p.status === 'IN_REVIEW').length;
  const inProgressCount = proposals.filter((p) => ['APPROVED', 'IN_PROGRESS'].includes(p.status)).length;
  const completedCount = proposals.filter((p) => p.status === 'COMPLETED').length;
  const draftCount = proposals.filter((p) => p.status === 'DRAFT').length;

  const trackingSteps = selectedProposal ? getTrackingSteps(selectedProposal) : [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-slate-100 text-slate-800 border border-black">
            <Clock className="h-3 w-3" />
            MENUNGGU VERIFIKASI
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-blue-50 text-blue-900 border border-blue-300">
            <Clock className="h-3 w-3" />
            SEDANG DIKAJI
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-blue-700 text-white border border-blue-900">
            <CheckCircle2 className="h-3 w-3" />
            DISETUJUI BRIDA
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-blue-100 text-blue-900 border border-blue-400">
            <Activity className="h-3 w-3" />
            RISET BERJALAN
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-blue-600 text-white border border-blue-800">
            <CheckCircle2 className="h-3 w-3" />
            REKOMENDASI TERBIT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-slate-100 text-slate-800 border border-slate-300">
            DRAFT
          </span>
        );
    }
  };

  const handleOpenDetail = (proposal: OpdProposal) => {
    setSelectedProposal(proposal);
    setActiveTab(proposal.status === 'DRAFT' ? 'DETAIL' : 'TRACKING');
    setIsDetailOpen(true);
  };

  const handleSendDraft = (id: string, title: string) => {
    submitDraft(id);
    toast(`Usulan "${title}" resmi dikirim ke BRIDA.`, 'success');
    if (selectedProposal && selectedProposal.id === id) {
      setSelectedProposal({ ...selectedProposal, status: 'PENDING', submittedAt: new Date().toISOString().split('T')[0] });
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      <PageHeader
        title="Riwayat & Tracking Usulan Penelitian"
        description="Daftar seluruh usulan masalah pembangunan daerah yang diajukan oleh OPD Anda beserta tahapan progres kajian BRIDA secara real-time."
        action={
          <button
            onClick={() => router.push('/opd/proposals/new')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5 border border-blue-700"
          >
            <FilePlus2 className="h-4 w-4" />
            <span>Tambah Usulan Baru</span>
          </button>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-black rounded-lg shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Usulan</span>
          <div className="text-xl font-black text-slate-900 dark:text-white">{totalCount}</div>
          <span className="text-[10px] text-slate-500">{draftCount} dalam draf</span>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-lg shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">Menunggu Verifikasi</span>
          <div className="text-xl font-black text-slate-900">{pendingCount}</div>
          <span className="text-[10px] text-slate-600">Antrean telaah BRIDA</span>
        </div>

        <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-lg shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">Sedang Dikaji</span>
          <div className="text-xl font-black text-blue-700">{inReviewCount}</div>
          <span className="text-[10px] text-blue-700">Penilaian kelayakan</span>
        </div>

        <div className="p-3.5 bg-blue-100/60 border border-blue-300 rounded-lg shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-blue-950 uppercase tracking-wider block">Riset Berjalan</span>
          <div className="text-xl font-black text-blue-900">{inProgressCount}</div>
          <span className="text-[10px] text-blue-800">Pengumpulan data</span>
        </div>

        <div className="p-3.5 bg-blue-600 text-white border border-blue-800 rounded-lg shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-blue-100 uppercase tracking-wider block">Rekomendasi Terbit</span>
          <div className="text-xl font-black text-white">{completedCount}</div>
          <span className="text-[10px] text-blue-100">Dokumen TTE selesai</span>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-sm border-t-4 border-t-[#0f2c59] border border-black">
        <CardHeader className="pb-3 border-b border-black space-y-4">
          
          {/* Header title & search controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span>Tabel Riwayat Pengajuan Usulan Penelitian</span>
            </CardTitle>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari judul atau nomor usulan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-600 font-medium"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="p-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-800"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="Kesehatan">Kesehatan</option>
                <option value="Pendidikan">Pendidikan</option>
                <option value="Infrastruktur & Teknologi">Infrastruktur & Teknologi</option>
                <option value="Ekonomi">Ekonomi</option>
                <option value="Tata Kelola Lingkungan">Tata Kelola Lingkungan</option>
                <option value="Ekonomi & Pariwisata">Ekonomi & Pariwisata</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 text-xs pt-1 border-t border-slate-200">
            {[
              { key: 'ALL', label: `Semua Usulan (${totalCount})` },
              { key: 'PENDING', label: `Pending (${pendingCount})` },
              { key: 'IN_REVIEW', label: `In-Review (${inReviewCount})` },
              { key: 'APPROVED', label: 'Approved' },
              { key: 'IN_PROGRESS', label: `In-Progress (${inProgressCount})` },
              { key: 'COMPLETED', label: `Completed (${completedCount})` },
              { key: 'DRAFT', label: `Draft (${draftCount})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-md font-bold transition-all text-2xs ${
                  statusFilter === tab.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 dark:bg-gray-900/60 text-2xs font-extrabold uppercase text-gray-500">
                <TableHead className="w-14 text-center py-3">No.</TableHead>
                <TableHead className="w-32 text-center py-3">Kode Usulan</TableHead>
                <TableHead className="text-left py-3">Judul Usulan Masalah</TableHead>
                <TableHead className="w-36 text-center py-3">Kategori</TableHead>
                <TableHead className="w-40 text-center py-3">Target Luaran</TableHead>
                <TableHead className="w-32 text-center py-3">Tanggal</TableHead>
                <TableHead className="w-36 text-center py-3">Status</TableHead>
                <TableHead className="w-36 text-center py-3">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y dark:divide-gray-850">
              {filteredProposals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-gray-400 text-xs">
                    Tidak ditemukan usulan penelitian yang cocok dengan filter pencarian Anda.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProposals.map((item, idx) => (
                  <TableRow key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-900/40 transition-colors">
                    
                    {/* No. (Centered) */}
                    <TableCell className="text-center align-middle text-xs font-semibold text-gray-400 py-3.5">
                      {idx + 1}
                    </TableCell>

                    {/* Kode (Centered) */}
                    <TableCell className="text-center align-middle py-3.5">
                      <span className="font-mono text-xs font-extrabold text-blue-900 block">
                        {item.code}
                      </span>
                      {item.urgencyLevel === 'TINGGI' && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-slate-900 text-white border border-black">
                          Urgensi Tinggi
                        </span>
                      )}
                    </TableCell>

                    {/* Judul (Left) */}
                    <TableCell className="text-left align-middle py-3.5">
                      <span className="font-bold text-xs text-slate-900 block leading-snug">
                        {item.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {item.estimatedBudget && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-900 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            Pagu: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.estimatedBudget)}
                          </span>
                        )}
                        {item.torDocument && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            <FileText className="h-3 w-3 text-blue-600" /> KAK/TOR Terlampir
                          </span>
                        )}
                        {item.revisionNotes && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded border border-black">
                            <AlertTriangle className="h-3 w-3" /> Ada Catatan Revisi
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                        {item.problemStatement}
                      </p>
                    </TableCell>

                    {/* Kategori (Centered) */}
                    <TableCell className="text-center align-middle py-3.5 text-xs">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                        {item.category}
                      </span>
                    </TableCell>

                    {/* Target Luaran (Centered) */}
                    <TableCell className="text-center align-middle py-3.5 text-xs font-medium text-slate-800">
                      <span>{item.expectedOutput}</span>
                    </TableCell>

                    {/* Tanggal (Centered) */}
                    <TableCell className="text-center align-middle py-3.5 text-xs text-slate-500">
                      <div className="flex items-center justify-center gap-1 text-[11px]">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>{item.submittedAt || item.createdAt}</span>
                      </div>
                    </TableCell>

                    {/* Status (Centered) */}
                    <TableCell className="text-center align-middle py-3.5">
                      {getStatusBadge(item.status)}
                    </TableCell>

                    {/* Aksi (Centered) */}
                    <TableCell className="text-center align-middle py-3.5">
                      <button
                        onClick={() => handleOpenDetail(item)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-2xs font-bold transition-all shadow inline-flex items-center justify-center gap-1.5 mx-auto border border-blue-700"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Detail</span>
                      </button>
                    </TableCell>

                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ================= DETAIL & TRACKING MODAL ================= */}
      <Dialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedProposal?.code || 'Detail Usulan Penelitian'}
        description={`Rincian usulan dan tahapan tracking progres BRIDA untuk "${selectedProposal?.title || ''}"`}
        size="xl"
      >
        {selectedProposal && (
          <div className="space-y-5 text-xs font-sans">
            
            {/* Header Status & Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-black">
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-xs text-blue-900">
                  {selectedProposal.code}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-700">{selectedProposal.category}</span>
                <span className="text-slate-300">•</span>
                {getStatusBadge(selectedProposal.status)}
              </div>

              {/* Tab Switcher */}
              <div className="flex items-center gap-1 bg-white p-1 rounded border border-slate-300">
                <button
                  type="button"
                  onClick={() => setActiveTab('TRACKING')}
                  className={`px-3 py-1 rounded text-2xs font-bold transition-all ${
                    activeTab === 'TRACKING'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tracking Progres BRIDA
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('DETAIL')}
                  className={`px-3 py-1 rounded text-2xs font-bold transition-all ${
                    activeTab === 'DETAIL'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Informasi Lengkap Usulan
                </button>
              </div>
            </div>

            {/* TAB 1: VISUAL STEPPER TRACKING */}
            {activeTab === 'TRACKING' && (
              <div className="space-y-4">
                {selectedProposal.status === 'DRAFT' ? (
                  <div className="p-6 text-center bg-slate-50 border border-black rounded-lg space-y-2">
                    <AlertCircle className="h-8 w-8 text-blue-600 mx-auto" />
                    <h4 className="font-bold text-xs text-slate-900">Usulan Masih Tersimpan Sebagai Draft</h4>
                    <p className="text-2xs text-slate-600 max-w-md mx-auto">
                      Usulan ini belum dikirimkan ke BRIDA. Silakan kirimkan sekarang agar dapat langsung masuk ke antrean verifikasi dan telaah tim litbang.
                    </p>
                    <button
                      onClick={() => handleSendDraft(selectedProposal.id, selectedProposal.title)}
                      className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-2xs font-bold transition-all shadow inline-flex items-center gap-1.5 border border-blue-700"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Kirim Usulan ke BRIDA Sekarang</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-white rounded-lg border border-black space-y-6">
                    <div className="flex items-center justify-between pb-2 border-b border-black">
                      <span className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span>Tahapan Log Status Kajian & Riset</span>
                      </span>
                      <span className="text-3xs text-slate-500">Pembaruan Terakhir: {selectedProposal.lastUpdated}</span>
                    </div>

                    <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300">
                      {trackingSteps.map((step, idx) => (
                        <div key={step.step} className="relative">
                          <div
                            className={`absolute -left-6 top-0 h-6 w-6 rounded-full flex items-center justify-center text-3xs font-bold border-2 transition-all ${
                              step.isCompleted
                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                : step.isCurrent
                                ? 'bg-blue-800 border-blue-800 text-white animate-pulse shadow-sm'
                                : 'bg-white border-slate-400 text-slate-400'
                            }`}
                          >
                            {step.isCompleted ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>

                          <div className="pl-3 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4
                                className={`text-xs font-bold ${
                                  step.isCompleted
                                    ? 'text-blue-900'
                                    : step.isCurrent
                                    ? 'text-blue-800'
                                    : 'text-slate-400'
                                }`}
                              >
                                {step.label}
                              </h4>
                              {step.date && (
                                <span className="text-3xs font-semibold text-slate-500">{step.date}</span>
                              )}
                            </div>
                            <p className="text-2xs text-slate-600 leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Completed Action Shortcut inside Modal */}
                    {selectedProposal.status === 'COMPLETED' && (
                      <div className="p-3 bg-blue-50 border border-blue-300 rounded-lg flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-blue-900 text-2xs font-semibold">
                          <Award className="h-4 w-4 text-blue-600 shrink-0" />
                          <span>Dokumen rekomendasi resmi (Policy Brief / Naskah Akademik) telah selesai dan siap diunduh.</span>
                        </div>
                        <button
                          onClick={() => {
                            setIsDetailOpen(false);
                            router.push('/opd/recommendations');
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-2xs font-bold shadow shrink-0 border border-blue-700"
                        >
                          Buka Dokumen Rekomendasi
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DETAIL INFORMASI USULAN */}
            {activeTab === 'DETAIL' && (
              <div className="space-y-4">
                
                {/* Meta summary */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 p-3.5 bg-slate-50 rounded-xl text-2xs border border-black">
                  <div>
                    <span className="text-slate-500 block font-semibold text-3xs uppercase">Topik / Judul Usulan</span>
                    <span className="font-bold text-slate-900 block">{selectedProposal.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-semibold text-3xs uppercase">Instansi Pengusul</span>
                    <span className="font-bold text-slate-900 block">{selectedProposal.opdName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-semibold text-3xs uppercase">Estimasi Kebutuhan Anggaran</span>
                    <span className="font-black text-blue-900 block font-mono text-xs">
                      {selectedProposal.estimatedBudget 
                        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedProposal.estimatedBudget)
                        : 'Tidak Ditentukan / Menyesuaikan APBD'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-semibold text-3xs uppercase">Target Luaran yang Diharapkan</span>
                    <span className="font-bold text-blue-900 block">{selectedProposal.expectedOutput}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-semibold text-3xs uppercase">Tingkat Urgensi Masalah</span>
                    <span className="font-bold text-slate-900 block">{selectedProposal.urgencyLevel}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-semibold text-3xs uppercase">Kategori Urusan</span>
                    <span className="font-bold text-slate-800 block">{selectedProposal.category}</span>
                  </div>
                </div>

                {/* Dedicated Dokumen KAK / TOR */}
                <div className="space-y-1.5 pt-1">
                  <span className="font-bold text-slate-800 block text-2xs uppercase flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Dokumen Kerangka Acuan Kerja (KAK / TOR):
                  </span>
                  {selectedProposal.torDocument ? (
                    <div className="p-3 bg-blue-50/70 border border-blue-300 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 text-white rounded-lg">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{selectedProposal.torDocument.name}</span>
                          <span className="text-3xs text-blue-800 font-semibold">
                            {selectedProposal.torDocument.size} • Diunggah {selectedProposal.torDocument.uploadDate} (KAK/TOR Resmi)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedProposal.torDocument) {
                              openOrDownloadFile({
                                name: selectedProposal.torDocument.name,
                                type: 'KAK_TOR',
                                proposalCode: selectedProposal.code,
                                proposalTitle: selectedProposal.title,
                                opdName: selectedProposal.opdName,
                                uploadDate: selectedProposal.torDocument.uploadDate || selectedProposal.createdAt,
                                size: selectedProposal.torDocument.size,
                                url: selectedProposal.torDocument.url,
                                content: `DOKUMEN KERANGKA ACUAN KERJA (KAK/TOR)\nUSULAN KELITBANGAN KABUPATEN MIMIKA\n\nNomor Registrasi: ${selectedProposal.code}\nJudul Usulan: ${selectedProposal.title}\nPerangkat Daerah Pemrakarsa: ${selectedProposal.opdName}\nKategori Urusan: ${selectedProposal.category}\nTarget Output: ${selectedProposal.expectedOutput}\n\n1. LATAR BELAKANG & IDENTIFIKASI MASALAH:\n${selectedProposal.problemStatement}\n\n2. URGENSI KAJIAN:\n${selectedProposal.urgencyReason}`
                              }, toast);
                            }
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-2xs font-bold rounded-lg shadow transition flex items-center gap-1 border border-blue-700"
                        >
                          {isPdfDocument(selectedProposal.torDocument.name) ? (
                            <>
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>Buka PDF di Tab Baru</span>
                            </>
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5" />
                              <span>Unduh File</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-3xs text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-300">
                      Tidak ada dokumen KAK/TOR yang dilampirkan oleh OPD.
                    </p>
                  )}
                </div>

                {/* Problem Statement */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block text-2xs uppercase">
                    Identifikasi Masalah (Latar Belakang Lapangan):
                  </span>
                  <div className="p-3 bg-white border border-black rounded-lg text-2xs leading-relaxed text-slate-800">
                    {selectedProposal.problemStatement}
                  </div>
                </div>

                {/* Urgency Reason */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block text-2xs uppercase">
                    Alasan Urgensi (Mengapa Harus Diteliti Sekarang):
                  </span>
                  <div className="p-3 bg-white border border-black rounded-lg text-2xs leading-relaxed text-slate-800">
                    {selectedProposal.urgencyReason}
                  </div>
                </div>

                {/* Supporting Documents */}
                <div className="space-y-1 pt-1">
                  <span className="font-bold text-slate-800 block text-2xs uppercase">
                    Berkas Data Dukung Tambahan ({selectedProposal.supportingDocuments.length}):
                  </span>
                  {selectedProposal.supportingDocuments.length === 0 ? (
                    <p className="text-3xs text-slate-500 italic">Tidak ada berkas lampiran tambahan.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {selectedProposal.supportingDocuments.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-300 rounded text-3xs">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                            <span className="font-bold text-slate-800 truncate max-w-36 block">{doc.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              openOrDownloadFile({
                                name: doc.name,
                                type: 'DATA_DUKUNG',
                                proposalCode: selectedProposal.code,
                                proposalTitle: selectedProposal.title,
                                opdName: selectedProposal.opdName,
                                uploadDate: selectedProposal.createdAt,
                                size: doc.size,
                                url: doc.url,
                                content: `BERKAS LAMPIRAN DATA DUKUNG\nJudul: ${doc.name}\nUsulan Terkait: ${selectedProposal.title} (${selectedProposal.code})\nPengunggah: ${selectedProposal.opdName}`
                              }, toast);
                            }}
                            className="px-2 py-1 bg-white hover:bg-blue-600 hover:text-white rounded text-3xs font-bold transition flex items-center gap-1 border border-slate-300"
                          >
                            {isPdfDocument(doc.name) ? (
                              <>
                                <ExternalLink className="h-3 w-3" />
                                <span>Buka PDF</span>
                              </>
                            ) : (
                              <>
                                <Download className="h-3 w-3" />
                                <span>Unduh</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Revision notes if any */}
                {selectedProposal.revisionNotes && (
                  <div className="p-3 bg-slate-100 border border-black rounded-lg space-y-1 text-2xs">
                    <div className="flex items-center gap-1 text-slate-900 font-bold">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                      <span>Catatan Revisi dari BRIDA:</span>
                    </div>
                    <p className="text-slate-800 pl-5">{selectedProposal.revisionNotes}</p>
                  </div>
                )}

              </div>
            )}

            {/* Footer Close */}
            <div className="flex justify-end pt-3 border-t dark:border-gray-800">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-xs font-semibold text-gray-600 transition-all"
              >
                Tutup
              </button>
            </div>

          </div>
        )}
      </Dialog>

      {/* Document Review & Viewer Modal */}
      {documentReview && (
        <DocumentViewerModal
          isOpen={!!documentReview}
          onClose={() => setDocumentReview(null)}
          document={documentReview}
        />
      )}

    </div>
  );
}
