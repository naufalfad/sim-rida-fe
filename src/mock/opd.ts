export interface OPDRecord {
  id: string;
  code: string;
  name: string;
  shortName: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export const MOCK_OPDS: OPDRecord[] = [
  {
    id: 'OPD-001',
    code: 'OPD-001',
    name: 'Dinas Komunikasi dan Informatika',
    shortName: 'Diskominfo',
    description: 'Pengelola infrastruktur TIK dan Satu Data Daerah.',
    status: 'ACTIVE',
  },
  {
    id: 'OPD-002',
    code: 'OPD-002',
    name: 'Badan Perencanaan Pembangunan Daerah',
    shortName: 'Bappeda',
    description: 'Perencanaan pembangunan dan evaluasi indikator makro daerah.',
    status: 'ACTIVE',
  },
  {
    id: 'OPD-003',
    code: 'OPD-003',
    name: 'Dinas Kesehatan',
    shortName: 'Dinkes',
    description: 'Penyelenggara pelayanan kesehatan masyarakat dan faskes daerah.',
    status: 'ACTIVE',
  },
  {
    id: 'OPD-004',
    code: 'OPD-004',
    name: 'Dinas Lingkungan Hidup',
    shortName: 'DLH',
    description: 'Pengelolaan lingkungan hidup dan persampahan daerah.',
    status: 'ACTIVE',
  },
];
