'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Send, AlertTriangle, FileText, Settings, Award, Plus, Trash2, Wand2, ChevronRight, ChevronLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';

import { useProblemStore } from '@/store/useProblemStore';
import { useResearchStore } from '@/store/useResearchStore';
import { researchService } from '@/services/research.service';

const rabItemSchema = z.object({
  description: z.string().min(3, 'Nama barang/kegiatan minimal 3 karakter'),
  volume: z.coerce.number().min(1, 'Volume minimal 1'),
  unit: z.string().min(1, 'Satuan wajib diisi'),
  unitPrice: z.coerce.number().min(0, 'Harga satuan minimal 0'),
});

const integratedFormSchema = z.object({
  problem: z.object({
    title: z.string().min(5, 'Judul masalah minimal 5 karakter').max(150, 'Judul terlalu panjang'),
    sectorId: z.string().min(1, 'Pilih sektor'),
    targetCompletion: z.string().min(3, 'Target penyelesaian wajib diisi (contoh: Desember 2026)'),
    background: z.string().min(20, 'Latar belakang masalah minimal 20 karakter'),
    mainFocus: z.string().min(10, 'Fokus masalah utama wajib diisi'),
    impact: z.string().min(10, 'Dampak masalah wajib diisi'),
    urgency: z.string().min(5, 'Urgensi masalah wajib diisi'),
  }),
  research: z.object({
    researchTypeId: z.string().min(1, 'Pilih jenis penelitian'),
    objective: z.string().min(10, 'Tujuan penelitian wajib diisi secara jelas'),
    researchQuestions: z.string().min(10, 'Pertanyaan penelitian wajib diisi'),
    scope: z.string().min(5, 'Ruang lingkup kajian wajib diisi'),
    expectedOutput: z.string().min(5, 'Output yang diharapkan wajib diisi'),
    expectedOutcome: z.string().min(5, 'Outcome yang diharapkan wajib diisi'),
    successIndicators: z.string().min(5, 'Indikator keberhasilan wajib diisi'),
    estimatedBudget: z.coerce.number().min(1000000, 'Anggaran harus positif (min 1 juta)'),
    estimatedDurationMonths: z.coerce.number().min(1, 'Durasi minimal 1 bulan'),
  }),
  kak: z.object({
    dasarPemikiran: z.string().min(10, 'Dasar pemikiran wajib diisi secara jelas'),
    maksudTujuan: z.string().min(10, 'Maksud & tujuan wajib diisi'),
    ruangLingkup: z.string().min(10, 'Ruang lingkup kegiatan wajib diisi'),
    metodologi: z.string().min(10, 'Metodologi & pengumpulan data wajib diisi'),
    output: z.string().min(5, 'Output keluaran KAK wajib diisi'),
    outcome: z.string().min(5, 'Outcome KAK wajib diisi'),
    indikatorKinerja: z.string().min(5, 'Indikator kinerja wajib diisi'),
    jadwalPelaksanaan: z.string().min(5, 'Jadwal pelaksanaan wajib diisi'),
    penutup: z.string().min(10, 'Penutup wajib diisi'),
    rabItems: z.array(rabItemSchema).nonempty('Minimal harus ada 1 item Rincian Anggaran Biaya (RAB)'),
  }),
});

type IntegratedFormValues = z.infer<typeof integratedFormSchema>;

