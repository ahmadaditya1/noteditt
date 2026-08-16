'use client';
import React, { useState, useCallback } from 'react';
import DesktopIcon from './DesktopIcon';
import WindowFrame, { WindowConfig } from './WindowFrame';
import Taskbar from './Taskbar';
import JadwalSection from './sections/JadwalSection';
import TugasSection from './sections/TugasSection';
import CatatanSection from './sections/CatatanSection';
import ContentCalendarSection from './sections/ContentCalendarSection';
import ProyekSection from './sections/ProyekSection';
import {
  getJadwalKuliah, getJadwalTambahan, getTugas,
  getCatatan, getKonten, getProyek,
} from '@/lib/storage';

interface DesktopEnvironmentProps {
  onLogout: () => void;
}

// Icon paths
const ICON = {
  calendar: '/icons/calendar.jpg',
  notes: '/icons/notes.jpg',
  socmed: '/icons/socmed.jpg',
  work: '/icons/work.jpg',
  folders: '/icons/folders.jpg',
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

let zCounter = 10;

export default function DesktopEnvironment({ onLogout }: DesktopEnvironmentProps) {
  const [windows, setWindows] = useState<WindowConfig[]>(
    DEFAULT_WINDOWS.map(w => ({ ...w, zIndex: zCounter++ }))
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  // Data state
  const [data, setData] = useState({
    jadwalKuliah: getJadwalKuliah(),
    jadwalTambahan: getJadwalTambahan(),
    tugas: getTugas(),
    catatan: getCatatan(),
    konten: getKonten(),
    proyek: getProyek(),
  });

  const refresh = useCallback(() => {
    setData({
      jadwalKuliah: getJadwalKuliah(),
      jadwalTambahan: getJadwalTambahan(),
      tugas: getTugas(),
      catatan: getCatatan(),
      konten: getKonten(),
      proyek: getProyek(),
    });
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
      {/* Desktop area */}
      <div className="desktop" onClick={() => setSelectedIcon(null)}>
        {/* Desktop icons */}
        <div className="desktop-icons">
          {DESKTOP_ICONS.map(icon => (
            <DesktopIcon
              key={icon.id}
              id={icon.id}
              label={icon.label}
              iconSrc={icon.icon}
              isSelected={selectedIcon === icon.id}
              isOpen={windows.find(w => w.id === icon.id)?.isOpen ?? false}
              onClick={id => setSelectedIcon(id)}
              onDoubleClick={openWindow}
            />
          ))}
        </div>

        {/* Windows */}
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

      {/* Taskbar */}
      <Taskbar
        windows={windows}
        activeId={activeId}
        onWindowClick={handleTaskbarClick}
        onLogout={onLogout}
      />
    </>
  );
}
