'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Calendar, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

export default function BridaUsulanPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const loadProposals = async () => {
      try {
        const list = await proposalService.getProposals();
        setProposals(list);
      } catch (err) {
        console.error('Failed to load proposals:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProposals();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat daftar usulan riset daerah..." />;
  }

  const filterOptions = [
    { value: 'ALL', label: 'Semua Status' },
    { value: 'SUBMITTED', label: 'Diajukan' },
    { value: 'ADMINISTRATIVE_REVIEW', label: 'Verifikasi Administrasi' },
    { value: 'SUBSTANTIVE_REVIEW', label: 'Review Substansi' },
    { value: 'SCORING', label: 'Penilaian' },
    { value: 'SELECTION_RECOMMENDED', label: 'Rekomendasi Seleksi' },
    { value: 'APPROVED', label: 'Lolos Seleksi' },
    { value: 'IN_PROGRESS', label: 'Pelaksanaan' },
    { value: 'COMPLETED', label: 'Selesai' },
  ];

  const filtered = proposals.filter((p) => {
    const matchesSearch =
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.opdName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-805 dark:text-slate-205">
          Daftar Seluruh Usulan Riset
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Evaluasi semua riwayat usulan masalah, KAK, penilai riset, dan rencana aksi tindak lanjut OPD.
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Cari nomor ID usulan, judul riset, atau OPD pengusul..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 h-10 w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

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

      {/* List content */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada usulan ditemukan"
          description="Coba ganti kata kunci pencarian atau bersihkan filter status."
        />
      ) : (
        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/50 dark:bg-slate-950/20">
                    <th className="py-3.5 px-6 font-semibold">ID</th>
                    <th className="py-3.5 px-4 font-semibold">Usulan / Pengusul</th>
                    <th className="py-3.5 px-4 font-semibold">Bidang</th>
                    <th className="py-3.5 px-4 font-semibold">Tanggal Diajukan</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-6 font-semibold text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all">
                      <td className="py-4 px-6 font-mono font-semibold text-xs text-blue-650 dark:text-blue-400">
                        {item.id}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200">
                        <Link href={`/brida/usulan/${item.id}`} className="hover:underline font-bold block max-w-sm sm:max-w-md truncate">
                          {item.title}
                        </Link>
                        <p className="text-2xs text-slate-500 mt-0.5">{item.opdName}</p>
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-slate-655 dark:text-slate-400">
                        {item.problem.bidang}
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
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900 rounded-full">
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
