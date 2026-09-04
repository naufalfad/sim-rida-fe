'use client';

import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import PlaceholderPage from '@/components/PlaceholderPage';

export default function MasterDataPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data"
        description="Kelola data master sektor penelitian, bidang pembangunan daerah, dan daftar instansi OPD."
      />
      <PlaceholderPage
        title="Master Data Registry"
        description="Modul administrasi untuk mengkonfigurasi entitas master seperti kategori riset, daftar dinas, dan parameter instansi terkait."
      />
    </div>
  );
}
