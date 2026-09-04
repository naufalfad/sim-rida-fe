'use client';

import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import PlaceholderPage from '@/components/PlaceholderPage';

export default function MonitoringPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring"
        description="Pantau berkala progres pelaksanaan proyek di lapangan, catatan kendala teknis, dan manajemen risiko riset."
      />
      <PlaceholderPage
        title="Evaluasi & Monitoring Berkala Riset"
        description="Pengawasan pelaporan log kemajuan, pelaporan kendala teknis lapangan oleh pelaksana, serta pengelolaan mitigasi risiko."
      />
    </div>
  );
}
