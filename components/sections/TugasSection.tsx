'use client';
import React, { useState } from 'react';
import Panel from '@/components/ui/Panel';
import Badge, { kategoriColor } from '@/components/ui/Badge';
import { KategoriTugas, Tugas } from '@/lib/types';
import { addTugas, toggleTugas, deleteTugas } from '@/lib/storage';

const KATEGORI: KategoriTugas[] = ['Kuliah', 'Tikethub', 'Porta Pic', 'Personal'];
const FILTERS = ['Semua', ...KATEGORI] as const;

interface Props {
  tugas: Tugas[];
  onChange: () => void;
}

const emptyForm = { title: '', cat: 'Kuliah' as KategoriTugas, deadline: '', done: false };

export default function TugasSection({ tugas, onChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<string>('Semua');

  const filtered = filter === 'Semua' ? tugas : tugas.filter((t) => t.cat === filter);
  const sorted = [...filtered].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    addTugas(form);
    setForm(emptyForm);
    setShowForm(false);
    onChange();
  };

  const formatDeadline = (d: string) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  };

  const isOverdue = (d: string) => {
    if (!d) return false;
    return new Date(d) < new Date(new Date().toDateString());
  };

  return (
    <Panel
      icon="✅"
      title="Tugas"
      action={
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          + Tambah
        </button>
      }
    >
      {/* Filter tabs */}
      <div className="filter-tabs">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {showForm && (
        <form className="form-block animate-in" onSubmit={handleAdd}>
          <div className="form-row">
            <div className="form-field" style={{ flex: 2 }}>
              <label className="form-label">Judul Tugas</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Apa yang perlu dikerjakan?"
                required
                autoFocus
              />
            </div>
            <div className="form-field">
              <label className="form-label">Kategori</label>
              <select
                className="input"
                value={form.cat}
                onChange={(e) => setForm({ ...form, cat: e.target.value as KategoriTugas })}
              >
                {KATEGORI.map((k) => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Tenggat (opsional)</label>
              <input
                className="input"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-primary" type="submit">Simpan</button>
            <button className="btn-ghost" type="button" onClick={() => setShowForm(false)}>Batal</button>
          </div>
        </form>
      )}

      {sorted.length === 0 && !showForm && (
        <p className="empty-state">
          {filter === 'Semua' ? 'Belum ada tugas.' : `Tidak ada tugas "${filter}".`}
        </p>
      )}

      <ul className="tugas-list">
        {sorted.map((t) => (
          <li key={t.id} className={`tugas-item animate-in ${t.done ? 'done' : ''}`}>
            <input
              type="checkbox"
              className="tugas-check"
              checked={t.done}
              onChange={() => { toggleTugas(t.id); onChange(); }}
            />
            <div className="tugas-body">
              <span className={`tugas-title ${t.done ? 'strikethrough' : ''}`}>
                {t.title}
              </span>
              <div className="tugas-meta">
                <Badge label={t.cat} colorVar={kategoriColor[t.cat]} />
                {t.deadline && (
                  <span
                    className="tugas-deadline"
                    style={{
                      color: isOverdue(t.deadline) && !t.done
                        ? 'var(--color-danger)'
                        : 'var(--color-muted)',
                    }}
                  >
                    {isOverdue(t.deadline) && !t.done ? '⚠ ' : ''}
                    {formatDeadline(t.deadline)}
                  </span>
                )}
              </div>
            </div>
            <button
              className="btn-delete"
              onClick={() => { deleteTugas(t.id); onChange(); }}
              title="Hapus"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
