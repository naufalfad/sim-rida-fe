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
  Layers
} from 'lucide-react';

export default function ConclusionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { researchRecords } = useResearchStore();
  const { getReport, saveReport } = useReportStore();

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

  // Redirect if approved (locked state)
  useEffect(() => {
    if (report && report.status === 'APPROVED') {
      toast('Laporan telah disetujui dan terkunci (Read-Only).', 'warning');
      router.replace(`/research/${id}/report`);
    }
  }, [report, id, router, toast]);

  // Input states
  const [conclusion, setConclusion] = useState('');
  const [appendices, setAppendices] = useState(''); // using it to store limitations or details in mock state

  // Since we want specific fields (Main Conclusion, Key Lessons, Data Limitation, Methodological Limitation, Implementation Limitation):
  // We can serialize these details or keep them in report conclusion string formatted / JSON if we want, or just simple state textareas!
  // To avoid changing the store model schema (since reports.ts has a conclusion string, and we need specific fields),
  // we can parse/stringify or simply concatenate them, or we can add them as separate sub-fields in our text area.
  // Actually, we can just save them to individual sections in report. Let's look at `reports.ts`:
  // It has: `conclusion: string`. It does not have keyLessons, dataLimitation, etc.
  // So we can store them as JSON string in `conclusion` or simply save a combined formatted text inside `conclusion` field!
  // Formatting as JSON string or parsed blocks is exceptionally smart and clean! Let's do that, or we can save them as a clean structured text.
  // Let's parse/stringify a simple JSON inside `conclusion` to preserve separate edits, with a fallback to raw string!
  const parsedConclusion = useMemo(() => {
    try {
      if (report.conclusion.startsWith('{')) {
        const obj = JSON.parse(report.conclusion);
        return {
          mainConclusion: obj.mainConclusion || '',
          keyLessons: obj.keyLessons || '',
          dataLimitation: obj.dataLimitation || '',
          methodologicalLimitation: obj.methodologicalLimitation || '',
          implementationLimitation: obj.implementationLimitation || '',
          otherLimitation: obj.otherLimitation || '',
        };
      }
    } catch (e) {
      // fallback
    }
    return {
      mainConclusion: report.conclusion || '',
      keyLessons: '',
      dataLimitation: '',
      methodologicalLimitation: '',
      implementationLimitation: '',
      otherLimitation: '',
    };
  }, [report.conclusion]);

  const [mainConclusion, setMainConclusion] = useState('');
  const [keyLessons, setKeyLessons] = useState('');
  const [dataLimitation, setDataLimitation] = useState('');
  const [methodologicalLimitation, setMethodologicalLimitation] = useState('');
  const [implementationLimitation, setImplementationLimitation] = useState('');
  const [otherLimitation, setOtherLimitation] = useState('');

  useEffect(() => {
    setMainConclusion(parsedConclusion.mainConclusion);
    setKeyLessons(parsedConclusion.keyLessons);
    setDataLimitation(parsedConclusion.dataLimitation);
    setMethodologicalLimitation(parsedConclusion.methodologicalLimitation);
    setImplementationLimitation(parsedConclusion.implementationLimitation);
    setOtherLimitation(parsedConclusion.otherLimitation);
  }, [parsedConclusion]);

  const handleSave = () => {
    if (!mainConclusion.trim()) {
      toast('Kesimpulan utama penelitian wajib diisi.', 'warning');
      return;
    }

    const combinedObj = {
      mainConclusion,
      keyLessons,
      dataLimitation,
      methodologicalLimitation,
      implementationLimitation,
      otherLimitation,
    };

    saveReport(id, { conclusion: JSON.stringify(combinedObj) }, user?.name || 'BRIDA Litbang');
    toast('Kesimpulan & Limitasi riset berhasil disimpan.', 'success');
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
        title="Research Conclusion & Limitations"
        description={`Penyusunan kesimpulan kajian, pelajaran berharga, serta limitasi analisis untuk riset: "${record?.title}"`}
        action={
          isBrida && (
            <button
              onClick={handleSave}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1 shadow"
            >
              <Save className="h-4 w-4" />
              <span>Save Conclusion</span>
            </button>
          )
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* ================= LEFT COLUMN: Form input conclusions ================= */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4 text-xs font-semibold">
              
              <div className="border-b pb-2 flex justify-between items-baseline">
                <h3 className="font-bold text-gray-850 uppercase text-xs">Kesimpulan & Pembelajaran</h3>
                <span className="text-[10px] text-gray-450 italic">Wajib diisi (*)</span>
              </div>

              {/* Main Conclusion */}
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Kesimpulan Utama Penelitian (Main Conclusion) *</label>
                <textarea
                  value={mainConclusion}
                  onChange={(e) => setMainConclusion(e.target.value)}
                  placeholder="Tuliskan rangkuman kesimpulan akhir kajian kesiapan integrasi..."
                  rows={5}
                  className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-indigo-600 leading-relaxed"
                />
              </div>

              {/* Key Lessons */}
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Pelajaran Penting (Key Lessons)</label>
                <textarea
                  value={keyLessons}
                  onChange={(e) => setKeyLessons(e.target.value)}
                  placeholder="Masukkan hal berharga yang dipelajari selama riset atau masukan non-rekomendasi..."
                  rows={3}
                  className="block w-full px-3 py-2 border rounded focus:outline-none resize-none bg-white text-gray-900 focus:border-indigo-600 leading-relaxed"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/10 border border-amber-250 rounded text-amber-750 text-[10px] flex items-start gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Perhatian:</strong> Jangan membuat bagian Rekomendasi Dinas Daerah atau rencana aksi di seksi ini (murni kesimpulan akhir riset). Rekomendasi terpisah akan dirumuskan di Fase 9.
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
                  <span>Save Conclusion</span>
                </button>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* ================= RIGHT COLUMN: Research Limitations ================= */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4 text-xs font-semibold">
              <span className="font-bold text-[10px] text-gray-400 block uppercase tracking-wider">
                Batasan Riset (Research Limitations)
              </span>

              {/* Data limitation */}
              <div className="space-y-1.5">
                <label className="block text-3xs font-bold text-gray-650 uppercase">Limitasi Data (Data Limitation)</label>
                <textarea
                  value={dataLimitation}
                  onChange={(e) => setDataLimitation(e.target.value)}
                  placeholder="Contoh: Beberapa responden IT tidak merespons angket..."
                  rows={2}
                  className="block w-full px-2 py-1.5 border rounded focus:outline-none resize-none bg-white text-gray-905"
                />
              </div>

              {/* Method limitation */}
              <div className="space-y-1.5">
                <label className="block text-3xs font-bold text-gray-655 uppercase">Limitasi Metodologis (Methodological)</label>
                <textarea
                  value={methodologicalLimitation}
                  onChange={(e) => setMethodologicalLimitation(e.target.value)}
                  placeholder="Contoh: Riset tidak memantau server pusat kemenkes..."
                  rows={2}
                  className="block w-full px-2 py-1.5 border rounded focus:outline-none resize-none bg-white text-gray-905"
                />
              </div>

              {/* Impl limitation */}
              <div className="space-y-1.5">
                <label className="block text-3xs font-bold text-gray-660 uppercase">Limitasi Pelaksanaan (Implementation)</label>
                <textarea
                  value={implementationLimitation}
                  onChange={(e) => setImplementationLimitation(e.target.value)}
                  placeholder="Contoh: Downtime jaringan pesisir saat survei dilakukan..."
                  rows={2}
                  className="block w-full px-2 py-1.5 border rounded focus:outline-none resize-none bg-white text-gray-905"
                />
              </div>

              {/* Other limitation */}
              <div className="space-y-1.5">
                <label className="block text-3xs font-bold text-gray-665 uppercase">Limitasi Lainnya (Other Limitation)</label>
                <textarea
                  value={otherLimitation}
                  onChange={(e) => setOtherLimitation(e.target.value)}
                  placeholder="Batasan administrasi non-teknis lainnya..."
                  rows={2}
                  className="block w-full px-2 py-1.5 border rounded focus:outline-none resize-none bg-white text-gray-905"
                />
              </div>

            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
