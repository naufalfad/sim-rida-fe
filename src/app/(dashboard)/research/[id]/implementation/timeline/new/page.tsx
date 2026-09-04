'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useImplementationStore } from '@/store/useImplementationStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Calendar,
  Save,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function NewMilestonePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { researchRecords } = useResearchStore();
  const { getImplementation, getMilestones, addMilestone } = useImplementationStore();

  const id = params?.id || '';

  // Access checks
  useEffect(() => {
    if (user && user.role !== 'BRIDA' && user.role !== 'ADMIN_BRIDA') {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  const impl = getImplementation(id);
  const milestones = getMilestones(id);

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

  // Redirect if research completed or planning is locked
  useEffect(() => {
    if (impl && impl.status === 'COMPLETED') {
      toast('Pelaksanaan penelitian sudah selesai disahkan.', 'warning');
      router.replace(`/research/${id}/implementation/timeline`);
    }
  }, [impl, id, router, toast]);

  // Calculate current total weight
  const currentTotalWeight = useMemo(() => {
    return milestones.reduce((sum, m) => sum + m.weight, 0);
  }, [milestones]);

  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [weight, setWeight] = useState<number>(0);
  const [responsibleUnit, setResponsibleUnit] = useState('Research Team');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!title.trim() || !startDate || !endDate) {
      toast('Nama milestone, Tanggal Mulai, dan Tanggal Berakhir wajib diisi.', 'warning');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast('Tanggal Berakhir tidak boleh mendahului Tanggal Mulai.', 'warning');
      return;
    }

    if (weight <= 0) {
      toast('Bobot milestone (%) harus lebih besar dari 0.', 'warning');
      return;
    }

    if (currentTotalWeight + weight > 100) {
      toast(`Bobot kumulatif melebihi batas 100% (Maksimal input sisa: ${100 - currentTotalWeight}%).`, 'warning');
      return;
    }

    const payload = {
      researchId: id,
      title,
      description,
      startDate,
      endDate,
      weight,
      progress: 0,
      status: 'PENDING' as const,
      responsibleUnit,
      notes,
    };

    addMilestone(id, payload);
    toast(`Milestone "${title}" berhasil ditambahkan ke rencana kerja.`, 'success');
    router.push(`/research/${id}/implementation/timeline`);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push(`/research/${id}/implementation/timeline`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </button>
      </div>

      <PageHeader
        title="Tambah Milestone Baru"
        description={`Penyusunan item tahapan rencana kerja untuk riset: "${record?.title}"`}
      />

      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="p-6 space-y-6 text-xs font-semibold">
            
            <div className="border-b pb-2 flex justify-between items-baseline">
              <h3 className="font-bold text-gray-850 uppercase text-xs">Form Data Milestone</h3>
              <span className="text-[10px] text-gray-450 italic">Sisa Bobot Tersedia: {100 - currentTotalWeight}%</span>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 uppercase">Nama Tahapan Milestone *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Pengumpulan Data Lapangan Tahap I..."
                className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 focus:border-purple-600"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 uppercase">Deskripsi Kegiatan</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan penjelasan output atau cakupan pengerjaan tahapan ini..."
                rows={3}
                className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-purple-600"
              />
            </div>

            {/* Start and End Date */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Tanggal Mulai *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 border rounded focus:outline-none bg-white text-gray-900 focus:border-purple-650"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Tanggal Berakhir *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 border rounded focus:outline-none bg-white text-gray-900 focus:border-purple-650"
                  />
                </div>
              </div>
            </div>

            {/* Weight and Responsible unit */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Bobot Proyek (%) *</label>
                <input
                  type="number"
                  value={weight || ''}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  placeholder={`Maksimal ${100 - currentTotalWeight}%`}
                  className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 focus:border-purple-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Unit Pelaksana Penanggung Jawab *</label>
                <input
                  type="text"
                  value={responsibleUnit}
                  onChange={(e) => setResponsibleUnit(e.target.value)}
                  placeholder="Contoh: Research Team / Surveyor"
                  className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 focus:border-purple-600"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 uppercase">Catatan Pelaksanaan</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan hambatan atau log persiapan awal..."
                rows={2}
                className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-purple-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => router.push(`/research/${id}/implementation/timeline`)}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-750 dark:text-gray-300 rounded text-xs font-semibold bg-white dark:bg-gray-950"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow"
              >
                <Save className="h-4 w-4" />
                <span>Save Milestone</span>
              </button>
            </div>

          </CardContent>
        </Card>
      </div>

    </div>
  );
}
