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

// ─── Unified Data Sync with Server (PostgreSQL) ──────────────────────────────
export interface AllDashboardData {
  jadwalKuliah: JadwalKuliah[];
  jadwalTambahan: JadwalTambahan[];
  tugas: Tugas[];
  catatan: Catatan[];
  konten: KontenCalendar[];
  proyek: Proyek[];
}

export async function fetchAllDataFromServer(): Promise<AllDashboardData | null> {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) return null;
    const data: AllDashboardData = await res.json();

    // Cache to localStorage
    if (data.jadwalKuliah) set(KEYS.SCHEDULE_KULIAH, data.jadwalKuliah);
    if (data.jadwalTambahan) set(KEYS.SCHEDULE_TAMBAHAN, data.jadwalTambahan);
    if (data.tugas) set(KEYS.TASKS, data.tugas);
    if (data.catatan) set(KEYS.NOTES, data.catatan);
    if (data.konten) set(KEYS.CONTENT_CALENDAR, data.konten);
    if (data.proyek) set(KEYS.PROJECTS, data.proyek);

    return data;
  } catch (error) {
    console.error('Failed to fetch data from server:', error);
    return null;
  }
}

// ─── Jadwal Kuliah ──────────────────────────────────────────────────────────
export const getJadwalKuliah = (): JadwalKuliah[] =>
  get<JadwalKuliah[]>(KEYS.SCHEDULE_KULIAH, []);

export const saveJadwalKuliah = (list: JadwalKuliah[]): void => {
  set(KEYS.SCHEDULE_KULIAH, list);
  fetch('/api/schedule-kuliah', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: list }),
  }).catch(err => console.error('API Error:', err));
};

export const addJadwalKuliah = (item: Omit<JadwalKuliah, 'id'>): void => {
  const list = getJadwalKuliah();
  const newItem: JadwalKuliah = { ...item, id: genId() };
  list.push(newItem);
  set(KEYS.SCHEDULE_KULIAH, list);

  fetch('/api/schedule-kuliah', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem),
  }).catch(err => console.error('API Error:', err));
};

export const deleteJadwalKuliah = (id: string): void => {
  set(KEYS.SCHEDULE_KULIAH, getJadwalKuliah().filter((x) => x.id !== id));
  fetch(`/api/schedule-kuliah?id=${id}`, { method: 'DELETE' }).catch(err => console.error('API Error:', err));
};

// ─── Jadwal Tambahan ─────────────────────────────────────────────────────────
export const getJadwalTambahan = (): JadwalTambahan[] =>
  get<JadwalTambahan[]>(KEYS.SCHEDULE_TAMBAHAN, []);

export const saveJadwalTambahan = (list: JadwalTambahan[]): void => {
  set(KEYS.SCHEDULE_TAMBAHAN, list);
};

export const addJadwalTambahan = (item: Omit<JadwalTambahan, 'id'>): void => {
  const list = getJadwalTambahan();
  const newItem: JadwalTambahan = { ...item, id: genId() };
  list.push(newItem);
  list.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  set(KEYS.SCHEDULE_TAMBAHAN, list);

  fetch('/api/schedule-tambahan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem),
  }).catch(err => console.error('API Error:', err));
};

export const deleteJadwalTambahan = (id: string): void => {
  set(KEYS.SCHEDULE_TAMBAHAN, getJadwalTambahan().filter((x) => x.id !== id));
  fetch(`/api/schedule-tambahan?id=${id}`, { method: 'DELETE' }).catch(err => console.error('API Error:', err));
};

// ─── Tugas ──────────────────────────────────────────────────────────────────
export const getTugas = (): Tugas[] => get<Tugas[]>(KEYS.TASKS, []);

export const saveTugas = (list: Tugas[]): void => set(KEYS.TASKS, list);

export const addTugas = (item: Omit<Tugas, 'id'>): void => {
  const list = getTugas();
  const newItem: Tugas = { ...item, id: genId() };
  list.push(newItem);
  set(KEYS.TASKS, list);

  fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem),
  }).catch(err => console.error('API Error:', err));
};

