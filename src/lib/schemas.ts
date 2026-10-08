import { z } from 'zod';

/**
 * Form schemas.
 *
 * These mirror the validation the API performs in api/*.ts. They exist to give
 * immediate, field-level feedback — not to replace the server checks. The API
 * must keep validating independently: a client is not a trust boundary.
 */

export const categorySchema = z.object({
  label: z.string().trim().min(2, 'Give the category a name of at least 2 characters'),
  slug: z.string().trim()
    .min(1, 'A slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers and hyphens only — for example “worship-services”')
});
export type CategoryValues = z.infer<typeof categorySchema>;

/** Mirrors api/gallery/index.ts: title and category required, files non-empty. */
export const galleryUploadSchema = z.object({
  title: z.string().trim().min(2, 'Give these photos a title'),
  description: z.string().trim().optional(),
  category: z.string().min(1, 'Choose a category'),
  item_date: z.string().optional()
});
export type GalleryUploadValues = z.infer<typeof galleryUploadSchema>;

/** Mirrors api/sermons/index.ts: only the title is required. */
export const sermonSchema = z.object({
  title: z.string().trim().min(2, 'Give the sermon a title'),
  speaker: z.string().trim().optional(),
  sermon_date: z.string().optional(),
  scripture: z.string().trim().optional(),
  description: z.string().trim().optional(),
  youtube_url: z.string().trim().optional()
    .refine(v => !v || /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)[A-Za-z0-9_-]{11}|^[A-Za-z0-9_-]{11}$/.test(v),
      'Paste a YouTube link or an 11-character video ID'),
  duration: z.string().trim().optional()
});
export type SermonValues = z.infer<typeof sermonSchema>;
