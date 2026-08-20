'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  Clock,
  PlayCircle,
  FileText,
  FileCheck,
  CheckCircle,
  Download,
  AlertTriangle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function OpdPenelitianDetailPage() {
  const router = useRouter();
  const params = useParams();
  const researchId = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const data = await proposalService.getProposalById(researchId);
        setProposal(data);
      } catch (err) {
        console.error('Failed to load project details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [researchId]);

  if (isLoading) {
    return <LoadingState message="Memuat detail pelaksanaan riset..." />;
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-base font-semibold">Proyek Tidak Ditemukan</h3>
        <p className="mt-2 text-sm text-slate-500">ID penelitian tidak terdaftar di sistem.</p>
        <Button onClick={() => router.push('/opd/penelitian')} className="mt-4" variant="outline">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  // Pre-define mock milestones for demonstration based on current progress
  const milestones = [
    { title: 'Persiapan & Kick-Off Meeting', desc: 'Rapat koordinasi awal OPD dan tim mitra pelaksana riset.', progress: 100, date: '10 Agt 2026' },
    { title: 'Pengumpulan Data Lapangan (Kuesioner)', desc: 'Survei dan wawancara primer di wilayah cakupan kajian.', progress: proposal.progress >= 50 ? 100 : proposal.progress * 2, date: '18 Agt 2026' },
    { title: 'Draft Laporan Pendahuluan (Interim Report)', desc: 'Penyerahan kompilasi data mentah awal hasil survei.', progress: proposal.progress >= 75 ? 100 : 0, date: proposal.progress >= 75 ? '25 Agt 2026' : 'Akan datang' },
    { title: 'Laporan Akhir Kajian (Final Report)', desc: 'Laporan riset akhir komprehensif beserta naskah rekomendasi.', progress: proposal.progress >= 95 ? 100 : 0, date: proposal.progress >= 95 ? '10 Sep 2026' : 'Akan datang' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top action header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/opd/penelitian')}
          className="h-9 w-9 p-0 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-blue-650 dark:text-blue-400">
              {proposal.id}
            </span>
            <StatusBadge status={proposal.status} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200 mt-1 truncate max-w-sm sm:max-w-md">
            {proposal.title}
          </h1>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Progress & Milestones */}
        <div className="md:col-span-2 space-y-6">
          {/* Progress Card */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Kemajuan Riset</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span>Riset Lapangan & Penyusunan Dokumen</span>
                <span className="font-mono text-sm">{proposal.progress}% Selesai</span>
              </div>
              <ProgressIndicator value={proposal.progress} size="lg" variant={proposal.progress === 100 ? 'success' : 'primary'} />
            </div>
          </Card>

          {/* Milestones Card */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6">Milestone & Capaian</h3>
            <div className="space-y-6 relative border-l border-slate-100 dark:border-slate-800 pl-6 ml-3">
              {milestones.map((m, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline indicator node */}
                  <span className={`absolute -left-[35px] top-0.5 h-4 w-4 rounded-full border-2 ${
                    m.progress === 100
                      ? 'bg-emerald-500 border-emerald-500'
                      : m.progress > 0
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white dark:bg-slate-900 border-slate-350 dark:border-slate-850'
                  }`} />
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.title}</h4>
                      <span className="text-[10px] font-semibold text-slate-450">{m.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{m.desc}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-semibold text-slate-400">Progres Tahapan:</span>
                      <span className={`text-[10px] font-bold ${m.progress === 100 ? 'text-emerald-600' : m.progress > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                        {m.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Researcher & Study Meta */}
        <div className="space-y-6">
          {/* Partner Info */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 text-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850">
              Mitra Peneliti Riset
            </h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-between dark:bg-blue-950/20 dark:text-blue-400">
                <User className="h-5 w-5 mx-auto" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {proposal.eKatalogDesc || 'E-Katalog Belum Dipilih'}
                </p>
                <p className="text-3xs text-slate-500 mt-0.5">Vendor / Solusi E-Katalog</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-650 dark:text-slate-400">
              <div className="py-2.5 flex justify-between">
                <span>Durasi Riset:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{proposal.research?.estimasiWaktu || '-'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span>Estimasi Anggaran:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Rp {Number(proposal.research?.estimasiAnggaran).toLocaleString('id-ID')}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span>Bidang:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{proposal.problem.bidang}</span>
              </div>
            </div>
          </Card>

          {/* Deliverables / Dokumen */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 text-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850">
              Dokumen Hasil Luaran
            </h3>
            <div className="space-y-3">
              {proposal.progress >= 75 ? (
                <div className="flex items-center justify-between p-2.5 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-3xs">interim_report_{proposal.id.toLowerCase()}.pdf</p>
                      <p className="text-[10px] text-slate-500">Laporan Pendahuluan</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-slate-500 text-center py-4">Belum ada berkas luaran.</p>
              )}

              {['OPD_REPORTED', 'POLICY_BRIEF_DRAFT', 'POLICY_BRIEF_REVIEW', 'RECOMMENDATION_PENDING', 'RECOMMENDATION_APPROVED', 'FOLLOW_UP_PENDING', 'FOLLOW_UP_IN_PROGRESS', 'FOLLOW_UP_COMPLETED'].includes(proposal.status) ? (
                <div className="flex items-center justify-between p-2.5 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-3xs">final_report_{proposal.id.toLowerCase()}.pdf</p>
                      <p className="text-[10px] text-slate-500">Laporan Hasil Akhir</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-emerald-600">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
