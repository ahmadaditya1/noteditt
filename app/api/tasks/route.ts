import { NextResponse } from 'next/server';
import {
  dbQueryFailedResponse,
  dbSuccessResponse,
  ensureDbReady,
  requireDb,
} from '@/lib/api-db';

const ROUTE = 'api/tasks';

export async function GET() {
  const dbCtx = requireDb(ROUTE);
  if (!dbCtx.ok) return dbCtx.response;

  const readyErr = await ensureDbReady(ROUTE, dbCtx.sql);
  if (readyErr) return readyErr;

  try {
    const list = await dbCtx.sql`
      SELECT id, title, cat, deadline, done
      FROM tugas;
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
    const { id, title, cat, deadline = '', done = false } = await request.json();
    await dbCtx.sql`
      INSERT INTO tugas (id, title, cat, deadline, done)
      VALUES (${id}, ${title}, ${cat}, ${deadline}, ${done})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        cat = EXCLUDED.cat,
        deadline = EXCLUDED.deadline,
        done = EXCLUDED.done;
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

  const readyErr = await ensureDbReady(ROUTE, dbCtx.sql);
  if (readyErr) return readyErr;

  try {
    const { id, done } = await request.json();
    await dbCtx.sql`UPDATE tugas SET done = ${done} WHERE id = ${id};`;
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

  const readyErr = await ensureDbReady(ROUTE, dbCtx.sql);
  if (readyErr) return readyErr;

  try {
    await dbCtx.sql`DELETE FROM tugas WHERE id = ${id};`;
    console.log(`[${ROUTE}] DELETE success — id=${id}`);
    return dbSuccessResponse({});
  } catch (error) {
    return dbQueryFailedResponse(ROUTE, error);
  }
}
