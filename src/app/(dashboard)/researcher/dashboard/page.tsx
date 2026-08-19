'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  PlayCircle,
  FileCheck,
  Calendar,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  TrendingUp,
  Clock,
  MessageSquare
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { authService } from '@/lib/api/auth';
import { Proposal } from '@/types/proposals';
import { User } from '@/types/auth';

export default function ResearcherDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = authService.getCurrentUser();
        setCurrentUser(user);
        
        if (user) {
          const list = await proposalService.getProposals();
          // Filter proposals assigned to this researcher
          const assigned = list.filter((p) => p.researcherId === user.id);
          setProposals(assigned);
        }
      } catch (err) {
        console.error('Failed to load researcher dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat dasbor peneliti..." />;
  }

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-200">Sesi Tidak Ditemukan</h3>
        <p className="text-xs text-slate-500 mt-1">Silakan melakukan login terlebih dahulu.</p>
      </div>
    );
  }

  // Stats calculation
  const totalAssigned = proposals.length;
  const activeProjects = proposals.filter((p) => ['IN_PROGRESS', 'MONITORING'].includes(p.status)).length;
  const pendingSubmissions = proposals.filter((p) => ['IN_PROGRESS', 'MONITORING', 'RESEARCHER_APPROVAL'].includes(p.status)).length;
  
  // Calculate average progress of active projects
  const activeList = proposals.filter((p) => ['IN_PROGRESS', 'MONITORING'].includes(p.status));
  const avgProgress = activeList.length > 0
    ? Math.round(activeList.reduce((acc, p) => acc + p.progress, 0) / activeList.length)
    : 0;

  // Deadline: Earliest targetPenyelesaian of active projects
  const activeDeadlines = activeList
    .map((p) => p.problem.targetPenyelesaian)
    .filter(Boolean);
  const nextDeadline = activeDeadlines.length > 0 ? activeDeadlines[0] : 'Tidak ada tenggat terdekat';

  // Latest feedback from BRIDA report evaluation or timeline logs
  const feedbackList = proposals
    .filter((p) => p.reportReview?.reviewerNotes || p.approvalHistory?.length)
    .map((p) => ({
      projectTitle: p.title,
      notes: p.reportReview?.reviewerNotes || p.approvalHistory?.[p.approvalHistory.length - 1]?.comment || '',
      date: new Date(p.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      status: p.status
    }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Profile card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow">
        <div>
          <span className="text-3xs uppercase bg-blue-600 px-2 py-0.5 rounded-full font-bold">Mitra Pelaksana Riset</span>
          <h1 className="text-xl font-bold tracking-tight mt-1.5">{currentUser.name}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{currentUser.department}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/researcher/research">
            <Button variant="outline" size="sm" className="h-8 text-2xs text-white border-slate-700 hover:bg-slate-800">
              Lihat Proyek Riset
            </Button>
          </Link>
          <Link href="/researcher/reports">
            <Button size="sm" className="h-8 text-2xs bg-blue-600 hover:bg-blue-700 font-bold">
              Submit Laporan
            </Button>
          </Link>
        </div>
      </div>

      {/* Row 1: Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Research</p>
              <h3 className="text-xl font-extrabold mt-1">{totalAssigned}</h3>
            </div>
            <div className="h-9 w-9 rounded-full bg-blue-50 text-blue-650 flex items-center justify-between dark:bg-blue-950/20 dark:text-blue-450">
              <Briefcase className="h-4.5 w-4.5 mx-auto" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Research</p>
              <h3 className="text-xl font-extrabold text-cyan-650 mt-1">{activeProjects}</h3>
            </div>
            <div className="h-9 w-9 rounded-full bg-cyan-50 text-cyan-650 flex items-center justify-between dark:bg-cyan-950/20 dark:text-cyan-450">
              <PlayCircle className="h-4.5 w-4.5 mx-auto" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progress Rerata</p>
              <h3 className="text-xl font-extrabold text-emerald-650 mt-1">{avgProgress}%</h3>
            </div>
            <div className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-650 flex items-center justify-between dark:bg-emerald-950/20 dark:text-emerald-450">
              <TrendingUp className="h-4.5 w-4.5 mx-auto" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deadline Terdekat</p>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 truncate max-w-[130px]">
                {nextDeadline}
              </h3>
            </div>
            <div className="h-9 w-9 rounded-full bg-red-50 text-red-600 flex items-center justify-between dark:bg-red-950/20 dark:text-red-450">
              <Clock className="h-4.5 w-4.5 mx-auto" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Laporan</p>
              <h3 className="text-xl font-extrabold text-amber-650 mt-1">{pendingSubmissions}</h3>
            </div>
            <div className="h-9 w-9 rounded-full bg-amber-50 text-amber-650 flex items-center justify-between dark:bg-amber-950/20 dark:text-amber-450">
              <FileCheck className="h-4.5 w-4.5 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: active projects and feedback */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Active list */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Proyek Riset yang Sedang Berjalan (Active Assignments)
          </h3>

          {activeList.length === 0 ? (
            <Card className="p-6 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm">
              Tidak ada proyek riset aktif. Silakan tunggu penugasan dari BRIDA.
            </Card>
          ) : (
            <div className="space-y-4">
              {activeList.map((item) => (
                <Card key={item.id} className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-3xs font-bold text-blue-650 dark:text-blue-400">{item.id}</span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{item.title}</h4>
                      <p className="text-3xs text-slate-500">OPD: {item.opdName}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold text-2xs">
                      <span>Progress Kerja Lapangan</span>
                      <span>{item.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t dark:border-slate-850">
                    <span className="text-3xs text-slate-450">Tenggat: {item.problem.targetPenyelesaian}</span>
                    <Link href={`/researcher/research/${item.id}`}>
                      <Button size="sm" variant="ghost" className="h-7 text-3xs text-blue-600 hover:bg-blue-50 flex items-center gap-1">
                        <span>Detail Kajian</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* BRIDA Feedback */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Tinjauan & Catatan BRIDA (Feedback)
          </h3>

          {feedbackList.length === 0 ? (
            <Card className="p-6 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm">
              Belum ada feedback / review terbaru dari evaluasi laporan Anda.
            </Card>
          ) : (
            <div className="space-y-3">
              {feedbackList.map((feedback, idx) => (
                <Card key={idx} className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-slate-450 truncate max-w-[150px]">{feedback.projectTitle}</p>
                    <span className="text-3xs font-mono text-slate-400">{feedback.date}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-350 italic leading-relaxed p-2.5 rounded bg-slate-50/50 border border-slate-100 dark:bg-slate-955 dark:border-slate-850">
                    &ldquo;{feedback.notes}&rdquo;
                  </p>
                  <div className="text-3xs flex items-center gap-1.5 text-slate-450">
                    <MessageSquare className="h-3 w-3 text-blue-550" />
                    <span>Dikirim oleh Evaluator BRIDA</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
