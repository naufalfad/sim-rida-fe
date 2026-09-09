'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  useOpdStore, 
  OpdUserAccount, 
  BudgetYearConfig 
} from '@/store/useOpdStore';
import { useToast } from '@/components/ui/toast';
import { 
  Database, 
  Users, 
  Tag, 
  Calendar, 
  Plus, 
  Trash2, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Building2, 
  Lock, 
  Unlock, 
  Sliders,
  DollarSign,
  RefreshCw,
  Layers,
  KeyRound
} from 'lucide-react';

export default function AdminMasterDataPage() {
  const { toast } = useToast();
  const { 
    opdUsers, 
    opds,
    categories, 
    budgetYears,
    isLoadingMaster,
    fetchUsers,
    fetchOpds,
    addOpdUser,
    deleteOpdUser,
    toggleUserStatus,
    addOpd,
    addCategory,
    deleteCategory,
    toggleBudgetYear
  } = useOpdStore();

  const [activeTab, setActiveTab] = useState<'USERS' | 'OPDS' | 'CATEGORIES' | 'PERIODS'>('USERS');

  // Load data on mount
  useEffect(() => {
    fetchUsers();
    fetchOpds();
  }, [fetchUsers, fetchOpds]);

  // User form modal
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('password123');
  const [userNip, setUserNip] = useState('');
  const [selectedOpdId, setSelectedOpdId] = useState('');
  const [userRole, setUserRole] = useState<'OPD' | 'ADMIN_BRIDA' | 'KEPALA_BRIDA'>('OPD');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // OPD form modal
  const [isAddOpdModalOpen, setIsAddOpdModalOpen] = useState(false);
  const [opdCode, setOpdCode] = useState('');
  const [opdName, setOpdName] = useState('');
  const [opdCategory, setOpdCategory] = useState('Dinas Daerah');
  const [opdEmail, setOpdEmail] = useState('');
  const [isSubmittingOpd, setIsSubmittingOpd] = useState(false);

  // Category & search input
  const [newCategoryName, setNewCategoryName] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [opdSearchQuery, setOpdSearchQuery] = useState('');

  // Handle Add User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;

    try {
      setIsSubmittingUser(true);
      const chosenOpd = opds.find(o => o.id === selectedOpdId);
      await addOpdUser({
        name: userName.trim(),
        email: userEmail.trim(),
        password: userPassword.trim() || 'password123',
        nip: userNip.trim() || undefined,
        opdId: selectedOpdId || undefined,
        opdName: chosenOpd?.name || (userRole === 'ADMIN_BRIDA' ? 'Admin Litbang BRIDA' : userRole === 'KEPALA_BRIDA' ? 'Kepala BRIDA' : 'Instansi OPD'),
        role: userRole,
        status: 'ACTIVE'
      });

      toast(`Akun pengguna "${userName.trim()}" berhasil dibuat di database.`, 'success');
      setUserName('');
      setUserEmail('');
      setUserNip('');
      setUserPassword('password123');
      setSelectedOpdId('');
      setIsAddUserModalOpen(false);
    } catch (err: any) {
      toast('Gagal membuat akun pengguna: ' + err.message, 'error');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Handle Toggle User Status
  const handleToggleUserStatus = async (user: OpdUserAccount) => {
    try {
      const nextStatus = !(user.status === 'ACTIVE' || user.isActive);
      await toggleUserStatus(user.id, nextStatus);
      toast(`Status akun "${user.name}" diubah menjadi ${nextStatus ? 'AKTIF' : 'NON-AKTIF'}.`, 'info');
    } catch (err: any) {
      toast('Gagal mengubah status akun: ' + err.message, 'error');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (user: OpdUserAccount) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun "${user.name}"?`)) return;
    try {
      await deleteOpdUser(user.id);
      toast(`Akun "${user.name}" berhasil dihapus.`, 'success');
    } catch (err: any) {
      toast('Gagal menghapus akun: ' + err.message, 'error');
    }
  };

  // Handle Add OPD
  const handleSaveOpd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opdCode.trim() || !opdName.trim()) return;

    try {
      setIsSubmittingOpd(true);
      await addOpd({
        code: opdCode.trim().toUpperCase(),
        name: opdName.trim(),
        category: opdCategory,
        email: opdEmail.trim() || undefined,
      });

      toast(`Instansi OPD "${opdName.trim()}" berhasil ditambahkan.`, 'success');
      setOpdCode('');
      setOpdName('');
      setOpdEmail('');
      setIsAddOpdModalOpen(false);
    } catch (err: any) {
      toast('Gagal menambah instansi OPD: ' + err.message, 'error');
    } finally {
      setIsSubmittingOpd(false);
    }
  };

  // Handle Add Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    toast(`Kategori riset "${newCategoryName.trim()}" berhasil ditambahkan.`, 'success');
    setNewCategoryName('');
  };

  const filteredUsers = opdUsers.filter(u => 
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (u.opdName || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const filteredOpds = opds.filter(o =>
    o.name.toLowerCase().includes(opdSearchQuery.toLowerCase()) ||
    o.code.toLowerCase().includes(opdSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-8 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold tracking-wide uppercase mb-2">
            <Database className="w-5 h-5" />
            Pusat Konfigurasi • Admin Litbang BRIDA Mimika
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Manajemen Master Data & Konfigurasi Sistem</h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
            Kelola data referensi master akun pengguna instansi, daftar perangkat daerah (OPD), klasifikasi tema riset kelitbangan, serta kendali buka/tutup periode tahun anggaran usulan.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              fetchUsers();
              fetchOpds();
              toast('Data master berhasil diperbarui dari server.', 'info');
            }}
            disabled={isLoadingMaster}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingMaster ? 'animate-spin' : ''}`} />
            <span>Perbarui Data</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap border-b border-slate-200 bg-white p-2 rounded-xl shadow-sm gap-2">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-bold transition ${
            activeTab === 'USERS'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Akun Pengguna Sistem ({opdUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('OPDS')}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-bold transition ${
            activeTab === 'OPDS'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Master Perangkat Daerah ({opds.length})
        </button>

        <button
          onClick={() => setActiveTab('CATEGORIES')}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-bold transition ${
            activeTab === 'CATEGORIES'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          Kategori Bidang Riset ({categories.length})
        </button>

        <button
          onClick={() => setActiveTab('PERIODS')}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-bold transition ${
            activeTab === 'PERIODS'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Periode Anggaran & Pagu ({budgetYears.length})
        </button>
      </div>

      {/* ================= TAB 1: USERS ================= */}
      {activeTab === 'USERS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari nama, NIP, atau email akun..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow transition"
            >
              <Plus className="w-4 h-4" />
              Tambah Akun Pengguna Baru
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Nama Lengkap & Email</th>
                    <th className="py-3.5 px-4">Instansi / Perangkat Daerah</th>
                    <th className="py-3.5 px-4">Role Akses</th>
                    <th className="py-3.5 px-4">Status Akun</th>
                    <th className="py-3.5 px-4 text-center">Aksi Kendali</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>{u.name}</div>
                        <div className="text-[11px] font-normal text-slate-500">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {u.opdName}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          u.role === 'ADMIN_BRIDA' 
                            ? 'bg-purple-100 text-purple-800' 
                            : u.role === 'KEPALA_BRIDA' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                          u.status === 'ACTIVE' || u.isActive ? 'text-emerald-700' : 'text-slate-400'
                        }`}>
                          {(u.status === 'ACTIVE' || u.isActive) ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          {(u.status === 'ACTIVE' || u.isActive) ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                              (u.status === 'ACTIVE' || u.isActive)
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' 
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {(u.status === 'ACTIVE' || u.isActive) ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Hapus Akun"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Tidak ada akun pengguna yang sesuai dengan pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: OPDS ================= */}
      {activeTab === 'OPDS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari kode atau nama OPD..."
                value={opdSearchQuery}
                onChange={(e) => setOpdSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <button
              onClick={() => setIsAddOpdModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow transition"
            >
              <Plus className="w-4 h-4" />
              Tambah Instansi OPD Baru
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Kode OPD</th>
                    <th className="py-3.5 px-4">Nama Perangkat Daerah</th>
                    <th className="py-3.5 px-4">Kategori Instansi</th>
                    <th className="py-3.5 px-4">Email Kontak</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOpds.map((opd) => (
                    <tr key={opd.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {opd.code}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {opd.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {opd.category || 'Dinas Daerah'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {opd.email || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Aktif
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: CATEGORIES ================= */}
      {activeTab === 'CATEGORIES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              Tambah Kategori Riset
            </h3>
            <p className="text-xs text-slate-500">
              Kategori ini digunakan sebagai referensi pengelompokan tema usulan penelitian yang diajukan oleh OPD.
            </p>

            <form onSubmit={handleAddCategory} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Kategori / Bidang:
                </label>
                <input
                  type="text"
                  placeholder="Misal: Energi Baru & Terbarukan"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-lg shadow transition"
              >
                Simpan Kategori Baru
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
              <span>Daftar Kategori Riset Aktif</span>
              <span className="text-xs font-semibold text-slate-500">{categories.length} Bidang</span>
            </h3>

            <div className="divide-y divide-slate-100">
              {categories.map((cat, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{cat}</span>
                  </div>

                  <button
                    onClick={() => {
                      deleteCategory(cat);
                      toast(`Kategori "${cat}" dihapus.`, 'info');
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition"
                    title="Hapus Kategori"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: PERIODS ================= */}
      {activeTab === 'PERIODS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {budgetYears.map((by) => (
              <div 
                key={by.id}
                className={`bg-white p-6 rounded-2xl border transition shadow-sm space-y-4 ${
                  by.status === 'OPEN' ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-extrabold text-lg text-slate-900">Tahun Anggaran {by.year}</h3>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    by.status === 'OPEN'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {by.status === 'OPEN' ? 'Portal Terbuka' : 'Portal Ditutup'}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl">
                  <div className="flex justify-between">
                    <span>Rentang Periode Pengajuan:</span>
                    <span className="font-bold text-slate-800 font-mono">{by.startDate} s.d {by.endDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Plafon Anggaran Pagu:</span>
                    <span className="font-bold text-emerald-700 font-mono">{by.totalAllocationPagu}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    {by.status === 'OPEN' ? 'OPD dapat mengirimkan usulan riset baru.' : 'Pendaftaran usulan riset ditutup sementara.'}
                  </span>

                  <button
                    onClick={() => {
                      toggleBudgetYear(by.id);
                      toast(`Status portal tahun ${by.year} berhasil diubah.`, 'success');
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition ${
                      by.status === 'OPEN'
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow'
                    }`}
                  >
                    {by.status === 'OPEN' ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Tutup Periode
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        Buka Periode
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH USER ================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Tambah Akun Pengguna Baru
              </h3>
              <button 
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Lengkap & Gelar:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Andi Prasetyo, S.IP"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  NIP Pegawai (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Misal: 198501152010011005"
                  value={userNip}
                  onChange={(e) => setUserNip(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email Akun (Login):
                </label>
                <input
                  type="email"
                  required
                  placeholder="Misal: andi@mimikakab.go.id"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Password Awal:
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter (Default: password123)"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Role Sistem:
                </label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-bold"
                >
                  <option value="OPD">Perangkat Daerah (OPD Pengusul)</option>
                  <option value="ADMIN_BRIDA">Admin BRIDA (Pengelola & Peneliti)</option>
                  <option value="KEPALA_BRIDA">Kepala BRIDA (Pemberi TTE / Pengesahan)</option>
                </select>
              </div>

              {userRole === 'OPD' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Instansi / Perangkat Daerah (OPD):
                  </label>
                  <select
                    value={selectedOpdId}
                    onChange={(e) => setSelectedOpdId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Pilih Instansi OPD Terdaftar --</option>
                    {opds.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow flex items-center gap-2"
                >
                  {isSubmittingUser && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Akun Pengguna</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH OPD ================= */}
      {isAddOpdModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Tambah Instansi Perangkat Daerah
              </h3>
              <button 
                onClick={() => setIsAddOpdModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOpd} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kode OPD (Singkatan):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: DISPERINDAG"
                  value={opdCode}
                  onChange={(e) => setOpdCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Resmi Perangkat Daerah:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Dinas Perindustrian dan Perdagangan"
                  value={opdName}
                  onChange={(e) => setOpdName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kategori Instansi:
                </label>
                <select
                  value={opdCategory}
                  onChange={(e) => setOpdCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                >
                  <option value="Dinas Daerah">Dinas Daerah</option>
                  <option value="Badan Daerah">Badan Daerah</option>
                  <option value="Sekretariat Daerah">Sekretariat Daerah</option>
                  <option value="Distrik / Kecamatan">Distrik / Kecamatan</option>
                  <option value="RSUD / BLUD">RSUD / BLUD</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email Resmi OPD (Opsional):
                </label>
                <input
                  type="email"
                  placeholder="Misal: disperindag@mimikakab.go.id"
                  value={opdEmail}
                  onChange={(e) => setOpdEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpdModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOpd}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow flex items-center gap-2"
                >
                  {isSubmittingOpd && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Perangkat Daerah</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
