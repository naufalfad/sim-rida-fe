'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlanningStore } from '@/store/usePlanningStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import { DUMMY_RAB_CATEGORIES, RabItem } from '@/mock/planning/rab';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function RabEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { getRab, saveRabItem, deleteRabItem, fetchPlanning } = usePlanningStore();
  const { researchRecords, fetchProposals } = useResearchStore();

  const id = params?.id || '';
  const isBrida = user?.role === 'BRIDA';

  // Auto-fetch fresh planning on mount
  useEffect(() => {
    fetchPlanning();
    fetchProposals();
  }, [id, fetchPlanning, fetchProposals]);

  // Access check
  useEffect(() => {
    if (user && user.role !== 'BRIDA') {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  // Find target research record
  const record = useMemo(() => {
    return researchRecords.find((r) => r.id === id);
  }, [researchRecords, id]);

  const rab = getRab(id);

  // Redirect if RAB is locked
  useEffect(() => {
    if (rab && ['APPROVED', 'UNDER_REVIEW'].includes(rab.status)) {
      toast('RAB sudah disetujui atau sedang dalam proses review.', 'warning');
      router.replace(`/research/${id}/planning`);
    }
  }, [rab, id, router, toast]);

  // Local state copy of RAB items for dirty checking & save-commit behavior
  const [localItems, setLocalItems] = useState<RabItem[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Sync with store on mount
  useEffect(() => {
    if (rab) {
      setLocalItems(rab.items);
    }
  }, [rab]);

  // Warning when leaving dirty form (Section 34)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'Draf perubahan anggaran belum disimpan. Anda yakin ingin keluar?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // Item form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RabItem | null>(null);

  // Form inputs state
  const [category, setCategory] = useState(DUMMY_RAB_CATEGORIES[0]);
  const [component, setComponent] = useState('');
  const [description, setDescription] = useState('');
  const [volume, setVolume] = useState<number>(1);
  const [unit, setUnit] = useState('Unit');
  const [unitPrice, setUnitPrice] = useState<number>(0);

  // Confirm delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState('');

  // Math tally
  const localGrandTotal = useMemo(() => {
    return localItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [localItems]);

  // Modal open helper
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setCategory(DUMMY_RAB_CATEGORIES[0]);
    setComponent('');
    setDescription('');
    setVolume(1);
    setUnit('Unit');
    setUnitPrice(0);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: RabItem) => {
    setEditingItem(item);
    setCategory(item.category);
    setComponent(item.component);
    setDescription(item.description);
    setVolume(item.volume);
    setUnit(item.unit);
    setUnitPrice(item.unitPrice);
    setIsModalOpen(true);
  };

  // Action: Save modal item
  const handleSaveModalItem = () => {
    if (!component.trim() || !description.trim()) {
      toast('Komponen dan Uraian belanja wajib diisi.', 'warning');
      return;
    }
    if (volume <= 0 || unitPrice <= 0) {
      toast('Volume dan Harga Satuan harus lebih besar dari 0.', 'warning');
      return;
    }

    const subtotal = volume * unitPrice;
    const itemData: RabItem = {
      id: editingItem ? editingItem.id : `item-${Date.now()}`,
      category,
      component,
      description,
      volume,
      unit,
      unitPrice,
      subtotal,
    };

    let nextItems = [...localItems];
    if (editingItem) {
      nextItems = nextItems.map(i => i.id === editingItem.id ? itemData : i);
    } else {
      nextItems.push(itemData);
    }

    setLocalItems(nextItems);
    setIsDirty(true);
    setIsModalOpen(false);
    toast(editingItem ? 'Komponen belanja berhasil diupdate.' : 'Komponen belanja berhasil ditambahkan.', 'success');
  };

  // Action: Delete item trigger
  const handleTriggerDelete = (itemId: string) => {
    setDeletingItemId(itemId);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    setLocalItems(localItems.filter(i => i.id !== deletingItemId));
    setIsDirty(true);
    setIsDeleteOpen(false);
    toast('Komponen belanja dihapus.', 'success');
  };

  // Action: Commit changes to Zustand store
  const handleCommitChanges = async () => {
    if (localItems.length === 0) {
      toast('RAB harus memiliki minimal satu item anggaran belanja.', 'warning');
      return;
    }

    try {
      const storeRab = getRab(id);
      const itemIdsToRemove = storeRab.items
        .map(i => i.id)
        .filter(itemId => !localItems.some(li => li.id === itemId));

      // Remove deleted items
      for (const itemId of itemIdsToRemove) {
        await deleteRabItem(id, itemId);
      }

      // Save added/updated items
      for (const item of localItems) {
        await saveRabItem(id, item);
      }

      setIsDirty(false);
      toast('Draf Rencana Anggaran Biaya (RAB) berhasil disimpan.', 'success');
      router.push(`/research/${id}/planning`);
    } catch (err: any) {
      toast('Gagal menyimpan RAB: ' + (err.message || 'Terjadi kesalahan.'), 'error');
    }
  };

  if (!record) {
    return (
      <div className="space-y-6 text-center py-12 font-sans">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Rekod Penelitian Tidak Ditemukan</h2>
        <button
          onClick={() => router.push('/research')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back link */}
      <div>
        <button
          onClick={() => {
            if (isDirty) {
              if (confirm('Draf perubahan anggaran belum disimpan. Anda yakin ingin keluar?')) {
                router.push(`/research/${record.id}/planning`);
              }
            } else {
              router.push(`/research/${record.id}/planning`);
            }
          }}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </button>
      </div>

      <PageHeader
        title={rab.status === 'NOT_STARTED' ? 'Buat Rencana Anggaran' : 'Edit Rencana Anggaran'}
        description={`Penyusunan RAB Anggaran Belanja Sektoral untuk riset: "${record.title}"`}
        action={
          <button
            onClick={handleOpenAddModal}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Item Anggaran</span>
          </button>
        }
      />

      {/* Main RAB Form Table */}
      <Card>
        <CardContent className="p-0">
          {localItems.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-250">Rincian item RAB masih kosong.</h3>
              <p className="text-xs text-gray-450 max-w-sm">
                Tambahkan komponen belanja honorarium, FGD, perjalanan dinas, atau administrasi sampel riset.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-2xs font-bold transition-all flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Item</span>
              </button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center text-3xs font-semibold">No</TableHead>
                    <TableHead className="text-3xs font-semibold">Kategori / Komponen Uraian</TableHead>
                    <TableHead className="text-3xs font-semibold w-20 text-center">Volume</TableHead>
                    <TableHead className="text-3xs font-semibold w-24 text-center">Satuan</TableHead>
                    <TableHead className="text-3xs font-semibold text-right w-28">Harga Satuan</TableHead>
                    <TableHead className="text-3xs font-semibold text-right w-32">Subtotal</TableHead>
                    <TableHead className="text-3xs font-semibold text-center w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localItems.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center font-bold text-gray-450">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="font-bold text-gray-800 dark:text-gray-250 leading-normal">{item.component}</div>
                        <div className="text-[10px] text-gray-400 font-semibold">{item.category} • {item.description}</div>
                      </TableCell>
                      <TableCell className="text-center font-semibold text-gray-800 dark:text-gray-200">{item.volume}</TableCell>
                      <TableCell className="text-center text-gray-500 font-medium text-2xs">{item.unit}</TableCell>
                      <TableCell className="text-right font-medium text-gray-700 dark:text-gray-300">{formatIDR(item.unitPrice)}</TableCell>
                      <TableCell className="text-right font-bold text-gray-900 dark:text-white">{formatIDR(item.subtotal)}</TableCell>
                      <TableCell>
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded border border-blue-200"
                            title="Edit Item"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleTriggerDelete(item.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded border border-rose-200"
                            title="Delete Item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Total calculations footer bar */}
              <div className="p-4 border-t bg-gray-50/50 dark:bg-gray-900/50 flex flex-wrap justify-between items-baseline gap-4 select-none">
                <span className="text-2xs text-gray-400 font-bold uppercase">Estimasi Anggaran Tally</span>
                <div className="text-right">
                  <span className="text-[9px] text-gray-400 font-bold block uppercase leading-none mb-1">Grand Total Belanja</span>
                  <span className="text-base font-extrabold text-purple-750 dark:text-purple-400">
                    {formatIDR(localGrandTotal)}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="p-4 border-t flex justify-end gap-2 bg-white dark:bg-gray-950">
            <button
              onClick={() => {
                if (isDirty) {
                  if (confirm('Draf perubahan anggaran belum disimpan. Anda yakin ingin keluar?')) {
                    setIsDirty(false);
                    router.push(`/research/${record.id}/planning`);
                  }
                } else {
                  router.push(`/research/${record.id}/planning`);
                }
              }}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold bg-white dark:bg-gray-950"
            >
              Batal
            </button>
            <button
              onClick={handleCommitChanges}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow"
            >
              <Save className="h-4 w-4" />
              <span>Save RAB Changes</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ================= MODAL: ADD / EDIT RAB ITEM FORM ================= */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Komponen Belanja' : 'Tambah Komponen Belanja'}
        description="Lengkapi detail kategori, volume, dan harga satuan belanja riset."
        footer={
          <>
            <button
              onClick={handleSaveModalItem}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-all"
            >
              Simpan Item
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs font-sans">
          
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Kategori */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-gray-700 dark:text-gray-300">Kategori Anggaran *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 focus:outline-none text-gray-900 dark:text-white"
              >
                {DUMMY_RAB_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Komponen */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-gray-700 dark:text-gray-300">Komponen Kegiatan *</label>
              <input
                type="text"
                value={component}
                onChange={(e) => setComponent(e.target.value)}
                placeholder="Contoh: Honorarium Peneliti Utama"
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 focus:outline-none text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Uraian deskripsi */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-gray-700 dark:text-gray-300">Uraian / Deskripsi *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Ahli Sistem Informasi 1 orang x 5 bulan..."
              rows={2}
              className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 focus:outline-none resize-none text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Volume */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-gray-700 dark:text-gray-300">Volume *</label>
              <input
                type="number"
                value={volume || ''}
                onChange={(e) => setVolume(Number(e.target.value))}
                placeholder="Volume"
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 focus:outline-none text-gray-900 dark:text-white"
              />
            </div>

            {/* Satuan */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-gray-700 dark:text-gray-300">Satuan *</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Contoh: OB, OH, Pax"
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 focus:outline-none text-gray-900 dark:text-white"
              />
            </div>

            {/* Harga Satuan */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-gray-700 dark:text-gray-300">Harga Satuan (Rp) *</label>
              <input
                type="number"
                value={unitPrice || ''}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                placeholder="Rp"
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 focus:outline-none text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Live subtotal estimation inside modal */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 border rounded flex justify-between items-baseline font-bold">
            <span className="text-[10px] text-gray-400 uppercase">Live Subtotal</span>
            <span className="text-blue-650">{formatIDR(volume * unitPrice)}</span>
          </div>

        </div>
      </Dialog>

      {/* ================= MODAL: CONFIRM ITEM DELETION ================= */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Hapus Item Anggaran"
        description="Hapus item anggaran ini?"
        footer={
          <>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold transition-all"
            >
              Hapus
            </button>
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <p className="text-xs text-gray-500 leading-relaxed">
          Item belanja terpilih akan dihapus dari daftar draf anggaran belanja lokal. Anggaran total RAB akan disesuaikan secara otomatis.
        </p>
      </Dialog>

    </div>
  );
}
