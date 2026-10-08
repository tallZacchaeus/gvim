import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { useFeedback } from '../../components/AdminFeedback';
import { api, Category, GalleryItem } from '../../lib/api';

export default function GalleryManage() {
  const { confirm, notify } = useFeedback();
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');

  function load() { api.gallery.list().then(setItems).catch(() => setItems([])); }
  useEffect(() => { load(); api.categories.list().then(setCats).catch(() => {}); }, []);

  async function remove(item: GalleryItem) {
    const ok = await confirm({
      title: 'Delete this item?',
      message: `“${item.title}” will be removed from the gallery and deleted from storage. This cannot be undone.`,
      confirmLabel: 'Delete', destructive: true
    });
    if (!ok) return;
    try { await api.gallery.remove(item.id); notify('Item deleted'); load(); }
    catch (e: any) { notify(e.message || 'Could not delete', 'error'); }
  }

  /* With ~91 items a flat grid was unusable — finding one photo meant scrolling
     the whole library. Filter by category and search by title. */
  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (items || []).filter(i =>
      (cat === 'all' || i.category === cat) &&
      (!term || (i.title || '').toLowerCase().includes(term) || (i.filename || '').toLowerCase().includes(term))
    );
  }, [items, cat, q]);

  return (
    <AdminLayout
      title="Gallery"
      actions={<Link to="/admin/gallery-upload" className="btn btn-primary"><i className="fas fa-plus" /> Upload</Link>}
    >
      {items === null ? (
        <div className="admin-grid">
          {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="admin-skeleton admin-skeleton-card" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-images" aria-hidden="true" />
          <h3>Nothing in the gallery yet</h3>
          <p>Upload photos or video and they will appear on your public gallery page.</p>
          <Link to="/admin/gallery-upload" className="btn btn-primary">Upload photos</Link>
        </div>
      ) : (
        <>
          <div className="admin-toolbar">
            <input
              className="admin-search" type="search"
              placeholder="Search by title or filename…"
              value={q} onChange={e => setQ(e.target.value)}
              aria-label="Search gallery"
            />
            <select
              className="admin-search" style={{ flex: '0 0 auto' }}
              value={cat} onChange={e => setCat(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {cats.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
            </select>
            <span className="admin-count">{visible.length} of {items.length}</span>
          </div>

          {visible.length === 0 ? (
            <div className="admin-empty">
              <i className="fas fa-magnifying-glass" aria-hidden="true" />
              <h3>No matches</h3>
              <p>Try a different search or category.</p>
            </div>
          ) : (
            <div className="admin-grid">
              {visible.map(item => (
                <div key={item.id} className="admin-card">
                  <div className="admin-card-media">
                    {item.type === 'video'
                      ? <video src={item.url} muted preload="metadata" />
                      : <img src={item.url} alt={item.title} loading="lazy" />}
                    {item.type === 'video' && <span className="admin-card-badge">Video</span>}
                  </div>
                  <div className="admin-card-body">
                    <span className="admin-card-title">{item.title}</span>
                    <p className="muted">{cats.find(c => c.slug === item.category)?.label || item.category}</p>
                    <button className="btn btn-danger" onClick={() => remove(item)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
