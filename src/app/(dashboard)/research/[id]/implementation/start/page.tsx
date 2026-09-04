'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useImplementationStore } from '@/store/useImplementationStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Play,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function StartImplementationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { getImplementation, startImplementation } = useImplementationStore();
  const { researchRecords } = useResearchStore();

  const id = params?.id || '';
  const isBrida = user?.role === 'BRIDA' || user?.role === 'ADMIN_BRIDA';

  // Access checks
  useEffect(() => {
    if (user && user.role !== 'BRIDA' && user.role !== 'ADMIN_BRIDA') {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  const impl = getImplementation(id);

  // Find target research record
  const record = useMemo(() => {
    const found = researchRecords.find((r) => r.id === id || r.proposalId === id);
    if (found) return found;
    if (impl?.proposalTitle) {
      return {
        id: impl.researchId || id,
        title: impl.proposalTitle,
        opd: impl.opdName || 'BAPPEDA',
        status: impl.status === 'COMPLETED' ? ('COMPLETED' as const) : ('ACTIVE' as const),
        priority: 'HIGH' as const,
        approvedDate: impl.startedDate || '2026-09-01',
        proposalId: impl.researchId || id,
        identificationId: 'PRI-2026-001',
      };
    }
    return {
      id,
      title: `Penelitian #${id}`,
      opd: 'BAPPEDA',
      status: 'ACTIVE' as const,
      priority: 'HIGH' as const,
      approvedDate: '2026-09-01',
      proposalId: id,
      identificationId: 'PRI-2026-001',
    };
  }, [researchRecords, id, impl]);

  // Redirect if already active
  useEffect(() => {
    if (impl && impl.status !== 'READY') {
      toast('Pelaksanaan penelitian sudah dimulai.', 'warning');
      router.replace(`/research/${id}/implementation`);
    }
  }, [impl, id, router, toast]);

  // Default date to today's date in YYYY-MM-DD
  const getTodayDateStr = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [actualStartDate, setActualStartDate] = useState(getTodayDateStr());

  const handleStart = () => {
    if (!actualStartDate) {
      toast('Tanggal mulai aktual wajib diisi.', 'warning');
      return;
    }

    startImplementation(id, actualStartDate, user?.name || 'BRIDA Litbang');
    toast('Pelaksanaan penelitian berhasil dimulai! Status riset kini ACTIVE.', 'success');
    router.push(`/research/${id}/implementation`);
  };

  if (!record) {
    return (
      <div className="space-y-6 text-center py-12 font-sans">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Rekod Penelitian Tidak Ditemukan</h2>
        <button
          onClick={() => router.push('/research')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push(`/research/${id}`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Detail Penelitian</span>
        </button>
      </div>

      <PageHeader
        title="Mulai Pelaksanaan Penelitian"
        description={`Konfirmasi pembaruan status inisiasi pelaksanaan aktif untuk program riset: "${record.title}"`}
      />

      <div className="max-w-md mx-auto">
        <Card className="border-purple-200 bg-purple-50/5">
          <CardContent className="p-6 space-y-6 text-xs font-semibold">
            
            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 rounded text-purple-750 dark:text-purple-400">
              <AlertTriangle className="h-5 w-5 shrink-0 text-purple-650" />
              <div className="space-y-1">
                <span className="font-bold block uppercase text-[8px]">Perhatian Tindakan:</span>
                <p className="font-medium leading-relaxed">
                  Tindakan ini akan meresmikan dimulainya riset, mengubah status penelitian menjadi **ACTIVE**, serta mengaktifkan modul timeline pengerjaan dan monitoring berkala.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Tanggal Mulai Aktual (Actual Start Date) *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={actualStartDate}
                  onChange={(e) => setActualStartDate(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border rounded focus:outline-none bg-white text-gray-900 focus:border-purple-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => router.push(`/research/${id}`)}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-750 dark:text-gray-300 rounded text-xs font-semibold bg-white dark:bg-gray-950"
              >
                Batal
              </button>
              <button
                onClick={handleStart}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Start Implementation</span>
              </button>
            </div>

          </CardContent>
        </Card>
      </div>

    </div>
  );
}
