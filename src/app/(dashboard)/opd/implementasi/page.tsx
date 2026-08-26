'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';
import { STATUS_LABELS, STATUS_COLORS } from '@/constants/status';
import { LoadingState } from '@/components/ui/loading-state';

export default function OpdImplementasiPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProposals = async () => {
      try {
        const all = await proposalService.getProposals();
        const filtered = all.filter(
          (p) =>
            p.status === 'EKATALOG_SENT' ||
            p.status === 'OPD_IMPLEMENTING' ||
            p.status === 'OPD_REPORTED' ||
            p.status === 'POLICY_BRIEF_DRAFT' ||
            p.status === 'POLICY_BRIEF_REVIEW' ||
            p.status === 'RECOMMENDATION_PENDING' ||
            p.status === 'RECOMMENDATION_APPROVED'
        );
        setProposals(filtered);
      } catch (err) {
        console.error('Failed to load implementasi proposals:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProposals();
  }, []);

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-sky-500';
    return 'bg-amber-500';
  };

  const getDaysRemaining = (deadline?: string) => {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (isLoading) {
    return <LoadingState message="Memuat daftar implementasi e-katalog..." />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Implementasi E-Katalog</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pantau dan laporkan progress implementasi solusi yang diperoleh melalui E-Katalog LKPP
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">{proposals.length} item aktif</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'E-Katalog Diterima',
            count: proposals.filter((p) => p.status === 'EKATALOG_SENT').length,
            color: 'from-sky-500 to-sky-600',
            icon: '📦',
          },
          {
            label: 'Sedang Implementasi',
            count: proposals.filter((p) => p.status === 'OPD_IMPLEMENTING').length,
            color: 'from-cyan-500 to-cyan-600',
            icon: '⚙️',
          },
          {
            label: 'Laporan Diserahkan',
            count: proposals.filter((p) => p.status === 'OPD_REPORTED').length,
            color: 'from-emerald-500 to-emerald-600',
            icon: '✅',
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.color} rounded-xl p-4 text-white`}
          >
            <div className="text-3xl mb-2">{card.icon}</div>
            <div className="text-2xl font-bold">{card.count}</div>
            <div className="text-sm opacity-90">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Belum Ada E-Katalog Aktif</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            E-Katalog akan muncul di sini setelah BRIDA mengirimkan link kepada OPD Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => {
            const days = getDaysRemaining(p.eKatalogDeadline);
            const isOverdue = days !== null && days < 0;
            const isNearDue = days !== null && days <= 14 && days >= 0;
            const statusColor = STATUS_COLORS[p.status];
            const latestLog =
              p.opdMonitoringLogs && p.opdMonitoringLogs.length > 0
                ? p.opdMonitoringLogs[p.opdMonitoringLogs.length - 1]
                : null;

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{p.id}</span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                      >
                        {STATUS_LABELS[p.status]}
                      </span>
                      {isOverdue && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50">
                          ⚠ Overdue
                        </span>
                      )}
                      {isNearDue && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50">
                          ⏰ Deadline dekat
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{p.title}</h3>
                    {p.eKatalogDesc && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{p.eKatalogDesc}</p>
                    )}
                  </div>
                  <Link
                    href={`/opd/implementasi/${p.id}`}
                    className="shrink-0 text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 flex items-center gap-1"
                  >
                    Kelola <span>→</span>
                  </Link>
                </div>

                {/* Progress */}
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      Progress Implementasi{' '}
                      {latestLog ? `(log terakhir: ${latestLog.date})` : ''}
                    </span>
                    <span className="font-semibold">{latestLog ? latestLog.progress : p.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(latestLog ? latestLog.progress : p.progress)}`}
                      style={{ width: `${latestLog ? latestLog.progress : p.progress}%` }}
                    />
                  </div>
                </div>

                {/* Deadline & Vendor */}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {p.eKatalogDeadline && (
                    <span className={isOverdue ? 'text-red-500 font-medium' : isNearDue ? 'text-amber-600 font-medium' : ''}>
                      🗓 Deadline:{' '}
                      {new Date(p.eKatalogDeadline).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                      {days !== null && !isOverdue && ` (${days} hari lagi)`}
                      {isOverdue && ` (${Math.abs(days!)} hari lalu)`}
                    </span>
                  )}
                  {p.opdMonitoringLogs && (
                    <span>📝 {p.opdMonitoringLogs.length} log monitoring</span>
                  )}
                  {p.opdReport && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">✔ Laporan sudah diserahkan</span>
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
