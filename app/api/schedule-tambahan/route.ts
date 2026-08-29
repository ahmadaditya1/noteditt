import { NextResponse } from 'next/server';
import {
  dbQueryFailedResponse,
  dbSuccessResponse,
  ensureDbReady,
  requireDb,
} from '@/lib/api-db';

const ROUTE = 'api/schedule-tambahan';

export async function GET() {
  const dbCtx = requireDb(ROUTE);
  if (!dbCtx.ok) return dbCtx.response;

  const readyErr = await ensureDbReady(ROUTE, dbCtx.sql);
  if (readyErr) return readyErr;

  try {
    const list = await dbCtx.sql`
      SELECT id, tanggal, jam, judul, catatan
      FROM jadwal_tambahan
      ORDER BY tanggal ASC;
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

  const readyErr = await ensureDbReady(ROUTE, dbCtx.sql);
  if (readyErr) return readyErr;

  try {
    const { id, tanggal, jam = '', judul, catatan = '' } = await request.json();
    await dbCtx.sql`
      INSERT INTO jadwal_tambahan (id, tanggal, jam, judul, catatan)
      VALUES (${id}, ${tanggal}, ${jam}, ${judul}, ${catatan})
      ON CONFLICT (id) DO UPDATE SET
        tanggal = EXCLUDED.tanggal,
        jam = EXCLUDED.jam,
        judul = EXCLUDED.judul,
        catatan = EXCLUDED.catatan;
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

  const readyErr = await ensureDbReady(ROUTE, dbCtx.sql);
  if (readyErr) return readyErr;

  try {
    await dbCtx.sql`DELETE FROM jadwal_tambahan WHERE id = ${id};`;
    console.log(`[${ROUTE}] DELETE success — id=${id}`);
    return dbSuccessResponse({});
  } catch (error) {
    return dbQueryFailedResponse(ROUTE, error);
  }
}
