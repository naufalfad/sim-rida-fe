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
        policyImpact: rec.policyActions || rec.executiveSummary || 'Telah disahkan menjadi naskah rekomendasi kebijakan pemerintah daerah.',
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
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-[#0f2c59] p-8 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-black">
        <div>
          <div className="flex items-center gap-2 text-sky-300 text-xs font-black tracking-widest uppercase mb-2">
            <TrendingUp className="w-4 h-4" />
            Modul 5: Kepala BRIDA
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Analisis Tindak Lanjut & Dampak Kebijakan (RPJMD)
          </h1>
          <p className="text-slate-200 text-xs mt-1.5 max-w-2xl leading-relaxed">
            Evaluasi pemanfaatan output riset oleh OPD pemohon, pemeringkatan responsivitas perangkat daerah, dan penghitungan kontribusi riset terhadap pencapaian target RPJMD daerah.
          </p>
        </div>

        <button
          onClick={() => {
            setActiveTab('RPJMD_REPORT');
            setTimeout(() => window.print(), 300);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition shadow text-xs border border-blue-400"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Laporan Akumulasi RPJMD</span>
        </button>
      </div>

      {/* 3 Main KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-black shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Rekomendasi Terbit</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">
              {recommendations.length > 0 ? recommendations.length : completedProposals.length} Dokumen
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Telah disahkan TTE</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center font-bold border border-blue-200">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-black shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tingkat Utilisasi OPD</span>
            <span className="text-3xl font-black text-blue-900 mt-1 block">{utilizationRate}%</span>
            <span className="text-[11px] text-blue-900 font-bold mt-1 block">
              {followedUpProposals.length} dari {totalCompletedOrPublished} diterapkan
            </span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center font-bold border border-blue-200">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-black shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Rata-rata Rating Kepuasan</span>
            <span className="text-3xl font-black text-blue-900 mt-1 block flex items-center gap-1 font-mono">
              {averageRating !== null ? averageRating : '-'} 
              <Star className="w-5 h-5 fill-blue-600 text-blue-600" />
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {averageRating !== null ? 'Skala 5.0 dari OPD' : 'Belum ada rating masuk'}
            </span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center font-bold border border-blue-200">
            <Star className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black bg-white p-2 rounded-xl shadow-sm gap-2">
        <button
          onClick={() => setActiveTab('UTILISASI')}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-bold transition ${
            activeTab === 'UTILISASI' ? 'bg-blue-600 text-white shadow' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Dashboard Pemanfaatan OPD
        </button>

        <button
          onClick={() => setActiveTab('OPD_EVALUATION')}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-bold transition ${
            activeTab === 'OPD_EVALUATION' ? 'bg-blue-600 text-white shadow' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Evaluasi & Pemeringkatan OPD
        </button>

        <button
          onClick={() => setActiveTab('RPJMD_REPORT')}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-bold transition ${
            activeTab === 'RPJMD_REPORT' ? 'bg-blue-600 text-white shadow' : 'text-slate-700 hover:bg-slate-100'
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
            <div className="bg-white p-6 rounded-2xl border border-black shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-600" />
                Sebaran Bentuk Pemanfaatan Rekomendasi
              </h3>

              {!utilizationBreakdown ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Inbox className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">Belum Ada Data Pemanfaatan Rekomendasi</p>
                  <p className="text-[11px] text-slate-400">
                    Statistik bentuk pemanfaatan akan otomatis terkalkulasi saat OPD mengisi formulir laporan tindak lanjut.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-2 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Adopsi ke Rencana Kerja (Renja / RKPD)</span>
                      <span className="text-blue-900">{utilizationBreakdown.renjaPercent}% ({utilizationBreakdown.renjaCount})</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${utilizationBreakdown.renjaPercent}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Penyusunan Ranperda / Kebijakan Daerah</span>
                      <span className="text-blue-900">{utilizationBreakdown.perdaPercent}% ({utilizationBreakdown.perdaCount})</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-blue-800 h-full rounded-full transition-all duration-500" style={{ width: `${utilizationBreakdown.perdaPercent}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Revisi / Pembuatan SOP Teknis Pelayanan</span>
                      <span className="text-blue-900">{utilizationBreakdown.sopPercent}% ({utilizationBreakdown.sopCount})</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${utilizationBreakdown.sopPercent}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Implementasi Inovasi Teknologi / Sistem</span>
                      <span className="text-slate-900">{utilizationBreakdown.techPercent}% ({utilizationBreakdown.techCount})</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-slate-700 h-full rounded-full transition-all duration-500" style={{ width: `${utilizationBreakdown.techPercent}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rekomendasi yang Telah Ditindaklanjuti */}
            <div className="bg-white p-6 rounded-2xl border border-black shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Laporan Tindak Lanjut Terbaru dari OPD
              </h3>

              <div className="space-y-3">
                {followedUpProposals.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 space-y-2">
                    <Inbox className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">Belum Ada Laporan Tindak Lanjut Masuk</p>
                    <p className="text-[11px] text-slate-400">
                      Laporan implementasi dari OPD pemohon akan otomatis muncul di sini setelah diunggah.
                    </p>
                  </div>
                ) : (
                  followedUpProposals.map((prop) => (
                    <div key={prop.id} className="p-4 bg-slate-50 rounded-xl border border-slate-300 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{prop.opdName}</span>
                        <span className="bg-blue-50 text-blue-900 font-bold px-2 py-0.5 rounded text-[10px] border border-blue-200">
                          {prop.followUpReport?.utilizationType}
                        </span>
                      </div>
                      <p className="text-slate-700">{prop.followUpReport?.utilizationSummary}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-300">
                        <span>Dilaporkan: {prop.followUpReport?.submittedAt}</span>
                        <span className="font-bold text-blue-900 flex items-center gap-1 font-mono">
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
        <div className="bg-white rounded-2xl border border-black shadow-sm overflow-hidden space-y-4 p-6">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Leaderboard Kinerja & Responsivitas OPD</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tingkat keaktifan perangkat daerah dalam mengusulkan masalah prioritas dan mengimplementasikan rekomendasi riset BRIDA berdasarkan basis data riil.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-black">
                <tr>
                  <th className="py-3 px-4">Peringkat</th>
                  <th className="py-3 px-4">Perangkat Daerah (OPD)</th>
                  <th className="py-3 px-4 text-center">Total Usulan</th>
                  <th className="py-3 px-4 text-center">Rekomendasi Diadopsi</th>
                  <th className="py-3 px-4 text-center">Skor Kinerja</th>
                  <th className="py-3 px-4">Kategori Kinerja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {opdRanking.map((opd: any, idx: number) => (
                  <tr key={opd.id || idx} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-black text-slate-900 font-mono">
                      #{idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {opd.name}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700 font-mono">
                      {opd.totalProposals}
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-blue-900 font-mono">
                      {opd.adoptedCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-slate-900 font-mono">
                      {opd.score} / 100
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                        opd.status.includes('Sangat Aktif') ? 'bg-blue-600 text-white border-blue-800' :
                        opd.status.includes('Aktif') ? 'bg-blue-50 text-blue-900 border-blue-200' :
                        'bg-slate-100 text-slate-800 border-slate-300'
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
        <div className="bg-white rounded-2xl border border-black shadow-lg p-8 sm:p-12 max-w-4xl mx-auto space-y-8 text-xs font-sans">
          {/* Header */}
          <div className="border-b-4 border-double border-black pb-6 text-center space-y-1">
            <h2 className="text-base font-black tracking-wide uppercase text-slate-900">
              Laporan Akumulasi Capaian Kinerja Kelitbangan
            </h2>
            <h3 className="text-sm font-extrabold text-blue-950 uppercase">
              Kontribusi Riset & Inovasi Daerah Terhadap Indikator Kinerja Utama (IKU) RPJMD Kab. Mimika
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">Tahun Anggaran {new Date().getFullYear()}</p>
          </div>

          {/* Table RPJMD Contributions */}
          <div className="space-y-4">
            <h4 className="font-black text-sm text-slate-900 uppercase">
              A. Matriks Dampak Hasil Kajian Terhadap Target Sasaran Daerah
            </h4>

            {dynamicRpjmdGoals.length === 0 ? (
              <div className="p-8 bg-slate-50 rounded-2xl border border-black text-center text-slate-400 space-y-2">
                <Target className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-700">Belum Ada Naskah Rekomendasi Terpublikasi</p>
                <p className="text-[11px] text-slate-500">
                  Setelah rekomendasi kebijakan disahkan melalui TTE, matriks keselarasan RPJMD akan terisi secara otomatis.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {dynamicRpjmdGoals.map((goal, idx) => (
                  <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-black space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-xs">{goal.misi}</span>
                      <span className="bg-blue-50 text-blue-900 font-black px-2.5 py-0.5 rounded text-[10px] border border-blue-200">
                        {goal.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800 pt-1">
                      <div>
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">Indikator Sasaran:</span>
                        <span>{goal.indicator}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">Dampak Nyata Kebijakan:</span>
                        <span className="font-semibold text-blue-950">{goal.policyImpact}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Executive Summary */}
          <div className="space-y-2 pt-2">
            <h4 className="font-black text-sm text-slate-900 uppercase">B. Kesimpulan & Rekomendasi Eksekutif</h4>
            <p className="text-slate-800 leading-relaxed text-justify">
              Secara keseluruhan, pelaksanaan riset kelitbangan tahun anggaran {new Date().getFullYear()} telah memberikan kontribusi nyata terhadap akselerasi target prioritas daerah dengan tingkat utilisasi rekomendasi mencapai {utilizationRate}%. Disarankan kepada Bupati Mimika untuk terus mendorong keterikatan anggaran OPD dengan hasil kajian kelitbangan BRIDA pada penyusunan RKPD tahun anggaran berikutnya.
            </p>
          </div>

          {/* Signature */}
          <div className="pt-8 border-t border-black flex justify-end">
            <div className="text-center w-64 space-y-4">
              <p className="text-xs font-bold text-slate-800">
                Mimika, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                <br />
                Kepala BRIDA Kabupaten Mimika
              </p>
              <div className="p-2 bg-blue-50 border border-blue-300 rounded-xl text-blue-900">
                <ShieldCheck className="w-8 h-8 mx-auto" />
                <span className="text-[9px] font-black uppercase block mt-1">Disahkan Secara Elektronik (TTE)</span>
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 underline">{signerName}</p>
                <p className="text-[10px] text-slate-500 font-mono">{signerNip}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
