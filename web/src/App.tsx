import { useState, lazy, Suspense, useEffect } from 'react';
import './index.css';
import type { AuthUser } from './types';

// Lazy‑load heavy pages so socket.io-client doesn't run until needed
const AuthPage = lazy(() => import('./components/AuthPage'));
const AdminApp = lazy(() => import('./components/AdminApp'));
const UserApp  = lazy(() => import('./components/UserApp'));

function Loading() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      background: 'linear-gradient(135deg, #ede9fe 0%, #fae8ff 50%, #cffafe 100%)'
    }}>
      <div style={{
        width: 56, height: 56,
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
        borderRadius: 14, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 26,
        boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
        animation: 'spin 1.2s linear infinite'
      }}>🛍️</div>
      <p style={{ color: '#4f46e5', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>Memuat Hurr Store…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => {
    try { return localStorage.getItem('token'); } catch { return null; }
  });
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  });

  // ── Handle OAuth redirect callback ──────────────────────────────────────────
  // Backend redirects to: /?auth_token=xxx&auth_user=xxx  (or ?auth_error=xxx)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authToken = params.get('auth_token');
    const authUserRaw = params.get('auth_user');
    const authError = params.get('auth_error');

    if (authError) {
      // Clear bad state; AuthPage will show error via its own state
      console.error('OAuth error:', authError);
      // Remove query string from URL
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (authToken && authUserRaw) {
      try {
        const authUser: AuthUser = JSON.parse(decodeURIComponent(authUserRaw));
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(authUser));
        setToken(authToken);
        setUser(authUser);
        // Clean URL so token doesn't stay in browser history
        window.history.replaceState({}, '', window.location.pathname);
      } catch (e) {
        console.error('Failed to parse OAuth user data', e);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const handleAuth = (t: string, u: AuthUser) => { setToken(t); setUser(u); };
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null); setUser(null);
  };

  return (
    <Suspense fallback={<Loading />}>
      {(!token || !user)
        ? <AuthPage onAuth={handleAuth} />
        : user.role === 'ADMIN'
          ? <AdminApp token={token} user={user} onLogout={handleLogout} />
          : <UserApp  token={token} user={user} onLogout={handleLogout} />
      }
    </Suspense>
  );
}
