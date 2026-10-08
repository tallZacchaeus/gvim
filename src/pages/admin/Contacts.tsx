import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useFeedback } from '../../components/AdminFeedback';
import { api, ContactSubmission } from '../../lib/api';
import { formatDateTime, timeAgo } from '../../lib/format';

export default function Contacts() {
  const { confirm, notify } = useFeedback();
  const [items, setItems] = useState<ContactSubmission[] | null>(null);
  const [open, setOpen] = useState<ContactSubmission | null>(null);
  const [q, setQ] = useState('');

  function load() {
    api.contacts.list().then(setItems).catch(() => setItems([]));
  }
  useEffect(load, []);

  async function remove(c: ContactSubmission) {
    const ok = await confirm({
      title: 'Delete this message?',
      message: `The message from ${c.name} will be permanently removed. This cannot be undone.`,
      confirmLabel: 'Delete', destructive: true
    });
    if (!ok) return;
    try { await api.contacts.remove(c.id); notify('Message deleted'); load(); }
    catch (e: any) { notify(e.message || 'Could not delete', 'error'); }
  }

  const term = q.trim().toLowerCase();
  const visible = (items || []).filter(c =>
    !term ||
    [c.name, c.email, c.subject, c.message].some(v => (v || '').toLowerCase().includes(term))
  );

  // Escape closes the reader.
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
        <>
          <div className="admin-toolbar">
            <input
              className="admin-search"
              type="search"
              placeholder="Search name, email or message…"
              value={q}
              onChange={e => setQ(e.target.value)}
              aria-label="Search messages"
            />
            <span className="admin-count">
              {visible.length} of {items.length}
            </span>
          </div>

          {visible.length === 0 ? (
            <div className="admin-empty">
              <i className="fas fa-magnifying-glass" aria-hidden="true" />
              <h3>No matches</h3>
              <p>Nothing matches “{q}”. Try a different search.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Received</th><th>From</th><th>Subject</th><th aria-label="Actions" /></tr>
                </thead>
                <tbody>
                  {visible.map(c => (
                    <tr key={c.id}>
                      <td data-label="Received">
                        <span className="cell-strong">{timeAgo(c.submitted_at)}</span>
                        <br />
                        <span className="cell-muted">{formatDateTime(c.submitted_at)}</span>
                      </td>
                      <td data-label="From">
                        <span className="cell-strong">{c.name}</span>
                        <br />
                        <a className="cell-muted" href={`mailto:${c.email}`}>{c.email}</a>
                      </td>
                      <td data-label="Subject">{c.subject}</td>
                      <td data-label="Actions" className="cell-actions-wrap">
                        <div className="cell-actions">
                          <button className="btn btn-outline" onClick={() => setOpen(c)}>Read</button>
                          <button className="btn btn-danger" onClick={() => remove(c)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Previously used .modal-content, which had no CSS rule anywhere — the
          message rendered as unstyled text over a near-black overlay. */}
      {open && (
        <div
          className="admin-dialog-backdrop"
          onMouseDown={e => { if (e.target === e.currentTarget) setOpen(null); }}
        >
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
