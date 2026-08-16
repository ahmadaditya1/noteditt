'use client';
import { useState, useEffect } from 'react';
import AuthGate from '@/components/AuthGate';
import Dashboard from '@/components/Dashboard';
import { getAccessCode } from '@/lib/storage';

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // client-only: check existing session token
    const sessionOk = sessionStorage.getItem('dashboard-session') === 'ok';
    if (sessionOk && getAccessCode()) {
      setAuthed(true);
    }
    setReady(true);
  }, []);

  const handleAuth = () => {
    sessionStorage.setItem('dashboard-session', 'ok');
    setAuthed(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('dashboard-session');
    setAuthed(false);
  };

  if (!ready) return null;

  return authed ? (
    <Dashboard onLogout={handleLogout} />
  ) : (
    <AuthGate onAuth={handleAuth} />
  );
}
