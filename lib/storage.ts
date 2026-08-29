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

export type SyncStatus = 'loading' | 'synced' | 'local_only';

export interface AllDashboardData {
  jadwalKuliah: JadwalKuliah[];
  jadwalTambahan: JadwalTambahan[];
  tugas: Tugas[];
  catatan: Catatan[];
  konten: KontenCalendar[];
  proyek: Proyek[];
}

export interface FetchResult {
  data: AllDashboardData;
  source: 'server' | 'local';
  connected: boolean;
}

export interface MutationResult {
  success: boolean;
  localOnly?: boolean;
}

const EMPTY_DATA: AllDashboardData = {
  jadwalKuliah: [],
  jadwalTambahan: [],
  tugas: [],
  catatan: [],
  konten: [],
  proyek: [],
};

const DATA_FETCH_TIMEOUT_MS = 12_000;
let inFlightDataFetch: Promise<FetchResult> | null = null;

// ─── Sync status (global, client-only) ───────────────────────────────────────
let syncStatus: SyncStatus = 'loading';
const syncListeners = new Set<(s: SyncStatus) => void>();

function setSyncStatus(status: SyncStatus): void {
  syncStatus = status;
  syncListeners.forEach((fn) => fn(status));
}

export function getSyncStatus(): SyncStatus {
  return syncStatus;
}

export function subscribeSyncStatus(listener: (s: SyncStatus) => void): () => void {
  syncListeners.add(listener);
  listener(syncStatus);
  return () => syncListeners.delete(listener);
}

// ─── localStorage primitives ─────────────────────────────────────────────────
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

function cacheAllData(data: AllDashboardData): void {
  set(KEYS.SCHEDULE_KULIAH, data.jadwalKuliah);
  set(KEYS.SCHEDULE_TAMBAHAN, data.jadwalTambahan);
  set(KEYS.TASKS, data.tugas);
  set(KEYS.NOTES, data.catatan);
  set(KEYS.CONTENT_CALENDAR, data.konten);
  set(KEYS.PROJECTS, data.proyek);
}

// ─── Toast notifications ─────────────────────────────────────────────────────
function showSyncWarning(message: string): void {
  if (typeof window === 'undefined') return;
  console.warn('[Sync]', message);

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
  }, 6000);
}

interface ApiBody {
  success?: boolean;
  dbStatus?: string;
  mode?: string;
  message?: string;
  error?: string;
}

/**
 * Kirim request ke API. Return true hanya jika DB connected dan operasi sukses.
 * Tampilkan toast jika gagal.
 */
async function apiRequest(url: string, options: RequestInit): Promise<boolean> {
  try {
    const res = await fetch(url, options);
    const body: ApiBody = await res.json().catch(() => ({}));

    if (!res.ok || body.success === false || body.dbStatus === 'not_connected' || body.dbStatus === 'query_failed' || body.mode === 'local') {
      const msg = body.message || body.error || `Server error (HTTP ${res.status})`;
      console.error('[API]', msg, { url, status: res.status, body });
      showSyncWarning(`Belum tersinkron ke cloud: ${msg}`);
      setSyncStatus('local_only');
      return false;
    }

    return true;
  } catch (err) {
    console.error('[API] Network error:', err);
    showSyncWarning('Gagal menghubungi server. Perubahan HANYA tersimpan lokal.');
    setSyncStatus('local_only');
    return false;
  }
}

/** Simpan ke localStorage sebagai fallback offline setelah API gagal. */
function saveLocalFallback(message: string): MutationResult {
  setSyncStatus('local_only');
  showSyncWarning(message);
  return { success: false, localOnly: true };
}

// ─── Read helpers (localStorage cache) ───────────────────────────────────────
export function getAllLocalData(): AllDashboardData {
  return {
    jadwalKuliah: get<JadwalKuliah[]>(KEYS.SCHEDULE_KULIAH, []),
    jadwalTambahan: get<JadwalTambahan[]>(KEYS.SCHEDULE_TAMBAHAN, []),
    tugas: get<Tugas[]>(KEYS.TASKS, []),
    catatan: get<Catatan[]>(KEYS.NOTES, []),
    konten: get<KontenCalendar[]>(KEYS.CONTENT_CALENDAR, []),
    proyek: get<Proyek[]>(KEYS.PROJECTS, []),
  };
}

