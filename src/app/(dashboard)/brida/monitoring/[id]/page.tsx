'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  FileText,
  PlayCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal, OpdMonitoringLog } from '@/types/proposals';

export default function BridaMonitoringDetailPage() {
  const router = useRouter();
  const params = useParams();
  const researchId = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="space-y-6 animate-fade-in p-6">
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
        {/* Left column: logs, issues and risks */}
        <div className="md:col-span-2 space-y-6">
          {/* Riwayat Log Monitoring OPD */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850">
              Riwayat Progress & Log Monitoring dari OPD
            </h3>
            
            {(!proposal.opdMonitoringLogs || proposal.opdMonitoringLogs.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Belum ada log monitoring yang dilaporkan oleh OPD pelaksana.
              </p>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {[...(proposal.opdMonitoringLogs)].reverse().map((log: OpdMonitoringLog) => (
                  <div
                    key={log.id}
                    className="p-4 bg-slate-50 dark:bg-slate-950/20 rounded-lg border border-slate-150 dark:border-slate-850 text-xs space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-semibold">{log.date}</span>
                      <span className="font-mono font-bold text-blue-650 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded">
                        Capaian: {log.progress}%
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-350 whitespace-pre-wrap leading-relaxed">
                      {log.description}
                    </p>
                    {log.evidenceFile && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-900">
                        <span className="text-[10px] text-slate-450 uppercase font-mono block mb-1">Dokumen Bukti Fisik:</span>
                        <a 
                          href={log.evidenceFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-650 hover:underline"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Lihat / Unduh Dokumen Bukti</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Issues Register */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850">
              Daftar Kendala Teknis (Issues Register)
            </h3>

            {(!proposal.issues || proposal.issues.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Tidak ada kendala teknis yang dilaporkan oleh OPD.
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
                            : 'bg-amber-100 text-amber-755 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {issue.severity}
                        </span>
                        <span className="text-[10px] text-slate-400">{issue.dateReported}</span>
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1.5">
                        {issue.description}
                      </p>
                    </div>

                    <div>
                      {issue.status === 'RESOLVED' ? (
                        <span className="text-3xs font-bold text-emerald-600 flex items-center gap-0.5">
                          ✓ Teratasi
                        </span>
                      ) : (
                        <span className="text-3xs font-bold text-red-600 dark:text-red-400">
                          ● Open
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Risks Analysis Register */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850">
              Identifikasi Risiko & Mitigasi (Risk Register)
            </h3>

            {(!proposal.risks || proposal.risks.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Belum ada identifikasi risiko yang dicatat oleh OPD.
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
                          ? 'bg-red-100 text-red-750 dark:bg-red-950/40 dark:text-red-455'
                          : risk.riskLevel === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-755 dark:bg-amber-950/40 dark:text-amber-455'
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
                <span>Vendor E-Katalog:</span>
                <span className="font-bold text-slate-850 dark:text-slate-200">{proposal.eKatalogDesc || 'E-Katalog Belum Dipilih'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span>OPD Dinas:</span>
                <span className="font-bold text-slate-850 dark:text-slate-200">{proposal.opdName}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
