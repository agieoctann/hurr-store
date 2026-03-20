import { useState, useEffect, type FormEvent } from 'react';
import { Mail, Lock, ShoppingBag, Chrome, Facebook, Server } from 'lucide-react';
import { API } from '../types';
import type { AuthUser } from '../types';

interface Props { onAuth: (token: string, user: AuthUser) => void; }

export default function AuthPage({ onAuth }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dbOk, setDbOk] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('http://localhost:5000/health')
      .then(r => r.json()).then(d => setDbOk(d.status === 'ok')).catch(() => setDbOk(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const endpoint = tab === 'login' ? '/auth/login' : '/auth/register';
      // Register is always USER role
      const body = tab === 'login' ? { email, password } : { email, password, role: 'USER' };
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal');
      if (tab === 'register') {
        setSuccess('Akun berhasil dibuat! Silakan login.');
        setTab('login');
        setEmail(''); setPassword('');
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onAuth(data.token, data.user);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-root">
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />
      <div className="auth-bg-orb auth-bg-orb-3" />

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo-wrap">
          <ShoppingBag size={28} color="white" strokeWidth={2.5} />
        </div>
        <h1 className="auth-title">Hurr Store</h1>
        <p className="auth-subtitle">Platform belanja terpercaya & terlengkap</p>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); setSuccess(''); }}>
            Masuk
          </button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); setSuccess(''); }}>
            Daftar
          </button>
        </div>

        {/* Registration info note */}
        {tab === 'register' && (
          <div className="alert" style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--purple-700)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 16 }}>
            🛍️ Pendaftaran terbuka untuk <strong>Pelanggan</strong>. Admin ditambahkan oleh sistem.
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrap">
              <span className="input-icon"><Mail size={16} color="var(--text-muted)" /></span>
              <input className="form-input" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="email@contoh.com" required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kata Sandi</label>
            <div className="input-wrap">
              <span className="input-icon"><Lock size={16} color="var(--text-muted)" /></span>
              <input className="form-input" type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="min. 6 karakter" required minLength={6} />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 20 }}>
            {loading ? <span className="spinner" /> : null}
            {tab === 'login' ? 'Masuk Sekarang' : 'Buat Akun Gratis'}
          </button>
        </form>

        {/* Social login */}
        <div className="social-divider">atau lanjutkan dengan</div>
        <div className="social-btns">
          <button type="button" className="btn-social"
            onClick={() => setError('Social login membutuhkan konfigurasi OAuth credentials.')}>
            <Chrome size={18} />
            Google
          </button>
          <button type="button" className="btn-social"
            onClick={() => setError('Social login membutuhkan konfigurasi OAuth credentials.')}>
            <Facebook size={18} color="#1877F2" />
            Facebook
          </button>
        </div>

        {/* DB status */}
        <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', justifyContent: 'center' }}>
          <span className={`badge ${dbOk === null ? 'badge-gray' : dbOk ? 'badge-green' : 'badge-danger'}`}
            style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Server size={11} />
            {dbOk === null ? 'Mengecek server...' : dbOk ? 'Server Online' : 'Server Offline'}
          </span>
        </div>
      </div>
    </div>
  );
}
