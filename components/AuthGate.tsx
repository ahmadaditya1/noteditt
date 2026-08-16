'use client';
import React, { useState } from 'react';
import { setAccessCode, getAccessCode } from '@/lib/storage';

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

  const triggerShake = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 4) {
      triggerShake('Kode minimal 4 karakter.');
      return;
    }
    if (code !== confirm) {
      triggerShake('Kode tidak cocok. Coba lagi.');
      return;
    }
    setAccessCode(code);
    onAuth();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = getAccessCode();
    if (code === saved) {
      onAuth();
    } else {
      triggerShake('Kode akses salah.');
      setCode('');
    }
  };

  return (
    <div className="auth-bg">
      <div className={`auth-card ${shake ? 'shake' : ''}`}>
        <div className="auth-logo">
          <span className="auth-logo-icon">⊹</span>
          <h1 className="auth-title">Dashboard Pribadi</h1>
        </div>
        <p className="auth-sub">
          {mode === 'setup'
            ? 'Buat kode akses untuk pertama kali'
            : 'Masukkan kode akses untuk melanjutkan'}
        </p>

        <form
          onSubmit={mode === 'setup' ? handleSetup : handleLogin}
          className="auth-form"
        >
          <div className="auth-field">
            <label className="auth-label">Kode Akses</label>
            <input
              className="auth-input"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Minimal 4 karakter"
              autoFocus
            />
          </div>

          {mode === 'setup' && (
            <div className="auth-field">
              <label className="auth-label">Konfirmasi Kode</label>
              <input
                className="auth-input"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Ulangi kode"
              />
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-btn" type="submit">
            {mode === 'setup' ? 'Buat & Masuk →' : 'Masuk →'}
          </button>
        </form>
      </div>
    </div>
  );
}
