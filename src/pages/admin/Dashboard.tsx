import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { api, AdminStats } from '../../lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.stats.get()
      .then(setStats)
      .catch((e: any) => setError(e.message || 'Could not load statistics'));
  }, []);

  const cards = stats && [
    { n: stats.gallery,    label: 'Gallery items', note: `across ${stats.categories} categories` },
    { n: stats.sermons,    label: 'Sermons',       note: stats.sermons === 0 ? 'none added yet' : undefined },
    { n: stats.contacts,   label: 'Messages',      note: stats.contactsLast7Days > 0 ? `${stats.contactsLast7Days} in the last 7 days` : 'none this week' },
    { n: stats.newsletter, label: 'Newsletter',    note: 'opted in' }
  ];

  return (
    <AdminLayout title="Dashboard">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-stats">
        {!stats && !error && [0, 1, 2, 3].map(i => (
          <div key={i} className="admin-skeleton" style={{ height: '7.5rem' }} />
        ))}
        {cards?.map(c => (
          <div key={c.label} className="stat-card">
            <h3>{c.n}</h3>
            <p>{c.label}</p>
            {c.note && <span className="stat-note">{c.note}</span>}
          </div>
        ))}
      </div>

      {stats && (
        <>
          <h2 className="admin-section-title">Last 30 days</h2>
          <div className="admin-stats">
            <div className="stat-card">
              <h3>{stats.contactsLast30Days}</h3>
              <p>Enquiries received</p>
              <span className="stat-note">from the contact form</span>
            </div>
            <div className="stat-card">
              <h3>{stats.uploadsLast30Days}</h3>
              <p>Photos added</p>
              <span className="stat-note">to the gallery</span>
            </div>
          </div>
        </>
      )}

      <h2 className="admin-section-title">Quick actions</h2>
      <div className="admin-quick">
        <Link to="/admin/gallery-upload" className="btn btn-primary"><i className="fas fa-cloud-arrow-up" /> Upload photos</Link>
        <Link to="/admin/sermon-add" className="btn btn-primary"><i className="fas fa-microphone" /> Add sermon</Link>
        <Link to="/admin/contacts" className="btn btn-outline"><i className="fas fa-envelope" /> View messages</Link>
        <Link to="/admin/categories" className="btn btn-outline"><i className="fas fa-tags" /> Categories</Link>
      </div>

      {stats && stats.byCategory.length > 0 && (
        <>
          <h2 className="admin-section-title">Gallery by category</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Category</th><th>Photos</th><th>Share</th></tr></thead>
              <tbody>
                {stats.byCategory.map(c => (
                  <tr key={c.slug}>
                    <td data-label="Category" className="cell-strong">{c.label}</td>
                    <td data-label="Photos">{c.total}</td>
                    <td data-label="Share" className="cell-muted">
                      {stats.gallery ? Math.round((c.total / stats.gallery) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
