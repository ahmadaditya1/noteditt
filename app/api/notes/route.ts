import { NextResponse } from 'next/server';
import {
  dbQueryFailedResponse,
  dbSuccessResponse,
  ensureDbReady,
  requireDb,
} from '@/lib/api-db';

const ROUTE = 'api/notes';

export async function GET() {
  const dbCtx = requireDb(ROUTE);
  if (!dbCtx.ok) return dbCtx.response;

  const readyErr = await ensureDbReady(ROUTE, dbCtx.sql);
  if (readyErr) return readyErr;

  try {
    const list = await dbCtx.sql`
      SELECT id, content, created_at as "createdAt"
      FROM catatan;
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
    const { id, content, createdAt } = await request.json();
    await dbCtx.sql`
      INSERT INTO catatan (id, content, created_at)
      VALUES (${id}, ${content}, ${createdAt})
      ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content;
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
    await dbCtx.sql`DELETE FROM catatan WHERE id = ${id};`;
    console.log(`[${ROUTE}] DELETE success — id=${id}`);
    return dbSuccessResponse({});
  } catch (error) {
    return dbQueryFailedResponse(ROUTE, error);
  }
}
