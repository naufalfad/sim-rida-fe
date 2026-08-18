'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Hammer, ArrowLeft, Construction } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CatchAllPlaceholder() {
  const params = useParams();
  const router = useRouter();

  const catchall = params?.catchall;
  const pathString = Array.isArray(catchall) ? catchall.join('/') : catchall || '';

  const getFriendlyName = (path: string) => {
    const parts = path.split('/');
    const lastPart = parts[parts.length - 1] || 'Halaman';
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace('-', ' ');
  };

  const pageTitle = getFriendlyName(pathString);

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="max-w-md w-full bg-white dark:bg-slate-900 border-slate-200 shadow-lg text-center p-8">
        <CardContent className="space-y-5 pt-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 mx-auto shadow-inner">
            <Construction className="h-8 w-8 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Fitur Dalam Pengembangan ({pageTitle})
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Halaman <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs text-blue-650 dark:text-blue-400">/{pathString}</code> direncanakan untuk diimplementasikan secara penuh pada fase berikutnya.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
