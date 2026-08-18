'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Award, AlertCircle, CheckCircle, Search, ChevronRight, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { proposalService } from '@/lib/api/proposals';
import { FollowUp } from '@/types/proposals';

export default function OpdTindakLanjutPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadFollowUps = async () => {
      try {
        const list = await proposalService.getFollowUps();
        setFollowUps(list);
      } catch (err) {
        console.error('Failed to load followups:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadFollowUps();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat rekomendasi tindak lanjut..." />;
  }

  const filtered = followUps.filter((f) =>
    f.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.recommendationText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tindak Lanjut Rekomendasi</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Ubah rekomendasi hasil riset menjadi rencana aksi konkret (Action Plan), laporkan realisasi berkala, dan unggah bukti fisik implementasi.
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
              placeholder="Cari ID tindak lanjut, tema rekomendasi, atau kata kunci..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 h-10 w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Content grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada tindak lanjut ditemukan"
          description="OPD Anda belum memiliki rekomendasi riset daerah yang disahkan Kepala Daerah untuk ditindaklanjuti."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <Card key={item.id} className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm hover:border-slate-350 transition-all">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Meta details */}
                <div className="space-y-2 md:flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-blue-650 dark:text-blue-400">
                      {item.id}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : item.status === 'IN_PROGRESS'
                          ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-450 animate-pulse'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}
                    >
                      {item.status === 'PENDING' ? 'BUTUH RENCANA AKSI' : item.status === 'IN_PROGRESS' ? 'PELAKSANAAN' : 'SELESAI'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 italic bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded border border-slate-100 dark:border-slate-850">
                    &ldquo;{item.recommendationText}&rdquo;
                  </p>
                </div>

                {/* Progress bar and view button */}
                <div className="flex flex-col sm:flex-row sm:items-center md:flex-col md:items-start gap-4 md:gap-3 w-full md:w-64">
                  <div className="flex-1 w-full space-y-1">
                    <div className="flex justify-between text-2xs font-semibold text-slate-550">
                      <span>Progres Tindak Lanjut</span>
                      <span className="font-bold">{item.progress}%</span>
                    </div>
                    <ProgressIndicator value={item.progress} size="sm" variant={item.status === 'COMPLETED' ? 'success' : 'primary'} />
                  </div>

                  <Link href={`/opd/tindak-lanjut/${item.id}`} className="w-full sm:w-auto md:w-full">
                    <Button variant="outline" size="sm" className="w-full text-xs h-9 flex items-center justify-between gap-2">
                      <span>Kelola Aksi</span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
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
