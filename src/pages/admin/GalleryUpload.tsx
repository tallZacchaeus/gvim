import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AdminLayout from '../../components/AdminLayout';
import { useFeedback } from '../../components/AdminFeedback';
import { api, uploadFiles, Category } from '../../lib/api';
import { galleryUploadSchema, type GalleryUploadValues } from '../../lib/schemas';
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

export default function GalleryUpload() {
  const { notify } = useFeedback();
  const [cats, setCats] = useState<Category[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [fileError, setFileError] = useState('');
  const [progress, setProgress] = useState(0);

  const form = useForm<GalleryUploadValues>({
    resolver: zodResolver(galleryUploadSchema),
    defaultValues: { title: '', description: '', category: '', item_date: '' },
    mode: 'onBlur'
  });

  useEffect(() => { api.categories.list().then(setCats).catch(() => {}); }, []);

  async function onSubmit(values: GalleryUploadValues) {
    if (!files || files.length === 0) {
      setFileError('Select at least one file');
      return;
    }
    setFileError('');
    setProgress(0);
    try {
      /* UNCHANGED upload path: presign -> browser PUTs straight to R2 -> commit
         metadata. File bytes never pass through the API. Only the surrounding
         form moved to react-hook-form. */
      const uploaded = await uploadFiles('gallery', Array.from(files), {
        category: values.category,
        onProgress: setProgress
      });
      const r = await api.gallery.create({
        title: values.title,
        description: values.description,
        category: values.category,
        item_date: values.item_date || undefined,
        files: uploaded
      });
      notify(`Uploaded ${r.count} file${r.count === 1 ? '' : 's'}`);
      form.reset({ title: '', description: '', category: '', item_date: '' });
      setFiles(null);
      const input = document.getElementById('files-input') as HTMLInputElement | null;
      if (input) input.value = '';
    } catch (e: any) {
      notify(e.message || 'Upload failed', 'error');
    } finally {
      setProgress(0);
    }
  }

  const busy = form.formState.isSubmitting;

  return (
    <AdminLayout title="Upload Gallery">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="admin-form">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl><Input {...field} placeholder="e.g. Christmas Outreach 2026" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea {...field} rows={3} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {cats.map(c => <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="item_date" render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl><Input {...field} type="date" /></FormControl>
              <FormDescription>When these photos were taken. Optional.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />

          {/* Not a react-hook-form field: a FileList cannot be controlled, so it
              keeps its own state and error. */}
          <div className="form-group">
            <Label htmlFor="files-input">Files</Label>
            <Input
              id="files-input" type="file" multiple accept="image/*,video/*"
              aria-describedby="files-hint"
              aria-invalid={fileError ? true : undefined}
              onChange={e => { setFiles(e.target.files); setFileError(''); }}
            />
            <p id="files-hint" className="form-hint">Images or video, up to 50 MB each.</p>
            {fileError && <p className="form-error" role="alert">{fileError}</p>}
          </div>

          {busy && files && (
            <div className="upload-progress" role="progressbar"
              aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
              <span className="upload-progress-label">{progress}%</span>
            </div>
          )}

          <Button type="submit" disabled={busy}>
            {busy ? `Uploading… ${progress}%` : 'Upload'}
          </Button>
        </form>
      </Form>
    </AdminLayout>
  );
}
