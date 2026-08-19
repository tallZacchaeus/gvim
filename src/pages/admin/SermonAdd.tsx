import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { api, uploadFiles, UploadedFile } from '../../lib/api';

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
  const [progress, setProgress] = useState(0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setStatus(null); setProgress(0);
    try {
      // Sermon media is large, so it goes browser -> R2 directly and only the
      // key is sent to our API. Keeps the request small and shows real progress.
      let uploaded: UploadedFile | null = null;
      if (file) {
        const [f] = await uploadFiles('sermons', [file], { onProgress: setProgress });
        uploaded = f;
      }
      await api.sermons.add({
        title, speaker, scripture, description, youtube_url, duration,
        sermon_date: sermon_date || undefined,
        file: uploaded
      });
      setStatus({ type: 'success', msg: 'Sermon added' });
      setTitle(''); setSermonReset();
    } catch (e: any) { setStatus({ type: 'error', msg: e.message || 'Failed' }); }
    finally { setBusy(false); setProgress(0); }
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
        {busy && file && (
          <div className="upload-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
            <span className="upload-progress-label">{progress}%</span>
          </div>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? (file ? `Uploading… ${progress}%` : 'Saving…') : 'Save Sermon'}</button>
      </form>
    </AdminLayout>
  );
}