/**
 * Fetch data dari server (PostgreSQL = SSOT).
 * Fallback ke localStorage HANYA jika fetch gagal total.
 */
export async function fetchAllDataFromServer(): Promise<FetchResult> {
  // Mount, focus, polling, dan refresh manual dapat terjadi berdekatan. Semua
  // pemanggil berbagi satu request agar koneksi pooler tidak dibanjiri.
  if (inFlightDataFetch) return inFlightDataFetch;

  inFlightDataFetch = fetchDataSnapshot();
  try {
    return await inFlightDataFetch;
  } finally {
    inFlightDataFetch = null;
  }
}

async function fetchDataSnapshot(): Promise<FetchResult> {
  setSyncStatus('loading');
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), DATA_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch('/api/data', {
      cache: 'no-store',
      signal: controller.signal,
    });
    const data = await res.json();

    if (res.ok && data.connected === true && data.dbStatus === 'connected') {
      const result: AllDashboardData = {
        jadwalKuliah: data.jadwalKuliah ?? [],
        jadwalTambahan: data.jadwalTambahan ?? [],
        tugas: data.tugas ?? [],
        catatan: data.catatan ?? [],
        konten: data.konten ?? [],
        proyek: data.proyek ?? [],
      };
      cacheAllData(result);
      setSyncStatus('synced');
      return { data: result, source: 'server', connected: true };
    }

    // A malformed query/schema is not an offline condition: never silently
    // replace server data with an older browser cache in that case.
    if (data.dbStatus === 'not_connected' || res.status === 503) {
      console.warn('[fetchAllData] Server unavailable, using localStorage fallback:', data);
      setSyncStatus('local_only');
      return { data: getAllLocalData(), source: 'local', connected: false };
    }

    console.error('[fetchAllData] Server query failed; local cache intentionally not used:', data);
    setSyncStatus('local_only');
    return { data: EMPTY_DATA, source: 'server', connected: false };
  } catch (error) {
    const reason = error instanceof DOMException && error.name === 'AbortError'
      ? `Server tidak merespons dalam ${DATA_FETCH_TIMEOUT_MS / 1000} detik`
      : 'Network error';
    console.warn(`[fetchAllData] ${reason}, using localStorage fallback:`, error);
    showSyncWarning(`${reason}. Menampilkan data lokal.`);
    setSyncStatus('local_only');
    return { data: getAllLocalData(), source: 'local', connected: false };
  } finally {
    window.clearTimeout(timeout);
  }
}

/**
 * Setelah mutasi dikonfirmasi API, cache selalu diisi ulang dari snapshot DB.
 * Dengan begitu localStorage tidak pernah menjadi sumber data untuk jalur sukses.
 */
async function refreshCacheAfterConfirmedMutation(): Promise<void> {
  await fetchAllDataFromServer();
}

