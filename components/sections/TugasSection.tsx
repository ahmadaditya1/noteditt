'use client';
import React, { useState } from 'react';
import Badge, { kategoriColor } from '@/components/ui/Badge';
import { KategoriTugas, Tugas } from '@/lib/types';
import { addTugas, toggleTugas, deleteTugas } from '@/lib/storage';

const KATEGORI: KategoriTugas[] = ['Kuliah', 'Tikethub', 'Porta Pic', 'Personal'];
const FILTERS = ['Semua', ...KATEGORI] as const;

interface Props { tugas: Tugas[]; onChange: () => void; }

const emptyForm = { title: '', cat: 'Kuliah' as KategoriTugas, deadline: '', done: false };

export default function TugasSection({ tugas, onChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<string>('Semua');

  const filtered = filter === 'Semua' ? tugas : tugas.filter(t => t.cat === filter);
  const sorted = [...filtered].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    return a.deadline ? -1 : b.deadline ? 1 : 0;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    addTugas(form);
    setForm(emptyForm);
    setShowForm(false);
    onChange();
  };

  const isOverdue = (d: string) => d && new Date(d) < new Date(new Date().toDateString());

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 6, alignItems: 'center' }}>
        <button className="win-btn" style={{ minWidth: 70, fontSize: 11 }}
          onClick={() => setShowForm(s => !s)}>
          + Tambah
        </button>
        <div className="filter-tabs" style={{ marginBottom: 0 }}>
          {FILTERS.map(f => (
            <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="form-block">
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="form-row">
              <div className="form-field" style={{ flex: 2 }}>
                <label className="win-label">Judul Tugas:</label>
                <input className="win-input" value={form.title} autoFocus
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Apa yang perlu dikerjakan?" required />
              </div>
              <div className="form-field">
                <label className="win-label">Kategori:</label>
                <select className="win-select" value={form.cat}
                  onChange={e => setForm({ ...form, cat: e.target.value as KategoriTugas })}>
                  {KATEGORI.map(k => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="win-label">Tenggat:</label>
                <input className="win-input" type="date" value={form.deadline}
                  onChange={e => setForm({ ...form, deadline: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="win-btn" type="submit">Simpan</button>
              <button className="win-btn" type="button" onClick={() => setShowForm(false)}>Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="win-panel">
        {sorted.length === 0
          ? <p className="empty-state">Tidak ada tugas{filter !== 'Semua' ? ` "${filter}"` : ''}.</p>
          : <ul className="win-list">
              {sorted.map(t => (
                <li key={t.id} className={`win-list-item ${t.done ? 'done' : ''}`}
                    style={{ userSelect: 'text' }}>
                  <input type="checkbox" className="win-checkbox" checked={t.done}
                    onChange={() => { toggleTugas(t.id); onChange(); }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span className={`tugas-title item-text ${t.done ? '' : ''}`}>{t.title}</span>
                    <div className="tugas-meta">
                      <Badge label={t.cat} colorVar={kategoriColor[t.cat]} />
                      {t.deadline && (
                        <span className={`tugas-deadline ${isOverdue(t.deadline) && !t.done ? 'overdue' : ''}`}>
                          {isOverdue(t.deadline) && !t.done ? '⚠ ' : ''}
                          {new Date(t.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="btn-delete" onClick={() => { deleteTugas(t.id); onChange(); }}>×</button>
                </li>
              ))}
            </ul>
        }
      </div>
    </div>
  );
}