export const toggleTugas = (id: string): void => {
  let newDone = false;
  const list = getTugas().map((t) => {
    if (t.id === id) {
      newDone = !t.done;
      return { ...t, done: newDone };
    }
    return t;
  });
  set(KEYS.TASKS, list);

  fetch('/api/tasks', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, done: newDone }),
  }).catch(err => console.error('API Error:', err));
};

export const deleteTugas = (id: string): void => {
  set(KEYS.TASKS, getTugas().filter((x) => x.id !== id));
  fetch(`/api/tasks?id=${id}`, { method: 'DELETE' }).catch(err => console.error('API Error:', err));
};

// ─── Catatan ─────────────────────────────────────────────────────────────────
export const getCatatan = (): Catatan[] => get<Catatan[]>(KEYS.NOTES, []);

export const saveCatatan = (list: Catatan[]): void => set(KEYS.NOTES, list);

export const addCatatan = (content: string): void => {
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

  fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem),
  }).catch(err => console.error('API Error:', err));
};

export const deleteCatatan = (id: string): void => {
  set(KEYS.NOTES, getCatatan().filter((x) => x.id !== id));
  fetch(`/api/notes?id=${id}`, { method: 'DELETE' }).catch(err => console.error('API Error:', err));
};

// ─── Content Calendar ────────────────────────────────────────────────────────
export const getKonten = (): KontenCalendar[] =>
  get<KontenCalendar[]>(KEYS.CONTENT_CALENDAR, []);

export const saveKonten = (list: KontenCalendar[]): void =>
  set(KEYS.CONTENT_CALENDAR, list);

export const addKonten = (item: Omit<KontenCalendar, 'id'>): void => {
  const list = getKonten();
  const newItem: KontenCalendar = { ...item, id: genId() };
  list.push(newItem);
  list.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  set(KEYS.CONTENT_CALENDAR, list);

  fetch('/api/content-calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem),
  }).catch(err => console.error('API Error:', err));
};

export const cycleKontenStatus = (id: string): void => {
  const cycle = ['Draft', 'Review', 'Terjadwal', 'Publish'] as const;
  let nextStatus: typeof cycle[number] = 'Draft';
  const list = getKonten().map((k) => {
    if (k.id !== id) return k;
    const idx = cycle.indexOf(k.status);
    nextStatus = cycle[(idx + 1) % cycle.length];
    return { ...k, status: nextStatus };
  });
  set(KEYS.CONTENT_CALENDAR, list);

  fetch('/api/content-calendar', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status: nextStatus }),
  }).catch(err => console.error('API Error:', err));
};

export const deleteKonten = (id: string): void => {
  set(KEYS.CONTENT_CALENDAR, getKonten().filter((x) => x.id !== id));
  fetch(`/api/content-calendar?id=${id}`, { method: 'DELETE' }).catch(err => console.error('API Error:', err));
};

// ─── Proyek ──────────────────────────────────────────────────────────────────
export const getProyek = (): Proyek[] => get<Proyek[]>(KEYS.PROJECTS, []);

export const saveProyek = (list: Proyek[]): void => set(KEYS.PROJECTS, list);

export const addProyek = (item: Omit<Proyek, 'id'>): void => {
  const list = getProyek();
  const newItem: Proyek = { ...item, id: genId() };
  list.push(newItem);
  set(KEYS.PROJECTS, list);

  fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem),
  }).catch(err => console.error('API Error:', err));
};

export const cycleProyekStatus = (id: string): void => {
  const cycle = ['Rencana', 'Berjalan', 'Selesai'] as const;
  let nextStatus: typeof cycle[number] = 'Rencana';
  const list = getProyek().map((p) => {
    if (p.id !== id) return p;
    const idx = cycle.indexOf(p.status);
    nextStatus = cycle[(idx + 1) % cycle.length];
    return { ...p, status: nextStatus };
  });
  set(KEYS.PROJECTS, list);

  fetch('/api/projects', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status: nextStatus }),
  }).catch(err => console.error('API Error:', err));
};

export const deleteProyek = (id: string): void => {
  set(KEYS.PROJECTS, getProyek().filter((x) => x.id !== id));
  fetch(`/api/projects?id=${id}`, { method: 'DELETE' }).catch(err => console.error('API Error:', err));
};
