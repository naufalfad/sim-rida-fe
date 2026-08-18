'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, Send, AlertTriangle, FileText, Settings, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import { FileUpload } from '@/components/ui/file-upload';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';

// 1. Zod Validation Schemas
const proposalFormSchema = z.object({
  // Problem Proposal Fields
  problem: z.object({
    judul: z.string().min(10, 'Judul masalah minimal 10 karakter'),
    bidang: z.string().min(1, 'Pilih bidang riset'),
    opd: z.string().min(1, 'OPD pengusul wajib diisi'),
    latarBelakang: z.string().min(20, 'Latar belakang minimal 20 karakter'),
    masalahUtama: z.string().min(15, 'Masalah utama minimal 15 karakter'),
    dampak: z.string().min(15, 'Penjelasan dampak minimal 15 karakter'),
    urgensi: z.string().min(15, 'Penjelasan urgensi minimal 15 karakter'),
    targetPenyelesaian: z.string().min(1, 'Target penyelesaian wajib diisi'),
  }),
  // Research Proposal Fields
  research: z.object({
    judul: z.string().min(10, 'Judul penelitian minimal 10 karakter'),
    tujuan: z.string().min(15, 'Tujuan penelitian minimal 15 karakter'),
    pertanyaanPenelitian: z.string().min(15, 'Pertanyaan penelitian minimal 15 karakter'),
    ruangLingkup: z.string().min(10, 'Ruang lingkup penelitian wajib diisi'),
    outputDiharapkan: z.string().min(10, 'Output penelitian wajib diisi'),
    outcomeDiharapkan: z.string().min(10, 'Outcome penelitian wajib diisi'),
    indikator: z.string().min(10, 'Indikator keberhasilan wajib diisi'),
    estimasiWaktu: z.string().min(1, 'Estimasi waktu wajib diisi'),
    estimasiAnggaran: z.coerce.number().min(1000000, 'Estimasi anggaran minimal Rp 1.000.000'),
  }),
  // KAK Fields
  kak: z.object({
    identitas: z.string().min(5, 'Identitas KAK wajib diisi'),
    latarBelakang: z.string().min(10, 'Latar belakang KAK wajib diisi'),
    dasarPemikiran: z.string().min(10, 'Dasar pemikiran KAK wajib diisi'),
    maksudTujuan: z.string().min(10, 'Maksud & tujuan KAK wajib diisi'),
    ruangLingkup: z.string().min(10, 'Ruang lingkup KAK wajib diisi'),
    metodologi: z.string().min(10, 'Metodologi KAK wajib diisi'),
    output: z.string().min(10, 'Output KAK wajib diisi'),
    outcome: z.string().min(10, 'Outcome KAK wajib diisi'),
    indikator: z.string().min(10, 'Indikator KAK wajib diisi'),
    jadwal: z.string().min(1, 'Jadwal KAK wajib diisi'),
    anggaran: z.coerce.number().min(1000000, 'Anggaran KAK minimal Rp 1.000.000'),
    penutup: z.string().min(5, 'Penutup KAK wajib diisi'),
  }),
});

type ProposalFormValues = z.infer<typeof proposalFormSchema>;

