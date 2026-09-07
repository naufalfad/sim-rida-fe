/**
 * Utility to generate and download standard Timeline Excel/CSV templates
 */

export function downloadTimelineTemplate(researchTitle?: string, opdName?: string) {
  const title = researchTitle || 'Penelitian Daerah SIM-RIDA';
  const opd = opdName || 'BRIDA Litbang';
  const currentDate = new Date().toLocaleDateString('id-ID');

  const csvRows = [
    ['TEMPLATE TIMELINE PELAKSANAAN RISET DAERAH (SIM-RIDA)'],
    [`Judul Riset: "${title.replace(/"/g, '""')}"`],
    [`Unit Pengusul / OPD: "${opd.replace(/"/g, '""')}"`],
    [`Tanggal Template: ${currentDate}`],
    [''],
    [
      'No',
      'Tahapan / Rincian Kegiatan Riset',
      'Target Output / Luaran',
      'Waktu Mulai',
      'Waktu Selesai',
      'Penanggung Jawab (PIC)',
      'Status Pelaksanaan',
      'Keterangan / Catatan',
    ],
    [
      '1',
      'Persiapan & Rapat Koordinasi Tim Peneliti',
      'SK Tim Kerja & Matriks Rencana Kerja',
      'Bulan 1 - M1',
      'Bulan 1 - M2',
      'Ketua Tim Peneliti',
      'Selesai',
      'Koordinasi teknis awal bersama tim litbang',
    ],
    [
      '2',
      'Studi Literatur & Penyusunan Instrumen Kuesioner/Survei',
      'Draf Panduan Wawancara & Lembar Kuesioner',
      'Bulan 1 - M3',
      'Bulan 1 - M4',
      'Peneliti Bidang Terkait',
      'Selesai',
      'Uji coba instrumen survei',
    ],
    [
      '3',
      'Pengumpulan Data Primer & Survei Lapangan',
      'Rekap Tabulasi Data Responden Lapangan',
      'Bulan 2 - M1',
      'Bulan 2 - M4',
      'Tim Surveyor Lapangan',
      'Sedang Berjalan',
      'Meliputi target sampel wilayah',
    ],
    [
      '4',
      'Focus Group Discussion (FGD) Bersama OPD Terkait',
      'Berita Acara & Rekomendasi Masukan OPD',
      'Bulan 3 - M1',
      'Bulan 3 - M2',
      'BRIDA & Tim Peneliti',
      'Direncanakan',
      'Pertemuan lintas instansi',
    ],
    [
      '5',
      'Pengolahan Data, Analisis Kualitatif & Kuantitatif',
      'Matriks Temuan & Tabulasi Analisis',
      'Bulan 3 - M3',
      'Bulan 3 - M4',
      'Analis Kebijakan / Peneliti',
      'Direncanakan',
      'Analisis statistik & gap kebijakan',
    ],
    [
      '6',
      'Penyusunan Draf Laporan Akhir & Policy Brief',
      'Dokumen Draf Naskah Akademis / Riset',
      'Bulan 4 - M1',
      'Bulan 4 - M3',
      'Tim Peneliti',
      'Direncanakan',
      'Sistematika sesuai pedoman riset',
    ],
    [
      '7',
      'Seminar Hasil / Uji Publik Substansi Riset',
      'Notula Seminar, Rekomendasi & Daftar Hadir',
      'Bulan 4 - M4',
      'Bulan 4 - M4',
      'BRIDA & Dewan Pakar',
      'Direncanakan',
      'Pemaparan hasil akhir riset',
    ],
    [
      '8',
      'Finalisasi Laporan Akhir & Penyerahan Hasil Riset',
      'Laporan Akhir Terjilid & Dokumen Policy Brief',
      'Bulan 5 - M1',
      'Bulan 5 - M2',
      'Ketua Tim Peneliti',
      'Direncanakan',
      'Penyerahan resmi ke Kepala BRIDA',
    ],
  ];

  // Convert array to CSV string formatted with UTF-8 BOM for Microsoft Excel
  const csvContent =
    '\uFEFF' +
    csvRows
      .map((row) =>
        row
          .map((cell) => {
            const escaped = (cell || '').replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(',')
      )
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Template_Timeline_Pelaksanaan_Riset_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
