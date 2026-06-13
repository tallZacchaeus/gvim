import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { api, ContactSubmission } from '../../lib/api';

export default function Contacts() {
  const [items, setItems] = useState<ContactSubmission[]>([]);
  const [open, setOpen] = useState<ContactSubmission | null>(null);

  function load() { api.contacts.list().then(setItems).catch(() => setItems([])); }
  useEffect(load, []);

  async function remove(id: number) {
    if (!confirm('Delete this message?')) return;
    await api.contacts.remove(id).catch(e => alert(e.message));
    load();
  }

  return (
    <AdminLayout title="Contact Messages">
      {items.length === 0 ? <p>No messages.</p> : (
        <table className="admin-table">
          <thead><tr><th>Date</th><th>Name</th><th>Email</th><th>Subject</th><th></th></tr></thead>
          <tbody>
            {items.map(c => (
              <tr key={c.id}>
                <td>{c.submitted_at}</td>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.subject}</td>
                <td>
                  <button className="btn btn-outline" onClick={() => setOpen(c)}>View</button>
                  <button className="btn btn-danger" onClick={() => remove(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {open && (
        <div className="modal open" onClick={e => { if (e.target === e.currentTarget) setOpen(null); }}>
          <div className="modal-content">
            <button className="close" onClick={() => setOpen(null)}>×</button>
            <h3>{open.subject}</h3>
            <p><strong>From:</strong> {open.name} &lt;{open.email}&gt;</p>
            {open.phone && <p><strong>Phone:</strong> {open.phone}</p>}
            <p><strong>Submitted:</strong> {open.submitted_at}</p>
            <p><strong>Newsletter:</strong> {open.newsletter ? 'Yes' : 'No'}</p>
            <hr />
            <p style={{ whiteSpace: 'pre-line' }}>{open.message}</p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
