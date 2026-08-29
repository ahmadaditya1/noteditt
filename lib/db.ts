import postgres from 'postgres';

// Di Vercel (serverless), setiap invocation bisa jadi instance baru.
// Gunakan connection pooler Supabase (port 6543) agar tidak overload koneksi.
let sql: postgres.Sql | null = null;

/**
 * Helper untuk mengekstrak info error dari error object apapun.
 * Berguna untuk logging di Vercel Function Logs.
 */
export function formatDbError(error: unknown): { message: string; code: string } {
  if (error instanceof Error) {
    const errWithCode = error as unknown as { code?: string };
    return {
      message: error.message,
      code: errWithCode.code || 'UNKNOWN',
    };
  }
  return { message: String(error), code: 'UNKNOWN' };
}

export function getDb(): postgres.Sql | null {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.warn('[db] No DATABASE_URL or POSTGRES_URL found in environment.');
    return null;
  }

  if (!sql) {
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    sql = postgres(connectionString, {
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 1,           // serverless: 1 koneksi per invocation
      idle_timeout: 20,
      connect_timeout: 5, // 5s, bukan 10s — sisakan waktu untuk Vercel mengembalikan response
      prepare: false,     // Wajib untuk Supabase Connection Pooler / PgBouncer
    });
  }

  return sql;
}

// Cache flag: hanya jalankan ensureTablesExist sekali per cold start
let tablesReady = false;

export async function ensureTablesExist(): Promise<boolean> {
  if (tablesReady) return true; // Skip jika sudah pernah jalan

  const db = getDb();
  if (!db) return false;

  try {
    // Gabung semua CREATE TABLE dalam 1 query untuk mengurangi round-trip
    await db.unsafe(`
      CREATE TABLE IF NOT EXISTS jadwal_kuliah (
        id VARCHAR(100) PRIMARY KEY,
        hari VARCHAR(20) NOT NULL,
        jam_mulai VARCHAR(20) NOT NULL,
        jam_selesai VARCHAR(20) NOT NULL,
        mata_kuliah VARCHAR(255) NOT NULL,
        ruang VARCHAR(100) DEFAULT '',
        kelas VARCHAR(100) DEFAULT ''
      );
      ALTER TABLE jadwal_kuliah ADD COLUMN IF NOT EXISTS kelas VARCHAR(100) DEFAULT '';

      CREATE TABLE IF NOT EXISTS jadwal_tambahan (
        id VARCHAR(100) PRIMARY KEY,
        tanggal VARCHAR(30) NOT NULL,
        jam VARCHAR(20) DEFAULT '',
        judul VARCHAR(255) NOT NULL,
        catatan TEXT DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS tugas (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        cat VARCHAR(50) NOT NULL,
        deadline VARCHAR(30) DEFAULT '',
        done BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS catatan (
        id VARCHAR(100) PRIMARY KEY,
        content TEXT NOT NULL,
        created_at VARCHAR(50) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS konten_calendar (
        id VARCHAR(100) PRIMARY KEY,
        tanggal VARCHAR(30) NOT NULL,
        platform VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        caption TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS proyek (
        id VARCHAR(100) PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        deskripsi TEXT DEFAULT ''
      );
    `);

    tablesReady = true;
    return true;
  } catch (error) {
    const { message, code } = formatDbError(error);
    console.error('[db] ensureTablesExist failed:', { message, code });
    return false;
  }
}
