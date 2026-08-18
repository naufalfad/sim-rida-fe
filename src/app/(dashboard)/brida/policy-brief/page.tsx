'use client';

import React, { useState, useEffect } from 'react';
import { FileBadge, Calendar, Download, Eye } from 'lucide-react';
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
        // Show studies that are completed/approved recommendation
        const completedStates = ['RECOMMENDATION_APPROVED', 'COMPLETED'];
        setProposals(list.filter((p) => completedStates.includes(p.status)));
      } catch (err) {
        console.error('Failed to load policy briefs:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadPolicyBriefs();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat draf policy brief..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Executive Policy Briefs
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Ringkasan eksekutif dan saran praktis naskah kebijakan riset untuk bahan rapat Kepala Daerah.
        </p>
      </div>

      {/* Grid briefs */}
      {proposals.length === 0 ? (
        <EmptyState
          title="Belum ada policy brief terbit"
          description="Selesaikan kajian riset dan sahkan laporan akhir terlebih dahulu untuk melahirkan naskah policy brief."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {proposals.map((item) => (
            <Card key={item.id} className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center text-3xs font-mono font-bold text-blue-650 dark:text-blue-400">
                  <span>PB-{item.id}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Disahkan: {new Date(item.updatedAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                  </span>
                </div>
                <CardTitle className="text-sm font-bold text-slate-850 dark:text-slate-200 mt-2 line-clamp-2">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-3xs mt-1">
                  Pakar Penulis: {item.researcherName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <p className="text-xs text-slate-500 line-clamp-3 bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded border border-slate-100 dark:border-slate-850">
                  {item.reportReview?.reviewerNotes || 'Naskah kebijakan terintegrasi pembangunan.'}
                </p>

                <div className="border-t pt-3 flex items-center justify-between dark:border-slate-850">
                  <span className="text-[10px] text-slate-450 font-bold">Format: PDF (A4)</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-3xs flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      <span>Baca</span>
                    </Button>
                    <Button size="sm" className="h-7 text-3xs bg-blue-650 hover:bg-blue-750 flex items-center gap-1 font-bold">
                      <Download className="h-3.5 w-3.5" />
                      <span>Unduh</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
