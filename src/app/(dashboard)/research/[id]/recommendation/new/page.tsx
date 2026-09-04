'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRecommendationStore } from '@/store/useRecommendationStore';
import { useReportStore } from '@/store/useReportStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { MOCK_OPDS } from '@/mock/opd';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  FileText
} from 'lucide-react';

export default function NewRecommendationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { researchRecords } = useResearchStore();
  const { getReport, getFindings, getPolicyBrief } = useReportStore();
  const { getRecommendation, saveRecommendation } = useRecommendationStore();

  const id = params?.id || '';

  // Access checks
  useEffect(() => {
    if (user && user.role !== 'BRIDA') {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  // Find target research record
  const record = useMemo(() => {
    return researchRecords.find((r) => r.id === id);
  }, [researchRecords, id]);

  const report = getReport(id);
  const findings = getFindings(id);
  const brief = getPolicyBrief(id);
  const rec = getRecommendation(id);

  // Redirect if locked or prerequisites not met
  useEffect(() => {
    if (report && report.status !== 'APPROVED') {
      toast('Laporan hasil riset belum disetujui.', 'warning');
      router.replace(`/research/${id}`);
    }
  }, [report, id, router, toast]);

  // Form States
  const [title, setTitle] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [recommendationDescription, setRecommendationDescription] = useState('BRIDA merekomendasikan pengembangan sistem informasi terintegrasi untuk meningkatkan efektivitas pengelolaan data antar perangkat daerah.');
  const [expectedPolicyImpact, setExpectedPolicyImpact] = useState('Peningkatan integrasi data dan percepatan proses pengambilan keputusan.');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'STRATEGIC'>('MEDIUM');
  const [primaryRecipientId, setPrimaryRecipientId] = useState('');
  const [supportingRecipientIds, setSupportingRecipientIds] = useState<string[]>([]);

  // Research Basis checks (Section 10)
  const [basisReport, setBasisReport] = useState(true);
  const [basisBrief, setBasisBrief] = useState(true);
  const [basisFindings, setBasisFindings] = useState(true);
  const [basisConclusion, setBasisConclusion] = useState(true);

  // Selected findings mapping checklist
  const [selectedFindingIds, setSelectedFindingIds] = useState<string[]>([]);

  const handleToggleFinding = (fId: string) => {
    let nextIds = [...selectedFindingIds];
    if (nextIds.includes(fId)) {
      nextIds = nextIds.filter(id => id !== fId);
    } else {
      nextIds.push(fId);
    }
    setSelectedFindingIds(nextIds);

    // Dynamic problem statement autofill from selected findings (Section 9)
    const selected = findings.filter(f => nextIds.includes(f.id));
    if (selected.length > 0) {
      const summaryText = selected.map(s => `• ${s.title} (${s.severity}): ${s.description}\nEvidence: ${s.evidence}`).join('\n\n');
      setProblemStatement(summaryText);
    } else {
      setProblemStatement('');
    }
  };

  const handleToggleSupportingOpd = (opdId: string) => {
    if (opdId === primaryRecipientId) return; // cannot be both

    let nextIds = [...supportingRecipientIds];
    if (nextIds.includes(opdId)) {
      nextIds = nextIds.filter(id => id !== opdId);
    } else {
      nextIds.push(opdId);
    }
    setSupportingRecipientIds(nextIds);
  };

  const handlePrimaryOpdChange = (opdId: string) => {
    setPrimaryRecipientId(opdId);
    // remove from supportings if present
    setSupportingRecipientIds(supportingRecipientIds.filter(id => id !== opdId));
  };

  const handleSave = () => {
    if (!title.trim() || !problemStatement.trim() || !recommendationDescription.trim() || !expectedPolicyImpact.trim() || !primaryRecipientId) {
      toast('Semua kolom form bertanda bintang (*) wajib diisi.', 'warning');
      return;
    }

    if (selectedFindingIds.length === 0) {
      toast('Pilih minimal 1 Temuan Riset (Research Finding) sebagai dasar usulan.', 'warning');
      return;
    }

    // Map researchBasis string[]
    const basisList: string[] = [];
    if (basisReport) basisList.push('Research Report');
    if (basisBrief) basisList.push('Policy Brief');
    if (basisFindings) basisList.push('Findings');
    if (basisConclusion) basisList.push('Conclusion');

    const payload = {
      title,
      problemStatement,
      researchBasis: basisList,
      findingIds: selectedFindingIds,
      recommendationDescription,
      expectedPolicyImpact,
      priority,
      primaryRecipientId,
      supportingRecipientIds,
    };

    saveRecommendation(id, payload, user?.name || 'BRIDA Litbang');
    toast('Draf rekomendasi berhasil disimpan.', 'success');
    router.push(`/research/${id}/recommendation`);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push(`/research/${id}/recommendation`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </button>
      </div>

      <PageHeader
        title="Create Recommendation"
        description={`Penyusunan rekomendasi BRIDA baru untuk Dinas Daerah terkait riset: "${record?.title}"`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* ================= LEFT COLUMN: Main Form inputs ================= */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4 text-xs font-semibold">
              
              <div className="border-b pb-2 flex justify-between items-baseline">
                <h3 className="font-bold text-gray-850 uppercase text-xs">Form Data Rekomendasi</h3>
                <span className="text-[10px] text-gray-450 italic">Isi form wajib (*)</span>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Judul Rekomendasi *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Rekomendasi Penyesuaian Lisensi Terpusat SIMPUS..."
                  className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 focus:border-indigo-650"
                />
              </div>

              {/* Problem Statement (editable but prefilled) */}
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Fokus Masalah (Problem Statement) *</label>
                <textarea
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  placeholder="Deskripsikan anomali atau kegagalan sistem yang melandasi pentingnya rekomendasi ini..."
                  rows={4}
                  className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-indigo-650 leading-relaxed font-semibold"
                />
              </div>

              {/* Research Basis checks (Section 10) */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Dasar Referensi (Research Basis) *</label>
                <div className="grid gap-2 sm:grid-cols-4 bg-slate-50/50 p-2 border rounded text-3xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={basisReport} onChange={() => setBasisReport(!basisReport)} className="rounded text-indigo-600" />
                    <span>Report Doc</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={basisBrief} onChange={() => setBasisBrief(!basisBrief)} className="rounded text-indigo-600" />
                    <span>Policy Brief</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={basisFindings} onChange={() => setBasisFindings(!basisFindings)} className="rounded text-indigo-600" />
                    <span>Findings</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={basisConclusion} onChange={() => setBasisConclusion(!basisConclusion)} className="rounded text-indigo-600" />
                    <span>Conclusion</span>
                  </label>
                </div>
              </div>

              {/* Recommendation Description (Section 11) */}
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Deskripsi Rekomendasi (Recommendation) *</label>
                <textarea
                  value={recommendationDescription}
                  onChange={(e) => setRecommendationDescription(e.target.value)}
                  placeholder="Detail usulan langkah strategis dinas..."
                  rows={5}
                  className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-indigo-650 leading-relaxed font-semibold"
                />
              </div>

              {/* Expected Policy Impact */}
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Dampak yang Diharapkan (Expected Policy Impact) *</label>
                <textarea
                  value={expectedPolicyImpact}
                  onChange={(e) => setExpectedPolicyImpact(e.target.value)}
                  placeholder="Sebutkan dampak reformasi sistem atau peningkatan efisiensi..."
                  rows={2}
                  className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-indigo-650 leading-relaxed font-semibold"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  onClick={() => router.push(`/research/${id}/recommendation`)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-55 text-gray-705 rounded text-xs font-semibold bg-white"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Recommendation</span>
                </button>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* ================= RIGHT COLUMN: Findings selector & Recipient OPDs checklists ================= */}
        <div className="space-y-6">
          
          {/* Recipient OPD selector (Section 14 & 16) */}
          <Card>
            <CardContent className="p-6 space-y-4 text-xs font-semibold select-none">
              <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider">
                OPD Penerima (Recipient OPDs)
              </span>

              {/* Primary OPD select dropdown */}
              <div className="space-y-1.5">
                <label className="block text-3xs font-bold text-gray-650 uppercase">Penerima Utama (Primary Recipient) *</label>
                <select
                  value={primaryRecipientId}
                  onChange={(e) => handlePrimaryOpdChange(e.target.value)}
                  className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-905"
                >
                  <option value="">-- Pilih OPD --</option>
                  {MOCK_OPDS.map(opd => (
                    <option key={opd.id} value={opd.id}>{opd.shortName} - {opd.name}</option>
                  ))}
                </select>
              </div>

              {/* Supporting OPD checklists */}
              <div className="space-y-1.5 pt-2 border-t">
                <label className="block text-3xs font-bold text-gray-655 uppercase">Penerima Pendukung (Supportings)</label>
                <div className="space-y-1.5 border rounded p-2.5 bg-slate-50/50 max-h-36 overflow-y-auto">
                  {MOCK_OPDS.map(opd => {
                    const isPrimary = opd.id === primaryRecipientId;
                    const isChecked = supportingRecipientIds.includes(opd.id);
                    return (
                      <label key={opd.id} className={`flex items-center gap-2 py-1 cursor-pointer text-3xs ${
                        isPrimary ? 'opacity-40 cursor-not-allowed' : ''
                      }`}>
                        <input
                          type="checkbox"
                          checked={isChecked && !isPrimary}
                          disabled={isPrimary}
                          onChange={() => handleToggleSupportingOpd(opd.id)}
                          className="rounded text-indigo-600 h-3.5 w-3.5 border-gray-300"
                        />
                        <span className="font-bold text-gray-700">{opd.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Finding select checkbox maps (Section 9) */}
          <Card>
            <CardContent className="p-6 space-y-4 text-xs font-semibold select-none">
              <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider">
                Select Findings (Temuan Dasar) *
              </span>

              {findings.length === 0 ? (
                <span className="text-[10px] text-gray-450 italic">Tidak ada temuan terdaftar di Laporan Hasil.</span>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto border rounded p-2.5 bg-slate-50/50">
                  {findings.map(f => {
                    const isChecked = selectedFindingIds.includes(f.id);
                    return (
                      <label key={f.id} className="flex items-start gap-2 py-1.5 cursor-pointer text-3xs hover:bg-slate-100/50 px-1 rounded">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleFinding(f.id)}
                          className="mt-0.5 h-3.5 w-3.5 rounded text-indigo-600 border-gray-300"
                        />
                        <div>
                          <span className="font-bold text-gray-800 block leading-tight">{f.title}</span>
                          <span className="text-[8px] text-gray-400 font-semibold">{f.severity}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
