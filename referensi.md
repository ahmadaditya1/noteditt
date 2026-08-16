# Referensi Desain: Day Job → Dashboard Pribadi

> **Sumber Inspirasi**: [Day Job Studio](https://dayjob.work/?ref=landing.love)
> **Dikaitkan dengan**: `spek-dashboard-pribadi(1).md`
> **Tujuan Dokumen**: Mengadaptasi pola desain & UX dari Day Job secara konkret ke kebutuhan dashboard pribadi ini.

---

## 1. Konteks & Relevansi

Day Job (dayjob.work) adalah creative studio yang websitenya **membuktikan konsep** tanpa menjelaskannya — semua keahlian mereka tercermin langsung dari desain dan interaksi situs itu sendiri. Prinsip ini sangat relevan untuk dashboard pribadi ini:

> **Dashboard ini juga bukan produk untuk orang lain — ini adalah *alat kerja personal* yang harus terasa seperti milik sendiri, efisien, dan menyenangkan dipakai setiap hari.**

Referensi ini memetakan elemen dari Day Job yang **bisa dan layak diadaptasi** ke dalam proyek dashboard ini, berdasarkan spesifikasi di `spek-dashboard-pribadi(1).md`.

---

## 2. Pemetaan Inspirasi → Implementasi

### 2.1 Metafora OS Desktop → Navigasi Dashboard

**Dari Day Job:**
Day Job menggunakan paradigma **Windows 95/98 Desktop** — konten dibuka dalam *floating windows* yang bisa di-drag, minimize, dan di-fokuskan. Navigasi bukan lagi menu linear, melainkan layaknya desktop komputer.

**Adaptasi untuk Dashboard Pribadi:**
Dashboard ini memiliki 6 section utama (Jadwal, Tugas, Catatan, Content Calendar, Proyek, dan Kode Akses). Alih-alih sidebar atau tab biasa, pertimbangkan pendekatan berikut:

| Pendekatan | Cara Implementasi | Kelebihan |
| :--- | :--- | :--- |
| **Sidebar dengan ikon** | Ikon per section (mirip dock/taskbar) di sisi kiri | Compact, navigasi cepat |
| **Panel card** | Setiap section sebagai card/panel di layout grid | Semua konteks terlihat sekilas |
| **Tab + header** | Tab horizontal sederhana, konten berganti | Familier, mudah dipahami |

> **Rekomendasi**: Gunakan layout **sidebar ikon + konten panel utama** — meniru spirit navigasi OS tapi tetap efisien untuk penggunaan harian.

---

### 2.2 Palet Warna & Estetika

**Dari Day Job:**
* `win-blue` `#0066ff` / `#000082` — Biru kuat sebagai warna identitas
* `win-bg` `#c0c0c0` — Abu-abu netral sebagai background window
* Aksen kuning `#ffff00` dan merah `#ff0000` untuk peringatan/status

**Adaptasi untuk Dashboard Pribadi:**
Pilih palet yang tetap terasa **premium dan personal**, bukan corporate. Beberapa opsi yang selaras dengan semangat proyek ini:

| Opsi Palet | Background | Aksen Utama | Warna Status |
| :--- | :--- | :--- | :--- |
| **Dark Mode Elegan** | `#0f0f14` (hitam keungu-an) | `#6c63ff` (ungu neon) | Hijau `#22c55e` / Kuning `#fbbf24` |
| **Midnight Blue** | `#0a0e1a` | `#3b82f6` (biru cerah) | Hijau / Oranye `#f97316` |
| **Dark Warm** | `#12100e` (coklat gelap) | `#f59e0b` (amber) | Merah rose / Hijau |

> **Rekomendasi**: Gunakan **Dark Mode Elegan** (`#0f0f14` + `#6c63ff`) — kontras tinggi, tidak melelahkan mata untuk pemakaian panjang, terasa modern dan personal.

**Warna Badge Kategori Tugas** (dari spek section 4):
```
Kuliah    → #3b82f6  (biru)
Tikethub  → #8b5cf6  (ungu)
Porta Pic → #ec4899  (pink)
Personal  → #22c55e  (hijau)
```

**Warna Badge Status Content Calendar** (dari spek section 6):
```
Draft      → #6b7280  (abu)
Review     → #f59e0b  (kuning)
Terjadwal  → #3b82f6  (biru)
Publish    → #22c55e  (hijau)
```

**Warna Badge Status Proyek** (dari spek section 7):
```
Rencana   → #6b7280  (abu)
Berjalan  → #f59e0b  (kuning/amber)
Selesai   → #22c55e  (hijau)
```

---

### 2.3 Window / Panel sebagai Komponen Utama

**Dari Day Job:**
Setiap "aplikasi" di Day Job hidup dalam jendela mandiri dengan header bar bertuliskan judul, tombol minimize/close, dan area konten. Ini menciptakan rasa *layered dan terstruktur*.

**Adaptasi untuk Dashboard Pribadi:**
Setiap section dashboard dibungkus dalam **panel berkepala (headed panel)**:

```
┌─────────────────────────────────────────────┐
│  📅  Jadwal Kuliah                    [+ Tambah] │
├─────────────────────────────────────────────┤
│  Senin                                       │
│    08.00 - 09.40  Pemrograman Web  · R.201   │
│    10.00 - 11.40  Basis Data       · R.305   │
│  ...                                         │
└─────────────────────────────────────────────┘
```

Setiap panel memiliki:
* **Header** dengan ikon, judul section, dan tombol aksi (misal `+ Tambah`)
* **Body** dengan konten utama section
* **Border/shadow halus** untuk memisahkan antar panel secara visual

---

### 2.4 Interaktivitas & Micro-interactions

**Dari Day Job:**
Day Job menggunakan animasi masuk (*enter/leave animation*) pada setiap jendela — scale dari 90% ke 100% dengan fade opacity. Detail kecil ini membuat pengalaman terasa *alive*.

**Adaptasi untuk Dashboard Pribadi:**
Terapkan micro-interactions di titik-titik kunci:

| Aksi Pengguna | Micro-interaction yang Disarankan |
| :--- | :--- |
| Tambah entri baru | Baris baru muncul dengan `slide-down + fade-in` |
| Centang tugas selesai | Teks langsung strikethrough + fade sedikit |
| Klik status badge (Content/Proyek) | Badge berubah warna dengan `transition: 0.2s` |
| Hapus entri | Baris hilang dengan `fade-out + slide-up` |
| Login kode akses | Input shake jika kode salah |

Implementasi cukup dengan CSS transition + sedikit JS/React state — tidak perlu library animasi berat.

---

### 2.5 Gerbang Akses (Login Screen)

**Dari Day Job:**
Halaman awal Day Job langsung melempar pengguna ke desktop interaktif — tidak ada splash screen membosankan. Namun identitas brand langsung terasa di detik pertama.

**Adaptasi untuk Dashboard Pribadi:**
Layar kode akses (dari spek section 2) harus tetap sederhana tapi berkarakter:

```
┌──────────────────────────────┐
│                              │
│   ⊹ Dashboard Pribadi        │
│                              │
│   [ Masukkan kode akses  ]   │
│   [ Masuk → ]                │
│                              │
│   (jika salah: shake + error)|
└──────────────────────────────┘
```

* Background gelap penuh dengan **satu card terpusat** (bukan form panjang)
* Animasi `shake` bila kode salah — persis feedback negatif yang familiar
* Setelah berhasil: transisi `fade-out` layar login → `fade-in` dashboard

---

### 2.6 Easter Egg / Sentuhan Personal

**Dari Day Job:**
Menyematkan game DOOM yang bisa dimainkan adalah contoh ekstrem — tapi pesannya jelas: **tambahkan sesuatu yang membuat website ini terasa milik seseorang, bukan template.**

**Adaptasi untuk Dashboard Pribadi:**
Karena ini dipakai sendiri, tambahkan sentuhan personal kecil yang bermakna:

- **Greeting dinamis** di header: `"Selamat pagi, apa rencana hari ini?"` berubah sesuai waktu
- **Quote acak** dari koleksi pribadi yang muncul setiap reload
- **Indikator tugas pending** di header: `3 tugas belum selesai · 2 konten draft`
- Nomor versi kecil di footer: `v0.1.0 · made for myself`

---

## 3. Tech Stack yang Diselaraskan

Merujuk pada `spek-dashboard-pribadi(1).md` section 9 & 10:

| Kebutuhan | Pilihan dari Spek | Catatan Tambahan dari Referensi |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | Sesuai — Day Job juga memakai SSR framework (Nuxt 3 / Vue) |
| **Styling** | HTML/CSS/JS atau Tailwind | Day Job: Tailwind + CSS Variables — ikuti pola ini untuk konsistensi token warna |
| **Storage** | localStorage atau Supabase/Neon | Mulai dengan localStorage, upgrade ke Supabase jika perlu akses multi-device |
| **Deploy** | Vercel | Sama dengan Day Job — hosting di Vercel, zero-config untuk Next.js |

**Saran tambahan untuk CSS Variables** (meniru pola Day Job):
```css
:root {
  --color-bg:        #0f0f14;
  --color-surface:   #1a1a24;
  --color-border:    #2a2a38;
  --color-accent:    #6c63ff;
  --color-text:      #e2e8f0;
  --color-muted:     #64748b;
  --color-success:   #22c55e;
  --color-warning:   #f59e0b;
  --color-danger:    #ef4444;

  --radius-panel:    12px;
  --transition-base: 0.2s ease;
}
```

---

## 4. Prinsip Desain Ringkas (Untuk Diingat)

Diambil dari pelajaran menganalisis Day Job, disesuaikan ke konteks dashboard pribadi ini:

1. **Fungsional dulu, estetik mengikuti** — Semua fitur dari checklist di section 11 spek harus jalan sebelum menghabiskan waktu di animasi.
2. **Setiap section adalah satu alat** — Panel Jadwal, Tugas, Catatan, dll. harus terasa mandiri dan fokus, bukan saling berhimpit.
3. **Identitas personal > template generik** — Tambahkan minimal satu elemen yang bikin dashboard ini terasa milik kamu sendiri (greeting, quote, warna favorit).
4. **Konsistensi token** — Gunakan CSS variables untuk warna, radius, dan transisi sejak awal agar mudah diubah nanti.
5. **Data aman dari awal** — Jangan commit kode akses atau data pribadi ke repo; pakai `.env` dan Vercel Environment Variables sejak hari pertama.

---

## 5. Checklist Desain (Melengkapi Checklist Fitur Spek)

Checklist ini melengkapi `## 11. Daftar cek fitur` di `spek-dashboard-pribadi(1).md`:

- [ ] CSS Variables terdefinisi lengkap (`color`, `radius`, `transition`)
- [ ] Layout sidebar + panel konten terpasang dan responsif
- [ ] Headed panel konsisten di semua 6 section
- [ ] Warna badge kategori tugas terpasang (Kuliah, Tikethub, Porta Pic, Personal)
- [ ] Warna badge status Content Calendar terpasang (Draft → Publish)
- [ ] Warna badge status Proyek terpasang (Rencana → Selesai)
- [ ] Micro-interaction: fade-in saat tambah entri
- [ ] Micro-interaction: strikethrough smooth saat tugas dicentang
- [ ] Micro-interaction: shake saat kode akses salah
- [ ] Greeting dinamis di header berdasarkan waktu
- [ ] Transisi login → dashboard (fade)
- [ ] Tidak ada data dummy / kode akses yang ikut ter-commit ke repo
