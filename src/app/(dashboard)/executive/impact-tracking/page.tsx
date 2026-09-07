'use client';

import { useState } from 'react';
import { 
  useOpdStore 
} from '@/store/useOpdStore';
import { 
  TrendingUp, 
  Award, 
  Building2, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  PieChart, 
  Download, 
  FileText, 
  Sparkles, 
  Star, 
  Target, 
  ShieldCheck, 
  ArrowUpRight,
  Printer
} from 'lucide-react';

export default function ExecutiveImpactTrackingPage() {
  const { proposals } = useOpdStore();

  const [activeTab, setActiveTab] = useState<'UTILISASI' | 'OPD_EVALUATION' | 'RPJMD_REPORT'>('UTILISASI');

  const completedProposals = proposals.filter(p => p.status === 'COMPLETED');
  const followedUpProposals = completedProposals.filter(p => !!p.followUpReport);

  const utilizationRate = completedProposals.length > 0 
    ? Math.round((followedUpProposals.length / completedProposals.length) * 100) 
    : 0;

  // OPD Performance Rankings
  const opdRanking = [
    { name: 'Dinas Kesehatan Kab. Sleman', totalProposals: 3, adoptedCount: 3, score: 98, status: 'Sangat Aktif (Top Performer)' },
    { name: 'Dinas Komunikasi & Informatika', totalProposals: 2, adoptedCount: 2, score: 94, status: 'Sangat Aktif' },
    { name: 'Dinas Pertanian, Pangan & Perikanan', totalProposals: 2, adoptedCount: 1, score: 85, status: 'Aktif' },
    { name: 'Dinas Pariwisata Kab. Sleman', totalProposals: 2, adoptedCount: 1, score: 80, status: 'Aktif' },
    { name: 'Dinas Perindustrian & Perdagangan', totalProposals: 1, adoptedCount: 0, score: 65, status: 'Perlu Pendampingan' },
    { name: 'Dinas Pekerjaan Umum & PKP', totalProposals: 1, adoptedCount: 0, score: 60, status: 'Pasif' },
  ];

  // RPJMD Strategic Alignment Indicators
  const rpjmdGoals = [
    {
      misi: 'Misi 1: Mewujudkan Kesejahteraan Sosial & Sleman Sehat',
      indicator: 'Penurunan Stunting Balita (< 12%) & Indeks Pembangunan Manusia',
      researchCount: 3,
      policyImpact: 'Diadopsi menjadi SK Bupati Intervensi Pangan Lokal Terpadu 17 Kapanewon.',
      status: 'TERCAPAI (Optimal)'
    },
    {
      misi: 'Misi 2: Penguatan Ketahanan Pangan & Ekonomi Kerakyatan',
      indicator: 'Peningkatan Nilai Tukar Petani & Modernisasi Pasca Panen Salak Pondoh',
      researchCount: 2,
      policyImpact: 'Dialokasikan pada DPA Dinas Pertanian 2027 untuk smart green-house.',
      status: 'ON TRACK'
    },
    {
      misi: 'Misi 3: Transformasi Digital & Tata Kelola Birokrasi Terbuka',
      indicator: 'Indeks SPBE (> 4.2) & Integrasi Layanan Satu Data Daerah',
      researchCount: 2,
      policyImpact: 'Menjadi Naskah Akademik Raperda Penyelenggaraan Smart City.',
      status: 'ON TRACK'
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 p-8 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-black tracking-widest uppercase mb-2">
            <TrendingUp className="w-4 h-4" />
            Modul 5: Kepala BRIDA
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Analisis Tindak Lanjut & Dampak Kebijakan (RPJMD)
          </h1>
          <p className="text-slate-300 text-xs mt-1.5 max-w-2xl leading-relaxed">
            Evaluasi pemanfaatan output riset oleh OPD pemohon, pemeringkatan responsivitas perangkat daerah, dan penghitungan kontribusi riset terhadap pencapaian target RPJMD daerah.
          </p>
        </div>

        <button
          onClick={() => {
            setActiveTab('RPJMD_REPORT');
            setTimeout(() => window.print(), 300);
          }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition shadow text-xs"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Laporan Akumulasi RPJMD</span>
        </button>
      </div>

      {/* 3 Main KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Rekomendasi Terbit</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">{completedProposals.length} Dokumen</span>
            <span className="text-[11px] text-slate-400 mt-1 block">Telah disahkan TTE</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tingkat Utilisasi OPD</span>
            <span className="text-3xl font-black text-emerald-600 mt-1 block">{utilizationRate}%</span>
            <span className="text-[11px] text-emerald-700 font-bold mt-1 block">
              {followedUpProposals.length} dari {completedProposals.length} diterapkan
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Rata-rata Rating Kepuasan</span>
            <span className="text-3xl font-black text-amber-500 mt-1 block flex items-center gap-1">
              4.9 <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Skala 5.0 dari OPD</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-bold">
            <Star className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white p-2 rounded-xl shadow-sm gap-2">
        <button
          onClick={() => setActiveTab('UTILISASI')}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-bold transition ${
            activeTab === 'UTILISASI' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Dashboard Pemanfaatan OPD
        </button>

        <button
          onClick={() => setActiveTab('OPD_EVALUATION')}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-bold transition ${
            activeTab === 'OPD_EVALUATION' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Evaluasi & Pemeringkatan OPD
        </button>

        <button
          onClick={() => setActiveTab('RPJMD_REPORT')}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-bold transition ${
            activeTab === 'RPJMD_REPORT' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Target className="w-4 h-4" />
          Laporan Kontribusi RPJMD
        </button>
      </div>

      {/* TAB 1: DASHBOARD UTILISASI OPD */}
      {activeTab === 'UTILISASI' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bentuk Adopsi Riset */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-600" />
                Sebaran Bentuk Pemanfaatan Rekomendasi
              </h3>

              <div className="space-y-3 pt-2 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Adopsi ke Rencana Kerja (Renja / RKPD)</span>
                    <span className="text-emerald-700">55%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '55%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Penyusunan Ranperda / Kebijakan Daerah</span>
                    <span className="text-blue-700">25%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '25%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Revisi / Pembuatan SOP Teknis Pelayanan</span>
                    <span className="text-purple-700">15%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full" style={{ width: '15%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Implementasi Inovasi Teknologi</span>
                    <span className="text-amber-700">5%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '5%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Rekomendasi yang Telah Ditindaklanjuti */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Laporan Tindak Lanjut Terbaru dari OPD
              </h3>

              <div className="space-y-3">
                {followedUpProposals.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada laporan tindak lanjut yang masuk dari OPD.</p>
                ) : (
                  followedUpProposals.map((prop) => (
                    <div key={prop.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{prop.opdName}</span>
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          {prop.followUpReport?.utilizationType}
                        </span>
                      </div>
                      <p className="text-slate-700">{prop.followUpReport?.utilizationSummary}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>Dilaporkan: {prop.followUpReport?.submittedAt}</span>
                        <span className="font-bold text-amber-600 flex items-center gap-1">
                          Rating: {prop.followUpReport?.satisfactionRating} / 5.0 ⭐
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EVALUASI & PEMERINGKATAN OPD */}
      {activeTab === 'OPD_EVALUATION' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Leaderboard Kinerja & Responsivitas OPD</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tingkat keaktifan perangkat daerah dalam mengusulkan masalah prioritas dan mengimplementasikan rekomendasi riset BRIDA.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Peringkat</th>
                  <th className="py-3 px-4">Perangkat Daerah (OPD)</th>
                  <th className="py-3 px-4 text-center">Total Usulan</th>
                  <th className="py-3 px-4 text-center">Rekomendasi Diadopsi</th>
                  <th className="py-3 px-4 text-center">Skor Kinerja</th>
                  <th className="py-3 px-4">Kategori Kinerja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {opdRanking.map((opd, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-black text-slate-900 font-mono">
                      #{idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {opd.name}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                      {opd.totalProposals}
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-emerald-700">
                      {opd.adoptedCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-slate-900 font-mono">
                      {opd.score} / 100
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        opd.status.includes('Sangat Aktif') ? 'bg-emerald-100 text-emerald-800' :
                        opd.status.includes('Aktif') ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {opd.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LAPORAN AKUMULASI RPJMD */}
      {activeTab === 'RPJMD_REPORT' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 sm:p-12 max-w-4xl mx-auto space-y-8 text-xs font-sans">
          {/* Header */}
          <div className="border-b-4 border-double border-slate-900 pb-6 text-center space-y-1">
            <h2 className="text-base font-black tracking-wide uppercase text-slate-900">
              Laporan Akumulasi Capaian Kinerja Kelitbangan
            </h2>
            <h3 className="text-sm font-extrabold text-emerald-900 uppercase">
              Kontribusi Riset & Inovasi Daerah Terhadap Indikator Kinerja Utama (IKU) RPJMD Kab. Sleman
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">Tahun Anggaran 2026</p>
          </div>

          {/* Table RPJMD Contributions */}
          <div className="space-y-4">
            <h4 className="font-black text-sm text-slate-900 uppercase">
              A. Matriks Dampak Hasil Kajian Terhadap Target Sasaran Daerah
            </h4>

            <div className="space-y-4">
              {rpjmdGoals.map((goal, idx) => (
                <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-xs">{goal.misi}</span>
                    <span className="bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded text-[10px]">
                      {goal.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 pt-1">
                    <div>
                      <span className="font-bold text-slate-500 block text-[10px] uppercase">Indikator Sasaran:</span>
                      <span>{goal.indicator}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 block text-[10px] uppercase">Dampak Nyata Kebijakan:</span>
                      <span className="font-semibold text-emerald-900">{goal.policyImpact}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2 pt-2">
            <h4 className="font-black text-sm text-slate-900 uppercase">B. Kesimpulan & Rekomendasi Eksekutif</h4>
            <p className="text-slate-700 leading-relaxed text-justify">
              Secara keseluruhan, pelaksanaan riset kelitbangan tahun anggaran 2026 telah memberikan kontribusi nyata terhadap akselerasi target prioritas daerah dengan tingkat utilisasi rekomendasi mencapai {utilizationRate}%. Disarankan kepada Bupati Sleman untuk terus mendorong keterikatan anggaran OPD dengan hasil kajian kelitbangan BRIDA pada penyusunan RKPD tahun anggaran berikutnya.
            </p>
          </div>

          {/* Signature */}
          <div className="pt-8 border-t border-slate-200 flex justify-end">
            <div className="text-center w-64 space-y-4">
              <p className="text-xs font-bold text-slate-800">
                Sleman, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                <br />
                Kepala BRIDA Kabupaten Sleman
              </p>
              <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800">
                <ShieldCheck className="w-8 h-8 mx-auto" />
                <span className="text-[9px] font-black uppercase block mt-1">Disahkan Secara Elektronik (TTE)</span>
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 underline">Dr. H. Bambang Suherman, M.Si.</p>
                <p className="text-[10px] text-slate-500 font-mono">NIP. 19740512 199903 1 002</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
