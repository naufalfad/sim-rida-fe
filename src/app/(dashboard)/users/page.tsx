'use client';

import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import PlaceholderPage from '@/components/PlaceholderPage';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Kelola otorisasi akun pengguna, role-based access control, dan data profil pengguna."
      />
      <PlaceholderPage
        title="Manajemen Pengguna & Otorisasi"
        description="Pusat pengaturan akun aparatur sipil internal, pengaturan hak akses admin, BRIDA, dan kepala lembaga."
      />
    </div>
  );
}
