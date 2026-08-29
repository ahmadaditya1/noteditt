# 🛠️ Tech Stack & Database Architecture — Noteditt

Dokumentasi lengkap mengenai arsitektur sistem, teknologi yang digunakan, skema database **Vercel Postgres (PostgreSQL)**, serta mekanisme sinkronisasi data pada aplikasi **Noteditt**.

---

## 📌 1. Ringkasan & Konsep Aplikasi

**Noteditt** adalah aplikasi *Personal Productivity Suite* berbasis web yang mengusung konsep antarmuka retro **Windows 95/98 Desktop Environment**.

Fitur utama mencakup sistem *multi-window* interaktif (*draggable, minimizable, resizing, z-index hierarchy, taskbar, start menu*) dengan modul-modul produktivitas:
- 📅 **Jadwal.exe** — Manajemen jadwal kuliah rutin dan agenda kegiatan tambahan.
- 📝 **Catatan.txt** — Quick notes / memo harian.
- 📋 **Tugas.exe** — Task management / To-do list berbasis kategori.
- 📱 **SocMed Calendar.exe** — Perencanaan dan pelacakan status konten media sosial.
- 📁 **Proyek — Folders** — Pelacakan status dan detail proyek.

---

## 🚀 2. Analisis Tech Stack

### A. Frontend Layer
| Teknologi | Versi | Peran & Alasan Penggunaan |
| :--- | :--- | :--- |
| **Next.js (App Router)** | `16.3.1` | Framework React modern untuk fullstack web, mendukung Serverless Route Handlers dan optimasi aset. |
| **React & React-DOM** | `19.2.8` | UI Library inti untuk manajemen state reaktif, rendering modular komponen windowing desktop. |
| **TypeScript** | `^5.x` | Menjamin *type safety* pada seluruh model data (`JadwalKuliah`, `Tugas`, `Catatan`, dll.) dan API contract. |
| **Custom CSS & Bevel Styling** | — | Desain retro pixel-perfect Windows 95/98 (efek border 3D `outset`/`inset`, palet klasik `#c0c0c0`, font Tahoma) tanpa library CSS eksternal yang membebani bundle size. |

---

### B. Backend / API Layer
Aplikasi menggunakan **Next.js Route Handlers** (`app/api/*`) yang berjalan secara *serverless*:
- `/api/auth/login`, `/api/auth/check`, `/api/auth/logout`: Sistem autentikasi berbasis PIN akses dengan session cookie terproteksi.
- `/api/data`: Endpoint agregator untuk mengambil seluruh data modul dalam satu *single round-trip*.
- `/api/schedule-kuliah`: CRUD endpoint untuk jadwal kuliah.
- `/api/schedule-tambahan`: CRUD endpoint untuk jadwal kegiatan tambahan.
- `/api/tasks`: CRUD endpoint untuk manajemen tugas dan toggle status penyelesaian.
- `/api/notes`: Endpoint pembuatan dan penghapusan catatan.
- `/api/content-calendar`: CRUD dan cycling status konten media sosial.
- `/api/projects`: CRUD dan cycling status proyek.
- `/api/init-db`: Endpoint inisialisasi tabel database.
- `/api/health`: Health check koneksi database.

---

### C. Database & Data Storage Layer
- **PostgreSQL Client**: `postgres` (porsager/postgres) — Driver native berkinerja tinggi yang kompatibel dengan serverless connection pooler.
- **Serverless PostgreSQL Ecosystem**: Mendukung Vercel Postgres, Supabase Connection Pooler (PgBouncer pada port 6543), dan Neon Database.
- **Offline-First Hybrid Storage**:
  - **Browser LocalStorage**: Bertindak sebagai *instant cache* dan penyimpanan offline mandiri.
  - **PostgreSQL**: Penyimpanan persisten di cloud ketika koneksi database tersedia.

---

## 🗄️ 3. Arsitektur Database Vercel Postgres / PostgreSQL

### A. Konfigurasi Koneksi Serverless (`lib/db.ts`)
Untuk mengatasi karakteristik *stateless* pada fungsi serverless Vercel dan batasan koneksi database, driver dikonfigurasi dengan:
1. **Connection Pooling**: Menghubungkan ke Transaction Pooler (port `6543`).
2. `max: 1`: Membatasi alokasi maksimal 1 koneksi per serverless invocation.
3. `prepare: false`: Menonaktifkan fitur *prepared statements* yang tidak didukung oleh Transaction Connection Pooler (PgBouncer).
4. `idle_timeout: 20` & `connect_timeout: 8`: Mencegah *connection hanging* saat cold start.

```typescript
// Cuplikan inisialisasi koneksi di lib/db.ts
sql = postgres(connectionString, {
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 1,             // 1 koneksi per lambda instance
  idle_timeout: 20,
  connect_timeout: 8, // Toleransi cold start pooler
  prepare: false,     // Wajib untuk Supabase Pooler / PgBouncer
});
```

---

### B. Skema Tabel & Relasi

