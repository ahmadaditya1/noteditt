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
    if (!res.ok) return null;
    const data = await res.json();

    // If server database is not configured or offline, never wipe out local storage
    if (!data || data.connected === false) {
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
      const r = await fetch('/api/schedule-kuliah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: local.jadwalKuliah }),
      });
      if (r.ok) results.push(`✅ ${local.jadwalKuliah.length} jadwal kuliah`);
      else { results.push('❌ jadwal kuliah gagal'); hasError = true; }
    }

    // Jadwal Tambahan
    for (const item of local.jadwalTambahan) {
      await fetch('/api/schedule-tambahan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
    }
    if (local.jadwalTambahan.length > 0) results.push(`✅ ${local.jadwalTambahan.length} jadwal tambahan`);

    // Tugas
    for (const item of local.tugas) {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
    }
    if (local.tugas.length > 0) results.push(`✅ ${local.tugas.length} tugas`);

    // Catatan
    for (const item of local.catatan) {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
    }
    if (local.catatan.length > 0) results.push(`✅ ${local.catatan.length} catatan`);

    // Konten Calendar
    for (const item of local.konten) {
      await fetch('/api/content-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
    }
    if (local.konten.length > 0) results.push(`✅ ${local.konten.length} konten`);

    // Proyek
    for (const item of local.proyek) {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
    }
    if (local.proyek.length > 0) results.push(`✅ ${local.proyek.length} proyek`);

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
  try {
    await fetch('/api/schedule-kuliah', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: list }),
    });
  } catch (err) {
    console.error('API Error:', err);
  }
};

export const addJadwalKuliah = async (item: Omit<JadwalKuliah, 'id'>): Promise<void> => {
  const list = getJadwalKuliah();
  const newItem: JadwalKuliah = { ...item, id: genId() };
  list.push(newItem);
  set(KEYS.SCHEDULE_KULIAH, list);

  try {
    await fetch('/api/schedule-kuliah', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
  } catch (err) {
    console.error('API Error:', err);
  }
};

export const deleteJadwalKuliah = async (id: string): Promise<void> => {
  set(KEYS.SCHEDULE_KULIAH, getJadwalKuliah().filter((x) => x.id !== id));
  try {
    await fetch(`/api/schedule-kuliah?id=${id}`, { method: 'DELETE' });
  } catch (err) {
    console.error('API Error:', err);
  }
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

  try {
    await fetch('/api/schedule-tambahan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
  } catch (err) {
    console.error('API Error:', err);
  }
};

export const deleteJadwalTambahan = async (id: string): Promise<void> => {
  set(KEYS.SCHEDULE_TAMBAHAN, getJadwalTambahan().filter((x) => x.id !== id));
  try {
    await fetch(`/api/schedule-tambahan?id=${id}`, { method: 'DELETE' });
  } catch (err) {
    console.error('API Error:', err);
  }
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

  try {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
  } catch (err) {
    console.error('API Error:', err);
  }
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

  try {
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, done: newDone }),
    });
  } catch (err) {
    console.error('API Error:', err);
  }
};

export const deleteTugas = async (id: string): Promise<void> => {
  set(KEYS.TASKS, getTugas().filter((x) => x.id !== id));
  try {
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
  } catch (err) {
    console.error('API Error:', err);
  }
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

  try {
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
  } catch (err) {
    console.error('API Error:', err);
  }
};

export const deleteCatatan = async (id: string): Promise<void> => {
  set(KEYS.NOTES, getCatatan().filter((x) => x.id !== id));
  try {
    await fetch(`/api/notes?id=${id}`, { method: 'DELETE' });
  } catch (err) {
    console.error('API Error:', err);
  }
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

  try {
    await fetch('/api/content-calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
  } catch (err) {
    console.error('API Error:', err);
  }
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

  try {
    await fetch('/api/content-calendar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: nextStatus }),
    });
  } catch (err) {
    console.error('API Error:', err);
  }
};

export const deleteKonten = async (id: string): Promise<void> => {
  set(KEYS.CONTENT_CALENDAR, getKonten().filter((x) => x.id !== id));
  try {
    await fetch(`/api/content-calendar?id=${id}`, { method: 'DELETE' });
  } catch (err) {
    console.error('API Error:', err);
  }
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

  try {
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
  } catch (err) {
    console.error('API Error:', err);
  }
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

  try {
    await fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: nextStatus }),
    });
  } catch (err) {
    console.error('API Error:', err);
  }
};

export const deleteProyek = async (id: string): Promise<void> => {
  set(KEYS.PROJECTS, getProyek().filter((x) => x.id !== id));
  try {
    await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
  } catch (err) {
    console.error('API Error:', err);
  }
};
