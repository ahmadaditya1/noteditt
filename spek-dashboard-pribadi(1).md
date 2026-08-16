# Spesifikasi: Dashboard Pribadi (Notion-inspired)

Dokumen ini adalah rincian teknis untuk dikerjakan sendiri. Setiap section berisi fitur, field data, dan perilaku yang diharapkan.

---

## 1. Gambaran umum

Web app personal (single user) untuk mengelola: jadwal, tugas, catatan, content calendar, dan daftar proyek — terinspirasi dari konsep Notion (block-based, serba guna dalam satu tempat).

**Prinsip:**
- Single user, tidak perlu sistem auth penuh — cukup kode akses sederhana
- Semua data persisten (tersimpan permanen di browser/database)

---

## 2. Autentikasi sederhana (kode akses)

- Saat pertama kali dibuka dan belum ada kode tersimpan → tampilkan layar "Buat kode akses" dengan 2 input (kode + konfirmasi kode), minimal 4 karakter
- Setelah kode dibuat, simpan ke storage
- Kunjungan berikutnya → tampilkan layar "Masukkan kode akses", bandingkan dengan yang tersimpan
- Jika cocok → buka dashboard; jika salah → tampilkan pesan error
- Ini BUKAN sistem keamanan penuh, hanya gerbang akses sederhana karena dipakai sendiri

---

## 3. Section: Jadwal

### 3.1 Jadwal Kuliah (recurring mingguan)
Field per entri:
| Field | Tipe | Keterangan |
|---|---|---|
| Hari | select | Senin–Minggu |
| Jam mulai | time | |
| Jam selesai | time | |
| Mata kuliah | text | |
| Ruang/dosen | text | opsional |

- Ditampilkan dikelompokkan per hari, diurutkan berdasarkan jam mulai
- Tombol tambah manual + tombol hapus per entri

### 3.2 Impor dari spreadsheet
- Textarea untuk paste data yang dicopy dari Excel/Google Sheets (tab-separated) atau CSV (comma-separated)
- Urutan kolom yang diharapkan: `Hari, Jam Mulai, Jam Selesai, Mata Kuliah, Ruang`
- Parsing: deteksi otomatis apakah pakai tab atau koma sebagai pemisah
- Setiap baris valid (minimal 4 kolom) langsung ditambahkan ke daftar jadwal kuliah

### 3.3 Jadwal Tambahan (one-off events)
Field per entri:
| Field | Tipe | Keterangan |
|---|---|---|
| Tanggal | date | |
| Jam | time | opsional |
| Judul | text | |
| Catatan | text | opsional |

- Diurutkan berdasarkan tanggal
- Terpisah total dari jadwal kuliah (section berbeda)

---

## 4. Section: Tugas (To-do list)

Field per tugas:
| Field | Tipe | Keterangan |
|---|---|---|
| Judul tugas | text | wajib |
| Jenis/kategori | select | Kuliah, Tikethub, Porta Pic, Personal (bisa custom) |
| Tenggat | date | opsional |
| Selesai | boolean | checkbox |

**Perilaku:**
- Checkbox untuk tandai selesai → teks jadi strikethrough saat dicentang
- Filter berdasarkan kategori (tombol/tab filter: Semua, Kuliah, Tikethub, Porta Pic, Personal)
- Setiap kategori punya warna badge berbeda agar mudah dibedakan sekilas
- Tombol hapus per tugas

---

## 5. Section: Catatan

Field per catatan:
| Field | Tipe | Keterangan |
|---|---|---|
| Isi catatan | textarea | |
| Waktu dibuat | datetime | **otomatis**, tidak diinput manual |

**Perilaku:**
- Saat tombol "Simpan catatan" ditekan, sistem otomatis mencatat timestamp saat itu (format: `16 Agu 2026, 14:30`)
- Catatan terbaru muncul paling atas
- Tombol hapus per catatan

---

## 6. Section: Content Calendar

Field per entri konten:
| Field | Tipe | Keterangan |
|---|---|---|
| Tanggal | date | |
| Platform | select | Instagram, TikTok, Website, Lainnya |
| Status | select | Draft → Review → Terjadwal → Publish |
| Ide/caption | text | |

**Perilaku:**
- Diurutkan berdasarkan tanggal
- Status ditampilkan sebagai badge berwarna, klik untuk siklus ke status berikutnya (Draft → Review → Terjadwal → Publish → kembali ke Draft)
- Tombol hapus per entri

