import postgres from 'postgres';

// Di Vercel (serverless), setiap invocation bisa jadi instance baru.
// Gunakan connection pooler Supabase (port 6543) agar tidak overload koneksi.
let sql: postgres.Sql | null = null;

export function getDb(): postgres.Sql | null {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    return null;
  }

  if (!sql) {
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    sql = postgres(connectionString, {
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 1,           // serverless: 1 koneksi per invocation
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }

  return sql;
}

export async function ensureTablesExist(): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    // 1. Jadwal Kuliah
    await db`
      CREATE TABLE IF NOT EXISTS jadwal_kuliah (
        id VARCHAR(100) PRIMARY KEY,
        hari VARCHAR(20) NOT NULL,
        jam_mulai VARCHAR(20) NOT NULL,
        jam_selesai VARCHAR(20) NOT NULL,
        mata_kuliah VARCHAR(255) NOT NULL,
        ruang VARCHAR(100) DEFAULT '',
        kelas VARCHAR(100) DEFAULT ''
      );
    `;
    await db`
      ALTER TABLE jadwal_kuliah ADD COLUMN IF NOT EXISTS kelas VARCHAR(100) DEFAULT '';
    `;

    // 2. Jadwal Tambahan
    await db`
      CREATE TABLE IF NOT EXISTS jadwal_tambahan (
        id VARCHAR(100) PRIMARY KEY,
        tanggal VARCHAR(30) NOT NULL,
        jam VARCHAR(20) DEFAULT '',
        judul VARCHAR(255) NOT NULL,
        catatan TEXT DEFAULT ''
      );
    `;

    // 3. Tugas (To-Do)
    await db`
      CREATE TABLE IF NOT EXISTS tugas (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        cat VARCHAR(50) NOT NULL,
        deadline VARCHAR(30) DEFAULT '',
        done BOOLEAN DEFAULT FALSE
      );
    `;

    // 4. Catatan
    await db`
      CREATE TABLE IF NOT EXISTS catatan (
        id VARCHAR(100) PRIMARY KEY,
        content TEXT NOT NULL,
        created_at VARCHAR(50) NOT NULL
      );
    `;

    // 5. Konten Calendar
    await db`
      CREATE TABLE IF NOT EXISTS konten_calendar (
        id VARCHAR(100) PRIMARY KEY,
        tanggal VARCHAR(30) NOT NULL,
        platform VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        caption TEXT NOT NULL
      );
    `;

    // 6. Proyek
    await db`
      CREATE TABLE IF NOT EXISTS proyek (
        id VARCHAR(100) PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        deskripsi TEXT DEFAULT ''
      );
    `;

    return true;
  } catch (error) {
    console.error('Error initializing database tables:', error);
    return false;
  }
}
