'use client';
import React, { useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlanningStore } from '@/store/usePlanningStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
  ArrowLeft,
  Printer,
  Download,
  Edit,
  DollarSign,
  Info
} from 'lucide-react';

export default function RabDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { getRab, fetchPlanning } = usePlanningStore();
  const { researchRecords, fetchProposals } = useResearchStore();

  const isBrida = user?.role === 'BRIDA';
  const id = params?.id || '';

  useEffect(() => {
    fetchPlanning();
    fetchProposals();
  }, [id, fetchPlanning, fetchProposals]);

  const record = useMemo(() => {
    return researchRecords.find((r) => r.id === id);
  }, [researchRecords, id]);

  const rab = getRab(id);

  // Grand Total calculation
  const grandTotal = useMemo(() => {
    return rab.items.reduce((sum, item) => sum + item.subtotal, 0);
  }, [rab]);

  // Subtotal grouping by Category
  const categorySubtotals = useMemo(() => {
    const map: Record<string, number> = {};
    rab.items.forEach((item) => {
      map[item.category] = (map[item.category] || 0) + item.subtotal;
    });
    return Object.entries(map);
  }, [rab]);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const handlePrint = () => {
    toast('Printer dialog diaktifkan (Simulasi cetak dokumen RAB).', 'success');
  };

  const handleDownload = () => {
    toast('Mengunduh RAB dalam format PDF terenkripsi (Simulasi).', 'success');
  };

  if (!record || rab.status === 'NOT_STARTED') {
    return (
      <div className="space-y-6 text-center py-12 font-sans">
        <h2 className="text-sm font-bold text-gray-800 dark:text-white">Dokumen RAB Belum Dibuat</h2>
        <p className="text-xs text-gray-500">Mulai buat RAB dari Planning Overview.</p>
        <button
          onClick={() => router.push(`/research/${id}/planning`)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold"
        >
          Kembali ke Planning
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back link */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.push(`/research/${record.id}/planning`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Planning</span>
        </button>
        
        {/* Top Actions */}
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="p-1.5 border border-gray-300 hover:bg-gray-50 rounded bg-white text-gray-700 dark:border-gray-850 dark:hover:bg-gray-900 dark:text-gray-300 flex items-center justify-center"
            title="Cetak RAB"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 border border-gray-300 hover:bg-gray-50 rounded bg-white text-gray-700 dark:border-gray-850 dark:hover:bg-gray-900 dark:text-gray-300 flex items-center justify-center"
            title="Unduh PDF"
          >
            <Download className="h-4 w-4" />
          </button>
          {isBrida && rab.status !== 'APPROVED' && rab.status !== 'UNDER_REVIEW' && (
            <button
              onClick={() => router.push(`/research/${record.id}/rab/edit`)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-2xs font-bold flex items-center gap-1 shadow"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit RAB</span>
            </button>
          )}
        </div>
      </div>

      <PageHeader
        title={`Rencana Anggaran Biaya (RAB) #${record.id}`}
        description={`Versi: v${rab.version} • Status: ${rab.status}`}
      />

      {/* Formal Document layout */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left main table grid */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Daftar Rincian Belanja Sektoral
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {rab.items.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400 italic">
                  Rincian komponen belanja masih kosong.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center text-3xs font-semibold">No</TableHead>
                      <TableHead className="text-3xs font-semibold">Komponen / Uraian Belanja</TableHead>
                      <TableHead className="text-3xs font-semibold w-24 text-center">Volume</TableHead>
                      <TableHead className="text-3xs font-semibold w-24 text-center">Satuan</TableHead>
                      <TableHead className="text-3xs font-semibold text-right w-32">Harga Satuan</TableHead>
                      <TableHead className="text-3xs font-semibold text-right w-36">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rab.items.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center font-bold text-gray-450">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="font-bold text-gray-800 dark:text-gray-250 leading-normal">{item.component}</div>
                          <div className="text-[10px] text-gray-400 font-semibold">{item.category} • {item.description}</div>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-gray-800 dark:text-gray-300">{item.volume}</TableCell>
                        <TableCell className="text-center text-gray-500 font-medium text-2xs">{item.unit}</TableCell>
                        <TableCell className="text-right font-medium text-gray-700 dark:text-gray-300">{formatIDR(item.unitPrice)}</TableCell>
                        <TableCell className="text-right font-bold text-gray-900 dark:text-white">{formatIDR(item.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right summary cards */}
        <div className="space-y-6">
          {/* Budget Grand Total */}
          <Card className="border-purple-200 dark:border-purple-900/60 bg-purple-50/5">
            <CardHeader className="pb-2 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-purple-750 dark:text-purple-400 flex items-center gap-1.5">
                <DollarSign className="h-4 w-4" />
                <span>Akumulasi Total Anggaran</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-center space-y-2">
              <span className="text-[10px] text-gray-400 font-bold block uppercase leading-none">Grand Total RAB</span>
              <span className="text-lg font-extrabold text-purple-700 dark:text-purple-400 block">
                {formatIDR(grandTotal)}
              </span>
              <span className="text-[9px] text-gray-400 block leading-tight font-medium">
                Akumulasi belanja honorarium, FGD, perjalanan dinas, dan administrasi sampel.
              </span>
            </CardContent>
          </Card>

          {/* Subtotal Tally Categories summary */}
          <Card>
            <CardHeader className="pb-2 border-b dark:border-gray-850">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Subtotal per Kategori
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs">
              {categorySubtotals.length === 0 ? (
                <p className="text-2xs text-gray-400 italic">Belum ada item belanja.</p>
              ) : (
                categorySubtotals.map(([category, subtotal]) => (
                  <div key={category} className="flex justify-between items-baseline text-2xs pb-1.5 border-b border-gray-100 dark:border-gray-850">
                    <span className="font-semibold text-gray-650 dark:text-gray-400">{category}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatIDR(subtotal)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
