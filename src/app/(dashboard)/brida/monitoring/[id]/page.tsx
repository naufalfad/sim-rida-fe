'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  FileText,
  PlayCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function BridaMonitoringDetailPage() {
  const router = useRouter();
  const params = useParams();
  const researchId = params.id as string;
  const { toast } = useToast();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Issues Form States
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [issueDesc, setIssueDesc] = useState('');
  const [issueSeverity, setIssueSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [isIssueSaving, setIsIssueSaving] = useState(false);

  // Risks Form States
  const [isRiskDialogOpen, setIsRiskDialogOpen] = useState(false);
  const [riskDesc, setRiskDesc] = useState('');
  const [riskMitigation, setRiskMitigation] = useState('');
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [isRiskSaving, setIsRiskSaving] = useState(false);

  const loadDetails = async () => {
    try {
      const data = await proposalService.getProposalById(researchId);
      setProposal(data);
    } catch (err) {
      console.error('Failed to load project monitoring details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [researchId]);

  if (isLoading) {
    return <LoadingState message="Memuat dasbor monitoring riset..." />;
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-base font-semibold">Kajian Tidak Ditemukan</h3>
        <Button onClick={() => router.push('/brida/monitoring')} className="mt-4" variant="outline">
          Kembali
        </Button>
      </div>
    );
  }

  // Resolve issue handler
  const handleResolveIssue = async (issueId: string) => {
    try {
      const updated = await proposalService.resolveProjectIssue(proposal.id, issueId);
      if (updated) {
        setProposal(updated);
        toast('Kendala berhasil ditandai selesai (RESOLVED).', 'success');
      }
    } catch {
      toast('Gagal menyelesaikan kendala.', 'error');
    }
  };

  // Add issue handler
  const handleAddIssue = async () => {
    if (!issueDesc) {
      toast('Mohon tulis deskripsi kendala.', 'error');
      return;
    }

    setIsIssueSaving(true);
    try {
      const updated = await proposalService.addProjectIssue(proposal.id, issueDesc, issueSeverity);
      if (updated) {
        setProposal(updated);
        setIssueDesc('');
        setIsIssueDialogOpen(false);
        toast('Kendala riset baru berhasil dicatat.', 'success');
      }
    } catch {
      toast('Gagal mencatat kendala.', 'error');
    } finally {
      setIsIssueSaving(false);
    }
  };

  // Add risk handler
  const handleAddRisk = async () => {
    if (!riskDesc || !riskMitigation) {
      toast('Mohon lengkapi deskripsi risiko dan rencana mitigasi.', 'error');
      return;
    }

    setIsRiskSaving(true);
    try {
      const updated = await proposalService.addProjectRisk(proposal.id, riskDesc, riskMitigation, riskLevel);
      if (updated) {
        setProposal(updated);
        setRiskDesc('');
        setRiskMitigation('');
        setIsRiskDialogOpen(false);
        toast('Analisis risiko baru berhasil ditambahkan.', 'success');
      }
    } catch {
      toast('Gagal menambahkan risiko.', 'error');
    } finally {
      setIsRiskSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/brida/monitoring')}
            className="h-9 w-9 p-0 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xs font-bold text-blue-650 dark:text-blue-400">
                Monitoring / {proposal.id}
              </span>
              <StatusBadge status={proposal.status} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200 mt-1 truncate max-w-sm sm:max-w-md">
              {proposal.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Grid workspace */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: issues and risks */}
        <div className="md:col-span-2 space-y-6">
          {/* Issues Register */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2 dark:border-slate-850">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Kendala Teknis Pelaksanaan (Issues Register)
              </h3>
              <Button
                onClick={() => setIsIssueDialogOpen(true)}
                size="sm"
                variant="outline"
                className="h-8 text-2xs flex items-center gap-1"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Catat Kendala</span>
              </Button>
            </div>

            {(!proposal.issues || proposal.issues.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Tidak ada kendala teknis yang dilaporkan.
              </p>
            ) : (
              <div className="space-y-3">
                {proposal.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3 border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs ${
                      issue.status === 'RESOLVED'
                        ? 'bg-slate-50/50 border-slate-200 opacity-60 dark:bg-slate-950/20 dark:border-slate-850'
                        : issue.severity === 'HIGH'
                        ? 'bg-red-50/10 border-red-200 dark:border-red-950/20'
                        : 'bg-amber-50/10 border-amber-200 dark:border-amber-950/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          issue.status === 'RESOLVED'
                            ? 'bg-slate-100 text-slate-650'
                            : issue.severity === 'HIGH'
                            ? 'bg-red-100 text-red-750 dark:bg-red-950/40 dark:text-red-400'
                            : 'bg-amber-100 text-amber-750 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {issue.severity}
                        </span>
                        <span className="text-[10px] text-slate-400">{issue.dateReported}</span>
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1.5">
                        {issue.description}
                      </p>
                    </div>

                    {issue.status === 'OPEN' && (
                      <Button
                        onClick={() => handleResolveIssue(issue.id)}
                        size="sm"
                        variant="outline"
                        className="h-8 text-3xs text-emerald-700 border-emerald-250 hover:bg-emerald-50 self-end sm:self-center font-bold"
                      >
                        Selesaikan
                      </Button>
                    )}
                    {issue.status === 'RESOLVED' && (
                      <span className="text-3xs font-bold text-emerald-600 flex items-center gap-0.5">
                        ✓ Teratasi
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Risks Analysis Register */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2 dark:border-slate-850">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Manajemen Risiko & Mitigasi (Risk Register)
              </h3>
              <Button
                onClick={() => setIsRiskDialogOpen(true)}
                size="sm"
                variant="outline"
                className="h-8 text-2xs flex items-center gap-1"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Tambah Risiko</span>
              </Button>
            </div>

            {(!proposal.risks || proposal.risks.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Belum ada identifikasi risiko.
              </p>
            ) : (
              <div className="space-y-3">
                {proposal.risks.map((risk) => (
                  <div
                    key={risk.id}
                    className="p-3 border rounded-lg bg-slate-50/50 border-slate-200 dark:bg-slate-950/20 dark:border-slate-850 text-xs space-y-2"
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-slate-450 text-[10px] font-mono">{risk.id}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                        risk.riskLevel === 'HIGH'
                          ? 'bg-red-100 text-red-750 dark:bg-red-950/40 dark:text-red-450'
                          : risk.riskLevel === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-755 dark:bg-amber-950/40 dark:text-amber-450'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                      }`}>
                        Risiko: {risk.riskLevel}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">Pernyataan Risiko:</span>
                      <p className="text-slate-700 dark:text-slate-350 mt-0.5 leading-relaxed">{risk.description}</p>
                    </div>
                    <div className="pt-2 border-t dark:border-slate-850">
                      <span className="font-bold text-blue-650 dark:text-blue-400">Rencana Mitigasi:</span>
                      <p className="text-slate-700 dark:text-slate-350 mt-0.5 leading-relaxed">{risk.mitigation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column: progress indicators */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 text-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850">
              Capaian Progres Riset
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-2xs font-semibold text-slate-500">
                <span>Riset Lapangan</span>
                <span>{proposal.progress}% Selesai</span>
              </div>
              <ProgressIndicator value={proposal.progress} size="lg" />
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-650 dark:text-slate-400">
              <div className="py-2.5 flex justify-between">
                <span>Pakar Peneliti:</span>
                <span className="font-bold text-slate-850 dark:text-slate-200">{proposal.researcherName || 'Belum Ditunjuk'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span>OPD Dinas:</span>
                <span className="font-bold text-slate-850 dark:text-slate-200">{proposal.opdName}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Issue Dialog */}
      <Dialog
        isOpen={isIssueDialogOpen}
        onClose={() => setIsIssueDialogOpen(false)}
        title="Catat Kendala Riset Baru"
        description="Catat kendala teknis atau birokrasi lapangan yang menghambat pengumpulan data riset."
        footer={
          <>
            <Button onClick={handleAddIssue} variant="primary" size="sm" isLoading={isIssueSaving}>
              Simpan Kendala
            </Button>
            <Button onClick={() => setIsIssueDialogOpen(false)} variant="outline" size="sm">
              Batal
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Deskripsi Kendala / Masalah Lapangan"
            placeholder="Jelaskan secara ringkas kejadian kendala teknis..."
            value={issueDesc}
            onChange={(e) => setIssueDesc(e.target.value)}
            rows={3}
          />

          <Select
            label="Tingkat Keparahan (Severity)"
            options={[
              { value: 'LOW', label: 'Low (Rendah / Penundaan Minor)' },
              { value: 'MEDIUM', label: 'Medium (Sedang / Menghambat Kerja)' },
              { value: 'HIGH', label: 'High (Kritis / Membutuhkan Rapat Koordinasi)' },
            ]}
            value={issueSeverity}
            onChange={(e) => setIssueSeverity(e.target.value as any)}
            className="bg-white dark:bg-slate-950 dark:border-slate-800 border-slate-300"
          />
        </div>
      </Dialog>

      {/* Add Risk Dialog */}
      <Dialog
        isOpen={isRiskDialogOpen}
        onClose={() => setIsRiskDialogOpen(false)}
        title="Identifikasi Analisis Risiko"
        description="Prediksikan risiko eksternal (sosial, cuaca, kebijakan) beserta rencana mitigasi taktisnya."
        footer={
          <>
            <Button onClick={handleAddRisk} variant="primary" size="sm" isLoading={isRiskSaving}>
              Simpan Risiko
            </Button>
            <Button onClick={() => setIsRiskDialogOpen(false)} variant="outline" size="sm">
              Batal
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Deskripsi Risiko (Risk Statement)"
            placeholder="Contoh: Terjadi fluktuasi penolakan responden nelayan setempat..."
            value={riskDesc}
            onChange={(e) => setRiskDesc(e.target.value)}
            rows={2}
          />

          <Textarea
            label="Rencana Mitigasi (Mitigation Plan)"
            placeholder="Contoh: Menggandeng tokoh adat setempat untuk sosialisasi..."
            value={riskMitigation}
            onChange={(e) => setRiskMitigation(e.target.value)}
            rows={2}
          />

          <Select
            label="Level Risiko"
            options={[
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
            ]}
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value as any)}
            className="bg-white dark:bg-slate-950 dark:border-slate-800 border-slate-300"
          />
        </div>
      </Dialog>
    </div>
  );
}
