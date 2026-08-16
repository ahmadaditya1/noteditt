# Design Spec — Recreate "Day Job" (dayjob.work)

> Disusun berdasarkan hasil observasi langsung ke situs, metadata halaman, dan dokumen case study publik Day Job. Beberapa detail visual persis (ukuran font, spacing) tidak bisa diambil otomatis karena situs asli 100% client-side rendered (loading screen sebelum konten muncul) — bagian yang butuh verifikasi manual ditandai **[VERIFY]**.

---

## 1. Ringkasan Konsep

Day Job adalah studio kreatif kecil (4 orang) yang menjual diri lewat website bertema **retro desktop OS / komputer jadul** — bukan landing page korporat biasa. Kesan yang dibangun: nostalgic, playful, sedikit "hacker/underground", tapi tetap profesional karena portofolionya nyata (brand DTC seperti David Protein).

**Tagline utama:** "we make brands, campaigns, and websites." (huruf kecil semua, konsisten di semua halaman & meta tag)

---

## 2. Konsep Visual: Desktop OS Simulation

Seluruh situs berperilaku seperti sistem operasi lama (mirip Windows 95/98 atau boot screen DOS), bukan seperti website konvensional dengan navbar/scroll biasa.

### Elemen wajib untuk direplikasi:
- **Boot/Loading screen** — muncul pertama kali sebelum konten "OS" ter-load. Teks "Loading" polos.
- **Tombol "Start"** — ikon start seperti taskbar Windows, jadi entry point interaksi.
- **Toggle audio** — tombol mute/unmute untuk ambience sound (`audio-disabled.png` icon), memutar file ambience loop di background. Ini penting untuk mood — jangan di-skip.
- **Sistem "window"** — konten dimuat sebagai jendela/window yang bisa dibuka-tutup, bukan halaman terpisah biasa. Struktur URL asli: `/window/news`, `/window/work`, `/window/jobs`, dst — mengindikasikan tiap "halaman" sebenarnya adalah window di dalam satu desktop environment.
- **Easter egg game Doom** yang bisa dimainkan langsung di browser (`/dos/doom/`) — kemungkinan pakai DOS emulator berbasis JS (mis. js-dos / em-dosbox).
- **Penamaan halaman gaya file system** — halaman "About" diberi nama `README.txt`, bukan "About Us". Pertahankan konvensi ini untuk halaman lain jika relevan (mis. bisa pakai ekstensi/nama file palsu: `WORK.exe`, `NEWS.log`, dst — opsional tapi sesuai vibe).

**[VERIFY]** — perlu screenshot langsung dari browser (bukan API fetch) untuk memastikan: tata letak ikon desktop, kursor custom, animasi buka/tutup window, apakah ada sound effect klik ala Windows.

---

## 3. Sistem Warna

| Token | Nilai | Sumber |
|---|---|---|
| Primary/Theme color | `#0066ff` | `meta theme-color` & `msapplication-TileColor` di semua halaman |
| Background desktop | **[VERIFY]** — kemungkinan hitam/gelap khas terminal, atau biru solid ala Windows 3.1 desktop |
| Teks | **[VERIFY]** |

Rekomendasi awal jika ingin start cepat: background gelap (`#000` atau `#0a0a0a`), aksen biru `#0066ff` untuk tombol/highlight, teks putih/abu terang — kombinasi umum untuk tema terminal/retro-OS yang kontras tinggi.

---

## 4. Tipografi

**[VERIFY]** — tidak ada info font-family di metadata. Untuk vibe retro-OS, kandidat umum yang sering dipakai situs sejenis:
- Font sistem/monospace untuk elemen "OS" (mis. `MS Sans Serif` reproduction, `Perfect DOS VGA 437`, atau fallback `monospace`)
- Font sans-serif modern untuk konten portofolio agar tetap terbaca

Saran: cek via browser DevTools → tab Elements → computed styles untuk font-family asli sebelum finalisasi.

---

## 5. Struktur Halaman / Sitemap

