-- Skema Database Noteditt (PostgreSQL / Supabase)
-- Jalankan skrip ini langsung di Supabase Dashboard -> SQL Editor

-- 1. Jadwal Kuliah
CREATE TABLE IF NOT EXISTS jadwal_kuliah (
  id VARCHAR(100) PRIMARY KEY,
  hari VARCHAR(20) NOT NULL,
  jam_mulai VARCHAR(20) NOT NULL,
  jam_selesai VARCHAR(20) NOT NULL,
  mata_kuliah VARCHAR(255) NOT NULL,
  ruang VARCHAR(100) DEFAULT '',
  kelas VARCHAR(100) DEFAULT ''
);

-- 2. Jadwal Tambahan / Agenda
CREATE TABLE IF NOT EXISTS jadwal_tambahan (
  id VARCHAR(100) PRIMARY KEY,
  tanggal VARCHAR(30) NOT NULL,
  jam VARCHAR(20) DEFAULT '',
  judul VARCHAR(255) NOT NULL,
  catatan TEXT DEFAULT ''
);

-- 3. Tugas
CREATE TABLE IF NOT EXISTS tugas (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  cat VARCHAR(50) NOT NULL,
  deadline VARCHAR(30) DEFAULT '',
  done BOOLEAN DEFAULT FALSE
);

-- 4. Catatan Quick Memo
CREATE TABLE IF NOT EXISTS catatan (
  id VARCHAR(100) PRIMARY KEY,
  content TEXT NOT NULL,
  created_at VARCHAR(50) NOT NULL
);

-- 5. Content Calendar (SocMed)
CREATE TABLE IF NOT EXISTS konten_calendar (
  id VARCHAR(100) PRIMARY KEY,
  tanggal VARCHAR(30) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  caption TEXT NOT NULL
);

-- 6. Proyek
CREATE TABLE IF NOT EXISTS proyek (
  id VARCHAR(100) PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  deskripsi TEXT DEFAULT ''
);
