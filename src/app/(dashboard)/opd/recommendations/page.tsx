'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOpdStore, OpdProposal } from '@/store/useOpdStore';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { DocumentViewerModal, DocumentReviewState } from '@/components/ui/document-viewer-modal';
import {
  Award,
  Download,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Calendar,
  Building,
  ArrowRight,
  Search,
  ClipboardCheck,
  FileSpreadsheet,
  FileCheck,
  Sparkles,
  Layers,
  Eye,
  ExternalLink
} from 'lucide-react';
import { openOrDownloadFile, downloadFileDirectly, isPdfDocument } from '@/lib/file-viewer';

export default function OpdRecommendationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { proposals, selectProposal } = useOpdStore();

  const [documentReview, setDocumentReview] = useState<DocumentReviewState | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Filter only completed proposals with recommendation documents
  const completedProposals = useMemo(() => {
    return proposals.filter((p) => p.status === 'COMPLETED' || p.recommendationDoc);
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    return completedProposals.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        (p.recommendationDoc?.title || '').toLowerCase().includes(search.toLowerCase());

      const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [completedProposals, search, categoryFilter]);

  const handleDownload = (docTitle: string, type: string) => {
    toast(`Mengunduh berkas resmi [${type}]: "${docTitle}"...`, 'success');
  };

  return (
    <div className="space-y-6 font-sans">
      
      <PageHeader
        title="Gudang Rekomendasi Kebijakan (Output & Repository)"
        description="Repositori naskah akademik, policy brief, dan surat rekomendasi resmi hasil riset BRIDA yang telah terverifikasi TTE elektronik dan siap diimplementasikan."
      />

      {/* Summary Highlight Banner */}
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-850 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-800 dark:text-emerald-300 text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-lg shadow shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-100">
              Dokumen Bersertifikasi TTE Elektronik (BSrE BSSN)
            </h4>
            <p className="text-2xs text-emerald-800/80 dark:text-emerald-300/80">
              Seluruh naskah rekomendasi yang terbit di modul ini sah secara hukum dan dapat digunakan sebagai acuan penyusunan Renja, Perda/Perbup, maupun SOP teknis instansi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-full font-extrabold text-2xs border border-emerald-300">
            {completedProposals.length} Dokumen Terbit
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari naskah kebijakan atau topik..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-2xs font-semibold text-gray-500">
          <span>Kategori:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-950 font-medium"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="Kesehatan">Kesehatan</option>
            <option value="Pendidikan">Pendidikan</option>
            <option value="Infrastruktur & Teknologi">Infrastruktur & Teknologi</option>
            <option value="Ekonomi">Ekonomi</option>
            <option value="Tata Kelola Lingkungan">Tata Kelola Lingkungan</option>
          </select>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      {filteredProposals.length === 0 ? (
        <Card className="p-12 text-center text-gray-400 space-y-3">
          <Award className="h-10 w-10 text-gray-300 mx-auto" />
          <h4 className="font-bold text-xs text-gray-700 dark:text-gray-300">Belum Ada Rekomendasi Selesai</h4>
          <p className="text-2xs text-gray-500 max-w-md mx-auto">
            Usulan yang diajukan saat ini masih dalam proses telaah atau pelaksanaan riset oleh tim BRIDA. Dokumen rekomendasi akan otomatis tampil di sini setelah ditandatangani elektronik.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredProposals.map((item) => {
            const doc = item.recommendationDoc;
            return (
              <Card key={item.id} className="border-t-4 border-t-emerald-600 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <CardHeader className="pb-3 border-b dark:border-gray-850">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-3xs font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200">
                        {item.code}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        TTE TERVERIFIKASI
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                      {doc?.title || item.title}
                    </h3>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4 text-xs flex-1">
                  
                  {/* Metadata info */}
                  <div className="space-y-2 text-2xs">
                    <div className="flex items-center justify-between py-1 border-b dark:border-gray-850 text-gray-500">
                      <span>Kategori Riset:</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{item.category}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b dark:border-gray-850 text-gray-500">
                      <span>Bentuk Dokumen:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{doc?.type || item.expectedOutput}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b dark:border-gray-850 text-gray-500">
                      <span>Tanggal Terbit:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{doc?.date || '01 Mar 2026'}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 text-gray-500">
                      <span>Penandatangan:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300 truncate max-w-48">{doc?.signedBy || 'Kepala BRIDA'}</span>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-lg space-y-1 text-2xs">
                    <span className="font-bold text-gray-700 dark:text-gray-300 block text-3xs uppercase">Masalah Awal yang Ditindaklanjuti:</span>
                    <p className="text-gray-500 line-clamp-2">{item.problemStatement}</p>
                  </div>

                  {/* Feedback status indicator */}
                  {item.followUpReport ? (
                    <div className="p-2.5 bg-teal-50 dark:bg-teal-950/30 border border-teal-250 rounded text-teal-800 dark:text-teal-300 text-3xs flex items-center justify-between">
                      <span className="flex items-center gap-1 font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                        <span>Laporan Pemanfaatan Telah Diisi</span>
                      </span>
                      <span className="font-semibold">Rating: ★ {item.followUpReport.satisfactionRating}/5</span>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-250 rounded text-amber-800 dark:text-amber-300 text-3xs flex items-center justify-between">
                      <span>Belum melaporkan pemanfaatan rekomendasi.</span>
                      <button
                        onClick={() => {
                          selectProposal(item.id);
                          router.push('/opd/follow-up');
                        }}
                        className="font-bold underline hover:text-amber-950"
                      >
                        Isi Sekarang
                      </button>
                    </div>
                  )}

                  {/* Download Center & Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const fileName = doc?.title ? `${doc.title}.pdf` : `Naskah_Rekomendasi_${item.code}.pdf`;
                        openOrDownloadFile({
                          name: fileName,
                          type: 'POLICY_BRIEF',
                          proposalCode: item.code,
                          proposalTitle: item.title,
                          opdName: item.opdName,
                          uploadDate: doc?.date || '01 Mar 2026',
                          size: doc?.fileSize || '4.8 MB',
                          content: `NASKAH REKOMENDASI KEBIJAKAN RESMI (POLICY BRIEF)\nBADAN RISET DAN INOVASI DAERAH KABUPATEN MIMIKA\n\nNomor Berkas: ${item.code}/PB-BRIDA/2026\nPerihal: Rekomendasi Hasil Riset ${item.title}\nTujuan: Kepala Perangkat Daerah / Bupati Mimika\nStatus Verifikasi: TTE TERSERTIFIKASI OLEH KEPALA BRIDA MIMIKA (BSrE BSSN)\n\nRINGKASAN EKSEKUTIF:\nBerdasarkan hasil olah data lapangan dan telaah regulasi, direkomendasikan perbaikan tata kelola serta integrasi layanan teknis lintas sektor sebagai rujukan penyusunan Renja dan Perbup Mimika.`
                        }, toast);
                      }}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Buka & Unduh Naskah ({doc?.fileSize || '4.8 MB'})</span>
                    </button>
                    <button
                      onClick={() => {
                        selectProposal(item.id);
                        router.push('/opd/follow-up');
                      }}
                      className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold transition-all"
                      title="Isi Tindak Lanjut Pemanfaatan"
                    >
                      <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                    </button>
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Document Review & Viewer Modal */}
      {documentReview && (
        <DocumentViewerModal
          isOpen={!!documentReview}
          onClose={() => setDocumentReview(null)}
          document={documentReview}
        />
      )}

    </div>
  );
}