---

## 7. Section: Daftar Proyek

Field per proyek:
| Field | Tipe | Keterangan |
|---|---|---|
| Nama proyek | text | wajib |
| Status | select | Rencana, Berjalan, Selesai |
| Deskripsi | text | opsional |

**Perilaku:**
- Ditampilkan sebagai grid kartu (card grid), bukan list
- Status berupa badge yang bisa diklik untuk siklus ganti status
- Tombol hapus per proyek

---

## 8. Model data (skema penyimpanan)

Gunakan 6 "tabel"/key penyimpanan terpisah:

```
access-code          → string (kode akses)
schedule-kuliah       → [{ id, hari, jamMulai, jamSelesai, mataKuliah, ruang }]
schedule-tambahan     → [{ id, tanggal, jam, judul, catatan }]
tasks                 → [{ id, title, cat, deadline, done }]
notes                 → [{ id, content, createdAt }]
content-calendar      → [{ id, tanggal, platform, status, caption }]
projects              → [{ id, nama, status, deskripsi }]
```

Setiap entri butuh `id` unik (misal timestamp + random string) supaya bisa dihapus/diedit tanpa bentrok.

---

## 9. Saran teknis implementasi

- Frontend: React (atau HTML/CSS/JS biasa jika lebih familiar)
- State management: cukup `useState`/`useEffect` per section, tidak perlu library tambahan untuk skala personal ini
- Penyimpanan data: bisa pakai localStorage (jika hanya jalan di satu browser) atau backend sederhana (misal Supabase/Firebase) kalau ingin akses dari beberapa device
- Validasi input dasar: field wajib tidak boleh kosong sebelum submit (misal judul tugas, mata kuliah, nama proyek)

---

## 10. Deploy ke Vercel

**Stack yang disarankan untuk Vercel:**
- Framework: **Next.js** (App Router) — didukung penuh dan native di Vercel, tidak perlu konfigurasi tambahan
- Penyimpanan data: karena Vercel adalah platform serverless (tidak ada filesystem persisten antar request), localStorage saja **tidak cukup** kalau ingin data konsisten diakses dari device berbeda. Pilihan:
  - **Vercel Postgres** atau **Neon** (gratis untuk skala kecil) — paling cocok kalau mau tetap 100% di ekosistem Vercel
  - **Supabase** — alternatif populer, gratis untuk skala personal, sudah termasuk auth kalau nanti mau upgrade dari sekadar kode akses
  - Kalau tetap ingin simpel dan hanya dipakai di satu browser/device, localStorage masih bisa dipakai — tidak perlu database sama sekali

**Struktur project (kalau pakai Next.js):**
- Route API (`/app/api/...`) untuk operasi CRUD ke masing-masing "tabel" (jadwal, tugas, catatan, konten, proyek)
- Kode akses disimpan sebagai environment variable di Vercel (`ACCESS_CODE`) alih-alih hardcode di kode, supaya tidak ikut ter-push ke repository publik

**Langkah deploy singkat:**
1. Push project ke repository GitHub
2. Import repository tersebut di dashboard Vercel (New Project → pilih repo)
3. Kalau pakai database eksternal (Supabase/Neon), tambahkan connection string dan `ACCESS_CODE` di menu Environment Variables Vercel sebelum deploy
4. Vercel otomatis build dan deploy setiap kali ada push ke branch utama

**Catatan:**
- Environment variable yang berisi kode akses atau connection string database jangan pernah ditulis langsung di kode yang di-commit ke repo publik
- Kalau repository GitHub-nya publik, sebaiknya pastikan tidak ada data pribadi (nama, jadwal asli) yang ikut ter-commit sebagai contoh/dummy data

---

## 11. Daftar cek fitur (checklist)

- [ ] Gerbang kode akses (setup + login)
- [ ] Jadwal kuliah: tambah, hapus, tampil per hari
- [ ] Impor jadwal kuliah dari spreadsheet (paste text)
- [ ] Jadwal tambahan: tambah, hapus, urut tanggal
- [ ] Tugas: tambah, checkbox selesai, kategori, filter, hapus
- [ ] Catatan: tambah dengan timestamp otomatis, hapus
- [ ] Content calendar: tambah, ubah status via klik, hapus
- [ ] Daftar proyek: tambah, ubah status via klik, hapus
- [ ] Data tersimpan permanen antar sesi
- [ ] Project berhasil di-deploy ke Vercel dan bisa diakses via URL
