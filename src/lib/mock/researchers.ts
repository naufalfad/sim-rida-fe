import { Researcher } from '@/types/brida';

export const INITIAL_RESEARCHERS: Researcher[] = [
  {
    id: 'usr-004',
    name: 'Prof. Dr. Anton Wibowo',
    expertise: 'Sistem Transportasi Perkotaan & Energi Terbarukan',
    institution: 'Institut Teknologi Bandung (ITB)',
    previousResearch: [
      { title: 'Kajian Kebijakan Mobil Listrik Nasional', year: 2024, role: 'Ketua Tim' },
      { title: 'Masterplan Trans Metro Bandung 2025', year: 2025, role: 'Anggota Ahli' },
    ],
    assignedResearchId: 'PRP-2026-002',
    assignedResearchTitle: 'Evaluasi Sistem Transportasi Publik Berbasis Listrik untuk Pengurangan Emisi',
  },
  {
    id: 'usr-005',
    name: 'Dr. Rian Nugroho',
    expertise: 'Sosiologi Kebudayaan & Pengembangan Pariwisata Daerah',
    institution: 'Universitas Indonesia (UI)',
    previousResearch: [
      { title: 'Revitalisasi Cagar Budaya Majapahit Trowulan', year: 2023, role: 'Ketua Tim' },
      { title: 'Studi Dampak Sosial Ekowisata Gunung Kidul', year: 2025, role: 'Ketua Tim' },
    ],
    assignedResearchId: 'PRP-2026-003',
    assignedResearchTitle: 'Strategi Pengembangan Destinasi Wisata Sejarah dan Budaya Unggulan Daerah',
  },
  {
    id: 'usr-006',
    name: 'Dr. Ir. Joko Prasetyo, M.T.',
    expertise: 'Teknik Hidrolika & Manajemen Drainase Kota',
    institution: 'Universitas Gadjah Mada (UGM)',
    previousResearch: [
      { title: 'Blueprint Drainase Pencegahan Banjir Solo', year: 2024, role: 'Ketua Tim' },
      { title: 'Audit Saluran Limpasan Air Kali Code Yogyakarta', year: 2025, role: 'Pakar Hidrologi' },
    ],
    assignedResearchId: 'PRP-2026-007',
    assignedResearchTitle: 'Kajian Sistem Drainase dan Pencegahan Genangan Air Perkotaan',
  },
  {
    id: 'usr-007',
    name: 'Dr. Sarah Amalia',
    expertise: 'Mikrobiologi Tanah & Pertanian Organik Berkelanjutan',
    institution: 'Institut Pertanian Bogor (IPB)',
    previousResearch: [
      { title: 'Pemetaan Unsur Hara Lahan Sawah Jawa Barat', year: 2024, role: 'Peneliti Utama' },
      { title: 'Formulasi Pupuk Hayati Pengganti Urea', year: 2025, role: 'Ketua Tim' },
    ],
  },
  {
    id: 'usr-008',
    name: 'Prof. Ir. Hendra Wijaya, Ph.D.',
    expertise: 'Teknologi Informasi & Tata Kelola Smart Government',
    institution: 'Institut Teknologi Sepuluh Nopember (ITS)',
    previousResearch: [
      { title: 'Sistem Informasi Administrasi Kependudukan Jatim', year: 2023, role: 'Ketua Tim' },
      { title: 'Roadmap Smart City Kota Surabaya 2025', year: 2025, role: 'Konsultan IT' },
    ],
  },
  {
    id: 'usr-009',
    name: 'Dr. Budi Utomo, M.PH.',
    expertise: 'Epidemiologi Kesehatan Masyarakat & Gizi Ibu Anak',
    institution: 'Universitas Airlangga (Unair)',
    previousResearch: [
      { title: 'Kajian Pencegahan Stunting Kabupaten Gresik', year: 2024, role: 'Ketua Tim' },
      { title: 'Evaluasi PMT Puskesmas Kota Surabaya', year: 2025, role: 'Peneliti Utama' },
    ],
  },
];
