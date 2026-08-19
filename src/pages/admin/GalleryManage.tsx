import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { api, GalleryItem } from '../../lib/api';

export default function GalleryManage() {
  const [items, setItems] = useState<GalleryItem[]>([]);

  function load() { api.gallery.list().then(setItems).catch(() => setItems([])); }
  useEffect(load, []);

  async function remove(id: string) {
    if (!confirm('Delete this item?')) return;
    await api.gallery.remove(id).catch(e => alert(e.message));
    load();
  }

  return (
    <AdminLayout title="Manage Gallery">
      {items.length === 0 ? <p>No items.</p> : (
        <div className="admin-grid">
          {items.map(item => (
            <div key={item.id} className="admin-card">
              {item.type === 'video'
                ? <video src={item.url} muted preload="metadata" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
                : <img src={item.url} alt={item.title} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />}
              <div className="admin-card-body">
                <h4>{item.title}</h4>
                <p className="muted">{item.category} · {item.type}</p>
                <button className="btn btn-danger" onClick={() => remove(item.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
