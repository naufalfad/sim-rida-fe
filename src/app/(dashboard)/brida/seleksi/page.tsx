'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FolderLock, Calendar, ChevronRight, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function BridaSeleksiListPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSelectionQueue = async () => {
      try {
        const list = await proposalService.getProposals();
        // Show proposals that have scores or are in selection states
        const selectionStates = ['SELECTION_RECOMMENDED', 'SCORING', 'APPROVED', 'RESERVE', 'REJECTED'];
        const filtered = list.filter((p) => selectionStates.includes(p.status) || p.review !== undefined);
        
        // Sort descending by totalScore
        filtered.sort((a, b) => (b.review?.totalScore || 0) - (a.review?.totalScore || 0));
        setProposals(filtered);
      } catch (err) {
        console.error('Failed to load selection ranking list:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSelectionQueue();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat pemeringkatan seleksi prioritas..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Seleksi Prioritas Kajian
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Sidang penetapan program prioritas. Rincian tabel pemeringkatan berdasarkan skor review substansi ahli.
        </p>
      </div>

      {/* Ranking Table Card */}
      {proposals.length === 0 ? (
        <EmptyState
          title="Belum ada usulan dinilai"
          description="Selesaikan tahapan penilaian substansi terlebih dahulu untuk memunculkan pemeringkatan."
        />
      ) : (
        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/50 dark:bg-slate-950/20">
                    <th className="py-3.5 px-6 font-semibold text-center w-16">Rank</th>
                    <th className="py-3.5 px-4 font-semibold">Tema Kajian / Pengusul</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Skor Review</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Priority Rec.</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-6 font-semibold text-right">Keputusan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {proposals.map((item, idx) => {
                    const score = item.review?.totalScore || 0;
                    const rec = item.review?.recommendation || 'PENDING';
                    
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all font-medium">
                        <td className="py-4 px-6 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">
                          <Link href={`/brida/seleksi/${item.id}`} className="hover:underline line-clamp-1">
                            {item.title}
                          </Link>
                          <span className="text-[10px] text-slate-500 font-normal mt-0.5 block">{item.opdName}</span>
                        </td>
                        <td className="py-4 px-4 text-center font-mono font-extrabold text-blue-600 text-sm">
                          {score || '-'}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            rec === 'RECOMMENDED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                              : rec === 'RESERVE'
                              ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                          }`}>
                            {rec}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link href={`/brida/seleksi/${item.id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-3xs font-semibold">
                              Pilih Keputusan
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
