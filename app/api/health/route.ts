import { NextResponse } from 'next/server';
import { getDb, formatDbError } from '@/lib/db';

/**
 * GET /api/health
 *
 * Endpoint diagnostik sederhana untuk test koneksi database dari browser.
 * Coba SELECT 1 ke database dan kembalikan hasil koneksi + error detail.
 *
 * Contoh respons sukses:  { connected: true, latencyMs: 42 }
 * Contoh respons gagal:   { connected: false, error: "connection refused", code: "ECONNREFUSED", envConfigured: true }
 */
export async function GET() {
  const envVar = process.env.DATABASE_URL ? 'DATABASE_URL' : process.env.POSTGRES_URL ? 'POSTGRES_URL' : null;

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({
      connected: false,
      error: 'Tidak ada DATABASE_URL atau POSTGRES_URL di environment variables.',
      envConfigured: false,
      hint: 'Set DATABASE_URL di Vercel Dashboard → Settings → Environment Variables, lalu redeploy.',
    }, { status: 503 });
  }

  const start = Date.now();
  try {
    await sql`SELECT 1 AS ok`;
    const latencyMs = Date.now() - start;

    return NextResponse.json({
      connected: true,
      latencyMs,
      envVar,
    });
  } catch (error) {
    const latencyMs = Date.now() - start;
    const { message, code } = formatDbError(error);

    console.error('[health] Database connection test failed:', { message, code, latencyMs });

    return NextResponse.json({
      connected: false,
      error: message,
      code,
      latencyMs,
      envVar,
      hint: code === 'ENOTFOUND'
        ? 'DNS tidak ditemukan — kemungkinan hostname salah atau harus pakai Supabase Connection Pooler URL.'
        : code === 'ECONNREFUSED'
          ? 'Koneksi ditolak — cek apakah database aktif dan port benar.'
          : code === 'CONNECT_TIMEOUT'
            ? 'Koneksi timeout — cek network/firewall atau ganti ke Connection Pooler URL.'
            : 'Cek Vercel Function Logs untuk detail lebih lanjut.',
    }, { status: 503 });
  }
}
