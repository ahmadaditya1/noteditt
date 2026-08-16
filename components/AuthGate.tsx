'use client';
import React, { useState } from 'react';
import { getAccessCode, setAccessCode } from '@/lib/storage';

interface AuthGateProps {
  onAuth: () => void;
}

export default function AuthGate({ onAuth }: AuthGateProps) {
  const hasCode = !!getAccessCode();
  const [mode] = useState<'setup' | 'login'>(hasCode ? 'login' : 'setup');
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [booting, setBooting] = useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setBooting(false), 1800);
    return () => clearTimeout(t);
  }, []);

  const triggerShake = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 4) { triggerShake('Kode minimal 4 karakter.'); return; }
    if (code !== confirm) { triggerShake('Kode tidak cocok. Coba lagi.'); return; }
    setAccessCode(code);
    onAuth();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === getAccessCode()) { onAuth(); }
    else { triggerShake('Kode akses salah.'); setCode(''); }
  };

  if (booting) {
    return (
      <div className="boot-screen">
        <div className="boot-logo">
          <span>dashboard pribadi</span>
          <div style={{ color: '#808080', fontSize: 11, letterSpacing: '0.05em' }}>
            Personal Dashboard v0.1.0<br />
            Copyright © 2026. All rights reserved.<br /><br />
            <span style={{ color: '#c0c0c0' }}>Loading...</span>
          </div>
        </div>
        <div style={{ width: 200, height: 6, background: '#333', boxShadow: 'inset 1px 1px 0 #000' }}>
          <div style={{
            height: '100%',
            background: '#0066ff',
            animation: 'boot-bar 1.5s ease forwards',
          }} />
          <style>{`
            @keyframes boot-bar {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="boot-screen">
      <div className={`boot-win ${shake ? 'shake' : ''}`} style={{ width: 340 }}>
        <div className="boot-win-title">
          <span className="boot-win-icon">🖥️</span>
          {mode === 'setup' ? 'Setup Kode Akses' : 'Masuk — dashboard pribadi'}
        </div>

        <form onSubmit={mode === 'setup' ? handleSetup : handleLogin}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, color: '#000', lineHeight: 1.5 }}>
            {mode === 'setup'
              ? 'Buat kode akses untuk melindungi dashboard Anda (min. 4 karakter).'
              : 'Masukkan kode akses untuk membuka dashboard.'}
          </div>

          <div>
            <label className="win-label">Kode Akses:</label>
            <input className="win-input" type="password" value={code}
              onChange={e => setCode(e.target.value)} autoFocus placeholder="••••" />
          </div>

          {mode === 'setup' && (
            <div>
              <label className="win-label">Konfirmasi Kode:</label>
              <input className="win-input" type="password" value={confirm}
                onChange={e => setConfirm(e.target.value)} placeholder="••••" />
            </div>
          )}

          {error && <div className="boot-error">⚠ {error}</div>}

          <div className="boot-buttons">
            <button className="win-btn" type="submit">
              {mode === 'setup' ? 'Buat Kode' : 'Masuk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
