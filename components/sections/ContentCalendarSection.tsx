'use client';
import React, { useState } from 'react';
import Badge, { statusKontenColor } from '@/components/ui/Badge';
import { KontenCalendar, PlatformKonten, StatusKonten } from '@/lib/types';
import { addKonten, cycleKontenStatus, deleteKonten } from '@/lib/storage';

const PLATFORMS: PlatformKonten[] = ['Instagram', 'TikTok', 'Website', 'Lainnya'];
const platformIcon: Record<PlatformKonten, string> = { Instagram: '📸', TikTok: '🎵', Website: '🌐', Lainnya: '📣' };

interface Props { konten: KontenCalendar[]; onChange: () => void; }

const emptyForm = { tanggal: '', platform: 'Instagram' as PlatformKonten, status: 'Draft' as StatusKonten, caption: '' };

export default function ContentCalendarSection({ konten, onChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tanggal || !form.caption.trim()) return;
    await addKonten(form);
    setForm(emptyForm);
    setShowForm(false);
    await onChange();
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div>
      <div style={{ marginBottom: 6 }}>
        <button className="win-btn" onClick={() => setShowForm(s => !s)}>+ Tambah Konten</button>
      </div>

      {showForm && (
        <div className="form-block">
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="form-row">
              <div className="form-field">
                <label className="win-label">Tanggal:</label>
                <input className="win-input" type="date" value={form.tanggal}
                  onChange={e => setForm({ ...form, tanggal: e.target.value })} required />
              </div>
              <div className="form-field">
                <label className="win-label">Platform:</label>
                <select className="win-select" value={form.platform}
                  onChange={e => setForm({ ...form, platform: e.target.value as PlatformKonten })}>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="win-label">Status:</label>
                <select className="win-select" value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as StatusKonten })}>
                  {(['Draft','Review','Terjadwal','Publish'] as StatusKonten[]).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="win-label">Ide / Caption:</label>
              <input className="win-input" value={form.caption}
                onChange={e => setForm({ ...form, caption: e.target.value })}
                placeholder="Deskripsi konten atau ide caption..." required />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="win-btn" type="submit">Simpan</button>
              <button className="win-btn" type="button" onClick={() => setShowForm(false)}>Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="win-panel">
        {konten.length === 0
          ? <p className="empty-state">Belum ada konten terjadwal.</p>
          : <div>
              {/* Header */}
              <div className="win-group-header" style={{ display: 'grid', gridTemplateColumns: '90px 80px 1fr auto', gap: 6 }}>
                <span>Tanggal</span><span>Platform</span><span>Caption</span><span>Status</span>
              </div>
              {konten.map(k => (
                <div key={k.id} className="konten-item">
                  <span className="konten-date">{fmtDate(k.tanggal)}</span>
                  <span className="konten-platform">{platformIcon[k.platform]} {k.platform}</span>
                  <span className="konten-caption">{k.caption}</span>
                  <div className="konten-actions">
                    <Badge label={k.status} colorVar={statusKontenColor[k.status]}
                      clickable onClick={async () => { await cycleKontenStatus(k.id); await onChange(); }} />
                    <button className="btn-delete" onClick={async () => { await deleteKonten(k.id); await onChange(); }}>×</button>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}
