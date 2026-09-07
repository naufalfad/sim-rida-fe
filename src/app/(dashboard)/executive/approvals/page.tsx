'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  useOpdStore, 
  OpdProposal 
} from '@/store/useOpdStore';
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
  CornerUpLeft
} from 'lucide-react';

export default function ExecutiveApprovalsPage() {
  const { 
    proposals, 
    executiveApproveProposal, 
    executiveRejectProposal, 
    executiveReturnProposal 
  } = useOpdStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED_RETURNED' | 'ALL'>('PENDING_APPROVAL');
  const [selectedProposal, setSelectedProposal] = useState<OpdProposal | null>(null);

  // Decision Modals
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REJECT' | 'RETURN' | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');

  // Proposals that have scoring data or are in review/pending decision
  const scoredProposals = proposals.filter(p => !!p.scoringData || p.status === 'IN_REVIEW' || p.status === 'APPROVED' || p.status === 'IN_PROGRESS');

  const filteredProposals = scoredProposals.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.opdName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchQuery.toLowerCase());

    const isPending = !p.executiveDecision && (p.status === 'IN_REVIEW' || (!!p.scoringData && p.status !== 'COMPLETED'));
    const isApproved = p.executiveDecision?.decision === 'APPROVED' || p.status === 'IN_PROGRESS' || p.status === 'COMPLETED';
    const isRejectedOrReturned = p.executiveDecision?.decision === 'REJECTED' || p.executiveDecision?.decision === 'RETURNED' || p.status === 'REVISION_REQUIRED';

    if (activeFilter === 'PENDING_APPROVAL') return isPending && matchesSearch;
    if (activeFilter === 'APPROVED') return isApproved && matchesSearch;
    if (activeFilter === 'REJECTED_RETURNED') return isRejectedOrReturned && matchesSearch;
    return matchesSearch;
  });

  const handleOpenDecisionModal = (type: 'APPROVE' | 'REJECT' | 'RETURN', prop: OpdProposal) => {
    setSelectedProposal(prop);
    setDecisionType(type);
    if (type === 'APPROVE') {
      setDecisionNotes('Disetujui untuk dilaksanakan sebagai agenda riset prioritas daerah tahun anggaran berjalan.');
    } else if (type === 'REJECT') {
      setDecisionNotes('Usulan belum memenuhi kriteria prioritas daerah mendesak pada tahun anggaran ini.');
    } else {
      setDecisionNotes('Mohon tim peneliti BRIDA melakukan pendalaman studi kelayakan dan koordinasi ulang dengan OPD terkait.');
    }
  };

  const handleExecuteDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal || !decisionType) return;

    if (decisionType === 'APPROVE') {
      executiveApproveProposal(selectedProposal.id, decisionNotes);
    } else if (decisionType === 'REJECT') {
      executiveRejectProposal(selectedProposal.id, decisionNotes);
    } else if (decisionType === 'RETURN') {
      executiveReturnProposal(selectedProposal.id, decisionNotes);
    }

    setDecisionType(null);
    setSelectedProposal(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 p-8 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-black tracking-widest uppercase mb-2">
            <ClipboardCheck className="w-4 h-4" />
            Modul 2: Kepala BRIDA
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Approval Usulan & Penentuan Prioritas Riset
          </h1>
          <p className="text-slate-300 text-xs mt-1.5 max-w-2xl leading-relaxed">
            Keputusan final pimpinan untuk menyetujui, menolak, atau mengembalikan usulan penelitian yang telah melalui tahap verifikasi administrasi dan scoring teknis oleh tim penelaah BRIDA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/executive/monitoring"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition shadow text-xs"
          >
            <span>Supervisi Riset Berjalan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveFilter('PENDING_APPROVAL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeFilter === 'PENDING_APPROVAL'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Menunggu Keputusan ({scoredProposals.filter(p => !p.executiveDecision && (p.status === 'IN_REVIEW' || (!!p.scoringData && p.status !== 'COMPLETED'))).length})
          </button>
          <button
            onClick={() => setActiveFilter('APPROVED')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeFilter === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Disetujui ({scoredProposals.filter(p => p.executiveDecision?.decision === 'APPROVED' || p.status === 'IN_PROGRESS' || p.status === 'COMPLETED').length})
          </button>
          <button
            onClick={() => setActiveFilter('REJECTED_RETURNED')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeFilter === 'REJECTED_RETURNED'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ditolak / Dikembalikan ({scoredProposals.filter(p => p.executiveDecision?.decision === 'REJECTED' || p.executiveDecision?.decision === 'RETURNED' || p.status === 'REVISION_REQUIRED').length})
          </button>
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeFilter === 'ALL'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Grid of Proposals with Quick Review Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProposals.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
            <ClipboardCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-slate-700 text-sm">Tidak ada usulan dalam kategori ini</p>
            <p className="text-xs mt-1">Usulan yang telah diberi skor oleh tim penelaah akan otomatis masuk ke daftar tunggu persetujuan.</p>
          </div>
        ) : (
          filteredProposals.map((prop) => {
            const score = prop.scoringData?.totalScore || 85;
            const isApproved = prop.executiveDecision?.decision === 'APPROVED' || prop.status === 'IN_PROGRESS' || prop.status === 'COMPLETED';
            const isRejected = prop.executiveDecision?.decision === 'REJECTED' || prop.status === 'REVISION_REQUIRED';

            return (
              <div 
                key={prop.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                {/* Card Top */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded">
                      {prop.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-400">Skor Staff:</span>
                      <span className="text-sm font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        {score} / 100
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2">{prop.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {prop.opdName}
                    </p>
                  </div>

                  {/* Panel Review Cepat: Scoring Breakdown & Summary */}
                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-200/60">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Usulan Pagu Anggaran:</span>
                      <span className="font-black text-emerald-800 font-mono">
                        {prop.estimatedBudget 
                          ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(prop.estimatedBudget)
                          : 'Sesuai Standar Biaya'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Data Dukung OPD:</span>
                      <span className="font-bold text-slate-700">
                        {prop.supportingDocuments && prop.supportingDocuments.length > 0 
                          ? `✓ ${prop.supportingDocuments.length} Dokumen` 
                          : '— Tanpa Lampiran'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200">
                      <span>Kesesuaian Visi-Misi:</span>
                      <span className="font-bold text-slate-800">{prop.scoringData?.visionAlignmentScore || 90} Poin</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Urgensi Masalah:</span>
                      <span className="font-bold text-slate-800">{prop.scoringData?.urgencyScore || 85} Poin</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Rekomendasi Metode:</span>
                      <span className="font-bold text-emerald-800">
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
                    <div className={`p-2.5 rounded-lg text-xs font-bold ${
                      prop.executiveDecision.decision === 'APPROVED' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      <span className="block text-[10px] uppercase text-slate-400">Keputusan Kepala BRIDA:</span>
                      {prop.executiveDecision.decision === 'APPROVED' ? 'Disetujui Resmi' : 'Ditolak / Dikembalikan'}
                      {prop.executiveDecision.notes && (
                        <p className="font-normal text-[11px] mt-0.5">{prop.executiveDecision.notes}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenDecisionModal('APPROVE', prop)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow flex items-center justify-center gap-1"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleOpenDecisionModal('RETURN', prop)}
                    className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                    title="Kembalikan ke staff peneliti"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" />
                    Return
                  </button>
                  <button
                    onClick={() => handleOpenDecisionModal('REJECT', prop)}
                    className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
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
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className={`p-6 text-white ${
              decisionType === 'APPROVE' ? 'bg-gradient-to-r from-emerald-800 to-teal-800' :
              decisionType === 'REJECT' ? 'bg-gradient-to-r from-rose-800 to-red-900' :
              'bg-gradient-to-r from-amber-700 to-orange-800'
            }`}>
              <h3 className="font-black text-lg flex items-center gap-2">
                {decisionType === 'APPROVE' && <CheckCircle2 className="w-5 h-5" />}
                {decisionType === 'REJECT' && <XCircle className="w-5 h-5" />}
                {decisionType === 'RETURN' && <RotateCcw className="w-5 h-5" />}
                {decisionType === 'APPROVE' ? 'Setujui Usulan Penelitian' :
                 decisionType === 'REJECT' ? 'Tolak Usulan Penelitian' :
                 'Kembalikan Usulan ke Tim Staff Penelaah'}
              </h3>
              <p className="text-xs text-white/80 mt-1">{selectedProposal.title}</p>
            </div>

            <form onSubmit={handleExecuteDecision} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Catatan / Disposisi Resmi Kepala BRIDA:
                </label>
                <textarea
                  rows={4}
                  required
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setDecisionType(null); setSelectedProposal(null); }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-bold text-white rounded-lg transition shadow ${
                    decisionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    decisionType === 'REJECT' ? 'bg-rose-600 hover:bg-rose-700' :
                    'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  Konfirmasi Keputusan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
