'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  Building2,
  AlertCircle,
  RefreshCw,
  Search,
  BookOpen,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  ChevronRight,
  ExternalLink,
  Sparkles,
  FileEdit,
  RotateCcw,
} from 'lucide-react';

export default function UnifiedDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    proposals,
    activeOpdName,
    selectProposal,
    fetchProposals,
    kepalaDashboard,
    adminDashboard,
    opdDashboard,
    isLoadingDashboard,
    fetchKepalaDashboard,
    fetchAdminDashboard,
    fetchOpdDashboard,
  } = useOpdStore();

  const isAdmin = user?.role === 'ADMIN_BRIDA';
  const isKepalaBrida = user?.role === 'KEPALA_BRIDA';
  const isOpd = user?.role === 'OPD' || (!isAdmin && !isKepalaBrida);

  const loadDashboardData = useCallback(() => {
    if (isKepalaBrida) {
      fetchKepalaDashboard();
    } else if (isAdmin) {
      fetchAdminDashboard();
    } else {
      fetchOpdDashboard();
    }
    fetchProposals();
  }, [isKepalaBrida, isAdmin, fetchKepalaDashboard, fetchAdminDashboard, fetchOpdDashboard, fetchProposals]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // GIS Mimika Interactive Points for Kepala BRIDA
  const [selectedGisPoint, setSelectedGisPoint] = useState<any>(null);

  // Posisi koordinat representatif distrik Mimika pada canvas peta vektor
  const districtMapPositions: Record<string, { x: string; y: string }> = {
    'Distrik Mimika Baru': { x: '48%', y: '42%' },
    'Distrik Kuala Kencana': { x: '60%', y: '35%' },
    'Distrik Wania': { x: '52%', y: '48%' },
    'Distrik Mimika Timur': { x: '70%', y: '58%' },
    'Distrik Iwaka': { x: '38%', y: '40%' },
    'Distrik Kwamki Narama': { x: '54%', y: '32%' },
    'Distrik Tembagapura': { x: '65%', y: '20%' },
    'Distrik Agimuga': { x: '82%', y: '30%' },
  };

  const currentGisLocations = useMemo(() => {
    if (kepalaDashboard?.gisLocations && kepalaDashboard.gisLocations.length > 0) {
      return kepalaDashboard.gisLocations.map((item, idx) => ({
        ...item,
        coords: districtMapPositions[item.distrik || item.kapanewon] || {
          x: `${25 + (idx % 4) * 20}%`,
          y: `${30 + Math.floor(idx / 4) * 25}%`,
        },
      }));
    }
    return [];
  }, [kepalaDashboard]);

  useEffect(() => {
    if (currentGisLocations.length > 0) {
      if (!selectedGisPoint || !currentGisLocations.find((g: any) => g.id === selectedGisPoint.id)) {
        setSelectedGisPoint(currentGisLocations[0]);
      }
    } else {
      setSelectedGisPoint(null);
    }
  }, [currentGisLocations, selectedGisPoint]);

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300">
            <Clock className="h-3 w-3" />
            Menunggu Verifikasi
          </span>
        );
      case 'RETURNED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider bg-red-50 text-red-800 border border-red-300">
            <AlertCircle className="h-3 w-3" />
            Perlu Perbaikan
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
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-300">
            <XCircle className="h-3 w-3" />
            Ditolak
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
  // 1. KEPALA BRIDA (EXECUTIVE DASHBOARD)
  // =========================================================================
  if (isKepalaBrida) {
    const kpis = kepalaDashboard?.kpis || {
      totalProposals: proposals.length || 0,
      pendingApproval: proposals.filter((p) => p.status === 'SCORED').length,
      activeStudies: proposals.filter((p) => ['APPROVED', 'IN_PROGRESS'].includes(p.status)).length,
      completedStudies: proposals.filter((p) => p.status === 'COMPLETED').length,
      finalizedRecommendations: proposals.filter((p) => p.status === 'COMPLETED').length,
      pendingTteCount: 0,
    };

    const budget = kepalaDashboard?.budgetSummary || {
      totalAllocatedBudget: 1450000000,
      totalRkaBudget: 890000000,
      remainingBudget: 560000000,
      budgetByExecutionScheme: {
        SWAKELOLA: { count: 3, budget: 450000000 },
        PENUNJUKAN_LANGSUNG: { count: 2, budget: 300000000 },
        E_KATALOG: { count: 1, budget: 140000000 },
        TENDER: { count: 0, budget: 0 },
      },
    };

    const researchFields = kepalaDashboard?.researchFieldDistribution || [
      { field: 'EKONOMI_PEMBANGUNAN', label: 'Ekonomi Pembangunan & SDA', count: 3, percentage: 35 },
      { field: 'TATA_KELOLA_PEMERINTAHAN', label: 'Tata Kelola & Reformasi Birokrasi', count: 2, percentage: 25 },
      { field: 'SOSIAL_BUDAYA', label: 'Sosial, Budaya & Pengentasan Kemiskinan', count: 2, percentage: 25 },
      { field: 'INOVASI_TEKNOLOGI', label: 'Inovasi, Smart City & Teknologi', count: 1, percentage: 15 },
    ];

    const topOpds = kepalaDashboard?.topActiveOpds || [
      { id: '1', code: 'DINKES', name: 'Dinas Kesehatan', proposalCount: 4 },
      { id: '2', code: 'BAPPEDA', name: 'Badan Perencanaan Pembangunan Daerah', proposalCount: 3 },
      { id: '3', code: 'DISKOMINFO', name: 'Dinas Komunikasi & Informatika', proposalCount: 2 },
      { id: '4', code: 'DISPAR', name: 'Dinas Pariwisata', proposalCount: 2 },
      { id: '5', code: 'BPBD', name: 'Badan Penanggulangan Bencana Daerah', proposalCount: 1 },
    ];

    const budgetRealizationPercent = budget.totalAllocatedBudget > 0
      ? Math.round((budget.totalRkaBudget / budget.totalAllocatedBudget) * 100)
      : 0;

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
        
        {/* Executive Header Banner */}
        <div className="border border-slate-200 bg-white rounded-xl shadow-xs p-4 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#0f2c59] text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" />
              Executive Dashboard Pimpinan • Badan Riset & Inovasi Daerah Kab. Mimika
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              Laporan Strategis Kinerja Kelitbangan Daerah
            </h1>
            <p className="text-slate-600 text-xs max-w-3xl leading-relaxed">
              Pemantauan makro usulan riset perangkat daerah, visualisasi geospasial (GIS) sebaran riset 18 Distrik Kabupaten Mimika, realisasi serapan anggaran riset daerah, dan antrean pengesahan TTE digital.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={loadDashboardData}
              disabled={isLoadingDashboard}
              className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingDashboard ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => router.push('/executive/approvals')}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#0f2c59] hover:bg-[#0a1e3f] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition border border-[#0f2c59] flex items-center justify-center gap-2 shadow-xs"
            >
              <ClipboardCheck className="w-4 h-4 text-sky-300" />
              <span>Approval Usulan ({kpis.pendingApproval})</span>
            </button>
            <button
              onClick={() => router.push('/executive/legalization')}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold uppercase tracking-wider rounded-lg transition border border-slate-300 flex items-center justify-center gap-2"
            >
              <FileCheck className="w-4 h-4 text-[#0f2c59]" />
              <span>Pengesahan TTE ({kpis.pendingTteCount})</span>
            </button>
          </div>
        </div>

        {/* 5 Macro KPI Strip */}
        <div className="border border-slate-200 bg-white rounded-xl shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 overflow-hidden">
          <div className="p-4 sm:p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Usulan</span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 block font-mono">{kpis.totalProposals}</span>
            <span className="text-xs text-slate-600 font-medium block pt-1">Dari OPD Mimika</span>
          </div>

          <div className="p-4 sm:p-5 space-y-1 bg-amber-50/30">
            <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider block">Menunggu Approval</span>
            <span className="text-2xl sm:text-3xl font-bold text-amber-700 block font-mono">{kpis.pendingApproval}</span>
            <span className="text-xs text-amber-800 font-medium block pt-1">Siap diputuskan</span>
          </div>

          <div className="p-4 sm:p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Kajian Aktif</span>
            <span className="text-2xl sm:text-3xl font-bold text-[#0f2c59] block font-mono">{kpis.activeStudies}</span>
            <span className="text-xs text-slate-600 font-medium block pt-1">Tahap riset & survei</span>
          </div>

          <div className="p-4 sm:p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Rekomendasi Terbit</span>
            <span className="text-2xl sm:text-3xl font-bold text-emerald-800 block font-mono">{kpis.finalizedRecommendations}</span>
            <span className="text-xs text-slate-600 font-medium block pt-1">TTE Digital Resmi</span>
          </div>

          <div className="p-4 sm:p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Serapan Pagu</span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 block font-mono">{budgetRealizationPercent}%</span>
            <span className="text-xs text-slate-600 font-medium block pt-1">Rp {(budget.totalRkaBudget / 1000000).toFixed(0)} Jt / {(budget.totalAllocatedBudget / 1000000000).toFixed(2)} M</span>
          </div>
        </div>

        {/* GIS Map (Left 7 cols) & Sebaran Isu (Right 5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* GIS Interactive Mimika Map */}
          <div className="lg:col-span-7 border border-slate-200 bg-white rounded-xl shadow-xs p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#0f2c59]" />
                  Peta Sebaran Lokasi Riset Daerah (GIS Mimika)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Pilih titik penanda untuk meninjau rincian kegiatan riset pada distrik terkait.</p>
              </div>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 border border-slate-200 rounded-md self-start sm:self-auto">
                {currentGisLocations.length} Titik Lokasi
              </span>
            </div>

            {/* Vector Map Canvas */}
            <div className="relative w-full h-72 sm:h-80 bg-[#0a1e3f] rounded-lg overflow-hidden border border-[#1b3b6f] flex items-center justify-center">
              {/* Grid Lines */}
              <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:24px_24px]" />

              {/* Mimika Area Outline */}
              <div className="absolute inset-4 sm:inset-8 border border-sky-400/30 bg-[#0f2c59]/40 rounded flex items-center justify-center">
                <span className="text-xs font-bold tracking-widest text-sky-200/40 uppercase font-mono text-center px-4">
                  Wilayah Riset Kabupaten Mimika
                </span>
              </div>

              {/* GIS Markers */}
              {currentGisLocations.length === 0 ? (
                <div className="z-10 text-center p-6 space-y-2 max-w-sm">
                  <MapPin className="w-8 h-8 mx-auto text-sky-400/60" />
                  <p className="text-xs font-semibold text-white">Belum Ada Riset Aktif yang Terpetakan</p>
                  <p className="text-2xs text-sky-200/60 leading-relaxed">
                    Titik spasial riset akan otomatis muncul setelah usulan disahkan oleh Kepala BRIDA dan diinisiasi menjadi kajian litbang daerah.
                  </p>
                </div>
              ) : (
                currentGisLocations.map((item: any, idx: number) => {
                  const isSelected = selectedGisPoint?.distrik === item.distrik || selectedGisPoint?.kapanewon === item.kapanewon || selectedGisPoint?.id === item.id;
                  return (
                    <button
                      key={item.id || idx}
                      onClick={() => setSelectedGisPoint(item)}
                      style={{ left: item.coords?.x || '50%', top: item.coords?.y || '50%' }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-transform ${isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'}`}
                    >
                      <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full border ${
                        isSelected
                          ? 'bg-sky-400 text-[#0a1e3f] border-white font-mono shadow-md'
                          : 'bg-[#0f2c59] hover:bg-sky-600 text-white border-sky-300'
                      }`}>
                        <span>{idx + 1}</span>
                      </div>
                      <span className="absolute left-1/2 -translate-x-1/2 top-7 whitespace-nowrap bg-[#0a1e3f] text-2xs font-semibold text-white px-2 py-0.5 rounded border border-[#1b3b6f] pointer-events-none opacity-0 group-hover:opacity-100 transition z-30">
                        {item.distrik || item.kapanewon}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Selected Location Info */}
            {selectedGisPoint && (
              <div className="border border-slate-200 bg-slate-50 rounded-lg p-3 sm:p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xs font-bold text-[#0f2c59] bg-[#dde6f2] px-2 py-0.5 rounded border border-[#bfd2e6]">
                      {selectedGisPoint.distrik || selectedGisPoint.kapanewon}
                    </span>
                    <span className="text-2xs text-slate-600 font-semibold uppercase">{selectedGisPoint.field || selectedGisPoint.category || 'Litbang'}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedGisPoint.title}</h4>
                  <p className="text-slate-600 text-xs">Instansi: {selectedGisPoint.leadAgency || selectedGisPoint.opd || 'Pemkab Mimika'} • Status: {selectedGisPoint.status || 'Berjalan'}</p>
                </div>
                <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4 pt-2 sm:pt-0">
                  <span className="text-xs text-slate-500 font-medium block">Alokasi Anggaran</span>
                  <span className="text-base font-bold text-[#0f2c59] font-mono block">
                    Rp {Number(selectedGisPoint.allocatedBudget || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sebaran Isu & Alokasi Anggaran */}
          <div className="lg:col-span-5 space-y-6">
            {/* Sebaran Isu Strategis */}
            <div className="border border-slate-200 bg-white rounded-xl shadow-xs p-4 sm:p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#0f2c59]" />
                  Sebaran Isu Strategis Riset (%)
                </h3>
              </div>

              <div className="space-y-3">
                {researchFields.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-800">{item.label}</span>
                      <span className="font-bold text-[#0f2c59] font-mono">{item.percentage}% ({item.count})</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="bg-[#0f2c59] h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Alokasi Anggaran */}
            <div className="border border-slate-200 bg-white rounded-xl shadow-xs p-4 sm:p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#0f2c59]" />
                  Alokasi Pagu & Sumber Daya Kelitbangan
                </h3>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-600">Total Pagu Indikatif:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    Rp {Number(budget.totalAllocatedBudget || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-600">Realisasi RKA Belanja:</span>
                  <span className="font-bold text-[#0f2c59] font-mono">
                    Rp {Number(budget.totalRkaBudget || 0).toLocaleString('id-ID')} ({budgetRealizationPercent}%)
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-600">Sisa Pagu Tersedia:</span>
                  <span className="font-bold text-emerald-800 font-mono">
                    Rp {Number(budget.remainingBudget || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Top OPDs and Recent Approvals */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Top Active OPDs */}
          <div className="lg:col-span-6 border border-slate-200 bg-white rounded-xl shadow-xs p-4 sm:p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0f2c59]" />
                Instansi Pengusul Paling Aktif
              </h3>
              <span className="text-2xs text-slate-500 uppercase font-semibold">Tahun Anggaran 2026</span>
            </div>

            <div className="divide-y divide-slate-100">
              {topOpds.map((opd, idx) => (
                <div key={opd.id || idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center text-xs font-mono font-bold bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{opd.name}</h4>
                      <span className="text-2xs text-slate-500 font-mono">{opd.code}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-[#f0f4f9] text-[#0f2c59] border border-[#bfd2e6] rounded-md text-xs font-mono font-bold">
                    {opd.proposalCount} Usulan
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Access to Approval Inbox */}
          <div className="lg:col-span-6 border border-slate-200 bg-white rounded-xl shadow-xs p-4 sm:p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-[#0f2c59]" />
                  Aksi Cepat Pengambilan Keputusan
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Terdapat <strong>{kpis.pendingApproval} usulan</strong> yang telah selesai ditelaah oleh tim reviewer teknis BRIDA dan siap diterbitkan Surat Keputusan Pelaksanaan Kajian atau penetapan skema pengadaan.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => router.push('/executive/approvals')}
                className="w-full sm:w-auto flex-1 py-2.5 bg-[#0f2c59] hover:bg-[#0a1e3f] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Buka Lembar Persetujuan Pimpinan</span>
                <ArrowRight className="w-4 h-4 text-sky-300" />
              </button>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // =========================================================================
  // 2. ADMIN BRIDA (OPERATIONAL DASHBOARD)
  // =========================================================================
  if (isAdmin) {
    const queue = adminDashboard?.actionQueue || {
      verificationPending: proposals.filter((p) => p.status === 'PENDING').length,
      scoringPending: proposals.filter((p) => p.status === 'IN_REVIEW').length,
      studiesInPlanning: 0,
      draftRecommendations: 0,
    };

    const stats = adminDashboard?.summaryStats || {
      totalProposals: proposals.length,
      totalStudies: 0,
      totalRecommendations: 0,
      totalUsers: 6,
      totalOpds: 9,
    };

    const recentProposals = adminDashboard?.recentProposals || proposals.slice(0, 5);

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
        
        {/* Operational Header Banner */}
        <div className="border border-slate-200 bg-white rounded-xl shadow-xs p-4 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#0f2c59] text-xs font-bold uppercase tracking-widest">
              <ClipboardList className="w-4 h-4" />
              Pusat Kendali Operasional • Admin Litbang BRIDA Mimika
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              Dashboard Manajemen Usulan & Pelaksanaan Riset
            </h1>
            <p className="text-slate-600 text-xs max-w-3xl leading-relaxed">
              Verifikasi kelengkapan administrasi usulan masuk dari OPD, lakukan scoring pembobotan instrumen riset, pantau penyusunan KAK/RKA, dan siapkan naskah rekomendasi kebijakan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={loadDashboardData}
              disabled={isLoadingDashboard}
              className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingDashboard ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => router.push('/admin/verification')}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#0f2c59] hover:bg-[#0a1e3f] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition border border-[#0f2c59] flex items-center justify-center gap-2 shadow-xs"
            >
              <ClipboardList className="h-4 w-4 text-sky-300" />
              <span>Inbox Verifikasi ({queue.verificationPending})</span>
            </button>
            <button
              onClick={() => router.push('/admin/scoring')}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold uppercase tracking-wider rounded-lg transition border border-slate-300 flex items-center justify-center gap-2"
            >
              <Award className="h-4 w-4 text-[#0f2c59]" />
              <span>Penelaahan Scoring ({queue.scoringPending})</span>
            </button>
          </div>
        </div>

        {/* 4 Action Queue Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => router.push('/admin/verification')}
            className="p-5 border border-slate-200 bg-white rounded-xl shadow-xs hover:border-[#0f2c59] cursor-pointer transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Tahap 1 • Gatekeeper</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-slate-900 font-mono group-hover:text-[#0f2c59] transition">
                {queue.verificationPending}
              </span>
              <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Perlu Verifikasi
              </span>
            </div>
            <p className="text-2xs text-slate-500">Pengecekan KAK & kelengkapan proposal masuk</p>
          </div>

          <div
            onClick={() => router.push('/admin/scoring')}
            className="p-5 border border-slate-200 bg-white rounded-xl shadow-xs hover:border-[#0f2c59] cursor-pointer transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Tahap 2 • Scoring Review</span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-slate-900 font-mono group-hover:text-[#0f2c59] transition">
                {queue.scoringPending}
              </span>
              <span className="text-xs font-semibold text-[#0f2c59] bg-[#f0f4f9] px-2 py-0.5 rounded border border-[#bfd2e6]">
                Siap Discoring
              </span>
            </div>
            <p className="text-2xs text-slate-500">Penilaian pembobotan 4 kriteria riset BRIDA</p>
          </div>

          <div
            onClick={() => router.push('/admin/research')}
            className="p-5 border border-slate-200 bg-white rounded-xl shadow-xs hover:border-[#0f2c59] cursor-pointer transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Tahap 3 • Manajemen Kajian</span>
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-slate-900 font-mono group-hover:text-[#0f2c59] transition">
                {queue.studiesInPlanning}
              </span>
              <span className="text-xs font-semibold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Penyusunan KAK/RKA
              </span>
            </div>
            <p className="text-2xs text-slate-500">Penyusunan RKA & penugasan tim peneliti</p>
          </div>

          <div
            onClick={() => router.push('/admin/recommendation-builder')}
            className="p-5 border border-slate-200 bg-white rounded-xl shadow-xs hover:border-[#0f2c59] cursor-pointer transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Tahap 4 • Naskah Rekomendasi</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-slate-900 font-mono group-hover:text-[#0f2c59] transition">
                {queue.draftRecommendations}
              </span>
              <span className="text-xs font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Draf Policy Brief
              </span>
            </div>
            <p className="text-2xs text-slate-500">Formulasi naskah kebijakan siap TTE</p>
          </div>
        </div>

        {/* Main Content: Recent Proposals & Module Workflow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left 8 Cols: Usulan Masuk Terbaru */}
          <div className="lg:col-span-8 border border-slate-200 bg-white rounded-xl shadow-xs p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#0f2c59]" />
                  Daftar Usulan Masuk Terbaru dari Instansi OPD
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Memerlukan penanganan administrasi, scoring, atau tindak lanjut kajian.</p>
              </div>
              <button
                onClick={() => router.push('/admin/verification')}
                className="text-xs text-[#0f2c59] hover:underline font-semibold uppercase tracking-wider flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Kelola Semua ({stats.totalProposals})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentProposals.map((item: any) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-2xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        {item.code}
                      </span>
                      <span className="text-2xs font-semibold text-[#0f2c59] bg-[#dde6f2] px-2 py-0.5 rounded border border-[#bfd2e6] uppercase">
                        {item.opd?.name || item.opdName || 'Instansi OPD'}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-1">
                      {item.problemStatement}
                    </p>
                  </div>

                  <div className="shrink-0 self-start sm:self-center flex items-center gap-2">
                    {item.status === 'PENDING' ? (
                      <button
                        onClick={() => router.push('/admin/verification')}
                        className="px-3 py-1.5 bg-[#0f2c59] hover:bg-[#0a1e3f] text-white text-xs font-semibold uppercase tracking-wider rounded-lg border border-[#0f2c59] transition flex items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-sky-300" />
                        <span>Verifikasi</span>
                      </button>
                    ) : item.status === 'IN_REVIEW' ? (
                      <button
                        onClick={() => router.push('/admin/scoring')}
                        className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold uppercase tracking-wider rounded-lg border border-sky-700 transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Award className="h-3.5 w-3.5" />
                        <span>Scoring</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => router.push('/admin/research')}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold uppercase tracking-wider rounded-lg border border-slate-300 transition flex items-center gap-1.5"
                      >
                        <Activity className="h-3.5 w-3.5 text-[#0f2c59]" />
                        <span>Kajian</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 4 Cols: Quick Module Navigation & System Stats */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Links */}
            <div className="border border-slate-200 bg-white rounded-xl shadow-xs p-4 sm:p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#0f2c59]" />
                  Akses Cepat Modul Litbang
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <button
                  onClick={() => router.push('/admin/verification')}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left font-medium text-slate-900 flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0f2c59]" />
                    Verifikasi Administrasi Usulan
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => router.push('/admin/scoring')}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left font-medium text-slate-900 flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#0f2c59]" />
                    Penelaahan & Scoring Usulan
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => router.push('/admin/research')}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left font-medium text-slate-900 flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#0f2c59]" />
                    Manajemen KAK, RKA & Tim Peneliti
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => router.push('/admin/recommendation-builder')}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left font-medium text-slate-900 flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0f2c59]" />
                    Penyusunan Naskah Policy Brief
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Master Counts */}
            <div className="border border-slate-200 bg-white rounded-xl shadow-xs p-4 sm:p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#0f2c59]" />
                  Statistik Master SIM-RIDA
                </h3>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-600">Total Instansi OPD Terdaftar:</span>
                  <span className="font-bold text-slate-900 font-mono">{stats.totalOpds} OPD</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-600">Pengguna Aktif:</span>
                  <span className="font-bold text-slate-900 font-mono">{stats.totalUsers} Akun</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-600">Kajian Riset Teregistrasi:</span>
                  <span className="font-bold text-slate-900 font-mono">{stats.totalStudies} Kajian</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-600">Rekomendasi Kebijakan Terbit:</span>
                  <span className="font-bold text-emerald-800 font-mono">{stats.totalRecommendations} Naskah</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    );
  }

  // =========================================================================
  // 3. OPD DASHBOARD (PERANGKAT DAERAH PENGUSUL)
  // =========================================================================
  const opdData = opdDashboard || {
    opdInfo: {
      id: user?.opdId || 'opd-1',
      code: 'OPD-MIMIKA',
      name: user?.name || activeOpdName || 'Perangkat Daerah Kab. Mimika',
      category: 'Pemerintahan',
    },
    kpis: {
      totalProposals: proposals.length,
      draftProposals: proposals.filter((p) => p.status === 'DRAFT').length,
      inVerification: proposals.filter((p) => p.status === 'PENDING').length,
      returnedForRevision: proposals.filter((p) => p.status === 'RETURNED').length,
      inReview: proposals.filter((p) => p.status === 'IN_REVIEW').length,
      scored: proposals.filter((p) => p.status === 'SCORED').length,
      approved: proposals.filter((p) => ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(p.status)).length,
      rejected: proposals.filter((p) => p.status === 'REJECTED').length,
    },
    totalEstimatedBudgetProposed: proposals.reduce((sum, p) => sum + (Number(p.estimatedBudget) || 0), 0),
    proposals: proposals,
    publishedRecommendations: [],
  };

  const opdProposals = (opdDashboard?.proposals && opdDashboard.proposals.length > 0)
    ? opdDashboard.proposals
    : proposals;

  const publishedRecs = opdDashboard?.publishedRecommendations || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* OPD Header Banner */}
      <div className="border border-slate-200 bg-white rounded-xl shadow-xs p-4 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#0f2c59] text-xs font-bold uppercase tracking-widest">
            <Send className="w-4 h-4" />
            Portal Pengajuan & Hasil Riset Daerah • {opdData.opdInfo?.name || activeOpdName}
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Sistem Informasi Usulan Riset & Inovasi Daerah
          </h1>
          <p className="text-slate-600 text-xs max-w-3xl leading-relaxed">
            Ajukan permasalahan kebijakan dan kebutuhan riset teknis instansi Anda kepada BRIDA Kabupaten Mimika untuk dikaji secara ilmiah dan dirumuskan menjadi rekomendasi kebijakan resmi bertanda tangan elektronik (TTE).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
          <button
            onClick={loadDashboardData}
            disabled={isLoadingDashboard}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition"
            title="Perbarui Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingDashboard ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => router.push('/opd/proposals/new')}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#0f2c59] hover:bg-[#0a1e3f] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition border border-[#0f2c59] flex items-center justify-center gap-2 shadow-xs"
          >
            <FilePlus2 className="h-4 w-4 text-sky-300" />
            <span>Tambah Usulan</span>
          </button>
          <button
            onClick={() => router.push('/opd/tracking')}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold uppercase tracking-wider rounded-lg transition border border-slate-300 flex items-center justify-center gap-2"
          >
            <Activity className="h-4 w-4 text-[#0f2c59]" />
            <span>Tracking</span>
          </button>
        </div>
      </div>

      {/* 4 OPD Metrics in Single Grid Container */}
      <div className="border border-slate-200 bg-white rounded-xl shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Usulan</span>
          <span className="text-2xl sm:text-3xl font-bold text-slate-900 block font-mono">{opdData.kpis.totalProposals}</span>
          <span className="text-xs text-slate-600 font-medium block pt-1">{opdData.kpis.draftProposals} tersimpan di draf</span>
        </div>

        <div className="p-4 sm:p-6 space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Proses Verifikasi</span>
          <span className="text-2xl sm:text-3xl font-bold text-amber-800 block font-mono">{opdData.kpis.inVerification}</span>
          <span className="text-xs text-slate-600 font-medium block pt-1">
            {opdData.kpis.returnedForRevision > 0 ? (
              <span className="text-red-700 font-semibold">{opdData.kpis.returnedForRevision} perlu revisi</span>
            ) : (
              'Pengecekan berkas administrasi'
            )}
          </span>
        </div>

        <div className="p-4 sm:p-6 space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Kajian Berjalan</span>
          <span className="text-2xl sm:text-3xl font-bold text-[#0f2c59] block font-mono">
            {opdData.kpis.inReview + opdData.kpis.scored + opdData.kpis.approved}
          </span>
          <span className="text-xs text-slate-600 font-medium block pt-1">Tahap riset & formulasi</span>
        </div>

        <div className="p-4 sm:p-6 space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Estimasi Anggaran Usulan</span>
          <span className="text-xl sm:text-2xl font-bold text-slate-900 block font-mono">
            Rp {(Number(opdData.totalEstimatedBudgetProposed || 0) / 1000000).toFixed(0)} Jt
          </span>
          <span className="text-xs text-slate-600 font-medium block pt-1">Total kebutuhan anggaran OPD</span>
        </div>
      </div>

      {/* Proposal Table & Tracking */}
      <div className="border border-slate-200 bg-white rounded-xl shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#0f2c59]" />
              Daftar Usulan Penelitian Instansi Terkini
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Pantau status persetujuan, telaah teknis, dan kemajuan riset daerah.</p>
          </div>
          <button
            onClick={() => router.push('/opd/tracking')}
            className="text-xs text-[#0f2c59] hover:underline font-semibold uppercase tracking-wider flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Lihat Semua ({opdProposals.length})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {opdProposals.slice(0, 5).map((item: any) => (
            <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-2xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 border border-slate-300 rounded">
                    {item.code}
                  </span>
                  <span className="text-2xs font-semibold text-[#0f2c59] bg-[#dde6f2] px-2 py-0.5 border border-[#bfd2e6] uppercase rounded">
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
                {item.status === 'RETURNED' && (
                  <p className="text-xs text-red-700 bg-red-50 p-2 border border-red-200 font-medium rounded-lg">
                    Catatan Perbaikan: {item.revisions?.[0]?.revisionNotes || item.adminVerification?.verificationNotes || 'Harap lengkapi berkas TOR/KAK.'}
                  </p>
                )}
              </div>

              <div className="shrink-0 self-stretch sm:self-center flex flex-wrap items-center gap-2">
                {item.status === 'DRAFT' && (
                  <button
                    onClick={() => router.push(`/opd/proposals/${item.id}/edit`)}
                    className="flex-1 sm:flex-initial px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <FileEdit className="h-3.5 w-3.5" />
                    <span>Lanjutkan Draf</span>
                  </button>
                )}
                {item.status === 'RETURNED' && (
                  <button
                    onClick={() => router.push(`/opd/proposals/${item.id}/edit`)}
                    className="flex-1 sm:flex-initial px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Revisi Usulan</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    selectProposal(item.id);
                    router.push('/opd/tracking');
                  }}
                  className="flex-1 sm:flex-initial px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold uppercase tracking-wider border border-slate-300 rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  <Activity className="h-3.5 w-3.5 text-[#0f2c59]" />
                  <span>Tracking</span>
                </button>
              </div>
            </div>
          ))}

          {opdProposals.length === 0 && (
            <div className="py-10 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">Belum ada usulan riset yang diajukan oleh instansi Anda.</p>
              <button
                onClick={() => router.push('/opd/proposals/new')}
                className="px-4 py-2 bg-[#0f2c59] text-white text-xs font-semibold uppercase tracking-wider rounded-lg inline-flex items-center gap-2"
              >
                <FilePlus2 className="w-4 h-4" />
                <span>Buat Usulan Baru Sekarang</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Published Policy Recommendations Repository for OPD */}
      {publishedRecs.length > 0 && (
        <div className="border border-slate-200 bg-white rounded-xl shadow-xs p-4 sm:p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-800" />
                Rekomendasi Kebijakan Resmi BRIDA yang Telah Diterbitkan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Dokumen policy brief resmi bertanda tangan digital (TTE) siap ditindaklanjuti dalam Renja / SOP instansi.</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-mono font-bold rounded self-start sm:self-auto">
              {publishedRecs.length} Naskah
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {publishedRecs.map((rec: any) => (
              <div key={rec.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 text-2xs font-bold uppercase font-mono rounded">
                      TERVERIFIKASI TTE BSrE
                    </span>
                    <span className="text-2xs text-slate-500 font-mono">
                      {rec.officialDraftNumber || '001/BRIDA/REC/2026'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{rec.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-1">{rec.executiveSummary}</p>
                </div>

                <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => router.push('/opd/tracking')}
                    className="w-full sm:w-auto px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold uppercase tracking-wider border border-slate-300 rounded-lg transition flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#0f2c59]" />
                    <span>Buka Naskah</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
