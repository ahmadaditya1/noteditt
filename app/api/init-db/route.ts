import { NextResponse } from 'next/server';
import { ensureTablesExist, getDb, formatDbError } from '@/lib/db';

export const preferredRegion = 'sin1';

export async function GET() {
  const sql = getDb();
  if (!sql) {
    return NextResponse.json({
      success: false,
      message: 'DATABASE_URL atau POSTGRES_URL belum diatur di environment variable.',
    }, { status: 400 });
  }

  try {
    const ok = await ensureTablesExist();
    if (ok) {
      return NextResponse.json({
        success: true,
        message: 'Semua tabel database PostgreSQL siap digunakan.',
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Gagal membuat/memverifikasi tabel database.',
      }, { status: 500 });
    }
  } catch (error) {
    const { message, code } = formatDbError(error);
    console.error('[api/init-db] GET failed:', { message, code });
    return NextResponse.json({
      success: false,
      message: `Database error: ${message}`,
      code,
    }, { status: 500 });
  }
}
