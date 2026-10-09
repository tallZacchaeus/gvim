import type { GalleryItem } from '../lib/api';

/* ---------------------------------------------------------------------------
   Hero image.
   Served from public/img rather than the R2 public bucket: this is the LCP
   image, and the r2.dev domain is rate-limited and costs an extra DNS + TLS
   handshake. Derivatives were generated from gallery/community/IMG_1332.jpg,
   chosen because it shows no children's faces.
--------------------------------------------------------------------------- */
export const hero = {
  src: '/img/hero-team-1280.jpg',
  srcSet:
    '/img/hero-team-800.webp 800w, ' +
    '/img/hero-team-1280.webp 1280w, ' +
    '/img/hero-team-1920.webp 1920w',
  sizes: '100vw',
  width: 1920,
  height: 1080,
  /* Describes what is actually in the frame. Not decorative: it carries meaning. */
  alt: 'Volunteers and partners of God\u2019s Vessels International Ministry standing together outside after a community outreach'
};

/* ---------------------------------------------------------------------------
   Category display names. The filter bar renders only categories the API
   actually returns, so adding a key here that has no photos changes nothing.
--------------------------------------------------------------------------- */
export const categoryLabels: Record<string, string> = {
  events: 'Events & Programs',
  fellowship: 'Outreach & Fellowship',
  worship: 'Worship Services',
  youth: 'Youth & Children'
};

export function categoryLabel(slug: string, fallback?: string): string {
  return categoryLabels[slug] ?? fallback ?? slug;
}

/* ---------------------------------------------------------------------------
   Captions.
   Most records were imported with titles derived from the camera filename
   ("IMG 1215", "ws 010"). Showing those is worse than showing nothing, so they
   are suppressed. Real titles typed into the admin appear automatically,
   because they will not match this pattern.
--------------------------------------------------------------------------- */
const FILENAME_TITLE = /^(img|dsc|dscn|pxl|ws|gallery[\s_-]?img|christmas|youth)[\s_-]*\d*$/i;

export function isFilenameTitle(title: string | null | undefined): boolean {
  return !title || FILENAME_TITLE.test(title.trim());
}

/** The caption to display, or null when there is nothing worth showing. */
export function captionFor(item: Pick<GalleryItem, 'title' | 'filename'>): string | null {
  const curated = captions[basename(item.filename)];
  if (curated) return curated;
  return isFilenameTitle(item.title) ? null : item.title;
}

function basename(path: string): string {
  return (path || '').split('/').pop() || '';
}

/* Captions written against the actual photographs. Only describe what is
   visible in the frame — do not add claims the picture does not show. */
export const captions: Record<string, string> = {
  'IMG_1315.jpg': 'Children with new school bags at a back-to-school outreach',
  'IMG_1313.jpg': 'Pupils lined up with their new school bags',
  'IMG_1318.jpg': 'Volunteers and pupils at the school bag handover',
  'IMG_1220.jpg': 'A volunteer hands school supplies to a pupil',
  'IMG_1332.jpg': 'Volunteers and partners after the outreach',
  'christmas_01.jpg': 'Christmas gift bags shared with the community',
  'christmas_06.jpg': 'Delivering a Christmas hamper',
  'ws_008.jpeg': 'Meeting neighbours at a community outreach table'
};

/* ---------------------------------------------------------------------------
   The six photographs on the home page, in order.
   Chosen for variety across the two outreaches rather than six frames of the
   same moment. Matched by filename so re-ordering the API response cannot
   change what the home page shows.
--------------------------------------------------------------------------- */
export const featuredFilenames = [
  'IMG_1315.jpg',
  'christmas_01.jpg',
  'IMG_1220.jpg',
  'ws_008.jpeg',
  'christmas_06.jpg',
  'IMG_1318.jpg'
];

/** Pick the curated six out of a gallery response, falling back to whatever
 *  exists so the section never renders empty after a content change. */
export function pickFeatured(items: GalleryItem[], count = 6): GalleryItem[] {
  const byName = new Map(items.map(i => [basename(i.filename), i]));
  const curated = featuredFilenames
    .map(f => byName.get(f))
    .filter((i): i is GalleryItem => Boolean(i));
  if (curated.length >= count) return curated.slice(0, count);
  const rest = items.filter(i => i.type === 'image' && !curated.includes(i));
  return [...curated, ...rest].slice(0, count);
}
