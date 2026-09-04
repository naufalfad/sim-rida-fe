'use client';

import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import PlaceholderPage from '@/components/PlaceholderPage';

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Persetujuan"
        description="Telaah dan validasi dokumen KAK, laporan hasil akhir riset, dan draf rekomendasi kebijakan daerah."
      />
      <PlaceholderPage
        title="Dokumen Menunggu Persetujuan"
        description="Menu otoritatif bagi pimpinan untuk menyetujui draf seleksi prioritas riset daerah, laporan kemajuan kegiatan, dan rilis naskah rekomendasi."
      />
    </div>
  );
}
