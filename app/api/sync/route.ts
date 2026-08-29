import { NextResponse } from 'next/server';
import { ensureTablesExist, getDb, formatDbError } from '@/lib/db';

export const preferredRegion = 'sin1';

/**
 * POST /api/sync
 *
 * Endpoint bulk sync: terima semua data sekaligus dalam 1 request,
 * lalu insert ke database. Jauh lebih cepat daripada kirim satu-satu.
 *
 * Body: { jadwalKuliah: [], jadwalTambahan: [], tugas: [], catatan: [], konten: [], proyek: [] }
 */
export async function POST(request: Request) {
  const sql = getDb();
  if (!sql) {
    return NextResponse.json({
      success: false,
      message: 'Database belum terhubung.',
    }, { status: 503 });
  }

  try {
    await ensureTablesExist();
    const body = await request.json();
    const results: string[] = [];

    // 1. Jadwal Kuliah
    if (Array.isArray(body.jadwalKuliah) && body.jadwalKuliah.length > 0) {
      for (const item of body.jadwalKuliah) {
        await sql`
          INSERT INTO jadwal_kuliah (id, hari, jam_mulai, jam_selesai, mata_kuliah, ruang, kelas)
          VALUES (${item.id}, ${item.hari}, ${item.jamMulai}, ${item.jamSelesai}, ${item.mataKuliah}, ${item.ruang || ''}, ${item.kelas || ''})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
      results.push(`✅ ${body.jadwalKuliah.length} jadwal kuliah`);
    }

    // 2. Jadwal Tambahan
    if (Array.isArray(body.jadwalTambahan) && body.jadwalTambahan.length > 0) {
      for (const item of body.jadwalTambahan) {
        await sql`
          INSERT INTO jadwal_tambahan (id, tanggal, jam, judul, catatan)
          VALUES (${item.id}, ${item.tanggal}, ${item.jam || ''}, ${item.judul}, ${item.catatan || ''})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
      results.push(`✅ ${body.jadwalTambahan.length} jadwal tambahan`);
    }

    // 3. Tugas
    if (Array.isArray(body.tugas) && body.tugas.length > 0) {
      for (const item of body.tugas) {
        await sql`
          INSERT INTO tugas (id, title, cat, deadline, done)
          VALUES (${item.id}, ${item.title}, ${item.cat}, ${item.deadline || ''}, ${item.done || false})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
      results.push(`✅ ${body.tugas.length} tugas`);
    }

    // 4. Catatan
    if (Array.isArray(body.catatan) && body.catatan.length > 0) {
      for (const item of body.catatan) {
        await sql`
          INSERT INTO catatan (id, content, created_at)
          VALUES (${item.id}, ${item.content}, ${item.createdAt})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
      results.push(`✅ ${body.catatan.length} catatan`);
    }

    // 5. Konten Calendar
    if (Array.isArray(body.konten) && body.konten.length > 0) {
      for (const item of body.konten) {
        await sql`
          INSERT INTO konten_calendar (id, tanggal, platform, status, caption)
          VALUES (${item.id}, ${item.tanggal}, ${item.platform}, ${item.status}, ${item.caption})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
      results.push(`✅ ${body.konten.length} konten`);
    }

    // 6. Proyek
    if (Array.isArray(body.proyek) && body.proyek.length > 0) {
      for (const item of body.proyek) {
        await sql`
          INSERT INTO proyek (id, nama, status, deskripsi)
          VALUES (${item.id}, ${item.nama}, ${item.status}, ${item.deskripsi || ''})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
      results.push(`✅ ${body.proyek.length} proyek`);
    }

    return NextResponse.json({
      success: true,
      message: results.length > 0 ? results.join(', ') : 'Tidak ada data untuk disinkronisasi.',
      results,
    });
  } catch (error) {
    const { message, code } = formatDbError(error);
    console.error('[api/sync] POST failed:', { message, code });
    return NextResponse.json({
      success: false,
      error: message,
      code,
    }, { status: 500 });
  }
}
