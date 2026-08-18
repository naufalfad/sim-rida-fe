'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Calendar, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function BridaReviewListPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReviewQueue = async () => {
      try {
        const list = await proposalService.getProposals();
        // Show administrative approved / substantive review states
        const reviewStates = ['ADMINISTRATIVE_REVIEW', 'SUBSTANTIVE_REVIEW'];
        setProposals(list.filter((p) => reviewStates.includes(p.status)));
      } catch (err) {
        console.error('Failed to load review queue:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadReviewQueue();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat antrean penilaian substansi..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Penilaian & Review Substansi
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Evaluasi kualitas usulan riset daerah. Masukkan penilaian kualitatif (skor) berdasarkan parameter riset.
        </p>
      </div>

      {/* Grid of proposals for review */}
      {proposals.length === 0 ? (
        <EmptyState
          title="Antrean review kosong"
          description="Seluruh usulan yang lolos administrasi telah selesai dinilai."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proposals.map((item) => (
            <Card key={item.id} className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all">
              <CardHeader className="pb-2">
                <span className="font-mono text-2xs font-bold text-blue-650 dark:text-blue-400">
                  {item.id}
                </span>
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2 line-clamp-2">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Bidang: {item.problem.bidang} | OPD: {item.opdName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-t pt-3 flex items-center justify-between text-2xs text-slate-450 dark:border-slate-850">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Lolos Administrasi: {new Date(item.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                  </div>
                  <Link href={`/brida/review/${item.id}`}>
                    <Button size="sm" className="h-7 text-3xs bg-blue-650 hover:bg-blue-750 flex items-center gap-1 font-bold">
                      <span>Beri Nilai</span>
                      <ArrowRight className="h-3.5 w-3.5" />
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