export default function NewProposalPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('problem');
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supportFile, setSupportFile] = useState<File | null>(null);

  // 2. React Hook Form Setup with default values
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      problem: {
        judul: '',
        bidang: 'Sosial dan Kependudukan',
        opd: 'Bappeda Litbang Daerah',
        latarBelakang: '',
        masalahUtama: '',
        dampak: '',
        urgensi: '',
        targetPenyelesaian: '',
      },
      research: {
        judul: '',
        tujuan: '',
        pertanyaanPenelitian: '',
        ruangLingkup: '',
        outputDiharapkan: '',
        outcomeDiharapkan: '',
        indikator: '',
        estimasiWaktu: '',
        estimasiAnggaran: 0,
      },
      kak: {
        identitas: '',
        latarBelakang: '',
        dasarPemikiran: '',
        maksudTujuan: '',
        ruangLingkup: '',
        metodologi: '',
        output: '',
        outcome: '',
        indikator: '',
        jadwal: '',
        anggaran: 0,
      },
    },
  });

  // Watch fields to pre-populate research/KAK details automatically
  const problemJudul = watch('problem.judul');
  const problemLatar = watch('problem.latarBelakang');
  const problemOPD = watch('problem.opd');
  const researchEstimasiAnggaran = watch('research.estimasiAnggaran');
  const researchTujuan = watch('research.tujuan');

  // Sync problem judul to research title and KAK identitas as helper
  React.useEffect(() => {
    setValue('research.judul', problemJudul);
    setValue('kak.identitas', `Kerangka Acuan Kerja (KAK) - Kajian ${problemJudul || ''}`);
  }, [problemJudul, setValue]);

  React.useEffect(() => {
    setValue('kak.latarBelakang', problemLatar);
  }, [problemLatar, setValue]);

  React.useEffect(() => {
    setValue('kak.maksudTujuan', researchTujuan);
  }, [researchTujuan, setValue]);

  React.useEffect(() => {
    setValue('kak.anggaran', researchEstimasiAnggaran);
  }, [researchEstimasiAnggaran, setValue]);

  const tabsItems = [
    { id: 'problem', label: '1. Usulan Masalah', icon: <AlertTriangle className="h-4 w-4" /> },
    { id: 'research', label: '2. Usulan Penelitian', icon: <Settings className="h-4 w-4" /> },
    { id: 'kak', label: '3. Kerangka Acuan (KAK)', icon: <Award className="h-4 w-4" /> },
  ];

  // Save as Draft
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const vals = watch();
      await proposalService.saveProposal({
        ...vals,
        opdName: problemOPD,
        problem: {
          ...vals.problem,
          dokumenPendukung: supportFile ? supportFile.name : undefined,
        },
      });
      toast('Draft usulan berhasil disimpan!', 'success');
      router.push('/opd/usulan');
    } catch (err) {
      toast('Gagal menyimpan draft.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit trigger
  const onSubmitTrigger = async () => {
    // Validate current tab first
    const isStep1Valid = await trigger('problem');
    if (!isStep1Valid) {
      setActiveTab('problem');
      toast('Mohon lengkapi bagian Identifikasi Masalah dengan benar.', 'error');
      return;
    }

    const isStep2Valid = await trigger('research');
    if (!isStep2Valid) {
      setActiveTab('research');
      toast('Mohon lengkapi bagian Rencana Penelitian dengan benar.', 'error');
      return;
    }

    const isStep3Valid = await trigger('kak');
    if (!isStep3Valid) {
      setActiveTab('kak');
      toast('Mohon lengkapi draf KAK / TOR dengan benar.', 'error');
      return;
    }

    setIsSubmitConfirmOpen(true);
  };

  // Final submit handler
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setIsSubmitConfirmOpen(false);

    try {
      const vals = watch();
      const saved = await proposalService.saveProposal({
        ...vals,
        opdName: problemOPD,
        problem: {
          ...vals.problem,
          dokumenPendukung: supportFile ? supportFile.name : undefined,
        },
      });

      // Submit immediately
      await proposalService.submitProposal(saved.id);
      toast(`Usulan ${saved.id} berhasil diajukan ke BRIDA!`, 'success');
      router.push('/opd/usulan');
    } catch {
      toast('Gagal mengajukan usulan riset.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="h-9 w-9 p-0 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Buat Usulan Riset Baru</h1>
            <p className="text-xs text-slate-500">
              Siklus Usulan Masalah → Usulan Penelitian → KAK Daerah.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveDraft} isLoading={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            <span>Simpan Draft</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onSubmitTrigger}
            isLoading={isSubmitting}
            className="bg-blue-650 hover:bg-blue-750"
          >
            <Send className="h-4 w-4 mr-2" />
            <span>Kirim Usulan</span>
          </Button>
        </div>
      </div>

      {/* Tabs bar */}
      <Tabs tabs={tabsItems} activeTab={activeTab} onChange={setActiveTab} variant="pill" />

      {/* Wizard forms */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6">
        {/* TAB 1: PROBLEM PROPOSAL */}
        {activeTab === 'problem' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 dark:border-slate-800">
              Bagian 1: Identifikasi Masalah Daerah
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Judul Usulan Masalah"
                placeholder="Deskripsikan isu secara ringkas"
                error={errors.problem?.judul?.message}
                {...register('problem.judul')}
              />

              <Controller
                name="problem.bidang"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Bidang Kajian"
                    options={[
                      { value: 'Sosial dan Kependudukan', label: 'Sosial dan Kependudukan' },
                      { value: 'Kesehatan dan Kesejahteraan Sosial', label: 'Kesehatan dan Kesejahteraan' },
                      { value: 'Transportasi dan Infrastruktur', label: 'Transportasi & Infrastruktur' },
                      { value: 'Pertanian dan Ketahanan Pangan', label: 'Pertanian & Ketahanan Pangan' },
                      { value: 'Ekonomi dan Perdagangan', label: 'Ekonomi & Perdagangan' },
                      { value: 'Teknologi Informasi dan Pemerintahan', label: 'Teknologi & Tata Kelola' },
                      { value: 'Lingkungan Hidup dan Kehutanan', label: 'Lingkungan Hidup' },
                    ]}
                    error={errors.problem?.bidang?.message}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="OPD Pengusul Utama"
                error={errors.problem?.opd?.message}
                {...register('problem.opd')}
              />

              <Input
                label="Target Penyelesaian (Contoh: Desember 2026)"
                placeholder="Format: Bulan Tahun"
                error={errors.problem?.targetPenyelesaian?.message}
                {...register('problem.targetPenyelesaian')}
              />
            </div>

            <Textarea
              label="Latar Belakang Masalah"
              placeholder="Uraikan fakta/data pendukung mengapa masalah ini harus diselesaikan."
              error={errors.problem?.latarBelakang?.message}
              rows={4}
              {...register('problem.latarBelakang')}
            />

            <Textarea
              label="Fokus Masalah Utama"
              placeholder="Sebutkan inti permasalahan spesifik yang ingin dianalisis."
              error={errors.problem?.masalahUtama?.message}
              rows={3}
              {...register('problem.masalahUtama')}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Textarea
                label="Dampak Jika Tidak Diselesaikan"
                placeholder="Dampak sosial, ekonomi, atau layanan publik jangka panjang."
                error={errors.problem?.dampak?.message}
                rows={3}
                {...register('problem.dampak')}
              />

              <Textarea
                label="Urgensi / Alasan Mendesak"
                placeholder="Mengapa kajian ini harus dilaksanakan pada tahun anggaran berjalan."
                error={errors.problem?.urgensi?.message}
                rows={3}
                {...register('problem.urgensi')}
              />
            </div>

            <FileUpload
              label="Dokumen Pendukung Masalah (PDF/Lainnya)"
              value={supportFile}
              onChange={setSupportFile}
            />
          </div>
        )}

        {/* TAB 2: RESEARCH DETAILS */}
        {activeTab === 'research' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 dark:border-slate-800">
              Bagian 2: Rencana & Kriteria Kajian Penelitian
            </h3>

            <Input
              label="Judul Penelitian (Menyesuaikan Otomatis)"
              error={errors.research?.judul?.message}
              {...register('research.judul')}
              disabled
              className="bg-slate-50 dark:bg-slate-950 text-slate-500 cursor-not-allowed"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Textarea
                label="Tujuan Penelitian"
                placeholder="Tuliskan tujuan spesifik kajian ilmiah."
                error={errors.research?.tujuan?.message}
                rows={3}
                {...register('research.tujuan')}
              />

              <Textarea
                label="Pertanyaan Penelitian (Research Questions)"
                placeholder="Uraikan pertanyaan pokok riset per baris."
                error={errors.research?.pertanyaanPenelitian?.message}
                rows={3}
                {...register('research.pertanyaanPenelitian')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Ruang Lingkup Kajian"
                placeholder="Contoh: Kawasan Pesisir Kecamatan Pantai Cermin"
                error={errors.research?.ruangLingkup?.message}
                {...register('research.ruangLingkup')}
              />

              <Input
                label="Estimasi Waktu Pelaksanaan (Contoh: 4 Bulan)"
                placeholder="Durasi waktu kerja"
                error={errors.research?.estimasiWaktu?.message}
                {...register('research.estimasiWaktu')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Textarea
                label="Output Yang Diharapkan (Keluaran)"
                placeholder="Contoh: Dokumen Analisis Strategi, Draf Roadmap"
                error={errors.research?.outputDiharapkan?.message}
                rows={2}
                {...register('research.outputDiharapkan')}
              />

              <Textarea
                label="Outcome Yang Diharapkan (Hasil)"
                placeholder="Contoh: Peningkatan efektifitas alokasi dana stunting"
                error={errors.research?.outcomeDiharapkan?.message}
                rows={2}
                {...register('research.outcomeDiharapkan')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Indikator Keberhasilan"
                placeholder="Kriteria ukuran keberhasilan target riset"
                error={errors.research?.indikator?.message}
                {...register('research.indikator')}
              />

              <Input
                label="Estimasi Kebutuhan Anggaran (Rupiah)"
                type="number"
                placeholder="Contoh: 85000000"
                error={errors.research?.estimasiAnggaran?.message}
                {...register('research.estimasiAnggaran')}
              />
            </div>
          </div>
        )}

        {/* TAB 3: TOR / KAK DRAFT */}
        {activeTab === 'kak' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 dark:border-slate-800">
              Bagian 3: Draft Kerangka Acuan Kerja (KAK) / Term of Reference (TOR)
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Identitas KAK (Menyesuaikan Judul)"
                error={errors.kak?.identitas?.message}
                {...register('kak.identitas')}
                disabled
                className="bg-slate-50 dark:bg-slate-950 text-slate-500 cursor-not-allowed"
              />

              <Input
                label="Dasar Pemikiran / Landasan Regulasi"
                placeholder="Contoh: UU Kesehatan, Perpres Penurunan Stunting"
                error={errors.kak?.dasarPemikiran?.message}
                {...register('kak.dasarPemikiran')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Textarea
                label="Latar Belakang KAK (Otomatis Sinkron)"
                error={errors.kak?.latarBelakang?.message}
                {...register('kak.latarBelakang')}
                rows={3}
              />

              <Textarea
                label="Maksud & Tujuan KAK"
                error={errors.kak?.maksudTujuan?.message}
                {...register('kak.maksudTujuan')}
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Textarea
                label="Ruang Lingkup Kegiatan KAK"
                placeholder="Deskripsikan cakupan aktivitas survei, uji laboratorium, dll."
                error={errors.kak?.ruangLingkup?.message}
                rows={3}
                {...register('kak.ruangLingkup')}
              />

              <Textarea
                label="Metodologi & Pengumpulan Data KAK"
                placeholder="Jelaskan teknik pengambilan data primer & sekunder."
                error={errors.kak?.metodologi?.message}
                rows={3}
                {...register('kak.metodologi')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Textarea
                label="Output (Keluaran KAK)"
                placeholder="Bentuk fisik dokumen luaran"
                error={errors.kak?.output?.message}
                rows={2}
                {...register('kak.output')}
              />

              <Textarea
                label="Outcome (Dampak KAK)"
                placeholder="Manfaat pasca proyek"
                error={errors.kak?.outcome?.message}
                rows={2}
                {...register('kak.outcome')}
              />

              <Textarea
                label="Indikator Kinerja KAK"
                placeholder="Ukuran ketepatan pelaksanaan"
                error={errors.kak?.indikator?.message}
                rows={2}
                {...register('kak.indikator')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Input
                label="Jadwal Pelaksanaan"
                placeholder="Contoh: September - November 2026"
                error={errors.kak?.jadwal?.message}
                {...register('kak.jadwal')}
              />

              <Input
                label="Total Alokasi Anggaran KAK"
                type="number"
                error={errors.kak?.anggaran?.message}
                {...register('kak.anggaran')}
                disabled
                className="bg-slate-50 dark:bg-slate-950 text-slate-500 cursor-not-allowed"
              />

              <Input
                label="Penutup KAK"
                placeholder="Pernyataan komitmen penutup"
                error={errors.kak?.penutup?.message}
                {...register('kak.penutup')}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Confirmation Submit dialog */}
      <Dialog
        isOpen={isSubmitConfirmOpen}
        onClose={() => setIsSubmitConfirmOpen(false)}
        title="Ajukan Usulan Riset ke BRIDA?"
        description="Setelah diajukan, status usulan akan berubah menjadi Diajukan (SUBMITTED) dan tidak dapat diedit sementara BRIDA memverifikasi kelengkapan dokumen."
        footer={
          <>
            <Button onClick={handleFinalSubmit} variant="primary" size="sm">
              Ya, Ajukan Sekarang
            </Button>
            <Button onClick={() => setIsSubmitConfirmOpen(false)} variant="outline" size="sm">
              Batal
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-200 dark:border-slate-800">
          <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold">Usulan: </span>
            {problemJudul || 'Usulan Tanpa Judul'}
            <p className="mt-1 font-semibold text-slate-500 dark:text-slate-400">
              Bidang: {watch('problem.bidang')} | Anggaran: Rp {Number(watch('research.estimasiAnggaran')).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
