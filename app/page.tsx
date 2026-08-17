'use client';
import { useState, useEffect } from 'react';
import AuthGate from '@/components/AuthGate';
import DesktopEnvironment from '@/components/DesktopEnvironment';

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/check');
        const data = await res.json();
        if (data.authenticated) {
          setAuthed(true);
        }
      } catch (err) {
        console.error('Failed to verify session:', err);
      } finally {
        setReady(true);
      }
    }
    checkAuth();
  }, []);

  const handleAuth = () => {
    setAuthed(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setAuthed(false);
  };

  if (!ready) return null;

  return authed
    ? <DesktopEnvironment onLogout={handleLogout} />
    : <AuthGate onAuth={handleAuth} />;
}
