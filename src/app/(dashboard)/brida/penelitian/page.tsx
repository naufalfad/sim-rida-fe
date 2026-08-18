'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlayCircle, Calendar, User, Search, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function BridaPenelitianListPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const list = await proposalService.getProposals();
        // Show active research projects
        const activeStates = ['IN_PROGRESS', 'MONITORING', 'REPORT_SUBMITTED', 'RECOMMENDATION_APPROVED', 'COMPLETED'];
        setProposals(list.filter((p) => activeStates.includes(p.status)));
      } catch (err) {
        console.error('Failed to load research projects list:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProjects();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat proyek penelitian..." />;
  }

  const filtered = proposals.filter((p) =>
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.researcherName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Pelaksanaan Penelitian Daerah
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Lacak anggaran, timeline target, milestones, dan koordinasi dengan mitra peneliti utama.
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
              placeholder="Cari ID penelitian, judul riset, atau mitra peneliti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 h-10 w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid of active research projects */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada penelitian aktif"
          description="Saat ini belum ada penelitian yang sedang berjalan dalam tahun anggaran ini."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((item) => (
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
                  <User className="h-3 w-3" />
                  <span>Mitra: {item.researcherName || 'Belum Ditunjuk'}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-2xs font-semibold text-slate-500">
                    <span>Kemajuan Penelitian</span>
                    <span>{item.progress}%</span>
                  </div>
                  <ProgressIndicator value={item.progress} size="sm" variant={item.progress === 100 ? 'success' : 'primary'} />
                </div>

                <div className="border-t pt-3 flex items-center justify-between text-2xs text-slate-450 dark:border-slate-850">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Waktu Riset: {item.research?.estimasiWaktu || '-'}</span>
                  </div>
                  <Link href={`/brida/penelitian/${item.id}`}>
                    <Button variant="ghost" size="sm" className="h-7 text-3xs flex items-center gap-1 font-bold">
                      <span>Lihat Rincian</span>
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
