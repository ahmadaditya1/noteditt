import {
  JadwalKuliah,
  JadwalTambahan,
  Tugas,
  Catatan,
  KontenCalendar,
  Proyek,
} from './types';

const KEYS = {
  ACCESS_CODE: 'access-code',
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
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Access Code ────────────────────────────────────────────────────────────
export const getAccessCode = (): string | null =>
  get<string | null>(KEYS.ACCESS_CODE, null);

export const setAccessCode = (code: string): void =>
  set(KEYS.ACCESS_CODE, code);

// ─── Jadwal Kuliah ──────────────────────────────────────────────────────────
export const getJadwalKuliah = (): JadwalKuliah[] =>
  get<JadwalKuliah[]>(KEYS.SCHEDULE_KULIAH, []);

export const saveJadwalKuliah = (list: JadwalKuliah[]): void =>
  set(KEYS.SCHEDULE_KULIAH, list);

export const addJadwalKuliah = (item: Omit<JadwalKuliah, 'id'>): void => {
  const list = getJadwalKuliah();
  list.push({ ...item, id: genId() });
  saveJadwalKuliah(list);
};

export const deleteJadwalKuliah = (id: string): void => {
  saveJadwalKuliah(getJadwalKuliah().filter((x) => x.id !== id));
};

// ─── Jadwal Tambahan ─────────────────────────────────────────────────────────
export const getJadwalTambahan = (): JadwalTambahan[] =>
  get<JadwalTambahan[]>(KEYS.SCHEDULE_TAMBAHAN, []);

export const saveJadwalTambahan = (list: JadwalTambahan[]): void =>
  set(KEYS.SCHEDULE_TAMBAHAN, list);

export const addJadwalTambahan = (item: Omit<JadwalTambahan, 'id'>): void => {
  const list = getJadwalTambahan();
  list.push({ ...item, id: genId() });
  list.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  saveJadwalTambahan(list);
};

export const deleteJadwalTambahan = (id: string): void => {
  saveJadwalTambahan(getJadwalTambahan().filter((x) => x.id !== id));
};

// ─── Tugas ──────────────────────────────────────────────────────────────────
export const getTugas = (): Tugas[] => get<Tugas[]>(KEYS.TASKS, []);

export const saveTugas = (list: Tugas[]): void => set(KEYS.TASKS, list);

export const addTugas = (item: Omit<Tugas, 'id'>): void => {
  const list = getTugas();
  list.push({ ...item, id: genId() });
  saveTugas(list);
};

export const toggleTugas = (id: string): void => {
  saveTugas(getTugas().map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
};

export const deleteTugas = (id: string): void => {
  saveTugas(getTugas().filter((x) => x.id !== id));
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
  list.unshift({ id: genId(), content, createdAt });
  saveCatatan(list);
};

export const deleteCatatan = (id: string): void => {
  saveCatatan(getCatatan().filter((x) => x.id !== id));
};

// ─── Content Calendar ────────────────────────────────────────────────────────
export const getKonten = (): KontenCalendar[] =>
  get<KontenCalendar[]>(KEYS.CONTENT_CALENDAR, []);

export const saveKonten = (list: KontenCalendar[]): void =>
  set(KEYS.CONTENT_CALENDAR, list);

export const addKonten = (item: Omit<KontenCalendar, 'id'>): void => {
  const list = getKonten();
  list.push({ ...item, id: genId() });
  list.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  saveKonten(list);
};

export const cycleKontenStatus = (id: string): void => {
  const cycle = ['Draft', 'Review', 'Terjadwal', 'Publish'] as const;
  saveKonten(
    getKonten().map((k) => {
      if (k.id !== id) return k;
      const idx = cycle.indexOf(k.status);
      return { ...k, status: cycle[(idx + 1) % cycle.length] };
    })
  );
};

export const deleteKonten = (id: string): void => {
  saveKonten(getKonten().filter((x) => x.id !== id));
};

// ─── Proyek ──────────────────────────────────────────────────────────────────
export const getProyek = (): Proyek[] => get<Proyek[]>(KEYS.PROJECTS, []);

export const saveProyek = (list: Proyek[]): void => set(KEYS.PROJECTS, list);

export const addProyek = (item: Omit<Proyek, 'id'>): void => {
  const list = getProyek();
  list.push({ ...item, id: genId() });
  saveProyek(list);
};

export const cycleProyekStatus = (id: string): void => {
  const cycle = ['Rencana', 'Berjalan', 'Selesai'] as const;
  saveProyek(
    getProyek().map((p) => {
      if (p.id !== id) return p;
      const idx = cycle.indexOf(p.status);
      return { ...p, status: cycle[(idx + 1) % cycle.length] };
    })
  );
};

export const deleteProyek = (id: string): void => {
  saveProyek(getProyek().filter((x) => x.id !== id));
};
