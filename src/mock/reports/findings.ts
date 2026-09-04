export interface Finding {
  id: string;
  researchId: string;
  title: string;
  description: string;
  evidence: string; // mock file name reference
  impact: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  notes: string;
}

export const INITIAL_FINDINGS: Record<string, Finding[]> = {};
