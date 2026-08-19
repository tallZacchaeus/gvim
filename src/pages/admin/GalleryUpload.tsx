import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { api, uploadFiles, Category } from '../../lib/api';

export default function GalleryUpload() {
  const [cats, setCats] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [itemDate, setItemDate] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState<{type: 'success'|'error'; msg: string} | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => { api.categories.list().then(setCats).catch(() => {}); }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!files || files.length === 0) { setStatus({ type: 'error', msg: 'Select at least one file' }); return; }
    setBusy(true); setStatus(null); setProgress(0);
    try {
      // Files go straight from the browser to R2; only metadata hits our API.
      const uploaded = await uploadFiles('gallery', Array.from(files), {
        category,
        onProgress: setProgress
      });
      const r = await api.gallery.create({
        title, description, category,
        item_date: itemDate || undefined,
        files: uploaded
      });
      setStatus({ type: 'success', msg: `Uploaded ${r.count} file(s)` });
      setTitle(''); setDescription(''); setItemDate(''); setFiles(null);
      const input = document.getElementById('files-input') as HTMLInputElement | null;
      if (input) input.value = '';
    } catch (e: any) { setStatus({ type: 'error', msg: e.message || 'Upload failed' }); }
    finally { setBusy(false); setProgress(0); }
  }

  return (
    <AdminLayout title="Upload Gallery">
      <form onSubmit={onSubmit} className="admin-form">
        {status && <div className={`alert alert-${status.type}`}>{status.msg}</div>}
        <div className="form-group">
          <label>Title *</label>
          <input type="text" required value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Category *</label>
          <select required value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">-- choose --</option>
            {cats.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={itemDate} onChange={e => setItemDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Files (images or videos, max 50MB each) *</label>
          <input id="files-input" type="file" multiple accept="image/*,video/*" onChange={e => setFiles(e.target.files)} />
        </div>
        {busy && (
          <div className="upload-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
            <span className="upload-progress-label">{progress}%</span>
          </div>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? `Uploading… ${progress}%` : 'Upload'}</button>
      </form>
    </AdminLayout>
  );
}
