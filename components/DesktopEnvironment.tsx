'use client';
import React, { useState, useCallback, useEffect } from 'react';
import DesktopIcon from './DesktopIcon';
import WindowFrame, { WindowConfig } from './WindowFrame';
import Taskbar from './Taskbar';
import JadwalSection from './sections/JadwalSection';
import TugasSection from './sections/TugasSection';
import CatatanSection from './sections/CatatanSection';
import ContentCalendarSection from './sections/ContentCalendarSection';
import ProyekSection from './sections/ProyekSection';
import {
  EMPTY_DATA,
  fetchAllDataFromServer,
  subscribeSyncStatus,
  type AllDashboardData,
  type SyncStatus,
} from '@/lib/storage';

interface DesktopEnvironmentProps {
  onLogout: () => void;
}

const ICON = {
  calendar: '/icons/calendar.png',
  notes: '/icons/notes.png',
  socmed: '/icons/socmed.png',
  work: '/icons/work.png',
  folders: '/icons/folders.png',
};

const DEFAULT_WINDOWS: Omit<WindowConfig, 'zIndex'>[] = [
  { id: 'jadwal',  title: 'Jadwal.exe',          icon: ICON.calendar, isOpen: false, isMinimized: false, position: { x: 80,  y: 40  }, size: { w: 700, h: 480 } },
  { id: 'tugas',   title: 'Tugas.exe',            icon: ICON.work,     isOpen: false, isMinimized: false, position: { x: 120, y: 60  }, size: { w: 620, h: 440 } },
  { id: 'catatan', title: 'Catatan.txt',          icon: ICON.notes,    isOpen: false, isMinimized: false, position: { x: 160, y: 80  }, size: { w: 500, h: 420 } },
  { id: 'content', title: 'SocMed Calendar.exe',  icon: ICON.socmed,   isOpen: false, isMinimized: false, position: { x: 200, y: 100 }, size: { w: 680, h: 440 } },
  { id: 'proyek',  title: 'Proyek — Folders',     icon: ICON.folders,  isOpen: false, isMinimized: false, position: { x: 240, y: 120 }, size: { w: 580, h: 420 } },
];

const DESKTOP_ICONS = [
  { id: 'jadwal',  label: 'Calendar',  icon: ICON.calendar },
  { id: 'catatan', label: 'Notes',     icon: ICON.notes    },
  { id: 'content', label: 'SocMed',    icon: ICON.socmed   },
  { id: 'tugas',   label: 'Work',      icon: ICON.work     },
  { id: 'proyek',  label: 'Folders',   icon: ICON.folders  },
];

interface IconPosition {
  x: number;
  y: number;
}

function getRandomPositions(): Record<string, IconPosition> {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const height = typeof window !== 'undefined' ? window.innerHeight - 60 : 700;

  const slotW = 120;
  const slotH = 110;
  const cols = Math.max(3, Math.floor((width - 60) / slotW));
  const rows = Math.max(3, Math.floor((height - 60) / slotH));

  const allSlots: { col: number; row: number }[] = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      allSlots.push({ col: c, row: r });
    }
  }

  for (let i = allSlots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allSlots[i], allSlots[j]] = [allSlots[j], allSlots[i]];
  }

  const positions: Record<string, IconPosition> = {};
  DESKTOP_ICONS.forEach((icon, idx) => {
    const slot = allSlots[idx % allSlots.length] || { col: 0, row: idx };
    const jitterX = Math.floor(Math.random() * 24) - 12;
    const jitterY = Math.floor(Math.random() * 24) - 12;
    const x = Math.max(20, Math.min(width - 100, 30 + slot.col * slotW + jitterX));
    const y = Math.max(20, Math.min(height - 100, 30 + slot.row * slotH + jitterY));
    positions[icon.id] = { x, y };
  });

  return positions;
}

let zCounter = 10;

const POLL_INTERVAL_MS = 45_000;

