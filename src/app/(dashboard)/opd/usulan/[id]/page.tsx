'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  User,
  Clock,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Play,
  Send,
  Edit,
  Save,
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';
import { STATUS_COLORS, STATUS_LABELS } from '@/constants/status';

// Validation Schema for editing draft proposal
const editProposalSchema = z.object({
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

type EditFormValues = z.infer<typeof editProposalSchema>;

export default function ProposalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('problem');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form setup for editing draft
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editProposalSchema),
  });

  const loadProposalDetails = async () => {
    try {
      const data = await proposalService.getProposalById(proposalId);
      if (data) {
        setProposal(data);
        // Initialize form fields
        reset({
          problem: data.problem,
          research: data.research || {
            judul: data.problem.judul,
            tujuan: '',
            pertanyaanPenelitian: '',
            ruangLingkup: '',
            outputDiharapkan: '',
            outcomeDiharapkan: '',
            indikator: '',
            estimasiWaktu: '',
            estimasiAnggaran: 0,
          },
          kak: data.kak || {
            identitas: `Kerangka Acuan Kerja (KAK) - Kajian ${data.problem.judul}`,
            latarBelakang: data.problem.latarBelakang,
            dasarPemikiran: '',
            maksudTujuan: '',
            ruangLingkup: '',
            metodologi: '',
            output: '',
            outcome: '',
            indikator: '',
            jadwal: '',
            anggaran: 0,
            penutup: '',
          },
        });
      }
    } catch (err) {
      console.error('Failed to load proposal detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProposalDetails();
  }, [proposalId, reset]);

  if (isLoading) {
    return <LoadingState message="Memuat detail usulan riset..." />;
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-base font-semibold">Usulan Tidak Ditemukan</h3>
        <p className="mt-2 text-sm text-slate-500">ID usulan tidak terdaftar di sistem SIM-RIDA.</p>
        <Button onClick={() => router.push('/opd/usulan')} className="mt-4" variant="outline">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  // Save changes
  const handleSaveChanges = async (formData: EditFormValues) => {
    setIsSaving(true);
    try {
      const updated = await proposalService.saveProposal({
        ...proposal,
        problem: formData.problem,
        research: formData.research,
        kak: formData.kak,
      });
      setProposal(updated);
      setIsEditMode(false);
      toast('Perubahan usulan draft berhasil disimpan.', 'success');
    } catch {
      toast('Gagal menyimpan perubahan.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit trigger
  const handleSubmissionSubmit = async () => {
    setIsSubmitting(true);
    setIsSubmitConfirmOpen(false);
    try {
      const submitted = await proposalService.submitProposal(proposal.id);
      if (submitted) {
        setProposal(submitted);
        toast(`Usulan ${proposal.id} berhasil diajukan ke BRIDA!`, 'success');
      }
    } catch {
      toast('Gagal mengajukan usulan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tabs structure
  const tabsItems = [
    { id: 'problem', label: '1. Usulan Masalah', icon: <FileText className="h-4 w-4" /> },
    { id: 'research', label: '2. Usulan Penelitian', icon: <Clock className="h-4 w-4" /> },
    { id: 'kak', label: '3. Kerangka Acuan (KAK)', icon: <CheckCircle className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/opd/usulan')}
            className="h-9 w-9 p-0 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-blue-650 dark:text-blue-400">
                {proposal.id}
              </span>
              <StatusBadge status={proposal.status} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200 mt-1 truncate max-w-sm sm:max-w-md">
              {proposal.title}
            </h1>
          </div>
        </div>

        {/* Buttons for Draft status */}
        {proposal.status === 'DRAFT' && (
          <div className="flex items-center gap-2">
            {!isEditMode ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  <span>Ubah Usulan</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsSubmitConfirmOpen(true)}
                  className="bg-blue-650 hover:bg-blue-750"
                >
                  <Send className="h-4 w-4 mr-2" />
                  <span>Kirim ke BRIDA</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditMode(false)}>
                  <X className="h-4 w-4 mr-2" />
                  <span>Batal</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmit(handleSaveChanges)}
                  isLoading={isSaving}
                  className="bg-blue-650 hover:bg-blue-750"
                >
                  <Save className="h-4 w-4 mr-2" />
                  <span>Simpan Perubahan</span>
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Visual Timeline Tracking */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 overflow-hidden">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
          Linimasa Tracking Usulan Riset
        </h3>
        
        {/* Responsive Timeline Stepper */}
        <div className="relative flex flex-col md:flex-row md:justify-between gap-6 md:gap-4 md:items-center">
          {/* Connector bar for desktop */}
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-250 dark:bg-slate-800 hidden md:block z-0" />

          {proposal.timeline.map((step, idx) => {
            const isDone = step.isCompleted;
            const isActive = proposal.status === step.status || (!isDone && idx === proposal.timeline.findIndex(t => !t.isCompleted));
            
            return (
              <div key={idx} className="relative flex items-start md:flex-col md:items-center gap-3 md:gap-2 z-10 md:flex-1">
                {/* Visual Node */}
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-between border-2 transition-all ${
                    isDone
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isActive
                      ? 'bg-blue-600 border-blue-600 text-white animate-pulse'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle className="h-5 w-5 mx-auto" />
                  ) : isActive ? (
                    <Clock className="h-5 w-5 mx-auto" />
                  ) : (
                    <HelpCircle className="h-5 w-5 mx-auto" />
                  )}
                </div>

                {/* Text Description */}
                <div className="md:text-center">
                  <p className={`text-xs font-bold ${isActive ? 'text-blue-600 dark:text-blue-450' : 'text-slate-800 dark:text-slate-200'}`}>
                    {step.label}
                  </p>
                  <div className="flex flex-wrap md:justify-center items-center gap-1.5 text-3xs text-slate-500 mt-0.5">
                    {step.date && <span>{step.date}</span>}
                    {step.date && step.actor && <span>•</span>}
                    {step.actor && <span>{step.actor}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Detail Tabs bar */}
      <Tabs tabs={tabsItems} activeTab={activeTab} onChange={setActiveTab} variant="pill" />

      {/* Main Details Forms */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6">
        <form onSubmit={handleSubmit(handleSaveChanges)}>
          {/* TAB 1: USULAN MASALAH */}
          {activeTab === 'problem' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2 dark:border-slate-800">
                1. Identifikasi Masalah Daerah
              </h3>

              {!isEditMode ? (
                // View Mode
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Judul Masalah</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{proposal.problem.judul}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Bidang Kajian</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{proposal.problem.bidang}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">OPD Pengusul</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{proposal.problem.opd}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Target Penyelesaian</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{proposal.problem.targetPenyelesaian}</p>
                  </div>
                  <div className="sm:col-span-2 p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Latar Belakang</p>
                    <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 whitespace-pre-line leading-relaxed">{proposal.problem.latarBelakang}</p>
                  </div>
                  <div className="sm:col-span-2 p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Fokus Masalah Utama</p>
                    <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 whitespace-pre-line leading-relaxed">{proposal.problem.masalahUtama}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Dampak Jika Dibiarkan</p>
                    <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 whitespace-pre-line leading-relaxed">{proposal.problem.dampak}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Urgensi</p>
                    <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 whitespace-pre-line leading-relaxed">{proposal.problem.urgensi}</p>
                  </div>
                  {proposal.problem.dokumenPendukung && (
                    <div className="sm:col-span-2 p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        📄 {proposal.problem.dokumenPendukung}
                      </span>
                      <Button variant="ghost" size="sm" className="h-7 text-3xs text-blue-600">
                        Unduh
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                // Edit Mode
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Judul Usulan Masalah"
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
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.problem?.bidang?.message}
                        />
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="OPD Pengusul"
                      error={errors.problem?.opd?.message}
                      {...register('problem.opd')}
                    />

                    <Input
                      label="Target Penyelesaian"
                      error={errors.problem?.targetPenyelesaian?.message}
                      {...register('problem.targetPenyelesaian')}
                    />
                  </div>

                  <Textarea
                    label="Latar Belakang Masalah"
                    error={errors.problem?.latarBelakang?.message}
                    rows={4}
                    {...register('problem.latarBelakang')}
                  />

                  <Textarea
                    label="Fokus Masalah Utama"
                    error={errors.problem?.masalahUtama?.message}
                    rows={3}
                    {...register('problem.masalahUtama')}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <Textarea
                      label="Dampak"
                      error={errors.problem?.dampak?.message}
                      rows={3}
                      {...register('problem.dampak')}
                    />

                    <Textarea
                      label="Urgensi"
                      error={errors.problem?.urgensi?.message}
                      rows={3}
                      {...register('problem.urgensi')}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RESEARCH DETAILS */}
          {activeTab === 'research' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2 dark:border-slate-800">
                2. Rencana & Kriteria Kajian Penelitian
              </h3>

              {!proposal.research && !isEditMode ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Rencana penelitian belum disusun. Edit usulan untuk melengkapi.
                </div>
              ) : !isEditMode ? (
                // View Mode
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Judul Penelitian</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{proposal.research?.judul}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Tujuan Utama</p>
                    <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 whitespace-pre-line">{proposal.research?.tujuan}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Pertanyaan Penelitian</p>
                    <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 whitespace-pre-line">{proposal.research?.pertanyaanPenelitian}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Ruang Lingkup</p>
                    <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">{proposal.research?.ruangLingkup}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Estimasi Waktu</p>
                    <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">{proposal.research?.estimasiWaktu}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Output (Keluaran)</p>
                    <p className="text-xs text-slate-700 dark:text-slate-350 mt-1">{proposal.research?.outputDiharapkan}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Outcome (Dampak)</p>
                    <p className="text-xs text-slate-700 dark:text-slate-350 mt-1">{proposal.research?.outcomeDiharapkan}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Indikator Keberhasilan</p>
                    <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">{proposal.research?.indikator}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Estimasi Anggaran</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">Rp {Number(proposal.research?.estimasiAnggaran).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <div className="space-y-4">
                  <Input
                    label="Judul Penelitian"
                    error={errors.research?.judul?.message}
                    {...register('research.judul')}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <Textarea
                      label="Tujuan"
                      error={errors.research?.tujuan?.message}
                      rows={3}
                      {...register('research.tujuan')}
                    />

                    <Textarea
                      label="Pertanyaan Penelitian"
                      error={errors.research?.pertanyaanPenelitian?.message}
                      rows={3}
                      {...register('research.pertanyaanPenelitian')}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Ruang Lingkup"
                      error={errors.research?.ruangLingkup?.message}
                      {...register('research.ruangLingkup')}
                    />

                    <Input
                      label="Estimasi Waktu"
                      error={errors.research?.estimasiWaktu?.message}
                      {...register('research.estimasiWaktu')}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Textarea
                      label="Output Diharapkan"
                      error={errors.research?.outputDiharapkan?.message}
                      rows={2}
                      {...register('research.outputDiharapkan')}
                    />

                    <Textarea
                      label="Outcome Diharapkan"
                      error={errors.research?.outcomeDiharapkan?.message}
                      rows={2}
                      {...register('research.outcomeDiharapkan')}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Indikator Kinerja"
                      error={errors.research?.indikator?.message}
                      {...register('research.indikator')}
                    />

                    <Input
                      label="Estimasi Anggaran"
                      type="number"
                      error={errors.research?.estimasiAnggaran?.message}
                      {...register('research.estimasiAnggaran')}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: KAK / TOR */}
          {activeTab === 'kak' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2 dark:border-slate-800">
                3. Kerangka Acuan Kerja (KAK) / TOR
              </h3>

              {!proposal.kak && !isEditMode ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  KAK belum disusun. Edit usulan untuk menyusun KAK.
                </div>
              ) : !isEditMode ? (
                // View Mode
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Identitas KAK</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{proposal.kak?.identitas}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Dasar Pemikiran</p>
                    <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 whitespace-pre-line">{proposal.kak?.dasarPemikiran}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider font-bold">Maksud & Tujuan</p>
                    <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 whitespace-pre-line">{proposal.kak?.maksudTujuan}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Metodologi Riset KAK</p>
                    <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 whitespace-pre-line">{proposal.kak?.metodologi}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Jadwal</p>
                    <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">{proposal.kak?.jadwal}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Alokasi Anggaran KAK</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">Rp {Number(proposal.kak?.anggaran).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="sm:col-span-2 p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800">
                    <p className="text-3xs text-slate-450 font-bold uppercase tracking-wider">Penutup KAK</p>
                    <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 leading-relaxed">{proposal.kak?.penutup}</p>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Identitas KAK"
                      error={errors.kak?.identitas?.message}
                      {...register('kak.identitas')}
                    />

                    <Input
                      label="Dasar Pemikiran"
                      error={errors.kak?.dasarPemikiran?.message}
                      {...register('kak.dasarPemikiran')}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Textarea
                      label="Latar Belakang"
                      error={errors.kak?.latarBelakang?.message}
                      rows={3}
                      {...register('kak.latarBelakang')}
                    />

                    <Textarea
                      label="Maksud & Tujuan"
                      error={errors.kak?.maksudTujuan?.message}
                      rows={3}
                      {...register('kak.maksudTujuan')}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Textarea
                      label="Ruang Lingkup"
                      error={errors.kak?.ruangLingkup?.message}
                      rows={3}
                      {...register('kak.ruangLingkup')}
                    />

                    <Textarea
                      label="Metodologi"
                      error={errors.kak?.metodologi?.message}
                      rows={3}
                      {...register('kak.metodologi')}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Textarea
                      label="Output KAK"
                      error={errors.kak?.output?.message}
                      rows={2}
                      {...register('kak.output')}
                    />

                    <Textarea
                      label="Outcome KAK"
                      error={errors.kak?.outcome?.message}
                      rows={2}
                      {...register('kak.outcome')}
                    />

                    <Textarea
                      label="Indikator KAK"
                      error={errors.kak?.indikator?.message}
                      rows={2}
                      {...register('kak.indikator')}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Input
                      label="Jadwal Pelaksanaan"
                      error={errors.kak?.jadwal?.message}
                      {...register('kak.jadwal')}
                    />

                    <Input
                      label="Anggaran KAK"
                      type="number"
                      error={errors.kak?.anggaran?.message}
                      {...register('kak.anggaran')}
                    />

                    <Input
                      label="Penutup KAK"
                      error={errors.kak?.penutup?.message}
                      {...register('kak.penutup')}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </Card>

      {/* Confirmation Submit dialog */}
      <Dialog
        isOpen={isSubmitConfirmOpen}
        onClose={() => setIsSubmitConfirmOpen(false)}
        title="Ajukan Usulan ke BRIDA?"
        description="Setelah diajukan, usulan ini tidak dapat diedit sementara BRIDA melakukan review administratif."
        footer={
          <>
            <Button onClick={handleSubmissionSubmit} variant="primary" size="sm" isLoading={isSubmitting}>
              Kirim Sekarang
            </Button>
            <Button onClick={() => setIsSubmitConfirmOpen(false)} variant="outline" size="sm">
              Batal
            </Button>
          </>
        }
      >
        <div className="p-3 bg-blue-50 text-blue-900 border rounded-lg border-blue-200 dark:bg-blue-950/20 dark:text-blue-200 dark:border-slate-800 text-xs font-semibold">
          Kirim Usulan Riset: <span className="font-bold">{proposal.title}</span>
        </div>
      </Dialog>
    </div>
  );
}
