'use client';

import React, { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Search, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { proposalService } from '@/lib/api/proposals';
import { FollowUp } from '@/types/proposals';

export default function BridaTindakLanjutPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadFollowUps = async () => {
      try {
        const list = await proposalService.getFollowUps();
        setFollowUps(list);
      } catch (err) {
        console.error('Failed to load follow-ups queue:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadFollowUps();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat rekapitulasi tindak lanjut OPD..." />;
  }

  const filtered = followUps.filter((f) =>
    f.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.opdName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Rekapitulasi Tindak Lanjut OPD
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Kanal pemantauan berkala BRIDA untuk melihat sejauh mana dinas/OPD merealisasikan SK rekomendasi Bupati.
        </p>
      </div>

      {/* Filter Card */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Cari ID tindak lanjut, tema rekomendasi, atau OPD penanggung jawab..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 h-10 w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid of Action Plans */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada tindak lanjut ditemukan"
          description="Bersihkan filter pencarian atau ganti kata kunci pencarian Anda."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <Card key={item.id} className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 md:flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-650 dark:text-blue-400">
                      {item.id}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450'
                          : item.status === 'IN_PROGRESS'
                          ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-450'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}
                    >
                      {item.status === 'PENDING' ? 'BELUM ADA RENCANA AKSI' : item.status === 'IN_PROGRESS' ? 'PELAKSANAAN' : 'SELESAI'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">
                    {item.title}
                  </h3>

                  <div className="grid gap-2 text-2xs text-slate-650 dark:text-slate-400 pt-1">
                    <div>
                      <span className="font-bold text-slate-500 uppercase text-[9px]">Instansi Pelaksana:</span>
                      <p className="text-slate-800 dark:text-slate-200 font-semibold">{item.opdName}</p>
                    </div>

                    {item.actionPlan ? (
                      <div>
                        <span className="font-bold text-slate-500 uppercase text-[9px]">Rencana Aksi OPD:</span>
                        <p className="text-slate-700 dark:text-slate-350 leading-relaxed font-semibold italic">
                          &ldquo;{item.actionPlan}&rdquo;
                        </p>
                      </div>
                    ) : (
                      <p className="text-amber-600 font-bold text-3xs">⚠ OPD Belum Mensahkan Rencana Aksi Realisasi</p>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full md:w-64 space-y-1">
                  <div className="flex justify-between text-2xs font-semibold text-slate-550">
                    <span>Progres Realisasi</span>
                    <span className="font-bold">{item.progress}% Selesai</span>
                  </div>
                  <ProgressIndicator value={item.progress} size="sm" variant={item.status === 'COMPLETED' ? 'success' : 'primary'} />
                  {item.targetDate && (
                    <p className="text-[10px] text-slate-450 mt-1 font-semibold">
                      Target: {new Date(item.targetDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
