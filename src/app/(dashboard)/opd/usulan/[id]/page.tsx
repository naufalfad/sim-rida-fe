'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, AlertTriangle, Settings, Award, Calendar, FileText, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { useProblemStore } from '@/store/useProblemStore';
import { researchService } from '@/services/research.service';
import { Kak } from '@/types/research.types';
import { AttachmentPreview } from '@/components/ui/attachment-preview';

export default function DetailUsulanPage() {
  const router = useRouter();
  const params = useParams();
  const problemId = params.id as string;

  const { fetchProblemById } = useProblemStore();
  
  const [problem, setProblem] = useState<any>(null);
  const [kak, setKak] = useState<Kak | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Fetch problem detail
        const probData = await fetchProblemById(problemId);
        setProblem(probData);

        // If there's a related research, fetch the KAK
        if (probData.research) {
          const researchId = probData.research.id;
          try {
            const kakData = await researchService.getKakByResearchId(researchId);
            setKak(kakData);
          } catch (kakErr) {
            console.log('KAK not found or error fetching KAK:', kakErr);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat detail usulan.');
      } finally {
        setIsLoading(false);
      }
    };

    if (problemId) {
      loadData();
    }
  }, [problemId, fetchProblemById]);

  if (isLoading) {
    return <LoadingState message="Memuat detail usulan..." />;
  }

  if (error || !problem) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Usulan Tidak Ditemukan</h2>
        <p className="text-slate-500">{error || 'Data usulan gagal dimuat.'}</p>
        <Button onClick={() => router.back()} variant="outline" className="rounded-none">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  const research = problem.research || null;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="h-9 w-9 p-0 rounded-none shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight uppercase">Detail Usulan Terpadu</h1>
              <StatusBadge status={problem.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ditinjau oleh BRIDA. ID: {problem.id.substring(0, 8)}...
            </p>
          </div>
        </div>

        {(problem.status === 'PROBLEM_SUBMITTED' || problem.status === 'REVISION_REQUIRED') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/opd/usulan/${problem.id}/edit`)}
            className="rounded-none border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Edit className="h-4 w-4 mr-2" />
            <span>Edit Usulan</span>
          </Button>
        )}
      </div>

      {problem.reviewNotes && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-none">
          <h3 className="font-bold text-amber-800 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Catatan Review BRIDA
          </h3>
          <p className="text-sm text-amber-700 mt-1">{problem.reviewNotes}</p>
        </div>
      )}

      {/* Grid Layout for Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Info) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* IDENTIFIKASI MASALAH */}
          <Card className="rounded-none shadow-sm border-slate-200">
            <CardContent className="p-0">
              <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 uppercase text-sm">1. Identifikasi Masalah</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Judul Kajian / Masalah</h4>
                  <p className="font-medium text-slate-900 text-lg">{problem.title}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Sektor</h4>
                    <p className="text-sm text-slate-800">{problem.sector?.name || '-'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Penyelesaian</h4>
                    <p className="text-sm text-slate-800">{problem.targetCompletion || '-'}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Latar Belakang</h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{problem.background}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Fokus Utama</h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{problem.mainFocus}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Dampak Jika Dibiarkan</h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{problem.impact}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Urgensi</h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{problem.urgency}</p>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Dokumen Pendukung</h4>
                    <AttachmentPreview files={((problem as any).attachments || []).map((att: any) => typeof att === 'string' ? att : att.fileUrl)} />
                  </div>                </div>
              </div>
            </CardContent>
          </Card>

          {/* USULAN PENELITIAN */}
          {research ? (
            <Card className="rounded-none shadow-sm border-slate-200">
              <CardContent className="p-0">
                <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <h3 className="font-bold text-slate-800 uppercase text-sm">2. Usulan Penelitian / Perencanaan</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tujuan Penelitian</h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{research.objective}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pertanyaan Penelitian</h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{research.researchQuestions}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Ruang Lingkup</h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{research.scope}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Expected Output</h4>
                      <p className="text-sm text-slate-700">{research.expectedOutput}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Expected Outcome</h4>
                      <p className="text-sm text-slate-700">{research.expectedOutcome}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="p-4 bg-slate-50 border border-dashed border-slate-300 text-center text-slate-500">
              Belum ada usulan penelitian untuk masalah ini.
            </div>
          )}

          {/* KAK */}
          {kak ? (
            <Card className="rounded-none shadow-sm border-slate-200">
              <CardContent className="p-0">
                <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-800 uppercase text-sm">3. Kerangka Acuan Kerja (KAK) & RAB</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Maksud & Tujuan KAK</h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{kak.maksudTujuan}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Metodologi</h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{kak.metodologi}</p>
                  </div>
                  
                  {/* RAB Table */}
                  {kak.rabItems && kak.rabItems.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Rincian Anggaran Biaya (RAB)</h4>
                      <div className="overflow-x-auto border border-slate-200">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="p-2 font-semibold text-slate-600">Deskripsi</th>
                              <th className="p-2 font-semibold text-slate-600 text-right">Vol</th>
                              <th className="p-2 font-semibold text-slate-600 text-center">Sat</th>
                              <th className="p-2 font-semibold text-slate-600 text-right">Harga Satuan</th>
                              <th className="p-2 font-semibold text-slate-600 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {kak.rabItems.map((item, idx) => (
                              <tr key={idx}>
                                <td className="p-2">{item.description}</td>
                                <td className="p-2 text-right">{item.volume}</td>
                                <td className="p-2 text-center">{item.unit}</td>
                                <td className="p-2 text-right">Rp {item.unitPrice.toLocaleString('id-ID')}</td>
                                <td className="p-2 text-right font-medium">Rp {(item.volume * item.unitPrice).toLocaleString('id-ID')}</td>
                              </tr>
                            ))}
                            <tr className="bg-slate-50 font-bold text-slate-800">
                              <td colSpan={4} className="p-2 text-right">TOTAL ESTIMASI ANGGARAN</td>
                              <td className="p-2 text-right">
                                Rp {kak.rabItems.reduce((acc, curr) => acc + (curr.volume * curr.unitPrice), 0).toLocaleString('id-ID')}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

        </div>

        {/* Right Column (Sidebar Summary) */}
        <div className="space-y-6">
          <Card className="rounded-none shadow-sm border-slate-200">
            <CardContent className="p-0">
              <div className="bg-slate-800 text-white p-4">
                <h3 className="font-bold text-sm uppercase">Informasi Eksekutif</h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Tgl Pengajuan</p>
                  <p className="text-sm font-medium flex items-center mt-1">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                    {new Date(problem.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                
                {research && (
                  <>
                    <hr className="border-slate-100" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Estimasi Durasi</p>
                      <p className="text-sm font-medium mt-1">{research.estimatedDurationMonths} Bulan</p>
                    </div>
                    <hr className="border-slate-100" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Estimasi Anggaran</p>
                      <p className="text-lg font-bold text-blue-600 mt-1">
                        Rp {research.estimatedBudget.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
