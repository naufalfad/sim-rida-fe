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
  Play,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Award,
  Settings
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function BridaPenelitianDetailPage() {
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
    return <LoadingState message="Memuat rincian pelaksaaan riset..." />;
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-base font-semibold">Proyek Tidak Ditemukan</h3>
        <Button onClick={() => router.push('/brida/penelitian')} className="mt-4" variant="outline">
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/brida/penelitian')}
            className="h-9 w-9 p-0 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xs font-semibold text-blue-650 dark:text-blue-400">
                {proposal.id}
              </span>
              <StatusBadge status={proposal.status} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200 mt-1 truncate max-w-sm sm:max-w-md">
              {proposal.title}
            </h1>
          </div>
        </div>

        {/* Dynamic monitoring link */}
        <div className="flex items-center gap-2">
          <Link href={`/brida/monitoring/${proposal.id}`}>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Settings className="h-4 w-4 text-slate-450" />
              <span>Buka Log Monitoring</span>
            </Button>
          </Link>
          {proposal.status === 'REPORT_SUBMITTED' && (
            <Link href={`/brida/laporan/${proposal.id}`}>
              <Button size="sm" className="bg-blue-650 hover:bg-blue-750 flex items-center gap-1 font-bold">
                <FileText className="h-4 w-4" />
                <span>Review Laporan</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Grid workspace */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: project metrics */}
        <div className="md:col-span-2 space-y-6">
          {/* Progress */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Kemajuan Pengerjaan Mitra
            </h3>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span>Riset Lapangan & Log Book</span>
                <span>{proposal.progress}% Selesai</span>
              </div>
              <ProgressIndicator value={proposal.progress} size="lg" variant={proposal.progress === 100 ? 'success' : 'primary'} />
            </div>
          </Card>

          {/* Research Plan Detail */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 dark:border-slate-855">
              Informasi Kontrak Kerja & Sasaran
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                <p className="font-bold text-slate-500 uppercase text-[9px]">Tujuan Penelitian</p>
                <p className="text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">{proposal.research?.tujuan}</p>
              </div>

              <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                <p className="font-bold text-slate-500 uppercase text-[9px]">Keluaran (Output)</p>
                <p className="text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">{proposal.research?.outputDiharapkan}</p>
              </div>

              <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                <p className="font-bold text-slate-500 uppercase text-[9px]">Dampak Hasil (Outcome)</p>
                <p className="text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">{proposal.research?.outcomeDiharapkan}</p>
              </div>

              <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                <p className="font-bold text-slate-500 uppercase text-[9px]">Indikator Keberhasilan</p>
                <p className="text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">{proposal.research?.indikator}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column: meta partner info */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 text-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850">
              Pelaksana & Pihak Terkait
            </h3>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-between dark:bg-blue-950/20 dark:text-blue-400">
                <User className="h-5 w-5 mx-auto" />
              </div>
              <div>
                <p className="font-bold text-slate-850 dark:text-slate-200">
                  {proposal.researcherName || 'Belum Ditunjuk'}
                </p>
                <p className="text-3xs text-slate-500 mt-0.5">Mitra Peneliti Utama</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-650 dark:text-slate-400">
              <div className="py-2.5 flex justify-between">
                <span>OPD Pengusul:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{proposal.opdName}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span>Durasi Pelaksanaan:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{proposal.research?.estimasiWaktu || '-'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span>Alokasi Pagu Anggaran:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Rp {Number(proposal.kak?.anggaran || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
