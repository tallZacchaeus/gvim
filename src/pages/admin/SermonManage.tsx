import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
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

  const columns = useMemo<ColumnDef<Sermon, any>[]>(() => [
    { accessorKey: 'title', header: 'Title',
      cell: ({ row }) => <span className="cell-strong">{row.original.title}</span> },
    { accessorKey: 'speaker', header: 'Speaker',
      cell: ({ row }) => row.original.speaker || '—' },
    { accessorKey: 'sermon_date', header: 'Date',
      cell: ({ row }) => formatDate(row.original.sermon_date) },
    { id: 'media', header: 'Media', enableSorting: false,
      cell: ({ row }) => row.original.youtube_id
        ? <a href={`https://youtube.com/watch?v=${row.original.youtube_id}`} target="_blank" rel="noopener noreferrer">YouTube</a>
        : row.original.file_path
          ? <a href={row.original.url} target="_blank" rel="noopener noreferrer">Audio</a>
          : <span className="cell-muted">None</span> },
    { id: 'actions', header: 'Actions', enableSorting: false,
      cell: ({ row }) => (
        <div className="cell-actions">
          <button className="btn btn-danger" onClick={() => remove(row.original)}>Delete</button>
        </div>
      ) }
  ], []);

  return (
    <AdminLayout
      title="Sermons"
      actions={<Link to="/admin/sermon-add" className="btn btn-primary"><Plus size={16} /> Add</Link>}
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
        <DataTable columns={columns} data={items}
          searchPlaceholder="Search title or speaker…"
          emptyMessage="No sermons match your search." />
      )}
    </AdminLayout>
  );
}
