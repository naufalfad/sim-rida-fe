'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { proposalService } from '@/lib/api/proposals';
import { authService } from '@/lib/api/auth';
import { Proposal, FinalReport } from '@/types/proposals';
import { CheckCircle, AlertTriangle, FileText, Send } from 'lucide-react';

export default function ResearcherReportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [execSummary, setExecSummary] = useState('');
  const [methodology, setMethodology] = useState('');
  const [findings, setFindings] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [recommendation, setRecommendation] = useState('');
  
  // Mock Attachment File
  const [attachName, setAttachName] = useState('Naskah Kajian Akhir Lengkap');
  const [attachFile, setAttachFile] = useState('');
  const [attachSize, setAttachSize] = useState('3.8 MB');

  useEffect(() => {
    const loadProposals = async () => {
      try {
        const user = authService.getCurrentUser();
        if (user) {
          const list = await proposalService.getProposals();
          // Filter proposals assigned to this researcher that are active
          const assigned = list.filter((p) => p.researcherId === user.id);
          setProposals(assigned);
          
          // Pre-select the first active project if available
          const activeProj = assigned.find((p) => ['IN_PROGRESS', 'MONITORING'].includes(p.status));
          if (activeProj) {
            setSelectedProposal(activeProj);
          } else if (assigned.length > 0) {
            setSelectedProposal(assigned[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load researcher projects for reports:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProposals();
  }, []);

  if (isLoading) {
    return <LoadingState message="Memuat form pengajuan laporan..." />;
  }

  const handleProposalChange = (id: string) => {
    const found = proposals.find((p) => p.id === id);
    if (found) {
      setSelectedProposal(found);
      // Reset form fields
      setExecSummary('');
      setMethodology('');
      setFindings('');
      setConclusion('');
      setRecommendation('');
      setAttachFile('');
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal) return;
    
    if (!execSummary || !methodology || !findings || !conclusion || !recommendation || !attachFile) {
      toast('Semua kolom naskah ringkasan dan file lampiran laporan wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const reportData: Omit<FinalReport, 'submittedAt'> = {
        executiveSummary: execSummary,
        methodology,
        findings,
        conclusion,
        recommendation,
        attachments: [
          { name: attachFile, size: attachSize }
        ]
      };

      const updated = await proposalService.submitFinalReport(selectedProposal.id, reportData);
      if (updated) {
        setSelectedProposal(updated);
        // Refresh local list state
        setProposals(proposals.map((p) => p.id === updated.id ? updated : p));
        toast(`Laporan Akhir untuk ${selectedProposal.id} berhasil diserahkan ke BRIDA!`, 'success');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/researcher/dashboard');
        }, 1500);
      }
    } catch {
      toast('Gagal mengumpulkan laporan akhir.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const proposalOptions = proposals.map((p) => ({
    value: p.id,
    label: `${p.id} - ${p.title.substring(0, 45)}...`,
  }));

  const isAlreadySubmitted = selectedProposal && ['REPORT_SUBMITTED', 'RECOMMENDATION_PENDING', 'RECOMMENDATION_APPROVED', 'COMPLETED'].includes(selectedProposal.status);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Penyerahan Laporan Akhir Kajian
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Susun ringkasan eksekutif, deskripsikan kesimpulan kajian kebijakan strategis, dan lampirkan naskah riset final Anda.
        </p>
      </div>

      {proposals.length === 0 ? (
        <EmptyState
          title="Tidak ada penugasan riset"
          description="Anda belum memiliki penugasan proyek riset untuk dikirimkan laporan akhirnya."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Form */}
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-5">
              <div className="border-b pb-4 dark:border-slate-850">
                <label className="text-3xs font-bold text-slate-450 uppercase block mb-1">Pilih Proyek Riset</label>
                <Select
                  options={proposalOptions}
                  value={selectedProposal?.id || ''}
                  onChange={(e) => handleProposalChange(e.target.value)}
                  className="bg-white dark:bg-slate-950 dark:border-slate-850"
                />
              </div>

              {selectedProposal && (
                <>
                  {isAlreadySubmitted ? (
                    <div className="p-6 text-center space-y-3 bg-emerald-50/10 dark:bg-slate-950 border border-emerald-100 rounded-lg">
                      <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
                      <h3 className="text-sm font-bold text-emerald-700">Laporan Akhir Telah Diserahkan</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                        Laporan akhir kajian untuk <strong>{selectedProposal.id}</strong> telah berhasil dikumpulkan pada status <strong>{selectedProposal.status}</strong>. BRIDA sedang melakukan peninjauan substansi.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
                      <div>
                        <Textarea
                          label="Ringkasan Eksekutif (Executive Summary)"
                          placeholder="Tuliskan latar belakang singkat, isu krusial daerah, dan gambaran umum kajian..."
                          value={execSummary}
                          onChange={(e) => setExecSummary(e.target.value)}
                          rows={4}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Textarea
                          label="Metodologi Kajian"
                          placeholder="Fokus sampling data, teknik pengolahan kuantitatif/kualitatif..."
                          value={methodology}
                          onChange={(e) => setMethodology(e.target.value)}
                          rows={3}
                        />
                        <Textarea
                          label="Temuan Riset Lapangan (Findings)"
                          placeholder="Deskripsikan data penting dan fakta empiris yang ditemukan di lapangan..."
                          value={findings}
                          onChange={(e) => setFindings(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div>
                        <Textarea
                          label="Kesimpulan Kajian"
                          placeholder="Tuliskan kesimpulan kritis pemecahan masalah daerah..."
                          value={conclusion}
                          onChange={(e) => setConclusion(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div>
                        <Textarea
                          label="Rekomendasi Kebijakan yang Ditawarkan"
                          placeholder="Tuliskan draf rekomendasi kebijakan formal yang diusulkan kepada kepala daerah..."
                          value={recommendation}
                          onChange={(e) => setRecommendation(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="border-t pt-4 space-y-4 dark:border-slate-850">
                        <h4 className="text-3xs font-bold text-slate-450 uppercase tracking-wider">
                          Lampiran File Laporan Akhir (Mock Attachment)
                        </h4>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="text-3xs font-bold text-slate-450 uppercase block mb-1">Nama Dokumen</label>
                            <input
                              type="text"
                              value={attachName}
                              onChange={(e) => setAttachName(e.target.value)}
                              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-850 dark:bg-slate-950"
                            />
                          </div>

                          <div>
                            <label className="text-3xs font-bold text-slate-450 uppercase block mb-1">Nama File (PDF)</label>
                            <input
                              type="text"
                              placeholder="Contoh: Laporan_Akhir_Riset_Pesisir.pdf"
                              value={attachFile}
                              onChange={(e) => setAttachFile(e.target.value)}
                              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-850 dark:bg-slate-950"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button
                          type="submit"
                          isLoading={isSubmitting}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 shadow font-bold text-xs h-10"
                        >
                          <Send className="h-4 w-4" />
                          <span>Kirim Laporan Akhir ke BRIDA</span>
                        </Button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </Card>
          </div>

          {/* Guidelines */}
          <div>
            <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-805 dark:text-slate-205 flex items-center gap-1.5 border-b pb-2 dark:border-slate-850">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                <span>Petunjuk Penyerahan</span>
              </h3>
              <ul className="list-disc pl-4 text-2xs space-y-2.5 text-slate-655 dark:text-slate-400 font-medium">
                <li>Pastikan seluruh capaian milestone proyek telah berstatus 100% atau mendekati selesai sebelum mengirimkan laporan.</li>
                <li>Naskah ringkasan yang diketik akan langsung dibaca oleh tim evaluator BRIDA dan Bupati untuk dasar SK rekomendasi.</li>
                <li>Gunakan nama file lampiran yang representatif dan berformat dokumen PDF resmi.</li>
                <li>Pengiriman laporan akhir bersifat final dan akan mengunci edit milestone hingga proses verifikasi oleh BRIDA selesai.</li>
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
