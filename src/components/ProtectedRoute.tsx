import { useEffect, useState, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'auth' | 'unauth'>('loading');
  useEffect(() => {
    api.auth.me().then(r => setState(r.authenticated ? 'auth' : 'unauth')).catch(() => setState('unauth'));
  }, []);
  if (state === 'loading') return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading…</div>;
  if (state === 'unauth') return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
