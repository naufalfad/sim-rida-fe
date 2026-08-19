'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { proposalService } from '@/lib/api/proposals';
import { authService } from '@/lib/api/auth';
import { Proposal, ResearchMilestone } from '@/types/proposals';
import { Save, Calendar, CheckSquare, Clock } from 'lucide-react';

export default function ResearcherMilestonesPage() {
  const { toast } = useToast();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form editing state for selected milestone
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [progressVal, setProgressVal] = useState(0);
  const [notesVal, setNotesVal] = useState('');
  const [evidenceVal, setEvidenceVal] = useState('');

  useEffect(() => {
    const loadProposals = async () => {
      try {
        const user = authService.getCurrentUser();
        if (user) {
          const list = await proposalService.getProposals();
          const assigned = list.filter((p) => p.researcherId === user.id && ['IN_PROGRESS', 'MONITORING'].includes(p.status));
          setProposals(assigned);
          if (assigned.length > 0) {
            setSelectedProposal(assigned[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load active proposals:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProposals();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat milestone proyek aktif..." />;
  }

  const handleProposalChange = (id: string) => {
    const found = proposals.find((p) => p.id === id);
    if (found) {
      setSelectedProposal(found);
      setEditingMilestoneId(null);
    }
  };

  const handleEditMilestone = (m: ResearchMilestone) => {
    setEditingMilestoneId(m.id);
    setProgressVal(m.progress);
    setNotesVal(m.notes || '');
    setEvidenceVal(m.evidenceFile || '');
  };

  const handleSaveMilestone = async () => {
    if (!selectedProposal || !editingMilestoneId) return;

    setIsSaving(true);
    try {
      const updated = await proposalService.updateMilestoneProgress(
        selectedProposal.id,
        editingMilestoneId,
        progressVal,
        notesVal,
        evidenceVal || undefined
      );

      if (updated) {
        setSelectedProposal(updated);
        // Refresh local list state
        setProposals(proposals.map((p) => p.id === updated.id ? updated : p));
        setEditingMilestoneId(null);
        toast('Milestone kerja berhasil diupdate!', 'success');
      }
    } catch {
      toast('Gagal mengupdate milestone.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const proposalOptions = proposals.map((p) => ({
    value: p.id,
    label: `${p.id} - ${p.title.substring(0, 45)}...`,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Kelola Milestone Kerja
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Ubah persentase realisasi tahapan riset, unggah bukti capaian (evidence), dan lampirkan catatan catatan lapangan.
        </p>
      </div>

      {proposals.length === 0 ? (
        <EmptyState
          title="Tidak ada proyek riset aktif"
          description="Anda belum memiliki penugasan riset berstatus AKTIF (IN_PROGRESS) untuk dikelola milestone-nya."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column: Selector & Milestones list */}
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
              <div>
                <label className="text-3xs font-bold text-slate-450 uppercase block mb-1">Pilih Proyek Riset</label>
                <Select
                  options={proposalOptions}
                  value={selectedProposal?.id || ''}
                  onChange={(e) => handleProposalChange(e.target.value)}
                  className="bg-white dark:bg-slate-950 dark:border-slate-850"
                />
              </div>

              {selectedProposal && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 dark:border-slate-850">
                    Daftar Tahapan Riset (Milestones)
                  </h3>
                  
                  <div className="space-y-3">
                    {(selectedProposal.milestones || []).map((m) => {
                      const isEditing = editingMilestoneId === m.id;
                      return (
                        <div
                          key={m.id}
                          className={`p-4 border rounded-lg transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                            isEditing
                              ? 'border-blue-500 bg-blue-50/10 dark:bg-slate-950'
                              : 'bg-slate-50/40 border-slate-200 dark:bg-slate-955 dark:border-slate-850'
                          }`}
                        >
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.label}</h4>
                            <div className="flex items-center gap-2 text-3xs text-slate-500">
                              <span>Progress: <strong>{m.progress}%</strong></span>
                              {m.updatedAt && <span>•</span>}
                              {m.updatedAt && <span>Terakhir Update: {m.updatedAt}</span>}
                            </div>
                            {m.notes && (
                              <p className="text-[10px] text-slate-550 italic mt-1 leading-relaxed">
                                &ldquo;{m.notes}&rdquo;
                              </p>
                            )}
                            {m.evidenceFile && (
                              <p className="text-[9px] text-blue-550 font-semibold mt-0.5">
                                Bukti: {m.evidenceFile}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <div className="h-1.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${m.progress}%` }} />
                            </div>
                            <Button
                              onClick={() => handleEditMilestone(m)}
                              size="sm"
                              variant={isEditing ? 'secondary' : 'outline'}
                              className="h-8 text-3xs font-bold"
                              disabled={isSaving}
                            >
                              Update
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Editing Panel */}
          <div>
            {editingMilestoneId ? (
              <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4 sticky top-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850">
                  Update Progress Capaian
                </h3>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Realisasi Capaian</span>
                    <span className="text-blue-600">{progressVal}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progressVal}
                    onChange={(e) => setProgressVal(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-800 accent-blue-600"
                  />
                </div>

                <Textarea
                  label="Catatan Progress Kerja"
                  placeholder="Deskripsikan pekerjaan lapangan, hambatan kecil, atau target selanjutnya..."
                  value={notesVal}
                  onChange={(e) => setNotesVal(e.target.value)}
                  rows={3}
                />

                <div>
                  <label className="text-3xs font-bold text-slate-450 uppercase block mb-1">Bukti File (Mock)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Lampiran_Data_Kuantitatif.xlsx"
                    value={evidenceVal}
                    onChange={(e) => setEvidenceVal(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex gap-2 border-t pt-4 dark:border-slate-850">
                  <Button
                    onClick={handleSaveMilestone}
                    isLoading={isSaving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 shadow text-3xs font-bold"
                  >
                    <Save className="h-4 w-4" />
                    <span>Simpan</span>
                  </Button>
                  <Button
                    onClick={() => setEditingMilestoneId(null)}
                    variant="outline"
                    className="h-9 text-3xs"
                    disabled={isSaving}
                  >
                    Batal
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="bg-slate-50/40 border-slate-200/80 shadow-sm p-6 text-center text-xs text-slate-500 dark:bg-slate-900 dark:border-slate-850">
                Pilih salah satu tahapan riset di sebelah kiri untuk mulai melakukan update progress dan menambahkan catatan bukti.
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
