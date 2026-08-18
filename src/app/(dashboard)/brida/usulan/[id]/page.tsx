'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  FileCheck,
  User,
  Clock,
  HelpCircle,
  AlertTriangle,
  Play,
  ArrowRight,
  ShieldCheck,
  Eye,
  FolderLock,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function BridaUsulanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('problem');

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const data = await proposalService.getProposalById(proposalId);
        setProposal(data);
      } catch (err) {
        console.error('Failed to load proposal details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [proposalId]);

  if (isLoading) {
    return <LoadingState message="Memuat detail usulan riset daerah..." />;
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-base font-semibold">Usulan Tidak Ditemukan</h3>
        <p className="mt-2 text-sm text-slate-500">ID usulan tidak terdaftar.</p>
        <Button onClick={() => router.push('/brida/usulan')} className="mt-4" variant="outline">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  // Get action link details based on status
  const getBridaAction = () => {
    switch (proposal.status) {
      case 'SUBMITTED':
        return {
          label: 'Lakukan Verifikasi Dokumen',
          path: `/brida/verifikasi/${proposal.id}`,
          icon: <ShieldCheck className="h-4 w-4 mr-2" />,
        };
      case 'ADMINISTRATIVE_REVIEW':
      case 'SUBSTANTIVE_REVIEW':
        return {
          label: 'Beri Penilaian & Review',
          path: `/brida/review/${proposal.id}`,
          icon: <Eye className="h-4 w-4 mr-2" />,
        };
      case 'SCORING':
      case 'SELECTION_RECOMMENDED':
        return {
          label: 'Lakukan Seleksi Prioritas',
          path: `/brida/seleksi/${proposal.id}`,
          icon: <FolderLock className="h-4 w-4 mr-2" />,
        };
      case 'APPROVED':
      case 'RESEARCHER_SELECTION':
        return {
          label: 'Tunjuk Mitra Peneliti',
          path: `/brida/peneliti/${proposal.id}`, // can redirect to researcher assignment
          icon: <User className="h-4 w-4 mr-2" />,
        };
      case 'REPORT_SUBMITTED':
        return {
          label: 'Review Laporan Akhir',
          path: `/brida/laporan/${proposal.id}`,
          icon: <FileCheck className="h-4 w-4 mr-2" />,
        };
      case 'IN_PROGRESS':
      case 'MONITORING':
        return {
          label: 'Monitoring Pelaksanaan',
          path: `/brida/monitoring/${proposal.id}`,
          icon: <Play className="h-4 w-4 mr-2" />,
        };
      default:
        return null;
    }
  };

  const bridaAction = getBridaAction();
  const tabsItems = [
    { id: 'problem', label: '1. Usulan Masalah', icon: <FileText className="h-4 w-4" /> },
    { id: 'research', label: '2. Usulan Penelitian', icon: <Clock className="h-4 w-4" /> },
    { id: 'kak', label: '3. Kerangka Acuan (KAK)', icon: <CheckCircle className="h-4 w-4" /> },
  ];

  if (proposal.approvalHistory && proposal.approvalHistory.length > 0) {
    tabsItems.push({ id: 'history', label: '4. Riwayat Keputusan', icon: <ShieldCheck className="h-4 w-4" /> });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/brida/usulan')}
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

        {/* BRIDA Quick Action button */}
        {bridaAction && (
          <Link href={bridaAction.path}>
            <Button className="bg-blue-650 hover:bg-blue-750 text-white font-bold flex items-center gap-1.5 shadow-sm animate-pulse">
              {bridaAction.icon}
              <span>{bridaAction.label}</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        )}
      </div>

      {/* Visual Timeline Tracking */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 overflow-hidden">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
          Linimasa Tracking Usulan Riset
        </h3>
        
        <div className="relative flex flex-col md:flex-row md:justify-between gap-6 md:gap-4 md:items-center">
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-250 dark:bg-slate-800 hidden md:block z-0" />

          {proposal.timeline.map((step, idx) => {
            const isDone = step.isCompleted;
            const isActive = proposal.status === step.status || (!isDone && idx === proposal.timeline.findIndex(t => !t.isCompleted));
            
            return (
              <div key={idx} className="relative flex items-start md:flex-col md:items-center gap-3 md:gap-2 z-10 md:flex-1">
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-between border-2 transition-all ${
                    isDone
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isActive
                      ? 'bg-blue-600 border-blue-600 text-white animate-pulse'
                      : 'bg-white dark:bg-slate-900 border-slate-350 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle className="h-5 w-5 mx-auto" />
                  ) : isActive ? (
                    <Clock className="h-5 w-5 mx-auto" />
                  ) : (
                    <HelpCircle className="h-5 w-5 mx-auto" />
                  )}
                </div>

                <div className="md:text-center">
                  <p className={`text-xs font-bold ${isActive ? 'text-blue-600 dark:text-blue-450' : 'text-slate-850 dark:text-slate-200'}`}>
                    {step.label}
                  </p>
                  <div className="flex flex-wrap md:justify-center items-center gap-1.5 text-3xs text-slate-500 mt-0.5">
                    {step.date && <span>{step.date}</span>}
                    {step.date && step.actor && <span>•</span>}
                    {step.actor && <span>{step.actor}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Detail Tabs bar */}
      <Tabs tabs={tabsItems} activeTab={activeTab} onChange={setActiveTab} variant="pill" />

      {/* Details content */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6">
        {/* TAB 1: USULAN MASALAH */}
        {activeTab === 'problem' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
              <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Judul Masalah</p>
              <p className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-1">{proposal.problem.judul}</p>
            </div>
            <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
              <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Bidang Kajian</p>
              <p className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-1">{proposal.problem.bidang}</p>
            </div>
            <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
              <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">OPD Pengusul</p>
              <p className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-1">{proposal.problem.opd}</p>
            </div>
            <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
              <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Target Penyelesaian</p>
              <p className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-1">{proposal.problem.targetPenyelesaian}</p>
            </div>
            <div className="sm:col-span-2 p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
              <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Latar Belakang</p>
              <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 whitespace-pre-line leading-relaxed">{proposal.problem.latarBelakang}</p>
            </div>
            <div className="sm:col-span-2 p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
              <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Fokus Masalah Utama</p>
              <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 whitespace-pre-line leading-relaxed">{proposal.problem.masalahUtama}</p>
            </div>
            <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
              <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Dampak Jika Dibiarkan</p>
              <p className="text-xs text-slate-700 dark:text-slate-350 mt-1">{proposal.problem.dampak}</p>
            </div>
            <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
              <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Urgensi</p>
              <p className="text-xs text-slate-700 dark:text-slate-350 mt-1">{proposal.problem.urgensi}</p>
            </div>
          </div>
        )}

        {/* TAB 2: RESEARCH DETAILS */}
        {activeTab === 'research' && (
          <div className="grid gap-4 sm:grid-cols-2">
            {!proposal.research ? (
              <div className="sm:col-span-2 text-center py-6 text-slate-500 text-xs">
                Rencana penelitian belum disusun oleh OPD pengusul.
              </div>
            ) : (
              <>
                <div className="sm:col-span-2 p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Judul Penelitian</p>
                  <p className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-1">{proposal.research.judul}</p>
                </div>
                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Tujuan Utama</p>
                  <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 whitespace-pre-line">{proposal.research.tujuan}</p>
                </div>
                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Pertanyaan Riset</p>
                  <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 whitespace-pre-line">{proposal.research.pertanyaanPenelitian}</p>
                </div>
                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Ruang Lingkup</p>
                  <p className="text-xs text-slate-850 dark:text-slate-200 mt-1">{proposal.research.ruangLingkup}</p>
                </div>
                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Estimasi Waktu</p>
                  <p className="text-xs text-slate-850 dark:text-slate-200 mt-1">{proposal.research.estimasiWaktu}</p>
                </div>
                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Output (Keluaran)</p>
                  <p className="text-xs text-slate-750 dark:text-slate-350 mt-1">{proposal.research.outputDiharapkan}</p>
                </div>
                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Outcome (Hasil)</p>
                  <p className="text-xs text-slate-750 dark:text-slate-350 mt-1">{proposal.research.outcomeDiharapkan}</p>
                </div>
                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Indikator Kinerja</p>
                  <p className="text-xs text-slate-850 dark:text-slate-200 mt-1">{proposal.research.indikator}</p>
                </div>
                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Estimasi Anggaran</p>
                  <p className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-1">Rp {Number(proposal.research.estimasiAnggaran).toLocaleString('id-ID')}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: KAK / TOR */}
        {activeTab === 'kak' && (
          <div className="grid gap-4 sm:grid-cols-2">
            {!proposal.kak ? (
              <div className="sm:col-span-2 text-center py-6 text-slate-500 text-xs">
                Kerangka Acuan Kerja (KAK) belum disusun oleh OPD pengusul.
              </div>
            ) : (
              <>
                <div className="sm:col-span-2 p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Identitas KAK</p>
                  <p className="text-xs font-bold text-slate-855 dark:text-slate-205 mt-1">{proposal.kak.identitas}</p>
                </div>
                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider font-bold">Landasan Regulasi</p>
                  <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 whitespace-pre-line">{proposal.kak.dasarPemikiran}</p>
                </div>
                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Maksud & Tujuan KAK</p>
                  <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 whitespace-pre-line">{proposal.kak.maksudTujuan}</p>
                </div>
                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Metodologi Riset KAK</p>
                  <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 whitespace-pre-line">{proposal.kak.metodologi}</p>
                </div>
                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Jadwal Pelaksanaan</p>
                  <p className="text-xs text-slate-850 dark:text-slate-200 mt-1">{proposal.kak.jadwal}</p>
                </div>
                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Alokasi Anggaran KAK</p>
                  <p className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-1">Rp {Number(proposal.kak.anggaran).toLocaleString('id-ID')}</p>
                </div>
                <div className="sm:col-span-2 p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Penutup KAK</p>
                  <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 leading-relaxed">{proposal.kak.penutup}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 4: RIWAYAT KEPUTUSAN */}
        {activeTab === 'history' && proposal.approvalHistory && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Log Persetujuan & Justifikasi Kepala BRIDA
            </h4>
            <div className="space-y-3">
              {proposal.approvalHistory.map((history, idx) => (
                <div key={idx} className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800 flex flex-col md:flex-row justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{history.actor}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        history.action === 'APPROVE' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : history.action === 'REJECT' 
                          ? 'bg-red-50 text-red-700' 
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {history.action === 'APPROVE' ? 'Disetujui' : history.action === 'REJECT' ? 'Ditolak' : 'Dikembangkan'}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mt-1.5 italic">&ldquo;{history.comment}&rdquo;</p>
                  </div>
                  <span className="text-[10px] text-slate-400 self-start md:self-center font-mono">{history.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
