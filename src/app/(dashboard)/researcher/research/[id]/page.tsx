'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  BookOpen,
  DollarSign,
  Users,
  FileText,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function ResearcherResearchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kak');

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const data = await proposalService.getProposalById(proposalId);
        setProposal(data);
      } catch (err) {
        console.error('Failed to load researcher project details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [proposalId]);

  if (isLoading) {
    return <LoadingState message="Memuat berkas kajian riset..." />;
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-base font-semibold">Proyek Tidak Ditemukan</h3>
        <Button onClick={() => router.push('/researcher/research')} className="mt-4" variant="outline">
          Kembali
        </Button>
      </div>
    );
  }

  // Mock research team members based on the researcher's institution
  const mockTeam = [
    { name: proposal.researcherName || 'Prof. Dr. Anton Wibowo', role: 'Principal Investigator (PI)', institution: proposal.kak?.identitas ? 'Institut Teknologi Bandung (ITB)' : 'Universitas Indonesia (UI)' },
    { name: 'Dr. Hermawan Kartajaya', role: 'Co-Investigator / Pakar Bidang', institution: 'Kementerian Riset Daerah' },
    { name: 'Siti Rahmawati, M.Sc.', role: 'Senior Data Analyst', institution: 'Pusat Riset Wilayah' },
    { name: 'Andi Wijaya', role: 'Field Surveyor Coordinator', institution: 'Pusat Riset Wilayah' }
  ];

  const tabsItems = [
    { id: 'kak', label: 'Kerangka Acuan (KAK)', icon: <FileText className="h-4 w-4" /> },
    { id: 'scope', label: 'Ruang Lingkup & Target', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'team', label: 'Anggota Tim Riset', icon: <Users className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 dark:border-slate-850">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/researcher/research')}
            className="h-9 w-9 p-0 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xs font-bold text-blue-650 dark:text-blue-400">
                Proyek / {proposal.id}
              </span>
              <StatusBadge status={proposal.status} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-850 dark:text-slate-205 mt-0.5 truncate max-w-sm sm:max-w-md">
              {proposal.title}
            </h1>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => router.push('/researcher/milestones')}
            variant="outline"
            size="sm"
            className="h-8 text-2xs flex items-center gap-1.5"
          >
            <Clock className="h-4 w-4" />
            <span>Update Milestone</span>
          </Button>
          <Button
            onClick={() => router.push('/researcher/reports')}
            size="sm"
            className="h-8 text-2xs bg-blue-600 hover:bg-blue-700 font-bold flex items-center gap-1.5"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Submit Laporan</span>
          </Button>
        </div>
      </div>

      {/* Linimasa / Status visual */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 overflow-hidden">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">
          Progress & Linimasa Proyek Riset
        </h3>
        
        <div className="relative flex flex-col md:flex-row md:justify-between gap-6 md:gap-4 md:items-center">
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-250 dark:bg-slate-800 hidden md:block z-0" />

          {proposal.timeline.slice(-4).map((step, idx) => {
            const isDone = step.isCompleted;
            const isActive = proposal.status === step.status;
            
            return (
              <div key={idx} className="relative flex items-start md:flex-col md:items-center gap-3 md:gap-2 z-10 md:flex-1">
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-between border-2 transition-all ${
                    isDone
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isActive
                      ? 'bg-blue-650 border-blue-650 text-white animate-pulse'
                      : 'bg-white dark:bg-slate-900 border-slate-350 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle className="h-5 w-5 mx-auto" />
                  ) : (
                    <Clock className="h-5 w-5 mx-auto" />
                  )}
                </div>

                <div className="md:text-center">
                  <p className="text-xs font-bold text-slate-850 dark:text-slate-200">
                    {step.label}
                  </p>
                  <p className="text-3xs text-slate-500 mt-0.5">
                    {step.date} | {step.actor}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Tabs */}
      <Tabs tabs={tabsItems} activeTab={activeTab} onChange={setActiveTab} variant="pill" />

      {/* Main card */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6">
        {/* TAB 1: KAK */}
        {activeTab === 'kak' && (
          <div className="space-y-4">
            {proposal.kak ? (
              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="sm:col-span-2 p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="font-bold text-slate-450 uppercase text-[9px]">Identitas Dokumen Kerja</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{proposal.kak.identitas}</p>
                </div>
                
                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="font-bold text-slate-450 uppercase text-[9px]">Maksud & Tujuan Kajian</p>
                  <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed whitespace-pre-line">{proposal.kak.maksudTujuan}</p>
                </div>

                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="font-bold text-slate-450 uppercase text-[9px]">Metodologi Penelitian</p>
                  <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed whitespace-pre-line">{proposal.kak.metodologi}</p>
                </div>

                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="font-bold text-slate-450 uppercase text-[9px]">Landasan Hukum / Dasar Pemikiran</p>
                  <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed whitespace-pre-line">{proposal.kak.dasarPemikiran}</p>
                </div>

                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-slate-450 uppercase text-[9px]">Anggaran Kajian (Pagu)</p>
                    <p className="text-sm font-mono font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                      Rp {Number(proposal.kak.anggaran).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="mt-4 text-3xs text-slate-400">
                    Jadwal Kerja: {proposal.kak.jadwal}
                  </div>
                </div>

                <div className="sm:col-span-2 p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="font-bold text-slate-450 uppercase text-[9px]">Latar Belakang Kajian</p>
                  <p className="text-slate-700 dark:text-slate-350 mt-1 leading-relaxed">{proposal.kak.latarBelakang}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Dokumen KAK belum tersedia.</p>
            )}
          </div>
        )}

        {/* TAB 2: SCOPE & TARGET */}
        {activeTab === 'scope' && (
          <div className="space-y-4">
            {proposal.research ? (
              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="font-bold text-slate-450 uppercase text-[9px]">Ruang Lingkup Kajian</p>
                  <p className="text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">{proposal.research.ruangLingkup}</p>
                </div>

                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="font-bold text-slate-450 uppercase text-[9px]">Tujuan Penelitian</p>
                  <p className="text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">{proposal.research.tujuan}</p>
                </div>

                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="font-bold text-slate-450 uppercase text-[9px]">Keluaran yang Diharapkan (Output)</p>
                  <p className="text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">{proposal.research.outputDiharapkan}</p>
                </div>

                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                  <p className="font-bold text-slate-450 uppercase text-[9px]">Dampak Hasil Kajian (Outcome)</p>
                  <p className="text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">{proposal.research.outcomeDiharapkan}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Spesifikasi riset belum diisi.</p>
            )}
          </div>
        )}

        {/* TAB 3: TEAM MEMBERS */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Daftar Anggota Tim Pelaksana Kajian
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {mockTeam.map((member, idx) => (
                <div key={idx} className="p-4 border rounded-lg bg-slate-50/50 dark:bg-slate-955 dark:border-slate-850 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-between dark:bg-blue-950/20 dark:text-blue-450">
                    <Users className="h-5 w-5 mx-auto" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{member.name}</p>
                    <p className="text-3xs text-slate-450 mt-0.5">{member.role}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{member.institution}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
