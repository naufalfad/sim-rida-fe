'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal, ResearchRecommendation } from '@/types/proposals';
import { ArrowLeft, Save, Send, ShieldAlert } from 'lucide-react';

export default function BridaRekomendasiDetailPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;
  const { toast } = useToast();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [recTitle, setRecTitle] = useState('');
  const [issue, setIssue] = useState('');
  const [evidence, setEvidence] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [responsibleOPD, setResponsibleOPD] = useState('Dinas Kesehatan');
  const [priority, setPriority] = useState<ResearchRecommendation['priority']>('MEDIUM');
  const [expectedImpact, setExpectedImpact] = useState('');
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const data = await proposalService.getProposalById(proposalId);
        setProposal(data);
        if (data) {
          if (data.recommendation) {
            setRecTitle(data.recommendation.recommendationTitle);
            setIssue(data.recommendation.issue);
            setEvidence(data.recommendation.evidence);
            setRecommendation(data.recommendation.recommendation);
            setResponsibleOPD(data.recommendation.responsibleOPD);
            setPriority(data.recommendation.priority);
            setExpectedImpact(data.recommendation.expectedImpact);
            setTargetDate(data.recommendation.targetDate);
          } else {
            // Auto-populate from Policy Brief or KAK if available
            setRecTitle(`Rekomendasi Kebijakan Hasil Kajian ${data.id}`);
            setIssue(data.policyBrief?.policyIssue || data.problem.masalahUtama || '');
            setEvidence(data.policyBrief?.evidence || data.problem.latarBelakang || '');
            setRecommendation(data.policyBrief?.preferredOption || '');
            setResponsibleOPD(data.opdName || 'Dinas Kesehatan');
            setExpectedImpact(data.policyBrief?.implication || '');
            setTargetDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 3 months default
          }
        }
      } catch (err) {
        console.error('Failed to load proposal details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [proposalId]);

  if (isLoading) {
    return <LoadingState message="Memuat detail rekomendasi..." />;
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <h3 className="text-base font-semibold">Data Kajian Tidak Ditemukan</h3>
        <Button onClick={() => router.push('/brida/rekomendasi')} className="mt-4" variant="outline">
          Kembali
        </Button>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle || !issue || !evidence || !recommendation || !expectedImpact || !targetDate) {
      toast('Semua kolom draf rekomendasi wajib diisi.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const recData = {
        recommendationTitle: recTitle,
        issue,
        evidence,
        recommendation,
        responsibleOPD,
        priority,
        expectedImpact,
        targetDate,
      };

      const updated = await proposalService.saveRecommendation(proposal.id, recData);
      if (updated) {
        toast('Rekomendasi kebijakan berhasil dikirim ke Kepala BRIDA / Bupati!', 'success');
        router.push('/brida/rekomendasi');
      }
    } catch {
      toast('Gagal mengirim rekomendasi.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const opdOptions = [
    { value: 'Bappeda Litbang Daerah', label: 'Bappeda Litbang Daerah' },
    { value: 'Dinas Kesehatan', label: 'Dinas Kesehatan' },
    { value: 'Dinas Perhubungan', label: 'Dinas Perhubungan' },
    { value: 'Dinas Pariwisata', label: 'Dinas Pariwisata' },
    { value: 'Dinas Pekerjaan Umum', label: 'Dinas Pekerjaan Umum' },
    { value: 'Dinas Lingkungan Hidup', label: 'Dinas Lingkungan Hidup' }
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Rendah (Low)' },
    { value: 'MEDIUM', label: 'Sedang (Medium)' },
    { value: 'HIGH', label: 'Tinggi (High)' }
  ];

  const isAlreadyApproved = proposal.status === 'RECOMMENDATION_APPROVED';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4 dark:border-slate-850">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/brida/rekomendasi')}
          className="h-9 w-9 p-0 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <span className="font-mono text-2xs font-bold text-teal-655 dark:text-teal-400">
            Perumusan Rekomendasi Bupati / REC-{proposal.id}
          </span>
          <h1 className="text-xl font-bold tracking-tight mt-0.5 max-w-sm sm:max-w-md truncate text-slate-805 dark:text-slate-205">
            {proposal.title}
          </h1>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Form fields */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6">
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="text-3xs font-bold text-slate-450 uppercase block mb-1">Judul Rekomendasi SK</label>
                <input
                  type="text"
                  placeholder="Contoh: Rekomendasi Pemasangan PJU Hemat Energi Daerah Pesisir..."
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  disabled={isAlreadyApproved}
                  className="h-9 w-full rounded-lg border border-slate-350 bg-white px-3 text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>

              <div>
                <Textarea
                  label="Pokok Masalah (Issue)"
                  placeholder="Uraikan pokok masalah regulasi yang ditemukan..."
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  disabled={isAlreadyApproved}
                  rows={2}
                />
              </div>

              <div>
                <Textarea
                  label="Bukti Empiris Riset (Evidence)"
                  placeholder="Kutipan data primer hasil riset..."
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  disabled={isAlreadyApproved}
                  rows={2}
                />
              </div>

              <div>
                <Textarea
                  label="Naskah Rekomendasi Formal"
                  placeholder="Tuliskan butir rekomendasi operasional konkrit untuk dijalankan dinas/OPD..."
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  disabled={isAlreadyApproved}
                  rows={4}
                />
              </div>

              <div>
                <Textarea
                  label="Dampak yang Diharapkan (Expected Impact)"
                  placeholder="Dampak sosial/efisiensi Pagu APBD setelah program diselesaikan..."
                  value={expectedImpact}
                  onChange={(e) => setExpectedImpact(e.target.value)}
                  disabled={isAlreadyApproved}
                  rows={2}
                />
              </div>

              {!isAlreadyApproved && (
                <div className="flex justify-end gap-2 border-t pt-4 dark:border-slate-850">
                  <Button
                    type="submit"
                    isLoading={isSaving}
                    className="bg-teal-650 hover:bg-teal-755 text-white font-bold flex items-center gap-1.5 shadow"
                  >
                    <Send className="h-4 w-4" />
                    <span>Kirim ke Kepala BRIDA (Ajukan SK)</span>
                  </Button>
                </div>
              )}
            </form>
          </Card>
        </div>

        {/* Configuration settings */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-805 dark:text-slate-205 border-b pb-2 dark:border-slate-850">
              Pelaksana & Prioritas
            </h3>

            <div>
              <label className="text-3xs font-bold text-slate-455 uppercase block mb-1">Dinas/OPD Penanggungjawab</label>
              <Select
                options={opdOptions}
                value={responsibleOPD}
                onChange={(e) => setResponsibleOPD(e.target.value)}
                disabled={isAlreadyApproved}
                className="bg-white dark:bg-slate-950 dark:border-slate-850"
              />
            </div>

            <div>
              <label className="text-3xs font-bold text-slate-455 uppercase block mb-1">Skala Prioritas</label>
              <Select
                options={priorityOptions}
                value={priority}
                onChange={(e) => setPriority(e.target.value as ResearchRecommendation['priority'])}
                disabled={isAlreadyApproved}
                className="bg-white dark:bg-slate-950 dark:border-slate-850"
              />
            </div>

            <div>
              <label className="text-3xs font-bold text-slate-455 uppercase block mb-1">Target Tanggal Penyelesaian</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                disabled={isAlreadyApproved}
                className="h-9 w-full rounded-lg border border-slate-350 bg-white px-3 text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 text-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-805 dark:text-slate-205 border-b pb-2 dark:border-slate-850 flex items-center gap-1">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <span>Status Pengesahan</span>
            </h3>
            <p className="font-semibold text-slate-700 dark:text-slate-350 leading-relaxed">
              Status Berjalan: <span className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded dark:bg-slate-800 uppercase font-bold text-3xs">{proposal.status}</span>
            </p>
            {isAlreadyApproved && (
              <p className="text-emerald-600 font-bold">
                ✓ Rekomendasi ini telah ditandatangani Bupati dan sedang dijalankan oleh OPD terkait.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
