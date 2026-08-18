'use client';

import React, { useState } from 'react';
import { Eye, ShieldAlert, Award, FileSpreadsheet, PlayCircle, BarChart3, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/components/ui/toast';
import { WorkflowStatus } from '@/constants/status';

export default function BridaDashboard() {
  const { toast } = useToast();

  const [actions, setActions] = useState([
    {
      id: 'PRP-2026-001',
      title: 'Kajian Efektivitas Penanganan Stunting Terintegrasi',
      opd: 'Dinas Kesehatan & Bappeda',
      status: 'ADMINISTRATIVE_REVIEW' as WorkflowStatus,
    },
    {
      id: 'PRP-2026-004',
      title: 'Kajian Pemetaan Potensi Pertanian Organik Hortikultura',
      opd: 'Dinas Pertanian',
      status: 'SUBSTANTIVE_REVIEW' as WorkflowStatus,
    },
    {
      id: 'PRP-2026-005',
      title: 'Studi Kelayakan Relokasi Pasar Tradisional Terpadu',
      opd: 'Dinas Perdagangan',
      status: 'SCORING' as WorkflowStatus,
    },
  ]);

  const handleProcessAction = (id: string, actionType: string) => {
    toast(`Mengolah usulan ${id}: Berhasil melakukan ${actionType}.`, 'success');
    setActions(actions.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard BRIDA</h1>
        <p className="text-slate-550 dark:text-slate-400">
          Selamat datang di Panel SIM-RIDA Bidang Riset dan Inovasi BRIDA.
        </p>
      </div>

      {/* Grid of stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white dark:bg-slate-900 border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-550 uppercase">Menunggu Verifikasi</p>
              <p className="text-2xl font-bold">4</p>
            </div>
            <div className="h-10 w-10 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-550 uppercase">Review Substansi</p>
              <p className="text-2xl font-bold">3</p>
            </div>
            <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 rounded-lg flex items-center justify-center">
              <Eye className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-550 uppercase">Riset Pelaksanaan</p>
              <p className="text-2xl font-bold">6</p>
            </div>
            <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-lg flex items-center justify-center">
              <PlayCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-550 uppercase">Policy Brief Drafted</p>
              <p className="text-2xl font-bold">2</p>
            </div>
            <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Pending Actions Table */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Daftar Tugas / Perlu Tindakan</CardTitle>
              <CardDescription>
                Usulan riset daerah yang memerlukan keputusan operasional dari Tim BRIDA.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {actions.length === 0 ? (
                <div className="text-center py-8 text-slate-555">
                  <AlertCircle className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                  <p>Semua tugas operasional telah diselesaikan!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 font-medium">
                        <th className="py-3 font-semibold">Usulan</th>
                        <th className="py-3 px-4 font-semibold">OPD Pengusul</th>
                        <th className="py-3 font-semibold">Proses</th>
                        <th className="py-3 text-right font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {actions.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all">
                          <td className="py-4">
                            <p className="font-mono text-xs font-semibold text-blue-650 dark:text-blue-400">{item.id}</p>
                            <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 truncate max-w-xs">{item.title}</p>
                          </td>
                          <td className="py-4 px-4 text-xs font-semibold">{item.opd}</td>
                          <td className="py-4">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="py-4 text-right">
                            {item.status === 'ADMINISTRATIVE_REVIEW' && (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleProcessAction(item.id, 'Verifikasi Administrasi')}
                              >
                                Verifikasi
                              </Button>
                            )}
                            {item.status === 'SUBSTANTIVE_REVIEW' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleProcessAction(item.id, 'Review Substansi')}
                              >
                                Review
                              </Button>
                            )}
                            {item.status === 'SCORING' && (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleProcessAction(item.id, 'Scoring / Penilaian')}
                              >
                                Scoring
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

        {/* BRIDA Quick Info Sidebar Card */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-850">
              <CardTitle className="text-sm font-bold">Kategori Prioritas Riset</CardTitle>
              <BarChart3 className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium">1. Peningkatan Kesehatan (Stunting)</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold dark:bg-blue-900/30 dark:text-blue-300">Tinggi</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">2. Infrastruktur & Transportasi</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold dark:bg-emerald-900/30 dark:text-emerald-300">Sedang</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">3. Ketahanan Pangan Hortikultura</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold dark:bg-blue-900/30 dark:text-blue-300">Tinggi</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">4. Ekonomi & Digitalisasi Pasar</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-655 font-bold dark:bg-slate-800 dark:text-slate-400">Rendah</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
