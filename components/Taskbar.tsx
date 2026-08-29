'use client';
import React, { useEffect, useState } from 'react';
import { WindowConfig } from './WindowFrame';
import type { SyncStatus } from '@/lib/storage';

interface TaskbarProps {
  windows: WindowConfig[];
  activeId: string | null;
  syncStatus: SyncStatus;
  onWindowClick: (id: string) => void;
  onLogout: () => void;
  onRefresh: () => void;
}

function SyncIndicator({ status }: { status: SyncStatus }) {
  if (status === 'loading') {
    return (
      <span title="Memuat data dari server…" style={{ fontSize: 10, cursor: 'default', whiteSpace: 'nowrap' }}>
        ⏳ Loading…
      </span>
    );
  }
  if (status === 'synced') {
    return (
      <span title="Terhubung ke PostgreSQL — data tersinkron" style={{ fontSize: 10, cursor: 'default', whiteSpace: 'nowrap' }}>
        🟢 Synced
      </span>
    );
  }
  return (
    <span title="Mode offline — data dari localStorage, belum tersinkron ke cloud" style={{ fontSize: 10, cursor: 'default', whiteSpace: 'nowrap', color: '#800' }}>
      🔴 Local only
    </span>
  );
}

export default function Taskbar({ windows, activeId, syncStatus, onWindowClick, onLogout, onRefresh }: TaskbarProps) {
  const [time, setTime] = useState('');
  const [showStart, setShowStart] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const t = setInterval(update, 10000);
    return () => clearInterval(t);
  }, []);

  const openWindows = windows.filter(w => w.isOpen);

  return (
    <div className="taskbar">
      <div style={{ position: 'relative' }}>
        <button className="taskbar-start" onClick={() => setShowStart(s => !s)}>
          <span className="taskbar-start-icon">⊹</span>
          <b>Start</b>
        </button>

        {showStart && (
          <div style={{
            position: 'absolute',
            bottom: 28,
            left: 0,
            width: 180,
            background: 'var(--win-gray)',
            boxShadow: 'var(--bevel-raised-2)',
            zIndex: 9999,
          }} onMouseLeave={() => setShowStart(false)}>
            <div style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: 22,
              background: 'linear-gradient(to top, #000082, #808080)',
              display: 'flex',
              alignItems: 'flex-end',
              paddingBottom: 4,
            }}>
              <span style={{
                color: '#fff',
                fontSize: 9,
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontWeight: 'bold',
                letterSpacing: '0.1em',
                padding: '0 4px',
              }}>dashboard pribadi</span>
            </div>

            <div style={{ marginLeft: 22 }}>
              <StartMenuItem icon="🔒" label="Kunci / Keluar" onClick={() => { setShowStart(false); onLogout(); }} />
              <div style={{ height: 1, background: 'var(--win-dark)', margin: '2px 0', boxShadow: '0 1px 0 var(--win-white)' }} />
              <StartMenuItem icon="🔄" label="Refresh dari Server" onClick={() => { setShowStart(false); onRefresh(); }} />
              <div style={{ height: 1, background: 'var(--win-dark)', margin: '2px 0', boxShadow: '0 1px 0 var(--win-white)' }} />
              <StartMenuItem icon="🖥️" label="Dashboard" onClick={() => setShowStart(false)} />
            </div>
          </div>
        )}
      </div>

      <div className="taskbar-separator" />

      <div className="taskbar-windows">
        {openWindows.map(w => (
          <button
            key={w.id}
            className={`taskbar-win-btn ${activeId === w.id && !w.isMinimized ? 'active' : ''}`}
            onClick={() => onWindowClick(w.id)}
            title={w.title}
          >
            <img src={w.icon} alt="" />
            <span>{w.title}</span>
          </button>
        ))}
      </div>

      <div className="taskbar-tray">
        <SyncIndicator status={syncStatus} />
        <span title="Dashboard Pribadi" style={{ fontSize: 13, cursor: 'default' }}>💻</span>
        <span className="taskbar-clock">{time}</span>
      </div>
    </div>
  );
}

function StartMenuItem({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 8px',
        cursor: 'default',
        fontSize: 11,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#000082', e.currentTarget.style.color = '#fff')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '')}
      onClick={onClick}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      {label}
    </div>
  );
}
