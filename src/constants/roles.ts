export type UserRole = 'OPD' | 'BRIDA' | 'KEPALA_BRIDA' | 'RESEARCHER';

export const ROLES: Record<UserRole, UserRole> = {
  OPD: 'OPD',
  BRIDA: 'BRIDA',
  KEPALA_BRIDA: 'KEPALA_BRIDA',
  RESEARCHER: 'RESEARCHER',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  OPD: 'Organisasi Perangkat Daerah (OPD)',
  BRIDA: 'BRIDA (Operational Manager)',
  KEPALA_BRIDA: 'Kepala BRIDA (Decision Maker)',
  RESEARCHER: 'Peneliti / Mitra Pelaksana',
};
