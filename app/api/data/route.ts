import {
  dbQueryFailedResponse,
  dbSuccessResponse,
  requireDb,
} from '@/lib/api-db';
import { JadwalKuliah, JadwalTambahan, Tugas, Catatan, KontenCalendar, Proyek } from '@/lib/types';

const ROUTE = 'api/data';

export async function GET() {
  const dbCtx = requireDb(ROUTE);
  if (!dbCtx.ok) return dbCtx.response;

  try {
    const [rawKuliah, rawTambahan, rawTugas, rawCatatan, rawKonten, rawProyek] = await Promise.all([
      dbCtx.sql`SELECT id, hari, jam_mulai as "jamMulai", jam_selesai as "jamSelesai", mata_kuliah as "mataKuliah", ruang, kelas FROM jadwal_kuliah;`,
      dbCtx.sql`SELECT id, tanggal, jam, judul, catatan FROM jadwal_tambahan ORDER BY tanggal ASC;`,
      dbCtx.sql`SELECT id, title, cat, deadline, done FROM tugas;`,
      dbCtx.sql`SELECT id, content, created_at as "createdAt" FROM catatan;`,
      dbCtx.sql`SELECT id, tanggal, platform, status, caption FROM konten_calendar ORDER BY tanggal ASC;`,
      dbCtx.sql`SELECT id, nama, status, deskripsi FROM proyek;`,
    ]);

    console.log(`[${ROUTE}] GET success — all tables queried`);

    return dbSuccessResponse({
      connected: true,
      jadwalKuliah: rawKuliah as unknown as JadwalKuliah[],
      jadwalTambahan: rawTambahan as unknown as JadwalTambahan[],
      tugas: rawTugas as unknown as Tugas[],
      catatan: rawCatatan as unknown as Catatan[],
      konten: rawKonten as unknown as KontenCalendar[],
      proyek: rawProyek as unknown as Proyek[],
    });
  } catch (error) {
    return dbQueryFailedResponse(ROUTE, error);
  }
}
