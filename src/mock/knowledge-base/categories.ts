export interface Category {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastUpdated: string;
}

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Perencanaan Daerah', status: 'ACTIVE', lastUpdated: '26 Aug 2026' },
  { id: 'cat-2', name: 'Renstra OPD', status: 'ACTIVE', lastUpdated: '25 Aug 2026' },
  { id: 'cat-3', name: 'Renja OPD', status: 'ACTIVE', lastUpdated: '24 Aug 2026' },
  { id: 'cat-4', name: 'Data Statistik', status: 'ACTIVE', lastUpdated: '23 Aug 2026' },
  { id: 'cat-5', name: 'Regulasi', status: 'ACTIVE', lastUpdated: '22 Aug 2026' },
  { id: 'cat-6', name: 'Penelitian/Kajian', status: 'ACTIVE', lastUpdated: '21 Aug 2026' },
  { id: 'cat-7', name: 'Kebijakan Daerah', status: 'ACTIVE', lastUpdated: '20 Aug 2026' },
  { id: 'cat-8', name: 'Evaluasi Program', status: 'ACTIVE', lastUpdated: '19 Aug 2026' },
  { id: 'cat-9', name: 'Data Sektoral', status: 'ACTIVE', lastUpdated: '18 Aug 2026' },
  { id: 'cat-10', name: 'Dokumen BRIDA', status: 'ACTIVE', lastUpdated: '17 Aug 2026' },
];
