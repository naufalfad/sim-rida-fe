'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Calendar, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function BridaVerifikasiListPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVerificationQueue = async () => {
      try {
        const list = await proposalService.getProposals();
        // Show only submitted proposals
        setProposals(list.filter((p) => p.status === 'SUBMITTED' || p.status === 'PROBLEM_SUBMITTED'));
      } catch (err) {
        console.error('Failed to load submitted proposals:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadVerificationQueue();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat antrean verifikasi administrasi..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Verifikasi Administrasi Usulan
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Periksa kelengkapan administrasi usulan masalah, rencana riset daerah, dan dokumen KAK pendukung.
        </p>
      </div>

      {/* Grid of Submitted Proposals */}
      {proposals.length === 0 ? (
        <EmptyState
          title="Antrean verifikasi kosong"
          description="Seluruh usulan baru dari OPD telah diverifikasi secara administratif."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proposals.map((item) => (
            <Link key={item.id} href={`/brida/verifikasi/${item.id}`} className="block group">
              <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm flex flex-col h-full justify-between hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                <CardHeader className="pb-2">
                  <span className="font-mono text-2xs font-bold text-blue-650 dark:text-blue-405 group-hover:text-blue-600 transition-colors">
                    {item.id}
                  </span>
                  <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-[10px]">
                    OPD: {item.opdName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-t pt-3 flex items-center justify-between text-2xs text-slate-450 dark:border-slate-850">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Masuk: {new Date(item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                    </div>
                    <span className="text-3xs text-blue-650 dark:text-blue-400 flex items-center gap-1 font-bold group-hover:underline">
                      <span>Periksa</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
