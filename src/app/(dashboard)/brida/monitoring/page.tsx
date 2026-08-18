'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Calendar, User, ChevronRight, AlertCircle, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function BridaMonitoringListPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadMonitoringQueue = async () => {
      try {
        const list = await proposalService.getProposals();
        // Show active projects in progress/monitoring/report phases
        const activeStates = ['IN_PROGRESS', 'MONITORING', 'REPORT_SUBMITTED'];
        setProposals(list.filter((p) => activeStates.includes(p.status)));
      } catch (err) {
        console.error('Failed to load monitoring queue:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadMonitoringQueue();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat pemantauan aktivitas riset..." />;
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
          Monitoring & Kendala Riset
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Evaluasi kendala teknis (issues), manajemen risiko (risks), dan bukti pengerjaan laporan berkala dari mitra pelaksana.
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

      {/* List content */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada aktivitas riset berjalan"
          description="Saat ini belum ada penelitian yang sedang berjalan dalam fase pengerjaan lapangan."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((item) => {
            const openIssues = (item.issues || []).filter((i) => i.status === 'OPEN');
            const hasHighIssue = openIssues.some((i) => i.severity === 'HIGH');
            
            return (
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
                  <CardDescription className="text-3xs flex items-center gap-1 mt-1 font-semibold">
                    <User className="h-3 w-3 text-slate-450" />
                    <span>Mitra: {item.researcherName || 'Belum Ditunjuk'}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-2xs font-semibold text-slate-500">
                      <span>Progres Pelaksanaan</span>
                      <span>{item.progress}%</span>
                    </div>
                    <ProgressIndicator value={item.progress} size="sm" />
                  </div>

                  {/* Issues indicators */}
                  <div className="flex gap-2 items-center text-xs">
                    {openIssues.length > 0 ? (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-2xs font-bold ${
                        hasHighIssue
                          ? 'bg-red-50 text-red-750 dark:bg-red-950/20 dark:text-red-400'
                          : 'bg-amber-50 text-amber-750 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}>
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>{openIssues.length} Kendala Terbuka</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-1 rounded text-2xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450">
                        <span>Aman (Tidak Ada Kendala)</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3 flex items-center justify-between text-2xs text-slate-450 dark:border-slate-850">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Updated: {new Date(item.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                    </div>
                    <Link href={`/brida/monitoring/${item.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-3xs flex items-center gap-1 font-bold">
                        <span>Buka Monitoring</span>
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
