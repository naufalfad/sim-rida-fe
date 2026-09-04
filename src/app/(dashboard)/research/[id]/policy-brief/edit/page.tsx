'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReportStore } from '@/store/useReportStore';
import { useResearchStore } from '@/store/useResearchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  FileText
} from 'lucide-react';

export default function EditPolicyBriefPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { researchRecords } = useResearchStore();
  const { getReport, getFindings, getPolicyBrief, savePolicyBrief } = useReportStore();

  const id = params?.id || '';
  const isBrida = user?.role === 'BRIDA';

  // Access check
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

  // Redirect if approved (locked state)
  useEffect(() => {
    if (brief && brief.status === 'APPROVED') {
      toast('Policy Brief telah disetujui dan terkunci (Read-Only).', 'warning');
      router.replace(`/research/${id}/report`);
    }
  }, [brief, id, router, toast]);

  // Inputs state
  const [title, setTitle] = useState('');
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [policyContext, setPolicyContext] = useState('');
  const [keyProblem, setKeyProblem] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [policyImplication, setPolicyImplication] = useState('');

  // Selected findings checklist (Section 22)
  const [selectedFindingIds, setSelectedFindingIds] = useState<string[]>([]);

  // Sync state with store on mount
  useEffect(() => {
    if (brief) {
      setTitle(brief.title || '');
      setExecutiveSummary(brief.executiveSummary || report.executiveSummary || '');
      setPolicyContext(brief.policyContext || 'Kondisi pelayanan publik kesehatan daerah membutuhkan standardisasi sistem informasi medis terpadu.');
      setKeyProblem(brief.keyProblem || '');
      setConclusion(brief.conclusion || report.conclusion || '');
      setPolicyImplication(brief.policyImplication || 'Temuan penelitian menunjukkan perlunya peningkatan regulasi standardisasi dan integrasi data secara terpusat.');
      setSelectedFindingIds(brief.keyFindings || []);
    }
  }, [brief, report]);

  // Compute selected findings details & evidence (Section 21)
  const selectedFindings = useMemo(() => {
    return findings.filter(f => selectedFindingIds.includes(f.id));
  }, [findings, selectedFindingIds]);

  const policyEvidences = useMemo(() => {
    const list: string[] = [];
    selectedFindings.forEach(f => {
      if (f.evidence && !list.includes(f.evidence)) {
        list.push(f.evidence);
      }
    });
    return list;
  }, [selectedFindings]);

  const handleToggleFinding = (fId: string) => {
    let nextIds = [...selectedFindingIds];
    if (nextIds.includes(fId)) {
      nextIds = nextIds.filter(id => id !== fId);
    } else {
      nextIds.push(fId);
    }
    setSelectedFindingIds(nextIds);

    // Dynamic problem content generator based on selected findings (Section 20)
    const selected = findings.filter(f => nextIds.includes(f.id));
    if (selected.length > 0) {
      const summaryText = selected.map(s => `- ${s.title}: ${s.description}`).join('\n');
      setKeyProblem(summaryText);
    } else {
      setKeyProblem('');
    }
  };

  const handleSave = () => {
    if (!title.trim() || !executiveSummary.trim() || !policyContext.trim() || !keyProblem.trim() || !conclusion.trim() || !policyImplication.trim()) {
      toast('Semua kolom bertanda bintang (*) wajib diisi.', 'warning');
      return;
    }

    if (selectedFindingIds.length === 0) {
      toast('Pilih minimal 1 temuan riset untuk ditautkan ke Policy Brief.', 'warning');
      return;
    }

    const payload = {
      title,
      executiveSummary,
      policyContext,
      keyProblem,
      keyFindings: selectedFindingIds,
      conclusion,
      policyImplication,
    };

    savePolicyBrief(id, payload, user?.name || 'BRIDA Litbang');
    toast('Policy Brief berhasil disimpan.', 'success');
    router.push(`/research/${id}/report`);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push(`/research/${id}/report`)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Overview</span>
        </button>
      </div>

      <PageHeader
        title="Penyusunan Policy Brief"
        description={`Sunting draf ringkasan kebijakan strategis daerah untuk riset: "${record?.title}"`}
        action={
          isBrida && (
            <button
              onClick={handleSave}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1 shadow"
            >
              <Save className="h-4 w-4" />
              <span>Save Policy Brief</span>
            </button>
          )
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* ================= LEFT COLUMN: Form input policy brief ================= */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4 text-xs font-semibold">
              
              <div className="border-b pb-2 flex justify-between items-baseline">
                <h3 className="font-bold text-gray-850 uppercase text-xs">Form Policy Brief</h3>
                <span className="text-[10px] text-gray-455 italic">Isi wajib (*)</span>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Judul Policy Brief *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masukkan judul rekomendasi policy brief daerah..."
                  className="block w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 focus:border-indigo-600 font-semibold"
                />
              </div>

              {/* Executive Summary */}
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Rangkuman Ringkas (Executive Summary) *</label>
                <textarea
                  value={executiveSummary}
                  onChange={(e) => setExecutiveSummary(e.target.value)}
                  placeholder="Rangkuman ringkas latar belakang, data, serta implikasi publik..."
                  rows={4}
                  className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-indigo-600 leading-relaxed font-semibold"
                />
              </div>

              {/* Policy Context */}
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Konteks Kebijakan (Policy Context) *</label>
                <textarea
                  value={policyContext}
                  onChange={(e) => setPolicyContext(e.target.value)}
                  placeholder="Sebutkan latar regulasi atau target rencana strategis pelayanan..."
                  rows={3}
                  className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-indigo-600 leading-relaxed font-semibold"
                />
              </div>

              {/* Key Problem (Editable but autofilled) */}
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Masalah Utama (Key Problem) *</label>
                <textarea
                  value={keyProblem}
                  onChange={(e) => setKeyProblem(e.target.value)}
                  placeholder="Sebutkan kendala operasional berdasarkan temuan terpilih..."
                  rows={4}
                  className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-indigo-600 leading-relaxed font-semibold"
                />
              </div>

              {/* Conclusion */}
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Kesimpulan Ringkas *</label>
                <textarea
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  placeholder="Kesimpulan akhir yang diambil..."
                  rows={3}
                  className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-indigo-600 leading-relaxed font-semibold"
                />
              </div>

              {/* Policy Implication */}
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Implikasi Kebijakan (Policy Implication) *</label>
                <textarea
                  value={policyImplication}
                  onChange={(e) => setPolicyImplication(e.target.value)}
                  placeholder="Contoh: Hambatan integrasi data jika standardisasi tertunda..."
                  rows={3}
                  className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-indigo-600 leading-relaxed font-semibold"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/10 border border-amber-250 rounded text-amber-750 text-[10px] flex items-start gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Perhatian:</strong> Jangan merumuskan bagian Rekomendasi kepada OPD di sini (misal: "Dinas Pendidikan harus membeli AC"). Sebutkan implikasi kebijakan publik makro secara makro saja. Rekomendasi teknis dilarang dalam FASE 8.
                </span>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  onClick={() => router.push(`/research/${id}/report`)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-55 text-gray-705 rounded text-xs font-semibold bg-white"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Policy Brief</span>
                </button>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* ================= RIGHT COLUMN: Selected findings mapping & Evidence reference cards ================= */}
        <div className="space-y-6">
          
          {/* Findings Checklist mapping (Section 22) */}
          <Card>
            <CardContent className="p-6 space-y-4 text-xs font-semibold select-none">
              <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider">
                Select Findings (Tautkan Temuan Riset)
              </span>
              
              {findings.length === 0 ? (
                <span className="text-[10px] text-gray-450 italic">Tidak ada temuan riset terdaftar. Selesaikan Laporan Findings terlebih dahulu.</span>
              ) : (
                <div className="space-y-2 border rounded p-3 bg-slate-50/50">
                  {findings.map((f) => {
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
                          <span className="font-bold text-gray-800 block">{f.title}</span>
                          <span className="text-[8px] text-gray-400 font-semibold">{f.severity}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reference Cards Evidence (Section 21) */}
          <Card>
            <CardContent className="p-6 space-y-4 text-xs font-semibold select-none">
              <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider">
                Policy Evidence (Dokumen Pembuktian)
              </span>

              {policyEvidences.length === 0 ? (
                <span className="text-[10px] text-gray-450 italic block text-center py-2">Pilih temuan di atas untuk memunculkan bukti dokumen.</span>
              ) : (
                <div className="space-y-2">
                  {policyEvidences.map((ev, idx) => (
                    <div key={idx} className="p-2 border rounded bg-indigo-50/20 flex items-center gap-1.5 text-3xs">
                      <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span className="font-bold text-gray-700 truncate max-w-40 block">{ev}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
