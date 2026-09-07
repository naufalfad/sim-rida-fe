'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOpdStore, OpdProposal } from '@/store/useOpdStore';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import {
  ClipboardCheck,
  Star,
  CheckCircle2,
  Award,
  Send,
  Building,
  Calendar,
  FileText,
  Sparkles,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function OpdFollowUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { proposals, selectedProposalId, selectProposal, submitFollowUp } = useOpdStore();

  // Completed proposals that have recommendations
  const completedProposals = useMemo(() => {
    return proposals.filter((p) => p.status === 'COMPLETED' || p.recommendationDoc);
  }, [proposals]);

  const activeProposal = useMemo(() => {
    if (selectedProposalId) {
      const found = completedProposals.find((p) => p.id === selectedProposalId);
      if (found) return found;
    }
    return completedProposals[0];
  }, [completedProposals, selectedProposalId]);

  // Form states
  const [utilizationType, setUtilizationType] = useState<'Rencana Kerja (Renja)' | 'Revisi / Pembuatan SOP' | 'Penyusunan Ranperda' | 'Implementasi Teknis'>('Rencana Kerja (Renja)');
  const [utilizationSummary, setUtilizationSummary] = useState('');
  const [satisfactionRating, setSatisfactionRating] = useState(5);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize when active proposal changes
  React.useEffect(() => {
    if (activeProposal?.followUpReport) {
      setUtilizationType(activeProposal.followUpReport.utilizationType);
      setUtilizationSummary(activeProposal.followUpReport.utilizationSummary);
      setSatisfactionRating(activeProposal.followUpReport.satisfactionRating);
      setFeedbackNotes(activeProposal.followUpReport.feedbackNotes);
    } else {
      setUtilizationSummary('');
      setSatisfactionRating(5);
      setFeedbackNotes('');
    }
  }, [activeProposal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProposal) return;
    if (!utilizationSummary.trim()) {
      toast('Ringkasan pemanfaatan rekomendasi wajib diisi.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const today = new Date().toLocaleDateString('id-ID');
      submitFollowUp(activeProposal.id, {
        utilizationType,
        utilizationSummary,
        satisfactionRating,
        feedbackNotes,
        submittedAt: today,
      });

      toast('Laporan pemanfaatan & rating kepuasan berhasil dikirimkan ke BRIDA.', 'success');
    } catch (err: any) {
      toast('Gagal mengirimkan laporan: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      <PageHeader
        title="Modul Tindak Lanjut & Feedback Pemanfaatan"
        description="Laporkan pemanfaatan nyata rekomendasi kebijakan yang telah diterbitkan BRIDA serta berikan evaluasi kepuasan layanan litbang daerah."
      />

      {completedProposals.length === 0 ? (
        <Card className="p-12 text-center text-gray-400 space-y-3">
          <Award className="h-10 w-10 text-gray-300 mx-auto" />
          <h4 className="font-bold text-xs text-gray-700 dark:text-gray-300">Belum Ada Rekomendasi Selesai yang Perlu Dilaporkan</h4>
          <p className="text-2xs text-gray-500 max-w-md mx-auto">
            Formulir tindak lanjut wajib diisi setelah usulan penelitian selesai dan dokumen Policy Brief / Naskah Akademik resmi diterbitkan oleh BRIDA.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* ================= LEFT LIST REKOMENDASI (5 cols) ================= */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b dark:border-gray-850">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-600" />
                  <span>Rekomendasi Kebijakan Selesai ({completedProposals.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y dark:divide-gray-850">
                {completedProposals.map((item) => {
                  const isSelected = activeProposal?.id === item.id;
                  const isReported = !!item.followUpReport;

                  return (
                    <div
                      key={item.id}
                      onClick={() => selectProposal(item.id)}
                      className={`p-3.5 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-l-4 border-l-emerald-600'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-900/60'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-3xs font-extrabold text-gray-500">
                            {item.code}
                          </span>
                          {isReported ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-extrabold bg-teal-50 text-teal-700 border border-teal-200">
                              <CheckCircle2 className="h-3 w-3" />
                              SUDAH DILAPORKAN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="h-3 w-3" />
                              WAJIB DIISI
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">
                          {item.recommendationDoc?.title || item.title}
                        </h4>

                        <div className="flex items-center justify-between text-3xs text-gray-500 pt-1">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            {item.recommendationDoc?.type || item.expectedOutput}
                          </span>
                          <span>{item.recommendationDoc?.date || '01 Mar 2026'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* ================= RIGHT FORM TINDAK LANJUT (7 cols) ================= */}
          <div className="lg:col-span-7 space-y-6">
            {activeProposal ? (
              <Card className="border-t-4 border-t-emerald-600 shadow-sm">
                <CardHeader className="pb-3 border-b dark:border-gray-850">
                  <div className="space-y-1">
                    <span className="font-mono text-3xs font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200">
                      {activeProposal.code}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                      Formulir Laporan Pemanfaatan & Rating Kepuasan
                    </h3>
                    <p className="text-2xs text-gray-500">
                      Untuk Usulan: &ldquo;{activeProposal.title}&rdquo;
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                    
                    {/* 1. Bentuk Pemanfaatan */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                        <span>1. Bentuk Pemanfaatan Rekomendasi oleh OPD</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={utilizationType}
                        onChange={(e) => setUtilizationType(e.target.value as any)}
                        className="w-full p-2.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-950 font-medium"
                      >
                        <option value="Rencana Kerja (Renja)">Diadopsi ke dalam Rencana Kerja (Renja) / RKPD Tahun Depan</option>
                        <option value="Revisi / Pembuatan SOP">Digunakan sebagai dasar Revisi / Pembuatan Standar Operasional Prosedur (SOP)</option>
                        <option value="Penyusunan Ranperda">Dijadikan Naskah Akademik Penyusunan Perda / Perbup</option>
                        <option value="Implementasi Teknis">Aplikasi Teknis / Penerapan Langsung di Lapangan</option>
                      </select>
                    </div>

                    {/* 2. Rincian Pemanfaatan */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                        <span>2. Rincian & Deskripsi Pemanfaatan Nyata di Lapangan</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Contoh: Hasil rekomendasi intervensi pangan lokal telah dimasukkan ke dalam Renja Dinas Kesehatan 2027 pada mata anggaran program PMT Posyandu sebesar Rp 450 Juta..."
                        value={utilizationSummary}
                        onChange={(e) => setUtilizationSummary(e.target.value)}
                        className="w-full p-2.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-950 leading-relaxed font-medium"
                      />
                    </div>

                    {/* 3. Rating Kepuasan Layanan */}
                    <div className="space-y-2 pt-2 border-t dark:border-gray-850">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-gray-800 dark:text-gray-200">
                          <span>3. Rating Kepuasan Terhadap Layanan & Hasil Riset BRIDA</span>
                        </label>
                        <span className="text-xs font-black text-amber-500">
                          {satisfactionRating} / 5 Bintang
                        </span>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-850 rounded-lg justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setSatisfactionRating(star)}
                            className="p-1 text-amber-400 hover:scale-125 transition-transform"
                          >
                            <Star
                              className={`h-7 w-7 ${
                                star <= satisfactionRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300 dark:text-gray-700'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 4. Saran & Masukan */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-800 dark:text-gray-200">
                        <span>4. Catatan Kualitatif / Masukan untuk BRIDA (Opsional)</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Tuliskan masukan mengenai kecepatan proses, kualitas data empiris, maupun komunikasi dengan tim peneliti BRIDA..."
                        value={feedbackNotes}
                        onChange={(e) => setFeedbackNotes(e.target.value)}
                        className="w-full p-2.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-950 leading-relaxed font-medium"
                      />
                    </div>

                    {/* Submit button */}
                    <div className="pt-3 border-t dark:border-gray-850 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-all shadow-md flex items-center gap-2 transform active:scale-95"
                      >
                        <Send className="h-4 w-4" />
                        <span>{activeProposal.followUpReport ? 'Perbarui Laporan Pemanfaatan' : 'Kirim Laporan Pemanfaatan'}</span>
                      </button>
                    </div>

                  </form>
                </CardContent>
              </Card>
            ) : null}
          </div>

        </div>
      )}

    </div>
  );
}
