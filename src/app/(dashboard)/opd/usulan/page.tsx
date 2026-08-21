'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Calendar, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useProblemStore } from '@/store/useProblemStore';

export default function OpdUsulanPage() {
  const { problems, isLoading, error, fetchProblems } = useProblemStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  if (isLoading) {
    return <LoadingState message="Memuat daftar usulan masalah..." />;
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50">
        Terjadi kesalahan: {error}
      </div>
    );
  }

  // Filter options based on problem validation status
  const filterOptions = [
    { value: 'ALL', label: 'Semua Status' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SUBMITTED', label: 'Diajukan' },
    { value: 'VALID', label: 'Valid / Disetujui' },
    { value: 'REVISION_REQUIRED', label: 'Revisi' },
    { value: 'REJECTED', label: 'Ditolak' },
  ];

  // Filtering logic
  const filtered = problems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.mainFocus.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sector?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daftar Usulan Masalah</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Kelola draf usulan masalah pembangunan daerah Anda.
          </p>
        </div>
        <Link href="/opd/usulan/new">
          <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750">
            <PlusCircle className="h-4 w-4" />
            <span>Buat Usulan Baru</span>
          </Button>
        </Link>
      </div>

      {/* Filters Card */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          {/* Search Box */}
          <div className="w-full md:flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Cari judul masalah atau sektor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 h-10 w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          {/* Status Dropdown */}
          <div className="w-full md:w-64">
            <Select
              options={filterOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-slate-950 dark:border-slate-800 border-slate-300"
            />
          </div>
        </CardContent>
      </Card>

      {/* Proposals list block */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada usulan ditemukan"
          description={
            searchTerm || statusFilter !== 'ALL'
              ? 'Coba ganti filter pencarian atau status Anda untuk menemukan hasil.'
              : 'Anda belum memiliki draf usulan masalah. Mulai buat usulan pertama Anda sekarang!'
          }
          actionLabel={!searchTerm && statusFilter === 'ALL' ? 'Buat Usulan Baru' : undefined}
          onAction={!searchTerm && statusFilter === 'ALL' ? () => {} : undefined}
        />
      ) : (
        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/50 dark:bg-slate-950/20">
                    <th className="py-3.5 px-4 font-semibold">Judul Masalah</th>
                    <th className="py-3.5 px-4 font-semibold">Sektor</th>
                    <th className="py-3.5 px-4 font-semibold">Tanggal Diajukan</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-6 font-semibold text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all group">
                      <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200">
                        <Link href={`/opd/usulan/${item.id}`} className="hover:underline font-bold block max-w-sm sm:max-w-md truncate">
                          {item.title}
                        </Link>
                        <p className="text-xs text-slate-450 dark:text-slate-500 line-clamp-1 mt-0.5">
                          {item.mainFocus}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-slate-655 dark:text-slate-400">
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
                        <Link href={`/opd/usulan/${item.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                            <ChevronRight className="h-4 w-4" />
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
