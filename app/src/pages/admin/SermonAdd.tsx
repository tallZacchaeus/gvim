import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { api } from '../../lib/api';

export default function SermonAdd() {
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('Rev. Godwin BB. Olutimi');
  const [sermon_date, setDate] = useState('');
  const [scripture, setScripture] = useState('');
  const [description, setDescription] = useState('');
  const [youtube_url, setYoutube] = useState('');
  const [duration, setDuration] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{type:'success'|'error'; msg:string} | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setStatus(null);
    const form = new FormData();
    form.set('title', title);
    form.set('speaker', speaker);
    if (sermon_date) form.set('sermon_date', sermon_date);
    form.set('scripture', scripture);
    form.set('description', description);
    form.set('youtube_url', youtube_url);
    form.set('duration', duration);
    if (file) form.set('file', file);
    try {
      await api.sermons.add(form);
      setStatus({ type: 'success', msg: 'Sermon added' });
      setTitle(''); setSermonReset();
    } catch (e: any) { setStatus({ type: 'error', msg: e.message || 'Failed' }); }
    finally { setBusy(false); }
  }

  function setSermonReset() {
    setScripture(''); setDescription(''); setYoutube(''); setDuration(''); setDate(''); setFile(null);
    const f = document.getElementById('sermon-file') as HTMLInputElement | null;
    if (f) f.value = '';
  }

  return (
    <AdminLayout title="Add Sermon">
      <form onSubmit={onSubmit} className="admin-form">
        {status && <div className={`alert alert-${status.type}`}>{status.msg}</div>}
        <div className="form-group"><label>Title *</label><input required value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div className="form-group"><label>Speaker</label><input value={speaker} onChange={e => setSpeaker(e.target.value)} /></div>
        <div className="form-group"><label>Date</label><input type="date" value={sermon_date} onChange={e => setDate(e.target.value)} /></div>
        <div className="form-group"><label>Scripture</label><input value={scripture} onChange={e => setScripture(e.target.value)} placeholder="e.g. John 3:16" /></div>
        <div className="form-group"><label>Description</label><textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} /></div>
        <div className="form-group"><label>YouTube URL or ID</label><input value={youtube_url} onChange={e => setYoutube(e.target.value)} /></div>
        <div className="form-group"><label>Duration</label><input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 45:30" /></div>
        <div className="form-group"><label>Audio/Video File (optional, max 50MB)</label><input id="sermon-file" type="file" accept="audio/*,video/*" onChange={e => setFile(e.target.files?.[0] || null)} /></div>
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Sermon'}</button>
      </form>
    </AdminLayout>
  );
}
