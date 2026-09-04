export interface RabItem {
  id: string;
  category: string;
  component: string;
  description: string;
  volume: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

export interface RabDocument {
  researchId: string;
  items: RabItem[];
  status: 'NOT_STARTED' | 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REVISION_REQUIRED';
  version: string;
  updatedBy: string;
  updatedAt: string;
}

export const DUMMY_RAB_CATEGORIES = [
  'Tenaga Ahli',
  'Tenaga Pendukung',
  'Perjalanan',
  'Pengumpulan Data',
  'Pengolahan Data',
  'Workshop/FGD',
  'Dokumentasi',
  'Peralatan',
  'Administrasi',
  'Lainnya'
];

export const INITIAL_RAB: Record<string, RabDocument> = {};
