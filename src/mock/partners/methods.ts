export type MethodType = 'SWAKELOLA' | 'PENUNJUKAN_LANGSUNG' | 'E_KATALOG' | 'TENDER' | '';

export interface InternalTeamMember {
  id: string;
  name: string;
  position: string;
  role: string;
  expertise: string;
}

export interface MethodSelection {
  researchId: string;
  method: MethodType;
  justification: string;
  swakelolaDetails?: {
    unitPelaksana: string;
    rencanaPelaksana: string;
    internalTeam: InternalTeamMember[];
  };
  // Specific method parameters
  procurementReference?: string; // Tender reference
  catalogReference?: string; // E-Katalog reference
  status: 'NOT_STARTED' | 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REVISION_REQUIRED';
  partnerStatus: 'NOT_STARTED' | 'DRAFT' | 'EVALUATED' | 'RECOMMENDED' | 'SELECTED';
  updatedBy: string;
  updatedAt: string;
  decisionNotes: string;
  decisionBy: string;
  decisionDate: string;
}

export const INITIAL_METHODS: Record<string, MethodSelection> = {};
