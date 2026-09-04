'use client';

import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import PlaceholderPage from '@/components/PlaceholderPage';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan"
        description="Kelola review draf laporan akhir, review kelayakan substansi hasil riset, dan berkas lampiran."
      />
      <PlaceholderPage
        title="Verifikasi Laporan Akhir & Hasil Kajian"
        description="Pengunggahan draf laporan akhir penelitian, penilaian kelengkapan administratif laporan, dan persetujuan penutupan kegiatan riset."
      />
    </div>
  );
}
