'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  PlayCircle,
  CheckCircle,
  AlertTriangle,
  FolderLock,
  Users,
  FileCheck,
  Award,
  ChevronRight,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal, FollowUp } from '@/types/proposals';

export default function KepalaBridaDashboard() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const pList = await proposalService.getProposals();
        const fList = await proposalService.getFollowUps();
        setProposals(pList);
        setFollowUps(fList);
      } catch (err) {
        console.error('Failed to load Kepala BRIDA dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat dasbor eksekutif Kepala BRIDA..." />;
  }

  // Portfolio calculations
  const totalStudies = proposals.filter((p) =>
    ['IN_PROGRESS', 'MONITORING', 'REPORT_SUBMITTED', 'RECOMMENDATION_PENDING', 'RECOMMENDATION_APPROVED', 'COMPLETED'].includes(p.status)
  ).length;

  const activeStudies = proposals.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'MONITORING').length;
  const completedStudies = proposals.filter((p) => p.status === 'RECOMMENDATION_APPROVED' || p.status === 'COMPLETED').length;
  
  // Delayed: active projects with severity HIGH open issues
  const delayedStudies = proposals.filter((p) =>
    (p.status === 'IN_PROGRESS' || p.status === 'MONITORING') &&
    p.issues && p.issues.some((i) => i.severity === 'HIGH' && i.status === 'OPEN')
  ).length;

  // Queues counts
  const selectionQueue = proposals.filter((p) => p.status === 'SELECTION_RECOMMENDED');
  const researcherQueue = proposals.filter((p) => p.status === 'RESEARCHER_APPROVAL');
  const reportQueue = proposals.filter((p) => p.status === 'REPORT_SUBMITTED');
  const recommendationQueue = proposals.filter((p) => p.status === 'RECOMMENDATION_PENDING');

  // Follow-up performance calculations
  const totalRecs = followUps.length;
  const fuCompleted = followUps.filter((f) => f.status === 'COMPLETED').length;
  const fuInProgress = followUps.filter((f) => f.status === 'IN_PROGRESS').length;
  const fuOverdue = followUps.filter((f) => {
    if (f.status === 'COMPLETED') return false;
    if (!f.targetDate) return false;
    return new Date(f.targetDate).getTime() < new Date().getTime();
  }).length;

  // Sector classification counts for simple charts
  const sectorsMap: Record<string, number> = {};
  proposals.forEach((p) => {
    const sector = p.problem.bidang || 'Lain-lain';
    sectorsMap[sector] = (sectorsMap[sector] || 0) + 1;
  });

  const sectorData = Object.entries(sectorsMap).map(([name, value]) => ({ name, value }));

  // OPD classification counts
  const opdMap: Record<string, number> = {};
  proposals.forEach((p) => {
    const opd = p.opdName || 'Lainnya';
    opdMap[opd] = (opdMap[opd] || 0) + 1;
  });
  const opdData = Object.entries(opdMap).slice(0, 5).map(([name, value]) => ({ name, value }));

  // Budget calculations
  const totalBudget = proposals.reduce((acc, p) => acc + (p.kak?.anggaran || 0), 0);
  const activeBudget = proposals
    .filter((p) => ['IN_PROGRESS', 'MONITORING', 'REPORT_SUBMITTED'].includes(p.status))
    .reduce((acc, p) => acc + (p.kak?.anggaran || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Executive Decision Layer
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Monitor portofolio strategis daerah, persetujuan program, penetapan mitra peneliti, dan realisasi rencana aksi tindak lanjut.
        </p>
      </div>

      {/* Row 1: Executive Stats */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Total Portfolio Riset</p>
              <h3 className="text-2xl font-extrabold mt-1">{totalStudies}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-between dark:bg-blue-950/20 dark:text-blue-400">
              <Briefcase className="h-5 w-5 mx-auto" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Penelitian Aktif</p>
              <h3 className="text-2xl font-extrabold text-cyan-650 mt-1">{activeStudies}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-between dark:bg-cyan-950/20 dark:text-cyan-450">
              <PlayCircle className="h-5 w-5 mx-auto" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Kajian Selesai</p>
              <h3 className="text-2xl font-extrabold text-emerald-650 mt-1">{completedStudies}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-650 flex items-center justify-between dark:bg-emerald-950/20 dark:text-emerald-450">
              <CheckCircle className="h-5 w-5 mx-auto" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Kajian Terhambat (High Risk)</p>
              <h3 className="text-2xl font-extrabold text-red-600 mt-1">{delayedStudies}</h3>
            </div>
            <div className={`h-10 w-10 rounded-full flex items-center justify-between ${
              delayedStudies > 0 ? 'bg-red-50 text-red-650 animate-pulse' : 'bg-slate-100 text-slate-400'
            }`}>
              <AlertTriangle className="h-5 w-5 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Approval Queues Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Antrean Persetujuan Kepala BRIDA (Approval Queues)
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {/* Seleksi Queue */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 hover:border-slate-350 transition-all">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <span className="p-1 rounded bg-blue-50 text-blue-750 text-3xs font-bold dark:bg-blue-950/20 dark:text-blue-400">SELEKSI</span>
                <span className="text-xs font-bold font-mono text-slate-655 bg-slate-100 px-2 py-0.5 rounded-full dark:bg-slate-800">
                  {selectionQueue.length}
                </span>
              </div>
              <CardTitle className="text-sm mt-3">Persetujuan Seleksi</CardTitle>
              <CardDescription className="text-3xs">Pengesahan lolos seleksi program daerah.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Link href="/kepala-brida/persetujuan-seleksi">
                <Button size="sm" className="w-full text-3xs h-8 flex items-center justify-center gap-1">
                  <span>Buka Antrean</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Peneliti Queue */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 hover:border-slate-350 transition-all">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <span className="p-1 rounded bg-purple-50 text-purple-750 text-3xs font-bold dark:bg-purple-950/20 dark:text-purple-400">MITRA PENELITI</span>
                <span className="text-xs font-bold font-mono text-slate-655 bg-slate-100 px-2 py-0.5 rounded-full dark:bg-slate-800">
                  {researcherQueue.length}
                </span>
              </div>
              <CardTitle className="text-sm mt-3">Persetujuan Peneliti</CardTitle>
              <CardDescription className="text-3xs">SK penunjukan pakar/universitas pelaksana.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Link href="/kepala-brida/persetujuan-peneliti">
                <Button size="sm" className="w-full text-3xs h-8 flex items-center justify-center gap-1">
                  <span>Buka Antrean</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Laporan Queue */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 hover:border-slate-350 transition-all">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <span className="p-1 rounded bg-emerald-50 text-emerald-750 text-3xs font-bold dark:bg-emerald-950/20 dark:text-emerald-450">LAPORAN AKHIR</span>
                <span className="text-xs font-bold font-mono text-slate-655 bg-slate-100 px-2 py-0.5 rounded-full dark:bg-slate-800">
                  {reportQueue.length}
                </span>
              </div>
              <CardTitle className="text-sm mt-3">Persetujuan Laporan</CardTitle>
              <CardDescription className="text-3xs">Pemeriksaan & pengesahan naskah riset akhir.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Link href="/kepala-brida/persetujuan-laporan">
                <Button size="sm" className="w-full text-3xs h-8 flex items-center justify-center gap-1">
                  <span>Buka Antrean</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Rekomendasi Queue */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 hover:border-slate-350 transition-all">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <span className="p-1 rounded bg-teal-50 text-teal-750 text-3xs font-bold dark:bg-teal-950/20 dark:text-teal-400">REKOMENDASI BUPATI</span>
                <span className="text-xs font-bold font-mono text-slate-655 bg-slate-100 px-2 py-0.5 rounded-full dark:bg-slate-800">
                  {recommendationQueue.length}
                </span>
              </div>
              <CardTitle className="text-sm mt-3">TTD SK Rekomendasi</CardTitle>
              <CardDescription className="text-3xs">Tanda tangan SK rekomendasi aksi kebijakan.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Link href="/kepala-brida/persetujuan-rekomendasi">
                <Button size="sm" className="w-full text-3xs h-8 flex items-center justify-center gap-1">
                  <span>Buka Antrean</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Row 3: Strategic Visuals (Charts) */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Research by Sector */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 p-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Distribusi Portofolio Berdasarkan Sektor Kajian
          </h3>
          <div className="space-y-4">
            {sectorData.map((item, idx) => {
              const pct = Math.round((item.value / proposals.length) * 100);
              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between text-2xs font-semibold">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                    <span>{item.value} Kajian ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Budget overview & follow-up performance */}
        <div className="space-y-6">
          {/* Budget Info */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Rekapitulasi Anggaran Pagu Daerah (APBD)
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-850 text-xs">
                <span className="text-slate-450 font-bold uppercase text-[9px] flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-slate-400" />
                  <span>Total Anggaran Diajukan</span>
                </span>
                <p className="text-base font-mono font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                  Rp {totalBudget.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-850 text-xs">
                <span className="text-slate-450 font-bold uppercase text-[9px] flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-cyan-500" />
                  <span>Anggaran Proyek Aktif</span>
                </span>
                <p className="text-base font-mono font-extrabold text-cyan-600 dark:text-cyan-400 mt-1">
                  Rp {activeBudget.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </Card>

          {/* Follow-up Performance */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Kinerja Tindak Lanjut Rekomendasi OPD
            </h3>
            
            <div className="grid gap-4 grid-cols-2 text-center text-xs">
              <div className="p-2 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-850">
                <span className="text-[10px] text-slate-450 font-bold uppercase">Selesai Realisasi</span>
                <p className="text-xl font-bold mt-1 text-emerald-650">{fuCompleted} / {totalRecs}</p>
              </div>

              <div className="p-2 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-850">
                <span className="text-[10px] text-slate-450 font-bold uppercase">Terlambat Tindak Lanjut</span>
                <p className={`text-xl font-bold mt-1 ${fuOverdue > 0 ? 'text-red-600 animate-pulse font-extrabold' : 'text-slate-655'}`}>
                  {fuOverdue}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