Berdasarkan URL yang ditemukan:

```
/                    → Landing / Desktop utama (boot screen → desktop)
/about               → "README.txt" — profil studio & tim
/jobs                → Open Jobs — lowongan kerja
/window/news         → News window
/window/work         → Work / portfolio window
/window/jobs         → Jobs window (kemungkinan duplikat dari /jobs)
/work/[slug]          → Detail proyek, contoh: /work/david-protein
/dos/doom/           → Easter egg — game Doom playable
```

Semua halaman berbagi meta tag identik (title "Day Job", description sama) — menunjukkan ini **single-page app** dengan routing client-side, konten sebenarnya di-render sebagai "window" di atas satu shell, bukan halaman HTML terpisah secara konseptual.

---

## 6. Konten yang Perlu Direplikasi

### Halaman About (README.txt)
Isi (dari case study PDF, kemungkinan mirror di web):
> "A small full-service studio. We're basically 4 people. We've worked in startups, television, design offices, ad agencies, publishing, and consumer packaged goods – making content, photography, graphic design, retail experiences, branding, billboards, websites, commercials, and more."

**Tim:**
| Nama | Peran |
|---|---|
| Rion Harmon | VP Marketing / Creative Director — pengalaman di Zipcar, ZICO Coconut Water, MakeSpace |
| Spencer Madsen | Brand-defining copywriter — pernah meluncurkan channel VICELAND |
| Tyler Madsen | Senior writer eks Stink Studios; pembuat akun viral @BERNIETHOUGHTS |
| Justin Sloane | Full-stack developer, spesialis pengalaman web interaktif |

### Portfolio / Work
Minimal satu case study teridentifikasi: **David Protein** (`/work/david-protein`) — brand suplemen/consumer product.

### Kontak
Email: `info@dayjob.work`
Twitter/X: `@dayjobstudios`

---

## 7. Rekomendasi Stack Teknis untuk Recreate

Situs asli terindikasi:
- **Hosting:** Vercel (terlihat dari path `_vercel/image` untuk image optimization)
- **Framework:** kemungkinan Next.js (pola umum di Vercel + image optimization otomatis)
- **Client-side routing** penuh (semua meta tag sama di tiap URL → SPA behavior meski pakai Next.js routes)

Untuk recreate, stack yang masuk akal:
- **Next.js** (App Router) — untuk struktur routing `/window/[name]`, `/work/[slug]`
- **State management ringan** (Zustand/Context) untuk mengatur window mana yang terbuka, posisi drag, z-index — mirip window manager
- **js-dos** atau **em-dosbox** untuk emulasi Doom di browser
- **Howler.js** atau native `<audio>` untuk ambience loop + toggle mute
- **Framer Motion** untuk animasi buka/tutup/drag window ala OS

---

## 8. Yang Masih Perlu Kamu Verifikasi Manual

Karena saya tidak bisa screenshot situs live (client-rendered, tools saya hanya baca HTML/metadata mentah), sebelum mulai coding, cek langsung di browser dan catat:
1. Layout desktop persis — ada ikon-ikon di desktop? Wallpaper?
2. Font family asli (Inspect Element)
3. Perilaku window: bisa di-drag? Resize? Minimize/maximize seperti OS asli?
4. Cursor custom?
5. Sound effect selain ambience (klik, buka window, dsb)?
6. Transisi/animasi spesifik (durasi, easing)
7. Responsive behavior di mobile — apakah tema "desktop OS" tetap dipertahankan atau fallback ke layout mobile biasa?

---

## 9. Catatan Hukum/Etika

Ini adalah rekreasi untuk pembelajaran/referensi desain — bukan untuk mengklaim sebagai karya asli Day Job atau menjiplak identitas brand mereka (nama, logo, copy persis) untuk keperluan komersial. Kalau tujuannya portofolio pribadi atau eksperimen teknis, aman; kalau untuk klien/produk publik, ganti konten (nama tim, copy, brand) dengan milik sendiri dan pertahankan hanya *pola interaksi/UX*-nya.
