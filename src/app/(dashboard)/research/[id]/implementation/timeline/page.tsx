'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import { Milestone, useImplementationStore } from '@/store/useImplementationStore';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  List,
  GanttChartSquare,
  Clock,
  Save,
  Check,
  X,
  Info
} from 'lucide-react';

export default function TimelinePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { researchRecords } = useResearchStore();
  const {
    getImplementation,
    getMilestones,
    updateMilestone,
    deleteMilestone
  } = useImplementationStore();

  const id = params?.id || '';
  const isBrida = user?.role === 'BRIDA' || user?.role === 'ADMIN_BRIDA';

  const impl = getImplementation(id);
  const milestones = getMilestones(id);

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

  // Read-only locks checks
  const isResearchCompleted = impl.status === 'COMPLETED';

  // View state: 'LIST' | 'TIMELINE'
  const [viewMode, setViewMode] = useState<'LIST' | 'TIMELINE'>('LIST');

  // Milestone Detail Modal
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Progress Update Modal
  const [updatingMilestone, setUpdatingMilestone] = useState<Milestone | null>(null);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [newProgress, setNewProgress] = useState(0);
  const [progressNotes, setProgressNotes] = useState('');

  // Delete confirm modal state
  const [deletingId, setDeletingId] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Compute weight totals
  const totalWeight = useMemo(() => {
    return milestones.reduce((sum, m) => sum + m.weight, 0);
  }, [milestones]);

  const handleOpenDetail = (m: Milestone) => {
    setSelectedMilestone(m);
    setIsDetailOpen(true);
  };

  const handleOpenProgress = (m: Milestone) => {
    setUpdatingMilestone(m);
    setNewProgress(m.progress);
    setProgressNotes('');
    setIsProgressOpen(true);
  };

  const handleSaveProgress = () => {
    if (!updatingMilestone) return;

    if (newProgress < 0 || newProgress > 100) {
      toast('Progress harus bernilai antara 0 hingga 100.', 'warning');
      return;
    }

    updateMilestone(id, updatingMilestone.id, { progress: newProgress, notes: progressNotes }, user?.name || 'BRIDA Litbang');
    setIsProgressOpen(false);
    toast(`Progress milestone "${updatingMilestone.title}" diperbarui ke ${newProgress}%.`, 'success');
  };

  const handleMarkDelayed = (m: Milestone) => {
    updateMilestone(id, m.id, { status: 'DELAYED', notes: 'Ditandai manual terlambat (DELAYED)' }, user?.name || 'BRIDA Litbang');
    toast(`Milestone "${m.title}" ditandai sebagai DELAYED.`, 'warning');
  };

  const handleTriggerDelete = (mId: string) => {
    setDeletingId(mId);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteMilestone(id, deletingId);
    setIsDeleteOpen(false);
    toast('Milestone berhasil dihapus dari timeline.', 'success');
  };

  const getMilestoneStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DELAYED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-250';
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

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push(`/research/${id}/implementation`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Pelaksanaan</span>
        </button>
      </div>

      <PageHeader
        title="Penyusunan Research Timeline & Milestone"
        description={`Pengelolaan draf rencana kerja dan bobot milestone pelaksanaan untuk riset: "${record.title}"`}
        action={
          isBrida && !isResearchCompleted && (
            <button
              onClick={() => router.push(`/research/${id}/implementation/timeline/new`)}
              className="px-3 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow"
            >
              <Plus className="h-4 w-4" />
              <span>Add Milestone</span>
            </button>
          )
        }
      />

      {/* Weight warning banner (Section 13) */}
      {totalWeight !== 100 ? (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 rounded text-amber-750 dark:text-amber-400 text-2xs flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          <span>WARNING: Total bobot milestone saat ini adalah {totalWeight}%. Bobot kumulatif wajib berjumlah 100% untuk menyelesaikan timeline.</span>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 rounded text-emerald-750 dark:text-emerald-450 text-2xs flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Bobot timeline tervalidasi 100%. Rencana kerja sinkron.</span>
        </div>
      )}

      {/* Mode selectors */}
      <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-1.5 border rounded">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider pl-1.5">
          Tampilan: {viewMode} VIEW
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('LIST')}
            className={`px-3 py-1 text-3xs font-bold uppercase rounded flex items-center gap-1 transition-all ${
              viewMode === 'LIST'
                ? 'bg-purple-600 text-white shadow'
                : 'text-gray-650 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>List</span>
          </button>
          <button
            onClick={() => setViewMode('TIMELINE')}
            className={`px-3 py-1 text-3xs font-bold uppercase rounded flex items-center gap-1 transition-all ${
              viewMode === 'TIMELINE'
                ? 'bg-purple-600 text-white shadow'
                : 'text-gray-650 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <GanttChartSquare className="h-3.5 w-3.5" />
            <span>Timeline</span>
          </button>
        </div>
      </div>

      {/* Conditionally render views */}
      {viewMode === 'LIST' ? (
        /* List View Table */
        <Card>
          <CardContent className="p-0">
            {milestones.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-450 italic">
                Belum ada milestone rencana kerja yang didaftarkan.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center text-3xs uppercase tracking-wider font-bold">No</TableHead>
                    <TableHead className="text-3xs uppercase tracking-wider font-bold">Milestone Name</TableHead>
                    <TableHead className="text-3xs uppercase tracking-wider font-bold">Periode</TableHead>
                    <TableHead className="text-3xs uppercase tracking-wider font-bold text-center">Bobot (%)</TableHead>
                    <TableHead className="text-3xs uppercase tracking-wider font-bold text-center">Progress</TableHead>
                    <TableHead className="text-3xs uppercase tracking-wider font-bold text-center">Status</TableHead>
                    <TableHead className="text-3xs uppercase tracking-wider font-bold">Responsible</TableHead>
                    {!isResearchCompleted && <TableHead className="text-3xs uppercase tracking-wider font-bold text-right">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs font-medium">
                  {milestones.map((m, idx) => (
                    <TableRow key={m.id} className="hover:bg-gray-50/50">
                      <TableCell className="text-center font-bold text-gray-400">{idx + 1}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleOpenDetail(m)}
                          className="font-bold text-blue-650 dark:text-blue-450 hover:underline text-left"
                        >
                          {m.title}
                        </button>
                        <p className="text-[10px] text-gray-400 font-normal leading-relaxed truncate max-w-xs">{m.description}</p>
                      </TableCell>
                      <TableCell className="text-gray-600 font-bold whitespace-nowrap text-3xs">
                        {m.startDate} s/d {m.endDate}
                      </TableCell>
                      <TableCell className="text-center font-extrabold text-gray-800 dark:text-gray-250">{m.weight}%</TableCell>
                      <TableCell className="text-center font-extrabold text-purple-750 dark:text-purple-400">
                        {m.progress}%
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border ${getMilestoneStatusBadge(m.status)}`}>
                          {m.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600 text-3xs whitespace-nowrap">{m.responsibleUnit}</TableCell>
                      
                      {/* Action buttons (only show if not completed) */}
                      {!isResearchCompleted && (
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1.5">
                            {isBrida && m.status !== 'COMPLETED' && (
                              <>
                                <button
                                  onClick={() => handleOpenProgress(m)}
                                  className="px-2 py-0.5 border border-purple-200 hover:bg-purple-50 text-purple-700 text-3xs font-bold uppercase rounded bg-white"
                                >
                                  Update
                                </button>
                                <button
                                  onClick={() => handleMarkDelayed(m)}
                                  className="px-2 py-0.5 border border-rose-250 hover:bg-rose-50 text-rose-650 text-3xs font-bold uppercase rounded bg-white"
                                >
                                  Delayed
                                </button>
                              </>
                            )}
                            {isBrida && m.status !== 'COMPLETED' && (
                              <button
                                onClick={() => handleTriggerDelete(m.id)}
                                className="p-1 text-gray-400 hover:text-rose-600 rounded border hover:bg-slate-50"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Timeline View (Visual Chronological bars) */
        <Card>
          <CardContent className="p-6 space-y-6">
            {milestones.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-450 italic">
                Belum ada milestone rencana kerja yang didaftarkan.
              </div>
            ) : (
              <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-6 py-2">
                {milestones.map((m) => {
                  const isDone = m.status === 'COMPLETED';
                  const isActive = m.status === 'IN_PROGRESS';
                  const isLate = m.status === 'DELAYED';

                  return (
                    <div key={m.id} className="relative text-xs space-y-1 select-none">
                      
                      {/* Left icon circle */}
                      <span className={`absolute -left-[30px] top-1.5 h-4 w-4 rounded-full border border-white flex items-center justify-center text-[9px] font-bold ${
                        isDone
                          ? 'bg-emerald-500 text-white'
                          : isLate
                          ? 'bg-rose-500 text-white'
                          : isActive
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-300 text-white'
                      }`}>
                        {isDone ? '✓' : isLate ? '!' : isActive ? '●' : '○'}
                      </span>

                      <div className="flex justify-between items-baseline">
                        <button
                          onClick={() => handleOpenDetail(m)}
                          className="font-bold text-gray-900 dark:text-white hover:underline text-left text-xs"
                        >
                          {m.title}
                        </button>
                        <span className="text-[10px] text-gray-400 font-semibold">{m.startDate} s/d {m.endDate}</span>
                      </div>

                      <p className="text-[10px] text-gray-455 max-w-xl leading-relaxed">{m.description}</p>
                      
                      <div className="flex gap-4 pt-1 items-center">
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="text-gray-400 font-bold uppercase text-[8px]">Bobot:</span>
                          <span className="font-extrabold">{m.weight}%</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="text-gray-400 font-bold uppercase text-[8px]">Progress:</span>
                          <span className="font-extrabold text-purple-750">{m.progress}%</span>
                        </div>
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold border ${getMilestoneStatusBadge(m.status)}`}>
                          {m.status}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ================= MODAL: MILESTONE DETAIL (Section 17) ================= */}
      <Dialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Milestone / Rencana Kerja"
        description="Informasi rencana penugasan, deskripsi bab kegiatan, dan log aktivitas."
        footer={
          <button
            onClick={() => setIsDetailOpen(false)}
            className="px-4 py-2 bg-blue-650 hover:bg-blue-700 text-white rounded text-xs font-semibold"
          >
            Tutup Detail
          </button>
        }
      >
        {selectedMilestone && (
          <div className="space-y-4 text-xs font-sans">
            <div>
              <span className="text-gray-400 block font-bold text-[8px] uppercase">Nama Milestone</span>
              <span className="font-bold text-gray-900 text-sm">{selectedMilestone.title}</span>
            </div>

            <div>
              <span className="text-gray-400 block font-bold text-[8px] uppercase">Deskripsi Kegiatan</span>
              <p className="text-gray-650 leading-relaxed italic">{selectedMilestone.description}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Periode</span>
                <span className="font-bold text-gray-700">{selectedMilestone.startDate} s/d {selectedMilestone.endDate}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Bobot Kerja</span>
                <span className="font-bold text-gray-700">{selectedMilestone.weight}%</span>
              </div>
              <div>
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Penanggung Jawab</span>
                <span className="font-bold text-gray-750">{selectedMilestone.responsibleUnit}</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
              <div>
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Progress Saat Ini</span>
                <span className="font-extrabold text-purple-750 text-sm">{selectedMilestone.progress}%</span>
              </div>
              <div>
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Status Administrasi</span>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border mt-0.5 ${getMilestoneStatusBadge(selectedMilestone.status)}`}>
                  {selectedMilestone.status}
                </span>
              </div>
            </div>

            {/* History Logs list */}
            <div className="pt-3 border-t">
              <span className="font-bold text-[8px] text-gray-400 block uppercase mb-2">History Milestone Updates</span>
              {selectedMilestone.activities.length === 0 ? (
                <span className="text-[10px] text-gray-400 italic">Belum ada riwayat update.</span>
              ) : (
                <div className="relative border-l pl-3 space-y-3">
                  {selectedMilestone.activities.map((act, index) => (
                    <div key={index} className="relative text-2xs space-y-0.5">
                      <span className="absolute -left-[15.5px] top-1 h-1.5 w-1.5 rounded-full bg-blue-650" />
                      <div className="flex justify-between items-center text-[8px] text-gray-400 font-semibold">
                        <span>{act.date}</span>
                        <span>{act.user}</span>
                      </div>
                      <p className="font-bold text-gray-800">{act.action}</p>
                      <p className="text-[9px] text-gray-450 italic leading-normal">{act.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </Dialog>

      {/* ================= MODAL: UPDATE PROGRESS (Section 18) ================= */}
      <Dialog
        isOpen={isProgressOpen}
        onClose={() => setIsProgressOpen(false)}
        title={`Update Progress: ${updatingMilestone?.title || ''}`}
        description="Perbarui persentase progress dan berikan catatan progress saat ini."
        footer={
          <>
            <button
              onClick={handleSaveProgress}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold transition-all"
            >
              Simpan Update
            </button>
            <button
              onClick={() => setIsProgressOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-750 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        {updatingMilestone && (
          <div className="space-y-4 text-xs font-sans">
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <label className="font-bold text-gray-750 uppercase text-3xs">Progress Persentase (%) *</label>
                <span className="font-extrabold text-purple-750 text-sm">{newProgress}%</span>
              </div>
              <input
                type="range" min="0" max="100" value={newProgress}
                onChange={(e) => setNewProgress(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-650"
              />
              <span className="text-[9px] text-gray-400 block italic leading-normal">
                * Keterangan: 0% otomatis diset ke PENDING, 1-99% diset IN PROGRESS, dan 100% diset COMPLETED.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-gray-750 uppercase text-3xs">Catatan Kemajuan / Kendala *</label>
              <textarea
                value={progressNotes}
                onChange={(e) => setProgressNotes(e.target.value)}
                placeholder="Deskripsikan pekerjaan yang selesai atau hambatan jika ada..."
                rows={3}
                className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900"
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* ================= MODAL: CONFIRM DELETE MILESTONE ================= */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Hapus Milestone"
        description="Hapus milestone ini?"
        footer={
          <>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold transition-all"
            >
              Hapus
            </button>
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-750 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <p className="text-xs text-gray-500 leading-relaxed">
          Milestone terpilih beserta riwayat progress-nya akan dihapus permanen dari draf rencana kerja timeline riset.
        </p>
      </Dialog>

    </div>
  );
}
