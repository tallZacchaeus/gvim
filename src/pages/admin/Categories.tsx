import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import AdminLayout from '../../components/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
import { useFeedback } from '../../components/AdminFeedback';
import { api, Category } from '../../lib/api';
import { categorySchema, type CategoryValues } from '../../lib/schemas';
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Categories() {
  const { confirm, notify } = useFeedback();
  const [cats, setCats] = useState<Category[] | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const form = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { label: '', slug: '' },
    mode: 'onBlur'
  });

  function load() { api.categories.list().then(setCats).catch(() => setCats([])); }
  useEffect(load, []);

  /* The slug is derived from the name as it is typed, until the user edits the
     slug themselves. Typing both by hand let them drift apart and made it easy
     to submit a slug the API would reject. */
  function onLabelChange(v: string) {
    form.setValue('label', v, { shouldValidate: true });
    if (!slugTouched) {
      form.setValue('slug', v.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        { shouldValidate: true });
    }
  }

  async function onSubmit(values: CategoryValues) {
    try {
      await api.categories.add(values.slug, values.label);
      notify(`Category “${values.label}” added`);
      form.reset({ label: '', slug: '' });
      setSlugTouched(false);
      load();
    } catch (e: any) {
      notify(e.message || 'Could not add category', 'error');
    }
  }

  async function remove(c: Category) {
    const ok = await confirm({
      title: `Delete “${c.label}”?`,
      message: 'Categories still used by photos cannot be deleted.',
      confirmLabel: 'Delete', destructive: true
    });
    if (!ok) return;
    try { await api.categories.remove(c.slug); notify('Category deleted'); load(); }
    catch (e: any) { notify(e.message || 'Could not delete', 'error'); }
  }

  const columns = useMemo<ColumnDef<Category, any>[]>(() => [
    { accessorKey: 'label', header: 'Name',
      cell: ({ row }) => <span className="cell-strong">{row.original.label}</span> },
    { accessorKey: 'slug', header: 'Slug',
      cell: ({ row }) => <span className="cell-muted">{row.original.slug}</span> },
    { id: 'actions', header: 'Actions', enableSorting: false,
      cell: ({ row }) => (
        <div className="cell-actions">
          <button className="btn btn-danger" onClick={() => remove(row.original)}>Delete</button>
        </div>
      ) }
  ], []);

  return (
    <AdminLayout title="Categories">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="admin-form">
          <FormField control={form.control} name="label" render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Worship Services"
                  onChange={e => onLabelChange(e.target.value)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="slug" render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. worship-services"
                  onChange={e => { field.onChange(e); setSlugTouched(true); }} />
              </FormControl>
              <FormDescription>
                Used in the web address. Filled in automatically — edit if you need to.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )} />

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Adding…' : 'Add category'}
          </Button>
        </form>
      </Form>

      <h2 className="admin-section-title">Existing categories</h2>
      {cats === null ? (
        <div className="admin-table-wrap" style={{ padding: '0.75rem' }}>
          {[0, 1, 2].map(i => <div key={i} className="admin-skeleton admin-skeleton-row" />)}
        </div>
      ) : cats.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-tags" aria-hidden="true" />
          <h3>No categories</h3>
          <p>Add one above so photos can be grouped on the gallery page.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={cats} emptyMessage="No categories match." />
      )}
    </AdminLayout>
  );
}
