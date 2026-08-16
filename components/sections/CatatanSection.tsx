'use client';
import React, { useState } from 'react';
import { Catatan } from '@/lib/types';
import { addCatatan, deleteCatatan } from '@/lib/storage';

interface Props { catatan: Catatan[]; onChange: () => void; }

export default function CatatanSection({ catatan, onChange }: Props) {
  const [text, setText] = useState('');

  const handleSave = () => {
    if (!text.trim()) return;
    addCatatan(text.trim());
    setText('');
    onChange();
  };

  return (
    <div>
      {/* Composer */}
      <div className="form-block" style={{ marginBottom: 8 }}>
        <label className="win-label">Tulis catatan baru:</label>
        <textarea className="win-textarea" rows={4} value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave(); }}
          placeholder="Tulis catatan di sini... (Ctrl+Enter untuk simpan)" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="form-hint">Ctrl+Enter untuk simpan cepat</span>
          <button className="win-btn" onClick={handleSave} disabled={!text.trim()}>
            Simpan Catatan
          </button>
        </div>
      </div>

      {catatan.length === 0
        ? <p className="empty-state">Belum ada catatan.</p>
        : catatan.map(c => (
            <div key={c.id} className="catatan-item">
              <p className="catatan-content" style={{ userSelect: 'text' }}>{c.content}</p>
              <div className="catatan-footer">
                <span className="catatan-time">🕐 {c.createdAt}</span>
                <button className="btn-delete" onClick={() => { deleteCatatan(c.id); onChange(); }}>×</button>
              </div>
            </div>
          ))
      }
    </div>
  );
}
