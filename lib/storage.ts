import {
  JadwalKuliah,
  JadwalTambahan,
  Tugas,
  Catatan,
  KontenCalendar,
  Proyek,
} from './types';

const KEYS = {
  SCHEDULE_KULIAH: 'schedule-kuliah',
  SCHEDULE_TAMBAHAN: 'schedule-tambahan',
  TASKS: 'tasks',
  NOTES: 'notes',
  CONTENT_CALENDAR: 'content-calendar',
  PROJECTS: 'projects',
} as const;

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function get<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage error:', e);
  }
}

// ─── Toast Notification untuk Sync Errors ─────────────────────────────────────
// Menampilkan pesan error kecil di pojok bawah kanan ketika data gagal disimpan
// ke database. User perlu tahu bahwa data hanya tersimpan di browser.
function showSyncWarning(message: string): void {
  if (typeof window === 'undefined') return;
  console.warn('[Sync]', message);

  // Hindari spam toast — max 1 setiap 3 detik
  const now = Date.now();
  const lastShown = (window as unknown as Record<string, number>).__lastSyncToast || 0;
  if (now - lastShown < 3000) return;
  (window as unknown as Record<string, number>).__lastSyncToast = now;

  const toast = document.createElement('div');
  toast.textContent = `⚠️ ${message}`;
  toast.style.cssText = [
    'position:fixed', 'bottom:50px', 'right:12px', 'z-index:99999',
    'background:#c00', 'color:#fff', 'padding:6px 14px',
    'border:2px outset #e88', 'font-size:11px', 'font-family:Tahoma,sans-serif',
    'box-shadow:2px 2px 0 rgba(0,0,0,0.4)', 'max-width:340px',
    'opacity:0', 'transition:opacity 0.3s',
  ].join(';');
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

/**
 * Helper: kirim request ke API dan cek apakah berhasil.
 * - Cek response.ok (HTTP status)
 * - Cek body.success === false atau body.mode === 'local'
 * - Tampilkan toast ke user jika gagal
 * - Return true jika berhasil tersimpan ke database
 */
async function apiRequest(url: string, options: RequestInit): Promise<boolean> {
  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body.error || body.message || `Server error (HTTP ${res.status})`;
      console.error('[API]', msg, { url, status: res.status, body });
      showSyncWarning(`Data gagal disimpan ke database: ${msg}`);
      return false;
    }

    const body = await res.json().catch(() => ({}));

    if (body.success === false || body.mode === 'local') {
      const msg = body.message || 'Database tidak terhubung.';
      console.warn('[API] Server responded with failure:', body);
      showSyncWarning(msg);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[API] Network error:', err);
    showSyncWarning('Gagal menghubungi server. Data hanya tersimpan di browser.');
    return false;
  }
}

// ─── Unified Data Sync with Server (PostgreSQL) ──────────────────────────────
export interface AllDashboardData {
  connected?: boolean;
  jadwalKuliah: JadwalKuliah[];
  jadwalTambahan: JadwalTambahan[];
  tugas: Tugas[];
  catatan: Catatan[];
  konten: KontenCalendar[];
  proyek: Proyek[];
}

export function getAllLocalData(): AllDashboardData {
  return {
    jadwalKuliah: getJadwalKuliah(),
    jadwalTambahan: getJadwalTambahan(),
    tugas: getTugas(),
    catatan: getCatatan(),
    konten: getKonten(),
    proyek: getProyek(),
  };
}

export async function fetchAllDataFromServer(): Promise<AllDashboardData | null> {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) {
      console.warn('[fetchAllData] Server returned', res.status);
      return null;
    }
    const data = await res.json();

    // If server database is not configured or offline, never wipe out local storage
    if (!data || data.connected === false) {
      if (data?.error) {
        console.warn('[fetchAllData] DB not connected:', data.error);
      }
      return null;
    }

    // Cache to localStorage only if connected database returned valid data
    if (Array.isArray(data.jadwalKuliah)) set(KEYS.SCHEDULE_KULIAH, data.jadwalKuliah);
    if (Array.isArray(data.jadwalTambahan)) set(KEYS.SCHEDULE_TAMBAHAN, data.jadwalTambahan);
    if (Array.isArray(data.tugas)) set(KEYS.TASKS, data.tugas);
    if (Array.isArray(data.catatan)) set(KEYS.NOTES, data.catatan);
    if (Array.isArray(data.konten)) set(KEYS.CONTENT_CALENDAR, data.konten);
    if (Array.isArray(data.proyek)) set(KEYS.PROJECTS, data.proyek);

    return data as AllDashboardData;
  } catch (error) {
    console.warn('Database server not reachable, using localStorage data:', error);
    return null;
  }
}

