import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AdminLayout from '../../components/AdminLayout';
import { useFeedback } from '../../components/AdminFeedback';
import { api, uploadFiles, UploadedFile } from '../../lib/api';
import { sermonSchema, type SermonValues } from '../../lib/schemas';
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function SermonAdd() {
  const { notify } = useFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const form = useForm<SermonValues>({
    resolver: zodResolver(sermonSchema),
    defaultValues: {
      title: '', speaker: 'Rev. Godwin BB. Olutimi', sermon_date: '',
      scripture: '', description: '', youtube_url: '', duration: ''
    },
    mode: 'onBlur'
  });

  async function onSubmit(values: SermonValues) {
    setProgress(0);
    try {
      /* UNCHANGED upload path: sermon media goes browser -> R2 directly via a
         presigned PUT, and only the key reaches our API. */
      let uploaded: UploadedFile | null = null;
      if (file) {
        const [f] = await uploadFiles('sermons', [file], { onProgress: setProgress });
        uploaded = f;
      }
      await api.sermons.add({
        ...values,
        sermon_date: values.sermon_date || undefined,
        file: uploaded
      });
      notify('Sermon added');
      form.reset();
      setFile(null);
      const f = document.getElementById('sermon-file') as HTMLInputElement | null;
      if (f) f.value = '';
    } catch (e: any) {
      notify(e.message || 'Could not add the sermon', 'error');
    } finally {
      setProgress(0);
    }
  }

  const busy = form.formState.isSubmitting;
  const text = (name: keyof SermonValues, label: string, placeholder?: string, hint?: string) => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl><Input {...field} placeholder={placeholder} /></FormControl>
        {hint && <FormDescription>{hint}</FormDescription>}
        <FormMessage />
      </FormItem>
    )} />
  );

  return (
    <AdminLayout title="Add Sermon">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="admin-form">
          {text('title', 'Title', 'e.g. Walking in Divine Purpose')}
          {text('speaker', 'Speaker')}

          <FormField control={form.control} name="sermon_date" render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl><Input {...field} type="date" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {text('scripture', 'Scripture', 'e.g. John 3:16')}

          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea {...field} rows={4} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {text('youtube_url', 'YouTube URL or ID', 'https://youtu.be/…',
                'Paste the full link or the 11-character video ID.')}
          {text('duration', 'Duration', 'e.g. 45:30')}

          <div className="form-group">
            <Label htmlFor="sermon-file">Audio or video file</Label>
            <Input id="sermon-file" type="file" accept="audio/*,video/*"
              aria-describedby="sermon-file-hint"
              onChange={e => setFile(e.target.files?.[0] || null)} />
            <p id="sermon-file-hint" className="form-hint">
              Optional, up to 50 MB. Leave empty if you are linking to YouTube.
            </p>
          </div>

          {busy && file && (
            <div className="upload-progress" role="progressbar"
              aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
              <span className="upload-progress-label">{progress}%</span>
            </div>
          )}

          <Button type="submit" disabled={busy}>
            {busy ? (file ? `Uploading… ${progress}%` : 'Saving…') : 'Save sermon'}
          </Button>
        </form>
      </Form>
    </AdminLayout>
  );
}
