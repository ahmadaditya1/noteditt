'use client';
import React, { useState } from 'react';
import Panel from '@/components/ui/Panel';
import {
  JadwalKuliah,
  JadwalTambahan,
} from '@/lib/types';
import {
  addJadwalKuliah,
  deleteJadwalKuliah,
  addJadwalTambahan,
  deleteJadwalTambahan,
  saveJadwalKuliah,
  getJadwalKuliah,
} from '@/lib/storage';

const HARI_ORDER = [
  'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu',
] as const;

interface Props {
  jadwalKuliah: JadwalKuliah[];
  jadwalTambahan: JadwalTambahan[];
  onChange: () => void;
}

const emptyKuliah = {
  hari: 'Senin' as JadwalKuliah['hari'],
  jamMulai: '',
  jamSelesai: '',
  mataKuliah: '',
  ruang: '',
};

const emptyTambahan = { tanggal: '', jam: '', judul: '', catatan: '' };

export default function JadwalSection({
  jadwalKuliah,
  jadwalTambahan,
  onChange,
}: Props) {
  const [showFormK, setShowFormK] = useState(false);
  const [showFormT, setShowFormT] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [formK, setFormK] = useState(emptyKuliah);
  const [formT, setFormT] = useState(emptyTambahan);
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState('');

  const grouped = HARI_ORDER.reduce((acc, h) => {
    const items = jadwalKuliah
      .filter((j) => j.hari === h)
      .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
    if (items.length) acc[h] = items;
    return acc;
  }, {} as Record<string, JadwalKuliah[]>);

  const handleAddKuliah = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formK.mataKuliah || !formK.jamMulai || !formK.jamSelesai) return;
    addJadwalKuliah(formK);
    setFormK(emptyKuliah);
    setShowFormK(false);
    onChange();
  };

  const handleAddTambahan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formT.judul || !formT.tanggal) return;
    addJadwalTambahan(formT);
    setFormT(emptyTambahan);
    setShowFormT(false);
    onChange();
  };

  const handleImport = () => {
    const lines = importText.trim().split('\n').filter(Boolean);
    let count = 0;
    const existing = getJadwalKuliah();
    const toAdd: JadwalKuliah[] = [];

    lines.forEach((line) => {
      const sep = line.includes('\t') ? '\t' : ',';
      const cols = line.split(sep).map((c) => c.trim());
      if (cols.length < 4) return;
      const [hari, jamMulai, jamSelesai, mataKuliah, ruang = ''] = cols;
      const valid = HARI_ORDER.find(
        (h) => h.toLowerCase() === hari.toLowerCase()
      );
      if (!valid) return;
      toAdd.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${count}`,
        hari: valid,
        jamMulai,
        jamSelesai,
        mataKuliah,
        ruang,
      });
      count++;
    });

    saveJadwalKuliah([...existing, ...toAdd]);
    setImportResult(`✅ ${count} jadwal berhasil diimpor.`);
    setImportText('');
    onChange();
  };

  const formatTgl = (tgl: string) => {
    if (!tgl) return '';
    return new Date(tgl).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="sections-grid">
      {/* Jadwal Kuliah */}
      <Panel
        icon="📚"
        title="Jadwal Kuliah"
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn-outline"
              onClick={() => { setShowImport(!showImport); setShowFormK(false); }}
            >
              Import
            </button>
            <button
              className="btn-primary"
              onClick={() => { setShowFormK(!showFormK); setShowImport(false); }}
            >
              + Tambah
            </button>
          </div>
        }
      >
        {showImport && (
          <div className="form-block animate-in">
            <p className="form-hint">
              Paste dari Excel/Sheets. Urutan kolom:{' '}
              <code>Hari, Jam Mulai, Jam Selesai, Mata Kuliah, Ruang</code>
            </p>
            <textarea
              className="input"
              rows={5}
              placeholder={`Senin\t08.00\t09.40\tPemrograman Web\tR.201\nSelasa\t10.00\t11.40\tBasis Data\tR.305`}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button className="btn-primary" onClick={handleImport}>
                Import Data
              </button>
              {importResult && (
                <span className="form-hint" style={{ color: 'var(--color-success)' }}>
                  {importResult}
                </span>
              )}
            </div>
          </div>
        )}

        {showFormK && (
          <form className="form-block animate-in" onSubmit={handleAddKuliah}>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Hari</label>
                <select
                  className="input"
                  value={formK.hari}
                  onChange={(e) =>
                    setFormK({ ...formK, hari: e.target.value as JadwalKuliah['hari'] })
                  }
                >
                  {HARI_ORDER.map((h) => <option key={h}>{h}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Jam Mulai</label>
                <input
                  className="input"
                  type="time"
                  value={formK.jamMulai}
                  onChange={(e) => setFormK({ ...formK, jamMulai: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Jam Selesai</label>
                <input
                  className="input"
                  type="time"
                  value={formK.jamSelesai}
                  onChange={(e) => setFormK({ ...formK, jamSelesai: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field" style={{ flex: 2 }}>
                <label className="form-label">Mata Kuliah</label>
                <input
                  className="input"
                  value={formK.mataKuliah}
                  onChange={(e) => setFormK({ ...formK, mataKuliah: e.target.value })}
                  placeholder="Pemrograman Web"
                  required
                />
              </div>
              <div className="form-field">
                <label className="form-label">Ruang / Dosen</label>
                <input
                  className="input"
                  value={formK.ruang}
                  onChange={(e) => setFormK({ ...formK, ruang: e.target.value })}
                  placeholder="R.201 (opsional)"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-primary" type="submit">Simpan</button>
              <button className="btn-ghost" type="button" onClick={() => setShowFormK(false)}>Batal</button>
            </div>
          </form>
        )}

        {Object.keys(grouped).length === 0 && !showFormK && !showImport && (
          <p className="empty-state">Belum ada jadwal kuliah. Klik + Tambah atau Import.</p>
        )}

        {HARI_ORDER.filter((h) => grouped[h]).map((hari) => (
          <div key={hari} className="jadwal-day-group">
            <h3 className="jadwal-day-label">{hari}</h3>
            {grouped[hari].map((j) => (
              <div key={j.id} className="jadwal-item animate-in">
                <div className="jadwal-time">
                  {j.jamMulai} – {j.jamSelesai}
                </div>
                <div className="jadwal-info">
                  <span className="jadwal-matkul">{j.mataKuliah}</span>
                  {j.ruang && <span className="jadwal-ruang">· {j.ruang}</span>}
                </div>
                <button
                  className="btn-delete"
                  onClick={() => { deleteJadwalKuliah(j.id); onChange(); }}
                  title="Hapus"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ))}
      </Panel>

      {/* Jadwal Tambahan */}
      <Panel
        icon="🗓️"
        title="Jadwal Tambahan"
        action={
          <button
            className="btn-primary"
            onClick={() => setShowFormT(!showFormT)}
          >
            + Tambah
          </button>
        }
      >
        {showFormT && (
          <form className="form-block animate-in" onSubmit={handleAddTambahan}>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Tanggal</label>
                <input
                  className="input"
                  type="date"
                  value={formT.tanggal}
                  onChange={(e) => setFormT({ ...formT, tanggal: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label className="form-label">Jam (opsional)</label>
                <input
                  className="input"
                  type="time"
                  value={formT.jam}
                  onChange={(e) => setFormT({ ...formT, jam: e.target.value })}
                />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Judul</label>
              <input
                className="input"
                value={formT.judul}
                onChange={(e) => setFormT({ ...formT, judul: e.target.value })}
                placeholder="Nama acara"
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Catatan (opsional)</label>
              <input
                className="input"
                value={formT.catatan}
                onChange={(e) => setFormT({ ...formT, catatan: e.target.value })}
                placeholder="Detail tambahan"
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-primary" type="submit">Simpan</button>
              <button className="btn-ghost" type="button" onClick={() => setShowFormT(false)}>Batal</button>
            </div>
          </form>
        )}

        {jadwalTambahan.length === 0 && !showFormT && (
          <p className="empty-state">Belum ada acara tambahan.</p>
        )}

        {jadwalTambahan.map((j) => (
          <div key={j.id} className="jadwal-item animate-in">
            <div className="jadwal-time">
              {formatTgl(j.tanggal)}
              {j.jam && <span className="jadwal-ruang"> · {j.jam}</span>}
            </div>
            <div className="jadwal-info">
              <span className="jadwal-matkul">{j.judul}</span>
              {j.catatan && <span className="jadwal-ruang">— {j.catatan}</span>}
            </div>
            <button
              className="btn-delete"
              onClick={() => { deleteJadwalTambahan(j.id); onChange(); }}
              title="Hapus"
            >
              ×
            </button>
          </div>
        ))}
      </Panel>
    </div>
  );
}