```mermaid
erDiagram
    JADWAL_KULIAH {
        varchar(100) id PK
        varchar(20) hari
        varchar(20) jam_mulai
        varchar(20) jam_selesai
        varchar(255) mata_kuliah
        varchar(100) ruang
        varchar(100) kelas
    }

    JADWAL_TAMBAHAN {
        varchar(100) id PK
        varchar(30) tanggal
        varchar(20) jam
        varchar(255) judul
        text catatan
    }

    TUGAS {
        varchar(100) id PK
        varchar(255) title
        varchar(50) cat
        varchar(30) deadline
        boolean done
    }

    CATATAN {
        varchar(100) id PK
        text content
        varchar(50) created_at
    }

    KONTEN_CALENDAR {
        varchar(100) id PK
        varchar(30) tanggal
        varchar(50) platform
        varchar(50) status
        text caption
    }

    PROYEK {
        varchar(100) id PK
        varchar(255) nama
        varchar(50) status
        text deskripsi
    }
```

---

### C. Detail Struktur Tabel

#### 1. Tabel `jadwal_kuliah`
Menyimpan jadwal mata kuliah mingguan.
```sql
CREATE TABLE IF NOT EXISTS jadwal_kuliah (
  id VARCHAR(100) PRIMARY KEY,
  hari VARCHAR(20) NOT NULL,
  jam_mulai VARCHAR(20) NOT NULL,
  jam_selesai VARCHAR(20) NOT NULL,
  mata_kuliah VARCHAR(255) NOT NULL,
  ruang VARCHAR(100) DEFAULT '',
  kelas VARCHAR(100) DEFAULT ''
);
```

#### 2. Tabel `jadwal_tambahan`
Menyimpan agenda atau kegiatan insidental di luar jam kuliah.
```sql
CREATE TABLE IF NOT EXISTS jadwal_tambahan (
  id VARCHAR(100) PRIMARY KEY,
  tanggal VARCHAR(30) NOT NULL,
  jam VARCHAR(20) DEFAULT '',
  judul VARCHAR(255) NOT NULL,
  catatan TEXT DEFAULT ''
);
```

#### 3. Tabel `tugas`
Menyimpan daftar tugas, deadline, dan status penyelesaian.
```sql
CREATE TABLE IF NOT EXISTS tugas (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  cat VARCHAR(50) NOT NULL,
  deadline VARCHAR(30) DEFAULT '',
  done BOOLEAN DEFAULT FALSE
);
```

#### 4. Tabel `catatan`
Menyimpan teks catatan memo beserta waktu pembuatan.
```sql
CREATE TABLE IF NOT EXISTS catatan (
  id VARCHAR(100) PRIMARY KEY,
  content TEXT NOT NULL,
  created_at VARCHAR(50) NOT NULL
);
```

#### 5. Tabel `konten_calendar`
Menyimpan rencana publikasi konten media sosial beserta status progres.
```sql
CREATE TABLE IF NOT EXISTS konten_calendar (
  id VARCHAR(100) PRIMARY KEY,
  tanggal VARCHAR(30) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL, -- Draft | Review | Terjadwal | Publish
  caption TEXT NOT NULL
);
```

#### 6. Tabel `proyek`
Menyimpan nama proyek, deskripsi, dan status pengerjaan.
```sql
CREATE TABLE IF NOT EXISTS proyek (
  id VARCHAR(100) PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- Rencana | Berjalan | Selesai
  deskripsi TEXT DEFAULT ''
);
```

---

## 🔄 4. Mekanisme Sinkronisasi Data (Optimistic & Offline-First)

Aplikasi mengimplementasikan alur **Optimistic UI + Fallback**:

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna
    participant UI as Komponen React
    participant Local as localStorage Browser
    participant API as Next.js Route Handler
    participant DB as PostgreSQL (Vercel/Supabase)

    User->>UI: Tambah / Edit Data
    UI->>Local: Update data lokal secara instan (No lag)
    UI->>API: Request API asynchronous (POST/PATCH/DELETE)
    
    alt Database Tersedia
        API->>DB: Eksekusi SQL Query
        DB-->>API: Query Berhasil
        API-->>UI: Response 200 OK (Data Synced)
    else Database Offline / Error / Belum Dikonfigurasi
        API-->>UI: Response Error / Fallback Status
        UI->>User: Munculkan Notifikasi Toast (Data tetap aman di browser)
    end
```

### Fitur Migrasi Data Lokal ke Cloud:
Pada fungsi `pushAllLocalDataToServer()` di `lib/storage.ts`, pengguna dapat melakukan migrasi satu arah (*one-way push*) dari seluruh data yang ada di `localStorage` langsung ke tabel PostgreSQL di cloud.

---

## 🔑 5. Environment Variables

Variabel lingkungan yang dibutuhkan (`.env.local`):

| Variabel | Deskripsi | Contoh |
| :--- | :--- | :--- |
| `ACCESS_CODE` | Kode PIN rahasia untuk membuka dashboard | `1234` |
| `DATABASE_URL` / `POSTGRES_URL` | Connection string PostgreSQL (gunakan port pooler `6543` jika menggunakan Supabase) | `postgresql://user:pass@ep-xyz.pooler.supabase.com:6543/postgres?sslmode=require` |
