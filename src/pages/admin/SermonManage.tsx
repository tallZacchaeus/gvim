import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { useFeedback } from '../../components/AdminFeedback';
import { api, Sermon } from '../../lib/api';
import { formatDate } from '../../lib/format';

export default function SermonManage() {
  const { confirm, notify } = useFeedback();
  const [items, setItems] = useState<Sermon[] | null>(null);

  function load() { api.sermons.list().then(setItems).catch(() => setItems([])); }
  useEffect(load, []);

  async function remove(s: Sermon) {
    const ok = await confirm({
      title: 'Delete this sermon?',
      message: `“${s.title}” and any uploaded audio will be permanently removed.`,
      confirmLabel: 'Delete', destructive: true
    });
    if (!ok) return;
    try { await api.sermons.remove(s.id); notify('Sermon deleted'); load(); }
    catch (e: any) { notify(e.message || 'Could not delete', 'error'); }
  }

  return (
    <AdminLayout
      title="Sermons"
      actions={<Link to="/admin/sermon-add" className="btn btn-primary"><i className="fas fa-plus" /> Add</Link>}
    >
      {items === null ? (
        <div className="admin-table-wrap" style={{ padding: '0.75rem' }}>
          {[0, 1, 2].map(i => <div key={i} className="admin-skeleton admin-skeleton-row" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-microphone-slash" aria-hidden="true" />
          <h3>No sermons yet</h3>
          <p>Add a sermon with a YouTube link or an audio file, and it will appear on the Sermons page.</p>
          <Link to="/admin/sermon-add" className="btn btn-primary">Add your first sermon</Link>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Title</th><th>Speaker</th><th>Date</th><th>Media</th><th aria-label="Actions" /></tr>
            </thead>
            <tbody>
              {items.map(s => (
                <tr key={s.id}>
                  <td data-label="Title" className="cell-strong">{s.title}</td>
                  <td data-label="Speaker">{s.speaker || '—'}</td>
                  <td data-label="Date">{formatDate(s.sermon_date)}</td>
                  <td data-label="Media">
                    {s.youtube_id
                      ? <a href={`https://youtube.com/watch?v=${s.youtube_id}`} target="_blank" rel="noopener noreferrer">YouTube</a>
                      : s.file_path ? <a href={s.url} target="_blank" rel="noopener noreferrer">Audio</a>
                      : <span className="cell-muted">None</span>}
                  </td>
                  <td data-label="Actions" className="cell-actions-wrap">
                    <div className="cell-actions">
                      <button className="btn btn-danger" onClick={() => remove(s)}>Delete</button>
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
