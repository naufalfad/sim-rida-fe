'use client';

import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import PlaceholderPage from '@/components/PlaceholderPage';

export default function PolicyBriefPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Policy Brief"
        description="Kelola telaah draf policy brief hasil kajian sebagai basis rekomendasi bagi kepala daerah."
      />
      <PlaceholderPage
        title="Penyusunan Telaah Policy Brief"
        description="Konversi temuan ilmiah riset lapangan menjadi bentuk tulisan ringkas (policy brief) yang memuat opsi-opsi rekomendasi kebijakan bupati."
      />
    </div>
  );
}
