'use client';

import React, { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRecommendationStore } from '@/store/useRecommendationStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
  Award,
  Inbox,
  Eye,
  Info,
  Clock,
  Briefcase
} from 'lucide-react';

export default function ReceivedRecommendationsPage() {
  const router = useRouter();

  const { user } = useAuthStore();
  const { researchRecords } = useResearchStore();
  const { getAllRecommendations } = useRecommendationStore();

  // Access checks: only OPD (or admin/read role)
  useEffect(() => {
    if (user && user.role !== 'OPD') {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  const allRecs = getAllRecommendations();

  // Filter recommendations where status is PUBLISHED and OPD matches primary or related recipients (Section 28)
  const receivedRecs = useMemo(() => {
    return allRecs.filter(r => r.status === 'PUBLISHED');
  }, [allRecs]);

  // Metrics (Section 36)
  const metrics = useMemo(() => {
    const total = receivedRecs.length;
    const high = receivedRecs.filter(r => r.priority === 'HIGH').length;
    const strategic = receivedRecs.filter(r => r.priority === 'STRATEGIC').length;
    return { total, high, strategic };
  }, [receivedRecs]);

  const getPriorityBadgeClass = (prio: string) => {
    switch (prio) {
      case 'STRATEGIC':
        return 'bg-purple-50 text-purple-750 border-purple-250';
      case 'HIGH':
        return 'bg-rose-50 text-rose-700 border-rose-250';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-250';
      default:
        return 'bg-slate-50 text-slate-550 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      <PageHeader
        title="Received Recommendations"
        description="Daftar rekomendasi kebijakan resmi dari BRIDA Kabupaten untuk diimplementasikan Dinas Daerah."
      />

      {/* OPD Metrics Dashboard (Section 36) */}
      <div className="grid gap-4 sm:grid-cols-3 select-none">
        <Card className="border-indigo-150">
          <CardContent className="p-4 space-y-1">
            <span className="text-gray-400 block font-bold text-[8px] uppercase tracking-wider">Total Received Recommendations</span>
            <span className="text-2xl font-extrabold text-indigo-755 block">{metrics.total}</span>
          </CardContent>
        </Card>

        <Card className="border-rose-150">
          <CardContent className="p-4 space-y-1">
            <span className="text-gray-400 block font-bold text-[8px] uppercase tracking-wider">High Priority</span>
            <span className="text-2xl font-extrabold text-rose-700 block">{metrics.high}</span>
          </CardContent>
        </Card>

        <Card className="border-purple-150">
          <CardContent className="p-4 space-y-1">
            <span className="text-gray-400 block font-bold text-[8px] uppercase tracking-wider">Strategic Recommendations</span>
            <span className="text-2xl font-extrabold text-purple-755 block">{metrics.strategic}</span>
          </CardContent>
        </Card>
      </div>

      {/* Received Recommendations List */}
      <Card>
        <CardContent className="p-0">
          {receivedRecs.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-450 italic space-y-2">
              <Inbox className="h-8 w-8 text-gray-300 mx-auto" />
              <p>No recommendations received.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center text-3xs uppercase tracking-wider font-bold">No</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-bold">Rekomendasi (REC ID)</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-bold">Riset Peneliti</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-bold text-center">Priority</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-bold text-center">Status</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-bold">Published Date</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-bold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs font-semibold">
                {receivedRecs.map((r, idx) => {
                  const research = researchRecords.find(res => res.id === r.researchId);
                  const resTitle = research ? research.title : '-';

                  return (
                    <TableRow key={r.id} className="hover:bg-slate-50/50">
                      <TableCell className="text-center font-bold text-gray-400">{idx + 1}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => router.push(`/opd/recommendations/${r.id}`)}
                          className="font-bold text-indigo-750 hover:underline text-left block"
                        >
                          {r.title}
                        </button>
                        <span className="text-[9px] text-gray-400 block font-normal leading-normal mt-0.5">ID: {r.id} • Dari: BRIDA</span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        <span className="font-bold block text-gray-800 truncate">{resTitle}</span>
                        <span className="text-[9px] text-gray-400 block font-normal">ID: {r.researchId}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-bold border ${getPriorityBadgeClass(r.priority)}`}>
                          {r.priority}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-bold border bg-emerald-100 text-emerald-800 border-emerald-350">
                          RECEIVED
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-500 whitespace-nowrap text-3xs font-semibold">
                        {r.publishedDate || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => router.push(`/opd/recommendations/${r.id}`)}
                          className="p-1 text-indigo-650 hover:text-indigo-850 rounded border hover:bg-slate-50"
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
