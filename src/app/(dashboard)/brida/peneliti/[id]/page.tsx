'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  GraduationCap,
  Award,
  BookOpen,
  UserCheck,
  AlertTriangle,
  Play
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';
import { Researcher } from '@/types/brida';

export default function BridaPenelitiDetailPage() {
  const router = useRouter();
  const params = useParams();
  const researcherId = params.id as string;
  const { toast } = useToast();

  const [researcher, setResearcher] = useState<Researcher | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProposalId, setSelectedProposalId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const loadData = async () => {
    try {
      const res = await proposalService.getResearcherById(researcherId);
      setResearcher(res);

      const pList = await proposalService.getProposals();
      // Filter out studies that are approved and ready for researcher selection
      const approvedList = pList.filter(
        (p) => p.status === 'APPROVED' || p.status === 'RESEARCHER_SELECTION'
      );
      setProposals(approvedList);
      if (approvedList.length > 0) {
        setSelectedProposalId(approvedList[0].id);
      }
    } catch (err) {
      console.error('Failed to load researcher assignment details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [researcherId]);

  if (isLoading) {
    return <LoadingState message="Memuat profil mitra peneliti..." />;
  }

  if (!researcher) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-base font-semibold">Peneliti Tidak Ditemukan</h3>
        <Button onClick={() => router.push('/brida/peneliti')} className="mt-4" variant="outline">
          Kembali
        </Button>
      </div>
    );
  }

  const handleAssignProject = async () => {
    if (!selectedProposalId) {
      toast('Mohon pilih proyek penelitian yang disetujui terlebih dahulu.', 'error');
      return;
    }

    setIsAssigning(true);
    try {
      const updated = await proposalService.assignResearcher(selectedProposalId, researcher.id);
      if (updated) {
        toast(`Berhasil menugaskan ${researcher.name} ke kajian ${selectedProposalId}!`, 'success');
        // Reload details to show updated state
        await loadData();
      }
    } catch {
      toast('Gagal melakukan penetapan peneliti.', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/brida/peneliti')}
          className="h-9 w-9 p-0 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <span className="font-mono text-2xs font-bold text-slate-400">
            Profil Pakar / {researcher.id}
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200 mt-0.5">
            {researcher.name}
          </h1>
        </div>
      </div>

      {/* Grid workspace */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: profile info, background research */}
        <div className="md:col-span-2 space-y-6">
          {/* Institution card */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-between dark:bg-blue-950/20 dark:text-blue-400">
                <GraduationCap className="h-6 w-6 mx-auto" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{researcher.institution}</h4>
                <p className="text-xs text-slate-500 font-semibold">{researcher.expertise}</p>
              </div>
            </div>
          </Card>

          {/* Academic Background / Previous Research */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-4">
              Riwayat Riset Daerah Sebelumnya
            </h3>
            <div className="space-y-4">
              {researcher.previousResearch.map((res, idx) => (
                <div key={idx} className="flex gap-3 items-start text-xs border-b pb-3 last:border-0 last:pb-0 dark:border-slate-850">
                  <div className="p-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded">
                    {res.year}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-slate-200">{res.title}</h5>
                    <p className="text-3xs text-slate-500 mt-0.5">Peran: {res.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column: active study assignment */}
        <div className="space-y-6">
          {researcher.assignedResearchId ? (
            <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850">
                Tugas Riset Aktif
              </h3>
              <div className="p-3 border rounded-lg bg-emerald-50/10 border-emerald-100 text-xs space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-blue-650 dark:text-blue-400">{researcher.assignedResearchId}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                    IN_PROGRESS
                  </span>
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                  {researcher.assignedResearchTitle}
                </p>
                <Link href={`/brida/monitoring/${researcher.assignedResearchId}`} className="block pt-2">
                  <Button variant="outline" size="sm" className="w-full text-2xs h-8 flex items-center justify-center gap-1">
                    <Play className="h-3.5 w-3.5 text-slate-400" />
                    <span>Buka Monitoring</span>
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850">
                Penugasan Riset Baru
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pakar ini tersedia untuk menerima penugasan baru. Pilih dari daftar kajian yang lolos seleksi prioritas.
              </p>

              {proposals.length === 0 ? (
                <p className="text-xs text-slate-500 font-semibold text-center py-4 bg-slate-50 rounded">
                  Tidak ada kajian approved menanti mitra.
                </p>
              ) : (
                <div className="space-y-4 pt-2">
                  <Select
                    label="Pilih Kajian Prioritas"
                    options={proposals.map((p) => ({
                      value: p.id,
                      label: `[${p.id}] ${p.title.substring(0, 45)}...`,
                    }))}
                    value={selectedProposalId}
                    onChange={(e) => setSelectedProposalId(e.target.value)}
                    className="bg-white dark:bg-slate-950 dark:border-slate-800 border-slate-300"
                  />

                  <Button
                    onClick={handleAssignProject}
                    isLoading={isAssigning}
                    className="w-full bg-blue-650 hover:bg-blue-750 text-white flex items-center justify-center gap-1.5 shadow"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Tugaskan Riset</span>
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
