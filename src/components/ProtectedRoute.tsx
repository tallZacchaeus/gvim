import { useEffect, useState, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { AdminFeedbackProvider } from './AdminFeedback';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'auth' | 'unauth'>('loading');
  useEffect(() => {
    api.auth.me().then(r => setState(r.authenticated ? 'auth' : 'unauth')).catch(() => setState('unauth'));
  }, []);
  if (state === 'loading') return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading…</div>;
  if (state === 'unauth') return <Navigate to="/admin" replace />;
  /* The provider must sit ABOVE the page components: pages call useFeedback()
     and then return <AdminLayout>, so a provider inside AdminLayout would be a
     child of its own consumer and the hook would throw. */
  return <AdminFeedbackProvider>{children}</AdminFeedbackProvider>;
}
