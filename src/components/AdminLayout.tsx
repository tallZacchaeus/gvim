import { ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { AdminFeedbackProvider } from './AdminFeedback';

const NAV = [
  { to: '/admin/dashboard',      icon: 'fa-gauge-high',    label: 'Dashboard' },
  { to: '/admin/gallery-upload', icon: 'fa-cloud-arrow-up', label: 'Upload Gallery' },
  { to: '/admin/gallery-manage', icon: 'fa-images',        label: 'Manage Gallery' },
  { to: '/admin/sermon-add',     icon: 'fa-microphone',    label: 'Add Sermon' },
  { to: '/admin/sermon-manage',  icon: 'fa-list',          label: 'Manage Sermons' },
  { to: '/admin/categories',     icon: 'fa-tags',          label: 'Categories' },
  { to: '/admin/contacts',       icon: 'fa-envelope',      label: 'Contacts' }
];

export default function AdminLayout({
  children, title, actions
}: { children: ReactNode; title: string; actions?: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  // Close the drawer on navigation — otherwise it stays open over the new page.
  useEffect(() => { setNavOpen(false); }, [location.pathname]);

  // Escape closes the drawer, and the page behind it must not scroll while open.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setNavOpen(false); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  async function logout() {
    await api.auth.logout().catch(() => {});
    navigate('/admin');
  }

  return (
    <AdminFeedbackProvider>
      <div className={`admin-wrap${navOpen ? ' nav-open' : ''}`}>
        <aside className="admin-sidebar" id="admin-sidebar">
          <div className="admin-brand">
            <img src="/gvim-logo.jpg" alt="" width={44} height={44} />
            <div>
              <strong>GVIM</strong>
              <span>Admin</span>
            </div>
          </div>

          <nav className="admin-nav" aria-label="Admin">
            {NAV.map(item => (
              <NavLink key={item.to} to={item.to}>
                <i className={`fas ${item.icon}`} aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
            <hr className="admin-nav-sep" />
            <Link to="/" target="_blank" rel="noopener noreferrer">
              <i className="fas fa-arrow-up-right-from-square" aria-hidden="true" />
              View Site
            </Link>
            <button onClick={logout} className="admin-logout" type="button">
              <i className="fas fa-right-from-bracket" aria-hidden="true" />
              Log out
            </button>
          </nav>
        </aside>

        {/* Only rendered while the drawer is open; CSS hides it above 900px. */}
        {navOpen && (
          <button
            className="admin-scrim"
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
          />
        )}

        <main className="admin-main">
          <header className="admin-header">
            <button
              className="admin-menu-btn"
              onClick={() => setNavOpen(v => !v)}
              aria-label={navOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={navOpen}
              aria-controls="admin-sidebar"
              type="button"
            >
              <i className={`fas ${navOpen ? 'fa-xmark' : 'fa-bars'}`} aria-hidden="true" />
            </button>
            <h1>{title}</h1>
            {actions && <div className="admin-header-actions">{actions}</div>}
          </header>
          <div className="admin-content">{children}</div>
        </main>
      </div>
    </AdminFeedbackProvider>
  );
}
