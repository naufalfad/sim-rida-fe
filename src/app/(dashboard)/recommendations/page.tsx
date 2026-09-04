'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRecommendationStore } from '@/store/useRecommendationStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { MOCK_OPDS } from '@/mock/opd';
import {
  Search,
  Filter,
  Eye,
  ListRestart,
  Inbox,
  Award
} from 'lucide-react';

export default function RecommendationCenterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { researchRecords } = useResearchStore();
  const { getAllRecommendations } = useRecommendationStore();

  const allRecs = getAllRecommendations();

  // Search & Filters states (Section 34)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [opdFilter, setOpdFilter] = useState('ALL');

  // Compute recipient names mapping
  const opdMap = useMemo(() => {
    const map = new Map<string, string>();
    MOCK_OPDS.forEach(o => map.set(o.id, o.shortName));
    return map;
  }, []);

  // Filtered list
  const filteredRecs = useMemo(() => {
    return allRecs.filter(r => {
      // Find corresponding research title
      const research = researchRecords.find(res => res.id === r.researchId);
      const resTitle = research ? research.title : '';

      const matchesSearch =
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || r.priority === priorityFilter;

      const matchesOpd =
        opdFilter === 'ALL' ||
        r.primaryRecipientId === opdFilter ||
        r.supportingRecipientIds.includes(opdFilter);

      return matchesSearch && matchesStatus && matchesPriority && matchesOpd;
    });
  }, [allRecs, researchRecords, searchQuery, statusFilter, priorityFilter, opdFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setOpdFilter('ALL');
    toast('Filter pencarian dibersihkan.', 'info');
  };

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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-350';
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-250';
      case 'UNDER_REVIEW':
        return 'bg-amber-50 text-amber-700 border-amber-250';
      case 'REVISION_REQUIRED':
        return 'bg-rose-50 text-rose-700 border-rose-250';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-250';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      <PageHeader
        title="Recommendation Center"
        description="Pusat inventarisasi seluruh surat rekomendasi BRIDA yang diterbitkan kepada dinas-dinas daerah."
      />

      {/* Filter and search bar card (Section 34) */}
      <Card>
        <CardContent className="p-4 text-xs font-bold grid gap-4 sm:grid-cols-5 items-end">
          
          <div className="space-y-1.5">
            <label className="block text-2xs text-gray-700 uppercase">Search Details</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search REC ID, title, research..."
                className="block w-full pl-9 pr-3 py-2 border rounded focus:outline-none bg-white text-gray-900 text-xs font-normal"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-2xs text-gray-700 uppercase">Filter Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 text-xs font-normal"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="REVISION_REQUIRED">REVISION REQUIRED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="PUBLISHED">PUBLISHED</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-2xs text-gray-700 uppercase">Filter Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 text-xs font-normal"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="STRATEGIC">STRATEGIC</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-2xs text-gray-700 uppercase">Filter Recipient OPD</label>
            <select
              value={opdFilter}
              onChange={(e) => setOpdFilter(e.target.value)}
              className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 text-xs font-normal"
            >
              <option value="ALL">All OPDs</option>
              {MOCK_OPDS.map(opd => (
                <option key={opd.id} value={opd.id}>{opd.shortName}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-2 border border-gray-300 hover:bg-gray-55 rounded text-gray-700 flex items-center gap-1.5 transition-all bg-white"
            >
              <ListRestart className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>

        </CardContent>
      </Card>

      {/* Recommendations Center Table */}
      <Card>
        <CardContent className="p-0">
          {filteredRecs.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-450 italic space-y-2">
              <Inbox className="h-8 w-8 text-gray-300 mx-auto" />
              <p>Belum ada rekod rekomendasi yang memenuhi kriteria filter.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center text-3xs uppercase tracking-wider font-bold">No</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-bold">Rekomendasi (REC ID)</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-bold">Penelitian Acuan</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-bold">OPD Penerima</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-bold text-center">Priority</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-bold text-center">Status</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-bold">Published Date</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-bold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs font-semibold">
                {filteredRecs.map((r, idx) => {
                  const research = researchRecords.find(res => res.id === r.researchId);
                  const resTitle = research ? research.title : '-';
                  const primaryOpdShort = opdMap.get(r.primaryRecipientId) || '-';

                  return (
                    <TableRow key={r.id} className="hover:bg-slate-50/50">
                      <TableCell className="text-center font-bold text-gray-400">{idx + 1}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => router.push(`/recommendations/${r.id}`)}
                          className="font-bold text-blue-650 dark:text-blue-450 hover:underline text-left"
                        >
                          {r.title}
                        </button>
                        <p className="text-[9px] text-gray-400 font-normal leading-normal block mt-0.5">ID: {r.id} • v{r.version}</p>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        <span className="font-bold block text-gray-805 truncate">{resTitle}</span>
                        <span className="text-[9px] text-gray-400 block font-normal">ID: {r.researchId}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="font-extrabold text-slate-800">{primaryOpdShort}</span>
                        {r.supportingRecipientIds.length > 0 && (
                          <span className="text-[9px] text-gray-405 block font-normal">+{r.supportingRecipientIds.length} OPD Pendukung</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-bold border ${getPriorityBadgeClass(r.priority)}`}>
                          {r.priority}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-bold border ${getStatusBadgeClass(r.status)}`}>
                          {r.status.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-500 whitespace-nowrap text-3xs font-semibold">
                        {r.publishedDate || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => router.push(`/recommendations/${r.id}`)}
                          className="p-1 text-gray-405 hover:text-indigo-650 rounded border hover:bg-slate-50"
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
