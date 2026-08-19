'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { proposalService } from '@/lib/api/proposals';
import { authService } from '@/lib/api/auth';
import { Proposal, ProjectDocument } from '@/types/proposals';
import { FileText, FileDown, UploadCloud, Plus, Trash } from 'lucide-react';

export default function ResearcherDocumentsPage() {
  const { toast } = useToast();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Upload Form States
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<ProjectDocument['type']>('METHODOLOGY');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('1.5 MB');

  useEffect(() => {
    const loadProposals = async () => {
      try {
        const user = authService.getCurrentUser();
        if (user) {
          const list = await proposalService.getProposals();
          const assigned = list.filter((p) => p.researcherId === user.id && ['IN_PROGRESS', 'MONITORING', 'REPORT_SUBMITTED'].includes(p.status));
          setProposals(assigned);
          if (assigned.length > 0) {
            setSelectedProposal(assigned[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load active proposals for files:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProposals();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat file manager riset..." />;
  }

  const handleProposalChange = (id: string) => {
    const found = proposals.find((p) => p.id === id);
    if (found) {
      setSelectedProposal(found);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal) return;
    if (!docName || !fileName) {
      toast('Nama dokumen dan nama file wajib diisi.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const updated = await proposalService.uploadProjectDocument(
        selectedProposal.id,
        docType,
        docName,
        fileName,
        fileSize
      );

      if (updated) {
        setSelectedProposal(updated);
        // Refresh local list state
        setProposals(proposals.map((p) => p.id === updated.id ? updated : p));
        setDocName('');
        setFileName('');
        toast('Dokumen mock berhasil diunggah ke repositori!', 'success');
      }
    } catch {
      toast('Gagal mengunggah dokumen.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const proposalOptions = proposals.map((p) => ({
    value: p.id,
    label: `${p.id} - ${p.title.substring(0, 45)}...`,
  }));

  const docTypeOptions = [
    { value: 'PROPOSAL', label: 'Proposal Penelitian' },
    { value: 'METHODOLOGY', label: 'Metodologi Kajian' },
    { value: 'DATASET_METADATA', label: 'Metadata Dataset Lapangan' },
    { value: 'PROGRESS_REPORT', label: 'Laporan Progress Bulanan' },
    { value: 'FINAL_REPORT', label: 'Laporan Akhir (Final Report)' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          File & Repositori Kajian
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Kelola kumpulan naskah metodologi, proposal penelitian, draf metadata, serta laporan kemajuan yang dikirimkan ke BRIDA.
        </p>
      </div>

      {proposals.length === 0 ? (
        <EmptyState
          title="Tidak ada proyek riset aktif"
          description="Anda belum memiliki proyek riset aktif untuk mengelola file dokumen."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left: Documents register list */}
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 dark:border-slate-850">
                <div className="flex-1">
                  <label className="text-3xs font-bold text-slate-450 uppercase block mb-1">Pilih Proyek Riset</label>
                  <Select
                    options={proposalOptions}
                    value={selectedProposal?.id || ''}
                    onChange={(e) => handleProposalChange(e.target.value)}
                    className="bg-white dark:bg-slate-950 dark:border-slate-850"
                  />
                </div>
              </div>

              {selectedProposal && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Daftar Dokumen Unggahan ({selectedProposal.documents?.length || 0})
                  </h3>

                  {(!selectedProposal.documents || selectedProposal.documents.length === 0) ? (
                    <p className="text-xs text-slate-550 italic py-6 text-center">Belum ada dokumen yang diunggah ke folder ini.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {selectedProposal.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3 border rounded-lg bg-slate-50/40 border-slate-200 dark:bg-slate-955 dark:border-slate-850 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <FileText className={`h-5 w-5 ${
                              doc.type === 'PROPOSAL' ? 'text-purple-500' : doc.type === 'FINAL_REPORT' ? 'text-emerald-500' : 'text-blue-500'
                            }`} />
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{doc.name}</p>
                              <p className="text-[10px] text-slate-450 mt-0.5">{doc.fileName} ({doc.fileSize})</p>
                              <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded dark:bg-slate-800 mt-1 block w-max font-semibold uppercase">
                                {doc.type.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 rounded-full">
                            <FileDown className="h-4.5 w-4.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Right: Upload mock file form */}
          <div>
            <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850 flex items-center gap-1">
                <UploadCloud className="h-4.5 w-4.5 text-blue-500" />
                <span>Unggah Dokumen Baru</span>
              </h3>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="text-3xs font-bold text-slate-450 uppercase block mb-1">Kategori Dokumen</label>
                  <Select
                    options={docTypeOptions}
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as ProjectDocument['type'])}
                    className="bg-white dark:bg-slate-950 dark:border-slate-850"
                  />
                </div>

                <div>
                  <label className="text-3xs font-bold text-slate-450 uppercase block mb-1">Judul Dokumen</label>
                  <input
                    type="text"
                    placeholder="Contoh: Metodologi Kuantitatif Lanjutan"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="text-3xs font-bold text-slate-450 uppercase block mb-1">Nama File Dokumen</label>
                  <input
                    type="text"
                    placeholder="Contoh: Metodologi_Kajian_ITB_V3.pdf"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 placeholder:text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-3xs font-bold text-slate-450 uppercase block mb-1">Ukuran File</label>
                    <input
                      type="text"
                      placeholder="Contoh: 1.8 MB"
                      value={fileSize}
                      onChange={(e) => setFileSize(e.target.value)}
                      className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  isLoading={isUploading}
                  className="w-full bg-blue-650 hover:bg-blue-750 text-white flex items-center justify-center gap-1.5 shadow font-bold text-3xs h-9 mt-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Kirim Dokumen</span>
                </Button>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
