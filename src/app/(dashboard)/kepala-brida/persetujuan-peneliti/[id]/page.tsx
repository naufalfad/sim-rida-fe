'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  XCircle,
  User,
  Star,
  BookOpen,
  Briefcase,
  AlertTriangle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { LoadingState } from '@/components/ui/loading-state';
import { proposalService } from '@/lib/api/proposals';
import { Proposal } from '@/types/proposals';
import { Researcher } from '@/types/brida';

export default function PersetujuanPenelitiDetailPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;
  const { toast } = useToast();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [researcher, setResearcher] = useState<Researcher | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const propData = await proposalService.getProposalById(proposalId);
        setProposal(propData);
        if (propData && propData.researcherId) {
          const resData = await proposalService.getResearcherById(propData.researcherId);
          setResearcher(resData);
        }
      } catch (err) {
        console.error('Failed to load researcher approval details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [proposalId]);

  if (isLoading) {
    return <LoadingState message="Memuat berkas penetapan mitra riset..." />;
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-base font-semibold">Dokumen Tidak Ditemukan</h3>
        <Button onClick={() => router.push('/kepala-brida/persetujuan-peneliti')} className="mt-4" variant="outline">
          Kembali
        </Button>
      </div>
    );
  }

  const handleDecision = async (action: 'APPROVE' | 'RETURN') => {
    if (!comment) {
      toast('Mohon berikan catatan keputusan/justifikasi Anda.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await proposalService.approveResearcher(proposal.id, comment, action);
      if (updated) {
        if (action === 'APPROVE') {
          toast(`Penetapan Mitra Peneliti untuk ${proposal.id} berhasil disetujui & disahkan!`, 'success');
        } else {
          toast(`Usulan penetapan dikembalikan ke BRIDA untuk diajukan ulang.`, 'success');
        }
        router.push('/kepala-brida/persetujuan-peneliti');
      }
    } catch {
      toast('Gagal memproses keputusan penunjukan mitra.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/kepala-brida/persetujuan-peneliti')}
          className="h-9 w-9 p-0 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <span className="font-mono text-2xs font-bold text-slate-450">
            Persetujuan Peneliti / {proposal.id}
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200 mt-0.5 truncate max-w-sm sm:max-w-md">
            {proposal.title}
          </h1>
        </div>
      </div>

      {/* Grid workspace */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: researcher details card */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 dark:border-slate-850">
              Profil Calon Mitra Peneliti
            </h3>

            {researcher ? (
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-purple-50 text-purple-650 flex items-center justify-center border border-purple-100 dark:bg-purple-950/20 dark:text-purple-400">
                    <User className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-250">{researcher.name}</h4>
                    <p className="text-xs text-slate-500">{researcher.institution}</p>
                    
                    <div className="flex items-center gap-2 mt-1.5 text-2xs">
                      <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span>Rating Kinerja: 4.8 / 5.0</span>
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-450">
                        {researcher.previousResearch.length} Proyek Terdahulu
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 text-xs border-t pt-4 dark:border-slate-850">
                  <div>
                    <p className="font-bold text-slate-550 flex items-center gap-1">
                      <BookOpen className="h-4 w-4 text-purple-500" />
                      <span>Fokus Keahlian (Expertise)</span>
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 mt-2">
                      {researcher.expertise}
                    </p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-550 flex items-center gap-1">
                      <Briefcase className="h-4 w-4 text-purple-500" />
                      <span>Kontak & Korespondensi</span>
                    </p>
                    <p className="text-slate-655 mt-2 font-mono text-2xs">
                      {researcher.name.toLowerCase().replace(/[^a-z]/g, '')}@univ.ac.id<br />
                      +62 812-4567-8901
                    </p>
                  </div>
                </div>

                {/* Previous Research List */}
                <div className="border-t pt-4 dark:border-slate-850">
                  <p className="font-bold text-slate-550 text-xs mb-2">Riwayat Penelitian Terkait</p>
                  <div className="space-y-2">
                    {researcher.previousResearch.map((res, idx) => (
                      <div key={idx} className="p-2 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-850 text-2xs">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{res.title}</p>
                        <p className="text-slate-450 mt-0.5">Tahun: {res.year} | Peran: {res.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Identitas peneliti tidak termuat.</p>
            )}
          </Card>
        </div>

        {/* Right: Decision Form */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2 dark:border-slate-850">
              Form Keputusan Pengesahan Mitra
            </h3>

            <Textarea
              label="Catatan Persetujuan / Revisi"
              placeholder="Berikan arahan kontrak, evaluasi rekam jejak peneliti, atau alasan pengembalian..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />

            <div className="space-y-2 border-t pt-4 dark:border-slate-850">
              <Button
                onClick={() => handleDecision('APPROVE')}
                isLoading={isSaving}
                className="w-full bg-purple-650 hover:bg-purple-750 text-white flex items-center justify-center gap-1.5 shadow"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Sahkan Mitra Peneliti</span>
              </Button>

              <Button
                onClick={() => handleDecision('RETURN')}
                isLoading={isSaving}
                variant="outline"
                className="w-full text-2xs text-amber-700 border-amber-250 hover:bg-amber-50"
              >
                Kembalikan Penunjukan
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
