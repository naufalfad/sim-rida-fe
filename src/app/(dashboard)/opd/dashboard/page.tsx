'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  PlusCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCheck,
  AlertTriangle,
  PlayCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal, FollowUp } from '@/types/proposals';

export default function OpdDashboard() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const pList = await proposalService.getProposals();
        const fList = await proposalService.getFollowUps();
        setProposals(pList);
        setFollowUps(fList);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat ringkasan dashboard OPD..." />;
  }

  // Calculate dynamic dashboard stats
  const totalProposals = proposals.length;
  const draftCount = proposals.filter((p) => p.status === 'DRAFT').length;
  const reviewCount = proposals.filter(
    (p) =>
      p.status === 'SUBMITTED' ||
      p.status === 'ADMINISTRATIVE_REVIEW' ||
      p.status === 'SUBSTANTIVE_REVIEW' ||
      p.status === 'SCORING' ||
      p.status === 'SELECTION_RECOMMENDED'
  ).length;
  const approvedCount = proposals.filter(
    (p) => p.status === 'APPROVED' || p.status === 'EKATALOG_SENT'
  ).length;
  const inProgressCount = proposals.filter((p) => p.status === 'OPD_IMPLEMENTING').length;
  const recommendationCount = proposals.filter((p) => p.status === 'RECOMMENDATION_APPROVED').length;
  const followUpCount = followUps.filter((f) => f.status === 'IN_PROGRESS' || f.status === 'PENDING').length;

  // Actions requiring attention:
  // 1. Draft proposals (needs KAK and Submission)
  // 2. Pending follow-ups
  const attentionItems = [
    ...proposals
      .filter((p) => p.status === 'DRAFT')
      .map((p) => ({
        id: p.id,
        type: 'draft',
        title: p.title,
        message: 'Proposal masih dalam draf. Lengkapi KAK dan lakukan pengajuan.',
        link: `/opd/usulan/${p.id}`,
      })),
    ...followUps
      .filter((f) => f.status === 'PENDING')
      .map((f) => ({
        id: f.id,
        type: 'followup',
        title: f.title,
        message: 'Rekomendasi disetujui. Susun rencana aksi tindak lanjut OPD.',
        link: `/opd/tindak-lanjut/${f.id}`,
      })),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard SIM-RIDA</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Kanal pemantauan siklus riset dan rencana aksi tindak lanjut OPD Anda.
          </p>
        </div>
        <Link href="/opd/usulan/new">
          <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750">
            <PlusCircle className="h-4 w-4" />
            <span>Buat Usulan Baru</span>
          </Button>
        </Link>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Usulan Masuk</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold">{totalProposals}</span>
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Draf Usulan</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold">{draftCount}</span>
              <span className="h-2 w-2 rounded-full bg-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Sedang Direview</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold">{reviewCount}</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Lolos Seleksi</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold">{approvedCount}</span>
              <FileCheck className="h-4 w-4 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Riset Berjalan</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold">{inProgressCount}</span>
              <PlayCircle className="h-4 w-4 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Rekomendasi</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold">{recommendationCount}</span>
              <CheckCircle2 className="h-4 w-4 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Tindak Lanjut</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold">{followUpCount}</span>
              <TrendingUp className="h-4 w-4 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Usulan Status & Action Attention Card */}
        <div className="md:col-span-2 space-y-6">
          {/* Action Alerts block */}
          {attentionItems.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/20 dark:border-amber-900/30 dark:bg-amber-950/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>Aktivitas Butuh Perhatian</span>
                </CardTitle>
                <CardDescription className="text-xs text-amber-700/80 dark:text-amber-500/80">
                  Beberapa usulan atau rekomendasi memerlukan tindakan administratif secepatnya.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {attentionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg bg-white border border-amber-100 dark:bg-slate-900 dark:border-slate-800 gap-3"
                  >
                    <div>
                      <p className="text-xs font-semibold font-mono text-blue-650 dark:text-blue-400">
                        {item.id}
                      </p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-sm mt-0.5">
                        {item.title}
                      </p>
                      <p className="text-2xs text-slate-500">{item.message}</p>
                    </div>
                    <Link href={item.link}>
                      <Button variant="outline" size="sm" className="h-8 text-2xs flex items-center gap-1">
                        <span>Buka</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Proposals List Card */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base">Daftar Usulan Terakhir</CardTitle>
                <CardDescription>Status usulan riset daerah Anda.</CardDescription>
              </div>
              <Link href="/opd/usulan" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold">
                <span>Semua Usulan</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 font-medium">
                      <th className="py-2.5 font-semibold">ID</th>
                      <th className="py-2.5 px-3 font-semibold">Tema Penelitian</th>
                      <th className="py-2.5 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {proposals.slice(0, 4).map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all">
                        <td className="py-3 font-mono font-semibold text-xs text-blue-650 dark:text-blue-400">
                          <Link href={`/opd/usulan/${p.id}`} className="hover:underline">
                            {p.id}
                          </Link>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-sm">
                          <Link href={`/opd/usulan/${p.id}`} className="hover:underline">
                            {p.title}
                          </Link>
                        </td>
                        <td className="py-3 text-right">
                          <StatusBadge status={p.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Penelitian & Rekomendasi Tindak Lanjut */}
        <div className="space-y-6">
          {/* Active Research Progress */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Progress Penelitian Aktif</CardTitle>
              <CardDescription className="text-xs">Penelitian yang sedang berjalan oleh mitra.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {proposals.filter((p) => p.status === 'OPD_IMPLEMENTING' || p.status === 'OPD_REPORTED').length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Belum ada riset berjalan.</p>
              ) : (
                proposals
                  .filter((p) => p.status === 'OPD_IMPLEMENTING' || p.status === 'OPD_REPORTED')
                  .map((p) => (
                    <div key={p.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="truncate max-w-[180px] text-slate-800 dark:text-slate-200">
                          {p.title}
                        </span>
                        <span>{p.progress}%</span>
                      </div>
                      <ProgressIndicator value={p.progress} size="sm" variant={p.progress === 100 ? 'success' : 'primary'} />
                    </div>
                  ))
              )}
            </CardContent>
          </Card>

          {/* Action Plan Follow Ups card */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-bold">Rencana Aksi Tindak Lanjut</CardTitle>
                <CardDescription className="text-xs">Realisasi rekomendasi kajian.</CardDescription>
              </div>
              <Link href="/opd/tindak-lanjut" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                Semua
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {followUps.slice(0, 3).map((f) => (
                <div
                  key={f.id}
                  className="p-3 border rounded-lg bg-slate-50/50 border-slate-200 dark:bg-slate-950/20 dark:border-slate-800 text-xs space-y-2"
                >
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-blue-650 dark:text-blue-400">{f.id}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        f.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : f.status === 'IN_PROGRESS'
                          ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-450'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400'
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {f.title}
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>Progres Realisasi</span>
                      <span>{f.progress}%</span>
                    </div>
                    <ProgressIndicator value={f.progress} size="sm" variant={f.status === 'COMPLETED' ? 'success' : 'primary'} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
