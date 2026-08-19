'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { proposalService } from '@/lib/api/proposals';
import { authService } from '@/lib/api/auth';
import { Proposal } from '@/types/proposals';
import { AlertTriangle, AlertCircle, ShieldAlert, CheckCircle } from 'lucide-react';

export default function ResearcherMonitoringPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        console.error('Failed to load active proposals for monitoring:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProposals();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat pemantauan kendala riset..." />;
  }

  const handleProposalChange = (id: string) => {
    const found = proposals.find((p) => p.id === id);
    if (found) {
      setSelectedProposal(found);
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
          Monitoring & Kendala Riset
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Pantau daftar hambatan operasional (Issues Register) dan kelola langkah mitigasi risiko lapangan yang terpantau oleh BRIDA.
        </p>
      </div>

      {proposals.length === 0 ? (
        <EmptyState
          title="Tidak ada proyek riset aktif"
          description="Anda belum memiliki proyek riset berstatus AKTIF (IN_PROGRESS) untuk dipantau kendalanya."
        />
      ) : (
        <div className="space-y-6">
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
          </Card>

          {selectedProposal && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Issues Register */}
              <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-2 dark:border-slate-850">
                  <h3 className="text-sm font-bold text-slate-805 dark:text-slate-205 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>Daftar Kendala Lapangan (Issues Register)</span>
                  </h3>
                  <span className="text-[10px] bg-slate-100 text-slate-655 px-2 py-0.5 rounded-full dark:bg-slate-800">
                    {(selectedProposal.issues || []).length} Kendala
                  </span>
                </div>

                {(!selectedProposal.issues || selectedProposal.issues.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-4">Belum ada kendala operasional yang dilaporkan.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedProposal.issues.map((iss) => (
                      <div
                        key={iss.id}
                        className={`p-3 border rounded-lg text-xs space-y-2 ${
                          iss.status === 'RESOLVED'
                            ? 'bg-emerald-50/10 border-emerald-100 dark:border-emerald-950'
                            : 'bg-red-50/10 border-red-100 dark:border-red-950'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            iss.severity === 'HIGH'
                              ? 'bg-red-100 text-red-700'
                              : iss.severity === 'MEDIUM'
                              ? 'bg-amber-150 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            Severity: {iss.severity}
                          </span>
                          <span className={`text-[10px] font-bold ${
                            iss.status === 'RESOLVED' ? 'text-emerald-650' : 'text-red-650'
                          }`}>
                            {iss.status === 'RESOLVED' ? 'SELESAI (RESOLVED)' : 'TERKENDALA (OPEN)'}
                          </span>
                        </div>
                        <p className="text-slate-750 dark:text-slate-350 leading-relaxed font-sans">{iss.description}</p>
                        <p className="text-3xs text-slate-400 font-mono">Dilaporkan: {iss.dateReported}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Risk Mitigation */}
              <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-2 dark:border-slate-850">
                  <h3 className="text-sm font-bold text-slate-805 dark:text-slate-205 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                    <span>Mitigasi Risiko Proyek (Risk Matrix)</span>
                  </h3>
                  <span className="text-[10px] bg-slate-100 text-slate-655 px-2 py-0.5 rounded-full dark:bg-slate-800">
                    {(selectedProposal.risks || []).length} Risiko
                  </span>
                </div>

                {(!selectedProposal.risks || selectedProposal.risks.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-4">Belum ada identifikasi risiko awal.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedProposal.risks.map((rsk) => (
                      <div
                        key={rsk.id}
                        className="p-3 border rounded-lg bg-slate-50/40 border-slate-200 dark:bg-slate-955 dark:border-slate-850 text-xs space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{rsk.description}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            rsk.riskLevel === 'HIGH'
                              ? 'bg-red-500 text-white'
                              : rsk.riskLevel === 'MEDIUM'
                              ? 'bg-amber-500 text-white'
                              : 'bg-blue-500 text-white'
                          }`}>
                            Level: {rsk.riskLevel}
                          </span>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-950 border rounded text-[11px] leading-relaxed dark:border-slate-850">
                          <span className="font-bold text-slate-400 block mb-0.5 uppercase text-[8px]">Mitigasi</span>
                          {rsk.mitigation}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
