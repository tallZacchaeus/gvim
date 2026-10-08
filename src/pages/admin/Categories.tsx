import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useFeedback } from '../../components/AdminFeedback';
import { api, Category } from '../../lib/api';

export default function Categories() {
  const { confirm, notify } = useFeedback();
  const [cats, setCats] = useState<Category[] | null>(null);
  const [label, setLabel] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  function load() { api.categories.list().then(setCats).catch(() => setCats([])); }
  useEffect(load, []);

  /* The slug is derived from the label as you type. Previously both were typed
     by hand, which let the two drift apart and made it easy to create an
     invalid slug the API would then reject. */
  function onLabel(v: string) {
    setLabel(v);
    if (!slugTouched) setSlug(v.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.categories.add(slug, label);
      notify(`Category “${label}” added`);
      setLabel(''); setSlug(''); setSlugTouched(false);
      load();
    } catch (e: any) { notify(e.message || 'Could not add category', 'error'); }
    finally { setBusy(false); }
  }

  async function remove(c: Category) {
    const ok = await confirm({
      title: `Delete “${c.label}”?`,
      message: 'Categories still used by photos cannot be deleted.',
      confirmLabel: 'Delete', destructive: true
    });
    if (!ok) return;
    try { await api.categories.remove(c.slug); notify('Category deleted'); load(); }
    catch (e: any) { notify(e.message || 'Could not delete', 'error'); }
  }

  return (
    <AdminLayout title="Categories">
      <form onSubmit={add} className="admin-form">
        <div className="form-group">
          <label htmlFor="cat-label">Name</label>
          <input id="cat-label" required value={label} onChange={e => onLabel(e.target.value)} placeholder="e.g. Worship Services" />
        </div>
        <div className="form-group">
          <label htmlFor="cat-slug">Slug</label>
          <input
            id="cat-slug" required value={slug}
            onChange={e => { setSlug(e.target.value); setSlugTouched(true); }}
            placeholder="e.g. worship-services"
          />
          <span className="form-hint">Used in the web address. Filled in automatically — edit if you need to.</span>
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy || !label.trim()}>
          {busy ? 'Adding…' : 'Add category'}
        </button>
      </form>

      <h2 className="admin-section-title">Existing categories</h2>
      {cats === null ? (
        <div className="admin-table-wrap" style={{ padding: '0.75rem' }}>
          {[0, 1, 2].map(i => <div key={i} className="admin-skeleton admin-skeleton-row" />)}
        </div>
      ) : cats.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-tags" aria-hidden="true" />
          <h3>No categories</h3>
          <p>Add one above so photos can be grouped on the gallery page.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Slug</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {cats.map(c => (
                <tr key={c.slug}>
                  <td data-label="Name" className="cell-strong">{c.label}</td>
                  <td data-label="Slug" className="cell-muted">{c.slug}</td>
                  <td data-label="Actions" className="cell-actions-wrap">
                    <div className="cell-actions">
                      <button className="btn btn-danger" onClick={() => remove(c)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
