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
import { Proposal, PolicyBrief } from '@/types/proposals';
import { ArrowLeft, Save, FileText, CheckCircle } from 'lucide-react';

export default function BridaPolicyBriefDetailPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;
  const { toast } = useToast();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [policyIssue, setPolicyIssue] = useState('');
  const [evidence, setEvidence] = useState('');
  const [findings, setFindings] = useState('');
  const [implication, setImplication] = useState('');
  const [policyOptions, setPolicyOptions] = useState('');
  const [preferredOption, setPreferredOption] = useState('');
  const [implConsideration, setImplConsideration] = useState('');
  const [status, setStatus] = useState<PolicyBrief['status']>('DRAFT');

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const data = await proposalService.getProposalById(proposalId);
        setProposal(data);
        if (data) {
          // Pre-populate if policy brief already exists
          if (data.policyBrief) {
            setPolicyIssue(data.policyBrief.policyIssue);
            setEvidence(data.policyBrief.evidence);
            setFindings(data.policyBrief.researchFindings);
            setImplication(data.policyBrief.implication);
            setPolicyOptions(data.policyBrief.policyOptions);
            setPreferredOption(data.policyBrief.preferredOption);
            setImplConsideration(data.policyBrief.implementationConsideration);
            setStatus(data.policyBrief.status);
          } else {
            // Auto-populate from researcher's final report findings if available
            setPolicyIssue(data.problem.masalahUtama || '');
            setEvidence(data.problem.latarBelakang || '');
            setFindings(data.opdReport?.findings || '');
            setImplConsideration(data.kak?.maksudTujuan || '');
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
    return <LoadingState message="Memuat draf policy brief..." />;
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <h3 className="text-base font-semibold">Data Kajian Tidak Ditemukan</h3>
        <Button onClick={() => router.push('/brida/policy-brief')} className="mt-4" variant="outline">
          Kembali
        </Button>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyIssue || !evidence || !findings || !implication || !policyOptions || !preferredOption) {
      toast('Semua kolom utama naskah kebijakan wajib diisi.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const briefData = {
        policyIssue,
        evidence,
        researchFindings: findings,
        implication,
        policyOptions,
        preferredOption,
        implementationConsideration: implConsideration,
        status,
      };

      const updated = await proposalService.savePolicyBrief(proposal.id, briefData);
      if (updated) {
        toast('Draf Policy Brief berhasil diperbarui!', 'success');
        router.push('/brida/policy-brief');
      }
    } catch {
      toast('Gagal menyimpan Policy Brief.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions = [
    { value: 'DRAFT', label: 'DRAFT - Konsep Awal' },
    { value: 'REVIEW', label: 'REVIEW - Tinjauan Tim Evaluator' },
    { value: 'REVISION', label: 'REVISION - Perlu Direvisi' },
    { value: 'APPROVED', label: 'APPROVED - Sah (Siap Tulis Rekomendasi)' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4 dark:border-slate-850">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/brida/policy-brief')}
          className="h-9 w-9 p-0 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <span className="font-mono text-2xs font-bold text-blue-655 dark:text-blue-400">
            Penyusunan Policy Brief / PB-{proposal.id}
          </span>
          <h1 className="text-xl font-bold tracking-tight mt-0.5 max-w-sm sm:max-w-md truncate text-slate-800 dark:text-slate-250">
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
                <Textarea
                  label="1. Isu Kebijakan Utama (Policy Issue)"
                  placeholder="Deskripsikan ketidakseimbangan sosial/teknis daerah yang dibahas..."
                  value={policyIssue}
                  onChange={(e) => setPolicyIssue(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Textarea
                  label="2. Latar Belakang & Bukti (Evidence)"
                  placeholder="Tuliskan data statistik, urgensi daerah, dan justifikasi ilmiah..."
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Textarea
                  label="3. Temuan Riset Lapangan (Research Findings)"
                  placeholder="Hasil observasi peneliti utama, survey, dan kuesioner..."
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Textarea
                  label="4. Implikasi Kebijakan (Implication)"
                  placeholder="Dampak jangka panjang jika masalah dibiarkan tanpa regulasi baru..."
                  value={implication}
                  onChange={(e) => setImplication(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Textarea
                  label="5. Opsi-Opsi Regulasi (Policy Options)"
                  placeholder="Opsi A: Pertahankan status quo&#10;Opsi B: Reformasi sistem&#10;Opsi C: Insentif fiskal..."
                  value={policyOptions}
                  onChange={(e) => setPolicyOptions(e.target.value)}
                  rows={4}
                />
                <Textarea
                  label="6. Rekomendasi Pilihan (Preferred Option)"
                  placeholder="Deskripsikan pilihan paling efisien dan berdampak positif bagi APBD..."
                  value={preferredOption}
                  onChange={(e) => setPreferredOption(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Textarea
                  label="7. Pertimbangan Implementasi (Implementation Consideration)"
                  placeholder="Langkah taktis OPD, mitigasi sosial, dan linimasa pengesahan..."
                  value={implConsideration}
                  onChange={(e) => setImplConsideration(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4 dark:border-slate-850">
                <Button
                  type="submit"
                  isLoading={isSaving}
                  className="bg-blue-650 hover:bg-blue-750 text-white font-bold flex items-center gap-1.5 shadow"
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan Policy Brief</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Status manager & Researcher details */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850">
              Kelola Alur Kerja (Workflow)
            </h3>

            <div>
              <label className="text-3xs font-bold text-slate-450 uppercase block mb-1">Status Tahapan Naskah</label>
              <Select
                options={statusOptions}
                value={status}
                onChange={(e) => setStatus(e.target.value as PolicyBrief['status'])}
                className="bg-white dark:bg-slate-950 dark:border-slate-850"
              />
            </div>

            <div className="p-3 bg-slate-50/50 dark:bg-slate-955 rounded text-2xs text-slate-500 leading-relaxed font-medium">
              *Mengubah status ke <strong>APPROVED</strong> akan mengunci naskah ini dan mengaktifkan tombol draf Rekomendasi Bupati untuk OPD.
            </div>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 text-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-805 dark:text-slate-205 border-b pb-2 dark:border-slate-850">
              Tim Riset Penulis
            </h3>
            <div className="space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-200">{proposal.opdName}</p>
              <p className="text-3xs text-slate-455">Pelaksana OPD</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