export default function NewIntegratedProposalPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supportFile, setSupportFile] = useState<File | null>(null);

  const { sectors, fetchSectors, createProblem } = useProblemStore();
  const { researchTypes, fetchResearchTypes } = useResearchStore();

  useEffect(() => {
    fetchSectors();
    fetchResearchTypes();
  }, [fetchSectors, fetchResearchTypes]);

  const {
    register,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<IntegratedFormValues>({
    resolver: zodResolver(integratedFormSchema),
    defaultValues: {
      problem: { title: '', sectorId: '', targetCompletion: '', background: '', mainFocus: '', impact: '', urgency: '' },
      research: { researchTypeId: '', objective: '', researchQuestions: '', scope: '', expectedOutput: '', expectedOutcome: '', successIndicators: '', estimatedBudget: 0, estimatedDurationMonths: 0 },
      kak: { dasarPemikiran: '', maksudTujuan: '', ruangLingkup: '', metodologi: '', output: '', outcome: '', indikatorKinerja: '', jadwalPelaksanaan: '', penutup: '', rabItems: [{ description: '', volume: 1, unit: '', unitPrice: 0 }] },
    },
  });

  const { fields: rabFields, append: appendRab, remove: removeRab } = useFieldArray({
    control,
    name: 'kak.rabItems',
  });

  const problemTitle = watch('problem.title');
  const problemSectorId = watch('problem.sectorId');
  const researchObjective = watch('research.objective');

  useEffect(() => {
    setValue('kak.maksudTujuan', researchObjective);
  }, [researchObjective, setValue]);

  const handleFillDummyData = () => {
    // Fill Problem
    setValue('problem.title', 'Kajian Strategi Penanganan Stunting Terintegrasi Berbasis Komunitas');
    if (sectors.length > 0) setValue('problem.sectorId', sectors[0].id);
    setValue('problem.targetCompletion', 'Desember 2026');
    setValue('problem.background', 'Berdasarkan data profil kesehatan tahun 2025, angka prevalensi stunting di wilayah pesisir masih berada di angka 18%...');
    setValue('problem.mainFocus', 'Kurangnya sinergi program intervensi spesifik dan sensitif di tingkat desa pesisir...');
    setValue('problem.impact', 'Penurunan kualitas SDM jangka panjang, meningkatnya beban biaya kesehatan daerah...');
    setValue('problem.urgency', 'Perlu tindakan segera tahun ini untuk mengejar target RPJMD 2026.');

    // Fill Research
    if (researchTypes.length > 0) setValue('research.researchTypeId', researchTypes[0].id);
    setValue('research.objective', 'Menyusun model kolaborasi lintas sektor yang aplikatif untuk mempercepat penurunan stunting di tingkat desa.');
    setValue('research.researchQuestions', '1. Apa hambatan utama partisipasi warga?\n2. Bagaimana efektivitas program intervensi yang sudah ada?');
    setValue('research.scope', '5 Kecamatan Pesisir dengan angka stunting tertinggi.');
    setValue('research.expectedOutput', 'Dokumen policy brief dan roadmap strategi intervensi stunting terpadu.');
    setValue('research.expectedOutcome', 'Meningkatnya kesadaran masyarakat dan turunnya angka stunting.');
    setValue('research.successIndicators', '100% desa lokus memiliki posyandu aktif.');
    setValue('research.estimatedBudget', 150000000);
    setValue('research.estimatedDurationMonths', 3);

    // Fill KAK
    setValue('kak.dasarPemikiran', 'Perpres No 72 Tahun 2021 tentang Percepatan Penurunan Stunting.');
    setValue('kak.ruangLingkup', 'Meliputi survei lapangan, FGD dengan kader posyandu, dan analisis data.');
    setValue('kak.metodologi', 'Kombinasi kuantitatif dan kualitatif.');
    setValue('kak.output', 'Buku panduan pelaksanaan stunting.');
    setValue('kak.outcome', 'Peningkatan efektivitas alokasi dana desa untuk program stunting.');
    setValue('kak.indikatorKinerja', 'Terlaksananya survei di 25 desa dan tersusunnya 1 dokumen Roadmap.');
    setValue('kak.jadwalPelaksanaan', 'September - November 2026');
    setValue('kak.penutup', 'Demikian KAK ini dibuat sebagai pedoman pelaksanaan kajian yang terukur.');
    
    setValue('kak.rabItems', [
      { description: 'Honor Peneliti Utama', volume: 3, unit: 'OB', unitPrice: 5000000 },
      { description: 'Honor Asisten Peneliti', volume: 6, unit: 'OB', unitPrice: 3000000 }
    ]);

    toast('Data dummy berhasil diisi!', 'success');
  };

  const nextStep = async () => {
    let isValid = false;
    if (currentStep === 1) isValid = await trigger('problem');
    if (currentStep === 2) isValid = await trigger('research');

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast('Mohon lengkapi semua isian wajib di tahap ini dengan benar.', 'error');
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmitTrigger = async () => {
    const isValid = await trigger('kak');
    if (isValid) {
      setIsSubmitConfirmOpen(true);
    } else {
      toast('Mohon lengkapi draf KAK / RAB dengan benar.', 'error');
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setIsSubmitConfirmOpen(false);

    try {
      const vals = watch();
      const newProblem = await createProblem({
        ...vals.problem,
        attachments: supportFile ? [supportFile] : [],
      });
      const newResearch = await researchService.createResearch({
        ...vals.research,
        estimatedBudget: Number(vals.research.estimatedBudget),
        estimatedDurationMonths: Number(vals.research.estimatedDurationMonths),
        title: vals.problem.title,
        problemId: newProblem.id
      });
      
      // Coerce rabItems unitPrice and volume to numbers
      const kakData = {
        ...vals.kak,
        rabItems: vals.kak.rabItems.map((item) => ({
          ...item,
          volume: Number(item.volume),
          unitPrice: Number(item.unitPrice),
        })),
      };
      
      await researchService.createKak(newResearch.id, kakData);

      toast(`Usulan terpadu berhasil dikirim ke BRIDA!`, 'success');
      router.push('/opd/usulan');
    } catch (err: any) {
      toast(err.message || 'Terjadi kesalahan saat menyimpan usulan beruntun.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stepper Header Component
  const StepperHeader = () => {
    const steps = [
      { id: 1, title: 'Usulan Masalah', icon: <AlertTriangle className="h-4 w-4" /> },
      { id: 2, title: 'Usulan Penelitian', icon: <Settings className="h-4 w-4" /> },
      { id: 3, title: 'KAK & RAB', icon: <Award className="h-4 w-4" /> }
    ];

    return (
      <div className="flex items-center justify-between w-full mb-8 relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-0.5 bg-slate-200 dark:bg-slate-800 -z-10"></div>
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center bg-slate-50 dark:bg-slate-950 px-2 z-10">
            <div className={`h-10 w-10 rounded-none flex items-center justify-center border-2 ${
              currentStep === step.id 
                ? 'border-blue-600 bg-blue-600 text-white' 
                : currentStep > step.id 
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900'
            }`}>
              {step.icon}
            </div>
            <span className={`text-xs mt-2 font-semibold ${
              currentStep === step.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500'
            }`}>
              Langkah {step.id}
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {step.title}
            </span>
          </div>
        ))}
      </div>
    );
  };

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
            <h1 className="text-xl font-bold tracking-tight uppercase">Buat Usulan Terpadu</h1>
            <p className="text-xs text-slate-500">
              Isi usulan Masalah, Perencanaan, dan KAK secara berurutan dalam satu formulir.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={handleFillDummyData}
          className="text-slate-600 border-slate-300 hover:bg-slate-100 rounded-none"
        >
          <Wand2 className="h-4 w-4 mr-2" />
          <span>Isi Data Dummy</span>
        </Button>
      </div>

      <StepperHeader />

      <Card className="bg-white dark:bg-slate-900 border-slate-200 shadow-sm p-8 rounded-none">
        
        {/* STEP 1: PROBLEM */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-l-4 border-blue-600 pl-4 mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase">Tahap 1: Identifikasi Masalah</h2>
              <p className="text-sm text-slate-500">Uraikan masalah yang dihadapi oleh daerah dan urgensinya.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Input label="Judul Kajian / Masalah" placeholder="Contoh: Kajian Optimalisasi..." error={errors.problem?.title?.message} {...register('problem.title')} />
              <Controller
                name="problem.sectorId"
                control={control}
                render={({ field }) => (
                  <Select label="Sektor Kajian" options={sectors.map(s => ({ value: s.id, label: s.name }))} error={errors.problem?.sectorId?.message} value={field.value} onChange={field.onChange} />
                )}
              />
            </div>

            <Input label="Target Penyelesaian (Contoh: Desember 2026)" placeholder="Format: Bulan Tahun" error={errors.problem?.targetCompletion?.message} {...register('problem.targetCompletion')} />
            <Textarea label="Latar Belakang Masalah" placeholder="Uraikan fakta/data pendukung." error={errors.problem?.background?.message} rows={4} {...register('problem.background')} />
            <Textarea label="Fokus Masalah Utama" error={errors.problem?.mainFocus?.message} rows={3} {...register('problem.mainFocus')} />

            <div className="grid gap-6 md:grid-cols-2">
              <Textarea label="Dampak Jika Tidak Diselesaikan" error={errors.problem?.impact?.message} rows={3} {...register('problem.impact')} />
              <Textarea label="Urgensi / Alasan Mendesak" error={errors.problem?.urgency?.message} rows={3} {...register('problem.urgency')} />
            </div>

            <FileUpload label="Dokumen Pendukung Masalah (Opsional)" value={supportFile} onChange={setSupportFile} />
          </div>
        )}

        {/* STEP 2: RESEARCH */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-l-4 border-purple-600 pl-4 mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase">Tahap 2: Usulan Penelitian</h2>
              <p className="text-sm text-slate-500">Rumuskan tujuan, ruang lingkup, dan ekspektasi hasil kajian.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Controller
                name="research.researchTypeId"
                control={control}
                render={({ field }) => (
                  <Select label="Jenis Penelitian" options={researchTypes.map(r => ({ value: r.id, label: r.name }))} error={errors.research?.researchTypeId?.message} value={field.value} onChange={field.onChange} />
                )}
              />
              <Input label="Durasi Pelaksanaan (Bulan)" type="number" error={errors.research?.estimatedDurationMonths?.message} {...register('research.estimatedDurationMonths')} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Textarea label="Tujuan Penelitian" error={errors.research?.objective?.message} rows={3} {...register('research.objective')} />
              <Textarea label="Pertanyaan Penelitian (Research Questions)" error={errors.research?.researchQuestions?.message} rows={3} {...register('research.researchQuestions')} />
            </div>

            <Input label="Ruang Lingkup Kajian" error={errors.research?.scope?.message} {...register('research.scope')} />

            <div className="grid gap-6 md:grid-cols-2">
              <Textarea label="Output Yang Diharapkan (Keluaran Fisik)" error={errors.research?.expectedOutput?.message} rows={2} {...register('research.expectedOutput')} />
              <Textarea label="Outcome Yang Diharapkan (Dampak Layanan)" error={errors.research?.expectedOutcome?.message} rows={2} {...register('research.expectedOutcome')} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Input label="Indikator Keberhasilan" error={errors.research?.successIndicators?.message} {...register('research.successIndicators')} />
              <Input label="Estimasi Kebutuhan Anggaran Awal (Rp)" type="number" error={errors.research?.estimatedBudget?.message} {...register('research.estimatedBudget')} />
            </div>
          </div>
        )}

        {/* STEP 3: KAK */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-l-4 border-emerald-500 pl-4 mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase">Tahap 3: Kerangka Acuan Kerja (KAK) & RAB</h2>
              <p className="text-sm text-slate-500">Lengkapi detail administratif KAK dan rincian anggaran biaya.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Input label="Dasar Pemikiran / Regulasi" error={errors.kak?.dasarPemikiran?.message} {...register('kak.dasarPemikiran')} />
              <Textarea label="Maksud & Tujuan (Otomatis dari Penelitian)" error={errors.kak?.maksudTujuan?.message} {...register('kak.maksudTujuan')} rows={2} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Textarea label="Ruang Lingkup Kegiatan" error={errors.kak?.ruangLingkup?.message} rows={3} {...register('kak.ruangLingkup')} />
              <Textarea label="Metodologi & Pengumpulan Data" error={errors.kak?.metodologi?.message} rows={3} {...register('kak.metodologi')} />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Textarea label="Output KAK" error={errors.kak?.output?.message} rows={2} {...register('kak.output')} />
              <Textarea label="Outcome KAK" error={errors.kak?.outcome?.message} rows={2} {...register('kak.outcome')} />
              <Textarea label="Indikator Kinerja KAK" error={errors.kak?.indikatorKinerja?.message} rows={2} {...register('kak.indikatorKinerja')} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Input label="Jadwal Pelaksanaan Spesifik" placeholder="Contoh: 1 Sep - 30 Nov 2026" error={errors.kak?.jadwalPelaksanaan?.message} {...register('kak.jadwalPelaksanaan')} />
              <Input label="Penutup KAK" error={errors.kak?.penutup?.message} {...register('kak.penutup')} />
            </div>

            {/* RAB Section */}
            <div className="mt-8 border-t-2 pt-6 border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase">Rincian Anggaran Biaya (RAB)</h4>
                <Button variant="outline" size="sm" type="button" onClick={() => appendRab({ description: '', volume: 1, unit: '', unitPrice: 0 })} className="rounded-none">
                  <Plus className="h-4 w-4 mr-2" /> Tambah Item RAB
                </Button>
              </div>

              {errors.kak?.rabItems?.message && typeof errors.kak.rabItems.message === 'string' && (
                <p className="text-sm text-red-500 font-bold mb-3">{errors.kak.rabItems.message}</p>
              )}

              <div className="space-y-4">
                {rabFields.map((field, index) => (
                  <div key={field.id} className="flex flex-col sm:flex-row gap-4 items-start bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-800">
                    <div className="flex-1">
                      <Input placeholder="Deskripsi (Misal: Honor Peneliti)" {...register(`kak.rabItems.${index}.description`)} error={errors.kak?.rabItems?.[index]?.description?.message} />
                    </div>
                    <div className="w-full sm:w-24">
                      <Input type="number" placeholder="Volume" {...register(`kak.rabItems.${index}.volume`)} error={errors.kak?.rabItems?.[index]?.volume?.message} />
                    </div>
                    <div className="w-full sm:w-32">
                      <Input placeholder="Satuan (OB, Pkt)" {...register(`kak.rabItems.${index}.unit`)} error={errors.kak?.rabItems?.[index]?.unit?.message} />
                    </div>
                    <div className="w-full sm:w-48">
                      <Input type="number" placeholder="Harga Satuan (Rp)" {...register(`kak.rabItems.${index}.unitPrice`)} error={errors.kak?.rabItems?.[index]?.unitPrice?.message} />
                    </div>
                    <Button variant="ghost" size="sm" type="button" onClick={() => removeRab(index)} className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-none mt-1 sm:mt-0">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* STICKY FOOTER ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-4 px-6 md:px-12 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" size="lg" type="button" onClick={prevStep} className="rounded-none border-slate-300 font-bold">
              <ChevronLeft className="h-5 w-5 mr-2" /> Kembali
            </Button>
          )}
        </div>
        <div>
          {currentStep < totalSteps ? (
            <Button variant="primary" size="lg" type="button" onClick={nextStep} className="rounded-none bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">
              Lanjut Tahap {currentStep + 1} <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          ) : (
            <Button variant="primary" size="lg" type="button" onClick={onSubmitTrigger} isLoading={isSubmitting} className="rounded-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8">
              <Send className="h-5 w-5 mr-2" /> Ajukan Usulan
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Submit dialog */}
      <Dialog
        isOpen={isSubmitConfirmOpen}
        onClose={() => setIsSubmitConfirmOpen(false)}
        title="Kirim Usulan Terpadu ke BRIDA?"
        description="Pastikan seluruh data Masalah, Penelitian, dan KAK sudah diverifikasi. Sistem akan otomatis menyimpannya secara terpadu."
        footer={
          <>
            <Button onClick={handleFinalSubmit} variant="primary" size="sm" isLoading={isSubmitting} className="rounded-none bg-blue-600 text-white">
              {isSubmitting ? 'Memproses 3 Tahap...' : 'Ya, Ajukan Sekarang'}
            </Button>
            <Button onClick={() => setIsSubmitConfirmOpen(false)} variant="outline" size="sm" disabled={isSubmitting} className="rounded-none">
              Batal
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-none">
          <FileText className="h-8 w-8 text-blue-600 shrink-0" />
          <div className="text-sm leading-relaxed">
            <span className="font-bold">Usulan: </span>
            {problemTitle || 'Usulan Tanpa Judul'}
            <p className="mt-1 font-semibold text-slate-500">
              Sektor: {sectors.find(s => s.id === problemSectorId)?.name || '-'}
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
