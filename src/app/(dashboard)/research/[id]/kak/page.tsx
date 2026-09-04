'use client';
import React, { useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlanningStore } from '@/store/usePlanningStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Printer,
  Download,
  Edit,
  FileText,
  Sparkles,
  Info
} from 'lucide-react';

export default function KakDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { getKak, fetchPlanning } = usePlanningStore();
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

  const kak = getKak(id);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const handlePrint = () => {
    toast('Printer dialog diaktifkan (Simulasi cetak dokumen KAK).', 'success');
  };

  const handleDownload = () => {
    toast('Mengunduh KAK dalam format PDF terenkripsi (Simulasi).', 'success');
  };

  if (!record || kak.status === 'NOT_STARTED') {
    return (
      <div className="space-y-6 text-center py-12 font-sans">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-sm font-bold text-gray-800 dark:text-white">Dokumen KAK Belum Dibuat</h2>
        <p className="text-xs text-gray-500">Mulai buat KAK dari Planning Overview.</p>
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
      
      {/* Back button */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.push(`/research/${record.id}/planning`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Planning</span>
        </button>
        
        {/* Top actions */}
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="p-1.5 border border-gray-300 hover:bg-gray-50 rounded bg-white text-gray-700 dark:border-gray-850 dark:hover:bg-gray-900 dark:text-gray-300 flex items-center justify-center"
            title="Cetak KAK"
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
          {isBrida && kak.status !== 'APPROVED' && kak.status !== 'UNDER_REVIEW' && (
            <button
              onClick={() => router.push(`/research/${record.id}/kak/edit`)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-2xs font-bold flex items-center gap-1 shadow"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit KAK</span>
            </button>
          )}
        </div>
      </div>

      {/* Government styled Document Layout */}
      <Card className="max-w-3xl mx-auto border-t-4 border-t-slate-800 bg-white text-slate-900 shadow-md">
        <CardContent className="p-8 space-y-6 select-none font-serif leading-relaxed text-xs">
          
          {/* Document Letterhead */}
          <div className="text-center border-b-2 border-double border-slate-900 pb-4 space-y-1">
            <h2 className="text-xs font-bold tracking-widest uppercase">SIM-RIDA</h2>
            <h3 className="text-3xs font-semibold uppercase text-slate-500">Sistem Informasi Manajemen Riset Daerah</h3>
            <h1 className="text-sm font-extrabold uppercase tracking-wide pt-2">
              Kerangka Acuan Kerja (KAK)
            </h1>
            <p className="text-[10px] italic text-slate-400">Nomor Dokumen: KAK-{record.id}-v{kak.version}</p>
          </div>

          {/* Core content sections */}
          <div className="space-y-4 font-sans text-slate-800">
            
            {/* A. INFORMASI UMUM */}
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-[11px] text-slate-950 uppercase border-b pb-0.5">
                A. Informasi Umum Kegiatan
              </h4>
              <table className="w-full text-left text-2xs border-collapse">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <th className="py-1 w-44 font-bold">Judul Kegiatan</th>
                    <td className="py-1 font-semibold text-slate-950">{kak.title}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <th className="py-1">Organisasi Pengusul</th>
                    <td className="py-1">{record.opd}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <th className="py-1">Sektor Pembangunan</th>
                    <td className="py-1">{kak.sector}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <th className="py-1">Perkiraan Jangka Waktu</th>
                    <td className="py-1 font-semibold text-blue-700">{kak.duration}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <th className="py-1">Pagu Anggaran Maksimal</th>
                    <td className="py-1 font-bold text-slate-950">{formatIDR(kak.budgetEstimates)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <th className="py-1">Status Dokumen</th>
                    <td className="py-1">
                      <span className="font-bold text-blue-750 uppercase text-[10px]">{kak.status}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* B. LATAR BELAKANG */}
            <div className="space-y-1">
              <h4 className="font-extrabold text-[11px] text-slate-950 uppercase">B. Latar Belakang</h4>
              <p className="pl-3 text-justify text-2xs leading-relaxed">{kak.background}</p>
            </div>

            {/* C. DASAR PELAKSANAAN */}
            <div className="space-y-1">
              <h4 className="font-extrabold text-[11px] text-slate-950 uppercase">C. Dasar Pelaksanaan Kegiatan</h4>
              <p className="pl-3 text-justify text-2xs whitespace-pre-line leading-relaxed">{kak.legalBasis || '-'}</p>
            </div>

            {/* D. MAKSUD */}
            <div className="space-y-1">
              <h4 className="font-extrabold text-[11px] text-slate-950 uppercase">D. Maksud Kegiatan</h4>
              <p className="pl-3 text-justify text-2xs leading-relaxed">{kak.intent || '-'}</p>
            </div>

            {/* E. TUJUAN */}
            <div className="space-y-1">
              <h4 className="font-extrabold text-[11px] text-slate-950 uppercase">E. Tujuan Kegiatan</h4>
              <p className="pl-3 text-justify text-2xs leading-relaxed">{kak.objective}</p>
            </div>

            {/* F. SASARAN */}
            <div className="space-y-1">
              <h4 className="font-extrabold text-[11px] text-slate-950 uppercase">F. Sasaran</h4>
              <p className="pl-3 text-justify text-2xs leading-relaxed">{kak.target || '-'}</p>
            </div>

            {/* G. RUANG LINGKUP */}
            <div className="space-y-1">
              <h4 className="font-extrabold text-[11px] text-slate-950 uppercase">G. Ruang Lingkup</h4>
              <p className="pl-3 text-justify text-2xs leading-relaxed">{kak.scope}</p>
            </div>

            {/* H. METODOLOGI */}
            <div className="space-y-1">
              <h4 className="font-extrabold text-[11px] text-slate-950 uppercase">H. Metodologi Penelitian</h4>
              <p className="pl-3 text-justify text-2xs leading-relaxed">{kak.methodology || '-'}</p>
            </div>

            {/* I. LOKASI */}
            <div className="space-y-1">
              <h4 className="font-extrabold text-[11px] text-slate-950 uppercase">I. Lokasi Kegiatan</h4>
              <p className="pl-3 text-2xs leading-relaxed">{kak.location || '-'}</p>
            </div>

            {/* J. KELUARAN (OUTPUT) */}
            <div className="space-y-1">
              <h4 className="font-extrabold text-[11px] text-slate-950 uppercase">J. Keluaran (Output) yang Diharapkan</h4>
              <p className="pl-3 text-justify text-2xs leading-relaxed font-semibold text-slate-900">{kak.output}</p>
            </div>

            {/* K. MANFAAT (OUTCOME) */}
            <div className="space-y-1">
              <h4 className="font-extrabold text-[11px] text-slate-950 uppercase">K. Manfaat (Outcome)</h4>
              <p className="pl-3 text-justify text-2xs leading-relaxed">{kak.benefit || '-'}</p>
            </div>

            {/* L. INDIKATOR KEBERHASILAN */}
            <div className="space-y-1">
              <h4 className="font-extrabold text-[11px] text-slate-950 uppercase">L. Indikator Keberhasilan</h4>
              <p className="pl-3 text-justify text-2xs leading-relaxed">{kak.indicators || '-'}</p>
            </div>

            {/* M. PERSONEL KEBUTUHAN TENAGA AHLI */}
            <div className="space-y-1">
              <h4 className="font-extrabold text-[11px] text-slate-950 uppercase">M. Personel / Kebutuhan Tenaga Ahli</h4>
              <p className="pl-3 text-justify text-2xs leading-relaxed">{kak.personnel || '-'}</p>
            </div>

            {/* N. CATATAN PENYELARASAN */}
            {kak.notes && (
              <div className="space-y-1">
                <h4 className="font-extrabold text-[11px] text-slate-950 uppercase">N. Catatan Tambahan</h4>
                <p className="pl-3 text-justify text-2xs italic leading-relaxed text-slate-500">{kak.notes}</p>
              </div>
            )}

          </div>

          {/* Document Signatures representation */}
          <div className="pt-8 grid grid-cols-2 gap-4 text-center text-3xs font-semibold text-slate-900">
            <div className="space-y-8">
              <span>Disusun Oleh,<br />Tim BRIDA Litbang</span>
              <span className="block underline">{kak.updatedBy || 'BRIDA Litbang'}</span>
            </div>
            <div className="space-y-8">
              <span>Disetujui Oleh,<br />Kepala BRIDA</span>
              <span className="block underline">{kak.status === 'APPROVED' ? 'Kepala BRIDA' : '......................'}</span>
            </div>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}

// Simple AlertTriangle fallback representation
function AlertTriangle(props: any) {
  return <Info {...props} className={`${props.className} text-amber-500`} />;
}
