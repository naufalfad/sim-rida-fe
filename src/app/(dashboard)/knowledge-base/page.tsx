'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useKnowledgeBaseStore } from '@/store/useKnowledgeBaseStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import { DUMMY_OPDS } from '@/mock/knowledge-base/opd';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Search,
  Plus,
  Archive,
  Eye,
  RotateCcw
} from 'lucide-react';

export default function KnowledgeBasePage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const { user } = useAuthStore();
  const { documents, versions, categories, fetchDocuments, addDocument, archiveDocument } = useKnowledgeBaseStore();

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const isAdmin = user?.role === 'ADMIN_BRIDA';

  // Filters State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [opdFilter, setOpdFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [docToArchive, setDocToArchive] = useState<string | null>(null);

  // Form state
  const [newDocName, setNewDocName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [opdScope, setOpdScope] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [specificOpds, setSpecificOpds] = useState<string[]>([]);
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString());
  const [newDescription, setNewDescription] = useState('');
  const [newVersion, setNewVersion] = useState('1.0');
  const [newFileName, setNewFileName] = useState('');
  const [newChangeSummary, setNewChangeSummary] = useState('');
  const [formError, setFormError] = useState('');

  // 1. Dashboard calculations
  const totalDocs = documents.length;
  const activeDocs = documents.filter(d => d.status === 'ACTIVE').length;
  const expiredOrArchivedDocs = documents.filter(d => d.status === 'ARCHIVED' || d.status === 'EXPIRED').length;
  const totalCategories = categories.length;

  // Years for filter dropdown (extracted from documents)
  const availableYears = useMemo(() => {
    const yearsSet = new Set(documents.map(d => d.year.toString()));
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [documents]);

  // Reset filters
  const handleResetFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setOpdFilter('');
    setYearFilter('');
    setStatusFilter('');
  };

  // Filter logic
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Search
      const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.description.toLowerCase().includes(search.toLowerCase());

      // Category
      const matchesCategory = !categoryFilter || doc.categoryId === categoryFilter;

      // OPD scope
      const matchesOpd = !opdFilter || 
        (doc.opdScope === 'ALL' && opdFilter === 'Semua OPD') || 
        (doc.opdScope === 'SPECIFIC' && doc.specificOpds.includes(opdFilter));

      // Year
      const matchesYear = !yearFilter || doc.year.toString() === yearFilter;

      // Status
      const matchesStatus = !statusFilter || doc.status === statusFilter;

      return matchesSearch && matchesCategory && matchesOpd && matchesYear && matchesStatus;
    });
  }, [documents, search, categoryFilter, opdFilter, yearFilter, statusFilter]);

  // Form submit: Add Document
  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!newDocName.trim()) {
      setFormError('Nama dokumen wajib diisi.');
      return;
    }
    if (!newCategoryId) {
      setFormError('Kategori dokumen wajib dipilih.');
      return;
    }
    if (!newYear || isNaN(Number(newYear))) {
      setFormError('Tahun terbit wajib diisi dengan angka.');
      return;
    }
    if (opdScope === 'SPECIFIC' && specificOpds.length === 0) {
      setFormError('Pilih setidaknya satu OPD terkait jika cakupan bersifat spesifik.');
      return;
    }
    if (!newVersion.trim()) {
      setFormError('Versi awal wajib diisi.');
      return;
    }
    if (!newFileName.trim()) {
      setFormError('Nama/file dokumen harus dimasukkan.');
      return;
    }

    // Call store action
    addDocument(
      {
        name: newDocName,
        description: newDescription,
        categoryId: newCategoryId,
        opdScope,
        specificOpds: opdScope === 'ALL' ? [] : specificOpds,
        year: Number(newYear),
      },
      newVersion,
      newFileName,
      newChangeSummary || 'Unggahan berkas pertama kali.',
      user?.name || 'Admin'
    );

    // Reset Form
    setNewDocName('');
    setNewCategoryId('');
    setOpdScope('ALL');
    setSpecificOpds([]);
    setNewYear(new Date().getFullYear().toString());
    setNewDescription('');
    setNewVersion('1.0');
    setNewFileName('');
    setNewChangeSummary('');
    setIsAddOpen(false);

    toast('Sumber pengetahuan baru berhasil ditambahkan sebagai DRAFT.', 'success');
  };

  // Archive action handler
  const handleConfirmArchive = () => {
    if (docToArchive) {
      archiveDocument(docToArchive, user?.name || 'Admin');
      setIsArchiveOpen(false);
      setDocToArchive(null);
      toast('Dokumen berhasil dipindahkan ke status Archived.', 'success');
    }
  };

  // Render Status Badge helper
  const renderStatusBadge = (status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'EXPIRED') => {
    let bg = '';
    let text = '';
    let label = '';
    switch (status) {
      case 'DRAFT':
        bg = 'bg-gray-100 dark:bg-gray-800';
        text = 'text-gray-800 dark:text-gray-300';
        label = 'Draft';
        break;
      case 'ACTIVE':
        bg = 'bg-emerald-50 dark:bg-emerald-950/40';
        text = 'text-emerald-700 dark:text-emerald-400';
        label = 'Active';
        break;
      case 'ARCHIVED':
        bg = 'bg-amber-50 dark:bg-amber-950/40';
        text = 'text-amber-700 dark:text-amber-400';
        label = 'Archived';
        break;
      case 'EXPIRED':
        bg = 'bg-red-50 dark:bg-red-950/40';
        text = 'text-red-700 dark:text-red-405';
        label = 'Expired';
        break;
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold border border-transparent ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <PageHeader
        title="Knowledge Base"
        description="Kelola sumber pengetahuan dan dokumen referensi BRIDA yang menjadi dasar analisis kebutuhan daerah."
        action={
          isAdmin && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Dokumen</span>
            </button>
          )
        }
      />

      {/* Mini Dashboard Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Total Dokumen</span>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{totalDocs}</div>
            <p className="text-[9px] text-gray-400 font-medium mt-1">Seluruh versi dokumen terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Dokumen Aktif</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{activeDocs}</div>
            <p className="text-[9px] text-gray-400 font-medium mt-1">Menjadi referensi aktif analisis AI</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Diarsipkan / Expired</span>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{expiredOrArchivedDocs}</div>
            <p className="text-[9px] text-gray-400 font-medium mt-1">Versi historis atau kadaluarsa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Total Kategori</span>
            <FolderOpen className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{totalCategories}</div>
            <p className="text-[9px] text-gray-400 font-medium mt-1">Klasifikasi referensi kajian daerah</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Panel */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-6 items-end">
            
            {/* Search */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">Pencarian</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama atau deskripsi..."
                  className="block w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">Kategori</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="block w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="">Semua Kategori</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* OPD Filter */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">OPD / Cakupan</label>
              <select
                value={opdFilter}
                onChange={(e) => setOpdFilter(e.target.value)}
                className="block w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="">Semua Cakupan</option>
                <option value="Semua OPD">Semua OPD (Umum)</option>
                {DUMMY_OPDS.map(opd => (
                  <option key={opd} value={opd}>{opd}</option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-gray-500 uppercase">Tahun</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="block w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="">Semua Tahun</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
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
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

          </div>

          <div className="flex justify-end border-t border-gray-100 dark:border-gray-850 pt-3">
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

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          {filteredDocs.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <FolderOpen className="h-10 w-10 text-gray-300" />
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">No documents found</h3>
              <p className="text-xs text-gray-400 max-w-sm">
                Try changing your search or filter configuration.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1 text-2xs font-semibold text-blue-600 hover:underline"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold">Nama Dokumen</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold">Kategori</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold">OPD / Cakupan</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center">Tahun</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center">Versi Aktif</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center">Status</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold">Update Terakhir</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold">Oleh</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-36">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => {
                  const categoryName = categories.find(c => c.id === doc.categoryId)?.name || 'Kategori';
                  const opdScopeLabel = doc.opdScope === 'ALL' ? 'Semua OPD' : doc.specificOpds.join(', ');
                  
                  // Get active version number if exists, else gets the latest added version
                  const docVersions = versions.filter(v => v.documentId === doc.id);
                  const activeVersion = docVersions.find(v => v.status === 'ACTIVE')?.version || 
                    (docVersions[0] ? docVersions[0].version : '1.0');

                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-bold text-gray-900 dark:text-white max-w-xs truncate" title={doc.name}>
                        {doc.name}
                      </TableCell>
                      <TableCell className="text-2xs font-medium">{categoryName}</TableCell>
                      <TableCell className="text-2xs truncate max-w-xs" title={opdScopeLabel}>
                        {opdScopeLabel}
                      </TableCell>
                      <TableCell className="text-2xs font-semibold text-center">{doc.year}</TableCell>
                      <TableCell className="text-2xs font-semibold text-center text-blue-600 dark:text-blue-400">
                        v{activeVersion}
                      </TableCell>
                      <TableCell className="text-center">{renderStatusBadge(doc.status)}</TableCell>
                      <TableCell className="text-3xs text-gray-400 font-medium">{doc.updatedAt}</TableCell>
                      <TableCell className="text-3xs text-gray-400 font-semibold">{doc.updatedBy}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => router.push(`/knowledge-base/${doc.id}`)}
                            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800/40 flex items-center justify-center"
                            title="Lihat Detail"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {isAdmin && doc.status !== 'ARCHIVED' && (
                            <button
                              onClick={() => {
                                setDocToArchive(doc.id);
                                setIsArchiveOpen(true);
                              }}
                              className="p-1 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800/40 flex items-center justify-center"
                              title="Arsipkan Dokumen"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ================= MODAL: ADD DOCUMENT ================= */}
      <Dialog
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setFormError('');
        }}
        title="Tambah Sumber Pengetahuan"
        description="Daftarkan dokumen acuan atau regulasi baru ke dalam bank data BRIDA."
        size="lg"
        footer={
          <>
            <button
              onClick={handleSaveDocument}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-all"
            >
              Simpan Dokumen
            </button>
            <button
              onClick={() => {
                setIsAddOpen(false);
                setFormError('');
              }}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-750 dark:text-red-400 text-xs rounded">
              {formError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Nama Dokumen */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Nama Dokumen *
              </label>
              <input
                type="text"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                placeholder="Contoh: RKPD Kabupaten Tahun 2027"
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            {/* Kategori */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Kategori Dokumen *
              </label>
              <select
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">Pilih Kategori</option>
                {categories.filter(c => c.status === 'ACTIVE').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Tahun Terbit */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Tahun Terbit *
              </label>
              <input
                type="number"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
                required
              />
            </div>

            {/* OPD Scope */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Cakupan Dokumen (OPD)
              </label>
              <select
                value={opdScope}
                onChange={(e) => setOpdScope(e.target.value as any)}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="ALL">Semua OPD (Umum)</option>
                <option value="SPECIFIC">OPD Tertentu</option>
              </select>
            </div>

            {/* Versi Awal */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Versi Awal Dokumen *
              </label>
              <input
                type="text"
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                placeholder="1.0"
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Specific OPD Checklist */}
          {opdScope === 'SPECIFIC' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Pilih OPD Terkait *
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-3 border border-gray-200 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900">
                {DUMMY_OPDS.map((opdName) => (
                  <label key={opdName} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={specificOpds.includes(opdName)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSpecificOpds([...specificOpds, opdName]);
                        } else {
                          setSpecificOpds(specificOpds.filter(o => o !== opdName));
                        }
                      }}
                      className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-900"
                    />
                    <span>{opdName}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Deskripsi Singkat Dokumen
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Berikan gambaran isi dokumen ini..."
              rows={2}
              className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
            />
          </div>

          {/* File Upload Dummy */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Nama File Dokumen *
            </label>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Contoh: RKPD_Kabupaten_2027_v1.pdf"
              className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              required
            />
            <p className="text-[10px] text-gray-400">Tuliskan nama berkas fisik untuk simulasi file attachment.</p>
          </div>

          {/* Change Summary */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Catatan Unggahan / Riwayat Perubahan
            </label>
            <input
              type="text"
              value={newChangeSummary}
              onChange={(e) => setNewChangeSummary(e.target.value)}
              placeholder="Contoh: Unggahan dokumen master awal."
              className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>
      </Dialog>

      {/* ================= CONFIRMATION: ARCHIVE ================= */}
      <Dialog
        isOpen={isArchiveOpen}
        onClose={() => {
          setIsArchiveOpen(false);
          setDocToArchive(null);
        }}
        title="Konfirmasi Pengarsipan Dokumen"
        description="Apakah Anda yakin ingin memindahkan dokumen ini ke daftar arsip?"
        footer={
          <>
            <button
              onClick={handleConfirmArchive}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold transition-all"
            >
              Arsipkan Dokumen
            </button>
            <button
              onClick={() => {
                setIsArchiveOpen(false);
                setDocToArchive(null);
              }}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <p className="text-xs text-gray-500 leading-relaxed">
          Dokumen tidak akan dihapus secara permanen. Dokumen akan dipindahkan ke status <strong>Archived</strong> dan dinonaktifkan sebagai acuan aktif riset bupati/OPD.
        </p>
      </Dialog>

    </div>
  );
}
