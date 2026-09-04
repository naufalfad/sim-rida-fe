export interface SupportingDocument {
  id: string;
  name: string;
  type: 'Company Profile' | 'Proposal' | 'Legal Document' | 'Qualification Document' | 'Technical Proposal' | 'Price Proposal';
  uploadDate: string;
  status: string;
}

export interface CandidateEvaluation {
  competence: number;   // 1-5
  experience: number;   // 1-5
  capacity: number;     // 1-5
  methodology: number;  // 1-5
  cost: number;         // 1-5
  availability: number; // 1-5
  strength: string;
  weakness: string;
  risk: string;
  notes: string;
  recommendation: 'RECOMMENDED' | 'NOT_RECOMMENDED';
}

export interface Candidate {
  id: string;
  researchId: string;
  name: string;
  type: 'Perguruan Tinggi' | 'Lembaga Penelitian' | 'Konsultan' | 'Perusahaan' | 'Organisasi' | 'Internal Pemerintah' | 'Lainnya';
  specialization: string;
  address: string;
  contact: string;
  email: string;
  website: string;
  price: number; // Candidate bidding price to compare with RAB
  notes: string;
  status: 'CANDIDATE' | 'EVALUATED' | 'RECOMMENDED' | 'SELECTED';
  documents: SupportingDocument[];
  evaluation?: CandidateEvaluation;
}

export const INITIAL_CANDIDATES: Record<string, Candidate[]> = {};
