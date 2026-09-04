'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { EvidenceFile, MonitoringRecord, useImplementationStore } from '@/store/useImplementationStore';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  FileText,
  Eye,
  Info,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ListRestart
} from 'lucide-react';

export default function MonitoringListPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { researchRecords } = useResearchStore();
  const {
    getImplementation,
    getMonitoring,
    getTimelineStatus,
    getOverallProgress
  } = useImplementationStore();

  const id = params?.id || '';
  const isBrida = user?.role === 'BRIDA' || user?.role === 'ADMIN_BRIDA';

  const impl = getImplementation(id);
  const monitoring = getMonitoring(id);
  const timelineStatus = getTimelineStatus(id);
  const overallProgress = getOverallProgress(id);

  // Find target research record
  const record = useMemo(() => {
    const found = researchRecords.find((r) => r.id === id || r.proposalId === id);
    if (found) return found;
    if (impl?.proposalTitle) {
      return {
        id: impl.researchId || id,
        title: impl.proposalTitle,
        opd: impl.opdName || 'BAPPEDA',
        status: impl.status === 'COMPLETED' ? ('COMPLETED' as const) : ('ACTIVE' as const),
        priority: 'HIGH' as const,
        approvedDate: impl.startedDate || '2026-09-01',
        proposalId: impl.researchId || id,
        identificationId: 'PRI-2026-001',
      };
    }
    return {
      id,
      title: `Penelitian #${id}`,
      opd: 'BAPPEDA',
      status: 'ACTIVE' as const,
      priority: 'HIGH' as const,
      approvedDate: '2026-09-01',
      proposalId: id,
      identificationId: 'PRI-2026-001',
    };
  }, [researchRecords, id, impl]);

  const isResearchCompleted = impl.status === 'COMPLETED';

  // Filters state (Section 30)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Preview Doc State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<EvidenceFile | null>(null);

  // Compute metrics summary
  const latestMonitoring = useMemo(() => {
    if (monitoring.length === 0) return null;
    return monitoring[0]; // descending order sorted
  }, [monitoring]);

  const issueCount = useMemo(() => {
    return monitoring.filter(m => m.status !== 'ON_TRACK').length;
  }, [monitoring]);

  // Filtered monitoring notes
  const filteredMonitoring = useMemo(() => {
    return monitoring.filter(m => {
      const matchesSearch = 
        m.currentActivity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.achievement.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.issues.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [monitoring, searchQuery, statusFilter]);

  const handleOpenPreview = (doc: EvidenceFile) => {
    setPreviewDoc(doc);
    setIsPreviewOpen(true);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    toast('Filter pencarian dibersihkan.', 'info');
  };

  const getMonitoringBadgeClass = (status: string) => {
    switch (status) {
      case 'ON_TRACK':
        return 'bg-emerald-50 text-emerald-700 border-emerald-250';
      case 'MINOR_DELAY':
        return 'bg-amber-50 text-amber-700 border-amber-250';
      case 'DELAYED':
        return 'bg-rose-50 text-rose-700 border-rose-250';
      case 'AT_RISK':
        return 'bg-red-50 text-red-750 border-red-250';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  if (!record) {
    return (
      <div className="space-y-6 text-center py-12 font-sans">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Rekod Penelitian Tidak Ditemukan</h2>
        <button
          onClick={() => router.push('/research')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push(`/research/${id}/implementation`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Pelaksanaan</span>
        </button>
      </div>

      <PageHeader
        title="Catatan Monitoring Pelaksanaan"
        description={`Peninjauan berkala terhadap perkembangan tahapan riset: "${record.title}"`}
        action={
          isBrida && !isResearchCompleted && (
            <button
              onClick={() => router.push(`/research/${id}/implementation/monitoring/new`)}
              className="px-3 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Monitoring</span>
            </button>
          )
        }
      />

      {/* Monitoring Summary header cards */}
      <div className="grid gap-4 sm:grid-cols-4 font-semibold select-none">
        
        {/* Latest monitoring */}
        <Card>
          <CardContent className="p-4 text-xs space-y-1">
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Latest Monitoring</span>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-250 block">
              {latestMonitoring ? latestMonitoring.monitoringDate : '-'}
            </span>
            <p className="text-[9px] text-gray-450 font-normal leading-normal italic">
              Tanggal peninjauan progres terakhir.
            </p>
          </CardContent>
        </Card>

        {/* Overall progress */}
        <Card>
          <CardContent className="p-4 text-xs space-y-1">
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Overall Progress</span>
            <span className="text-sm font-bold text-purple-750 block">{overallProgress}%</span>
            <p className="text-[9px] text-gray-455 font-normal leading-normal italic">
              Progres akumulasi seluruh milestone.
            </p>
          </CardContent>
        </Card>

        {/* Timeline status */}
        <Card>
          <CardContent className="p-4 text-xs space-y-1">
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Timeline Status</span>
            <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-extrabold border ${
              timelineStatus === 'ON_TRACK' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {timelineStatus.replace('_', ' ')}
            </span>
            <p className="text-[9px] text-gray-455 font-normal leading-normal italic">
              Status kelancaran jadwal riset.
            </p>
          </CardContent>
        </Card>

        {/* Issues count */}
        <Card>
          <CardContent className="p-4 text-xs space-y-1">
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Temuan Hambatan</span>
            <span className={`text-sm font-bold block ${issueCount > 0 ? 'text-rose-600' : 'text-gray-700'}`}>
              {issueCount} Laporan
            </span>
            <p className="text-[9px] text-gray-455 font-normal leading-normal italic">
              Catatan deviasi atau keterlambatan minor.
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Filter and search blocks (Section 30) */}
      <Card>
        <CardContent className="p-4 text-xs font-bold grid gap-4 sm:grid-cols-4 items-end">
          
          <div className="space-y-1.5">
            <label className="block text-2xs text-gray-700 uppercase">Search Notes</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search monitoring..."
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
              <option value="ON_TRACK">ON TRACK</option>
              <option value="MINOR_DELAY">MINOR DELAY</option>
              <option value="DELAYED">DELAYED</option>
              <option value="AT_RISK">AT RISK</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-2 border border-gray-300 hover:bg-gray-55 rounded text-gray-700 flex items-center gap-1.5 transition-all bg-white"
            >
              <ListRestart className="h-4 w-4" />
              <span>Reset Filters</span>
            </button>
          </div>

        </CardContent>
      </Card>

      {/* Monitoring Logs lists */}
      <div className="space-y-4">
        {filteredMonitoring.length === 0 ? (
          <div className="p-12 text-center text-xs border rounded bg-white dark:bg-gray-900 text-gray-450 italic">
            Tidak ada catatan monitoring yang sesuai kriteria filter.
          </div>
        ) : (
          filteredMonitoring.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-6 space-y-4 text-xs font-medium">
                
                {/* Header info */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-extrabold text-gray-800 dark:text-gray-250 text-sm">
                      Laporan Monitoring: {m.monitoringDate}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded text-3xs bg-purple-50 text-purple-750 font-bold border border-purple-200">
                      Progress: {m.overallProgress}%
                    </span>
                    <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border ${getMonitoringBadgeClass(m.status)}`}>
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* SWOT/Text description split */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <span className="text-gray-400 block font-bold text-[8px] uppercase">Aktivitas Sedang Berjalan</span>
                    <span className="font-bold text-gray-850 dark:text-gray-200 block text-xs">{m.currentActivity}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400 block font-bold text-[8px] uppercase">Capaian Realisasi (Achievement)</span>
                    <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed">{m.achievement}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t dark:border-gray-850">
                  <div className="space-y-1">
                    <span className="text-gray-400 block font-bold text-[8px] uppercase">Identifikasi Hambatan / Kendala</span>
                    <p className="text-rose-650 italic leading-relaxed">{m.issues}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400 block font-bold text-[8px] uppercase">Rencana Tindak Lanjut (Follow-up)</span>
                    <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed">{m.followUp}</p>
                  </div>
                </div>

                {/* Evidence files (Section 24) */}
                <div className="pt-3 border-t dark:border-gray-850 space-y-2">
                  <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">
                    Evidence Dokumen Pembuktian
                  </span>
                  {m.evidences.length === 0 ? (
                    <span className="text-[10px] text-gray-400 italic">Belum ada lampiran diunggah.</span>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {m.evidences.map((doc) => (
                        <div key={doc.id} className="p-2 bg-gray-50/50 dark:bg-gray-900/50 border rounded flex justify-between items-center text-3xs">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-gray-400" />
                            <div>
                              <span className="font-bold text-gray-750 truncate max-w-40 block">{doc.name}</span>
                              <span className="text-[8px] text-gray-405 block font-normal">{doc.type} • {doc.uploadDate}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleOpenPreview(doc)}
                            className="text-blue-600 font-bold hover:underline uppercase text-3xs"
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ================= MODAL: MOCK EVIDENCE DOCUMENT PREVIEW ================= */}
      <Dialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`Preview Evidence: ${previewDoc?.name || ''}`}
        description="Berkas Hasil Pengumpulan Lapangan / Kickoff SIM-RIDA"
        footer={
          <button
            onClick={() => setIsPreviewOpen(false)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
          >
            Tutup Preview
          </button>
        }
      >
        <div className="p-6 bg-slate-50 border rounded text-center space-y-3 font-sans text-xs">
          <FileText className="h-10 w-10 text-slate-400 mx-auto" />
          <div>
            <h4 className="font-bold text-slate-800">{previewDoc?.name}</h4>
            <p className="text-gray-450 mt-1">Jenis Berkas: {previewDoc?.type} • Diunggah Oleh: {previewDoc?.uploadedBy}</p>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed italic max-w-sm mx-auto">
            (Ini merupakan simulasi pratinjau dokumen progress. Area peninjauan PDF/Image dilampirkan dinamis di produksi).
          </p>
        </div>
      </Dialog>

    </div>
  );
}