/** @deprecated Gunakan fetchAllDataFromServer — migrasi one-way untuk data lama. */
export async function pushAllLocalDataToServer(): Promise<{ success: boolean; message: string }> {
  const local = getAllLocalData();
  const results: string[] = [];
  let hasError = false;

  try {
    if (local.jadwalKuliah.length > 0) {
      const ok = await apiRequest('/api/schedule-kuliah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: local.jadwalKuliah }),
      });
      if (ok) results.push(`✅ ${local.jadwalKuliah.length} jadwal kuliah`);
      else { results.push('❌ jadwal kuliah gagal'); hasError = true; }
    }

    for (const item of local.jadwalTambahan) {
      const ok = await apiRequest('/api/schedule-tambahan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!ok) hasError = true;
    }
    if (local.jadwalTambahan.length > 0) {
      results.push(hasError ? '❌ jadwal tambahan (sebagian gagal)' : `✅ ${local.jadwalTambahan.length} jadwal tambahan`);
    }

    for (const item of local.tugas) {
      const ok = await apiRequest('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!ok) hasError = true;
    }
    if (local.tugas.length > 0) results.push(hasError ? '❌ tugas (sebagian gagal)' : `✅ ${local.tugas.length} tugas`);

    for (const item of local.catatan) {
      const ok = await apiRequest('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!ok) hasError = true;
    }
    if (local.catatan.length > 0) results.push(hasError ? '❌ catatan (sebagian gagal)' : `✅ ${local.catatan.length} catatan`);

    for (const item of local.konten) {
      const ok = await apiRequest('/api/content-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!ok) hasError = true;
    }
    if (local.konten.length > 0) results.push(hasError ? '❌ konten (sebagian gagal)' : `✅ ${local.konten.length} konten`);

    for (const item of local.proyek) {
      const ok = await apiRequest('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!ok) hasError = true;
    }
    if (local.proyek.length > 0) results.push(hasError ? '❌ proyek (sebagian gagal)' : `✅ ${local.proyek.length} proyek`);

    const total = local.jadwalKuliah.length + local.jadwalTambahan.length +
      local.tugas.length + local.catatan.length + local.konten.length + local.proyek.length;

    if (total === 0) {
      return { success: false, message: 'Tidak ada data lokal yang perlu disinkronisasi.' };
    }

    if (!hasError) setSyncStatus('synced');
    return { success: !hasError, message: results.join(', ') };
  } catch (err) {
    console.error('Sync error:', err);
    return { success: false, message: 'Gagal menghubungi server.' };
  }
}

// ─── Jadwal Kuliah ──────────────────────────────────────────────────────────
export const getJadwalKuliah = (): JadwalKuliah[] =>
  get<JadwalKuliah[]>(KEYS.SCHEDULE_KULIAH, []);

export async function saveJadwalKuliah(list: JadwalKuliah[]): Promise<MutationResult> {
  const ok = await apiRequest('/api/schedule-kuliah', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: list }),
  });
  if (ok) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.SCHEDULE_KULIAH, list);
  return saveLocalFallback('Import jadwal HANYA tersimpan lokal dan belum tersinkron ke cloud.');
}

export async function addJadwalKuliah(item: Omit<JadwalKuliah, 'id'>): Promise<MutationResult> {
  const newItem: JadwalKuliah = { ...item, id: genId() };
  const ok = await apiRequest('/api/schedule-kuliah', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem),
  });
  if (ok) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.SCHEDULE_KULIAH, [...getJadwalKuliah(), newItem]);
  return saveLocalFallback('Jadwal kuliah HANYA tersimpan lokal dan belum tersinkron ke cloud.');
}

export async function deleteJadwalKuliah(id: string): Promise<MutationResult> {
  const ok = await apiRequest(`/api/schedule-kuliah?id=${id}`, { method: 'DELETE' });
  const list = getJadwalKuliah().filter((x) => x.id !== id);
  if (ok) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.SCHEDULE_KULIAH, list);
  return saveLocalFallback('Penghapusan jadwal HANYA tersimpan lokal.');
}

// ─── Jadwal Tambahan ─────────────────────────────────────────────────────────
export const getJadwalTambahan = (): JadwalTambahan[] =>
  get<JadwalTambahan[]>(KEYS.SCHEDULE_TAMBAHAN, []);

export async function saveJadwalTambahan(list: JadwalTambahan[]): Promise<MutationResult> {
  let allOk = true;
  for (const item of list) {
    const ok = await apiRequest('/api/schedule-tambahan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!ok) allOk = false;
  }
  if (allOk) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.SCHEDULE_TAMBAHAN, list);
  return saveLocalFallback('Jadwal tambahan HANYA tersimpan lokal.');
}

