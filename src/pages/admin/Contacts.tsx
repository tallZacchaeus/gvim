import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import AdminLayout from '../../components/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
import { useFeedback } from '../../components/AdminFeedback';
import { api, ContactSubmission } from '../../lib/api';
import { formatDateTime, timeAgo } from '../../lib/format';
import { Checkbox } from '@/components/ui/checkbox';

export default function Contacts() {
  const { confirm, notify } = useFeedback();
  const [items, setItems] = useState<ContactSubmission[] | null>(null);
  const [open, setOpen] = useState<ContactSubmission | null>(null);

  function load() { api.contacts.list().then(setItems).catch(() => setItems([])); }
  useEffect(load, []);

  async function removeMany(rows: ContactSubmission[], clear: () => void) {
    const ok = await confirm({
      title: rows.length === 1 ? 'Delete this message?' : `Delete ${rows.length} messages?`,
      message: rows.length === 1
        ? `The message from ${rows[0].name} will be permanently removed. This cannot be undone.`
        : 'These messages will be permanently removed. This cannot be undone.',
      confirmLabel: 'Delete', destructive: true
    });
    if (!ok) return;
    try {
      // Sequential, not Promise.all: the endpoint deletes one row per request and
      // a partial failure should stop rather than fire the rest blindly.
      for (const r of rows) await api.contacts.remove(r.id);
      notify(rows.length === 1 ? 'Message deleted' : `${rows.length} messages deleted`);
      clear(); load();
    } catch (e: any) { notify(e.message || 'Could not delete', 'error'); }
  }

  const columns = useMemo<ColumnDef<ContactSubmission, any>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all messages"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={v => row.toggleSelected(!!v)}
          aria-label={`Select message from ${row.original.name}`}
        />
      ),
      enableSorting: false
    },
    {
      accessorKey: 'submitted_at',
      header: 'Received',
      cell: ({ row }) => (
        <>
          <span className="cell-strong">{timeAgo(row.original.submitted_at)}</span><br />
          <span className="cell-muted">{formatDateTime(row.original.submitted_at)}</span>
        </>
      )
    },
    {
      accessorKey: 'name',
      header: 'From',
      cell: ({ row }) => (
        <>
          <span className="cell-strong">{row.original.name}</span><br />
          <a className="cell-muted" href={`mailto:${row.original.email}`}>{row.original.email}</a>
        </>
      )
    },
    { accessorKey: 'subject', header: 'Subject' },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="cell-actions">
          <button className="btn btn-outline" onClick={() => setOpen(row.original)}>Read</button>
          <button className="btn btn-danger" onClick={() => removeMany([row.original], () => {})}>Delete</button>
        </div>
      )
    }
  ], []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <AdminLayout title="Messages">
      {items === null ? (
        <div className="admin-table-wrap" style={{ padding: '0.75rem' }}>
          {[0, 1, 2, 3].map(i => <div key={i} className="admin-skeleton admin-skeleton-row" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-inbox" aria-hidden="true" />
          <h3>No messages yet</h3>
          <p>Messages sent through the contact form on your website will appear here.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={items}
          enableSelection
          searchPlaceholder="Search name, email or message…"
          emptyMessage="No messages match your search."
          toolbar={(selected, clear) => selected.length > 0 && (
            <div className="admin-bulk">
              <span>{selected.length} selected</span>
              <button className="btn btn-danger" onClick={() => removeMany(selected, clear)}>
                Delete selected
              </button>
            </div>
          )}
        />
      )}

      {open && (
        <div className="admin-dialog-backdrop"
          onMouseDown={e => { if (e.target === e.currentTarget) setOpen(null); }}>
          <div className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="msg-title">
            <h3 id="msg-title">{open.subject}</h3>
            <p className="admin-dialog-meta"><strong>From:</strong> {open.name} (<a href={`mailto:${open.email}`}>{open.email}</a>)</p>
            {open.phone && <p className="admin-dialog-meta"><strong>Phone:</strong> <a href={`tel:${open.phone}`}>{open.phone}</a></p>}
            <p className="admin-dialog-meta"><strong>Received:</strong> {formatDateTime(open.submitted_at)}</p>
            <p className="admin-dialog-meta"><strong>Newsletter:</strong> {open.newsletter ? 'Yes' : 'No'}</p>
            <div className="admin-dialog-body">{open.message}</div>
            <div className="admin-dialog-actions">
              <button className="btn btn-outline" onClick={() => setOpen(null)}>Close</button>
              <a className="btn btn-primary" href={`mailto:${open.email}?subject=Re: ${encodeURIComponent(open.subject)}`}>Reply</a>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
