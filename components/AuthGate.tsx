'use client';
import React, { useState } from 'react';

interface AuthGateProps {
  onAuth: () => void;
}

export default function AuthGate({ onAuth }: AuthGateProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setBooting(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const triggerShake = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      triggerShake('Silakan masukkan kode akses.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onAuth();
      } else {
        triggerShake(data.message || 'Kode akses salah.');
        setCode('');
      }
    } catch {
      triggerShake('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
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
            animation: 'boot-bar 1.0s ease forwards',
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
          Masuk — dashboard pribadi
        </div>

        <form onSubmit={handleLogin}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, color: '#000', lineHeight: 1.5 }}>
            Masukkan kode akses untuk membuka dashboard pribadi Anda.
          </div>

          <div>
            <label className="win-label">Kode Akses:</label>
            <input className="win-input" type="password" value={code}
              disabled={loading}
              onChange={e => setCode(e.target.value)} autoFocus placeholder="••••" />
          </div>

          {error && <div className="boot-error">⚠ {error}</div>}

          <div className="boot-buttons">
            <button className="win-btn" type="submit" disabled={loading}>
              {loading ? 'Memverifikasi...' : 'Masuk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
