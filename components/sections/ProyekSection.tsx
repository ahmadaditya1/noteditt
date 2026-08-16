'use client';
import React, { useState } from 'react';
import Panel from '@/components/ui/Panel';
import Badge, { statusProyekColor } from '@/components/ui/Badge';
import { Proyek, StatusProyek } from '@/lib/types';
import { addProyek, cycleProyekStatus, deleteProyek } from '@/lib/storage';

interface Props {
  proyek: Proyek[];
  onChange: () => void;
}

const emptyForm = { nama: '', status: 'Rencana' as StatusProyek, deskripsi: '' };

export default function ProyekSection({ proyek, onChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) return;
    addProyek(form);
    setForm(emptyForm);
    setShowForm(false);
    onChange();
  };

  return (
    <Panel
      icon="🗂️"
      title="Daftar Proyek"
      action={
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          + Proyek Baru
        </button>
      }
    >
      {showForm && (
        <form className="form-block animate-in" onSubmit={handleAdd}>
          <div className="form-row">
            <div className="form-field" style={{ flex: 2 }}>
              <label className="form-label">Nama Proyek</label>
              <input
                className="input"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Nama proyek"
                required
                autoFocus
              />
            </div>
            <div className="form-field">
              <label className="form-label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as StatusProyek })
                }
              >
                {(['Rencana', 'Berjalan', 'Selesai'] as StatusProyek[]).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Deskripsi (opsional)</label>
            <input
              className="input"
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              placeholder="Singkat saja"
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-primary" type="submit">Simpan</button>
            <button className="btn-ghost" type="button" onClick={() => setShowForm(false)}>
              Batal
            </button>
          </div>
        </form>
      )}

      {proyek.length === 0 && !showForm && (
        <p className="empty-state">Belum ada proyek. Klik + Proyek Baru.</p>
      )}

      <div className="proyek-grid">
        {proyek.map((p) => (
          <div key={p.id} className="proyek-card animate-in">
            <div className="proyek-card-header">
              <h3 className="proyek-nama">{p.nama}</h3>
              <button
                className="btn-delete"
                onClick={() => { deleteProyek(p.id); onChange(); }}
                title="Hapus"
              >
                ×
              </button>
            </div>
            {p.deskripsi && (
              <p className="proyek-desc">{p.deskripsi}</p>
            )}
            <div className="proyek-card-footer">
              <Badge
                label={p.status}
                colorVar={statusProyekColor[p.status]}
                clickable
                onClick={() => { cycleProyekStatus(p.id); onChange(); }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
