'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Award, Calendar, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function PersetujuanRekomendasiListPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadQueue = async () => {
      try {
        const list = await proposalService.getProposals();
        setProposals(list.filter((p) => p.status === 'RECOMMENDATION_PENDING'));
      } catch (err) {
        console.error('Failed to load recommendation approval queue:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadQueue();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat draf surat rekomendasi..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Penandatanganan SK Rekomendasi Bupati
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Sahkan draf SK rekomendasi kebijakan strategis yang ditujukan kepada OPD terkait berdasarkan temuan riset daerah.
        </p>
      </div>

      {/* List */}
      {proposals.length === 0 ? (
        <EmptyState
          title="Antrean persetujuan kosong"
          description="Seluruh draf SK Rekomendasi Bupati telah ditandatangani dan diteruskan ke OPD pengusul."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proposals.map((item) => (
            <Card key={item.id} className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center text-3xs font-mono font-bold text-teal-650 dark:text-teal-400">
                  <span>{item.id}</span>
                  <span>Menunggu TTD Bupati</span>
                </div>
                <CardTitle className="text-sm font-bold text-slate-855 dark:text-slate-205 mt-2 line-clamp-2">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-3xs mt-1">
                  Penerima Tindak Lanjut: <strong>{item.opdName}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="border-t pt-3 flex items-center justify-between text-2xs text-slate-450 dark:border-slate-850">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Draf Masuk: {new Date(item.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                  </div>
                  <Link href={`/kepala-brida/persetujuan-rekomendasi/${item.id}`}>
                    <Button size="sm" className="h-7 text-3xs bg-teal-655 hover:bg-teal-750 flex items-center gap-1 font-bold">
                      <span>Periksa TTD</span>
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
