import {
  dbQueryFailedResponse,
  dbSuccessResponse,
  requireDb,
} from '@/lib/api-db';

export const maxDuration = 10;
import { JadwalKuliah, JadwalTambahan, Tugas, Catatan, KontenCalendar, Proyek } from '@/lib/types';

const ROUTE = 'api/data';

export async function GET() {
  const dbCtx = requireDb(ROUTE);
  if (!dbCtx.ok) return dbCtx.response;

  try {
    const rows = await dbCtx.sql`
      SELECT 
        (SELECT coalesce(json_agg(t), '[]'::json) FROM (SELECT id, hari, jam_mulai as "jamMulai", jam_selesai as "jamSelesai", mata_kuliah as "mataKuliah", ruang, kelas FROM jadwal_kuliah) t) as "jadwalKuliah",
        (SELECT coalesce(json_agg(t), '[]'::json) FROM (SELECT id, tanggal, jam, judul, catatan FROM jadwal_tambahan ORDER BY tanggal ASC) t) as "jadwalTambahan",
        (SELECT coalesce(json_agg(t), '[]'::json) FROM (SELECT id, title, cat, deadline, done FROM tugas) t) as "tugas",
        (SELECT coalesce(json_agg(t), '[]'::json) FROM (SELECT id, content, created_at as "createdAt" FROM catatan) t) as "catatan",
        (SELECT coalesce(json_agg(t), '[]'::json) FROM (SELECT id, tanggal, platform, status, caption FROM konten_calendar ORDER BY tanggal ASC) t) as "konten",
        (SELECT coalesce(json_agg(t), '[]'::json) FROM (SELECT id, nama, status, deskripsi FROM proyek) t) as "proyek";
    `;

    const row = rows[0] || {};
    console.log(`[${ROUTE}] GET success — single round-trip query`);

    return dbSuccessResponse({
      connected: true,
      jadwalKuliah: (row.jadwalKuliah || []) as JadwalKuliah[],
      jadwalTambahan: (row.jadwalTambahan || []) as JadwalTambahan[],
      tugas: (row.tugas || []) as Tugas[],
      catatan: (row.catatan || []) as Catatan[],
      konten: (row.konten || []) as KontenCalendar[],
      proyek: (row.proyek || []) as Proyek[],
    });
  } catch (error) {
    console.warn(`[${ROUTE}] Combined query failed, trying sequential query...`, error);
    try {
      const rawKuliah = await dbCtx.sql`SELECT id, hari, jam_mulai as "jamMulai", jam_selesai as "jamSelesai", mata_kuliah as "mataKuliah", ruang, kelas FROM jadwal_kuliah;`;
      const rawTambahan = await dbCtx.sql`SELECT id, tanggal, jam, judul, catatan FROM jadwal_tambahan ORDER BY tanggal ASC;`;
      const rawTugas = await dbCtx.sql`SELECT id, title, cat, deadline, done FROM tugas;`;
      const rawCatatan = await dbCtx.sql`SELECT id, content, created_at as "createdAt" FROM catatan;`;
      const rawKonten = await dbCtx.sql`SELECT id, tanggal, platform, status, caption FROM konten_calendar ORDER BY tanggal ASC;`;
      const rawProyek = await dbCtx.sql`SELECT id, nama, status, deskripsi FROM proyek;`;

      return dbSuccessResponse({
        connected: true,
        jadwalKuliah: rawKuliah as unknown as JadwalKuliah[],
        jadwalTambahan: rawTambahan as unknown as JadwalTambahan[],
        tugas: rawTugas as unknown as Tugas[],
        catatan: rawCatatan as unknown as Catatan[],
        konten: rawKonten as unknown as KontenCalendar[],
        proyek: rawProyek as unknown as Proyek[],
      });
    } catch (fallbackError) {
      return dbQueryFailedResponse(ROUTE, fallbackError);
    }
  }
}
