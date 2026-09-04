'use client';

import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import PlaceholderPage from '@/components/PlaceholderPage';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        description="Konfigurasi parameter sistem, backup database, mail server, dan aturan alur kerja riset."
      />
      <PlaceholderPage
        title="Pengaturan Parameter Sistem"
        description="Menu konfigurasi backend teknis seperti log audit, integrasi backup, batas waktu evaluasi, dan preferensi umum SIM-RIDA."
      />
    </div>
  );
}
