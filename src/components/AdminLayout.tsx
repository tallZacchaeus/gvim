import { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const navigate = useNavigate();

  async function logout() {
    await api.auth.logout().catch(() => {});
    navigate('/admin');
  }

  return (
    <div className="admin-wrap">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src="/gvim-logo.jpg" alt="GVIM" width={48} height={48} />
          <div>
            <strong>GVIM Admin</strong>
          </div>
        </div>
        <nav className="admin-nav">
          <NavLink to="/admin/dashboard">Dashboard</NavLink>
          <NavLink to="/admin/gallery-upload">Upload Gallery</NavLink>
          <NavLink to="/admin/gallery-manage">Manage Gallery</NavLink>
          <NavLink to="/admin/sermon-add">Add Sermon</NavLink>
          <NavLink to="/admin/sermon-manage">Manage Sermons</NavLink>
          <NavLink to="/admin/categories">Categories</NavLink>
          <NavLink to="/admin/contacts">Contacts</NavLink>
          <Link to="/" target="_blank">View Site</Link>
          <button onClick={logout} className="admin-logout">Logout</button>
        </nav>
      </aside>
      <main className="admin-main">
        <header className="admin-header"><h1>{title}</h1></header>
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
