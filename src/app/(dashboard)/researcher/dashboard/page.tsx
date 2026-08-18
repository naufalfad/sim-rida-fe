'use client';

import React, { useState } from 'react';
import { ClipboardList, Calendar, CheckSquare, Upload, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { FileUpload } from '@/components/ui/file-upload';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { useToast } from '@/components/ui/toast';
import { WorkflowStatus } from '@/constants/status';

export default function ResearcherDashboard() {
  const { toast } = useToast();
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [researchProgress, setResearchProgress] = useState(65);

  const [activeProject, setActiveProject] = useState({
    id: 'RES-2026-001',
    title: 'Kajian Efektivitas Penanganan Stunting Terintegrasi di Wilayah Pesisir',
    kakId: 'KAK-2026-001',
    opd: 'Dinas Kesehatan',
    dueDate: '15 November 2026',
    status: 'IN_PROGRESS' as WorkflowStatus,
  });

  const handleUploadReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportFile) {
      toast('Silakan pilih file laporan terlebih dahulu.', 'warning');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast('Laporan akhir kemajuan berhasil diunggah ke BRIDA.', 'success');
      setReportFile(null);
      // Simulates status change
      setActiveProject({
        ...activeProject,
        status: 'REPORT_SUBMITTED' as WorkflowStatus,
      });
    }, 1500);
  };

  const handleIncrementProgress = () => {
    const nextVal = Math.min(researchProgress + 5, 100);
    setResearchProgress(nextVal);
    toast(`Progres penelitian diperbarui menjadi ${nextVal}%.`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Peneliti</h1>
        <p className="text-slate-550 dark:text-slate-400">
          Selamat datang di Panel SIM-RIDA Peneliti / Mitra Pelaksana Riset Daerah.
        </p>
      </div>

      {/* Grid of stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white dark:bg-slate-900 border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-550 uppercase">Riset Ditugaskan</p>
              <p className="text-2xl font-bold">1</p>
            </div>
            <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/30 text-blue-650 dark:text-blue-400 rounded-lg flex items-center justify-center">
              <ClipboardList className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-550 uppercase">Milestones Selesai</p>
              <p className="text-2xl font-bold">3 / 5</p>
            </div>
            <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
              <CheckSquare className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-555 uppercase">Sisa Waktu Pengerjaan</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">90 Hari</p>
            </div>
            <div className="h-10 w-10 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main split view */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Project info card */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Tugas Penelitian Berjalan</CardTitle>
                <CardDescription>
                  Detail penugasan riset dari BRIDA.
                </CardDescription>
              </div>
              <StatusBadge status={activeProject.status} />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {activeProject.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Klien/OPD: <strong>{activeProject.opd}</strong> | No. KAK: {activeProject.kakId}
                </p>
              </div>

              {/* Progress Indicator component */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span>Progres Kumulatif Penelitian</span>
                  <span>{researchProgress}%</span>
                </div>
                <ProgressIndicator value={researchProgress} size="md" variant="primary" />
                <div className="flex justify-end pt-1">
                  <Button variant="outline" size="sm" onClick={handleIncrementProgress}>
                    Perbarui Progres (+5%)
                  </Button>
                </div>
              </div>

              {/* Research Scope */}
              <div className="space-y-3">
                <h5 className="text-sm font-bold flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span>Cakupan & Luaran (Output) Riset</span>
                </h5>
                <ul className="text-xs space-y-2 text-slate-655 dark:text-slate-400 pl-4 list-disc">
                  <li>Kuesioner responden di 4 kecamatan pesisir (Target: 200 responden).</li>
                  <li>Laporan kemajuan pengolahan data stunting.</li>
                  <li>Laporan Akhir Kajian Ilmiah terverifikasi reviewer BRIDA.</li>
                  <li>Draf Policy Brief berisi rekomendasi teknis intervensi program stunting.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Laporan Form card */}
        <div>
          <Card className="bg-white dark:bg-slate-900 border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Unggah Laporan Hasil</CardTitle>
              <CardDescription>
                Unggah draf atau hasil laporan penelitian Anda untuk diverifikasi reviewer BRIDA.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadReport} className="space-y-4">
                <FileUpload
                  label="Laporan Akhir (PDF)"
                  value={reportFile}
                  onChange={setReportFile}
                  accept=".pdf"
                  helperText="File berformat PDF maksimal 10MB"
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isSubmitting}
                  disabled={!reportFile}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Kirim Laporan
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
