import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { api } from '../../lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ gallery: 0, sermons: 0, contacts: 0, categories: 0 });

  useEffect(() => {
    Promise.all([
      api.gallery.list().catch(() => []),
      api.sermons.list().catch(() => []),
      api.contacts.list().catch(() => []),
      api.categories.list().catch(() => [])
    ]).then(([g, s, c, cat]) => setStats({ gallery: g.length, sermons: s.length, contacts: c.length, categories: cat.length }));
  }, []);

  return (
    <AdminLayout title="Dashboard">
      <div className="admin-stats">
        <div className="stat-card"><h3>{stats.gallery}</h3><p>Gallery Items</p></div>
        <div className="stat-card"><h3>{stats.sermons}</h3><p>Sermons</p></div>
        <div className="stat-card"><h3>{stats.contacts}</h3><p>Contact Messages</p></div>
        <div className="stat-card"><h3>{stats.categories}</h3><p>Categories</p></div>
      </div>
      <h2 style={{ marginTop: '2rem' }}>Quick Actions</h2>
      <div className="admin-quick">
        <Link to="/admin/gallery-upload" className="btn btn-primary">Upload Gallery</Link>
        <Link to="/admin/sermon-add" className="btn btn-primary">Add Sermon</Link>
        <Link to="/admin/categories" className="btn btn-outline">Manage Categories</Link>
        <Link to="/admin/contacts" className="btn btn-outline">View Contacts</Link>
      </div>
    </AdminLayout>
  );
}
