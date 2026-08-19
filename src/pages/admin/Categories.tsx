import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { api, Category } from '../../lib/api';

export default function Categories() {
  const [cats, setCats] = useState<Category[]>([]);
  const [slug, setSlug] = useState('');
  const [label, setLabel] = useState('');
  const [msg, setMsg] = useState('');

  function load() { api.categories.list().then(setCats).catch(() => setCats([])); }
  useEffect(load, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try { await api.categories.add(slug, label); setSlug(''); setLabel(''); load(); }
    catch (e: any) { setMsg(e.message); }
  }

  async function remove(s: string) {
    if (!confirm(`Delete category "${s}"?`)) return;
    try { await api.categories.remove(s); load(); }
    catch (e: any) { alert(e.message); }
  }

  return (
    <AdminLayout title="Categories">
      <form onSubmit={add} className="admin-form" style={{ maxWidth: 500 }}>
        {msg && <div className="alert alert-error">{msg}</div>}
        <div className="form-group"><label>Slug</label><input required value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g. worship" /></div>
        <div className="form-group"><label>Label</label><input required value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Worship Services" /></div>
        <button type="submit" className="btn btn-primary">Add Category</button>
      </form>

      <h2 style={{ marginTop: '2rem' }}>Existing</h2>
      <table className="admin-table">
        <thead><tr><th>Slug</th><th>Label</th><th></th></tr></thead>
        <tbody>
          {cats.map(c => (
            <tr key={c.slug}>
              <td>{c.slug}</td>
              <td>{c.label}</td>
              <td><button className="btn btn-danger" onClick={() => remove(c.slug)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
}