// ─── Migrasi localStorage → Supabase (sinkronisasi satu arah) ────────────────
export async function pushAllLocalDataToServer(): Promise<{ success: boolean; message: string }> {
  const local = getAllLocalData();
  const results: string[] = [];
  let hasError = false;

  try {
    // Jadwal Kuliah
    if (local.jadwalKuliah.length > 0) {
      const ok = await apiRequest('/api/schedule-kuliah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: local.jadwalKuliah }),
      });
      if (ok) results.push(`✅ ${local.jadwalKuliah.length} jadwal kuliah`);
      else { results.push('❌ jadwal kuliah gagal'); hasError = true; }
    }

    // Jadwal Tambahan
    for (const item of local.jadwalTambahan) {
      const ok = await apiRequest('/api/schedule-tambahan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!ok) hasError = true;
    }
    if (local.jadwalTambahan.length > 0) results.push(hasError ? '❌ jadwal tambahan (sebagian gagal)' : `✅ ${local.jadwalTambahan.length} jadwal tambahan`);

    // Tugas
    let tugasError = false;
    for (const item of local.tugas) {
      const ok = await apiRequest('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!ok) { tugasError = true; hasError = true; }
    }
    if (local.tugas.length > 0) results.push(tugasError ? '❌ tugas (sebagian gagal)' : `✅ ${local.tugas.length} tugas`);

    // Catatan
    let catatanError = false;
    for (const item of local.catatan) {
      const ok = await apiRequest('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!ok) { catatanError = true; hasError = true; }
    }
    if (local.catatan.length > 0) results.push(catatanError ? '❌ catatan (sebagian gagal)' : `✅ ${local.catatan.length} catatan`);

    // Konten Calendar
    let kontenError = false;
    for (const item of local.konten) {
      const ok = await apiRequest('/api/content-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!ok) { kontenError = true; hasError = true; }
    }
    if (local.konten.length > 0) results.push(kontenError ? '❌ konten (sebagian gagal)' : `✅ ${local.konten.length} konten`);

    // Proyek
    let proyekError = false;
    for (const item of local.proyek) {
      const ok = await apiRequest('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!ok) { proyekError = true; hasError = true; }
    }
    if (local.proyek.length > 0) results.push(proyekError ? '❌ proyek (sebagian gagal)' : `✅ ${local.proyek.length} proyek`);

    const total = local.jadwalKuliah.length + local.jadwalTambahan.length +
      local.tugas.length + local.catatan.length + local.konten.length + local.proyek.length;

    if (total === 0) {
      return { success: false, message: 'Tidak ada data lokal yang perlu disinkronisasi.' };
    }

    return {
      success: !hasError,
      message: results.join(', '),
    };
  } catch (err) {
    console.error('Sync error:', err);
    return { success: false, message: 'Gagal menghubungi server.' };
  }
}


// ─── Jadwal Kuliah ──────────────────────────────────────────────────────────
export const getJadwalKuliah = (): JadwalKuliah[] =>
  get<JadwalKuliah[]>(KEYS.SCHEDULE_KULIAH, []);

export const saveJadwalKuliah = async (list: JadwalKuliah[]): Promise<void> => {
  set(KEYS.SCHEDULE_KULIAH, list);
  await apiRequest('/api/schedule-kuliah', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: list }),
  });
};

export const addJadwalKuliah = async (item: Omit<JadwalKuliah, 'id'>): Promise<void> => {
  const list = getJadwalKuliah();
  const newItem: JadwalKuliah = { ...item, id: genId() };
  list.push(newItem);
  set(KEYS.SCHEDULE_KULIAH, list);

  await apiRequest('/api/schedule-kuliah', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem),
  });
};

export const deleteJadwalKuliah = async (id: string): Promise<void> => {
  set(KEYS.SCHEDULE_KULIAH, getJadwalKuliah().filter((x) => x.id !== id));
  await apiRequest(`/api/schedule-kuliah?id=${id}`, { method: 'DELETE' });
};

// ─── Jadwal Tambahan ─────────────────────────────────────────────────────────
export const getJadwalTambahan = (): JadwalTambahan[] =>
  get<JadwalTambahan[]>(KEYS.SCHEDULE_TAMBAHAN, []);

export const saveJadwalTambahan = async (list: JadwalTambahan[]): Promise<void> => {
  set(KEYS.SCHEDULE_TAMBAHAN, list);
};

export const addJadwalTambahan = async (item: Omit<JadwalTambahan, 'id'>): Promise<void> => {
  const list = getJadwalTambahan();
  const newItem: JadwalTambahan = { ...item, id: genId() };
  list.push(newItem);
  list.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  set(KEYS.SCHEDULE_TAMBAHAN, list);

  await apiRequest('/api/schedule-tambahan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem),
  });
};

export const deleteJadwalTambahan = async (id: string): Promise<void> => {
  set(KEYS.SCHEDULE_TAMBAHAN, getJadwalTambahan().filter((x) => x.id !== id));
  await apiRequest(`/api/schedule-tambahan?id=${id}`, { method: 'DELETE' });
};

