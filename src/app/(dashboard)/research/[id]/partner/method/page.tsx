'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePartnerStore } from '@/store/usePartnerStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { MethodType, InternalTeamMember, MethodSelection } from '@/mock/partners/methods';
import {
  ArrowLeft,
  Save,
  Users,
  Briefcase,
  Layers,
  Award,
  AlertTriangle,
  Plus,
  Trash2,
  Info
} from 'lucide-react';

export default function PilihMetodePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { getMethod, saveMethod, fetchPartners, isLoaded } = usePartnerStore();
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

  // Redirect if locked once loaded
  useEffect(() => {
    if (isLoaded && method && ['APPROVED', 'UNDER_REVIEW'].includes(method.status)) {
      toast('Metode pelaksanaan sudah disetujui atau sedang di-review.', 'warning');
      router.replace(`/research/${id}/partner`);
    }
  }, [isLoaded, method, id, router, toast]);

  // Form states
  const [selectedMethod, setSelectedMethod] = useState<MethodType>('SWAKELOLA');
  const [justification, setJustification] = useState('');

  // Swakelola specific states
  const [unitPelaksana, setUnitPelaksana] = useState('BRIDA');
  const [rencanaPelaksana, setRencanaPelaksana] = useState('Tim Internal BRIDA');
  const [internalTeam, setInternalTeam] = useState<InternalTeamMember[]>([]);

  // Other method states
  const [procurementReference, setProcurementReference] = useState('');
  const [catalogReference, setCatalogReference] = useState('');

  const [isDirty, setIsDirty] = useState(false);

  // Prefill existing method selection details
  useEffect(() => {
    if (method && (method.status !== 'NOT_STARTED' || method.justification)) {
      setSelectedMethod(method.method || 'SWAKELOLA');
      setJustification(method.justification || '');
      setProcurementReference(method.procurementReference || '');
      setCatalogReference(method.catalogReference || '');

      if (method.method === 'SWAKELOLA' && method.swakelolaDetails) {
        setUnitPelaksana(method.swakelolaDetails.unitPelaksana || 'BRIDA');
        setRencanaPelaksana(method.swakelolaDetails.rencanaPelaksana || 'Tim Internal BRIDA');
        setInternalTeam(method.swakelolaDetails.internalTeam || []);
      }
    }
  }, [method]);

  // Timothy member modal state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [mName, setMName] = useState('');
  const [mPosition, setMPosition] = useState('');
  const [mRole, setMRole] = useState('Peneliti');
  const [mExpertise, setMExpertise] = useState('');

  // Warnings on dirty page leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'Draf perubahan metode belum disimpan. Yakin ingin meninggalkan halaman?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // Handle method selection click
  const handleSelectMethod = (m: MethodType) => {
    setSelectedMethod(m);
    setIsDirty(true);
  };

  // Add tim internal member helper
  const handleAddMember = () => {
    if (!mName.trim() || !mPosition.trim()) {
      toast('Nama dan Jabatan tim internal wajib diisi.', 'warning');
      return;
    }

    const newMember: InternalTeamMember = {
      id: `member-${Date.now()}`,
      name: mName,
      position: mPosition,
      role: mRole,
      expertise: mExpertise,
    };

    setInternalTeam([...internalTeam, newMember]);
    setIsDirty(true);
    setIsMemberModalOpen(false);

    // reset fields
    setMName('');
    setMPosition('');
    setMRole('Peneliti');
    setMExpertise('');
    toast('Anggota tim internal ditambahkan.', 'success');
  };

  const handleDeleteMember = (memberId: string) => {
    setInternalTeam(internalTeam.filter(m => m.id !== memberId));
    setIsDirty(true);
    toast('Anggota tim internal dihapus.', 'success');
  };

  // Save selection
  const handleSave = async () => {
    if (!selectedMethod) {
      toast('Pilih salah satu metode pelaksanaan.', 'warning');
      return;
    }
    if (!justification.trim()) {
      toast('Catatan alasan / justifikasi wajib diisi.', 'warning');
      return;
    }

    const dataPayload: Partial<MethodSelection> = {
      method: selectedMethod,
      justification,
      procurementReference: selectedMethod === 'TENDER' ? procurementReference : '',
      catalogReference: selectedMethod === 'E_KATALOG' ? catalogReference : '',
    };

    if (selectedMethod === 'SWAKELOLA') {
      dataPayload.swakelolaDetails = {
        unitPelaksana,
        rencanaPelaksana,
        internalTeam,
      };
    }

    try {
      await saveMethod(id, dataPayload, user?.name || 'BRIDA Litbang');
      setIsDirty(false);
      toast('Draf metode pelaksanaan berhasil disimpan.', 'success');
      router.push(`/research/${id}/partner`);
    } catch (err: any) {
      toast('Gagal menyimpan metode: ' + (err.message || 'Terjadi kesalahan.'), 'error');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back link */}
      <div>
        <button
          onClick={() => {
            if (isDirty) {
              if (confirm('Draf perubahan metode belum disimpan. Yakin ingin membatalkan?')) {
                router.push(`/research/${id}/partner`);
              }
            } else {
              router.push(`/research/${id}/partner`);
            }
          }}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </button>
      </div>

      <PageHeader
        title="Pilih Metode Pelaksanaan"
        description={`Penentuan skema pengadaan dan kemitraan untuk program riset: "${record?.title}"`}
      />

      {/* Formal Disclaimer Block (Section 42) */}
      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 rounded text-amber-750 dark:text-amber-400 text-2xs flex items-start gap-2 leading-relaxed">
        <Info className="h-4.5 w-4.5 shrink-0 text-amber-600 mt-0.5" />
        <p>
          <strong>DISCLAIMER PENGADAAN PEMERINTAH:</strong> Pemilihan metode dan mitra pada SIM-RIDA merupakan pencatatan proses internal. Pelaksanaan pengadaan barang dan jasa pemerintah harus tetap mengikuti ketentuan dan mekanisme peraturan perundang-undangan pengadaan yang berlaku.
        </p>
      </div>

      {/* 4 Cards selection */}
      <div className="grid gap-4 sm:grid-cols-4 select-none">
        
        {/* 1. SWAKELOLA */}
        <Card
          onClick={() => handleSelectMethod('SWAKELOLA')}
          className={`cursor-pointer transition-all hover:shadow-md border-2 ${
            selectedMethod === 'SWAKELOLA' 
              ? 'border-blue-600 dark:border-blue-500 bg-blue-50/5' 
              : 'border-transparent'
          }`}
        >
          <CardContent className="p-4 space-y-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Users className="h-4.5 w-4.5 text-blue-600" />
              <span className="font-bold text-gray-900 dark:text-white">Swakelola</span>
            </div>
            <p className="text-[10px] text-gray-450 leading-normal">
              Penelitian dilakukan oleh internal pemerintah/SKPD terkait dengan tim peneliti bentukan sendiri.
            </p>
            <span className="text-[9px] text-gray-400 block font-bold uppercase pt-1">
              No External Vendor
            </span>
          </CardContent>
        </Card>

        {/* 2. PENUNJUKAN LANGSUNG */}
        <Card
          onClick={() => handleSelectMethod('PENUNJUKAN_LANGSUNG')}
          className={`cursor-pointer transition-all hover:shadow-md border-2 ${
            selectedMethod === 'PENUNJUKAN_LANGSUNG' 
              ? 'border-blue-600 dark:border-blue-500 bg-blue-50/5' 
              : 'border-transparent'
          }`}
        >
          <CardContent className="p-4 space-y-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Award className="h-4.5 w-4.5 text-blue-600" />
              <span className="font-bold text-gray-900 dark:text-white">Penunjukan Langsung</span>
            </div>
            <p className="text-[10px] text-gray-455 leading-normal">
              Memilih langsung satu penyedia khusus yang memiliki kompetensi unik dan rekam jejak spesifik.
            </p>
            <span className="text-[9px] text-gray-400 block font-bold uppercase pt-1">
              Single Candidate
            </span>
          </CardContent>
        </Card>

        {/* 3. E-KATALOG */}
        <Card
          onClick={() => handleSelectMethod('E_KATALOG')}
          className={`cursor-pointer transition-all hover:shadow-md border-2 ${
            selectedMethod === 'E_KATALOG' 
              ? 'border-blue-600 dark:border-blue-500 bg-blue-50/5' 
              : 'border-transparent'
          }`}
        >
          <CardContent className="p-4 space-y-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Layers className="h-4.5 w-4.5 text-blue-600" />
              <span className="font-bold text-gray-900 dark:text-white">E-Katalog</span>
            </div>
            <p className="text-[10px] text-gray-455 leading-normal">
              Pembelian produk/jasa penelitian melalui katalog elektronik sektoral atau nasional LKPP.
            </p>
            <span className="text-[9px] text-gray-400 block font-bold uppercase pt-1">
              Catalog Reference
            </span>
          </CardContent>
        </Card>

        {/* 4. TENDER */}
        <Card
          onClick={() => handleSelectMethod('TENDER')}
          className={`cursor-pointer transition-all hover:shadow-md border-2 ${
            selectedMethod === 'TENDER' 
              ? 'border-blue-600 dark:border-blue-500 bg-blue-50/5' 
              : 'border-transparent'
          }`}
        >
          <CardContent className="p-4 space-y-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-4.5 w-4.5 text-blue-600" />
              <span className="font-bold text-gray-900 dark:text-white">Tender Seleksi</span>
            </div>
            <p className="text-[10px] text-gray-455 leading-normal">
              Pemilihan umum dengan mengundang beberapa vendor eksternal untuk dievaluasi penawaran teknisnya.
            </p>
            <span className="text-[9px] text-gray-400 block font-bold uppercase pt-1">
              Multiple Candidates
            </span>
          </CardContent>
        </Card>

      </div>

      {/* Conditional forms based on selected method */}
      {selectedMethod && (
        <Card>
          <CardContent className="p-6 space-y-6 text-xs font-sans">
            
            <div className="border-b pb-2 flex justify-between items-baseline">
              <h3 className="font-bold text-gray-850 dark:text-gray-250 uppercase text-xs">
                Detail Skema Perencanaan: {selectedMethod}
              </h3>
              <span className="text-[10px] text-gray-400 font-semibold italic">Isi form wajib (*)</span>
            </div>

            {/* Justification - General to all methods */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Dasar / Alasan Pemilihan Metode (Justifikasi) *
              </label>
              <textarea
                value={justification}
                onChange={(e) => {
                  setJustification(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Jelaskan alasan pemilihan metode pelaksanaan berdasarkan karakteristik penelitian, kebutuhan kompetensi, dan kondisi pelaksanaan..."
                rows={3}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 focus:outline-none resize-none text-gray-900 dark:text-white"
              />
            </div>

            {/* Specific Form Fields */}
            {selectedMethod === 'SWAKELOLA' && (
              <div className="space-y-4 pt-3 border-t">
                <span className="font-bold text-[10px] text-gray-400 block uppercase">Administrasi Swakelola</span>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-gray-750">Unit Pelaksana Kerja *</label>
                    <input
                      type="text"
                      value={unitPelaksana}
                      onChange={(e) => {
                        setUnitPelaksana(e.target.value);
                        setIsDirty(true);
                      }}
                      className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 focus:outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-gray-750">Rencana Penanggung Jawab *</label>
                    <input
                      type="text"
                      value={rencanaPelaksana}
                      onChange={(e) => {
                        setRencanaPelaksana(e.target.value);
                        setIsDirty(true);
                      }}
                      className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 focus:outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Tim Internal List */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Daftar Anggota Tim Internal Pelaksana</span>
                    <button
                      onClick={() => setIsMemberModalOpen(true)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-3xs font-bold uppercase transition-all flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Tambah Anggota</span>
                    </button>
                  </div>

                  {internalTeam.length === 0 ? (
                    <div className="p-4 text-center border rounded bg-gray-50/50 italic text-gray-400">
                      Belum ada anggota tim internal yang didaftarkan.
                    </div>
                  ) : (
                    <div className="border rounded divide-y bg-gray-50/50">
                      {internalTeam.map((member) => (
                        <div key={member.id} className="p-3 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-gray-800 block">{member.name}</span>
                            <span className="text-[10px] text-gray-450 font-semibold">{member.position} • {member.expertise}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-3xs bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                              {member.role}
                            </span>
                            <button
                              onClick={() => handleDeleteMember(member.id)}
                              className="text-rose-600 hover:bg-rose-50 p-1 border rounded"
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedMethod === 'E_KATALOG' && (
              <div className="space-y-1.5 pt-3 border-t">
                <label className="block text-2xs font-bold text-gray-750 uppercase">Referensi Katalog LKPP *</label>
                <input
                  type="text"
                  value={catalogReference}
                  onChange={(e) => {
                    setCatalogReference(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Contoh: CAT-2026-0092"
                  className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 focus:outline-none text-gray-900 dark:text-white"
                />
              </div>
            )}

            {selectedMethod === 'TENDER' && (
              <div className="space-y-1.5 pt-3 border-t">
                <label className="block text-2xs font-bold text-gray-750 uppercase">Nomor Pengumuman Rencana Tender / LPSE *</label>
                <input
                  type="text"
                  value={procurementReference}
                  onChange={(e) => {
                    setProcurementReference(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Contoh: LPSE-TND-99221"
                  className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 focus:outline-none text-gray-900 dark:text-white"
                />
              </div>
            )}

            {/* Save Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                onClick={() => {
                  if (isDirty) {
                    if (confirm('Draf perubahan metode belum disimpan. Yakin ingin membatalkan?')) {
                      setIsDirty(false);
                      router.push(`/research/${id}/partner`);
                    }
                  } else {
                    router.push(`/research/${id}/partner`);
                  }
                }}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold bg-white dark:bg-gray-950"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow"
              >
                <Save className="h-4 w-4" />
                <span>Save Draft</span>
              </button>
            </div>

          </CardContent>
        </Card>
      )}

      {/* ================= MODAL: ADD TIM INTERNAL MEMBER ================= */}
      <Dialog
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        title="Tambah Tim Internal Swakelola"
        description="Masukkan nama dan jabatan peneliti internal."
        footer={
          <>
            <button
              onClick={handleAddMember}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-all"
            >
              Tambah
            </button>
            <button
              onClick={() => setIsMemberModalOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs font-sans">
          <div className="space-y-1.5">
            <label className="block font-semibold text-gray-705">Nama Lengkap *</label>
            <input
              type="text"
              value={mName}
              onChange={(e) => setMName(e.target.value)}
              placeholder="Nama dan gelar..."
              className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block font-semibold text-gray-705">Jabatan / Pangkat *</label>
            <input
              type="text"
              value={mPosition}
              onChange={(e) => setMPosition(e.target.value)}
              placeholder="Contoh: Analis Kebijakan Ahli Muda..."
              className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block font-semibold text-gray-705">Peran Tim *</label>
              <select
                value={mRole}
                onChange={(e) => setMRole(e.target.value)}
                className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900"
              >
                <option value="Ketua Tim">Ketua Tim</option>
                <option value="Peneliti">Peneliti</option>
                <option value="Data Analyst">Data Analyst</option>
                <option value="Policy Analyst">Policy Analyst</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block font-semibold text-gray-705">Spesialisasi Keahlian</label>
              <input
                type="text"
                value={mExpertise}
                onChange={(e) => setMExpertise(e.target.value)}
                placeholder="Contoh: Statistik / Hukum Medis"
                className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900"
              />
            </div>
          </div>
        </div>
      </Dialog>

    </div>
  );
}
