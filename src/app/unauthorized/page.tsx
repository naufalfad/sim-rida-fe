'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 font-sans">
      <div className="w-full max-w-md text-center bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
        <div className="inline-flex items-center justify-center p-4 bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400 rounded-full">
          <ShieldAlert className="h-12 w-12" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">403</h1>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-250">Akses Ditolak</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Anda tidak memiliki akses untuk membuka halaman ini.
          </p>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
}
