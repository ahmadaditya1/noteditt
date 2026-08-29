import { NextResponse } from 'next/server';
import {
  dbQueryFailedResponse,
  dbSuccessResponse,
  requireDb,
} from '@/lib/api-db';

const ROUTE = 'api/projects';

export async function GET() {
  const dbCtx = requireDb(ROUTE);
  if (!dbCtx.ok) return dbCtx.response;

  try {
    const list = await dbCtx.sql`
      SELECT id, nama, status, deskripsi
      FROM proyek;
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
    const { id, nama, status, deskripsi = '' } = await request.json();
    await dbCtx.sql`
      INSERT INTO proyek (id, nama, status, deskripsi)
      VALUES (${id}, ${nama}, ${status}, ${deskripsi})
      ON CONFLICT (id) DO UPDATE SET
        nama = EXCLUDED.nama,
        status = EXCLUDED.status,
        deskripsi = EXCLUDED.deskripsi;
    `;

    console.log(`[${ROUTE}] POST success — id=${id}`);
    return dbSuccessResponse({});
  } catch (error) {
    return dbQueryFailedResponse(ROUTE, error);
  }
}

export async function PATCH(request: Request) {
  const dbCtx = requireDb(ROUTE);
  if (!dbCtx.ok) return dbCtx.response;

  try {
    const { id, status } = await request.json();
    await dbCtx.sql`UPDATE proyek SET status = ${status} WHERE id = ${id};`;
    console.log(`[${ROUTE}] PATCH success — id=${id}`);
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
    await dbCtx.sql`DELETE FROM proyek WHERE id = ${id};`;
    console.log(`[${ROUTE}] DELETE success — id=${id}`);
    return dbSuccessResponse({});
  } catch (error) {
    return dbQueryFailedResponse(ROUTE, error);
  }
}
