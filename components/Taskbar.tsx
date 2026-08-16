'use client';
import React, { useEffect, useState } from 'react';
import { WindowConfig } from './WindowFrame';

interface TaskbarProps {
  windows: WindowConfig[];
  activeId: string | null;
  onWindowClick: (id: string) => void;
  onLogout: () => void;
}

export default function Taskbar({ windows, activeId, onWindowClick, onLogout }: TaskbarProps) {
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
      {/* Start button */}
      <div style={{ position: 'relative' }}>
        <button className="taskbar-start" onClick={() => setShowStart(s => !s)}>
          <span className="taskbar-start-icon">⊹</span>
          <b>Start</b>
        </button>

        {/* Start menu popup */}
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
            {/* Sidebar strip */}
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

            {/* Menu items */}
            <div style={{ marginLeft: 22 }}>
              <StartMenuItem icon="🔒" label="Kunci / Keluar" onClick={() => { setShowStart(false); onLogout(); }} />
              <div style={{ height: 1, background: 'var(--win-dark)', margin: '2px 0', boxShadow: '0 1px 0 var(--win-white)' }} />
              <StartMenuItem icon="🖥️" label="Dashboard" onClick={() => setShowStart(false)} />
            </div>
          </div>
        )}
      </div>

      <div className="taskbar-separator" />

      {/* Open windows */}
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

      {/* System tray */}
      <div className="taskbar-tray">
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