export async function addJadwalTambahan(item: Omit<JadwalTambahan, 'id'>): Promise<MutationResult> {
  const newItem: JadwalTambahan = { ...item, id: genId() };
  const ok = await apiRequest('/api/schedule-tambahan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem),
  });
  const list = [...getJadwalTambahan(), newItem].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  if (ok) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.SCHEDULE_TAMBAHAN, list);
  return saveLocalFallback('Jadwal tambahan HANYA tersimpan lokal dan belum tersinkron ke cloud.');
}

export async function deleteJadwalTambahan(id: string): Promise<MutationResult> {
  const ok = await apiRequest(`/api/schedule-tambahan?id=${id}`, { method: 'DELETE' });
  const list = getJadwalTambahan().filter((x) => x.id !== id);
  if (ok) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.SCHEDULE_TAMBAHAN, list);
  return saveLocalFallback('Penghapusan jadwal tambahan HANYA tersimpan lokal.');
}

// ─── Tugas ──────────────────────────────────────────────────────────────────
export const getTugas = (): Tugas[] => get<Tugas[]>(KEYS.TASKS, []);

export async function saveTugas(list: Tugas[]): Promise<MutationResult> {
  let allOk = true;
  for (const item of list) {
    const ok = await apiRequest('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!ok) allOk = false;
  }
  if (allOk) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.TASKS, list);
  return saveLocalFallback('Tugas HANYA tersimpan lokal.');
}

export async function addTugas(item: Omit<Tugas, 'id'>): Promise<MutationResult> {
  const newItem: Tugas = { ...item, id: genId() };
  const ok = await apiRequest('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem),
  });
  if (ok) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.TASKS, [...getTugas(), newItem]);
  return saveLocalFallback('Tugas HANYA tersimpan lokal dan belum tersinkron ke cloud.');
}

export async function toggleTugas(id: string): Promise<MutationResult> {
  const current = getTugas().find((t) => t.id === id);
  if (!current) return { success: false };
  const newDone = !current.done;

  const ok = await apiRequest('/api/tasks', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, done: newDone }),
  });
  const list = getTugas().map((t) => (t.id === id ? { ...t, done: newDone } : t));
  if (ok) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.TASKS, list);
  return saveLocalFallback('Perubahan tugas HANYA tersimpan lokal.');
}

export async function deleteTugas(id: string): Promise<MutationResult> {
  const ok = await apiRequest(`/api/tasks?id=${id}`, { method: 'DELETE' });
  const list = getTugas().filter((x) => x.id !== id);
  if (ok) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.TASKS, list);
  return saveLocalFallback('Penghapusan tugas HANYA tersimpan lokal.');
}

// ─── Catatan ─────────────────────────────────────────────────────────────────
export const getCatatan = (): Catatan[] => get<Catatan[]>(KEYS.NOTES, []);

export async function saveCatatan(list: Catatan[]): Promise<MutationResult> {
  let allOk = true;
  for (const item of list) {
    const ok = await apiRequest('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!ok) allOk = false;
  }
  if (allOk) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.NOTES, list);
  return saveLocalFallback('Catatan HANYA tersimpan lokal.');
}

export async function addCatatan(content: string): Promise<MutationResult> {
  const now = new Date();
  const createdAt = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const newItem: Catatan = { id: genId(), content, createdAt };

  const ok = await apiRequest('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem),
  });
  const list = [newItem, ...getCatatan()];
  if (ok) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.NOTES, list);
  return saveLocalFallback('Catatan HANYA tersimpan lokal dan belum tersinkron ke cloud.');
}

export async function deleteCatatan(id: string): Promise<MutationResult> {
  const ok = await apiRequest(`/api/notes?id=${id}`, { method: 'DELETE' });
  const list = getCatatan().filter((x) => x.id !== id);
  if (ok) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.NOTES, list);
  return saveLocalFallback('Penghapusan catatan HANYA tersimpan lokal.');
}

// ─── Content Calendar ────────────────────────────────────────────────────────
export const getKonten = (): KontenCalendar[] =>
  get<KontenCalendar[]>(KEYS.CONTENT_CALENDAR, []);

