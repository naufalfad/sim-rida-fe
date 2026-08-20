'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileCheck, Calendar, User, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { proposalApi } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function BridaLaporanListPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const list = proposalApi.getProposals();
    // Show proposals where OPD has submitted final reports
    const reportStates = ['OPD_REPORTED', 'POLICY_BRIEF_DRAFT', 'RECOMMENDATION_PENDING', 'RECOMMENDATION_APPROVED'];
    setProposals(list.filter((p) => reportStates.includes(p.status)));
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat antrean berkas laporan..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Evaluasi Laporan Akhir Riset
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Periksa kecocokan output target riset dengan dokumen naskah kajian akhir dan draf rekomendasi kebijakan Bupati.
        </p>
      </div>

      {/* Grid of Reports */}
      {proposals.length === 0 ? (
        <EmptyState
          title="Tidak ada laporan disubmit"
          description="Saat ini belum ada mitra peneliti yang mengunggah draft laporan akhir mereka."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {proposals.map((item) => (
            <Card key={item.id} className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-2xs font-bold text-blue-650 dark:text-blue-400">
                    {item.id}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
                <CardTitle className="text-sm font-bold text-slate-850 dark:text-slate-200 mt-2 line-clamp-2">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-3xs flex items-center gap-1 mt-1 text-slate-400 font-semibold">
                  <User className="h-3.5 w-3.5" />
                  <span>OPD: {item.opdName}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="p-2 border rounded bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800 text-xs">
                  <p className="font-bold text-slate-500 text-[9px] uppercase">Rekomendasi Kebijakan (Output)</p>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 line-clamp-1 italic">
                    &ldquo;{item.kak?.output}&rdquo;
                  </p>
                </div>

                <div className="border-t pt-3 flex items-center justify-between text-2xs text-slate-450 dark:border-slate-855">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Diserahkan: {new Date(item.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                  </div>
                  <Link href={`/brida/laporan/${item.id}`}>
                    <Button size="sm" className="h-7 text-3xs bg-blue-650 hover:bg-blue-750 flex items-center gap-1 font-bold">
                      <span>Evaluasi</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
