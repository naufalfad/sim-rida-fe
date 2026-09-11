'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  useOpdStore, 
  OpdProposal 
} from '@/store/useOpdStore';
import { useToast } from '@/components/ui/toast';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Award, 
  Eye, 
  Search, 
  ArrowRight, 
  Building2, 
  Layers, 
  FileText, 
  ShieldAlert, 
  Sparkles,
  HelpCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  CornerUpLeft,
  DollarSign,
  Calendar,
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function ExecutiveApprovalsPage() {
  const { toast } = useToast();
  const { 
    proposals, 
    fetchApprovalInbox,
    submitExecutiveApproval,
    isLoadingProposals
  } = useOpdStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED_RETURNED' | 'ALL'>('PENDING_APPROVAL');
  const [selectedProposal, setSelectedProposal] = useState<OpdProposal | null>(null);

  // Decision Modals
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REJECT' | 'RETURN' | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [approvedBudget, setApprovedBudget] = useState<number>(0);
  const [fiscalYear, setFiscalYear] = useState<number>(new Date().getFullYear());
  const [finalExecutionScheme, setFinalExecutionScheme] = useState<'SWAKELOLA' | 'PENUNJUKAN_LANGSUNG' | 'E_KATALOG' | 'TENDER'>('SWAKELOLA');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchApprovalInbox({ status: 'ALL' });
  }, [fetchApprovalInbox]);

  // Proposals that have scoring data or are in review/pending decision
  const scoredProposals = proposals.filter(p => !!p.scoringData || p.status === 'IN_REVIEW' || p.status === 'SCORED' || p.status === 'APPROVED' || p.status === 'IN_PROGRESS' || p.status === 'REJECTED');

  const filteredProposals = scoredProposals.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.opdName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchQuery.toLowerCase());

    const isPending = (p.status === 'SCORED' || p.status === 'IN_REVIEW') && !p.executiveDecision;
    const isApproved = p.status === 'APPROVED' || p.status === 'IN_PROGRESS' || p.status === 'COMPLETED' || p.executiveDecision?.decision === 'APPROVED';
    const isRejectedOrReturned = p.status === 'REJECTED' || p.status === 'REVISION_REQUIRED' || p.executiveDecision?.decision === 'REJECTED' || p.executiveDecision?.decision === 'RETURNED' || p.executiveDecision?.decision === 'REVISION_REQUIRED';

    if (activeFilter === 'PENDING_APPROVAL') return isPending && matchesSearch;
    if (activeFilter === 'APPROVED') return isApproved && matchesSearch;
    if (activeFilter === 'REJECTED_RETURNED') return isRejectedOrReturned && matchesSearch;
    return matchesSearch;
  });

  const handleOpenDecisionModal = (type: 'APPROVE' | 'REJECT' | 'RETURN', prop: OpdProposal) => {
    setSelectedProposal(prop);
    setDecisionType(type);
    setApprovedBudget(prop.estimatedBudget || 0);
    setFiscalYear(new Date().getFullYear());

    const defaultScheme = (prop.scoringData?.executionMethod || 
      (prop.scoringData?.researchScheme === 'INTERNAL_BRIDA' ? 'SWAKELOLA' : 'KERJASAMA')) as any;
    setFinalExecutionScheme(
      ['SWAKELOLA', 'PENUNJUKAN_LANGSUNG', 'E_KATALOG', 'TENDER'].includes(defaultScheme)
        ? defaultScheme
        : 'SWAKELOLA'
    );

    if (type === 'APPROVE') {
      setDecisionNotes('Disetujui untuk dilaksanakan sebagai agenda riset prioritas daerah tahun anggaran berjalan.');
    } else if (type === 'REJECT') {
      setDecisionNotes('Usulan belum memenuhi kriteria prioritas daerah mendesak pada tahun anggaran ini.');
    } else {
      setDecisionNotes('Mohon tim penelaah BRIDA melakukan pendalaman studi kelayakan dan koordinasi ulang dengan OPD pengusul.');
    }
  };

  const handleExecuteDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal || !decisionType) return;

    setIsSubmitting(true);
    try {
      const backendDecision = decisionType === 'APPROVE' 
        ? 'APPROVED' 
        : decisionType === 'REJECT' 
        ? 'REJECTED' 
        : 'REVISION_REQUIRED';

      await submitExecutiveApproval(selectedProposal.id, {
        decision: backendDecision,
        approvedBudget: decisionType === 'APPROVE' ? Number(approvedBudget) : null,
        fiscalYear: decisionType === 'APPROVE' ? Number(fiscalYear) : null,
        finalExecutionScheme: decisionType === 'APPROVE' ? finalExecutionScheme : null,
        notes: decisionNotes.trim(),
      });

      toast(
        decisionType === 'APPROVE'
          ? 'Usulan riset berhasil disetujui dan dialokasikan pagu definitif.'
          : decisionType === 'REJECT'
          ? 'Usulan riset telah ditolak oleh Kepala BRIDA.'
          : 'Usulan riset dikembalikan ke tim penelaah BRIDA untuk revisi.',
        'success'
      );

      setDecisionType(null);
      setSelectedProposal(null);
    } catch (err: any) {
      toast(err.message || 'Gagal memproses keputusan Kepala BRIDA', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = scoredProposals.filter(p => (p.status === 'SCORED' || p.status === 'IN_REVIEW') && !p.executiveDecision).length;
  const approvedCount = scoredProposals.filter(p => p.status === 'APPROVED' || p.status === 'IN_PROGRESS' || p.status === 'COMPLETED' || p.executiveDecision?.decision === 'APPROVED').length;
  const rejectedCount = scoredProposals.filter(p => p.status === 'REJECTED' || p.status === 'REVISION_REQUIRED' || p.executiveDecision?.decision === 'REJECTED' || p.executiveDecision?.decision === 'RETURNED' || p.executiveDecision?.decision === 'REVISION_REQUIRED').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-[#0f2c59] p-8 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-black">
        <div>
          <div className="flex items-center gap-2 text-sky-300 text-xs font-black tracking-widest uppercase mb-2">
            <ClipboardCheck className="w-4 h-4" />
            Modul 2: Kepala BRIDA
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Approval Usulan & Penentuan Prioritas Riset
          </h1>
          <p className="text-slate-200 text-xs mt-1.5 max-w-2xl leading-relaxed">
            Keputusan final pimpinan untuk menyetujui, menolak, atau mengembalikan usulan penelitian yang telah melalui tahap verifikasi administrasi dan scoring teknis oleh tim penelaah BRIDA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchApprovalInbox({ status: 'ALL' })}
            className="flex items-center gap-2 bg-[#1b3b6f] hover:bg-blue-800 text-white font-semibold px-3.5 py-2.5 rounded-xl transition text-xs border border-blue-400"
            title="Muat Ulang Antrean"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProposals ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/executive/monitoring"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition shadow text-xs border border-blue-400"
          >
            <span>Supervisi Riset Berjalan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-black shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveFilter('PENDING_APPROVAL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeFilter === 'PENDING_APPROVAL'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Menunggu Keputusan ({pendingCount})
          </button>
          <button
            onClick={() => setActiveFilter('APPROVED')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeFilter === 'APPROVED'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Disetujui ({approvedCount})
          </button>
          <button
            onClick={() => setActiveFilter('REJECTED_RETURNED')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeFilter === 'REJECTED_RETURNED'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Ditolak / Dikembalikan ({rejectedCount})
          </button>
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Semua
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari usulan / OPD..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none text-slate-800"
          />
        </div>
      </div>

      {/* Grid of Proposals with Quick Review Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingProposals && filteredProposals.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-black text-center text-slate-400">
            <Loader2 className="w-8 h-8 mx-auto text-blue-600 animate-spin mb-3" />
            <p className="font-bold text-slate-700 text-sm">Memuat antrean persetujuan usulan...</p>
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-black text-center text-slate-400">
            <ClipboardCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-slate-700 text-sm">Tidak ada usulan dalam kategori ini</p>
            <p className="text-xs mt-1">Usulan yang telah diberi skor oleh tim penelaah akan otomatis masuk ke daftar tunggu persetujuan.</p>
          </div>
        ) : (
          filteredProposals.map((prop) => {
            const score = prop.scoringData?.totalScore !== undefined && prop.scoringData?.totalScore !== null
              ? prop.scoringData.totalScore
              : null;
            const isApproved = prop.executiveDecision?.decision === 'APPROVED' || prop.status === 'APPROVED' || prop.status === 'IN_PROGRESS' || prop.status === 'COMPLETED';
            const isRejected = prop.executiveDecision?.decision === 'REJECTED' || prop.status === 'REJECTED';
            const isReturned = prop.executiveDecision?.decision === 'RETURNED' || prop.executiveDecision?.decision === 'REVISION_REQUIRED' || prop.status === 'REVISION_REQUIRED';

            return (
              <div 
                key={prop.id}
                className="bg-white rounded-2xl border border-black shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                {/* Card Top */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      {prop.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-500">Skor Review:</span>
                      <span className="text-xs font-black text-blue-900 bg-blue-50 border border-blue-300 px-2 py-0.5 rounded-md font-mono">
                        {score !== null ? `${score} / 100` : 'Belum diskor'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2">{prop.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      {prop.opdName}
                    </p>
                  </div>

                  {/* Panel Review Cepat: Scoring Breakdown & Summary */}
                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-300">
                    <div className="flex justify-between items-center text-slate-700">
                      <span>Usulan Pagu Anggaran:</span>
                      <span className="font-black text-blue-900 font-mono">
                        {prop.estimatedBudget 
                          ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(prop.estimatedBudget)
                          : 'Sesuai Standar Biaya'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700">
                      <span>Data Dukung OPD:</span>
                      <span className="font-bold text-slate-800">
                        {prop.supportingDocuments && prop.supportingDocuments.length > 0 
                          ? `✓ ${prop.supportingDocuments.length} Dokumen` 
                          : '— Tanpa Lampiran'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700 pt-1 border-t border-slate-300">
                      <span>Kesesuaian Visi-Misi:</span>
                      <span className="font-bold text-slate-900">{prop.scoringData?.visionAlignmentScore || 90} Poin</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700">
                      <span>Urgensi Masalah:</span>
                      <span className="font-bold text-slate-900">{prop.scoringData?.urgencyScore || 85} Poin</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700">
                      <span>Rekomendasi Metode:</span>
                      <span className="font-bold text-blue-900">
                        {prop.scoringData?.executionMethod === 'SWAKELOLA'
                          ? 'Swakelola'
                          : prop.scoringData?.executionMethod === 'PENUNJUKAN_LANGSUNG'
                          ? 'Penunjukan Langsung'
                          : prop.scoringData?.executionMethod === 'E_KATALOG'
                          ? 'E-Katalog'
                          : prop.scoringData?.executionMethod === 'TENDER'
                          ? 'Tender'
                          : (prop.scoringData?.researchScheme === 'KERJASAMA' ? 'Kerjasama' : 'Swakelola')}
                      </span>
                    </div>
                  </div>

                  {/* Problem brief */}
                  <p className="text-xs text-slate-600 line-clamp-2 italic">
                    "{prop.problemStatement}"
                  </p>

                  {/* Decision Tag if already decided */}
                  {prop.executiveDecision && (
                    <div className={`p-2.5 rounded-lg text-xs font-bold border border-black ${
                      prop.executiveDecision.decision === 'APPROVED' 
                        ? 'bg-blue-50 text-blue-900' 
                        : 'bg-slate-100 text-slate-900'
                    }`}>
                      <span className="block text-[10px] uppercase text-slate-500">Keputusan Kepala BRIDA:</span>
                      {prop.executiveDecision.decision === 'APPROVED' 
                        ? `Disetujui Resmi ${prop.executiveDecision.approvedBudget ? `(Pagu: Rp ${prop.executiveDecision.approvedBudget.toLocaleString('id-ID')})` : ''}` 
                        : prop.executiveDecision.decision === 'REJECTED'
                        ? 'Ditolak'
                        : 'Dikembalikan ke Penelaah'}
                      {prop.executiveDecision.notes && (
                        <p className="font-normal text-[11px] mt-0.5">{prop.executiveDecision.notes}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-slate-50 border-t border-black flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenDecisionModal('APPROVE', prop)}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow flex items-center justify-center gap-1 border border-blue-700"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleOpenDecisionModal('RETURN', prop)}
                    className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border border-slate-300"
                    title="Kembalikan ke tim penelaah"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5 text-blue-600" />
                    Return
                  </button>
                  <button
                    onClick={() => handleOpenDecisionModal('REJECT', prop)}
                    className="py-2 px-3 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border border-black"
                    title="Tolak usulan"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Decision Confirmation Modal */}
      {decisionType && selectedProposal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-black overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-white bg-[#0f2c59] border-b border-black">
              <h3 className="font-black text-lg flex items-center gap-2">
                {decisionType === 'APPROVE' && <CheckCircle2 className="w-5 h-5 text-sky-300" />}
                {decisionType === 'REJECT' && <XCircle className="w-5 h-5 text-slate-300" />}
                {decisionType === 'RETURN' && <RotateCcw className="w-5 h-5 text-sky-300" />}
                {decisionType === 'APPROVE' ? 'Setujui Usulan Penelitian' :
                 decisionType === 'REJECT' ? 'Tolak Usulan Penelitian' :
                 'Kembalikan Usulan ke Tim Staff Penelaah'}
              </h3>
              <p className="text-xs text-white/80 mt-1 line-clamp-1">{selectedProposal.title}</p>
            </div>

            <form onSubmit={handleExecuteDecision} className="p-6 space-y-4">
              {decisionType === 'APPROVE' && (
                <div className="space-y-3 bg-blue-50/70 p-4 rounded-xl border border-blue-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-blue-950 uppercase mb-1">
                        Pagu Definitif (Rp):
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={approvedBudget}
                        onChange={(e) => setApprovedBudget(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold text-blue-950 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-blue-950 uppercase mb-1">
                        Tahun Anggaran:
                      </label>
                      <input
                        type="number"
                        required
                        min={2025}
                        max={2035}
                        value={fiscalYear}
                        onChange={(e) => setFiscalYear(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold text-blue-950 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-blue-950 uppercase mb-1">
                      Skema Pelaksanaan Definitif:
                    </label>
                    <select
                      value={finalExecutionScheme}
                      onChange={(e) => setFinalExecutionScheme(e.target.value as any)}
                      className="w-full p-2 bg-white border border-blue-300 rounded-lg text-xs font-bold text-blue-950 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="SWAKELOLA">Swakelola (Tim Litbang Internal BRIDA)</option>
                      <option value="PENUNJUKAN_LANGSUNG">Penunjukan Langsung (Pakar / Lembaga Khusus)</option>
                      <option value="E_KATALOG">E-Katalog Sektoral / Riset</option>
                      <option value="TENDER">Tender / Seleksi Terbuka</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                  Catatan / Disposisi Resmi Kepala BRIDA:
                </label>
                <textarea
                  rows={4}
                  required
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none leading-relaxed text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => { setDecisionType(null); setSelectedProposal(null); }}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition disabled:opacity-50 border border-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-lg transition shadow flex items-center gap-1.5 disabled:opacity-50 border ${
                    decisionType === 'APPROVE' ? 'bg-blue-600 hover:bg-blue-700 border-blue-800' :
                    decisionType === 'REJECT' ? 'bg-slate-900 hover:bg-black border-black' :
                    'bg-[#1b3b6f] hover:bg-blue-900 border-blue-950'
                  }`}
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Konfirmasi Keputusan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

