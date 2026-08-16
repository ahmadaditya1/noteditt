'use client';
import React from 'react';

interface BadgeProps {
  label: string;
  colorVar: string; // css color value
  onClick?: () => void;
  clickable?: boolean;
}

export default function Badge({
  label,
  colorVar,
  onClick,
  clickable,
}: BadgeProps) {
  return (
    <span
      className={`badge ${clickable ? 'badge-clickable' : ''}`}
      style={{ '--badge-color': colorVar } as React.CSSProperties}
      onClick={onClick}
      title={clickable ? 'Klik untuk ganti status' : undefined}
    >
      {label}
    </span>
  );
}

// ─── Color maps ──────────────────────────────────────────────────────────────
export const kategoriColor: Record<string, string> = {
  Kuliah: '#3b82f6',
  Tikethub: '#8b5cf6',
  'Porta Pic': '#ec4899',
  Personal: '#22c55e',
};

export const statusKontenColor: Record<string, string> = {
  Draft: '#6b7280',
  Review: '#f59e0b',
  Terjadwal: '#3b82f6',
  Publish: '#22c55e',
};

export const statusProyekColor: Record<string, string> = {
  Rencana: '#6b7280',
  Berjalan: '#f59e0b',
  Selesai: '#22c55e',
};
