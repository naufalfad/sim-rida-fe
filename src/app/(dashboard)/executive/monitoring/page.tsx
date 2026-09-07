'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  useOpdStore, 
  OpdProposal 
} from '@/store/useOpdStore';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  Search, 
  Building2, 
  Layers, 
  Calendar, 
  Sparkles, 
  MessageSquare, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function ExecutiveMonitoringPage() {
  const { proposals, addExecutiveGuidance } = useOpdStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterHealth, setFilterHealth] = useState<'ALL' | 'ON_TRACK' | 'OVERDUE'>('ALL');
  const [selectedProposal, setSelectedProposal] = useState<OpdProposal | null>(null);

  // Form guidance modal / panel
  const [guidanceText, setGuidanceText] = useState('');
  const [guidanceStage, setGuidanceStage] = useState('Pengumpulan Data & Survei');
  const [isGuidanceSuccess, setIsGuidanceSuccess] = useState(false);

  // Active running studies
  const runningStudies = proposals.filter(p => p.status === 'IN_PROGRESS' || p.status === 'COMPLETED' || !!p.studyData);

  // Mock health check calculation: (e.g. if progress < 40 and milestone is late -> Overdue flag)
  const getStudyHealth = (prop: OpdProposal) => {
    const progress = prop.studyData?.percentProgress || (prop.status === 'COMPLETED' ? 100 : 30);
    if (prop.status === 'COMPLETED') return { status: 'COMPLETED', label: 'Selesai', color: 'emerald' };
    if (progress < 30) {
      return { status: 'OVERDUE', label: 'Terlambat (Overdue)', color: 'rose', warning: 'Progres di bawah 30% mendekati batas target triwulan.' };
    }
    if (progress < 60) {
      return { status: 'WARNING', label: 'Perlu Perhatian', color: 'amber', warning: 'Perlu akselerasi analisis data lapangan.' };
    }
    return { status: 'ON_TRACK', label: 'Sesuai Target (On Track)', color: 'teal', warning: null };
  };

  const filteredStudies = runningStudies.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.opdName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchQuery.toLowerCase());

    const health = getStudyHealth(p);
    if (filterHealth === 'ON_TRACK') return (health.status === 'ON_TRACK' || health.status === 'COMPLETED') && matchesSearch;
    if (filterHealth === 'OVERDUE') return (health.status === 'OVERDUE' || health.status === 'WARNING') && matchesSearch;
    return matchesSearch;
  });

  const handleSendGuidance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal || !guidanceText.trim()) return;

    addExecutiveGuidance(selectedProposal.id, guidanceText.trim(), guidanceStage);
    setGuidanceText('');
    setIsGuidanceSuccess(true);
    setTimeout(() => setIsGuidanceSuccess(false), 3000);

    // Refresh selected proposal
    const updated = proposals.find(p => p.id === selectedProposal.id);
    if (updated) setSelectedProposal(updated);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 p-8 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-black tracking-widest uppercase mb-2">
            <Activity className="w-4 h-4" />
            Modul 3: Kepala BRIDA
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Monitoring & Supervisi Riset Berjalan
          </h1>
          <p className="text-slate-300 text-xs mt-1.5 max-w-2xl leading-relaxed">
            Pengawasan real-time tahapan kajian litbang daerah, deteksi dini riset yang berpotensi terlambat (*smart flagging*), dan pemberian arahan langsung pimpinan kepada tim peneliti.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/executive/legalization"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition shadow text-xs"
          >
            <span>Pengesahan TTE</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Flags */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Kajian Dipantau</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">{runningStudies.length}</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Sesuai Timeline (On Track)</span>
            <span className="text-3xl font-black text-emerald-600 mt-1 block">
              {runningStudies.filter(p => getStudyHealth(p).status === 'ON_TRACK' || getStudyHealth(p).status === 'COMPLETED').length}
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Perlu Perhatian / Overdue</span>
            <span className="text-3xl font-black text-rose-600 mt-1 block">
              {runningStudies.filter(p => getStudyHealth(p).status === 'OVERDUE' || getStudyHealth(p).status === 'WARNING').length}
            </span>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-700 rounded-2xl flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterHealth('ALL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              filterHealth === 'ALL' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Riset ({runningStudies.length})
          </button>
          <button
            onClick={() => setFilterHealth('ON_TRACK')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              filterHealth === 'ON_TRACK' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            On Track
          </button>
          <button
            onClick={() => setFilterHealth('OVERDUE')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              filterHealth === 'OVERDUE' ? 'bg-rose-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Flagging Terlambat / Warning
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari riset / OPD..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Main Grid: Left List (5 cols), Right Detailed Supervision & Guidance (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: List of Studies (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            Daftar Riset Dalam Pengawasan ({filteredStudies.length})
          </h2>

          {filteredStudies.map((prop) => {
            const health = getStudyHealth(prop);
            const isSelected = selectedProposal?.id === prop.id;
            const progress = prop.studyData?.percentProgress || (prop.status === 'COMPLETED' ? 100 : 25);

            return (
              <div
                key={prop.id}
                onClick={() => setSelectedProposal(prop)}
                className={`cursor-pointer bg-white p-5 rounded-2xl border transition shadow-sm hover:shadow-md ${
                  isSelected ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    {prop.code}
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                    health.status === 'OVERDUE' 
                      ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse' 
                      : health.status === 'WARNING'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {health.label}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm line-clamp-2">{prop.title}</h3>
                <p className="text-xs text-slate-500 mt-1 mb-3">{prop.opdName}</p>

                {/* Flag warning callout if any */}
                {health.warning && (
                  <div className="p-2 mb-3 bg-rose-50 rounded-lg text-[11px] font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>{health.warning}</span>
                  </div>
                )}

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600">Milestone: {prop.studyData?.currentMilestone || 'PERSIAPAN'}</span>
                    <span className="text-emerald-700">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        health.status === 'OVERDUE' ? 'bg-rose-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Supervision & Arahan Pimpinan Panel (7 cols) */}
        <div className="lg:col-span-7">
          {selectedProposal ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 sticky top-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded">
                    {selectedProposal.code}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Target Selesai: {selectedProposal.studyData?.targetCompletionDate || '30 November 2026'}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-2">{selectedProposal.title}</h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {selectedProposal.opdName}
                </p>
              </div>

              {/* Form Input Arahan Kepala BRIDA */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Beri Catatan & Arahan Supervisi Pimpinan
                </h4>

                {isGuidanceSuccess && (
                  <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Arahan pimpinan berhasil dikirimkan ke tim peneliti!
                  </div>
                )}

                <form onSubmit={handleSendGuidance} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Tahapan yang Diberi Arahan:
                    </label>
                    <select
                      value={guidanceStage}
                      onChange={(e) => setGuidanceStage(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Persiapan & KAK">Persiapan & KAK</option>
                      <option value="Pengumpulan Data & Survei">Pengumpulan Data & Survei</option>
                      <option value="Analisis & Pengolahan Data">Analisis & Pengolahan Data</option>
                      <option value="Penyusunan Draf Laporan">Penyusunan Draf Laporan</option>
                      <option value="Finalisasi & Uji Publik">Finalisasi & Uji Publik</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Isi Arahan / Instruksi Pimpinan:
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Contoh: Tolong libatkan akademisi pakar gizi dari UGM dalam FGD minggu depan agar metodologi sampling lebih kuat..."
                      value={guidanceText}
                      onChange={(e) => setGuidanceText(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Kirimkan Arahan ke Tim Peneliti
                  </button>
                </form>
              </div>

              {/* Riwayat Arahan Pimpinan */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Riwayat Arahan Pimpinan ({selectedProposal.executiveGuidanceList?.length || 0})
                </h4>

                {(!selectedProposal.executiveGuidanceList || selectedProposal.executiveGuidanceList.length === 0) ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl text-center">
                    Belum ada arahan khusus yang diberikan untuk kajian ini.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedProposal.executiveGuidanceList.map((g) => (
                      <div key={g.id} className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-emerald-900 font-mono">[{g.stage}]</span>
                          <span className="text-slate-400">{g.createdAt}</span>
                        </div>
                        <p className="text-slate-800 leading-relaxed">{g.text}</p>
                        <span className="text-[10px] text-slate-500 block font-semibold">— {g.createdBy}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 shadow-sm">
              <Activity className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700 text-base">Pilih Kajian untuk Supervisi</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Klik salah satu penelitian di sebelah kiri untuk melihat detail kesehatan jadwal dan memberikan catatan arahan pimpinan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
