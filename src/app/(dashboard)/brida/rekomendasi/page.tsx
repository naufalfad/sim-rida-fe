'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Award, Calendar, Eye, ChevronRight, PenTool } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function BridaRekomendasiPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRekomendasi = async () => {
      try {
        const list = await proposalService.getProposals();
        // Show proposals where policy brief is drafted/approved or recommendation is pending/approved
        const allowedStates = [
          'RECOMMENDATION_PENDING',
          'RECOMMENDATION_APPROVED',
          'FOLLOW_UP_PENDING',
          'FOLLOW_UP_IN_PROGRESS',
          'FOLLOW_UP_COMPLETED'
        ];
        
        const filtered = list.filter((p) => {
          return allowedStates.includes(p.status) || p.policyBrief?.status === 'APPROVED';
        });
        
        setProposals(filtered);
      } catch (err) {
        console.error('Failed to load rekomendasi:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadRekomendasi();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat daftar rekomendasi..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Rekomendasi Kebijakan Bupati
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Susun dan daftarkan rekomendasi kebijakan resmi yang akan disahkan dan ditandatangani Bupati untuk ditindaklanjuti oleh dinas/OPD terkait.
        </p>
      </div>

      {/* Grid */}
      {proposals.length === 0 ? (
        <EmptyState
          title="Tidak ada rekomendasi siap dirumuskan"
          description="Selesaikan kajian riset dan sahkan Policy Brief terlebih dahulu untuk menyusun rekomendasi formal."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {proposals.map((item) => {
            const hasRec = !!item.recommendation;
            const recStatus = item.status === 'RECOMMENDATION_APPROVED' ? 'DISAHKAN BUPATI' : 'PENDING EVALUASI';
            
            return (
              <Card key={item.id} className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center text-3xs font-mono font-bold">
                    <span className="text-teal-650 dark:text-teal-400">REC-{item.id}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        item.status === 'RECOMMENDATION_APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20'
                          : 'bg-yellow-50 text-yellow-750 dark:bg-yellow-950/20'
                      }`}
                    >
                      {recStatus}
                    </span>
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-850 dark:text-slate-200 mt-2 line-clamp-2">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-3xs mt-1 text-slate-400">
                    OPD Pelaksana: {item.recommendation?.responsibleOPD || item.opdName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="p-3 bg-teal-50/10 border border-teal-100 dark:border-teal-950/20 rounded-lg text-xs leading-relaxed italic text-slate-700 dark:text-slate-350 line-clamp-3">
                    &ldquo;{hasRec ? item.recommendation?.recommendation : 'Rekomendasi kebijakan formal belum dirumuskan.'}&rdquo;
                  </div>

                  <div className="border-t pt-3 flex items-center justify-between dark:border-slate-850 text-2xs">
                    <span className="text-slate-400">
                      Prioritas: <strong>{item.recommendation?.priority || 'Belum diatur'}</strong>
                    </span>
                    <Link href={`/brida/rekomendasi/${item.id}`}>
                      <Button size="sm" className="h-8 text-3xs bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1 font-bold">
                        <PenTool className="h-3.5 w-3.5" />
                        <span>Kelola Rekomendasi</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
