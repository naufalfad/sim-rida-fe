'use client';

import { useState } from 'react';
import { 
  useOpdStore, 
  OpdUserAccount, 
  BudgetYearConfig 
} from '@/store/useOpdStore';
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
  DollarSign
} from 'lucide-react';

export default function AdminMasterDataPage() {
  const { 
    opdUsers, 
    categories, 
    budgetYears,
    addOpdUser,
    deleteOpdUser,
    toggleUserStatus,
    addCategory,
    deleteCategory,
    toggleBudgetYear
  } = useOpdStore();

  const [activeTab, setActiveTab] = useState<'USERS' | 'CATEGORIES' | 'PERIODS'>('USERS');

  // User form modal
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userOpdName, setUserOpdName] = useState('');
  const [userRole, setUserRole] = useState<'OPD' | 'ADMIN_BRIDA' | 'KEPALA_BRIDA'>('OPD');

  // Category input
  const [newCategoryName, setNewCategoryName] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Handle Add User
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;

    addOpdUser({
      name: userName.trim(),
      email: userEmail.trim(),
      opdName: userOpdName.trim() || 'Dinas / Badan Kab. Sleman',
      role: userRole,
      status: 'ACTIVE'
    });

    setUserName('');
    setUserEmail('');
    setUserOpdName('');
    setIsAddUserModalOpen(false);
  };

  // Handle Add Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    setNewCategoryName('');
  };

  const filteredUsers = opdUsers.filter(u => 
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.opdName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-8 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold tracking-wide uppercase mb-2">
            <Database className="w-5 h-5" />
            Modul 6: Admin BRIDA
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Manajemen Master Data & Konfigurasi Sistem</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Kelola data referensi master akun pengguna OPD, klasifikasi tema riset kelitbangan, serta kendali buka/tutup periode tahun anggaran usulan.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white p-2 rounded-xl shadow-sm gap-2">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-bold transition ${
            activeTab === 'USERS'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Akun Pengguna OPD ({opdUsers.length})
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
          Master Kategori Riset ({categories.length})
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
          Periode Tahun Anggaran ({budgetYears.length})
        </button>
      </div>

      {/* TAB 1: MANAJEMEN AKUN PENGGUNA OPD */}
      {activeTab === 'USERS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, OPD, atau email..."
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
              Tambah Akun OPD Baru
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
                          u.status === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-400'
                        }`}>
                          {u.status === 'ACTIVE' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          {u.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => toggleUserStatus(u.id)}
                            className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                              u.status === 'ACTIVE' 
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' 
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus akun ${u.name}?`)) {
                                deleteOpdUser(u.id);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER KATEGORI RISET */}
      {activeTab === 'CATEGORIES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Category Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              Tambah Kategori Riset
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Kategori ini akan muncul sebagai opsi pilihan ketika OPD mengajukan permasalahan kajian baru di form usulan.
            </p>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Kategori / Bidang:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Pariwisata & Ekonomi Kreatif"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Tambahkan Kategori
              </button>
            </form>
          </div>

          {/* List Categories */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              Daftar Kategori Riset Aktif ({categories.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => (
                <div key={cat} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition">
                  <div className="flex items-center gap-2.5">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">{cat}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus kategori "${cat}"?`)) {
                        deleteCategory(cat);
                      }
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KONFIGURASI PERIODE TAHUN ANGGARAN */}
      {activeTab === 'PERIODS' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Periode Tahun Anggaran Usulan Kajian</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  OPD hanya dapat mengirim usulan baru pada tahun anggaran yang berstatus <span className="text-emerald-700 font-bold">BUKA (OPEN)</span>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {budgetYears.map((item) => {
                const isOpen = item.status === 'OPEN';
                return (
                  <div 
                    key={item.id} 
                    className={`p-6 rounded-2xl border transition-all ${
                      isOpen 
                        ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' 
                        : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-black text-slate-900 font-mono">T.A. {item.year}</span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full uppercase ${
                        isOpen ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isOpen ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {item.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Jadwal Pengajuan:</span>
                        <span className="font-bold text-slate-800">{item.startDate} s/d {item.endDate}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Total Pagu Indikatif:</span>
                        <span className="font-bold text-emerald-800">{item.totalAllocationPagu}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleBudgetYear(item.id)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition shadow flex items-center justify-center gap-2 ${
                        isOpen 
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' 
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {isOpen ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          Tutup Periode Usulan
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          Buka Periode Usulan
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tambah Pengguna OPD Baru */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6">
              <h3 className="font-black text-lg">Tambah Akun Pengguna Baru</h3>
              <p className="text-xs text-emerald-200 mt-1">Registrasikan akun OPD atau tim internal BRIDA.</p>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Lengkap Operator:
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
                  Email Akun:
                </label>
                <input
                  type="email"
                  required
                  placeholder="Misal: andi@slemankab.go.id"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Instansi / OPD:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Dinas Pariwisata Kab. Sleman"
                  value={userOpdName}
                  onChange={(e) => setUserOpdName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
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
                  <option value="OPD">Perangkat Daerah (OPD User)</option>
                  <option value="ADMIN_BRIDA">Admin BRIDA (Pengelola & Peneliti)</option>
                  <option value="KEPALA_BRIDA">Kepala BRIDA (Pemberi TTE / Pengesahan)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow"
                >
                  Buat Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
