import { User } from '@/types/auth';

export const MOCK_USERS: User[] = [
  {
    id: 'usr-001',
    name: 'Budi Santoso, S.T., M.Si.',
    username: 'opd',
    role: 'OPD',
    department: 'Bappeda Litbang Daerah',
    email: 'budi.santoso@pemda.go.id',
  },
  {
    id: 'usr-002',
    name: 'Dr. Herianto, M.Si.',
    username: 'brida',
    role: 'BRIDA',
    department: 'Bidang Riset dan Inovasi BRIDA',
    email: 'herianto@brida.go.id',
  },
  {
    id: 'usr-003',
    name: 'Prof. Dr. Ir. Wahyudi, M.T.',
    username: 'kepala',
    role: 'KEPALA_BRIDA',
    department: 'Kepala BRIDA',
    email: 'wahyudi@brida.go.id',
  },
  {
    id: 'usr-004',
    name: 'Prof. Dr. Anton Wibowo (Tim ITB)',
    username: 'peneliti',
    role: 'RESEARCHER',
    department: 'Institut Teknologi Bandung (ITB)',
    email: 'anton.wibowo@itb.ac.id',
  },
];
