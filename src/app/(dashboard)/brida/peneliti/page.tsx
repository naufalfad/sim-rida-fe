'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, GraduationCap, ArrowRight, UserCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { Researcher } from '@/types/brida';

export default function BridaPenelitiListPage() {
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResearchers = async () => {
      try {
        const list = await proposalService.getResearchers();
        setResearchers(list);
      } catch (err) {
        console.error('Failed to load researchers list:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadResearchers();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat database mitra peneliti..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Direktori Mitra Peneliti / Pakar
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Kelola kemitraan strategis dengan perguruan tinggi dan pusat penelitian untuk pelaksanaan riset daerah.
        </p>
      </div>

      {/* Grid of researchers */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {researchers.map((item) => (
          <Card key={item.id} className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-650 flex items-center justify-between dark:bg-blue-950/20 dark:text-blue-400">
                  <GraduationCap className="h-5 w-5 mx-auto" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-850 dark:text-slate-200 truncate max-w-[180px]">
                    {item.name}
                  </CardTitle>
                  <CardDescription className="text-3xs truncate max-w-[180px]">{item.institution}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="space-y-1 text-2xs text-slate-500">
                <span className="font-bold uppercase text-[9px] text-slate-400">Bidang Kepakaran</span>
                <p className="font-semibold text-slate-700 dark:text-slate-350 line-clamp-2">
                  {item.expertise}
                </p>
              </div>

              {item.assignedResearchTitle ? (
                <div className="p-2 border rounded border-emerald-100 bg-emerald-50/10 text-2xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">Riset Aktif:</span>
                  <p className="text-slate-700 dark:text-slate-300 font-semibold line-clamp-1 mt-0.5">
                    {item.assignedResearchTitle}
                  </p>
                </div>
              ) : (
                <div className="p-2 border rounded border-slate-100 bg-slate-50/50 text-2xs text-slate-500 text-center">
                  Tersedia untuk Riset Baru
                </div>
              )}

              <div className="border-t pt-3 flex items-center justify-end dark:border-slate-850">
                <Link href={`/brida/peneliti/${item.id}`}>
                  <Button size="sm" variant="ghost" className="h-7 text-3xs flex items-center gap-1 font-bold">
                    <span>Kelola Profil</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
