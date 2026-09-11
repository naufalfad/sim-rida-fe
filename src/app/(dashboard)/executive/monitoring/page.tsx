'use client';

import { useState, useEffect, useMemo } from 'react';
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
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function ExecutiveMonitoringPage() {
  const { proposals, studies, fetchStudies, fetchProposals, addExecutiveGuidance, isLoadingStudies } = useOpdStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterHealth, setFilterHealth] = useState<'ALL' | 'ON_TRACK' | 'OVERDUE'>('ALL');
  const [selectedProposal, setSelectedProposal] = useState<OpdProposal | null>(null);

  // Form guidance modal / panel
  const [guidanceText, setGuidanceText] = useState('');
  const [guidanceStage, setGuidanceStage] = useState('Pengumpulan Data & Survei');
  const [isGuidanceSuccess, setIsGuidanceSuccess] = useState(false);

  useEffect(() => {
    fetchStudies();
    fetchProposals();
  }, [fetchStudies, fetchProposals]);

  // Active running studies derived from live database records
  const runningStudies = useMemo(() => {
    const activeFromProposals = proposals.filter(
      (p) => p.status === 'IN_PROGRESS' || p.status === 'COMPLETED' || !!p.studyData || !!p.researchStudy
    );

    const proposalIds = new Set(activeFromProposals.map((p) => p.id));
    const additionalFromStudies: OpdProposal[] = (studies || [])
      .filter((s) => !proposalIds.has(s.proposalId || s.id))
      .map((s) => ({
        id: s.proposalId || s.id,
        code: s.proposal?.code || `RIS-${s.fiscalYear || new Date().getFullYear()}`,
        title: s.title || s.proposal?.title || 'Kajian Riset BRIDA',
        opdName: s.proposal?.opd?.name || 'Perangkat Daerah',
        category: s.proposal?.category || 'Kelitbangan',
        problemStatement: '',
        urgencyReason: '',
        urgencyLevel: 'TINGGI' as any,
        expectedOutput: 'Rekomendasi Teknis' as any,
        supportingDocuments: [],
        status: (s.status as any) || 'IN_PROGRESS',
        createdAt: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : '',
        lastUpdated: s.updatedAt ? new Date(s.updatedAt).toISOString().split('T')[0] : '',
        researchStudy: s,
      }));

    return [...activeFromProposals, ...additionalFromStudies];
  }, [proposals, studies]);

  const getStudyHealth = (prop: OpdProposal) => {
    const isFinished = prop.status === 'COMPLETED' || prop.researchStudy?.status === 'COMPLETED';
    if (isFinished) return { status: 'COMPLETED', label: 'Selesai', color: 'blue', warning: null };

    const progress = prop.studyData?.percentProgress || (prop.researchStudy?.kakStatus === 'FINAL' ? 50 : 25);
    if (progress < 30) {
      return { status: 'OVERDUE', label: 'Perlu Akselerasi', color: 'slate', warning: 'Tahap persiapan awal mendekati batas waktu triwulan.' };
    }
    if (progress < 60) {
      return { status: 'WARNING', label: 'Perlu Perhatian', color: 'slate', warning: 'Perlu akselerasi analisis data lapangan.' };
    }
    return { status: 'ON_TRACK', label: 'Sesuai Target (On Track)', color: 'blue', warning: null };
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

  useEffect(() => {
    if (filteredStudies.length > 0) {
      if (!selectedProposal || !filteredStudies.find((p) => p.id === selectedProposal.id)) {
        setSelectedProposal(filteredStudies[0]);
      }
    } else {
      setSelectedProposal(null);
    }
  }, [filteredStudies, selectedProposal]);

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
      <div className="border border-slate-200 bg-white rounded-xl shadow-xs p-4 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#0f2c59] text-xs font-bold uppercase tracking-widest">
            <Activity className="w-4 h-4" />
            Modul Supervisi Pimpinan • Badan Riset & Inovasi Daerah
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Monitoring & Supervisi Riset Berjalan
          </h1>
          <p className="text-slate-600 text-xs max-w-3xl leading-relaxed">
            Pengawasan real-time tahapan kajian litbang daerah, deteksi dini riset yang berpotensi terlambat (*smart flagging*), dan pemberian arahan langsung pimpinan kepada tim peneliti.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
          <Link
            href="/executive/legalization"
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#0f2c59] hover:bg-[#0a1e3f] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition border border-[#0f2c59] flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Pengesahan TTE</span>
            <ArrowRight className="w-4 h-4 text-sky-300" />
          </Link>
        </div>
      </div>

      {/* KPI Flags */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Kajian Dipantau</span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 block font-mono">{runningStudies.length}</span>
          </div>
          <div className="w-11 h-11 bg-slate-50 text-[#0f2c59] rounded-lg flex items-center justify-center font-bold border border-slate-200">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Sesuai Timeline (On Track)</span>
            <span className="text-2xl sm:text-3xl font-bold text-emerald-800 mt-1 block font-mono">
              {runningStudies.filter(p => getStudyHealth(p).status === 'ON_TRACK' || getStudyHealth(p).status === 'COMPLETED').length}
            </span>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-bold border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Perlu Perhatian / Warning</span>
            <span className="text-2xl sm:text-3xl font-bold text-amber-800 mt-1 block font-mono">
              {runningStudies.filter(p => getStudyHealth(p).status === 'OVERDUE' || getStudyHealth(p).status === 'WARNING').length}
            </span>
          </div>
          <div className="w-11 h-11 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center font-bold border border-amber-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterHealth('ALL')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition shrink-0 ${
              filterHealth === 'ALL' ? 'bg-[#0f2c59] text-white shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Semua Riset ({runningStudies.length})
          </button>
          <button
            onClick={() => setFilterHealth('ON_TRACK')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition shrink-0 ${
              filterHealth === 'ON_TRACK' ? 'bg-[#0f2c59] text-white shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            On Track
          </button>
          <button
            onClick={() => setFilterHealth('OVERDUE')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition shrink-0 ${
              filterHealth === 'OVERDUE' ? 'bg-[#0f2c59] text-white shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
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
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0f2c59] focus:bg-white focus:outline-none text-slate-800"
          />
        </div>
      </div>

      {/* Main Grid: Left List (5 cols), Right Detailed Supervision & Guidance (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Studies (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0f2c59]" />
            Daftar Riset Dalam Pengawasan ({filteredStudies.length})
          </h2>

          {isLoadingStudies ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 shadow-xs">
              <Loader2 className="w-8 h-8 mx-auto text-[#0f2c59] animate-spin mb-2" />
              <p className="font-semibold text-slate-700 text-xs">Memuat data kajian riset...</p>
            </div>
          ) : filteredStudies.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 space-y-2 shadow-xs">
              <Activity className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700 text-xs">Belum ada riset dalam pengawasan</p>
              <p className="text-2xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Kajian riset yang telah disetujui dan diinisiasi akan otomatis terpantau di sini secara real-time.
              </p>
            </div>
          ) : (
            filteredStudies.map((prop) => {
              const health = getStudyHealth(prop);
              const isSelected = selectedProposal?.id === prop.id;
              const progress = prop.studyData?.percentProgress || (prop.status === 'COMPLETED' || prop.researchStudy?.status === 'COMPLETED' ? 100 : 25);

              return (
                <div
                  key={prop.id}
                  onClick={() => setSelectedProposal(prop)}
                  className={`cursor-pointer bg-white p-4 sm:p-5 rounded-xl border transition shadow-xs hover:border-[#0f2c59] ${
                    isSelected ? 'border-[#0f2c59] ring-2 ring-[#0f2c59]/15' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-2xs font-bold text-[#0f2c59] bg-[#dde6f2] px-2 py-0.5 rounded border border-[#bfd2e6]">
                      {prop.code}
                    </span>
                    <span className={`text-2xs font-bold px-2 py-0.5 rounded border ${
                      health.status === 'OVERDUE' 
                        ? 'bg-red-50 text-red-800 border-red-200 animate-pulse' 
                        : health.status === 'WARNING'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {health.label}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm line-clamp-2">{prop.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-3">{prop.opdName}</p>

                  {/* Flag warning callout if any */}
                  {health.warning && (
                    <div className="p-2 mb-3 bg-amber-50 rounded-lg text-xs font-medium text-amber-900 flex items-center gap-1.5 border border-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>{health.warning}</span>
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-600">Milestone: {prop.studyData?.currentMilestone || (prop.status === 'COMPLETED' || prop.researchStudy?.status === 'COMPLETED' ? 'SELESAI' : 'PELAKSANAAN')}</span>
                      <span className="text-[#0f2c59] font-mono">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className="h-full transition-all duration-500 bg-[#0f2c59]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Supervision & Arahan Pimpinan Panel (7 cols) */}
        <div className="lg:col-span-7">
          {selectedProposal ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-6 sticky top-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-2xs font-bold text-[#0f2c59] bg-[#dde6f2] px-2 py-0.5 rounded border border-[#bfd2e6] self-start">
                    {selectedProposal.code}
                  </span>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Target Selesai: {
                      selectedProposal.studyData?.targetCompletionDate ||
                      (selectedProposal.researchStudy?.endDate 
                        ? new Date(selectedProposal.researchStudy.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'Sesuai Linimasa Pelaksanaan')
                    }
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-2">{selectedProposal.title}</h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                  <Building2 className="w-4 h-4 text-[#0f2c59]" />
                  {selectedProposal.opdName}
                </p>
              </div>

              {/* Form Input Arahan Kepala BRIDA */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#0f2c59]" />
                  Beri Catatan & Arahan Supervisi Pimpinan
                </h4>

                {isGuidanceSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-900 rounded-lg text-xs font-medium flex items-center gap-2 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Arahan pimpinan berhasil dikirimkan ke tim peneliti!
                  </div>
                )}

                <form onSubmit={handleSendGuidance} className="space-y-3">
                  <div>
                    <label className="block text-2xs font-semibold text-slate-700 uppercase mb-1">
                      Tahapan yang Diberi Arahan:
                    </label>
                    <select
                      value={guidanceStage}
                      onChange={(e) => setGuidanceStage(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2c59]"
                    >
                      <option value="Persiapan & KAK">Persiapan & KAK</option>
                      <option value="Pengumpulan Data & Survei">Pengumpulan Data & Survei</option>
                      <option value="Analisis & Pengolahan Data">Analisis & Pengolahan Data</option>
                      <option value="Penyusunan Draf Laporan">Penyusunan Draf Laporan</option>
                      <option value="Finalisasi & Uji Publik">Finalisasi & Uji Publik</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-2xs font-semibold text-slate-700 uppercase mb-1">
                      Isi Arahan / Instruksi Pimpinan:
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Contoh: Tolong libatkan akademisi pakar gizi dari UGM dalam FGD minggu depan agar metodologi sampling lebih kuat..."
                      value={guidanceText}
                      onChange={(e) => setGuidanceText(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0f2c59] focus:outline-none leading-relaxed text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#0f2c59] hover:bg-[#0a1e3f] text-white font-semibold text-xs rounded-lg shadow-xs transition flex items-center justify-center gap-2 border border-[#0f2c59]"
                  >
                    <Send className="w-3.5 h-3.5 text-sky-300" />
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
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg text-center border border-slate-200">
                    Belum ada arahan khusus yang diberikan untuk kajian ini.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedProposal.executiveGuidanceList.map((g) => (
                      <div key={g.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                        <div className="flex justify-between items-center text-2xs">
                          <span className="font-bold text-[#0f2c59] font-mono">[{g.stage}]</span>
                          <span className="text-slate-400">{g.createdAt}</span>
                        </div>
                        <p className="text-slate-800 leading-relaxed">{g.text}</p>
                        <span className="text-2xs text-slate-500 block font-semibold">— {g.createdBy}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 shadow-xs">
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