export async function saveKonten(list: KontenCalendar[]): Promise<MutationResult> {
  let allOk = true;
  for (const item of list) {
    const ok = await apiRequest('/api/content-calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!ok) allOk = false;
  }
  if (allOk) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.CONTENT_CALENDAR, list);
  return saveLocalFallback('Konten HANYA tersimpan lokal.');
}

export async function addKonten(item: Omit<KontenCalendar, 'id'>): Promise<MutationResult> {
  const newItem: KontenCalendar = { ...item, id: genId() };
  const ok = await apiRequest('/api/content-calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem),
  });
  const list = [...getKonten(), newItem].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  if (ok) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.CONTENT_CALENDAR, list);
  return saveLocalFallback('Konten HANYA tersimpan lokal dan belum tersinkron ke cloud.');
}

export async function cycleKontenStatus(id: string): Promise<MutationResult> {
  const cycle = ['Draft', 'Review', 'Terjadwal', 'Publish'] as const;
  const current = getKonten().find((k) => k.id === id);
  if (!current) return { success: false };
  const idx = cycle.indexOf(current.status);
  const nextStatus = cycle[(idx + 1) % cycle.length];

  const ok = await apiRequest('/api/content-calendar', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status: nextStatus }),
  });
  const list = getKonten().map((k) => (k.id === id ? { ...k, status: nextStatus } : k));
  if (ok) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.CONTENT_CALENDAR, list);
  return saveLocalFallback('Perubahan status konten HANYA tersimpan lokal.');
}

export async function deleteKonten(id: string): Promise<MutationResult> {
  const ok = await apiRequest(`/api/content-calendar?id=${id}`, { method: 'DELETE' });
  const list = getKonten().filter((x) => x.id !== id);
  if (ok) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.CONTENT_CALENDAR, list);
  return saveLocalFallback('Penghapusan konten HANYA tersimpan lokal.');
}

// ─── Proyek ──────────────────────────────────────────────────────────────────
export const getProyek = (): Proyek[] => get<Proyek[]>(KEYS.PROJECTS, []);

export async function saveProyek(list: Proyek[]): Promise<MutationResult> {
  let allOk = true;
  for (const item of list) {
    const ok = await apiRequest('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!ok) allOk = false;
  }
  if (allOk) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.PROJECTS, list);
  return saveLocalFallback('Proyek HANYA tersimpan lokal.');
}

export async function addProyek(item: Omit<Proyek, 'id'>): Promise<MutationResult> {
  const newItem: Proyek = { ...item, id: genId() };
  const ok = await apiRequest('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem),
  });
  if (ok) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.PROJECTS, [...getProyek(), newItem]);
  return saveLocalFallback('Proyek HANYA tersimpan lokal dan belum tersinkron ke cloud.');
}

export async function cycleProyekStatus(id: string): Promise<MutationResult> {
  const cycle = ['Rencana', 'Berjalan', 'Selesai'] as const;
  const current = getProyek().find((p) => p.id === id);
  if (!current) return { success: false };
  const idx = cycle.indexOf(current.status);
  const nextStatus = cycle[(idx + 1) % cycle.length];

  const ok = await apiRequest('/api/projects', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status: nextStatus }),
  });
  const list = getProyek().map((p) => (p.id === id ? { ...p, status: nextStatus } : p));
  if (ok) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.PROJECTS, list);
  return saveLocalFallback('Perubahan status proyek HANYA tersimpan lokal.');
}

export async function deleteProyek(id: string): Promise<MutationResult> {
  const ok = await apiRequest(`/api/projects?id=${id}`, { method: 'DELETE' });
  const list = getProyek().filter((x) => x.id !== id);
  if (ok) {
    await refreshCacheAfterConfirmedMutation();
    return { success: true };
  }
  set(KEYS.PROJECTS, list);
  return saveLocalFallback('Penghapusan proyek HANYA tersimpan lokal.');
}

export { EMPTY_DATA };
