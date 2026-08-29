import { NextResponse } from 'next/server';
import { JadwalKuliah } from '@/lib/types';
import {
  dbQueryFailedResponse,
  dbSuccessResponse,
  requireDb,
} from '@/lib/api-db';

const ROUTE = 'api/schedule-kuliah';

export async function GET() {
  const dbCtx = requireDb(ROUTE);
  if (!dbCtx.ok) return dbCtx.response;

  try {
    const list = await dbCtx.sql`
      SELECT id, hari, jam_mulai as "jamMulai", jam_selesai as "jamSelesai", mata_kuliah as "mataKuliah", ruang, kelas
      FROM jadwal_kuliah;
    `;
    console.log(`[${ROUTE}] GET success — ${list.length} rows`);
    return dbSuccessResponse({ data: list });
  } catch (error) {
    return dbQueryFailedResponse(ROUTE, error);
  }
}

export async function POST(request: Request) {
  const dbCtx = requireDb(ROUTE);
  if (!dbCtx.ok) return dbCtx.response;

  try {
    const body = await request.json();

    if (body.items && Array.isArray(body.items)) {
      for (const item of body.items as JadwalKuliah[]) {
        await dbCtx.sql`
          INSERT INTO jadwal_kuliah (id, hari, jam_mulai, jam_selesai, mata_kuliah, ruang, kelas)
          VALUES (${item.id}, ${item.hari}, ${item.jamMulai}, ${item.jamSelesai}, ${item.mataKuliah}, ${item.ruang || ''}, ${item.kelas || ''})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
      console.log(`[${ROUTE}] POST bulk success — ${body.items.length} items`);
      return dbSuccessResponse({ count: body.items.length });
    }

    const { id, hari, jamMulai, jamSelesai, mataKuliah, ruang = '', kelas = '' } = body;
    await dbCtx.sql`
      INSERT INTO jadwal_kuliah (id, hari, jam_mulai, jam_selesai, mata_kuliah, ruang, kelas)
      VALUES (${id}, ${hari}, ${jamMulai}, ${jamSelesai}, ${mataKuliah}, ${ruang}, ${kelas})
      ON CONFLICT (id) DO UPDATE SET
        hari = EXCLUDED.hari,
        jam_mulai = EXCLUDED.jam_mulai,
        jam_selesai = EXCLUDED.jam_selesai,
        mata_kuliah = EXCLUDED.mata_kuliah,
        ruang = EXCLUDED.ruang,
        kelas = EXCLUDED.kelas;
    `;

    console.log(`[${ROUTE}] POST success — id=${id}`);
    return dbSuccessResponse({});
  } catch (error) {
    return dbQueryFailedResponse(ROUTE, error);
  }
}

export async function DELETE(request: Request) {
  const dbCtx = requireDb(ROUTE);
  if (!dbCtx.ok) return dbCtx.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, dbStatus: 'connected', error: 'ID tidak ditemukan' }, { status: 400 });
  }

  try {
    await dbCtx.sql`DELETE FROM jadwal_kuliah WHERE id = ${id};`;
    console.log(`[${ROUTE}] DELETE success — id=${id}`);
    return dbSuccessResponse({});
  } catch (error) {
    return dbQueryFailedResponse(ROUTE, error);
  }
}
