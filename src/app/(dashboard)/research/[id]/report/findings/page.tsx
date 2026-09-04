'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReportStore, Finding } from '@/store/useReportStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Inbox
} from 'lucide-react';

const MOCK_EVIDENCE_FILES = [
  'Survey Data.xlsx',
  'Interview Summary.pdf',
  'Statistical Data.xlsx',
  'Field Documentation.pdf',
  'System_Logs_Integration.log',
  'FGD_Audio_Transcript.docx'
];

export default function FindingsListPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { researchRecords } = useResearchStore();
  const { getReport, getFindings, saveFinding, deleteFinding } = useReportStore();

  const id = params?.id || '';
  const isBrida = user?.role === 'BRIDA';

  // Find target research record
  const record = useMemo(() => {
    return researchRecords.find((r) => r.id === id);
  }, [researchRecords, id]);

  const report = getReport(id);
  const findings = getFindings(id);

  // Access check
  const isLocked = report.status === 'APPROVED' || report.status === 'UNDER_REVIEW';

  // Form modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editingFinding, setEditingFinding] = useState<Finding | null>(null);

  // Inputs state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState(MOCK_EVIDENCE_FILES[0]);
  const [impact, setImpact] = useState('');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [notes, setNotes] = useState('');

  // Delete modal state
  const [deletingId, setDeletingId] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Detail Modal state
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Stats summaries
  const severityStats = useMemo(() => {
    const stats = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    findings.forEach(f => {
      if (stats[f.severity] !== undefined) {
        stats[f.severity]++;
      }
    });
    return stats;
  }, [findings]);

  const handleOpenAdd = () => {
    if (isLocked) return;
    setEditingFinding(null);
    setTitle('');
    setDescription('');
    setEvidence(MOCK_EVIDENCE_FILES[0]);
    setImpact('');
    setSeverity('MEDIUM');
    setNotes('');
    setIsOpen(true);
  };

  const handleOpenEdit = (f: Finding) => {
    if (isLocked) return;
    setEditingFinding(f);
    setTitle(f.title);
    setDescription(f.description);
    setEvidence(f.evidence);
    setImpact(f.impact || '');
    setSeverity(f.severity);
    setNotes(f.notes || '');
    setIsOpen(true);
  };

  const handleOpenDetail = (f: Finding) => {
    setSelectedFinding(f);
    setIsDetailOpen(true);
  };

  const handleSave = () => {
    if (!title.trim() || !description.trim() || !impact.trim()) {
      toast('Judul, deskripsi, dan dampak temuan wajib diisi.', 'warning');
      return;
    }

    const payload: Finding = {
      id: editingFinding ? editingFinding.id : `find-${Date.now()}`,
      researchId: id,
      title,
      description,
      evidence,
      impact,
      severity,
      notes,
    };

    saveFinding(id, payload);
    setIsOpen(false);
    toast(editingFinding ? 'Temuan riset berhasil diperbarui.' : 'Temuan riset baru ditambahkan.', 'success');
  };

  const handleTriggerDelete = (fId: string) => {
    if (isLocked) return;
    setDeletingId(fId);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteFinding(id, deletingId);
    setIsDeleteOpen(false);
    toast('Temuan riset dihapus dari daftar.', 'success');
  };

  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-50 text-red-750 border-red-250';
      case 'HIGH':
        return 'bg-rose-50 text-rose-700 border-rose-250';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-250';
      default:
        return 'bg-gray-50 text-gray-550 border-gray-200';
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
          onClick={() => router.push(`/research/${id}/report`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Laporan</span>
        </button>
      </div>

      <PageHeader
        title="Research Findings"
        description="Kelola temuan hambatan teknis, analisis dampak, dokumen pembuktian kualitatif hasil riset."
        action={
          isBrida && !isLocked && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1 shadow"
            >
              <Plus className="h-4 w-4" />
              <span>Add Finding</span>
            </button>
          )
        }
      />

      {/* Stats summaries cards (Section 41) */}
      <div className="grid gap-4 sm:grid-cols-5 text-center font-bold select-none">
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] text-gray-450 block uppercase">Total Findings</span>
            <span className="text-xl text-gray-800 dark:text-white">{findings.length} Temuan</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] text-red-500 block uppercase">Critical</span>
            <span className="text-xl text-red-750">{severityStats.CRITICAL}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] text-rose-500 block uppercase">High</span>
            <span className="text-xl text-rose-700">{severityStats.HIGH}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] text-amber-500 block uppercase">Medium</span>
            <span className="text-xl text-amber-700">{severityStats.MEDIUM}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] text-gray-400 block uppercase">Low</span>
            <span className="text-xl text-gray-600">{severityStats.LOW}</span>
          </CardContent>
        </Card>
      </div>

      {/* Table list */}
      <Card>
        <CardContent className="p-0">
          {findings.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-450 italic space-y-2">
              <Inbox className="h-8 w-8 text-gray-300 mx-auto" />
              <p>No research findings have been recorded.</p>
              {isBrida && !isLocked && (
                <button
                  onClick={handleOpenAdd}
                  className="px-3 py-1 bg-indigo-600 text-white rounded text-3xs font-bold uppercase mt-2"
                >
                  Add Finding
                </button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center text-3xs uppercase tracking-wider font-bold">No</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-bold">Finding & Deskripsi</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-bold">Impact (Dampak)</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-bold text-center">Severity</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-bold">Evidence File</TableHead>
                  <TableHead className="text-3xs uppercase tracking-wider font-bold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs font-semibold">
                {findings.map((f, idx) => (
                  <TableRow key={f.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-center font-bold text-gray-400">{idx + 1}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleOpenDetail(f)}
                        className="font-bold text-blue-650 dark:text-blue-450 hover:underline text-left text-xs"
                      >
                        {f.title}
                      </button>
                      <p className="text-[10px] text-gray-400 font-normal leading-relaxed truncate max-w-xs mt-0.5">{f.description}</p>
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300 font-normal italic leading-relaxed">
                      {f.impact}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-bold border ${getSeverityBadgeClass(f.severity)}`}>
                        {f.severity}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-500 whitespace-nowrap text-3xs flex items-center gap-1.5 mt-3 border-none">
                      <FileText className="h-3.5 w-3.5 text-gray-400" />
                      <span>{f.evidence}</span>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(f)}
                          className="p-1 text-gray-400 hover:text-indigo-650 rounded border hover:bg-slate-50"
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {isBrida && !isLocked && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(f)}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded border hover:bg-slate-50"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleTriggerDelete(f.id)}
                              className="p-1 text-gray-400 hover:text-rose-650 rounded border hover:bg-slate-50"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ================= MODAL: ADD / EDIT FINDING ================= */}
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingFinding ? `Edit Finding: ${editingFinding.title}` : 'Add New Research Finding'}
        description="Catat temuan permasalahan hasil penelitian lapangan beserta tingkat keparahan."
        footer={
          <>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition-all shadow"
            >
              Simpan Temuan
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-750 dark:text-gray-300 rounded text-xs font-semibold transition-all bg-white dark:bg-gray-950"
            >
              Batal
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs font-sans">
          
          <div className="space-y-1.5">
            <label className="block text-2xs font-bold text-gray-750 uppercase">Judul Temuan Masalah *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Ketidaksiapan Lisensi SIMPUS Puskesmas..."
              className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 focus:border-indigo-600 font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-2xs font-bold text-gray-750 uppercase">Deskripsi Detail Temuan *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan anomali, inkonsistensi, atau kendala lapangan yang ditemukan..."
              rows={3}
              className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-indigo-600 leading-relaxed font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-2xs font-bold text-gray-750 uppercase">Dampak Temuan (Impact) *</label>
            <input
              type="text"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              placeholder="Contoh: Keterlambatan sinkronisasi data rekam medis Satu Sehat..."
              className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 focus:border-indigo-600 font-semibold"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-755 uppercase">Severity Level *</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 font-semibold"
              >
                <option value="LOW">LOW (Rendah)</option>
                <option value="MEDIUM">MEDIUM (Sedang)</option>
                <option value="HIGH">HIGH (Tinggi)</option>
                <option value="CRITICAL">CRITICAL (Kritis)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-755 uppercase">Evidence File (Mock File) *</label>
              <select
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 font-semibold"
              >
                {MOCK_EVIDENCE_FILES.map(file => (
                  <option key={file} value={file}>{file}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-2xs font-bold text-gray-755 uppercase">Catatan Tambahan (Notes)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan pengerjaan lapangan..."
              rows={2}
              className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-indigo-600 font-semibold"
            />
          </div>

        </div>
      </Dialog>

      {/* ================= MODAL: DETAIL PREVIEW ================= */}
      <Dialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Temuan Penelitian"
        description="Hasil rekaman analisis kegagalan sistem & hambatan birokrasi."
        footer={
          <button
            onClick={() => setIsDetailOpen(false)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
          >
            Tutup Detail
          </button>
        }
      >
        {selectedFinding && (
          <div className="space-y-4 text-xs font-sans select-none">
            <div>
              <span className="text-gray-400 block font-bold text-[8px] uppercase">Temuan ID</span>
              <span className="font-bold text-gray-700">{selectedFinding.id}</span>
            </div>

            <div>
              <span className="text-gray-400 block font-bold text-[8px] uppercase">Judul Temuan</span>
              <span className="font-bold text-gray-900 text-sm">{selectedFinding.title}</span>
            </div>

            <div>
              <span className="text-gray-400 block font-bold text-[8px] uppercase">Deskripsi Kegagalan</span>
              <p className="text-gray-700 leading-relaxed italic">{selectedFinding.description}</p>
            </div>

            <div>
              <span className="text-gray-400 block font-bold text-[8px] uppercase">Dampak (Impact)</span>
              <p className="text-rose-750 font-bold leading-relaxed">{selectedFinding.impact}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
              <div>
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Severity Level</span>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border mt-0.5 ${getSeverityBadgeClass(selectedFinding.severity)}`}>
                  {selectedFinding.severity}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Dokumen Evidence</span>
                <div className="flex items-center gap-1 text-gray-750 mt-1">
                  <FileText className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-bold text-3xs">{selectedFinding.evidence}</span>
                </div>
              </div>
            </div>

            {selectedFinding.notes && (
              <div className="pt-2 border-t">
                <span className="text-gray-400 block font-bold text-[8px] uppercase">Catatan Lapangan</span>
                <p className="text-gray-600 leading-normal">{selectedFinding.notes}</p>
              </div>
            )}

          </div>
        )}
      </Dialog>

      {/* ================= MODAL: CONFIRM DELETE ================= */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Hapus Temuan"
        description="Apakah Anda yakin ingin menghapus temuan ini?"
        footer={
          <>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold transition-all"
            >
              Hapus Temuan
            </button>
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-55 text-gray-700 rounded text-xs font-semibold transition-all bg-white"
            >
              Batal
            </button>
          </>
        }
      >
        <p className="text-xs text-gray-500 leading-relaxed">
          Temuan hasil riset beserta kaitan berkas evidence akan dihapus permanen dari draf laporan penelitian ini.
        </p>
      </Dialog>

    </div>
  );
}
