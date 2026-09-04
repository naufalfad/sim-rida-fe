'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useImplementationStore } from '@/store/useImplementationStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { usePartnerStore } from '@/store/usePartnerStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  History,
  Clock,
  Briefcase,
  Users,
  Compass,
  FileCheck,
  TrendingUp,
  FolderOpen,
  PieChart,
  UserCheck,
  X,
  Check
} from 'lucide-react';

export default function ImplementationOverviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { researchRecords } = useResearchStore();
  const { getMethod } = usePartnerStore();
  const {
    getImplementation,
    getMilestones,
    getMonitoring,
    getActivities,
    getOverallProgress,
    getTimelineStatus,
    markResearchAsCompleted
  } = useImplementationStore();

  const id = params?.id || '';
  const isBrida = user?.role === 'BRIDA' || user?.role === 'ADMIN_BRIDA';

  const [isCompleteOpen, setIsCompleteOpen] = useState(false);

  const impl = getImplementation(id);
  const milestones = getMilestones(id);
  const monitoring = getMonitoring(id);
  const activities = getActivities(id);
  const method = getMethod(id);

  // Find target research record
  const record = useMemo(() => {
    const found = researchRecords.find((r) => r.id === id || r.proposalId === id);
    if (found) return found;
    if (impl?.proposalTitle) {
      return {
        id: impl.researchId || id,
        title: impl.proposalTitle,
        opd: impl.opdName || 'BAPPEDA',
        status: impl.status === 'COMPLETED' ? ('COMPLETED' as const) : ('ACTIVE' as const),
        priority: 'HIGH' as const,
        approvedDate: impl.startedDate || '2026-09-01',
        proposalId: impl.researchId || id,
        identificationId: 'PRI-2026-001',
      };
    }
    return {
      id,
      title: `Penelitian #${id}`,
      opd: 'BAPPEDA',
      status: 'ACTIVE' as const,
      priority: 'HIGH' as const,
      approvedDate: '2026-09-01',
      proposalId: id,
      identificationId: 'PRI-2026-001',
    };
  }, [researchRecords, id, impl]);

  // Computed properties
  const overallProgress = getOverallProgress(id);
  const timelineStatus = getTimelineStatus(id);

  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(m => m.status === 'COMPLETED').length;
  const inProgressMilestones = milestones.filter(m => m.status === 'IN_PROGRESS').length;
  const pendingMilestones = milestones.filter(m => m.status === 'PENDING').length;

  // Delayed count checks
  const delayedMilestones = useMemo(() => {
    const mockCurrentDate = new Date('2026-09-18');
    return milestones.filter(m => {
      if (m.status === 'DELAYED') return true;
      if (m.progress < 100) {
        const endDate = new Date(m.endDate);
        return endDate < mockCurrentDate;
      }
      return false;
    }).length;
  }, [milestones]);

  // Current Phase: first incomplete milestone title
  const currentPhase = useMemo(() => {
    const active = milestones.find(m => m.progress < 100);
    return active ? active.title : 'All Completed';
  }, [milestones]);

  // Evidences total count
  const evidenceCount = useMemo(() => {
    return monitoring.reduce((sum, mon) => sum + mon.evidences.length, 0);
  }, [monitoring]);

  // Combined documents list
  const implDocuments = useMemo(() => {
    const list: Array<{ id: string; name: string; type: string; date: string; actor: string }> = [
      { id: 'ext-1', name: 'Research_Work_Plan_v1.0.pdf', type: 'PDF', date: '01 Sep 2026', actor: 'BRIDA Litbang' },
      { id: 'ext-2', name: 'Kickoff_Notes_Final.pdf', type: 'PDF', date: '04 Sep 2026', actor: 'BRIDA Litbang' }
    ];
    // append all monitoring files
    monitoring.forEach(mon => {
      mon.evidences.forEach(ev => {
        list.push({
          id: ev.id,
          name: ev.name,
          type: ev.type,
          date: ev.uploadDate,
          actor: ev.uploadedBy,
        });
      });
    });
    return list;
  }, [monitoring]);

  // Completion validation (Section 38)
  const completionValidation = useMemo(() => {
    const errors: string[] = [];

    if (totalMilestones === 0) {
      errors.push('Timeline penelitian belum dibuat');
    } else {
      if (overallProgress < 100) {
        errors.push(`Progress keseluruhan belum 100% (Current: ${overallProgress}%)`);
      }
      const incompleteCount = milestones.filter(m => m.progress < 100).length;
      if (incompleteCount > 0) {
        errors.push(`Ada ${incompleteCount} milestone yang belum selesai (progress < 100%)`);
      }
      if (delayedMilestones > 0) {
        errors.push(`Terdapat ${delayedMilestones} milestone berstatus DELAYED / terlambat`);
      }
    }

    const isValid = errors.length === 0;
    return { isValid, errors };
  }, [milestones, overallProgress, totalMilestones, delayedMilestones]);

  const handleConfirmComplete = async () => {
    try {
      await markResearchAsCompleted(id, user?.name || 'BRIDA Litbang');
      setIsCompleteOpen(false);
      toast('Penelitian dinyatakan selesai! Status riset kini COMPLETED dan siap pelaporan.', 'success');
    } catch (err: any) {
      toast(err.message || 'Gagal menyelesaikan penelitian', 'error');
    }
  };

  const getTimelineBadgeClass = (status: string) => {
    switch (status) {
      case 'ON_TRACK':
        return 'bg-emerald-50 text-emerald-700 border-emerald-250';
      case 'MINOR_DELAY':
        return 'bg-amber-50 text-amber-700 border-amber-250';
      case 'DELAYED':
        return 'bg-rose-50 text-rose-750 border-rose-250';
      case 'AT_RISK':
        return 'bg-red-50 text-red-750 border-red-250';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  if (!record) {
    return (
      <div className="space-y-6 text-center py-12 font-sans">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Rekod Penelitian Tidak Ditemukan</h2>
        <button
          onClick={() => router.push('/research')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push(`/research/${record.id}`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Detail Penelitian</span>
        </button>
      </div>

      <PageHeader
        title="Pelaksanaan Penelitian"
        description="Monitoring pelaksanaan penelitian berdasarkan timeline, milestone, dan berkas evidence."
        action={
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/research/${record.id}/implementation/timeline`)}
              className="px-3.5 py-1.5 border border-purple-200 hover:bg-purple-50/20 text-purple-700 rounded text-xs font-bold transition-all bg-white dark:bg-gray-950 dark:border-gray-800"
            >
              Timeline & Milestone
            </button>
            <button
              onClick={() => router.push(`/research/${record.id}/implementation/monitoring`)}
              className="px-3.5 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded text-xs font-bold transition-all shadow"
            >
              Monitoring Progress
            </button>
          </div>
        }
      />

      {/* Banner Ready for Reporting / Research Completed */}
      {impl.status === 'COMPLETED' && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 rounded text-emerald-700 dark:text-emerald-400 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Research Completed & Ready for Reporting</h4>
              <p className="text-xs font-medium leading-relaxed">
                Penelitian telah ditandai selesai. Dokumen pelaksanaan dikunci dan sistem siap masuk ke tahap penyusunan laporan (Fase 8).
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded text-2xs font-extrabold bg-emerald-100 dark:bg-emerald-900 border border-emerald-350">
            READY FOR REPORTING
          </span>
        </div>
      )}

      {/* Main Metadata Info Card */}
      <Card>
        <CardContent className="p-4 text-xs font-semibold grid gap-4 sm:grid-cols-4 select-none">
          <div>
            <span className="text-gray-400 block font-bold text-[8px] uppercase">Judul Kegiatan</span>
            <span className="text-gray-800 dark:text-gray-250 block truncate max-w-xs">{record.title}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-bold text-[8px] uppercase">Status Pelaksanaan</span>
            <span className="text-purple-750 dark:text-purple-400 block mt-0.5">{impl.status}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-bold text-[8px] uppercase">Pelaksana Pelaksana / Mitra</span>
            <span className="text-gray-800 dark:text-gray-205 block truncate">
              {method.method === 'SWAKELOLA' ? 'Tim Internal BRIDA' : 'PT Nusantara Health Research'}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block font-bold text-[8px] uppercase">Metode Pemilihan</span>
            <span className="text-gray-800 dark:text-gray-255 block">{method.method || '-'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Summary panels (Section 9) */}
      <div className="grid gap-4 sm:grid-cols-5">
        
        {/* 1. Overall Progress */}
        <Card className="sm:col-span-2">
          <CardContent className="p-4 space-y-3 font-semibold">
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Overall Progress</span>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-extrabold text-purple-750 dark:text-purple-400">{overallProgress}%</span>
              <span className="text-2xs text-gray-450">Milestone weight: 100%</span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-850 h-2.5 rounded-full overflow-hidden">
              <div className="bg-purple-650 h-full rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
            </div>

            <div className="grid grid-cols-4 gap-1 text-[10px] text-center pt-1">
              <div>
                <span className="text-emerald-600 block font-bold">{completedMilestones}</span>
                <span className="text-gray-400 block font-semibold text-[8px] uppercase">Done</span>
              </div>
              <div>
                <span className="text-blue-600 block font-bold">{inProgressMilestones}</span>
                <span className="text-gray-400 block font-semibold text-[8px] uppercase">Active</span>
              </div>
              <div>
                <span className="text-gray-600 block font-bold">{pendingMilestones}</span>
                <span className="text-gray-400 block font-semibold text-[8px] uppercase">Pending</span>
              </div>
              <div>
                <span className="text-rose-600 block font-bold">{delayedMilestones}</span>
                <span className="text-gray-400 block font-semibold text-[8px] uppercase">Delayed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Completed Milestones count */}
        <Card>
          <CardContent className="p-4 space-y-2 font-semibold">
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Milestones Selesai</span>
            <span className="text-2xl font-extrabold text-gray-800 dark:text-white">{completedMilestones} / {totalMilestones}</span>
            <p className="text-[10px] text-gray-450 font-normal leading-normal italic">
              Persentase milestone rampung dari draf timeline.
            </p>
          </CardContent>
        </Card>

        {/* 3. Current Phase */}
        <Card>
          <CardContent className="p-4 space-y-2 font-semibold">
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Fase Berjalan</span>
            <span className="text-xs font-bold text-gray-850 dark:text-gray-250 block leading-tight truncate">{currentPhase}</span>
            <p className="text-[10px] text-gray-450 font-normal leading-normal italic">
              Aktivitas target pengerjaan yang belum diselesaikan.
            </p>
          </CardContent>
        </Card>

        {/* 4. Timeline Status */}
        <Card>
          <CardContent className="p-4 space-y-2 font-semibold">
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Status Timeline</span>
            <span className={`inline-block px-2 py-0.5 rounded text-2xs font-extrabold border ${getTimelineBadgeClass(timelineStatus)}`}>
              {timelineStatus.replace('_', ' ')}
            </span>
            <p className="text-[10px] text-gray-450 font-normal leading-normal italic">
              Indikator keselarasan durasi dan target waktu.
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Visual Graphs & Charts (Section 27 & 28) */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Progress over Time Line Chart (Section 27) */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-purple-650" />
              <span>Kemajuan Pelaksanaan dari Waktu ke Waktu (Progress over Time)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 font-sans">
            {/* Custom SVG Line Chart representation */}
            <div className="h-48 w-full relative border-b border-l flex flex-col justify-end p-2">
              <svg className="w-full h-full absolute inset-0 overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="0" y1="90" x2="400" y2="90" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3" />
                <line x1="0" y1="60" x2="400" y2="60" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3" />
                <line x1="0" y1="30" x2="400" y2="30" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3" />
                
                {/* Line Path */}
                <path
                  d={`M 10 90 L 130 80 L 260 65 L 390 ${100 - (overallProgress * 0.9)}`}
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="2.5"
                />

                {/* Point nodes */}
                <circle cx="10" cy="90" r="4.5" fill="#7c3aed" />
                <circle cx="130" cy="80" r="4.5" fill="#7c3aed" />
                <circle cx="260" cy="65" r="4.5" fill="#7c3aed" />
                <circle cx="390" cy={`${100 - (overallProgress * 0.9)}`} r="4.5" fill="#7c3aed" />
              </svg>

              {/* Labels below chart */}
              <div className="flex justify-between text-[8px] font-bold text-gray-450 pt-2 absolute w-full bottom-[-16px] left-0 px-2 select-none">
                <span>01 Sep (10%)</span>
                <span>08 Sep (20%)</span>
                <span>15 Sep (35%)</span>
                <span className="text-purple-650">Current ({overallProgress}%)</span>
              </div>
            </div>
            <div className="h-4" /> {/* spacers */}
          </CardContent>
        </Card>

        {/* Milestone status distribution (Section 28) */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <PieChart className="h-4 w-4 text-purple-650" />
              <span>Distribusi Status Milestone</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 font-semibold space-y-4">
            <div className="space-y-3 text-2xs">
              
              {/* Completed */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Completed ({completedMilestones})</span>
                  <span>{totalMilestones ? Number(((completedMilestones / totalMilestones) * 100).toFixed(0)) : 0}%</span>
                </div>
                <div className="w-full bg-gray-150 h-2 rounded overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded" style={{ width: `${totalMilestones ? (completedMilestones / totalMilestones) * 100 : 0}%` }} />
                </div>
              </div>

              {/* In Progress */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>In Progress ({inProgressMilestones})</span>
                  <span>{totalMilestones ? Number(((inProgressMilestones / totalMilestones) * 100).toFixed(0)) : 0}%</span>
                </div>
                <div className="w-full bg-gray-150 h-2 rounded overflow-hidden">
                  <div className="bg-blue-500 h-full rounded" style={{ width: `${totalMilestones ? (inProgressMilestones / totalMilestones) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Delayed */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Delayed ({delayedMilestones})</span>
                  <span>{totalMilestones ? Number(((delayedMilestones / totalMilestones) * 100).toFixed(0)) : 0}%</span>
                </div>
                <div className="w-full bg-gray-150 h-2 rounded overflow-hidden">
                  <div className="bg-rose-500 h-full rounded" style={{ width: `${totalMilestones ? (delayedMilestones / totalMilestones) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Pending */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Pending ({pendingMilestones})</span>
                  <span>{totalMilestones ? Number(((pendingMilestones / totalMilestones) * 100).toFixed(0)) : 0}%</span>
                </div>
                <div className="w-full bg-gray-150 h-2 rounded overflow-hidden">
                  <div className="bg-slate-400 h-full rounded" style={{ width: `${totalMilestones ? (pendingMilestones / totalMilestones) * 100 : 0}%` }} />
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Contents split panels */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* ================= LEFT SECTION (Validation checklists & Documents) ================= */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Completion Validation Checklist (Section 36 & 38) */}
          {isBrida && impl.status !== 'COMPLETED' && (
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-gray-400" />
                  <span>Completion Validation Checklist</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                
                <div className="grid gap-2 sm:grid-cols-2 text-2xs font-bold">
                  <div className="flex items-center gap-2">
                    {overallProgress === 100 ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-rose-600" />
                    )}
                    <span className={overallProgress === 100 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                      Overall Progress Mencapai 100%
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {milestones.length > 0 && milestones.every(m => m.progress === 100) ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-rose-600" />
                    )}
                    <span className={(milestones.length > 0 && milestones.every(m => m.progress === 100)) ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                      Semua Milestone Selesai (100%)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {delayedMilestones === 0 ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-rose-600" />
                    )}
                    <span className={delayedMilestones === 0 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                      Tidak Ada Milestone Terlambat (No Delayed)
                    </span>
                  </div>
                </div>

                {!completionValidation.isValid ? (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 rounded text-rose-750 dark:text-rose-400 text-2xs space-y-1">
                    <span className="font-bold block uppercase text-[9px] mb-1">Completion Errors:</span>
                    {completionValidation.errors.map((err, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 rounded text-emerald-750 dark:text-emerald-400 text-2xs flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                    <span>Seluruh komponen milestone diselesaikan! Anda dapat menandai riset ini selesai.</span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setIsCompleteOpen(true)}
                    disabled={!completionValidation.isValid}
                    className="px-4 py-2 bg-emerald-650 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Mark Research as Completed</span>
                  </button>
                </div>

              </CardContent>
            </Card>
          )}

          {/* Implementation Documents List (Section 31) */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center justify-between">
                <span>Dokumen Pelaksanaan & Berkas Evidence</span>
                <span className="text-[10px] text-gray-400 font-bold bg-gray-50 px-2 py-0.5 border rounded">
                  {implDocuments.length} Dokumen
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs font-semibold">
              <div className="grid gap-2 sm:grid-cols-2">
                {implDocuments.map((doc) => (
                  <div key={doc.id} className="p-3 bg-gray-55/20 border rounded flex justify-between items-center text-3xs">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-slate-400" />
                      <div>
                        <span className="font-bold text-gray-700 truncate max-w-40 block">{doc.name}</span>
                        <span className="text-[9px] text-gray-400 block font-normal mt-0.5">{doc.type} • {doc.date}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toast(`Simulasi preview berkas: ${doc.name}`, 'info')}
                      className="text-blue-600 font-extrabold hover:underline uppercase text-3xs"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ================= RIGHT SECTION (Team pelaksana & activities) ================= */}
        <div className="space-y-6">
          
          {/* Research Team list (Section 33) */}
          <Card>
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-gray-400" />
                <span>Tim Pelaksana Lapangan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs font-semibold leading-normal select-none">
              {method.method === 'SWAKELOLA' && method.swakelolaDetails ? (
                <div className="divide-y">
                  {method.swakelolaDetails.internalTeam.map(m => (
                    <div key={m.id} className="py-2.5 flex justify-between items-baseline">
                      <div>
                        <span className="font-bold text-gray-800 block">{m.name}</span>
                        <span className="text-[10px] text-gray-400 font-semibold">{m.position}</span>
                      </div>
                      <span className="text-purple-650 text-2xs">{m.role}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y">
                  <div className="py-2.5 flex justify-between items-baseline">
                    <div>
                      <span className="font-bold text-gray-850 block">Dr. Ahmad Rifqi</span>
                      <span className="text-[10px] text-gray-400 font-semibold">Lead Researcher</span>
                    </div>
                    <span className="text-purple-650 text-2xs">Research Lead</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-baseline">
                    <div>
                      <span className="font-bold text-gray-850 block">Siti Nurhaliza, M.Cs</span>
                      <span className="text-[10px] text-gray-400 font-semibold">Data Analyst</span>
                    </div>
                    <span className="text-purple-650 text-2xs">Data Processing</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-baseline">
                    <div>
                      <span className="font-bold text-gray-850 block">Budi Santoso, S.Sos</span>
                      <span className="text-[10px] text-gray-400 font-semibold">Field Researcher</span>
                    </div>
                    <span className="text-purple-650 text-2xs">Data Collection</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline Partner Activities */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <History className="h-4 w-4" />
                <span>Aktivitas Pelaksanaan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {activities.length === 0 ? (
                <p className="text-[11px] text-gray-400 italic">Belum ada riwayat pelaksanaan.</p>
              ) : (
                <div className="relative border-l border-gray-200 pl-3.5 space-y-4 py-2">
                  {activities.map((act) => (
                    <div key={act.id} className="relative text-xs space-y-0.5">
                      <span className="absolute -left-[19.5px] top-1 h-2 w-2 rounded-full border border-white bg-purple-650" />
                      <div className="flex justify-between items-center text-[9px] text-gray-450 font-semibold">
                        <span>{act.date}</span>
                        <span>{act.user}</span>
                      </div>
                      <p className="font-bold text-gray-800">{act.action}</p>
                      <p className="text-[10px] text-gray-455 italic leading-relaxed">{act.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ================= MODAL: CONFIRM MARK RESEARCH AS COMPLETED ================= */}
      <Dialog
        isOpen={isCompleteOpen}
        onClose={() => setIsCompleteOpen(false)}
        title="Mark Research as Completed"
        description="Apakah Anda yakin menandai penelitian ini selesai?"
        footer={
          <>
            <button
              onClick={handleConfirmComplete}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-all"
            >
              Confirm Complete
            </button>
            <button
              onClick={() => setIsCompleteOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-750 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <p className="text-xs text-gray-500 leading-relaxed">
          Pernyataan pengerjaan rampung akan mengunci seluruh timeline, milestones, dan monitoring note secara permanen (**Read-Only**). Status penelitian akan diubah menjadi **COMPLETED** dan siap diajukan untuk pelaporan (Ready for Reporting).
        </p>
      </Dialog>

    </div>
  );
}
