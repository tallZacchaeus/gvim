import { Link, useLocation } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';

/* Kept in sync by hand with the routes in App.tsx — short enough that a
   generated list would cost more than it saves. */
const SECTIONS = [
  { to: '/admin/dashboard',      label: 'Dashboard' },
  { to: '/admin/gallery-upload', label: 'Upload Gallery' },
  { to: '/admin/gallery-manage', label: 'Manage Gallery' },
  { to: '/admin/sermon-add',     label: 'Add Sermon' },
  { to: '/admin/sermon-manage',  label: 'Manage Sermons' },
  { to: '/admin/categories',     label: 'Categories' },
  { to: '/admin/contacts',       label: 'Contacts' }
];

/**
 * Admin 404, rendered inside AdminLayout so the sidebar (or the phone tab bar)
 * is still there. Previously an unknown admin path rendered an empty document
 * with no navigation at all.
 */
export default function AdminNotFound() {
  const { pathname } = useLocation();
  return (
    <AdminLayout title="Page not found">
      <div className="admin-panel admin-404">
        <p className="admin-404__code">Error 404</p>
        <h2>Nothing lives at this address</h2>
        <p className="admin-404__path"><code>{pathname}</code></p>
        <p className="admin-404__hint">
          Pick a section below, or use Search to jump anywhere.
        </p>
        <ul className="admin-404__links">
          {SECTIONS.map(s => (
            <li key={s.to}><Link to={s.to}>{s.label}</Link></li>
          ))}
        </ul>
      </div>
    </AdminLayout>
  );
}
