'use client';
import React, { useState } from 'react';
import Panel from '@/components/ui/Panel';
import Badge, { statusKontenColor } from '@/components/ui/Badge';
import { KontenCalendar, PlatformKonten, StatusKonten } from '@/lib/types';
import { addKonten, cycleKontenStatus, deleteKonten } from '@/lib/storage';

const PLATFORMS: PlatformKonten[] = ['Instagram', 'TikTok', 'Website', 'Lainnya'];

interface Props {
  konten: KontenCalendar[];
  onChange: () => void;
}

const emptyForm = {
  tanggal: '',
  platform: 'Instagram' as PlatformKonten,
  status: 'Draft' as StatusKonten,
  caption: '',
};

const platformIcon: Record<PlatformKonten, string> = {
  Instagram: '📸',
  TikTok: '🎵',
  Website: '🌐',
  Lainnya: '📣',
};

export default function ContentCalendarSection({ konten, onChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tanggal || !form.caption.trim()) return;
    addKonten(form);
    setForm(emptyForm);
    setShowForm(false);
    onChange();
  };

  const formatTgl = (tgl: string) =>
    new Date(tgl).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <Panel
      icon="📆"
      title="Content Calendar"
      action={
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          + Tambah
        </button>
      }
    >
      {showForm && (
        <form className="form-block animate-in" onSubmit={handleAdd}>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Tanggal</label>
              <input
                className="input"
                type="date"
                value={form.tanggal}
                onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Platform</label>
              <select
                className="input"
                value={form.platform}
                onChange={(e) =>
                  setForm({ ...form, platform: e.target.value as PlatformKonten })
                }
              >
                {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Status Awal</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as StatusKonten })
                }
              >
                {(['Draft', 'Review', 'Terjadwal', 'Publish'] as StatusKonten[]).map(
                  (s) => <option key={s}>{s}</option>
                )}
              </select>
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Ide / Caption</label>
            <input
              className="input"
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              placeholder="Deskripsi konten atau ide caption..."
              required
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

      {konten.length === 0 && !showForm && (
        <p className="empty-state">Belum ada konten terjadwal. Klik + Tambah.</p>
      )}

      <div className="konten-list">
        {konten.map((k) => (
          <div key={k.id} className="konten-item animate-in">
            <div className="konten-date">{formatTgl(k.tanggal)}</div>
            <div className="konten-platform">
              {platformIcon[k.platform]} {k.platform}
            </div>
            <div className="konten-caption">{k.caption}</div>
            <div className="konten-actions">
              <Badge
                label={k.status}
                colorVar={statusKontenColor[k.status]}
                clickable
                onClick={() => { cycleKontenStatus(k.id); onChange(); }}
              />
              <button
                className="btn-delete"
                onClick={() => { deleteKonten(k.id); onChange(); }}
                title="Hapus"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
