'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import JadwalSection from '@/components/sections/JadwalSection';
import TugasSection from '@/components/sections/TugasSection';
import CatatanSection from '@/components/sections/CatatanSection';
import ContentCalendarSection from '@/components/sections/ContentCalendarSection';
import ProyekSection from '@/components/sections/ProyekSection';
import { ActiveSection } from '@/lib/types';
import {
  getJadwalKuliah,
  getJadwalTambahan,
  getTugas,
  getCatatan,
  getKonten,
  getProyek,
  fetchAllDataFromServer,
} from '@/lib/storage';

const QUOTES = [
  'Mulai dari yang bisa dikerjakan hari ini.',
  'Satu langkah kecil lebih baik dari rencana besar yang tak pernah dimulai.',
  'Konsistensi mengalahkan motivasi.',
  'Fokus pada prosesnya, bukan hanya hasilnya.',
  'Hari ini adalah kesempatan yang belum pernah ada sebelumnya.',
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi ☀️';
  if (hour < 15) return 'Selamat siang 🌤️';
  if (hour < 18) return 'Selamat sore 🌇';
  return 'Selamat malam 🌙';
}

interface DashboardProps {
  onLogout?: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [active, setActive] = useState<ActiveSection>('jadwal');
  const [data, setData] = useState({
    jadwalKuliah: getJadwalKuliah(),
    jadwalTambahan: getJadwalTambahan(),
    tugas: getTugas(),
    catatan: getCatatan(),
    konten: getKonten(),
    proyek: getProyek(),
  });
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  // Fetch from server on mount so cross-device data is always up-to-date
  useEffect(() => {
    fetchAllDataFromServer().then((serverData) => {
      if (serverData && serverData.connected !== false) {
        setData({
          jadwalKuliah: serverData.jadwalKuliah,
          jadwalTambahan: serverData.jadwalTambahan,
          tugas: serverData.tugas,
          catatan: serverData.catatan,
          konten: serverData.konten,
          proyek: serverData.proyek,
        });
      }
    });
  }, []);

  const refresh = useCallback(async () => {
    // 1. Segera update dari localStorage (0ms)
    setData({
      jadwalKuliah: getJadwalKuliah(),
      jadwalTambahan: getJadwalTambahan(),
      tugas: getTugas(),
      catatan: getCatatan(),
      konten: getKonten(),
      proyek: getProyek(),
    });

    // 2. Kemudian sync dengan server
    const serverData = await fetchAllDataFromServer();
    if (serverData && serverData.connected !== false) {
      setData({
        jadwalKuliah: serverData.jadwalKuliah,
        jadwalTambahan: serverData.jadwalTambahan,
        tugas: serverData.tugas,
        catatan: serverData.catatan,
        konten: serverData.konten,
        proyek: serverData.proyek,
      });
    }
  }, []);

  // Stats for header bar
  const pendingTugas = data.tugas.filter((t) => !t.done).length;
  const draftKonten = data.konten.filter((k) => k.status === 'Draft').length;

  return (
    <div className="dashboard-layout">
      <Sidebar active={active} onChange={setActive} />

      <div className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <h1 className="dashboard-greeting">{getGreeting()}</h1>
            <p className="dashboard-quote">{quote}</p>
          </div>
          <div className="dashboard-header-right">
            {(pendingTugas > 0 || draftKonten > 0) && (
              <div className="header-stats">
                {pendingTugas > 0 && (
                  <span className="header-stat">
                    <span className="stat-dot" style={{ background: 'var(--color-warning)' }} />
                    {pendingTugas} tugas pending
                  </span>
                )}
                {draftKonten > 0 && (
                  <span className="header-stat">
                    <span className="stat-dot" style={{ background: 'var(--color-muted)' }} />
                    {draftKonten} konten draft
                  </span>
                )}
              </div>
            )}
            <button className="btn-ghost btn-sm" onClick={onLogout} title="Keluar">
              Keluar
            </button>
          </div>
        </header>

        {/* Section content */}
        <main className="dashboard-content">
          {active === 'jadwal' && (
            <JadwalSection
              jadwalKuliah={data.jadwalKuliah}
              jadwalTambahan={data.jadwalTambahan}
              onChange={refresh}
            />
          )}
          {active === 'tugas' && (
            <TugasSection tugas={data.tugas} onChange={refresh} />
          )}
          {active === 'catatan' && (
            <CatatanSection catatan={data.catatan} onChange={refresh} />
          )}
          {active === 'content' && (
            <ContentCalendarSection konten={data.konten} onChange={refresh} />
          )}
          {active === 'proyek' && (
            <ProyekSection proyek={data.proyek} onChange={refresh} />
          )}
        </main>

        <footer className="dashboard-footer">
          v0.1.0 · made for myself
        </footer>
      </div>
    </div>
  );
}
