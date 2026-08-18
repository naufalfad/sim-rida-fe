'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  ShieldCheck,
  Eye,
  FolderLock,
  PlayCircle,
  FileCheck,
  FileBadge,
  Award,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function BridaDashboard() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const list = await proposalService.getProposals();
        setProposals(list);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat ringkasan dashboard BRIDA..." />;
  }

  // Calculate dynamic stats
  const totalCount = proposals.length;
  const verifCount = proposals.filter((p) => p.status === 'SUBMITTED').length;
  const reviewCount = proposals.filter((p) => p.status === 'ADMINISTRATIVE_REVIEW' || p.status === 'SUBSTANTIVE_REVIEW').length;
  const seleksiCount = proposals.filter((p) => p.status === 'SCORING' || p.status === 'SELECTION_RECOMMENDED').length;
  const activeCount = proposals.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'MONITORING').length;
  const reportCount = proposals.filter((p) => p.status === 'REPORT_SUBMITTED').length;
  const briefCount = proposals.filter((p) => p.status === 'RECOMMENDATION_APPROVED' || p.status === 'COMPLETED').length;
  const recoCount = proposals.filter((p) => p.status === 'RECOMMENDATION_APPROVED').length;

  // Let's assume some mock overdue items (e.g. active projects over 80% with open issues, or pending verification > 7 days old)
  const overdueItems = proposals.filter((p) => {
    if (p.status === 'SUBMITTED' && new Date(p.createdAt).getTime() < new Date('2026-08-12').getTime()) {
      return true;
    }
    if (p.status === 'IN_PROGRESS' && p.issues && p.issues.some((i) => i.severity === 'HIGH' && i.status === 'OPEN')) {
      return true;
    }
    return false;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Dashboard Operasional BRIDA
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Kelola verifikasi, penilaian, seleksi prioritas, penetapan mitra, dan pemantauan tindak lanjut rekomendasi.
        </p>
      </div>

      {/* Overdue alert banner */}
      {overdueItems.length > 0 && (
        <Card className="border-red-200 bg-red-50/20 dark:border-red-900/30 dark:bg-red-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-red-800 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span>Peringatan Overdue Items ({overdueItems.length})</span>
            </CardTitle>
            <CardDescription className="text-xs text-red-700/80 dark:text-red-550/80">
              Beberapa proyek mengalami hambatan kritis atau antrean usulan tertunda melebihi batas waktu tanggap.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg bg-white border border-red-100 dark:bg-slate-900 dark:border-slate-800 gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-red-650 dark:text-red-400">
                      {item.id}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-sm sm:max-w-md mt-1">
                    {item.title}
                  </p>
                  <p className="text-3xs text-slate-500">
                    {item.status === 'SUBMITTED'
                      ? 'Usulan belum diferifikasi sejak diajukan.'
                      : 'Memiliki kendala isu berstatus kritis (HIGH severity).'}
                  </p>
                </div>
                <Link href={item.status === 'SUBMITTED' ? `/brida/verifikasi/${item.id}` : `/brida/monitoring/${item.id}`}>
                  <Button variant="outline" size="sm" className="h-8 text-2xs flex items-center gap-1 border-red-200 hover:bg-red-50 text-red-700">
                    <span>Tindak Lanjut</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Operational Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Total Usulan</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold">{totalCount}</span>
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Menunggu Verifikasi</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold text-amber-600">{verifCount}</span>
              <ShieldCheck className="h-4 w-4 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Menunggu Review</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold text-sky-600">{reviewCount}</span>
              <Eye className="h-4 w-4 text-sky-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Menunggu Seleksi</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold text-purple-650">{seleksiCount}</span>
              <FolderLock className="h-4 w-4 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Riset Berjalan</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold text-indigo-600">{activeCount}</span>
              <PlayCircle className="h-4 w-4 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Laporan Direview</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold text-emerald-600">{reportCount}</span>
              <FileCheck className="h-4 w-4 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Policy Brief</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold text-cyan-600">{briefCount}</span>
              <FileBadge className="h-4 w-4 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Rekomendasi</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold text-teal-600">{recoCount}</span>
              <Award className="h-4 w-4 text-teal-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Verification & Scoring queues */}
        <div className="md:col-span-2 space-y-6">
          {/* Verification queue card */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base">Antrean Verifikasi Administrasi</CardTitle>
                <CardDescription>Usulan KAK baru yang diajukan oleh OPD.</CardDescription>
              </div>
              <Link href="/brida/verifikasi" className="text-xs text-blue-650 dark:text-blue-450 hover:underline flex items-center gap-1 font-semibold">
                <span>Kelola Semua</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                      <th className="py-2 font-semibold">ID</th>
                      <th className="py-2 px-3 font-semibold">Tema Kajian / Pengusul</th>
                      <th className="py-2 text-right font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {proposals.filter((p) => p.status === 'SUBMITTED').length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-slate-400">Semua usulan baru sudah terverifikasi.</td>
                      </tr>
                    ) : (
                      proposals
                        .filter((p) => p.status === 'SUBMITTED')
                        .slice(0, 3)
                        .map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all">
                            <td className="py-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                              {p.id}
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{p.title}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{p.opdName}</p>
                            </td>
                            <td className="py-3 text-right">
                              <Link href={`/brida/verifikasi/${p.id}`}>
                                <Button size="sm" variant="outline" className="h-7 text-3xs">
                                  Verifikasi
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Substantive review queue */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base">Antrean Penilaian & Review</CardTitle>
                <CardDescription>Studi kelayakan yang siap dilakukan scoring penilaian.</CardDescription>
              </div>
              <Link href="/brida/review" className="text-xs text-blue-650 dark:text-blue-450 hover:underline flex items-center gap-1 font-semibold">
                <span>Buka Antrean</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                      <th className="py-2 font-semibold">ID</th>
                      <th className="py-2 px-3 font-semibold">Tema Kajian / Bidang</th>
                      <th className="py-2 text-right font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {proposals.filter((p) => p.status === 'ADMINISTRATIVE_REVIEW' || p.status === 'SUBSTANTIVE_REVIEW').length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-slate-400">Tidak ada kajian menanti penilaian.</td>
                      </tr>
                    ) : (
                      proposals
                        .filter((p) => p.status === 'ADMINISTRATIVE_REVIEW' || p.status === 'SUBSTANTIVE_REVIEW')
                        .slice(0, 3)
                        .map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all">
                            <td className="py-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                              {p.id}
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{p.title}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{p.problem.bidang}</p>
                            </td>
                            <td className="py-3 text-right">
                              <Link href={`/brida/review/${p.id}`}>
                                <Button size="sm" variant="outline" className="h-7 text-3xs">
                                  Beri Nilai
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monitoring & Alerts */}
        <div className="space-y-6">
          {/* Active Research Progress */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Riset Berjalan</h3>
              <Link href="/brida/monitoring" className="text-xs text-blue-650 hover:underline font-semibold">
                Monitor
              </Link>
            </div>
            <div className="space-y-4">
              {proposals.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'MONITORING').length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Belum ada riset berjalan.</p>
              ) : (
                proposals
                  .filter((p) => p.status === 'IN_PROGRESS' || p.status === 'MONITORING')
                  .slice(0, 3)
                  .map((p) => (
                    <div key={p.id} className="space-y-1">
                      <div className="flex justify-between text-2xs font-semibold">
                        <span className="truncate max-w-[160px] text-slate-850 dark:text-slate-200 font-bold">
                          {p.title}
                        </span>
                        <span>{p.progress}%</span>
                      </div>
                      <ProgressIndicator value={p.progress} size="sm" />
                      <p className="text-[10px] text-slate-400">Pakar: {p.researcherName}</p>
                    </div>
                  ))
              )}
            </div>
          </Card>

          {/* Reports Review Queue */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Review Laporan Akhir</h3>
              <Link href="/brida/laporan" className="text-xs text-blue-650 hover:underline font-semibold">
                Periksa
              </Link>
            </div>
            <div className="space-y-3">
              {proposals.filter((p) => p.status === 'REPORT_SUBMITTED').length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Tidak ada laporan akhir diajukan.</p>
              ) : (
                proposals
                  .filter((p) => p.status === 'REPORT_SUBMITTED')
                  .map((p) => (
                    <div
                      key={p.id}
                      className="p-3 border rounded-lg bg-slate-50/50 border-slate-200 dark:bg-slate-950/20 dark:border-slate-800 text-xs space-y-2"
                    >
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-blue-650 dark:text-blue-400">{p.id}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
                          PENDING
                        </span>
                      </div>
                      <p className="font-bold text-slate-850 dark:text-slate-200 line-clamp-1">
                        {p.title}
                      </p>
                      <p className="text-[10px] text-slate-450">Pakar: {p.researcherName}</p>
                      <Link href={`/brida/laporan/${p.id}`}>
                        <Button size="sm" variant="outline" className="w-full h-7 text-3xs mt-1">
                          Evaluasi Hasil Laporan
                        </Button>
                      </Link>
                    </div>
                  ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
