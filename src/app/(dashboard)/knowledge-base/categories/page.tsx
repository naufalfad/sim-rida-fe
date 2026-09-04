'use client';

import React, { useState, useMemo } from 'react';
import { useKnowledgeBaseStore } from '@/store/useKnowledgeBaseStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, FolderClosed, AlertTriangle } from 'lucide-react';

export default function CategoriesPage() {
  const { toast } = useToast();
  
  const { user } = useAuthStore();
  const { categories, documents, addCategory, editCategory, deleteCategory } = useKnowledgeBaseStore();

  const isAdmin = user?.role === 'ADMIN_BRIDA';

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selected Category info
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catStatus, setCatStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [formError, setFormError] = useState('');

  // Calculate counts for each category
  const categoriesWithStats = useMemo(() => {
    return categories.map((cat) => {
      const catDocs = documents.filter((d) => d.categoryId === cat.id);
      const totalDocsCount = catDocs.length;
      const activeDocsCount = catDocs.filter((d) => d.status === 'ACTIVE').length;

      return {
        ...cat,
        totalDocs: totalDocsCount,
        activeDocs: activeDocsCount,
      };
    });
  }, [categories, documents]);

  // Selected Category document count (for delete warning)
  const selectedCatDocsCount = useMemo(() => {
    if (!selectedCatId) return 0;
    return documents.filter((d) => d.categoryId === selectedCatId && d.status !== 'ARCHIVED').length;
  }, [documents, selectedCatId]);

  // Form Submit: Add Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!catName.trim()) {
      setFormError('Nama kategori wajib diisi.');
      return;
    }

    addCategory(catName.trim());
    setCatName('');
    setIsAddOpen(false);
    toast('Kategori baru berhasil ditambahkan.', 'success');
  };

  // Form Submit: Edit Category
  const handleEditCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedCatId) return;
    if (!catName.trim()) {
      setFormError('Nama kategori wajib diisi.');
      return;
    }

    editCategory(selectedCatId, catName.trim(), catStatus);
    setSelectedCatId(null);
    setCatName('');
    setIsEditOpen(false);
    toast('Kategori berhasil diperbarui.', 'success');
  };

  // Form Submit: Delete Category
  const handleDeleteCategory = () => {
    if (!selectedCatId) return;
    
    const result = deleteCategory(selectedCatId);
    
    if (result.success) {
      setIsDeleteOpen(false);
      setSelectedCatId(null);
      toast('Kategori berhasil dihapus.', 'success');
    } else {
      toast('Gagal menghapus kategori. Kategori masih memiliki dokumen aktif.', 'error');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <PageHeader
        title="Kategori Dokumen"
        description="Kelola klasifikasi kategori sumber pengetahuan BRIDA untuk pengelompokan analisis kebijakan."
        action={
          isAdmin && (
            <button
              onClick={() => {
                setCatName('');
                setFormError('');
                setIsAddOpen(true);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Kategori</span>
            </button>
          )
        }
      />

      {/* Categories Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-3xs uppercase tracking-wider font-semibold">Nama Kategori</TableHead>
                <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center">Jumlah Dokumen</TableHead>
                <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center">Dokumen Aktif</TableHead>
                <TableHead className="text-3xs uppercase tracking-wider font-semibold">Terakhir Diperbarui</TableHead>
                <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center">Status</TableHead>
                {isAdmin && <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-28">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriesWithStats.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-bold text-gray-905 dark:text-white">{cat.name}</TableCell>
                  <TableCell className="text-center font-semibold">{cat.totalDocs}</TableCell>
                  <TableCell className="text-center font-semibold text-blue-650 dark:text-blue-450">{cat.activeDocs}</TableCell>
                  <TableCell className="text-3xs text-gray-400 font-medium">{cat.lastUpdated}</TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold border border-transparent ${
                      cat.status === 'ACTIVE'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    }`}>
                      {cat.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedCatId(cat.id);
                            setCatName(cat.name);
                            setCatStatus(cat.status);
                            setFormError('');
                            setIsEditOpen(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800/40"
                          title="Edit Kategori"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCatId(cat.id);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded border border-red-200 dark:border-red-800/40"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ================= MODAL: ADD CATEGORY ================= */}
      <Dialog
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setFormError('');
        }}
        title="Tambah Kategori Baru"
        description="Definisikan klasifikasi dokumen acuan baru di database BRIDA."
        footer={
          <>
            <button
              onClick={handleAddCategory}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-all"
            >
              Tambah Kategori
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
        <form onSubmit={handleAddCategory} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-750 dark:text-red-400 text-xs rounded">
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Nama Kategori *
            </label>
            <input
              type="text"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Contoh: Renstra Dinas Sektoral"
              className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              required
            />
          </div>
        </form>
      </Dialog>

      {/* ================= MODAL: EDIT CATEGORY ================= */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setFormError('');
        }}
        title="Ubah Kategori"
        description="Perbarui informasi pengelompokan dokumen acuan."
        footer={
          <>
            <button
              onClick={handleEditCategory}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-all"
            >
              Simpan Perubahan
            </button>
            <button
              onClick={() => {
                setIsEditOpen(false);
                setFormError('');
              }}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <form onSubmit={handleEditCategory} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-750 dark:text-red-400 text-xs rounded">
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Nama Kategori *
            </label>
            <input
              type="text"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Status Kategori
            </label>
            <select
              value={catStatus}
              onChange={(e) => setCatStatus(e.target.value as any)}
              className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
            >
              <option value="ACTIVE">Active (Tersedia untuk Dokumen Baru)</option>
              <option value="INACTIVE">Inactive (Disembunyikan)</option>
            </select>
          </div>
        </form>
      </Dialog>

      {/* ================= CONFIRMATION: DELETE CATEGORY ================= */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedCatId(null);
        }}
        title="Hapus Kategori Dokumen"
        description="Apakah Anda yakin ingin menghapus kategori ini secara permanen?"
        footer={
          <>
            <button
              onClick={handleDeleteCategory}
              disabled={selectedCatDocsCount > 0}
              className="px-4 py-2 bg-red-650 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-semibold transition-all"
            >
              Hapus Kategori
            </button>
            <button
              onClick={() => {
                setIsDeleteOpen(false);
                setSelectedCatId(null);
              }}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {selectedCatDocsCount > 0 ? (
            <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded text-xs text-red-750 dark:text-red-400">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-semibold">
                Kategori ini masih digunakan oleh {selectedCatDocsCount} dokumen aktif. Anda tidak dapat menghapus kategori ini sampai dokumen dipindahkan ke kategori lain atau diarsipkan.
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-500 leading-relaxed">
              Tindakan ini tidak dapat dibatalkan. Kategori yang dihapus akan hilang dari basis data sistem secara permanen.
            </p>
          )}
        </div>
      </Dialog>

    </div>
  );
}
