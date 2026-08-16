'use client';
import React, { useState } from 'react';
import Panel from '@/components/ui/Panel';
import { Catatan } from '@/lib/types';
import { addCatatan, deleteCatatan } from '@/lib/storage';

interface Props {
  catatan: Catatan[];
  onChange: () => void;
}

export default function CatatanSection({ catatan, onChange }: Props) {
  const [text, setText] = useState('');

  const handleSave = () => {
    if (!text.trim()) return;
    addCatatan(text.trim());
    setText('');
    onChange();
  };

  return (
    <Panel icon="📝" title="Catatan">
      <div className="catatan-composer">
        <textarea
          className="input catatan-textarea"
          rows={4}
          placeholder="Tulis catatan di sini..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
          }}
        />
        <div className="catatan-composer-footer">
          <span className="form-hint">Ctrl+Enter untuk simpan cepat</span>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!text.trim()}
          >
            Simpan Catatan
          </button>
        </div>
      </div>

      {catatan.length === 0 && (
        <p className="empty-state">Belum ada catatan.</p>
      )}

      <div className="catatan-list">
        {catatan.map((c) => (
          <div key={c.id} className="catatan-item animate-in">
            <div className="catatan-content">{c.content}</div>
            <div className="catatan-footer">
              <span className="catatan-time">{c.createdAt}</span>
              <button
                className="btn-delete"
                onClick={() => { deleteCatatan(c.id); onChange(); }}
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
