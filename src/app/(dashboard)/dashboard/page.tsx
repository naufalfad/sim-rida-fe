'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOpdStore } from '@/store/useOpdStore';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Send,
  Clock,
  CheckCircle2,
  FilePlus2,
  ArrowRight,
  Activity,
  Award,
  FileText,
  ShieldCheck,
  TrendingUp,
  ClipboardCheck,
  ClipboardList,
  Layers,
  PieChart,
  MapPin,
  FileCheck,
} from 'lucide-react';

export default function UnifiedDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { proposals, activeOpdName, selectProposal } = useOpdStore();

  const isAdmin = user?.role === 'ADMIN_BRIDA';
  const isKepalaBrida = user?.role === 'KEPALA_BRIDA';

  // GIS Sleman Interactive Points
  const [selectedGisPoint, setSelectedGisPoint] = useState<{
    kapanewon: string;
    title: string;
    opd: string;
    scheme: string;
    progress: number;
    allocatedBudget: number;
    category: string;
    coords: { x: string; y: string };
  } | null>({
    kapanewon: 'Kapanewon Depok',
    title: 'Strategi Penurunan Stunting Berbasis Ketahanan Pangan Lokal',
    opd: 'Dinas Kesehatan Kab. Sleman',
    scheme: 'Swakelola BRIDA',
    progress: 100,
    allocatedBudget: 85000000,
    category: 'Sosial Budaya',
    coords: { x: '68%', y: '65%' },
  });

  const gisLocations = [
    { kapanewon: 'Kapanewon Depok', title: 'Strategi Penurunan Stunting Berbasis Ketahanan Pangan Lokal', opd: 'Dinas Kesehatan', scheme: 'Swakelola BRIDA', progress: 100, allocatedBudget: 85000000, coords: { x: '68%', y: '65%' }, category: 'Sosial Budaya' },
    { kapanewon: 'Kapanewon Cangkringan', title: 'Mitigasi Risiko Bencana Erupsi Merapi Berbasis Sensor AI', opd: 'BPBD Sleman', scheme: 'Kerjasama UGM', progress: 45, allocatedBudget: 110000000, coords: { x: '75%', y: '20%' }, category: 'Inovasi Teknologi' },
    { kapanewon: 'Kapanewon Mlati', title: 'Integrasi Single Sign-On Pelayanan Publik Satu Data Sleman', opd: 'Dinas Kominfo', scheme: 'Swakelola BRIDA', progress: 60, allocatedBudget: 75000000, coords: { x: '45%', y: '50%' }, category: 'Tata Kelola' },
    { kapanewon: 'Kapanewon Tempel', title: 'Ketahanan Pangan Melalui Smart Farming Salak Pondoh', opd: 'Dinas Pertanian', scheme: 'Kerjasama Instiper', progress: 75, allocatedBudget: 95000000, coords: { x: '25%', y: '25%' }, category: 'Ekonomi Pembangunan' },
    { kapanewon: 'Kapanewon Godean', title: 'Pengembangan Sentra Industri Kerajinan Ramah Lingkungan', opd: 'Dinas Perindag', scheme: 'Swakelola BRIDA', progress: 30, allocatedBudget: 60000000, coords: { x: '28%', y: '70%' }, category: 'Ekonomi Pembangunan' },
    { kapanewon: 'Kapanewon Prambanan', title: 'Digitalisasi Heritage & Ekowisata Candi Berkelanjutan', opd: 'Dinas Pariwisata', scheme: 'Kerjasama UNY', progress: 85, allocatedBudget: 105000000, coords: { x: '88%', y: '78%' }, category: 'Sosial Budaya' },
  ];

  // Statistics
  const totalSubmitted = proposals.filter((p) => p.status !== 'DRAFT').length;
  const pendingVerification = proposals.filter((p) => p.status === 'PENDING').length;
  const inReviewOrScoring = proposals.filter((p) => p.status === 'IN_REVIEW').length;
  const inProgressStudies = proposals.filter((p) => ['APPROVED', 'IN_PROGRESS'].includes(p.status)).length;
  const completedCount = proposals.filter((p) => p.status === 'COMPLETED').length;
  const draftCount = proposals.filter((p) => p.status === 'DRAFT').length;

  // Category breakdown for "Peta Isu Daerah"
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {
      'Ekonomi Pembangunan': 0,
      'Tata Kelola Pemerintahan': 0,
      'Sosial & Budaya': 0,
      'Inovasi & Teknologi': 0,
    };
    proposals.forEach((p) => {
      if (counts[p.category] !== undefined) {
        counts[p.category] += 1;
      } else {
        counts['Sosial & Budaya'] += 1;
      }
    });
    const total = proposals.length || 1;
    return Object.entries(counts).map(([cat, count]) => ({
      category: cat,
      count,
      percent: Math.round((count / total) * 100),
    }));
  }, [proposals]);

  // OPD Follow-up monitoring stats
  const completedProposals = useMemo(() => proposals.filter((p) => p.status === 'COMPLETED'), [proposals]);
  const reportedFollowUpCount = useMemo(() => completedProposals.filter((p) => p.followUpReport).length, [completedProposals]);
  const pendingFollowUpCount = completedProposals.length - reportedFollowUpCount;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300">
            <Clock className="h-3 w-3" />
            Menunggu Verifikasi
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider bg-[#f0f4f9] text-[#0f2c59] border-[#bfd2e6]">
            <Activity className="h-3 w-3" />
            Sedang Ditelaah / Scoring
          </span>
        );
      case 'SCORED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-900 border-blue-300">
            <Award className="h-3 w-3" />
            Siap Approval
          </span>
        );
      case 'APPROVED':
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-900 border-indigo-300">
            <Activity className="h-3 w-3" />
            Kajian Berjalan
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-900 border-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Rekomendasi Terbit
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border-slate-300">
            Draf
          </span>
        );
    }
  };

  // =========================================================================
  // KEPALA BRIDA (EXECUTIVE VIEW)
  // =========================================================================
  if (isKepalaBrida) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
        
        {/* Top Executive Header Banner */}
        <div className="border border-slate-200 bg-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-[#0f2c59]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#0f2c59] text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" />
              Executive Dashboard Pimpinan • Badan Riset & Inovasi Daerah
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              Laporan Strategis Kinerja Kelitbangan Daerah
            </h1>
            <p className="text-slate-600 text-xs max-w-3xl leading-relaxed">
              Ringkasan komprehensif usulan riset OPD, visualisasi geospasial (GIS) sebaran riset Kabupaten Sleman, status realisasi alokasi pagu anggaran, serta antrean dokumen digital yang memerlukan pengesahan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => router.push('/executive/approvals')}
              className="px-4 py-2 bg-[#0f2c59] hover:bg-[#0a1e3f] text-white text-xs font-semibold uppercase tracking-wider transition border border-[#0f2c59] flex items-center gap-2"
            >
              <ClipboardCheck className="w-4 h-4 text-sky-300" />
              <span>Approval Usulan</span>
            </button>
            <button
              onClick={() => router.push('/executive/legalization')}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold uppercase tracking-wider transition border border-slate-300 flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4 text-[#0f2c59]" />
              <span>Pengesahan TTE</span>
            </button>
          </div>
        </div>

        {/* 4 Macro KPI Strip (Single Container Delimited by Lines) */}
        <div className="border border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="p-6 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Usulan Masuk</span>
            <span className="text-3xl font-bold text-slate-900 block font-mono">{totalSubmitted}</span>
            <span className="text-xs text-slate-600 font-medium block pt-1">Dari 18 Instansi OPD Sleman</span>
          </div>

          <div className="p-6 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Kajian Aktif Lapangan</span>
            <span className="text-3xl font-bold text-[#0f2c59] block font-mono">{inProgressStudies}</span>
            <span className="text-xs text-slate-600 font-medium block pt-1">Dalam tahapan survei & riset</span>
          </div>

          <div className="p-6 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Rekomendasi Disahkan</span>
            <span className="text-3xl font-bold text-emerald-800 block font-mono">{completedCount}</span>
            <span className="text-xs text-slate-600 font-medium block pt-1">TTE Digital Resmi Terbit</span>
          </div>

          <div className="p-6 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Realisasi Pagu Riset</span>
            <span className="text-3xl font-bold text-slate-900 block font-mono">61.4%</span>
            <span className="text-xs text-slate-600 font-medium block pt-1">Rp 890 Jt / Rp 1.45 Miliar</span>
          </div>
        </div>

        {/* Middle Section: GIS Map (Left 7 cols) & Sebaran Isu (Right 5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* GIS Interactive Sleman Map */}
          <div className="lg:col-span-7 border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#0f2c59]" />
                  Peta Sebaran Lokasi Riset Daerah (GIS Sleman)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Pilih titik penanda untuk meninjau rincian kegiatan riset pada kapanewon terkait.</p>
              </div>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 border border-slate-300">
                {gisLocations.length} Titik Lokasi
              </span>
            </div>

            {/* Vector Map Canvas */}
            <div className="relative w-full h-80 bg-[#0a1e3f] overflow-hidden border border-[#1b3b6f] flex items-center justify-center">
              {/* Grid Lines */}
              <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:24px_24px]" />

              {/* Sleman Area Outline */}
              <div className="absolute inset-8 border border-sky-400/30 bg-[#0f2c59]/40 flex items-center justify-center">
                <span className="text-xs font-bold tracking-widest text-sky-200/40 uppercase font-mono">
                  Wilayah Riset Kabupaten Sleman
                </span>
              </div>

              {/* GIS Markers */}
              {gisLocations.map((item, idx) => {
                const isSelected = selectedGisPoint?.kapanewon === item.kapanewon;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedGisPoint(item)}
                    style={{ left: item.coords.x, top: item.coords.y }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-transform ${isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'}`}
                  >
                    <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold border ${
                      isSelected
                        ? 'bg-sky-400 text-[#0a1e3f] border-white font-mono'
                        : 'bg-[#0f2c59] hover:bg-sky-600 text-white border-sky-300'
                    }`}>
                      <span>{idx + 1}</span>
                    </div>
                    <span className="absolute left-1/2 -translate-x-1/2 top-7 whitespace-nowrap bg-[#0a1e3f] text-2xs font-semibold text-white px-2 py-0.5 border border-[#1b3b6f] pointer-events-none opacity-0 group-hover:opacity-100 transition">
                      {item.kapanewon}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Location Info Delimited with Lines */}
            {selectedGisPoint && (
              <div className="border border-slate-200 bg-slate-50 p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xs font-bold text-[#0f2c59] bg-[#dde6f2] px-2 py-0.5 border border-[#bfd2e6]">
                      {selectedGisPoint.kapanewon}
                    </span>
                    <span className="text-2xs text-slate-600 font-semibold uppercase">{selectedGisPoint.category}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedGisPoint.title}</h4>
                  <p className="text-slate-600 text-xs">Instansi Pengusul: {selectedGisPoint.opd} • Skema: {selectedGisPoint.scheme}</p>
                </div>
                <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4 pt-2 sm:pt-0">
                  <span className="text-xs text-slate-500 font-medium block">Progres Pelaksanaan</span>
                  <span className="text-lg font-bold text-[#0f2c59] font-mono block">{selectedGisPoint.progress}%</span>
                  <span className="text-2xs text-slate-600 font-mono">Rp {selectedGisPoint.allocatedBudget.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sebaran Isu & Alokasi Anggaran */}
          <div className="lg:col-span-5 space-y-6">
            {/* Sebaran Isu Strategis */}
            <div className="border border-slate-200 bg-white p-6 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#0f2c59]" />
                  Sebaran Isu Strategis Riset (%)
                </h3>
              </div>

              <div className="space-y-3">
                {categoryStats.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-800">{item.category}</span>
                      <span className="font-bold text-[#0f2c59] font-mono">{item.percent}% ({item.count})</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 overflow-hidden border border-slate-200">
                      <div
                        className="bg-[#0f2c59] h-full transition-all duration-500"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Alokasi Anggaran */}
            <div className="border border-slate-200 bg-white p-6 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#0f2c59]" />
                  Alokasi Pagu & Sumber Daya Kelitbangan
                </h3>
              </div>

              <div className="divide-y divide-slate-200 text-xs">
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-600">Total Pagu Indikatif:</span>
                  <span className="font-bold text-slate-900 font-mono">Rp 1.450.000.000</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-600">Realisasi RKA Belanja:</span>
                  <span className="font-bold text-[#0f2c59] font-mono">Rp 890.000.000 (61.4%)</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-600">Sisa Pagu Tersedia:</span>
                  <span className="font-bold text-emerald-800 font-mono">Rp 560.000.000</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-600">Skema Riset:</span>
                  <span className="font-medium text-slate-800">Swakelola (65%) • Mitra PT (35%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // =========================================================================
  // ADMIN BRIDA (OPERATIONAL VIEW)
  // =========================================================================
  if (isAdmin) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
        
        {/* Operational Header Banner */}
        <div className="border border-slate-200 bg-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-[#0f2c59]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#0f2c59] text-xs font-bold uppercase tracking-widest">
              <ClipboardList className="w-4 h-4" />
              Pusat Kendali Operasional • Admin Litbang BRIDA
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              Dashboard Manajemen Usulan & Pelaksanaan Riset
            </h1>
            <p className="text-slate-600 text-xs max-w-3xl leading-relaxed">
              Verifikasi kelengkapan administrasi usulan masuk dari OPD, lakukan scoring pembobotan instrumen riset, pantau penyusunan KAK/RKA, dan siapkan naskah rekomendasi kebijakan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => router.push('/admin/verification')}
              className="px-4 py-2 bg-[#0f2c59] hover:bg-[#0a1e3f] text-white text-xs font-semibold uppercase tracking-wider transition border border-[#0f2c59] flex items-center gap-2"
            >
              <ClipboardList className="h-4 w-4 text-sky-300" />
              <span>Inbox Verifikasi ({pendingVerification})</span>
            </button>
            <button
              onClick={() => router.push('/admin/scoring')}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold uppercase tracking-wider transition border border-slate-300 flex items-center gap-2"
            >
              <Award className="h-4 w-4 text-[#0f2c59]" />
              <span>Penelaahan & Scoring</span>
            </button>
          </div>
        </div>

        {/* 4 Operational KPI Strips in a Single Delimited Grid */}
        <div className="border border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="p-6 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Antrean Verifikasi</span>
            <span className="text-3xl font-bold text-amber-800 block font-mono">{pendingVerification}</span>
            <span className="text-xs text-slate-600 font-medium block pt-1">Usulan baru dari OPD</span>
          </div>

          <div className="p-6 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Siap Discoring</span>
            <span className="text-3xl font-bold text-[#0f2c59] block font-mono">{inReviewOrScoring}</span>
            <span className="text-xs text-slate-600 font-medium block pt-1">Penilaian 4 kriteria teknis</span>
          </div>

          <div className="p-6 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Kajian Riset Aktif</span>
            <span className="text-3xl font-bold text-slate-900 block font-mono">{inProgressStudies}</span>
            <span className="text-xs text-slate-600 font-medium block pt-1">Penyusunan KAK, RKA & Tim</span>
          </div>

          <div className="p-6 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Rekomendasi Terbit</span>
            <span className="text-3xl font-bold text-emerald-800 block font-mono">{completedCount}</span>
            <span className="text-xs text-slate-600 font-medium block pt-1">Policy Brief siap diterapkan</span>
          </div>
        </div>

        {/* Two Columns: Action Queue & OPD Monitoring */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Quick Action Navigation */}
          <div className="lg:col-span-7 space-y-6">
            <div className="border border-slate-200 bg-white p-6 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#0f2c59]" />
                  Alur Modul Operasional Litbang BRIDA
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  onClick={() => router.push('/admin/verification')}
                  className="p-4 border border-slate-200 bg-slate-50 hover:bg-white hover:border-[#0f2c59] cursor-pointer transition space-y-1"
                >
                  <span className="text-2xs font-bold text-[#0f2c59] uppercase tracking-wider block">Tahap 1</span>
                  <h4 className="font-bold text-xs text-slate-900">Verifikasi Gatekeeper</h4>
                  <p className="text-2xs text-slate-500">Pengecekan 4 kelengkapan administrasi</p>
                </div>

                <div
                  onClick={() => router.push('/admin/scoring')}
                  className="p-4 border border-slate-200 bg-slate-50 hover:bg-white hover:border-[#0f2c59] cursor-pointer transition space-y-1"
                >
                  <span className="text-2xs font-bold text-[#0f2c59] uppercase tracking-wider block">Tahap 2</span>
                  <h4 className="font-bold text-xs text-slate-900">Penelaahan & Scoring</h4>
                  <p className="text-2xs text-slate-500">Formulasi skor prioritas digital</p>
                </div>

                <div
                  onClick={() => router.push('/admin/research')}
                  className="p-4 border border-slate-200 bg-slate-50 hover:bg-white hover:border-[#0f2c59] cursor-pointer transition space-y-1"
                >
                  <span className="text-2xs font-bold text-[#0f2c59] uppercase tracking-wider block">Tahap 3</span>
                  <h4 className="font-bold text-xs text-slate-900">Manajemen Kajian</h4>
                  <p className="text-2xs text-slate-500">Penyusunan KAK, RKA, & Tim Peneliti</p>
                </div>
              </div>
            </div>

            {/* Sebaran Isu */}
            <div className="border border-slate-200 bg-white p-6 space-y-4">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-[#0f2c59]" />
                  Proporsi Topik Isu Riset Daerah
                </h3>
                <span className="text-2xs text-slate-500 font-mono">{totalSubmitted} Usulan Masuk</span>
              </div>

              <div className="space-y-3">
                {categoryStats.map((item) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-800 font-medium">{item.category}</span>
                      <span className="text-[#0f2c59] font-bold font-mono">{item.count} ({item.percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 border border-slate-200 overflow-hidden">
                      <div
                        className="bg-[#0f2c59] h-full transition-all duration-500"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Monitoring Tindak Lanjut OPD */}
          <div className="lg:col-span-5 border border-slate-200 bg-white p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-[#0f2c59]" />
                Monitoring Laporan Pemanfaatan OPD
              </h3>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-200 border border-slate-200 bg-slate-50 py-3 text-center">
              <div>
                <span className="text-2xs text-slate-500 font-semibold uppercase block">Sudah Lapor</span>
                <span className="text-xl font-bold text-[#0f2c59] font-mono">{reportedFollowUpCount} OPD</span>
              </div>
              <div>
                <span className="text-2xs text-slate-500 font-semibold uppercase block">Belum Lapor</span>
                <span className="text-xl font-bold text-amber-800 font-mono">{pendingFollowUpCount} OPD</span>
              </div>
            </div>

            <div className="divide-y divide-slate-200 text-xs">
              {completedProposals.map((item) => (
                <div key={item.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 truncate">{item.opdName}</span>
                    {item.followUpReport ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-2xs font-semibold uppercase border border-emerald-300">
                        Rating: {item.followUpReport.satisfactionRating}/5
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-900 text-2xs font-semibold uppercase border border-amber-300">
                        Menunggu Laporan
                      </span>
                    )}
                  </div>
                  <p className="text-2xs text-slate-600 line-clamp-1">{item.title}</p>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => router.push('/admin/recommendation-builder')}
                className="w-full py-2 bg-[#0f2c59] hover:bg-[#0a1e3f] text-white text-xs font-semibold uppercase tracking-wider transition border border-[#0f2c59] flex items-center justify-center gap-2"
              >
                <FileText className="h-4 w-4 text-sky-300" />
                <span>Penyusunan Rekomendasi Kebijakan</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    );
  }

  // =========================================================================
  // OPD VIEW (USER PENGUSUL)
  // =========================================================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* OPD Header Banner */}
      <div className="border border-slate-200 bg-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-[#0f2c59]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#0f2c59] text-xs font-bold uppercase tracking-widest">
            <Send className="w-4 h-4" />
            Portal Pengajuan Riset • {user?.name || activeOpdName}
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Sistem Informasi Usulan Riset & Inovasi Daerah
          </h1>
          <p className="text-slate-600 text-xs max-w-3xl leading-relaxed">
            Ajukan permasalahan kebijakan dan kebutuhan riset teknis instansi Anda kepada BRIDA Kabupaten Sleman untuk dikaji secara ilmiah dan dirumuskan menjadi rekomendasi kebijakan resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => router.push('/opd/proposals/new')}
            className="px-4 py-2 bg-[#0f2c59] hover:bg-[#0a1e3f] text-white text-xs font-semibold uppercase tracking-wider transition border border-[#0f2c59] flex items-center gap-2"
          >
            <FilePlus2 className="h-4 w-4 text-sky-300" />
            <span>Tambah Usulan Baru</span>
          </button>
          <button
            onClick={() => router.push('/opd/tracking')}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold uppercase tracking-wider transition border border-slate-300 flex items-center gap-2"
          >
            <Activity className="h-4 w-4 text-[#0f2c59]" />
            <span>Tracking Usulan</span>
          </button>
        </div>
      </div>

      {/* 4 OPD Metrics in Single Grid Container */}
      <div className="border border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-6 space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Usulan Terkirim</span>
          <span className="text-3xl font-bold text-slate-900 block font-mono">{totalSubmitted}</span>
          <span className="text-xs text-slate-600 font-medium block pt-1">{draftCount} tersimpan di draf</span>
        </div>

        <div className="p-6 space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Proses Verifikasi</span>
          <span className="text-3xl font-bold text-amber-800 block font-mono">{pendingVerification}</span>
          <span className="text-xs text-slate-600 font-medium block pt-1">Pengecekan berkas administrasi</span>
        </div>

        <div className="p-6 space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Kajian Berjalan</span>
          <span className="text-3xl font-bold text-[#0f2c59] block font-mono">{inReviewOrScoring + inProgressStudies}</span>
          <span className="text-xs text-slate-600 font-medium block pt-1">Tahap riset & formulasi</span>
        </div>

        <div className="p-6 space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Rekomendasi Terbit</span>
          <span className="text-3xl font-bold text-emerald-800 block font-mono">{completedCount}</span>
          <span className="text-xs text-slate-600 font-medium block pt-1">Siap diunduh & ditindaklanjuti</span>
        </div>
      </div>

      {/* Usulan Terkini Table */}
      <div className="border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#0f2c59]" />
            Daftar Usulan Penelitian Instansi Terkini
          </h3>
          <button
            onClick={() => router.push('/opd/tracking')}
            className="text-xs text-[#0f2c59] hover:underline font-semibold uppercase tracking-wider flex items-center gap-1"
          >
            <span>Lihat Semua ({proposals.length})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-200">
          {proposals.slice(0, 4).map((item) => (
            <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-2xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 border border-slate-300">
                    {item.code}
                  </span>
                  <span className="text-2xs font-semibold text-[#0f2c59] bg-[#dde6f2] px-2 py-0.5 border border-[#bfd2e6] uppercase">
                    {item.category}
                  </span>
                  {getStatusBadge(item.status)}
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-1">
                  {item.problemStatement}
                </p>
              </div>

              <div className="shrink-0 self-start sm:self-center">
                <button
                  onClick={() => {
                    selectProposal(item.id);
                    router.push('/opd/tracking');
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold uppercase tracking-wider border border-slate-300 transition flex items-center gap-1.5"
                >
                  <Activity className="h-3.5 w-3.5 text-[#0f2c59]" />
                  <span>Tracking</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
