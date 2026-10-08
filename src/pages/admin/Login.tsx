import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export default function Login() {
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      await api.auth.login(username, password);
      navigate('/admin/dashboard');
    } catch (e: any) { setErr(e.message || 'Login failed'); }
    finally { setLoading(false); }
  }

  return (
    <main className="admin-login">
      <div className="admin-login-card">
        <img src="/gvim-logo-128.jpg" alt="" width={72} height={72} />
        <h1>GVIM Admin</h1>
        <p className="login-sub">Sign in to manage the website</p>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input id="username" type="text" required value={username} onChange={e => setU(e.target.value)} autoComplete="username" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" required value={password} onChange={e => setP(e.target.value)} autoComplete="current-password" />
          </div>
          {err && <div className="alert alert-error">{err}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <a href="/" className="admin-login-back">← Back to the website</a>
      </div>
    </main>
  );
}
