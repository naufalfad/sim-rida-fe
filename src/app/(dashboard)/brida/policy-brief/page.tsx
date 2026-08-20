'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileBadge, Calendar, Eye, ChevronRight, PenTool } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function BridaPolicyBriefPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPolicyBriefs = async () => {
      try {
        const list = await proposalService.getProposals();
        // Show studies that are completed, or in policy brief draft/review states
        const allowedStates = [
          'OPD_REPORTED',
          'POLICY_BRIEF_DRAFT',
          'POLICY_BRIEF_REVIEW',
          'RECOMMENDATION_PENDING',
          'RECOMMENDATION_APPROVED',
          'FOLLOW_UP_PENDING',
          'FOLLOW_UP_IN_PROGRESS',
          'FOLLOW_UP_COMPLETED'
        ];
        setProposals(list.filter((p) => allowedStates.includes(p.status)));
      } catch (err) {
        console.error('Failed to load policy briefs:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadPolicyBriefs();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat daftar policy brief..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Executive Policy Briefs
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Ubah hasil riset daerah menjadi ringkasan naskah kebijakan operasional (Policy Brief) untuk bahan masukan strategis pimpinan daerah.
        </p>
      </div>

      {/* Grid briefs */}
      {proposals.length === 0 ? (
        <EmptyState
          title="Belum ada riset selesai"
          description="Selesaikan kajian riset dan sahkan laporan akhir terlebih dahulu untuk melahirkan naskah policy brief."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {proposals.map((item) => {
            const hasBrief = !!item.policyBrief;
            const briefStatus = item.policyBrief?.status || 'Belum Dibuat';
            
            return (
              <Card key={item.id} className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center text-3xs font-mono font-bold">
                    <span className="text-blue-650 dark:text-blue-400">PB-{item.id}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        briefStatus === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20'
                          : briefStatus === 'REVIEW'
                          ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/20 animate-pulse'
                          : briefStatus === 'REVISION'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20'
                          : briefStatus === 'DRAFT'
                          ? 'bg-slate-100 text-slate-700 dark:bg-slate-800'
                          : 'bg-yellow-50 text-yellow-750 dark:bg-yellow-950/20'
                      }`}
                    >
                      {briefStatus === 'Belum Dibuat' ? 'BELUM DIBUAT' : `STATUS: ${briefStatus}`}
                    </span>
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-850 dark:text-slate-200 mt-2 line-clamp-2">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-3xs mt-1">
                    OPD Pengusul: {item.opdName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <p className="text-xs text-slate-500 line-clamp-3 bg-slate-50/50 dark:bg-slate-955 p-2.5 rounded border border-slate-100 dark:border-slate-850">
                    {hasBrief
                      ? item.policyBrief?.policyIssue
                      : 'Naskah belum disusun. Klik tombol di bawah untuk mulai merumuskan draf kebijakan.'}
                  </p>

                  <div className="border-t pt-3 flex items-center justify-between dark:border-slate-850 text-2xs">
                    <span className="text-slate-400">
                      Update: {hasBrief ? new Date(item.policyBrief!.updatedAt).toLocaleDateString('id-ID') : '-'}
                    </span>
                    <Link href={`/brida/policy-brief/${item.id}`}>
                      <Button size="sm" className="h-8 text-3xs bg-blue-650 hover:bg-blue-750 text-white flex items-center gap-1 font-bold">
                        <PenTool className="h-3.5 w-3.5" />
                        <span>Kelola Policy Brief</span>
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
