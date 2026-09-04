export interface EvidenceFile {
  id: string;
  name: string;
  type: 'PDF' | 'XLSX' | 'DOCX' | 'JPG';
  uploadDate: string;
  uploadedBy: string;
}

export interface MonitoringRecord {
  id: string;
  researchId: string;
  monitoringDate: string;
  overallProgress: number;
  currentActivity: string;
  achievement: string;
  issues: string;
  followUp: string;
  status: 'ON_TRACK' | 'MINOR_DELAY' | 'DELAYED' | 'AT_RISK';
  evidences: EvidenceFile[];
}

export const INITIAL_MONITORING: Record<string, MonitoringRecord[]> = {};
