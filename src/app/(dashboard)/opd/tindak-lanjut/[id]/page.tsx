'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  FileCheck,
  PlusCircle,
  TrendingUp,
  Download,
  AlertTriangle,
  Send,
  Plus
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { FollowUp } from '@/types/proposals';

export default function OpdTindakLanjutDetailPage() {
  const router = useRouter();
  const params = useParams();
  const followUpId = params.id as string;
  const { toast } = useToast();

  const [followUp, setFollowUp] = useState<FollowUp | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states for creating Action Plan
  const [actionPlanText, setActionPlanText] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [isPlanSaving, setIsPlanSaving] = useState(false);

  // Form states for reporting log progress
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [logDesc, setLogDesc] = useState('');
  const [logProgress, setLogProgress] = useState<number>(0);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isLogSaving, setIsLogSaving] = useState(false);

  const loadFollowUpDetails = async () => {
    try {
      const data = await proposalService.getFollowUpById(followUpId);
      if (data) {
        setFollowUp(data);
        setActionPlanText(data.actionPlan || '');
        setTargetDate(data.targetDate || '');
        setLogProgress(data.progress);
      }
    } catch (err) {
      console.error('Failed to load followup detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFollowUpDetails();
  }, [followUpId]);

  if (isLoading) {
    return <LoadingState message="Memuat detail rencana aksi..." />;
  }

  if (!followUp) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-base font-semibold">Rencana Aksi Tidak Ditemukan</h3>
        <p className="mt-2 text-sm text-slate-500">ID tindak lanjut tidak terdaftar.</p>
        <Button onClick={() => router.push('/opd/tindak-lanjut')} className="mt-4" variant="outline">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  // Handle action plan submission
  const handleSaveActionPlan = async () => {
    if (!actionPlanText || !targetDate) {
      toast('Mohon lengkapi rencana aksi dan target tanggal selesai.', 'error');
      return;
    }

    setIsPlanSaving(true);
    try {
      const updated = await proposalService.updateFollowUp(followUp.id, actionPlanText, targetDate);
      if (updated) {
        setFollowUp(updated);
        toast('Rencana aksi tindak lanjut berhasil disahkan.', 'success');
      }
    } catch {
      toast('Gagal menyimpan rencana aksi.', 'error');
    } finally {
      setIsPlanSaving(false);
    }
  };

  // Handle reporting progress log
  const handleReportProgress = async () => {
    if (!logDesc) {
      toast('Mohon tulis deskripsi progress realisasi.', 'error');
      return;
    }
    if (logProgress < followUp.progress) {
      toast(`Persentase kemajuan tidak boleh lebih kecil dari sebelumnya (${followUp.progress}%).`, 'error');
      return;
    }

    setIsLogSaving(true);
    try {
      const updated = await proposalService.addFollowUpLog(
        followUp.id,
        logDesc,
        logProgress,
        evidenceFile ? evidenceFile.name : undefined
      );

      if (updated) {
        setFollowUp(updated);
        setLogDesc('');
        setEvidenceFile(null);
        setIsLogDialogOpen(false);
        toast('Laporan progress realisasi berhasil disubmit.', 'success');
      }
    } catch {
      toast('Gagal melaporkan progress.', 'error');
    } finally {
      setIsLogSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top action header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/opd/tindak-lanjut')}
            className="h-9 w-9 p-0 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-blue-650 dark:text-blue-400">
                {followUp.id}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  followUp.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                    : followUp.status === 'IN_PROGRESS'
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-450'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                }`}
              >
                {followUp.status === 'PENDING' ? 'BUTUH RENCANA AKSI' : followUp.status === 'IN_PROGRESS' ? 'PELAKSANAAN' : 'SELESAI'}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200 mt-1 truncate max-w-sm sm:max-w-md">
              {followUp.title}
            </h1>
          </div>
        </div>

        {/* Report progress trigger */}
        {followUp.status !== 'PENDING' && followUp.status !== 'COMPLETED' && (
          <Button
            onClick={() => setIsLogDialogOpen(true)}
            size="sm"
            className="bg-blue-650 hover:bg-blue-750 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Lapor Realisasi</span>
          </Button>
        )}
      </div>

      {/* Main Grid Workspace */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: recommendation text & forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Readonly Recommendation Text */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Rekomendasi Kebijakan BRIDA (Disahkan)
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-350 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-lg border border-slate-150 dark:border-slate-850 font-medium leading-relaxed italic">
              &ldquo;{followUp.recommendationText}&rdquo;
            </p>
          </Card>

          {/* Action Plan Setup Form or details */}
          {followUp.status === 'PENDING' ? (
            <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Susun Rencana Aksi Tindak Lanjut
              </h3>
              
              <Textarea
                label="Uraian Rencana Aksi (Action Plan)"
                placeholder="Jelaskan langkah konkret fisik, anggaran, atau program regulasi yang akan dijalankan OPD Anda untuk merealisasikan rekomendasi di atas."
                value={actionPlanText}
                onChange={(e) => setActionPlanText(e.target.value)}
                rows={4}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Target Selesai Realisasi"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>

              <div className="border-t pt-4 flex justify-end dark:border-slate-850">
                <Button onClick={handleSaveActionPlan} isLoading={isPlanSaving} className="bg-blue-650 hover:bg-blue-750">
                  <FileCheck className="h-4 w-4 mr-2" />
                  <span>Sahkan Rencana Aksi</span>
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Rencana Aksi OPD Yang Disepakati
              </h3>
              <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800 space-y-3">
                <div>
                  <p className="text-3xs font-bold text-slate-400 uppercase">Uraian Kegiatan</p>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold mt-1 leading-relaxed">
                    {followUp.actionPlan}
                  </p>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold pt-2 border-t dark:border-slate-850">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Target Penyelesaian: {new Date(followUp.targetDate || '').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Realization Logs Timeline */}
          {followUp.status !== 'PENDING' && (
            <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6">
                Catatan & Bukti Realisasi Fisik
              </h3>

              {followUp.logs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  Belum ada log realisasi. Klik &quot;Lapor Realisasi&quot; untuk mengirim progress pertama.
                </p>
              ) : (
                <div className="space-y-6 relative border-l border-slate-100 dark:border-slate-800 pl-6 ml-3">
                  {followUp.logs.map((log) => (
                    <div key={log.id} className="relative">
                      {/* Node point */}
                      <span className="absolute -left-[33px] top-0.5 h-3 w-3 rounded-full bg-blue-500 border border-white dark:border-slate-900" />
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start gap-4">
                          <span className="text-[10px] font-mono font-bold text-slate-450">{log.date}</span>
                          <span className="text-[10px] font-bold text-emerald-600">Realisasi: {log.progress}%</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                          {log.description}
                        </p>
                        {log.evidenceFile && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-3xs text-slate-400 font-semibold">Bukti Fisik:</span>
                            <span className="text-3xs font-semibold text-blue-650 hover:underline cursor-pointer flex items-center gap-0.5">
                              📄 {log.evidenceFile}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right column: follow-up indicators */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 text-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850">
              Indikator Penyelesaian
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-2xs font-semibold text-slate-500">
                <span>Persentase Realisasi Rencana</span>
                <span>{followUp.progress}% Selesai</span>
              </div>
              <ProgressIndicator value={followUp.progress} size="lg" variant={followUp.progress === 100 ? 'success' : 'primary'} />
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-650 dark:text-slate-400">
              <div className="py-2.5 flex justify-between">
                <span>OPD Pelaksana:</span>
                <span className="font-bold text-slate-850 dark:text-slate-200">{followUp.opdName}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span>Total Laporan Realisasi:</span>
                <span className="font-bold text-slate-850 dark:text-slate-200">{followUp.logs.length} berkas</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Report progress log dialog */}
      <Dialog
        isOpen={isLogDialogOpen}
        onClose={() => setIsLogDialogOpen(false)}
        title="Lapor Realisasi Tindak Lanjut"
        description="Masukkan deskripsi aktivitas penyelesaian beserta persentase peningkatan progres terbaru."
        footer={
          <>
            <Button onClick={handleReportProgress} variant="primary" size="sm" isLoading={isLogSaving}>
              Kirim Laporan
            </Button>
            <Button onClick={() => setIsLogDialogOpen(false)} variant="outline" size="sm">
              Batal
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Deskripsi Progress Realisasi"
            placeholder="Contoh: Mengirim surat penunjukan penyusunan spek teknis mesin LPSE..."
            value={logDesc}
            onChange={(e) => setLogDesc(e.target.value)}
            rows={3}
          />

          <div className="space-y-1">
            <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
              Persentase Progress Realisasi Baru (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={followUp.progress}
                max="100"
                step="5"
                value={logProgress}
                onChange={(e) => setLogProgress(Number(e.target.value))}
                className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-800 accent-blue-600"
              />
              <span className="font-mono font-bold text-xs w-12 text-right">{logProgress}%</span>
            </div>
            <p className="text-[10px] text-slate-450 italic mt-1">
              *Minimal sama dengan progres sebelumnya ({followUp.progress}%)
            </p>
          </div>

          <FileUpload
            label="Unggah Berkas Bukti Fisik (PDF/JPG)"
            value={evidenceFile}
            onChange={setEvidenceFile}
          />
        </div>
      </Dialog>
    </div>
  );
}
