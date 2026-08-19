import { NextResponse } from 'next/server';
import { ensureTablesExist, getDb } from '@/lib/db';
import { JadwalKuliah, JadwalTambahan, Tugas, Catatan, KontenCalendar, Proyek } from '@/lib/types';

export async function GET() {
  const sql = getDb();
  if (!sql) {
    return NextResponse.json({
      connected: false,
      message: 'Database belum terhubung (menggunakan penyimpanan lokal browser).',
    });
  }

  await ensureTablesExist();

  try {
    const [rawKuliah, rawTambahan, rawTugas, rawCatatan, rawKonten, rawProyek] = await Promise.all([
      sql`SELECT id, hari, jam_mulai as "jamMulai", jam_selesai as "jamSelesai", mata_kuliah as "mataKuliah", ruang FROM jadwal_kuliah;`,
      sql`SELECT id, tanggal, jam, judul, catatan FROM jadwal_tambahan ORDER BY tanggal ASC;`,
      sql`SELECT id, title, cat, deadline, done FROM tugas;`,
      sql`SELECT id, content, created_at as "createdAt" FROM catatan;`,
      sql`SELECT id, tanggal, platform, status, caption FROM konten_calendar ORDER BY tanggal ASC;`,
      sql`SELECT id, nama, status, deskripsi FROM proyek;`,
    ]);

    return NextResponse.json({
      connected: true,
      jadwalKuliah: rawKuliah as unknown as JadwalKuliah[],
      jadwalTambahan: rawTambahan as unknown as JadwalTambahan[],
      tugas: rawTugas as unknown as Tugas[],
      catatan: rawCatatan as unknown as Catatan[],
      konten: rawKonten as unknown as KontenCalendar[],
      proyek: rawProyek as unknown as Proyek[],
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ connected: false, error: 'Gagal mengambil data dari database.' }, { status: 500 });
  }
}
