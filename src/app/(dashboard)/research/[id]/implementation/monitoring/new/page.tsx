'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { EvidenceFile, useImplementationStore } from '@/store/useImplementationStore';
import {
  ArrowLeft,
  Calendar,
  Save,
  Plus,
  Trash2,
  FileText
} from 'lucide-react';

export default function NewMonitoringRecordPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { researchRecords } = useResearchStore();
  const { getImplementation, addMonitoringRecord } = useImplementationStore();

  const id = params?.id || '';

  // Access checks
  useEffect(() => {
    if (user && user.role !== 'BRIDA' && user.role !== 'ADMIN_BRIDA') {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  const impl = getImplementation(id);

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

  // Redirect if completed
  useEffect(() => {
    if (impl && impl.status === 'COMPLETED') {
      toast('Pelaksanaan penelitian sudah selesai disahkan.', 'warning');
      router.replace(`/research/${id}/implementation/monitoring`);
    }
  }, [impl, id, router, toast]);

  // Default date YYYY-MM-DD
  const getTodayDateStr = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Form States
  const [monitoringDate, setMonitoringDate] = useState(getTodayDateStr());
  const [currentActivity, setCurrentActivity] = useState('');
  const [achievement, setAchievement] = useState('');
  const [issues, setIssues] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [status, setStatus] = useState<'ON_TRACK' | 'MINOR_DELAY' | 'DELAYED' | 'AT_RISK'>('ON_TRACK');

  // Lampiran Evidences list
  const [evidences, setEvidences] = useState<Array<{ name: string; type: 'PDF' | 'XLSX' | 'DOCX' | 'JPG'; uploadedBy: string }>>([]);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'PDF' | 'XLSX' | 'DOCX' | 'JPG'>('PDF');

  const handleAddEvidence = () => {
    if (!fileName.trim()) {
      toast('Nama berkas evidence wajib diisi.', 'warning');
      return;
    }

    const newFile = {
      name: fileName.endsWith(`.${fileType.toLowerCase()}`) ? fileName : `${fileName}.${fileType.toLowerCase()}`,
      type: fileType,
      uploadedBy: user?.name || 'BRIDA Litbang',
    };

    setEvidences([...evidences, newFile]);
    setFileName('');
    toast('Dokumen evidence ditambahkan ke daftar lampiran.', 'success');
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidences(evidences.filter((_, idx) => idx !== index));
    toast('Dokumen evidence dihapus.', 'success');
  };

  const handleSave = () => {
    if (!monitoringDate || !currentActivity.trim() || !achievement.trim() || !issues.trim() || !followUp.trim()) {
      toast('Semua kolom form monitoring wajib diisi.', 'warning');
      return;
    }

    const recordData = {
      researchId: id,
      monitoringDate,
      currentActivity,
      achievement,
      issues,
      followUp,
      status,
    };

    addMonitoringRecord(id, recordData, evidences);
    toast('Catatan monitoring dan lampiran berkas berhasil disimpan.', 'success');
    router.push(`/research/${id}/implementation/monitoring`);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push(`/research/${id}/implementation/monitoring`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </button>
      </div>

      <PageHeader
        title="Tambah Catatan Monitoring Baru"
        description={`Pencatatan laporan perkembangan mingguan riset: "${record?.title}"`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* ================= LEFT FORM (Inputs fields) ================= */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4 text-xs font-semibold">
              
              <div className="border-b pb-2 flex justify-between items-baseline">
                <h3 className="font-bold text-gray-850 uppercase text-xs">Form Data Monitoring</h3>
                <span className="text-[10px] text-gray-450 italic">Isi form wajib (*)</span>
              </div>

              {/* Date & Status */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold text-gray-700 uppercase">Tanggal Monitoring *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={monitoringDate}
                      onChange={(e) => setMonitoringDate(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 border rounded focus:outline-none bg-white text-gray-900 focus:border-purple-600"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold text-gray-700 uppercase">Status Kelancaran *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 text-xs"
                  >
                    <option value="ON_TRACK">ON TRACK (Lancar)</option>
                    <option value="MINOR_DELAY">MINOR DELAY (Keterlambatan Ringan)</option>
                    <option value="DELAYED">DELAYED (Terlambat)</option>
                    <option value="AT_RISK">AT RISK (Berisiko Gagal)</option>
                  </select>
                </div>
              </div>

              {/* Current Activity */}
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Aktivitas Sedang Berjalan *</label>
                <input
                  type="text"
                  value={currentActivity}
                  onChange={(e) => setCurrentActivity(e.target.value)}
                  placeholder="Contoh: FGD dengan Dinas Kesehatan / Wawancara Puskesmas..."
                  className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 focus:border-purple-600"
                />
              </div>

              {/* Achievement */}
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Capaian Realisasi (Achievement) *</label>
                <textarea
                  value={achievement}
                  onChange={(e) => setAchievement(e.target.value)}
                  placeholder="Detail hasil pekerjaan yang berhasil dicapai..."
                  rows={3}
                  className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-purple-650"
                />
              </div>

              {/* Issues */}
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Kendala / Masalah Lapangan *</label>
                <textarea
                  value={issues}
                  onChange={(e) => setIssues(e.target.value)}
                  placeholder="Tuliskan kendala perizinan, cuaca, narasumber, atau server sandbox..."
                  rows={2}
                  className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-purple-655"
                />
              </div>

              {/* Follow-up */}
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Rencana Tindak Lanjut (Follow-up) *</label>
                <textarea
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  placeholder="Solusi atau langkah mitigasi koordinasi berikutnya..."
                  rows={2}
                  className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-purple-660"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  onClick={() => router.push(`/research/${id}/implementation/monitoring`)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-55 text-gray-705 rounded text-xs font-semibold bg-white"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Monitoring</span>
                </button>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* ================= RIGHT SECTION (Evidence mock upload) ================= */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4 text-xs font-semibold">
              <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider">
                Upload Lampiran Evidence
              </span>

              <div className="space-y-3 p-3 bg-gray-50 border rounded">
                <div className="space-y-1.5">
                  <label className="block text-3xs font-bold text-gray-550 uppercase">Nama Berkas *</label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Contoh: Transkrip_Wawancara_RSUD"
                    className="block w-full px-2 py-1.5 border rounded focus:outline-none bg-white text-gray-900"
                  />
                </div>

                <div className="grid gap-2 grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-3xs font-bold text-gray-550 uppercase">Tipe File *</label>
                    <select
                      value={fileType}
                      onChange={(e) => setFileType(e.target.value as any)}
                      className="block w-full px-2 py-1.5 border rounded focus:outline-none bg-white text-gray-900"
                    >
                      <option value="PDF">PDF Document</option>
                      <option value="XLSX">Spreadsheet (XLSX)</option>
                      <option value="DOCX">Word Document</option>
                      <option value="JPG">Image (JPG)</option>
                    </select>
                  </div>
                  <button
                    onClick={handleAddEvidence}
                    className="h-[32px] self-end px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-3xs uppercase flex items-center justify-center gap-1 shadow"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>

              {/* Lampiran List */}
              <div className="space-y-2">
                <span className="text-[9px] text-gray-400 block uppercase font-bold tracking-wider">
                  Daftar Berkas Terlampir
                </span>
                {evidences.length === 0 ? (
                  <div className="p-4 text-center border rounded bg-slate-50/50 italic text-gray-400 leading-relaxed">
                    Belum ada berkas evidence yang ditambahkan.
                  </div>
                ) : (
                  <div className="border rounded divide-y bg-slate-50/50">
                    {evidences.map((file, idx) => (
                      <div key={idx} className="p-3 flex justify-between items-center text-3xs">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-gray-400" />
                          <div>
                            <span className="font-bold text-gray-700 block truncate max-w-40">{file.name}</span>
                            <span className="text-[8px] text-gray-400 font-normal">{file.type}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveEvidence(idx)}
                          className="text-rose-600 hover:bg-rose-50 p-1 border rounded"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
