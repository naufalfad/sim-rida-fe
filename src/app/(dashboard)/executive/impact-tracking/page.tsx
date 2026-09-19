'use client';

import { useState, useEffect, useMemo } from 'react';
import { useOpdStore } from '@/store/useOpdStore';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  TrendingUp, 
  Award, 
  Building2, 
  CheckCircle2, 
  BarChart3, 
  PieChart, 
  FileText, 
  Star, 
  Target, 
  ShieldCheck, 
  Printer,
  Sparkles,
  Inbox
} from 'lucide-react';

export default function ExecutiveImpactTrackingPage() {
  const { user } = useAuthStore();
  const { 
    proposals, 
    recommendations, 
    opds, 
    fetchProposals, 
    fetchRecommendations, 
    fetchOpds 
  } = useOpdStore();

  const [activeTab, setActiveTab] = useState<'UTILISASI' | 'OPD_EVALUATION' | 'RPJMD_REPORT'>('UTILISASI');

  useEffect(() => {
    fetchProposals();
    fetchRecommendations();
    fetchOpds();
  }, [fetchProposals, fetchRecommendations, fetchOpds]);

  // Completed research proposals from live database
  const completedProposals = useMemo(() => {
    return proposals.filter((p) => p.status === 'COMPLETED');
  }, [proposals]);

  const followedUpProposals = useMemo(() => {
    return completedProposals.filter((p) => !!p.followUpReport);
  }, [completedProposals]);

  // Overall utilization rate
  const totalCompletedOrPublished = completedProposals.length > 0 ? completedProposals.length : recommendations.length;
  const utilizationRate = totalCompletedOrPublished > 0 
    ? Math.round((followedUpProposals.length / totalCompletedOrPublished) * 100) 
    : (recommendations.length > 0 ? 100 : 0);

  // Dynamic satisfaction rating from actual followUpReports
  const averageRating = useMemo(() => {
    const ratings = followedUpProposals
      .map((p) => Number(p.followUpReport?.satisfactionRating))
      .filter((r) => !isNaN(r) && r > 0);

    if (ratings.length === 0) return null;
    const sum = ratings.reduce((acc, curr) => acc + curr, 0);
    return (sum / ratings.length).toFixed(1);
  }, [followedUpProposals]);

  // OPD Performance Rankings derived from actual DB data
  const opdRanking = useMemo(() => {
    const list = opds && opds.length > 0 
      ? opds 
      : Array.from(new Set(proposals.map((p) => p.opdName))).map((name) => ({ id: name, name, code: name }));

    const rankings = list.map((opd: any) => {
      const opdProps = proposals.filter((p) => p.opdId === opd.id || p.opdName === opd.name);
      const total = opdProps.length;
      const adopted = opdProps.filter((p) => p.status === 'COMPLETED' || !!p.followUpReport).length;
      
      let score = 0;
      let status = 'Pasif';
      if (total > 0) {
        score = Math.min(100, Math.round((total * 25) + (adopted * 35)));
        if (score >= 80) status = 'Sangat Aktif (Top Performer)';
        else if (score >= 50) status = 'Aktif';
        else status = 'Perlu Pendampingan';
      }

      return {
        id: opd.id,
        name: opd.name,
        totalProposals: total,
        adoptedCount: adopted,
        score,
        status,
      };
    });

    return rankings.sort((a: any, b: any) => b.score - a.score || b.totalProposals - a.totalProposals);
  }, [opds, proposals]);

  // Sebaran bentuk pemanfaatan rekomendasi berbasis database
  const utilizationBreakdown = useMemo(() => {
    const total = followedUpProposals.length + recommendations.length;
    if (total === 0) return null;

    let renjaCount = 0;
    let perdaCount = 0;
    let sopCount = 0;
    let techCount = 0;

    followedUpProposals.forEach((p) => {
      const type = p.followUpReport?.utilizationType || '';
      if (type.includes('Renja') || type.includes('RKPD')) renjaCount++;
      else if (type.includes('Perda') || type.includes('Ranperda')) perdaCount++;
      else if (type.includes('SOP')) sopCount++;
      else techCount++;
    });

    recommendations.forEach((r) => {
      const t = r.targetPolicyType || '';
      if (t.includes('PERDA') || t.includes('PERBUP') || t.includes('SE_BUPATI')) perdaCount++;
      else if (t.includes('RENCANA_AKSI') || t.includes('RENJA')) renjaCount++;
      else if (t.includes('SOP')) sopCount++;
      else techCount++;
    });

    return {
      renjaPercent: total > 0 ? Math.round((renjaCount / total) * 100) : 0,
      perdaPercent: total > 0 ? Math.round((perdaCount / total) * 100) : 0,
      sopPercent: total > 0 ? Math.round((sopCount / total) * 100) : 0,
      techPercent: total > 0 ? Math.round((techCount / total) * 100) : 0,
      renjaCount,
      perdaCount,
      sopCount,
      techCount,
      total,
    };
  }, [followedUpProposals, recommendations]);

  // Dynamic RPJMD Alignment derived from live recommendations and completed research
  const dynamicRpjmdGoals = useMemo(() => {
    if (recommendations.length > 0) {
      return recommendations.map((rec, idx) => ({
        misi: `Misi ${idx + 1}: Optimalisasi Kebijakan Sektoral Berbasis Riset Daerah`,
        indicator: rec.title,
        researchCount: 1,
        policyImpact: rec.policyRecommendations || rec.executiveSummary || 'Telah disahkan menjadi naskah rekomendasi kebijakan pemerintah daerah.',
        status: rec.status === 'FINALIZED' ? 'TERCAPAI (Optimal)' : 'ON TRACK',
      }));
    }

    if (completedProposals.length > 0) {
      return completedProposals.map((p, idx) => ({
        misi: `Misi ${idx + 1}: Penguatan Daya Saing Daerah Melalui Riset Kelitbangan`,
        indicator: p.title,
        researchCount: 1,
        policyImpact: p.followUpReport?.utilizationSummary || p.strategicImpact || 'Kajian riset telah rampung dan siap diintegrasikan ke kebijakan daerah.',
        status: p.followUpReport ? 'TERCAPAI (Optimal)' : 'ON TRACK',
      }));
    }

    return [];
  }, [recommendations, completedProposals]);

  const signerName = user?.name || 'Dr. Petrus Renyaan, M.Si.';
  const signerNip = user?.nip ? `NIP. ${user.nip}` : 'NIP. 197304121998031001';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="border border-slate-200 bg-white rounded-xl shadow-xs p-4 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#0f2c59] text-xs font-bold uppercase tracking-widest">
            <TrendingUp className="w-4 h-4" />
            Modul Analisis Dampak • Badan Riset & Inovasi Daerah
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Analisis Tindak Lanjut & Dampak Kebijakan (RPJMD)
          </h1>
          <p className="text-slate-600 text-xs max-w-3xl leading-relaxed">
            Evaluasi pemanfaatan output riset oleh OPD pemohon, pemeringkatan responsivitas perangkat daerah, dan penghitungan kontribusi riset terhadap pencapaian target RPJMD daerah.
          </p>
        </div>

        <button
          onClick={() => {
            setActiveTab('RPJMD_REPORT');
            setTimeout(() => window.print(), 300);
          }}
          className="px-4 py-2.5 bg-[#0f2c59] hover:bg-[#0a1e3f] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition border border-[#0f2c59] flex items-center justify-center gap-2 shadow-xs shrink-0 w-full sm:w-auto"
        >
          <Printer className="w-4 h-4 text-sky-300" />
          <span>Cetak Laporan RPJMD</span>
        </button>
      </div>

      {/* 3 Main KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Rekomendasi Terbit</span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 block font-mono">
              {recommendations.length > 0 ? recommendations.length : completedProposals.length} Dokumen
            </span>
            <span className="text-2xs text-slate-500 mt-1 block">Telah disahkan TTE</span>
          </div>
          <div className="w-11 h-11 bg-slate-50 text-[#0f2c59] rounded-lg flex items-center justify-center font-bold border border-slate-200">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Tingkat Utilisasi OPD</span>
            <span className="text-2xl sm:text-3xl font-bold text-[#0f2c59] mt-1 block font-mono">{utilizationRate}%</span>
            <span className="text-2xs text-slate-600 font-medium mt-1 block">
              {followedUpProposals.length} dari {totalCompletedOrPublished} diterapkan
            </span>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-bold border border-emerald-200">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Rata-rata Rating Kepuasan</span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 block flex items-center gap-1 font-mono">
              {averageRating !== null ? averageRating : '-'} 
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            </span>
            <span className="text-2xs text-slate-500 mt-1 block">
              {averageRating !== null ? 'Skala 5.0 dari OPD' : 'Belum ada rating masuk'}
            </span>
          </div>
          <div className="w-11 h-11 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center font-bold border border-amber-200">
            <Star className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-none border border-slate-200 bg-white p-1.5 rounded-xl shadow-xs gap-1.5">
        <button
          onClick={() => setActiveTab('UTILISASI')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'UTILISASI' ? 'bg-[#0f2c59] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard Pemanfaatan OPD</span>
        </button>

        <button
          onClick={() => setActiveTab('OPD_EVALUATION')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'OPD_EVALUATION' ? 'bg-[#0f2c59] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Evaluasi & Pemeringkatan OPD</span>
        </button>

        <button
          onClick={() => setActiveTab('RPJMD_REPORT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'RPJMD_REPORT' ? 'bg-[#0f2c59] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Laporan Kontribusi RPJMD</span>
        </button>
      </div>

      {/* TAB 1: DASHBOARD UTILISASI OPD */}
      {activeTab === 'UTILISASI' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bentuk Adopsi Riset */}
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#0f2c59]" />
                Sebaran Bentuk Pemanfaatan Rekomendasi
              </h3>

              {!utilizationBreakdown ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Inbox className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">Belum Ada Data Pemanfaatan Rekomendasi</p>
                  <p className="text-2xs text-slate-400">
                    Statistik bentuk pemanfaatan akan otomatis terkalkulasi saat OPD mengisi formulir laporan tindak lanjut.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-2 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>Adopsi ke Rencana Kerja (Renja / RKPD)</span>
                      <span className="text-[#0f2c59] font-mono font-bold">{utilizationBreakdown.renjaPercent}% ({utilizationBreakdown.renjaCount})</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-[#0f2c59] h-full rounded-full transition-all duration-500" style={{ width: `${utilizationBreakdown.renjaPercent}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>Penyusunan Ranperda / Kebijakan Daerah</span>
                      <span className="text-[#0f2c59] font-mono font-bold">{utilizationBreakdown.perdaPercent}% ({utilizationBreakdown.perdaCount})</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-sky-700 h-full rounded-full transition-all duration-500" style={{ width: `${utilizationBreakdown.perdaPercent}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>Revisi / Pembuatan SOP Teknis Pelayanan</span>
                      <span className="text-[#0f2c59] font-mono font-bold">{utilizationBreakdown.sopPercent}% ({utilizationBreakdown.sopCount})</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${utilizationBreakdown.sopPercent}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>Implementasi Inovasi Teknologi / Sistem</span>
                      <span className="text-slate-900 font-mono font-bold">{utilizationBreakdown.techPercent}% ({utilizationBreakdown.techCount})</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${utilizationBreakdown.techPercent}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rekomendasi yang Telah Ditindaklanjuti */}
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0f2c59]" />
                Laporan Tindak Lanjut Terbaru dari OPD
              </h3>

              <div className="space-y-3">
                {followedUpProposals.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 space-y-2">
                    <Inbox className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">Belum Ada Laporan Tindak Lanjut Masuk</p>
                    <p className="text-2xs text-slate-400">
                      Laporan implementasi dari OPD pemohon akan otomatis muncul di sini setelah diunggah.
                    </p>
                  </div>
                ) : (
                  followedUpProposals.map((prop) => (
                    <div key={prop.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{prop.opdName}</span>
                        <span className="bg-[#dde6f2] text-[#0f2c59] font-bold px-2 py-0.5 rounded text-2xs border border-[#bfd2e6]">
                          {prop.followUpReport?.utilizationType}
                        </span>
                      </div>
                      <p className="text-slate-700">{prop.followUpReport?.utilizationSummary}</p>
                      <div className="flex items-center justify-between text-2xs text-slate-500 pt-1 border-t border-slate-200">
                        <span>Dilaporkan: {prop.followUpReport?.submittedAt}</span>
                        <span className="font-bold text-[#0f2c59] flex items-center gap-1 font-mono">
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-4 sm:p-6">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Leaderboard Kinerja & Responsivitas OPD</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tingkat keaktifan perangkat daerah dalam mengusulkan masalah prioritas dan mengimplementasikan rekomendasi riset BRIDA berdasarkan basis data riil.
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
                {opdRanking.map((opd: any, idx: number) => (
                  <tr key={opd.id || idx} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      #{idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {opd.name}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700 font-mono">
                      {opd.totalProposals}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#0f2c59] font-mono">
                      {opd.adoptedCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900 font-mono">
                      {opd.score} / 100
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded text-2xs font-bold uppercase border ${
                        opd.status.includes('Sangat Aktif') ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        opd.status.includes('Aktif') ? 'bg-[#dde6f2] text-[#0f2c59] border-[#bfd2e6]' :
                        'bg-slate-100 text-slate-800 border-slate-200'
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-10 max-w-4xl mx-auto space-y-8 text-xs font-sans">
          {/* Header */}
          <div className="border-b-2 border-slate-200 pb-5 text-center space-y-1">
            <h2 className="text-base font-bold tracking-wide uppercase text-slate-900">
              Laporan Akumulasi Capaian Kinerja Kelitbangan
            </h2>
            <h3 className="text-xs sm:text-sm font-semibold text-[#0f2c59] uppercase">
              Kontribusi Riset & Inovasi Daerah Terhadap Indikator Kinerja Utama (IKU) RPJMD Kab. Mimika
            </h3>
            <p className="text-2xs text-slate-500 font-mono">Tahun Anggaran {new Date().getFullYear()}</p>
          </div>

          {/* Table RPJMD Contributions */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              A. Matriks Dampak Hasil Kajian Terhadap Target Sasaran Daerah
            </h4>

            {dynamicRpjmdGoals.length === 0 ? (
              <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-400 space-y-2">
                <Target className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-700">Belum Ada Naskah Rekomendasi Terpublikasi</p>
                <p className="text-2xs text-slate-500">
                  Setelah rekomendasi kebijakan disahkan melalui TTE, matriks keselarasan RPJMD akan terisi secara otomatis.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {dynamicRpjmdGoals.map((goal, idx) => (
                  <div key={idx} className="p-4 sm:p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{goal.misi}</span>
                      <span className="bg-[#dde6f2] text-[#0f2c59] font-bold px-2 py-0.5 rounded text-2xs border border-[#bfd2e6]">
                        {goal.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800 pt-1">
                      <div>
                        <span className="font-medium text-slate-500 block text-2xs uppercase">Indikator Sasaran:</span>
                        <span>{goal.indicator}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-500 block text-2xs uppercase">Dampak Nyata Kebijakan:</span>
                        <span className="font-semibold text-[#0f2c59]">{goal.policyImpact}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Executive Summary */}
          <div className="space-y-2 pt-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">B. Kesimpulan & Rekomendasi Eksekutif</h4>
            <p className="text-slate-700 leading-relaxed text-justify">
              Secara keseluruhan, pelaksanaan riset kelitbangan tahun anggaran {new Date().getFullYear()} telah memberikan kontribusi nyata terhadap akselerasi target prioritas daerah dengan tingkat utilisasi rekomendasi mencapai {utilizationRate}%. Disarankan kepada Bupati Mimika untuk terus mendorong keterikatan anggaran OPD dengan hasil kajian kelitbangan BRIDA pada penyusunan RKPD tahun anggaran berikutnya.
            </p>
          </div>

          {/* Signature */}
          <div className="pt-6 border-t border-slate-200 flex justify-end">
            <div className="text-center w-64 space-y-3">
              <p className="text-xs font-medium text-slate-700">
                Mimika, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                <br />
                <span className="font-semibold text-slate-900">Kepala BRIDA Kabupaten Mimika</span>
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[#0f2c59]">
                <ShieldCheck className="w-7 h-7 mx-auto text-emerald-600" />
                <span className="text-2xs font-bold uppercase block mt-1 tracking-wider">Disahkan Secara Elektronik (TTE)</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 underline">{signerName}</p>
                <p className="text-2xs text-slate-500 font-mono">{signerNip}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
