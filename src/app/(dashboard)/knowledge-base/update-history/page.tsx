'use client';

import React from 'react';
import { useKnowledgeBaseStore } from '@/store/useKnowledgeBaseStore';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Clock, Info } from 'lucide-react';

export default function UpdateHistoryPage() {
  const { activities } = useKnowledgeBaseStore();

  // Action badge helper
  const renderActionBadge = (action: 'Created' | 'Updated' | 'Archived' | 'Activated' | 'Deleted') => {
    let classes = '';
    switch (action) {
      case 'Created':
        classes = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/40';
        break;
      case 'Updated':
        classes = 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40';
        break;
      case 'Activated':
        classes = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40';
        break;
      case 'Archived':
        classes = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40';
        break;
      case 'Deleted':
        classes = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40';
        break;
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold border ${classes}`}>
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <PageHeader
        title="Riwayat Pembaruan Knowledge Base"
        description="Histori audit pembaruan versi dan dokumen referensi aktif BRIDA."
      />

      {/* Info Card */}
      <div className="flex gap-3 p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded text-xs text-blue-800 dark:text-blue-300">
        <Info className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="space-y-1">
          <p className="font-semibold">Log Audit Pengetahuan</p>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Halaman ini mencatat semua aktifitas perubahan yang dilakukan oleh Admin BRIDA dalam mengunggah, memperbarui, atau mengaktifkan dokumen acuan. Riwayat ini penting untuk melacak keabsahan sumber pengetahuan yang digunakan sebagai basis analisis AI.
          </p>
        </div>
      </div>

      {/* Timeline/Audit Trail Table */}
      <Card>
        <CardContent className="p-0">
          {activities.length === 0 ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-2">
              <Clock className="h-8 w-8 text-gray-300" />
              <p className="text-xs italic">Belum ada catatan aktivitas pembaruan dokumen.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold w-36">Tanggal</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold">Dokumen</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-24">Versi</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold text-center w-28">Tindakan</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold">User</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-semibold">Ringkasan Perubahan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-2xs font-semibold text-gray-550 flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>{log.date}</span>
                    </TableCell>
                    <TableCell className="font-bold text-gray-900 dark:text-white max-w-xs truncate" title={log.documentName}>
                      {log.documentName}
                    </TableCell>
                    <TableCell className="text-center font-bold text-blue-600 dark:text-blue-400">
                      {log.version !== '-' ? log.version : '-'}
                    </TableCell>
                    <TableCell className="text-center">{renderActionBadge(log.action as any)}</TableCell>
                    <TableCell className="text-2xs font-semibold text-gray-700 dark:text-gray-300">{log.user}</TableCell>
                    <TableCell className="text-2xs text-gray-600 dark:text-gray-400 leading-relaxed italic max-w-md truncate" title={log.changeSummary}>
                      &quot;{log.changeSummary}&quot;
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
