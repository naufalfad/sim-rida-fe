'use client';

import React, { useState } from 'react';
import { Award, ShieldCheck, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/components/ui/toast';
import { WorkflowStatus } from '@/constants/status';

export default function KepalaBridaDashboard() {
  const { toast } = useToast();

  const [pendingApprovals, setPendingApprovals] = useState([
    {
      id: 'PRP-2026-003',
      title: 'Strategi Pengembangan Destinasi Wisata Sejarah',
      opd: 'Dinas Pariwisata',
      researcher: 'Dr. Rian Nugroho (Tim UI)',
      status: 'RESEARCHER_APPROVAL' as WorkflowStatus,
    },
    {
      id: 'PRP-2026-002',
      title: 'Evaluasi Sistem Transportasi Publik Berbasis Listrik',
      opd: 'Dinas Perhubungan',
      researcher: 'Prof. Dr. Anton (ITB)',
      status: 'POLICY_BRIEF_REVIEW' as WorkflowStatus,
    },
  ]);

  const handleApprove = (id: string, actionName: string) => {
    toast(`Persetujuan Berhasil: ${actionName} untuk usulan ${id} telah disetujui secara strategis.`, 'success');
    setPendingApprovals(pendingApprovals.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Strategis Kepala BRIDA</h1>
        <p className="text-slate-550 dark:text-slate-400">
          Panel pembuat keputusan strategis dan pengawasan dampak riset pembangunan daerah.
        </p>
      </div>

      {/* Grid of stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white dark:bg-slate-900 border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-555 uppercase">Persetujuan Peneliti</p>
              <p className="text-2xl font-bold">
                {pendingApprovals.filter((p) => p.status === 'RESEARCHER_APPROVAL').length}
              </p>
            </div>
            <div className="h-10 w-10 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-550 uppercase">Pengesahan Policy Brief</p>
              <p className="text-2xl font-bold">
                {pendingApprovals.filter((p) => p.status === 'POLICY_BRIEF_REVIEW').length}
              </p>
            </div>
            <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 rounded-lg flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-555 uppercase">Total Riset Rampung</p>
              <p className="text-2xl font-bold">8</p>
            </div>
            <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-455 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-550 uppercase">Indeks Capaian Dampak</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">84.2%</p>
            </div>
            <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content layout grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Strategic Approvals Table Card */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Keputusan & Approval Strategis</CardTitle>
              <CardDescription>
                Persetujuan yang memerlukan tanda tangan digital Kepala BRIDA untuk melanjutkan workflow penelitian.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                  <p>Seluruh persetujuan strategis telah diproses!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 font-medium">
                        <th className="py-3 font-semibold">Usulan / Penelitian</th>
                        <th className="py-3 px-4 font-semibold">Rekomendasi Peneliti</th>
                        <th className="py-3 font-semibold">Jenis Approval</th>
                        <th className="py-3 text-right font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {pendingApprovals.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all">
                          <td className="py-4">
                            <p className="font-mono text-xs font-semibold text-blue-650 dark:text-blue-400">{item.id}</p>
                            <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 max-w-xs truncate">{item.title}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.researcher}</p>
                            <p className="text-[10px] text-slate-500">{item.opd}</p>
                          </td>
                          <td className="py-4">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="py-4 text-right">
                            {item.status === 'RESEARCHER_APPROVAL' && (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleApprove(item.id, 'Persetujuan Peneliti')}
                              >
                                Setujui Mitra
                              </Button>
                            )}
                            {item.status === 'POLICY_BRIEF_REVIEW' && (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleApprove(item.id, 'Pengesahan Policy Brief')}
                              >
                                Sahkan Policy Brief
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Impact metrics overview card */}
        <div>
          <Card className="bg-white dark:bg-slate-900 border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Ringkasan Kinerja Riset</CardTitle>
              <CardDescription>Rasio kontribusi rekomendasi riset daerah.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Rencana Aksi OPD Aktif</span>
                  <span>78%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '78%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Evaluasi Efisiensi Anggaran</span>
                  <span>92%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }} />
                </div>
              </div>

              <div className="rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-3 mt-4 text-xs leading-relaxed text-blue-800 dark:text-blue-300">
                <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400 mb-1" />
                <span>
                  <strong>Tip Strategis:</strong> Seluruh rekomendasi riset stunting telah ditindaklanjuti oleh Dinas Kesehatan melalui APBD Perubahan 2026.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
