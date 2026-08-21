export interface ResearchType {
  id: string;
  name: string;
  description?: string;
}

export interface Research {
  id: string;
  problemId: string;
  title: string;
  researchTypeId: string;
  objective: string;
  researchQuestions: string;
  scope: string;
  expectedOutput: string;
  expectedOutcome: string;
  successIndicators: string;
  estimatedBudget: number;
  estimatedDurationMonths: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResearchPayload {
  problemId: string;
  title: string;
  researchTypeId: string;
  objective: string;
  researchQuestions: string;
  scope: string;
  expectedOutput: string;
  expectedOutcome: string;
  successIndicators: string;
  estimatedBudget: number;
  estimatedDurationMonths: number;
}

export interface RabItem {
  id?: string;
  description: string;
  volume: number;
  unit: string;
  unitPrice: number;
}

export interface Kak {
  id: string;
  researchId: string;
  dasarPemikiran: string;
  maksudTujuan: string;
  ruangLingkup: string;
  metodologi: string;
  output: string;
  outcome: string;
  indikatorKinerja: string;
  jadwalPelaksanaan: string;
  penutup: string;
  rabItems: RabItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateKakPayload {
  dasarPemikiran: string;
  maksudTujuan: string;
  ruangLingkup: string;
  metodologi: string;
  output: string;
  outcome: string;
  indikatorKinerja: string;
  jadwalPelaksanaan: string;
  penutup: string;
  rabItems: RabItem[];
}
