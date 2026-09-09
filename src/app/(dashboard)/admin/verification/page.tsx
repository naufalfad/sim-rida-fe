'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOpdStore } from '@/store/useOpdStore';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
  ClipboardList,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Building,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export default function AdminVerificationPage() {
  const router = useRouter();
  const { proposals, fetchVerificationInbox, fetchProposals, isLoadingProposals } = useOpdStore();

  const [search, setSearch] = useState('');

  useEffect(() => {
    // Fetch inbox usulan menunggu verifikasi dari backend
    fetchVerificationInbox();
    // Also fetch all proposals to show total history
    fetchProposals();
  }, [fetchVerificationInbox, fetchProposals]);

  const handleRefresh = () => {
    fetchVerificationInbox();
    fetchProposals();
  };

  // Proposals waiting for verification (PENDING) or already verified
  const pendingProposals = useMemo(() => {
    return proposals.filter((p) => p.status === 'PENDING');
  }, [proposals]);

  const allSubmittedProposals = useMemo(() => {
    return proposals.filter((p) => p.status !== 'DRAFT').filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.opdName.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [proposals, search]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Header Banner */}
      <div className="border border-slate-200 bg-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-[#0f2c59]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#0f2c59] text-xs font-bold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            Modul Verifikasi & Validasi Usulan (Gatekeeper)
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Inbox Verifikasi Berkas Administrasi OPD
          </h1>
          <p className="text-slate-600 text-xs max-w-3xl leading-relaxed">
            Pintu gerbang penelaahan awal berkas usulan riset dari seluruh Perangkat Daerah Kabupaten Mimika. Periksa kelengkapan 4 kriteria administrasi, telaah dokumen KAK/TOR, dan tentukan apakah usulan diloloskan ke tahap scoring atau dikembalikan untuk revisi.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isLoadingProposals}
            className="p-2 border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            title="Segarkan data inbox"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProposals ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <span className="px-3.5 py-1.5 bg-amber-50 text-amber-900 font-mono font-bold text-xs border border-amber-300">
            {pendingProposals.length} Menunggu Verifikasi
          </span>
        </div>
      </div>

      {/* Main Inbox Table Container */}
      <div className="border border-slate-200 bg-white">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#0f2c59]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Daftar Usulan Masuk dari OPD ({allSubmittedProposals.length})
            </h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari OPD, kode, atau judul usulan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 bg-white focus:border-[#0f2c59] focus:outline-none focus:ring-1 focus:ring-[#0f2c59]"
            />
          </div>
        </div>

        <div>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 text-2xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200">
                <TableHead className="w-14 text-center py-3">No.</TableHead>
                <TableHead className="w-32 text-center py-3">Kode Usulan</TableHead>
                <TableHead className="w-48 text-left py-3">Instansi Pengusul</TableHead>
                <TableHead className="text-left py-3">Uraian Masalah & Judul</TableHead>
                <TableHead className="w-36 text-center py-3">Kelengkapan Berkas</TableHead>
                <TableHead className="w-36 text-center py-3">Status Gatekeeper</TableHead>
                <TableHead className="w-36 text-center py-3">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-200">
              {allSubmittedProposals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada berkas usulan yang ditemukan di inbox verifikasi.
                  </TableCell>
                </TableRow>
              ) : (
                allSubmittedProposals.map((item, idx) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* No. (Centered) */}
                    <TableCell className="text-center align-middle text-xs font-semibold text-slate-500 py-3.5">
                      {idx + 1}
                    </TableCell>

                    {/* Kode Usulan (Centered) */}
                    <TableCell className="text-center align-middle py-3.5">
                      <span className="font-mono text-xs font-bold text-[#0f2c59] block">
                        {item.code}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{item.submittedAt}</span>
                    </TableCell>

                    {/* Instansi Pengusul (Left) */}
                    <TableCell className="text-left align-middle py-3.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-44">{item.opdName}</span>
                      </div>
                      <span className="text-2xs text-slate-500 block mt-0.5 uppercase tracking-wider">{item.category}</span>
                    </TableCell>

                    {/* Uraian Masalah & Judul (Left) */}
                    <TableCell className="text-left align-middle py-3.5">
                      <span className="font-bold text-xs text-slate-900 block leading-snug">
                        {item.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {item.estimatedBudget && (
                          <span className="inline-flex items-center gap-1 text-2xs font-mono font-bold text-[#0f2c59] bg-[#dde6f2] px-2 py-0.5 border border-[#bfd2e6]">
                            Pagu: Rp {item.estimatedBudget.toLocaleString('id-ID')}
                          </span>
                        )}
                        {item.torDocument && (
                          <span className="inline-flex items-center gap-1 text-2xs font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 border border-blue-200">
                            <FileText className="h-3 w-3 text-blue-700" /> KAK / TOR Terlampir
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-1">
                        {item.problemStatement}
                      </p>
                    </TableCell>

                    {/* Kelengkapan Berkas (Centered) */}
                    <TableCell className="text-center align-middle py-3.5 text-xs">
                      {item.supportingDocuments.length > 0 ? (
                        <span className="inline-flex items-center justify-center gap-1 text-emerald-800 font-semibold text-2xs bg-emerald-50 px-2 py-0.5 border border-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          {item.supportingDocuments.length} Berkas
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 text-amber-900 font-semibold text-2xs bg-amber-50 px-2 py-0.5 border border-amber-300">
                          <AlertTriangle className="h-3 w-3" />
                          Tanpa Lampiran
                        </span>
                      )}
                    </TableCell>

                    {/* Status Gatekeeper (Centered) */}
                    <TableCell className="text-center align-middle py-3.5">
                      {item.status === 'PENDING' ? (
                        <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300">
                          <Clock className="h-3 w-3" />
                          Menunggu Verifikasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider bg-[#f0f4f9] text-[#0f2c59] border-[#bfd2e6]">
                          <CheckCircle2 className="h-3 w-3" />
                          Terverifikasi
                        </span>
                      )}
                    </TableCell>

                    {/* Aksi (Centered) */}
                    <TableCell className="text-center align-middle py-3.5">
                      <button
                        onClick={() => router.push(`/admin/verification/${item.id}`)}
                        className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition border inline-flex items-center justify-center gap-1.5 mx-auto ${
                          item.status === 'PENDING'
                            ? 'bg-[#0f2c59] hover:bg-[#0a1e3f] text-white border-[#0f2c59]'
                            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                        }`}
                      >
                        <span>{item.status === 'PENDING' ? 'Verifikasi' : 'Detail'}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>

                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

    </div>
  );
}
