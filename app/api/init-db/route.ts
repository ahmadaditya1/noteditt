import { NextResponse } from 'next/server';
import { ensureTablesExist, getDb } from '@/lib/db';

export async function GET() {
  const sql = getDb();
  if (!sql) {
    return NextResponse.json({
      success: false,
      message: 'DATABASE_URL atau POSTGRES_URL belum diatur di environment variable.',
    }, { status: 400 });
  }

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
}
