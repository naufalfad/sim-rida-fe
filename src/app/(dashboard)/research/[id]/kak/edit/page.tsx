'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlanningStore } from '@/store/usePlanningStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  Sparkles,
  Info
} from 'lucide-react';

export default function KakEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { getKak, saveKak, fetchPlanning } = usePlanningStore();
  const { researchRecords, proposals, fetchProposals } = useResearchStore();

  const isBrida = user?.role === 'BRIDA';
  const id = params?.id || '';

  // Auto-fetch fresh planning on mount
  useEffect(() => {
    fetchPlanning();
    fetchProposals();
  }, [id, fetchPlanning, fetchProposals]);

  // Access check
  useEffect(() => {
    if (user && user.role !== 'BRIDA') {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  // Find target research record and proposal
  const record = useMemo(() => {
    return researchRecords.find((r) => r.id === id);
  }, [researchRecords, id]);

  const sourceProposal = useMemo(() => {
    if (!record) return null;
    return proposals.find((p) => p.id === record.proposalId);
  }, [proposals, record]);

  const kak = getKak(id);

  // Redirect if KAK status is locked
  useEffect(() => {
    if (kak && ['APPROVED', 'UNDER_REVIEW'].includes(kak.status)) {
      toast('KAK sudah disetujui atau sedang dalam proses review.', 'warning');
      router.replace(`/research/${id}/planning`);
    }
  }, [kak, id, router, toast]);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [background, setBackground] = useState('');
  const [legalBasis, setLegalBasis] = useState('');
  const [intent, setIntent] = useState('');
  const [objective, setObjective] = useState('');
  const [target, setTarget] = useState('');
  const [scope, setScope] = useState('');
  const [methodology, setMethodology] = useState('');
  const [location, setLocation] = useState('');
  const [duration, setDuration] = useState('6 Bulan');
  const [output, setOutput] = useState('');
  const [benefit, setBenefit] = useState('');
  const [indicators, setIndicators] = useState('');
  const [personnel, setPersonnel] = useState('');
  const [budgetEstimates, setBudgetEstimates] = useState(0);
  const [sector, setSector] = useState('');
  const [notes, setNotes] = useState('');

  const [validationError, setValidationError] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Pre-fill / Autofill from Research Record and Proposal
  useEffect(() => {
    if (kak && kak.status !== 'NOT_STARTED') {
      // Load existing KAK data
      setTitle(kak.title);
      setBackground(kak.background);
      setLegalBasis(kak.legalBasis);
      setIntent(kak.intent);
      setObjective(kak.objective);
      setTarget(kak.target);
      setScope(kak.scope);
      setMethodology(kak.methodology);
      setLocation(kak.location);
      setDuration(kak.duration);
      setOutput(kak.output);
      setBenefit(kak.benefit);
      setIndicators(kak.indicators);
      setPersonnel(kak.personnel);
      setBudgetEstimates(kak.budgetEstimates);
      setNotes(kak.notes);
      setSector(kak.sector || '');
    } else if (record && sourceProposal) {
      // Autofill from proposal
      setTitle(record.title);
      setBackground(sourceProposal.background);
      setLegalBasis('1. Undang-Undang Nomor 17 Tahun 2023 tentang Kesehatan\n2. Peraturan Daerah Rencana Kerja Pembangunan.');
      setIntent(`Mewujudkan sinkronisasi data program ${sourceProposal.sector} terpadu.`);
      setObjective(sourceProposal.objective);
      setTarget(`Tersusunnya dokumen draf naskah akademis prioritas sektoral.`);
      setScope(sourceProposal.scope);
      setMethodology('Survei primer, Focus Group Discussion (FGD), studi literasi kualitatif.');
      setLocation('Kabupaten Administratif.');
      setDuration(proposalDurationFormatted(sourceProposal.duration));
      setOutput(sourceProposal.expectedOutput);
      setBenefit(sourceProposal.expectedBenefits || '');
      setIndicators('Tingkat penerimaan naskah akademis minimal 80%.');
      setPersonnel('1 Orang Tenaga Ahli Utama (Ketua Peneliti), 2 Orang Tenaga Pendukung Lapangan.');
      setBudgetEstimates(125000000); // Default estimate
      setNotes('');
      setSector(sourceProposal.sector || '');
    }
  }, [kak, record, sourceProposal]);

  const proposalDurationFormatted = (dur: string) => {
    return dur || '6 Bulan';
  };

  // Warning when leaving dirty form (Section 34)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'Draf perubahan belum disimpan. Anda yakin ingin keluar?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // Handle input changes with dirty state tracking
  const handleFieldChange = (setter: Function) => (e: any) => {
    setter(e.target.value);
    setIsDirty(true);
  };

  // Validation
  const getValidationError = () => {
    if (!title.trim()) return 'Judul Kegiatan wajib diisi.';
    if (!background.trim()) return 'Latar Belakang wajib diisi.';
    if (!objective.trim()) return 'Tujuan KAK wajib diisi.';
    if (!target.trim()) return 'Sasaran KAK wajib diisi.';
    if (!scope.trim()) return 'Ruang Lingkup wajib diisi.';
    if (!methodology.trim()) return 'Metodologi wajib diisi.';
    if (!duration.trim()) return 'Durasi KAK wajib diisi.';
    if (!output.trim()) return 'Output wajib diisi.';
    if (!sector.trim()) return 'Sektor Pembangunan wajib diisi.';
    if (budgetEstimates <= 0) return 'Pagu Anggaran KAK harus lebih dari Rp 0.';
    return '';
  };

  // Action: Save Draft KAK
  const handleSave = async () => {
    const errorMsg = getValidationError();
    if (errorMsg) {
      setValidationError(errorMsg);
      toast(errorMsg, 'warning');
      return;
    }

    setValidationError('');
    setIsDirty(false);

    try {
      await saveKak(
        id,
        {
          title,
          background,
          legalBasis,
          intent,
          objective,
          target,
          scope,
          methodology,
          location,
          duration,
          output,
          benefit,
          indicators,
          personnel,
          budgetEstimates: Number(budgetEstimates),
          notes,
          sector,
          // keep version as is, or store handles increment on review returns
        },
        user?.name || 'BRIDA Litbang'
      );

      toast('Draf Kerangka Acuan Kerja (KAK) berhasil disimpan.', 'success');
      router.push(`/research/${id}/planning`);
    } catch (err: any) {
      toast('Gagal menyimpan KAK: ' + (err.message || 'Terjadi kesalahan.'), 'error');
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
          onClick={() => {
            if (isDirty) {
              if (confirm('Draf perubahan belum disimpan. Anda yakin ingin keluar?')) {
                router.push(`/research/${record.id}/planning`);
              }
            } else {
              router.push(`/research/${record.id}/planning`);
            }
          }}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </button>
      </div>

      <PageHeader
        title={kak.status === 'NOT_STARTED' ? 'Buat Dokumen KAK' : 'Edit Dokumen KAK'}
        description={`Penyusunan KAK Kerangka Acuan Kerja untuk riset: "${record.title}"`}
      />

      {/* Form editor */}
      <Card>
        <CardContent className="p-6 space-y-6">
          
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Formulir Penyusunan KAK
            </h3>
            <span className="text-[10px] text-gray-400 font-semibold italic flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-blue-500" />
              <span>Based on Research Proposal</span>
            </span>
          </div>

          <div className="space-y-4 text-xs">
            
            {/* Judul Kegiatan KAK */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Judul Kegiatan KAK *
              </label>
              <input
                type="text"
                value={title}
                onChange={handleFieldChange(setTitle)}
                placeholder="Masukkan judul KAK resmi..."
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Pagu Anggaran Kasar, Jangka Waktu, Lokasi, Sektor */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                  Pagu Anggaran Kasar (Estimasi) *
                </label>
                <input
                  type="number"
                  value={budgetEstimates || ''}
                  onChange={handleFieldChange(setBudgetEstimates)}
                  placeholder="Rp"
                  className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                  Jangka Waktu Rencana *
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={handleFieldChange(setDuration)}
                  className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                  Lokasi Pelaksanaan *
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={handleFieldChange(setLocation)}
                  className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                  Sektor Pembangunan *
                </label>
                <input
                  type="text"
                  value={sector}
                  onChange={handleFieldChange(setSector)}
                  placeholder="Sektor"
                  className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Latar Belakang */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Latar Belakang *
              </label>
              <textarea
                value={background}
                onChange={handleFieldChange(setBackground)}
                rows={4}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

            {/* Dasar Pelaksanaan */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Dasar Pelaksanaan (Hukum/Perda)
              </label>
              <textarea
                value={legalBasis}
                onChange={handleFieldChange(setLegalBasis)}
                rows={2}
                placeholder="Rincian regulasi rujukan..."
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

            {/* Maksud */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Maksud Kegiatan
              </label>
              <textarea
                value={intent}
                onChange={handleFieldChange(setIntent)}
                rows={2}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

            {/* Tujuan */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Tujuan Kegiatan KAK *
              </label>
              <textarea
                value={objective}
                onChange={handleFieldChange(setObjective)}
                rows={3}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

            {/* Sasaran */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Sasaran Kegiatan KAK *
              </label>
              <textarea
                value={target}
                onChange={handleFieldChange(setTarget)}
                rows={2}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

            {/* Ruang Lingkup */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Ruang Lingkup *
              </label>
              <textarea
                value={scope}
                onChange={handleFieldChange(setScope)}
                rows={3}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

            {/* Metodologi */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Metodologi Kegiatan *
              </label>
              <textarea
                value={methodology}
                onChange={handleFieldChange(setMethodology)}
                rows={3}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

            {/* Output */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Keluaran (Output) *
              </label>
              <textarea
                value={output}
                onChange={handleFieldChange(setOutput)}
                rows={2}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

            {/* Outcome / Manfaat */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Manfaat (Outcome)
              </label>
              <textarea
                value={benefit}
                onChange={handleFieldChange(setBenefit)}
                rows={2}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

            {/* Indikator Keberhasilan */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Indikator Keberhasilan
              </label>
              <textarea
                value={indicators}
                onChange={handleFieldChange(setIndicators)}
                rows={2}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

            {/* Kebutuhan Personel */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Personel / Tenaga Ahli yang Dibutuhkan
              </label>
              <textarea
                value={personnel}
                onChange={handleFieldChange(setPersonnel)}
                rows={2}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

            {/* Catatan */}
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Catatan Tambahan
              </label>
              <textarea
                value={notes}
                onChange={handleFieldChange(setNotes)}
                rows={2}
                className="block w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-750 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            </div>

          </div>

          {/* Validation Errors block */}
          {validationError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded text-red-750 dark:text-red-400 text-2xs flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0 text-red-650" />
              <span><strong>Validation Error:</strong> {validationError}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-150 dark:border-gray-850">
            <span className="text-[10px] text-gray-400 font-medium">
              * Menandakan field wajib (mandatory) untuk diajukan.
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (isDirty) {
                    if (confirm('Draf perubahan belum disimpan. Anda yakin ingin keluar?')) {
                      setIsDirty(false);
                      router.push(`/research/${record.id}/planning`);
                    }
                  } else {
                    router.push(`/research/${record.id}/planning`);
                  }
                }}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:text-gray-300 rounded text-xs font-semibold bg-white dark:bg-gray-950"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow"
              >
                <Save className="h-4 w-4" />
                <span>Save Draft KAK</span>
              </button>
            </div>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}