export default function DesktopEnvironment({ onLogout }: DesktopEnvironmentProps) {
  const [windows, setWindows] = useState<WindowConfig[]>(
    DEFAULT_WINDOWS.map(w => ({ ...w, zIndex: zCounter++ }))
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [iconPositions, setIconPositions] = useState<Record<string, IconPosition>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');

  useEffect(() => {
    setIconPositions(getRandomPositions());
  }, []);

  useEffect(() => subscribeSyncStatus(setSyncStatus), []);

  const [data, setData] = useState<AllDashboardData>(EMPTY_DATA);

  /** Fetch dari PostgreSQL (SSOT); fallback localStorage hanya jika gagal total. */
  const refresh = useCallback(async () => {
    const result = await fetchAllDataFromServer();
    setData(result.data);
    setDataLoading(false);
  }, []);

  // Initial load: server first
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refetch saat tab kembali fokus
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [refresh]);

  // Polling ringan setiap 45 detik
  useEffect(() => {
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const moveIcon = useCallback((id: string, pos: IconPosition) => {
    setIconPositions(prev => ({ ...prev, [id]: pos }));
  }, []);

  const openWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => {
      if (w.id !== id) return w;
      zCounter++;
      return { ...w, isOpen: true, isMinimized: false, zIndex: zCounter };
    }));
    setActiveId(id);
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isOpen: false } : w));
    setActiveId(null);
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    setActiveId(null);
  }, []);

  const focusWindow = useCallback((id: string) => {
    zCounter++;
    setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: zCounter, isMinimized: false } : w));
    setActiveId(id);
  }, []);

  const moveWindow = useCallback((id: string, pos: { x: number; y: number }) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, position: pos } : w));
  }, []);

  const handleTaskbarClick = useCallback((id: string) => {
    const win = windows.find(w => w.id === id);
    if (!win) return;
    if (win.isMinimized || activeId !== id) {
      focusWindow(id);
    } else {
      minimizeWindow(id);
    }
  }, [windows, activeId, focusWindow, minimizeWindow]);

  const renderWindowContent = (id: string) => {
    if (dataLoading) {
      return <p className="empty-state" style={{ padding: 16 }}>Memuat data dari server…</p>;
    }
    switch (id) {
      case 'jadwal':  return <JadwalSection jadwalKuliah={data.jadwalKuliah} jadwalTambahan={data.jadwalTambahan} onChange={refresh} />;
      case 'tugas':   return <TugasSection tugas={data.tugas} onChange={refresh} />;
      case 'catatan': return <CatatanSection catatan={data.catatan} onChange={refresh} />;
      case 'content': return <ContentCalendarSection konten={data.konten} onChange={refresh} />;
      case 'proyek':  return <ProyekSection proyek={data.proyek} onChange={refresh} />;
      default: return null;
    }
  };

  return (
    <>
      <div className="desktop" onClick={() => setSelectedIcon(null)}>
        <div className="desktop-icons">
          {DESKTOP_ICONS.map(icon => (
            <DesktopIcon
              key={icon.id}
              id={icon.id}
              label={icon.label}
              iconSrc={icon.icon}
              isSelected={selectedIcon === icon.id}
              isOpen={windows.find(w => w.id === icon.id)?.isOpen ?? false}
              position={iconPositions[icon.id]}
              onClick={id => setSelectedIcon(id)}
              onDoubleClick={openWindow}
              onMove={moveIcon}
            />
          ))}
        </div>

        {windows.map(win => (
          <WindowFrame
            key={win.id}
            config={win}
            isActive={activeId === win.id}
            onClose={closeWindow}
            onMinimize={minimizeWindow}
            onFocus={focusWindow}
            onMove={moveWindow}
          >
            {renderWindowContent(win.id)}
          </WindowFrame>
        ))}
      </div>

      <Taskbar
        windows={windows}
        activeId={activeId}
        syncStatus={syncStatus}
        onWindowClick={handleTaskbarClick}
        onLogout={onLogout}
        onRefresh={refresh}
      />
    </>
  );
}
