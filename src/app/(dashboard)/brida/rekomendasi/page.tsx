'use client';

import React, { useState, useEffect } from 'react';
import { Award, Calendar, Download, Eye } from 'lucide-react';
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
        const approvedStates = ['RECOMMENDATION_APPROVED', 'COMPLETED'];
        setProposals(list.filter((p) => approvedStates.includes(p.status)));
      } catch (err) {
        console.error('Failed to load rekomendasi:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadRekomendasi();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat rekomendasi bupati..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Rekomendasi Kebijakan Bupati
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Rekomendasi kebijakan resmi yang diterbitkan dan ditandatangani Bupati untuk diimplementasikan oleh OPD terkait.
        </p>
      </div>

      {/* Grid */}
      {proposals.length === 0 ? (
        <EmptyState
          title="Tidak ada rekomendasi resmi"
          description="Riset belum melahirkan rekomendasi kebijakan formal yang disahkan Bupati."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {proposals.map((item) => (
            <Card key={item.id} className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center text-3xs font-mono font-bold text-teal-650 dark:text-teal-400">
                  <span>REC-{item.id}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Disahkan: {new Date(item.updatedAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                  </span>
                </div>
                <CardTitle className="text-sm font-bold text-slate-850 dark:text-slate-200 mt-2 line-clamp-2">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-3xs mt-1 text-slate-400">
                  OPD Pelaksana: {item.opdName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="p-3 bg-teal-50/10 border border-teal-100 rounded-lg text-xs leading-relaxed italic text-slate-700 dark:text-slate-350">
                  &ldquo;Berdasarkan hasil kajian, direkomendasikan untuk melakukan tindak lanjut rencana aksi pembangunan daerah terintegrasi.&rdquo;
                </div>

                <div className="border-t pt-3 flex items-center justify-between dark:border-slate-850">
                  <span className="text-[10px] text-slate-450 font-bold">Surat Keputusan Bupati</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-3xs flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      <span>Lihat SK</span>
                    </Button>
                    <Button size="sm" className="h-7 text-3xs bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1 font-bold">
                      <Download className="h-3.5 w-3.5" />
                      <span>Unduh SK</span>
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
