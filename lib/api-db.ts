import { NextResponse } from 'next/server';
import { formatDbError, getDb } from '@/lib/db';
import type postgres from 'postgres';

/** Tiga kondisi koneksi DB yang distandarkan di semua endpoint. */
export type DbStatus = 'connected' | 'query_failed' | 'not_connected';

export interface DbApiBody {
  success: boolean;
  dbStatus: DbStatus;
  message?: string;
  error?: string;
  code?: string;
  hint?: string;
}

const INIT_DB_HINT = 'Jalankan GET /api/init-db untuk membuat tabel.';

export function dbNotConnectedResponse(route: string) {
  const body: DbApiBody = {
    success: false,
    dbStatus: 'not_connected',
    message: 'DATABASE_URL/POSTGRES_URL tidak terdeteksi. Set environment variable di Vercel.',
    hint: INIT_DB_HINT,
  };
  console.error(`[${route}] DB not connected — env var missing`);
  return NextResponse.json(body, { status: 503 });
}

export function dbQueryFailedResponse(route: string, error: unknown, status = 500) {
  const { message, code } = formatDbError(error);
  // postgres.js reports connection failures only when the first query runs.
  // Do not mislabel these as a schema/query problem.
  const connectionCodes = new Set(['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', '08001', '08003', '08006', '57P01']);
  if (connectionCodes.has(code) || /connection|timeout|connect ECONN/i.test(message)) {
    console.error(`[${route}] DB connection failed:`, { message, code });
    return NextResponse.json({
      success: false,
      dbStatus: 'not_connected' as const,
      message: `Database tidak dapat dihubungi: ${message}`,
      code,
    } satisfies DbApiBody, { status: 503 });
  }
  const body: DbApiBody = {
    success: false,
    dbStatus: 'query_failed',
    error: message,
    code,
    message: `Query gagal: ${message}`,
    hint: INIT_DB_HINT,
  };
  console.error(`[${route}] Query failed:`, { message, code });
  return NextResponse.json(body, { status });
}

export function dbSuccessResponse<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json({ success: true, dbStatus: 'connected' as const, ...data }, { status });
}

export type DbContext =
  | { ok: true; sql: postgres.Sql }
  | { ok: false; response: NextResponse };

/** Ambil koneksi DB atau respons error standar (not_connected). */
export function requireDb(route: string): DbContext {
  const sql = getDb();
  if (!sql) {
    return { ok: false, response: dbNotConnectedResponse(route) };
  }
  return { ok: true, sql };
}
