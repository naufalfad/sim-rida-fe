'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';
import { STATUS_LABELS, STATUS_COLORS } from '@/constants/status';

export default function BridaMonitoringListPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadProposals = async () => {
      try {
        const list = await proposalService.getProposals();
        // Show proposals in e-Katalog / OPD implementation / OPD Reported phases
        const activeStates = ['EKATALOG_SENT', 'OPD_IMPLEMENTING', 'OPD_REPORTED'];
        setProposals(list.filter((p) => activeStates.includes(p.status)));
      } catch (err) {
        console.error('Failed to load monitoring list:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProposals();
  }, []);

  const filtered = proposals.filter(
    (p) =>
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.opdName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-sky-500';
    return 'bg-amber-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <div className="text-center">
          <div className="animate-spin text-3xl mb-2">⚙️</div>
          <p className="text-sm">Memuat data monitoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Monitoring Implementasi OPD
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Pantau progress implementasi solusi E-Katalog dan laporan yang dikirimkan oleh setiap OPD
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'E-Katalog Dikirim',
            count: proposals.filter((p) => p.status === 'EKATALOG_SENT').length,
            icon: '📦',
            color: 'from-sky-500 to-sky-600',
          },
          {
            label: 'Sedang Implementasi',
            count: proposals.filter((p) => p.status === 'OPD_IMPLEMENTING').length,
            icon: '⚙️',
            color: 'from-cyan-500 to-cyan-600',
          },
          {
            label: 'Laporan Masuk',
            count: proposals.filter((p) => p.status === 'OPD_REPORTED').length,
            icon: '📋',
            color: 'from-emerald-500 to-emerald-600',
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.color} rounded-xl p-4 text-white`}
          >
            <div className="text-2xl mb-1">{card.icon}</div>
            <div className="text-2xl font-bold">{card.count}</div>
            <div className="text-sm opacity-90">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          id="monitoring-search"
          type="text"
          placeholder="Cari berdasarkan ID, judul, atau OPD..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <div className="text-4xl mb-3">📭</div>
          <p className="font-medium">Tidak ada data monitoring</p>
          <p className="text-sm mt-1">Belum ada OPD yang sedang dalam tahap implementasi E-Katalog.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => {
            const sc = STATUS_COLORS[p.status];
            const latestLog =
              p.opdMonitoringLogs && p.opdMonitoringLogs.length > 0
                ? p.opdMonitoringLogs[p.opdMonitoringLogs.length - 1]
                : null;
            const latestProgress = latestLog ? latestLog.progress : 0;

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-slate-400">{p.id}</span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}
                      >
                        {STATUS_LABELS[p.status]}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 truncate">{p.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{p.opdName}</p>
                  </div>
                  <Link
                    href={`/brida/monitoring/${p.id}`}
                    className="shrink-0 text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 flex items-center gap-1"
                  >
                    Detail →
                  </Link>
                </div>

                {/* Progress */}
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Progress OPD
                      {latestLog ? ` · log terakhir ${latestLog.date}` : ''}
                    </span>
                    <span className="font-semibold">{latestProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(latestProgress)}`}
                      style={{ width: `${latestProgress}%` }}
                    />
                  </div>
                </div>

                {/* Meta info */}
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                  {p.eKatalogDeadline && (
                    <span>
                      ⏰ Deadline:{' '}
                      {new Date(p.eKatalogDeadline).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                  <span>📝 {p.opdMonitoringLogs?.length ?? 0} log monitoring</span>
                  {p.opdReport && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      ✔ Laporan akhir diterima
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
