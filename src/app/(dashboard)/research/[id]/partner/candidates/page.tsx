'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePartnerStore } from '@/store/usePartnerStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import { Candidate, SupportingDocument } from '@/mock/partners/candidates';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  FileText,
  Eye,
  Link,
  Info
} from 'lucide-react';

const CANDIDATE_TYPES = [
  'Perguruan Tinggi',
  'Lembaga Penelitian',
  'Konsultan',
  'Perusahaan',
  'Organisasi',
  'Internal Pemerintah',
  'Lainnya'
];

export default function CandidatesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { getMethod, getCandidates, saveCandidate, deleteCandidate, fetchPartners, isLoaded } = usePartnerStore();
  const { researchRecords, proposals, fetchProposals } = useResearchStore();

  const id = params?.id || '';
  const isBrida = user?.role === 'BRIDA';

  // Access check
  useEffect(() => {
    if (user && !['BRIDA', 'ADMIN_BRIDA', 'KEPALA_BRIDA'].includes(user.role)) {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchPartners();
    fetchProposals();
  }, [id, fetchPartners, fetchProposals]);

  // Find target research record with fallback
  const record = useMemo(() => {
    const found = researchRecords.find((r) => r.id === id || r.proposalId === id);
    if (found) return found;
    const prop = proposals.find((p) => p.id === id || p.code === id);
    if (prop) {
      return {
        id: prop.id,
        title: prop.title,
        proposalId: prop.code || prop.id,
        identificationId: prop.identificationId || 'ID-001',
        opd: prop.opd || 'Dinas Terkait',
        status: 'PLANNED' as const,
        priority: prop.priority || 'HIGH',
        approvedDate: prop.updatedDate || '2026',
      };
    }
    return null;
  }, [researchRecords, proposals, id]);

  const method = useMemo(() => {
    if (record?.id) {
      const m = getMethod(record.id);
      if (m && (m.status !== 'NOT_STARTED' || m.justification)) return m;
    }
    if (record?.proposalId) {
      const m = getMethod(record.proposalId);
      if (m && (m.status !== 'NOT_STARTED' || m.justification)) return m;
    }
    return getMethod(id);
  }, [getMethod, id, record]);

  const candidates = useMemo(() => {
    if (record?.id) {
      const list = getCandidates(record.id);
      if (list && list.length > 0) return list;
    }
    if (record?.proposalId) {
      const list = getCandidates(record.proposalId);
      if (list && list.length > 0) return list;
    }
    return getCandidates(id);
  }, [getCandidates, id, record]);

  // Redirect if locked once loaded
  useEffect(() => {
    if (isLoaded && method && ['APPROVED', 'UNDER_REVIEW'].includes(method.status)) {
      toast('Proses pemilihan mitra sudah dikunci (Approved/Under Review).', 'warning');
      router.replace(`/research/${id}/partner`);
    }
  }, [isLoaded, method, id, router, toast]);

  // Candidate Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  // Inputs state
  const [name, setName] = useState('');
  const [type, setType] = useState(CANDIDATE_TYPES[0]);
  const [specialization, setSpecialization] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Delete confirm modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  // Doc preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<SupportingDocument | null>(null);

  // Helpers
  const handleOpenAddModal = () => {
    setEditingCandidate(null);
    setName('');
    setType(CANDIDATE_TYPES[0]);
    setSpecialization('');
    setAddress('');
    setContact('');
    setEmail('');
    setWebsite('');
    setPrice(0);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: Candidate) => {
    setEditingCandidate(c);
    setName(c.name);
    setType(c.type);
    setSpecialization(c.specialization);
    setAddress(c.address);
    setContact(c.contact);
    setEmail(c.email);
    setWebsite(c.website);
    setPrice(c.price);
    setNotes(c.notes);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast('Nama calon mitra / perusahaan wajib diisi.', 'warning');
      return;
    }

    const payload: Omit<Candidate, 'documents'> = {
      id: editingCandidate ? editingCandidate.id : `cand-${Date.now()}`,
      researchId: id,
      name: name.trim(),
      type: type as any,
      specialization: specialization.trim() || 'Riset & Pengembangan',
      address: address.trim(),
      contact: contact.trim(),
      email: email.trim(),
      website: website.trim(),
      price: price || 0,
      notes: notes.trim(),
      status: editingCandidate ? editingCandidate.status : 'CANDIDATE',
    };

    try {
      await saveCandidate(id, payload);
      setIsModalOpen(false);
      toast(editingCandidate ? 'Detail calon mitra diperbarui.' : 'Calon mitra baru didaftarkan.', 'success');
    } catch (err: any) {
      toast('Gagal menyimpan calon mitra: ' + (err.message || 'Terjadi kesalahan.'), 'error');
    }
  };

  const handleTriggerDelete = (candId: string) => {
    setDeletingId(candId);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCandidate(id, deletingId);
      setIsDeleteOpen(false);
      toast('Calon mitra berhasil dihapus dari pencatatan.', 'success');
    } catch (err: any) {
      toast('Gagal menghapus calon mitra: ' + (err.message || 'Terjadi kesalahan.'), 'error');
    }
  };

  const handleOpenPreview = (doc: SupportingDocument) => {
    setPreviewDoc(doc);
    setIsPreviewOpen(true);
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push(`/research/${id}/partner`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Overview</span>
        </button>
      </div>

      <PageHeader
        title="Daftar Calon Mitra / Penyedia"
        description={`Pencatatan calon vendor kemitraan eksternal untuk program riset: "${record?.title}"`}
        action={
          <button
            onClick={handleOpenAddModal}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Calon Mitra</span>
          </button>
        }
      />

      {/* Main candidates table */}
      <Card>
        <CardContent className="p-0">
          {candidates.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400 italic">
              Belum ada calon mitra yang didaftarkan.
            </div>
          ) : (
            <div className="divide-y dark:divide-gray-850">
              {candidates.map((c, idx) => (
                <div key={c.id} className="p-6 space-y-4">
                  
                  {/* Top Candidate Row */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{c.name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border font-semibold">
                          {c.type}
                        </span>
                      </div>
                      <p className="text-2xs text-gray-450 mt-1 font-semibold">
                        Spesialisasi: {c.specialization} • Kontak: {c.contact} ({c.email})
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[9px] text-gray-400 font-bold block uppercase leading-none mb-0.5">Penawaran</span>
                        <span className="font-bold text-gray-850 dark:text-gray-300 text-xs">{formatIDR(c.price)}</span>
                      </div>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded border border-blue-200"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleTriggerDelete(c.id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded border border-rose-200"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Supporting Documents (Section 19) */}
                  <div className="pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">
                      Dokumen Lampiran Pendukung
                    </span>
                    {c.documents.length === 0 ? (
                      <span className="text-[10px] text-gray-450 italic">Belum ada dokumen yang dicatat.</span>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {c.documents.map((doc) => (
                          <div key={doc.id} className="p-2 bg-gray-50/50 dark:bg-gray-900/50 border rounded flex justify-between items-center text-3xs">
                            <div className="flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-gray-400" />
                              <div>
                                <span className="font-bold text-gray-700 dark:text-gray-300 block truncate max-w-44">
                                  {doc.name}
                                </span>
                                <span className="text-[9px] text-gray-400 font-semibold">{doc.type} • {doc.uploadDate}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleOpenPreview(doc)}
                              className="text-blue-600 font-bold hover:underline flex items-center gap-0.5 text-3xs uppercase"
                            >
                              <Eye className="h-3 w-3" />
                              <span>View</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================= MODAL: ADD / EDIT CANDIDATE ================= */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCandidate ? 'Edit Calon Mitra' : 'Tambah Calon Mitra'}
        description="Masukkan data profil penyedia dan nominal harga penawaran."
        footer={
          <>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-all"
            >
              Simpan Calon
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
            <div className="space-y-1.5">
              <label className="block font-semibold text-gray-707">Nama Mitra / Perusahaan *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: PT Nusantara Health"
                className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-semibold text-gray-707">Jenis Penyedia *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 text-xs"
              >
                {CANDIDATE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block font-semibold text-gray-707">Spesialisasi Kompetensi *</label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="Contoh: IT Architecture / Survey Kesehatan"
                className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-semibold text-gray-707">Harga Penawaran (Rp) *</label>
              <input
                type="number"
                value={price || ''}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="Rp"
                className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 text-xs"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block font-semibold text-gray-707">No Kontak / Telpon *</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="No telpon..."
                className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-semibold text-gray-707">Email Kantor *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 text-xs"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block font-semibold text-gray-707">Alamat Lengkap</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-semibold text-gray-707">Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="www.mitra.com"
                className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-gray-707">Catatan Kualifikasi</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan sertifikasi..."
              rows={2}
              className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 text-xs"
            />
          </div>

        </div>
      </Dialog>

      {/* ================= MODAL: CONFIRM DELETE CANDIDATE ================= */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Hapus Calon Mitra"
        description="Hapus calon mitra ini?"
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
          Kandidat penyedia terpilih beserta seluruh lampiran berkas penawarannya akan dihapus secara permanen dari draf perencanaan mitra.
        </p>
      </Dialog>

      {/* ================= MODAL: MOCK DOCUMENT PREVIEW ================= */}
      <Dialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`Preview Lampiran: ${previewDoc?.name || ''}`}
        description="Pencatatan Dokumen Pendukung Administrasi SIM-RIDA"
        footer={
          <button
            onClick={() => setIsPreviewOpen(false)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
          >
            Tutup Preview
          </button>
        }
      >
        <div className="p-6 bg-slate-50 border rounded text-center space-y-3 font-sans text-xs">
          <FileText className="h-10 w-10 text-slate-400 mx-auto" />
          <div>
            <h4 className="font-bold text-slate-800">{previewDoc?.name}</h4>
            <p className="text-gray-450 mt-1">Jenis Berkas: {previewDoc?.type} • Status: {previewDoc?.status}</p>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed italic max-w-sm mx-auto">
            (Ini merupakan simulasi pratinjau dokumen. Pada aplikasi produksi nyata, area ini memuat PDF Viewer terintegrasi).
          </p>
        </div>
      </Dialog>

    </div>
  );
}
