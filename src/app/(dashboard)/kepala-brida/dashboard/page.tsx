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

      {/* Executive Monitoring Pipeline */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center border-b pb-3 dark:border-slate-850">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Pipeline Pemantauan Rencana Aksi Eksekutif
            </h3>
            <p className="text-3xs text-slate-500 mt-0.5">
              Alur status penyelesaian tindak lanjut rekomendasi Bupati (REC) secara real-time oleh dinas/OPD pelaksana.
            </p>
          </div>
          <span className="text-[10px] bg-blue-50 text-blue-750 px-2.5 py-1 rounded-full font-bold dark:bg-blue-950/20 dark:text-blue-400">
            Completion Rate: {totalRecs > 0 ? Math.round((fuCompleted / totalRecs) * 100) : 0}%
          </span>
        </div>

        {followUps.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-6 text-center">Belum ada rekomendasi aktif yang diterbitkan.</p>
        ) : (
          <div className="space-y-6 pt-2">
            {followUps.map((fu) => {
              const isOverdue = fu.status !== 'COMPLETED' && fu.targetDate && new Date(fu.targetDate).getTime() < new Date().getTime();
              
              return (
                <div key={fu.id} className="p-4 border rounded-xl bg-slate-50/30 border-slate-200 dark:bg-slate-955 dark:border-slate-850 space-y-4">
                  {/* Stepper progress representation */}
                  <div className="grid gap-2 grid-cols-5 text-center text-[10px] text-slate-500 font-bold relative">
                    
                    {/* Step 1: Recommendation */}
                    <div className="space-y-1 relative">
                      <span className="h-6 w-6 rounded-full bg-teal-500 text-white flex items-center justify-between mx-auto font-mono text-[10px] font-bold">1</span>
                      <p className="truncate max-w-[90px] mx-auto text-slate-800 dark:text-slate-205 mt-1 font-semibold">{fu.id}</p>
                      <span className="text-[8px] text-slate-400 block font-normal">Rekomendasi Terbit</span>
                    </div>

                    {/* Step 2: OPD */}
                    <div className="space-y-1 relative">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-between mx-auto font-mono text-[10px] font-bold ${
                        ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(fu.status) ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-450 dark:bg-slate-800'
                      }`}>2</span>
                      <p className="truncate max-w-[90px] mx-auto text-slate-800 dark:text-slate-205 mt-1 font-semibold">{fu.opdName.substring(0, 15)}...</p>
                      <span className="text-[8px] text-slate-400 block font-normal">Diterima OPD</span>
                    </div>

                    {/* Step 3: Action Plan */}
                    <div className="space-y-1 relative">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-between mx-auto font-mono text-[10px] font-bold ${
                        ['IN_PROGRESS', 'COMPLETED'].includes(fu.status) ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-450 dark:bg-slate-800'
                      }`}>3</span>
                      <p className="truncate max-w-[90px] mx-auto text-slate-800 dark:text-slate-205 mt-1 font-semibold">{fu.actionPlan ? 'Disahkan' : 'Draft'}</p>
                      <span className="text-[8px] text-slate-400 block font-normal">Rencana Aksi</span>
                    </div>

                    {/* Step 4: Progress */}
                    <div className="space-y-1 relative">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-between mx-auto font-mono text-[10px] font-bold ${
                        fu.progress > 0 ? 'bg-cyan-500 text-white' : 'bg-slate-200 text-slate-450 dark:bg-slate-800'
                      }`}>4</span>
                      <p className="font-bold text-slate-800 dark:text-slate-205 mt-1">{fu.progress}%</p>
                      <span className="text-[8px] text-slate-400 block font-normal">Realisasi Fisik</span>
                    </div>

                    {/* Step 5: Completion */}
                    <div className="space-y-1 relative">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-between mx-auto font-mono text-[10px] font-bold ${
                        fu.status === 'COMPLETED' ? 'bg-emerald-500 text-white animate-pulse' : isOverdue ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-450 dark:bg-slate-800'
                      }`}>5</span>
                      <p className="truncate max-w-[90px] mx-auto text-slate-800 dark:text-slate-205 mt-1 font-semibold">{fu.status === 'COMPLETED' ? 'Selesai' : isOverdue ? 'Terlambat' : 'Berjalan'}</p>
                      <span className="text-[8px] text-slate-400 block font-normal">Status Akhir</span>
                    </div>
                  </div>

                  {/* Descriptions details */}
                  <div className="pt-3 border-t text-2xs text-slate-500 grid gap-4 md:grid-cols-2 dark:border-slate-850">
                    <div>
                      <span className="font-bold text-slate-400 uppercase text-[8px] block">Rekomendasi Kebijakan</span>
                      <p className="text-slate-700 dark:text-slate-350 leading-relaxed italic mt-1">&ldquo;{fu.recommendationText}&rdquo;</p>
                    </div>
                    {fu.actionPlan ? (
                      <div className="p-2.5 bg-white dark:bg-slate-950 rounded-lg border dark:border-slate-850">
                        <span className="font-bold text-slate-400 uppercase text-[8px] block">Rencana Aksi OPD (PIC: {fu.pic || '-'})</span>
                        <p className="text-slate-850 dark:text-slate-200 font-semibold mt-1">{fu.actionPlan}</p>
                        {fu.targetDate && (
                          <p className="text-3xs text-slate-400 mt-2 font-mono">Tenggat Selesai: {fu.targetDate}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-3 bg-amber-50/20 text-amber-600 rounded-lg border border-amber-100/50">
                        <span className="font-semibold text-3xs">⚠ Menunggu OPD menyusun dan mensahkan Rencana Aksi</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Row 4: Strategic Visuals (Charts) */}
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
              Indikator Kinerja Utama (IKU) Tindak Lanjut
            </h3>
            
            <div className="grid gap-3 grid-cols-2 text-center text-xs">
              <div className="p-2.5 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-850">
                <span className="text-[9px] text-slate-500 font-bold uppercase block">Rekomendasi Terbit</span>
                <p className="text-lg font-extrabold mt-1 text-blue-655 dark:text-blue-400">{totalRecs}</p>
              </div>

              <div className="p-2.5 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-850">
                <span className="text-[9px] text-slate-500 font-bold uppercase block">Completion Rate</span>
                <p className="text-lg font-extrabold mt-1 text-emerald-650">{totalRecs > 0 ? Math.round((fuCompleted / totalRecs) * 100) : 0}%</p>
              </div>

              <div className="p-2.5 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-850">
                <span className="text-[9px] text-slate-500 font-bold uppercase block">Dalam Progress</span>
                <p className="text-lg font-extrabold mt-1 text-sky-600 dark:text-sky-400">{fuInProgress}</p>
              </div>

              <div className="p-2.5 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-850">
                <span className="text-[9px] text-slate-500 font-bold uppercase block">Terlambat (Overdue)</span>
                <p className={`text-lg font-extrabold mt-1 ${fuOverdue > 0 ? 'text-red-655 animate-pulse font-extrabold' : 'text-slate-550'}`}>{fuOverdue}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
