'use client';
import React, { useState } from 'react';
import Badge, { statusProyekColor } from '@/components/ui/Badge';
import { Proyek, StatusProyek } from '@/lib/types';
import { addProyek, cycleProyekStatus, deleteProyek } from '@/lib/storage';

interface Props { proyek: Proyek[]; onChange: () => void; }

const emptyForm = { nama: '', status: 'Rencana' as StatusProyek, deskripsi: '' };

export default function ProyekSection({ proyek, onChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) return;
    await addProyek(form);
    setForm(emptyForm);
    setShowForm(false);
    await onChange();
  };

  return (
    <div>
      <div style={{ marginBottom: 6 }}>
        <button className="win-btn" onClick={() => setShowForm(s => !s)}>+ Proyek Baru</button>
      </div>

      {showForm && (
        <div className="form-block">
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="form-row">
              <div className="form-field" style={{ flex: 2 }}>
                <label className="win-label">Nama Proyek:</label>
                <input className="win-input" value={form.nama} autoFocus
                  onChange={e => setForm({ ...form, nama: e.target.value })}
                  placeholder="Nama proyek" required />
              </div>
              <div className="form-field">
                <label className="win-label">Status:</label>
                <select className="win-select" value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as StatusProyek })}>
                  {(['Rencana','Berjalan','Selesai'] as StatusProyek[]).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="win-label">Deskripsi (opsional):</label>
              <input className="win-input" value={form.deskripsi}
                onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                placeholder="Singkat saja" />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="win-btn" type="submit">Simpan</button>
              <button className="win-btn" type="button" onClick={() => setShowForm(false)}>Batal</button>
            </div>
          </form>
        </div>
      )}

      {proyek.length === 0
        ? <p className="empty-state">Belum ada proyek.</p>
        : <div className="proyek-grid">
            {proyek.map(p => (
              <div key={p.id} className="proyek-card">
                <div className="proyek-card-header">
                  <span className="proyek-nama">📁 {p.nama}</span>
                  <button className="btn-delete" onClick={async () => { await deleteProyek(p.id); await onChange(); }}>×</button>
                </div>
                {p.deskripsi && <p className="proyek-desc">{p.deskripsi}</p>}
                <div className="proyek-card-footer">
                  <Badge label={p.status} colorVar={statusProyekColor[p.status]}
                    clickable onClick={async () => { await cycleProyekStatus(p.id); await onChange(); }} />
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}
