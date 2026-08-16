'use client';
import React from 'react';
import { ActiveSection } from '@/lib/types';

interface SidebarProps {
  active: ActiveSection;
  onChange: (s: ActiveSection) => void;
}

const nav: { id: ActiveSection; icon: string; label: string }[] = [
  { id: 'jadwal', icon: '📅', label: 'Jadwal' },
  { id: 'tugas', icon: '✅', label: 'Tugas' },
  { id: 'catatan', icon: '📝', label: 'Catatan' },
  { id: 'content', icon: '📆', label: 'Konten' },
  { id: 'proyek', icon: '🗂️', label: 'Proyek' },
];

export default function Sidebar({ active, onChange }: SidebarProps) {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">⊹</span>
      </div>
      <ul className="sidebar-nav">
        {nav.map((item) => (
          <li key={item.id}>
            <button
              className={`sidebar-btn ${active === item.id ? 'active' : ''}`}
              onClick={() => onChange(item.id)}
              title={item.label}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
