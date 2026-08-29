'use client';
import React, { useState } from 'react';
import {
  JadwalKuliah, JadwalTambahan,
} from '@/lib/types';
import {
  addJadwalKuliah, deleteJadwalKuliah,
  addJadwalTambahan, deleteJadwalTambahan,
  saveJadwalKuliah,
} from '@/lib/storage';

const HARI_ORDER = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'] as const;

interface Props {
  jadwalKuliah: JadwalKuliah[];
  jadwalTambahan: JadwalTambahan[];
  onChange: () => void;
}

const emptyKuliah = { hari: 'Senin' as JadwalKuliah['hari'], jamMulai: '', jamSelesai: '', mataKuliah: '', ruang: '', kelas: '' };
const emptyTambahan = { tanggal: '', jam: '', judul: '', catatan: '' };

export default function JadwalSection({ jadwalKuliah, jadwalTambahan, onChange }: Props) {
  const [showFormK, setShowFormK] = useState(false);
  const [showFormT, setShowFormT] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [formK, setFormK] = useState(emptyKuliah);
  const [formT, setFormT] = useState(emptyTambahan);
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState('');

  const grouped = HARI_ORDER.reduce((acc, h) => {
    const items = jadwalKuliah.filter(j => j.hari === h).sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
    if (items.length) acc[h] = items;
    return acc;
  }, {} as Record<string, JadwalKuliah[]>);

  const handleAddKuliah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formK.mataKuliah || !formK.jamMulai || !formK.jamSelesai) return;
    await addJadwalKuliah(formK);
    setFormK(emptyKuliah);
    setShowFormK(false);
    await onChange();
  };

  const handleAddTambahan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formT.judul || !formT.tanggal) return;
    await addJadwalTambahan(formT);
    setFormT(emptyTambahan);
    setShowFormT(false);
    await onChange();
  };

  const handleImport = async () => {
    const lines = importText.trim().split('\n').filter(Boolean);
    let count = 0;
    const toAdd: JadwalKuliah[] = [];
    lines.forEach(line => {
      let cols: string[] = [];
      if (line.includes('\t')) {
        cols = line.split('\t').map(c => c.trim());
      } else if (line.includes(',')) {
        cols = line.split(',').map(c => c.trim());
      } else if (line.includes(';')) {
        cols = line.split(';').map(c => c.trim());
      } else {
        cols = line.split(/\s{2,}/).map(c => c.trim());
      }
      if (cols.length < 4) return;
      const [hari, jamMulai, jamSelesai, mataKuliah, ruang = '', kelas = ''] = cols;
      const valid = HARI_ORDER.find(h => h.toLowerCase() === hari.toLowerCase());
      if (!valid) return;
      toAdd.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}-${count}`, hari: valid, jamMulai, jamSelesai, mataKuliah, ruang, kelas });
      count++;
    });

    if (toAdd.length === 0) {
      setImportResult('⚠️ Format tidak cocok. Pastikan format: Hari, Jam Mulai, Jam Selesai, Mata Kuliah, Ruang, Kelas');
      return;
    }

    await saveJadwalKuliah([...jadwalKuliah, ...toAdd]);
    setImportResult(`✅ ${count} jadwal berhasil diimpor.`);
    setImportText('');
    await onChange();
  };

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, height: '100%' }}>
      {/* JADWAL KULIAH */}
      <div>
        <div className="win-group-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span>📚 Jadwal Kuliah</span>
          <div style={{ display: 'flex', gap: 3 }}>
            <button className="win-btn win-btn-sm"
              onClick={() => { setShowImport(s => !s); setShowFormK(false); }}>Import</button>
            <button className="win-btn win-btn-sm"
              onClick={() => { setShowFormK(s => !s); setShowImport(false); }}>+</button>
          </div>
        </div>

        {showImport && (
          <div className="form-block" style={{ marginBottom: 6 }}>
            <p className="form-hint">Paste dari Excel/Sheets: <b>Hari, Jam Mulai, Jam Selesai, Mata Kuliah, Ruang, Kelas</b></p>
            <textarea className="win-textarea" rows={4}
              placeholder={'Senin\t08.00\t09.40\tPemrograman Web\tR.201\tA'}
              value={importText} onChange={e => setImportText(e.target.value)} />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button className="win-btn" onClick={handleImport}>Import Data</button>
              {importResult && <span style={{ fontSize: 11, color: 'green' }}>{importResult}</span>}
            </div>
          </div>
        )}

        {showFormK && (
          <div className="form-block" style={{ marginBottom: 6 }}>
            <form onSubmit={handleAddKuliah} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div className="form-row">
                <div className="form-field">
                  <label className="win-label">Hari:</label>
                  <select className="win-select" value={formK.hari}
                    onChange={e => setFormK({ ...formK, hari: e.target.value as JadwalKuliah['hari'] })}>
                    {HARI_ORDER.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="win-label">Mulai:</label>
                  <input className="win-input" type="time" value={formK.jamMulai}
                    onChange={e => setFormK({ ...formK, jamMulai: e.target.value })} />
                </div>
                <div className="form-field">
                  <label className="win-label">Selesai:</label>
                  <input className="win-input" type="time" value={formK.jamSelesai}
                    onChange={e => setFormK({ ...formK, jamSelesai: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field" style={{ flex: 2 }}>
                  <label className="win-label">Mata Kuliah:</label>
                  <input className="win-input" value={formK.mataKuliah} required autoFocus
                    onChange={e => setFormK({ ...formK, mataKuliah: e.target.value })}
                    placeholder="Pemrograman Web" />
                </div>
                <div className="form-field">
                  <label className="win-label">Kelas:</label>
                  <input className="win-input" value={formK.kelas}
                    onChange={e => setFormK({ ...formK, kelas: e.target.value })}
                    placeholder="A (opsional)" />
                </div>
                <div className="form-field">
                  <label className="win-label">Ruang:</label>
                  <input className="win-input" value={formK.ruang}
                    onChange={e => setFormK({ ...formK, ruang: e.target.value })}
                    placeholder="R.201 (opsional)" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="win-btn" type="submit">Simpan</button>
                <button className="win-btn" type="button" onClick={() => setShowFormK(false)}>Batal</button>
              </div>
            </form>
          </div>
        )}

        <div className="win-panel" style={{ overflowY: 'auto', maxHeight: 300 }}>
          {Object.keys(grouped).length === 0
            ? <p className="empty-state">Belum ada jadwal kuliah.</p>
            : HARI_ORDER.filter(h => grouped[h]).map(hari => (
                <div key={hari}>
                  <div className="jadwal-day-label">{hari}</div>
                  {grouped[hari].map(j => (
                    <div key={j.id} className="jadwal-item">
                      <span className="jadwal-time">{j.jamMulai} – {j.jamSelesai}</span>
                      <span className="jadwal-matkul" style={{ flex: 1 }}>{j.mataKuliah}</span>
                      {j.kelas && <span className="jadwal-ruang">Kelas {j.kelas}</span>}
                      {j.ruang && <span className="jadwal-ruang">· {j.ruang}</span>}
                      <button className="btn-delete" onClick={async () => { await deleteJadwalKuliah(j.id); await onChange(); }}>×</button>
                    </div>
                  ))}
                </div>
              ))
          }
        </div>
      </div>

      {/* JADWAL TAMBAHAN */}
      <div>
        <div className="win-group-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span>🗓️ Jadwal Tambahan</span>
          <button className="win-btn win-btn-sm"
            onClick={() => setShowFormT(s => !s)}>+</button>
        </div>

        {showFormT && (
          <div className="form-block" style={{ marginBottom: 6 }}>
            <form onSubmit={handleAddTambahan} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div className="form-row">
                <div className="form-field">
                  <label className="win-label">Tanggal:</label>
                  <input className="win-input" type="date" value={formT.tanggal}
                    onChange={e => setFormT({ ...formT, tanggal: e.target.value })} required />
                </div>
                <div className="form-field">
                  <label className="win-label">Jam:</label>
                  <input className="win-input" type="time" value={formT.jam}
                    onChange={e => setFormT({ ...formT, jam: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="win-label">Judul:</label>
                <input className="win-input" value={formT.judul} required autoFocus
                  onChange={e => setFormT({ ...formT, judul: e.target.value })}
                  placeholder="Nama acara" />
              </div>
              <div>
                <label className="win-label">Catatan (opsional):</label>
                <input className="win-input" value={formT.catatan}
                  onChange={e => setFormT({ ...formT, catatan: e.target.value })}
                  placeholder="Detail tambahan" />
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="win-btn" type="submit">Simpan</button>
                <button className="win-btn" type="button" onClick={() => setShowFormT(false)}>Batal</button>
              </div>
            </form>
          </div>
        )}

        <div className="win-panel" style={{ overflowY: 'auto', maxHeight: 300 }}>
          {jadwalTambahan.length === 0
            ? <p className="empty-state">Belum ada acara tambahan.</p>
            : jadwalTambahan.map(j => (
                <div key={j.id} className="jadwal-item">
                  <span className="jadwal-time">
                    {fmtDate(j.tanggal)}{j.jam && ` · ${j.jam}`}
                  </span>
                  <div style={{ flex: 1 }}>
                    <span className="jadwal-matkul">{j.judul}</span>
                    {j.catatan && <span className="jadwal-ruang"> — {j.catatan}</span>}
                  </div>
                  <button className="btn-delete" onClick={async () => { await deleteJadwalTambahan(j.id); await onChange(); }}>×</button>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}