// ─── Tugas ──────────────────────────────────────────────────────────────────
export const getTugas = (): Tugas[] => get<Tugas[]>(KEYS.TASKS, []);

export const saveTugas = async (list: Tugas[]): Promise<void> => {
  set(KEYS.TASKS, list);
};

export const addTugas = async (item: Omit<Tugas, 'id'>): Promise<void> => {
  const list = getTugas();
  const newItem: Tugas = { ...item, id: genId() };
  list.push(newItem);
  set(KEYS.TASKS, list);

  await apiRequest('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem),
  });
};

export const toggleTugas = async (id: string): Promise<void> => {
  let newDone = false;
  const list = getTugas().map((t) => {
    if (t.id === id) {
      newDone = !t.done;
      return { ...t, done: newDone };
    }
    return t;
  });
  set(KEYS.TASKS, list);

  await apiRequest('/api/tasks', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, done: newDone }),
  });
};

export const deleteTugas = async (id: string): Promise<void> => {
  set(KEYS.TASKS, getTugas().filter((x) => x.id !== id));
  await apiRequest(`/api/tasks?id=${id}`, { method: 'DELETE' });
};

// ─── Catatan ─────────────────────────────────────────────────────────────────
export const getCatatan = (): Catatan[] => get<Catatan[]>(KEYS.NOTES, []);

export const saveCatatan = async (list: Catatan[]): Promise<void> => {
  set(KEYS.NOTES, list);
};

export const addCatatan = async (content: string): Promise<void> => {
  const list = getCatatan();
  const now = new Date();
  const createdAt = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const newItem: Catatan = { id: genId(), content, createdAt };
  list.unshift(newItem);
  set(KEYS.NOTES, list);

  await apiRequest('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem),
  });
};

export const deleteCatatan = async (id: string): Promise<void> => {
  set(KEYS.NOTES, getCatatan().filter((x) => x.id !== id));
  await apiRequest(`/api/notes?id=${id}`, { method: 'DELETE' });
};

// ─── Content Calendar ────────────────────────────────────────────────────────
export const getKonten = (): KontenCalendar[] =>
  get<KontenCalendar[]>(KEYS.CONTENT_CALENDAR, []);

export const saveKonten = async (list: KontenCalendar[]): Promise<void> => {
  set(KEYS.CONTENT_CALENDAR, list);
};

export const addKonten = async (item: Omit<KontenCalendar, 'id'>): Promise<void> => {
  const list = getKonten();
  const newItem: KontenCalendar = { ...item, id: genId() };
  list.push(newItem);
  list.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  set(KEYS.CONTENT_CALENDAR, list);

  await apiRequest('/api/content-calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem),
  });
};

export const cycleKontenStatus = async (id: string): Promise<void> => {
  const cycle = ['Draft', 'Review', 'Terjadwal', 'Publish'] as const;
  let nextStatus: typeof cycle[number] = 'Draft';
  const list = getKonten().map((k) => {
    if (k.id !== id) return k;
    const idx = cycle.indexOf(k.status);
    nextStatus = cycle[(idx + 1) % cycle.length];
    return { ...k, status: nextStatus };
  });
  set(KEYS.CONTENT_CALENDAR, list);

  await apiRequest('/api/content-calendar', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status: nextStatus }),
  });
};

export const deleteKonten = async (id: string): Promise<void> => {
  set(KEYS.CONTENT_CALENDAR, getKonten().filter((x) => x.id !== id));
  await apiRequest(`/api/content-calendar?id=${id}`, { method: 'DELETE' });
};

// ─── Proyek ──────────────────────────────────────────────────────────────────
export const getProyek = (): Proyek[] => get<Proyek[]>(KEYS.PROJECTS, []);

export const saveProyek = async (list: Proyek[]): Promise<void> => {
  set(KEYS.PROJECTS, list);
};

export const addProyek = async (item: Omit<Proyek, 'id'>): Promise<void> => {
  const list = getProyek();
  const newItem: Proyek = { ...item, id: genId() };
  list.push(newItem);
  set(KEYS.PROJECTS, list);

  await apiRequest('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem),
  });
};

export const cycleProyekStatus = async (id: string): Promise<void> => {
  const cycle = ['Rencana', 'Berjalan', 'Selesai'] as const;
  let nextStatus: typeof cycle[number] = 'Rencana';
  const list = getProyek().map((p) => {
    if (p.id !== id) return p;
    const idx = cycle.indexOf(p.status);
    nextStatus = cycle[(idx + 1) % cycle.length];
    return { ...p, status: nextStatus };
  });
  set(KEYS.PROJECTS, list);

  await apiRequest('/api/projects', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status: nextStatus }),
  });
};

export const deleteProyek = async (id: string): Promise<void> => {
  set(KEYS.PROJECTS, getProyek().filter((x) => x.id !== id));
  await apiRequest(`/api/projects?id=${id}`, { method: 'DELETE' });
};
