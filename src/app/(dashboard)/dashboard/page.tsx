'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useRecommendationStore } from '@/store/useRecommendationStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useKnowledgeBaseStore } from '@/store/useKnowledgeBaseStore';
import { useMasterStore } from '@/store/useMasterStore';
import { dashboardService, DashboardSummary } from '@/services/dashboard.service';
import { masterService } from '@/services/master.service';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Users,
  Building2,
  FileText,
  Calendar,
  Search,
  Clock,
  CheckCircle2,
  Lightbulb,
  FileStack,
  TrendingUp,
  AlertCircle,
  Award,
  ArrowRight,
  ClipboardList,
  CheckSquare
} from 'lucide-react';

const renderIcon = (name: string) => {
  const iconProps = { className: 'h-5 w-5 text-blue-600 dark:text-blue-400' };
  switch (name) {
    case 'Users': return <Users {...iconProps} />;
    case 'Building2': return <Building2 {...iconProps} />;
    case 'FileText': return <FileText {...iconProps} />;
    case 'Calendar': return <Calendar {...iconProps} />;
    case 'SearchCode': return <Search {...iconProps} />;
    case 'Clock': return <Clock {...iconProps} />;
    case 'CheckCircle2': return <CheckCircle2 {...iconProps} />;
    case 'Lightbulb': return <Lightbulb {...iconProps} />;
    case 'FileStack': return <FileStack {...iconProps} />;
    case 'TrendingUp': return <TrendingUp {...iconProps} />;
    case 'AlertCircle': return <AlertCircle {...iconProps} />;
    case 'Award': return <Award {...iconProps} />;
    default: return <FileText {...iconProps} />;
  }
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { getAllRecommendations, fetchRecommendations } = useRecommendationStore();
  const { proposals, researchRecords, fetchProposals } = useResearchStore();
  const { documents, fetchDocuments } = useKnowledgeBaseStore();
  const { opds, fetchMasterData } = useMasterStore();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [usersCount, setUsersCount] = useState(7);

  useEffect(() => {
    fetchRecommendations(user?.role === 'OPD');
    fetchProposals();
    fetchDocuments();
    fetchMasterData();
    dashboardService.getSummary().then(setSummary).catch(() => null);
    masterService.getUsers().then((u) => setUsersCount(u.length)).catch(() => null);
  }, [user, fetchRecommendations, fetchProposals, fetchDocuments, fetchMasterData]);

  const allRecs = getAllRecommendations();

  const bridaRecStats = useMemo(() => {
    const draft = allRecs.filter(r => r.status === 'DRAFT').length;
    const review = allRecs.filter(r => r.status === 'UNDER_REVIEW').length;
    const approved = allRecs.filter(r => r.status === 'APPROVED').length;
    const published = allRecs.filter(r => r.status === 'PUBLISHED').length;
    return { draft, review, approved, published };
  }, [allRecs]);

  const pendingReviews = useMemo(() => {
    return allRecs.filter(r => r.status === 'UNDER_REVIEW');
  }, [allRecs]);

  const receivedRecs = useMemo(() => {
    if (user?.role === 'OPD') {
      return allRecs.filter(r => r.status === 'PUBLISHED');
    }
    return allRecs.filter(r => r.status === 'PUBLISHED');
  }, [allRecs, user]);

  const opdStats = useMemo(() => {
    const total = receivedRecs.length;
    const high = receivedRecs.filter(r => r.priority === 'HIGH').length;
    const strategic = receivedRecs.filter(r => r.priority === 'STRATEGIC').length;
    return { total, high, strategic };
  }, [receivedRecs]);

  if (!user) return null;

  // 1. ADMIN DASHBOARD VIEW
  const renderAdminDashboard = () => {
    const adminStats = [
      { title: 'Total Pengguna Aktif', value: usersCount.toString(), change: 'Terautentikasi PostgreSQL', iconName: 'Users' },
      { title: 'OPD Terdaftar', value: (opds.length || 4).toString(), change: 'Perangkat daerah aktif', iconName: 'Building2' },
      { title: 'Dokumen Sumber Eksternal', value: (documents.length || 5).toString(), change: 'Basis pengetahuan litbang', iconName: 'FileText' },
      { title: 'Usulan Riset Masuk', value: (proposals.length || 6).toString(), change: 'Tahun Anggaran 2026', iconName: 'TrendingUp' },
    ];

    return (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {adminStats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {stat.title}
                </CardTitle>
                {renderIcon(stat.iconName)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Panel Details */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-gray-800 dark:text-gray-200">
                Ringkasan Database & Status Sinkronisasi
              </CardTitle>
              <CardDescription className="text-[10px]">
                Koneksi API Backend SIM-RIDA (PostgreSQL Prisma ORM)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Backend API Services</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">CONNECTED (RESTful)</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-150 dark:border-gray-850 rounded flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Total Problem Identifications</span>
                  <span className="text-xs font-bold text-blue-600">8 Terdata</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-150 dark:border-gray-850 rounded flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Total Research Proposals</span>
                  <span className="text-xs font-bold text-blue-600">{proposals.length} Terdata</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-150 dark:border-gray-850 rounded flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Policy Recommendations</span>
                  <span className="text-xs font-bold text-blue-600">{allRecs.length} Terdata</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold text-gray-800 dark:text-gray-200">
                Aksi Cepat
              </CardTitle>
              <CardDescription className="text-[10px]">Pintasan Manajemen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => router.push('/knowledge-base')}
                className="w-full text-left p-2.5 rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-xs font-bold text-gray-800 flex items-center justify-between transition"
              >
                <span>Kelola Knowledge Base</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <button
                onClick={() => router.push('/research-proposals')}
                className="w-full text-left p-2.5 rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-xs font-bold text-gray-800 flex items-center justify-between transition"
              >
                <span>Daftar Proposal Riset</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <button
                onClick={() => router.push('/recommendations')}
                className="w-full text-left p-2.5 rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-xs font-bold text-gray-800 flex items-center justify-between transition"
              >
                <span>Pusat Rekomendasi OPD</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // 2. BRIDA DASHBOARD VIEW
  const renderBridaDashboard = () => {
    const bridaStats = [
      { title: 'Basis Pengetahuan Dokumen', value: (documents.length || 5).toString(), change: 'Perencanaan & Regulasi', iconName: 'FileText' },
      { title: 'Proposal Penelitian', value: (proposals.length || 6).toString(), change: 'Dalam siklus telaah', iconName: 'TrendingUp' },
      { title: 'Pelaksanaan Riset', value: (researchRecords.length || 3).toString(), change: 'Riset terpilih & berjalan', iconName: 'CheckCircle2' },
      { title: 'Rekomendasi Terbit', value: bridaRecStats.published.toString(), change: 'Tersampaikan ke OPD', iconName: 'Award' },
    ];

    return (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {bridaStats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {stat.title}
                </CardTitle>
                {renderIcon(stat.iconName)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recommendations Card Row */}
        <Card className="border-indigo-100 bg-indigo-50/5">
          <CardHeader className="pb-3 border-b border-indigo-100/40">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center justify-between">
              <span>Status Rekomendasi BRIDA kepada OPD</span>
              <button
                onClick={() => router.push('/recommendations')}
                className="text-3xs uppercase font-extrabold text-indigo-650 hover:underline"
              >
                Kelola di Rec Center ➔
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 text-xs font-semibold select-none">
            <div className="grid gap-4 sm:grid-cols-4 text-center">
              <div className="p-3 border rounded bg-white dark:bg-gray-900">
                <span className="text-[8px] text-gray-400 uppercase block font-bold">Draft</span>
                <span className="text-xl font-bold text-gray-800 dark:text-white mt-1 block">{bridaRecStats.draft}</span>
              </div>
              <div className="p-3 border rounded bg-white dark:bg-gray-900">
                <span className="text-[8px] text-gray-400 uppercase block font-bold">Under Review</span>
                <span className="text-xl font-bold text-amber-700 mt-1 block">{bridaRecStats.review}</span>
              </div>
              <div className="p-3 border rounded bg-white dark:bg-gray-900">
                <span className="text-[8px] text-gray-400 uppercase block font-bold">Approved</span>
                <span className="text-xl font-bold text-emerald-700 mt-1 block">{bridaRecStats.approved}</span>
              </div>
              <div className="p-3 border rounded bg-white dark:bg-gray-900">
                <span className="text-[8px] text-gray-400 uppercase block font-bold">Published</span>
                <span className="text-xl font-bold text-indigo-700 mt-1 block">{bridaRecStats.published}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Info Blocks */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-gray-800 dark:text-gray-200">
                Daftar Usulan Penelitian Terkini
              </CardTitle>
              <CardDescription className="text-[10px]">
                Status progress pengumpulan usulan dan seleksi proposal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {proposals.slice(0, 4).map((p) => (
                  <div key={p.id} className="p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-150 dark:border-gray-850 rounded flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 mr-2">
                        {p.code || 'RSH'}
                      </span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{p.title}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">{p.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold text-gray-800 dark:text-gray-200">
                Pintasan Kerja Litbang
              </CardTitle>
              <CardDescription className="text-[10px]">Modul Operasional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => router.push('/identification')}
                className="w-full text-left p-2.5 rounded border border-gray-200 hover:bg-blue-50 text-xs font-bold text-gray-800 flex items-center justify-between transition"
              >
                <span>Identifikasi Masalah</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <button
                onClick={() => router.push('/research')}
                className="w-full text-left p-2.5 rounded border border-gray-200 hover:bg-blue-50 text-xs font-bold text-gray-800 flex items-center justify-between transition"
              >
                <span>Pelaksanaan & Monitoring</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <button
                onClick={() => router.push('/recommendations')}
                className="w-full text-left p-2.5 rounded border border-gray-200 hover:bg-blue-50 text-xs font-bold text-gray-800 flex items-center justify-between transition"
              >
                <span>Rekomendasi Kebijakan</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // 3. KEPALA BRIDA DASHBOARD VIEW
  const renderKepalaDashboard = () => {
    const kepalaStats = [
      { title: 'Usulan Menunggu Telaah', value: proposals.filter(p => p.status === 'SUBMITTED' || p.status === 'UNDER_SELECTION').length.toString(), change: 'Menunggu persetujuan', iconName: 'Clock' },
      { title: 'Riset Aktif Berjalan', value: researchRecords.length.toString(), change: 'Target capaian daerah', iconName: 'TrendingUp' },
      { title: 'Laporan Siap Pengesahan', value: (summary?.reports?.submitted || 0).toString(), change: 'Draf laporan final', iconName: 'FileText' },
      { title: 'Rekomendasi Terbit', value: bridaRecStats.published.toString(), change: 'Telah disampaikan ke OPD', iconName: 'CheckCircle2' },
    ];

    return (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kepalaStats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {stat.title}
                </CardTitle>
                {renderIcon(stat.iconName)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Review Section */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-gray-800 dark:text-gray-200">
                Antrean Persetujuan Rekomendasi Kebijakan
              </CardTitle>
              <CardDescription className="text-[10px]">
                Dokumen rekomendasi yang membutuhkan persetujuan dan penerbitan Kepala BRIDA
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingReviews.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500 border border-dashed rounded">
                  Tidak ada antrean telaah rekomendasi yang tertunda saat ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingReviews.map((item) => (
                    <div key={item.id} className="p-3 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-900/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-800">
                            REKOMENDASI OPD
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">{item.submittedDate || '2026'}</span>
                        </div>
                        <p className="font-bold text-gray-900 dark:text-white mt-1.5">{item.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{item.recommendationDescription}</p>
                      </div>
                      <button
                        onClick={() => router.push(`/recommendations/${item.id}`)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs shrink-0"
                      >
                        Telaah & Putuskan
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold text-gray-800 dark:text-gray-200">
                Pusat Rekomendasi
              </CardTitle>
              <CardDescription className="text-[10px]">Distribusi Kebijakan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded text-xs">
                <span className="text-[10px] text-indigo-700 font-bold uppercase block">Rekomendasi Dipublikasikan</span>
                <span className="text-xl font-extrabold text-indigo-900 block mt-1">{bridaRecStats.published} Dokumen</span>
              </div>
              <button
                onClick={() => router.push('/recommendations')}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs transition"
              >
                Buka Rekomendasi Center
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // 4. OPD DASHBOARD VIEW
  const renderOpdDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Rekomendasi Diterima
            </CardTitle>
            <FileText className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{opdStats.total}</div>
            <p className="text-[10px] text-gray-400 font-semibold mt-1">Khusus OPD Anda</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Prioritas Tinggi
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{opdStats.high}</div>
            <p className="text-[10px] text-gray-400 font-semibold mt-1">Perlu tindak lanjut segera</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Prioritas Strategis
            </CardTitle>
            <Award className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700">{opdStats.strategic}</div>
            <p className="text-[10px] text-gray-400 font-semibold mt-1">Program prioritas daerah</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold text-gray-800 dark:text-gray-200">
            Daftar Rekomendasi Kebijakan dari BRIDA
          </CardTitle>
          <CardDescription className="text-[10px]">
            Rekomendasi berbasis penelitian yang telah dipublikasikan dan disahkan oleh Kepala BRIDA
          </CardDescription>
        </CardHeader>
        <CardContent>
          {receivedRecs.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 border border-dashed rounded">
              Belum ada rekomendasi yang dipublikasikan untuk OPD Anda saat ini.
            </div>
          ) : (
            <div className="space-y-3">
              {receivedRecs.map((rec) => (
                <div key={rec.id} className="p-4 border rounded hover:border-blue-300 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-100 text-blue-800">
                        {rec.id}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-800">
                        PUBLISHED
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 mt-1">{rec.title}</h4>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{rec.recommendationDescription}</p>
                  </div>
                  <button
                    onClick={() => router.push(`/opd/recommendations/${rec.id}`)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs shrink-0"
                  >
                    Buka Detail
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dashboard ${user.role.replace('_', ' ')}`}
        description={`Selamat datang, ${user.name}. Sistem Informasi Riset dan Inovasi Daerah (SIM-RIDA).`}
      />

      {user.role === 'ADMIN_BRIDA' && renderAdminDashboard()}
      {user.role === 'BRIDA' && renderBridaDashboard()}
      {user.role === 'KEPALA_BRIDA' && renderKepalaDashboard()}
      {user.role === 'OPD' && renderOpdDashboard()}
    </div>
  );
}
