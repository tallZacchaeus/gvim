import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { api, Sermon } from '../../lib/api';

export default function SermonManage() {
  const [items, setItems] = useState<Sermon[]>([]);
  function load() { api.sermons.list().then(setItems).catch(() => setItems([])); }
  useEffect(load, []);

  async function remove(id: string) {
    if (!confirm('Delete this sermon?')) return;
    await api.sermons.remove(id).catch(e => alert(e.message));
    load();
  }

  return (
    <AdminLayout title="Manage Sermons">
      {items.length === 0 ? <p>No sermons.</p> : (
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Speaker</th><th>Date</th><th>YouTube</th><th></th></tr></thead>
          <tbody>
            {items.map(s => (
              <tr key={s.id}>
                <td>{s.title}</td>
                <td>{s.speaker}</td>
                <td>{s.sermon_date || ''}</td>
                <td>{s.youtube_id ? <a href={`https://youtube.com/watch?v=${s.youtube_id}`} target="_blank" rel="noopener noreferrer">View</a> : '—'}</td>
                <td><button className="btn btn-danger" onClick={() => remove(s.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminLayout>
  );
}
