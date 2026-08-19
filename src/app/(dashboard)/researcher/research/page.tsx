'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClipboardList, Calendar, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { proposalService } from '@/lib/api/proposals';
import { authService } from '@/lib/api/auth';
import { Proposal } from '@/types/proposals';

export default function ResearcherResearchListPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadQueue = async () => {
      try {
        const user = authService.getCurrentUser();
        if (user) {
          const list = await proposalService.getProposals();
          setProposals(list.filter((p) => p.researcherId === user.id));
        }
      } catch (err) {
        console.error('Failed to load researcher projects:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadQueue();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat daftar proyek riset Anda..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Proyek Riset Saya
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Kelola rincian kajian lapangan, pantau milestone capaian kerja, dan kumpulkan dokumen hasil penelitian daerah.
        </p>
      </div>

      {/* List */}
      {proposals.length === 0 ? (
        <EmptyState
          title="Belum ada proyek ditugaskan"
          description="Anda belum memiliki penugasan aktif dari BRIDA. Kontak Admin BRIDA untuk konfirmasi kerja sama."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proposals.map((item) => (
            <Card key={item.id} className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center text-3xs font-mono font-bold text-blue-650 dark:text-blue-400">
                  <span>{item.id}</span>
                  <StatusBadge status={item.status} />
                </div>
                <CardTitle className="text-sm font-bold text-slate-855 dark:text-slate-205 mt-2 line-clamp-2">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-3xs">
                  OPD Pengusul: {item.opdName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="space-y-1 text-2xs">
                  <div className="flex justify-between font-semibold">
                    <span>Progress Kerja</span>
                    <span>{item.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>

                <div className="border-t pt-3 flex items-center justify-between text-2xs text-slate-450 dark:border-slate-850">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Tenggat: {item.problem.targetPenyelesaian}</span>
                  </div>
                  <Link href={`/researcher/research/${item.id}`}>
                    <Button size="sm" className="h-7 text-3xs bg-blue-655 hover:bg-blue-750 flex items-center gap-1 font-bold">
                      <span>Rincian</span>
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
