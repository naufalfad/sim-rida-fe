'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Calendar, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useProblemStore } from '@/store/useProblemStore';

export default function BridaUsulanPage() {
  const { problems, isLoading, fetchProblems } = useProblemStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  if (isLoading) {
    return <LoadingState message="Memuat daftar usulan riset daerah..." />;
  }

  const filterOptions = [
    { value: 'ALL', label: 'Semua Status' },
    { value: 'DRAFT', label: 'Draf' },
    { value: 'PROBLEM_SUBMITTED', label: 'Diajukan' },
    { value: 'VALID', label: 'Lolos Validasi' },
    { value: 'REVISION_REQUIRED', label: 'Perlu Revisi' },
    { value: 'REJECTED', label: 'Ditolak' }
  ];

  const filtered = problems.filter((p) => {
    const matchesSearch =
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.opdId && p.opdId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Daftar Seluruh Usulan OPD
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Lakukan review, validasi, dan kelola semua usulan kajian yang diajukan oleh OPD.
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 rounded-none shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Cari ID usulan, judul riset, atau OPD..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 h-10 w-full rounded-none border border-slate-300 bg-white text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <div className="w-full md:w-64">
            <Select
              options={filterOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-slate-950 dark:border-slate-800 border-slate-300 rounded-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* List content */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada usulan ditemukan"
          description="Belum ada usulan yang cocok dengan filter atau kata kunci pencarian Anda."
        />
      ) : (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 shadow-sm rounded-none">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50 dark:bg-slate-950/20">
                    <th className="py-4 px-6 font-semibold">ID</th>
                    <th className="py-4 px-4 font-semibold">Usulan / Pengusul</th>
                    <th className="py-4 px-4 font-semibold">Sektor</th>
                    <th className="py-4 px-4 font-semibold">Tanggal Diajukan</th>
                    <th className="py-4 px-4 font-semibold">Status</th>
                    <th className="py-4 px-6 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-6 font-mono font-semibold text-xs text-blue-600 dark:text-blue-400">
                        {item.id.substring(0, 8)}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200">
                        <Link href={`/brida/usulan/${item.id}`} className="hover:underline font-bold block max-w-sm sm:max-w-md truncate">
                          {item.title}
                        </Link>
                        <p className="text-xs text-slate-500 mt-1">ID OPD: {item.opdId}</p>
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {item.sector?.name || '-'}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{new Date(item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link href={`/brida/usulan/${item.id}`}>
                          <Button variant="outline" size="sm" className="rounded-none font-semibold text-blue-600 border-blue-200 hover:bg-blue-50">
                            Review <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
