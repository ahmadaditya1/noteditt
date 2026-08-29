'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import JadwalSection from '@/components/sections/JadwalSection';
import TugasSection from '@/components/sections/TugasSection';
import CatatanSection from '@/components/sections/CatatanSection';
import ContentCalendarSection from '@/components/sections/ContentCalendarSection';
import ProyekSection from '@/components/sections/ProyekSection';
import { ActiveSection } from '@/lib/types';
import { EMPTY_DATA, fetchAllDataFromServer, type AllDashboardData } from '@/lib/storage';

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
  const [data, setData] = useState<AllDashboardData>(EMPTY_DATA);
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  const refresh = useCallback(async () => {
    const result = await fetchAllDataFromServer();
    setData(result.data);
  }, []);

  // Always query PostgreSQL before considering the local fallback.
  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => void refresh(), 45_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

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
