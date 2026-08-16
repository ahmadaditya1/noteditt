export interface JadwalKuliah {
  id: string;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  jamMulai: string;
  jamSelesai: string;
  mataKuliah: string;
  ruang: string;
}

export interface JadwalTambahan {
  id: string;
  tanggal: string;
  jam: string;
  judul: string;
  catatan: string;
}

export type KategoriTugas = 'Kuliah' | 'Tikethub' | 'Porta Pic' | 'Personal';

export interface Tugas {
  id: string;
  title: string;
  cat: KategoriTugas;
  deadline: string;
  done: boolean;
}

export interface Catatan {
  id: string;
  content: string;
  createdAt: string;
}

export type PlatformKonten = 'Instagram' | 'TikTok' | 'Website' | 'Lainnya';
export type StatusKonten = 'Draft' | 'Review' | 'Terjadwal' | 'Publish';

export interface KontenCalendar {
  id: string;
  tanggal: string;
  platform: PlatformKonten;
  status: StatusKonten;
  caption: string;
}

export type StatusProyek = 'Rencana' | 'Berjalan' | 'Selesai';

export interface Proyek {
  id: string;
  nama: string;
  status: StatusProyek;
  deskripsi: string;
}

export type ActiveSection =
  | 'jadwal'
  | 'tugas'
  | 'catatan'
  | 'content'
  | 'proyek';
