export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  category: string;
  file_path: string;
  filename: string;
  type: 'image' | 'video';
  item_date: string | null;
  created_at: string;
  url: string;
}

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  sermon_date: string | null;
  scripture: string;
  description: string;
  youtube_id: string;
  file_path: string;
  duration: string;
  created_at: string;
  url: string;
}

export interface Category { slug: string; label: string; }

export interface AdminStats {
  gallery: number;
  sermons: number;
  contacts: number;
  categories: number;
  newsletter: number;
  contactsLast7Days: number;
  contactsLast30Days: number;
  uploadsLast30Days: number;
  byCategory: { slug: string; label: string; total: number }[];
}

export interface PresignedUpload {
  key: string;
  url: string;
  filename: string;
  contentType: string;
  type: 'image' | 'video' | 'audio';
}

/** What the commit endpoints (POST /api/gallery, /api/sermons) expect back. */
export interface UploadedFile {
  key: string;
  filename: string;
  type: 'image' | 'video' | 'audio';
}

export interface ContactSubmission {
  id: number; name: string; email: string; phone: string;
  subject: string; message: string; newsletter: number;
  ip_address: string; submitted_at: string;
}

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin', ...init });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as any).error || 'Request failed');
  }
  return res.json() as Promise<T>;
}

export const api = {
  gallery: {
    list: (category?: string, limit?: number) => {
      const q = new URLSearchParams();
      if (category) q.set('category', category);
      if (limit) q.set('limit', String(limit));
      return http<GalleryItem[]>(`/api/gallery?${q.toString()}`);
    },
    create: (data: {
      title: string; description?: string; category: string;
      item_date?: string; files: UploadedFile[];
    }) => http<{ ok: boolean; count: number }>('/api/gallery', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data)
    }),
    remove: (id: string) => http<{ ok: boolean }>(`/api/gallery?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
  sermons: {
    list: (limit?: number) => {
      const q = limit ? `?limit=${limit}` : '';
      return http<Sermon[]>(`/api/sermons${q}`);
    },
    add: (data: {
      title: string; speaker?: string; sermon_date?: string; scripture?: string;
      description?: string; youtube_url?: string; duration?: string;
      file?: UploadedFile | null;
    }) => http<{ ok: boolean; id: string }>('/api/sermons', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data)
    }),
    remove: (id: string) => http<{ ok: boolean }>(`/api/sermons?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
  categories: {
    list: () => http<Category[]>('/api/categories'),
    add: (slug: string, label: string) => http<{ ok: boolean }>('/api/categories', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, label })
    }),
    remove: (slug: string) => http<{ ok: boolean }>(`/api/categories?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' })
  },
  contact: {
    send: (data: Record<string, any>) => http<{ ok: boolean }>('/api/contact', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data)
    })
  },
  contacts: {
    list: () => http<ContactSubmission[]>('/api/contacts'),
    remove: (id: number) => http<{ ok: boolean }>(`/api/contacts?id=${id}`, { method: 'DELETE' })
  },
  stats: {
    get: () => http<AdminStats>('/api/stats')
  },
  uploads: {
    presign: (kind: 'gallery' | 'sermons', files: File[], category?: string) =>
      http<{ ok: boolean; uploads: PresignedUpload[] }>('/api/uploads/presign', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind,
          category,
          files: files.map(f => ({ name: f.name, type: f.type, size: f.size }))
        })
      })
  },
  auth: {
    login: (username: string, password: string) => http<{ ok: boolean }>('/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password })
    }),
    logout: () => http<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
    me: () => http<{ authenticated: boolean; username?: string }>('/api/auth/me')
  }
};

/**
 * PUT one file straight to R2 using a presigned URL.
 *
 * Uses XMLHttpRequest rather than fetch because only XHR reports upload
 * progress, which matters for large sermon media. The request must carry the
 * exact Content-Type the URL was signed with, and must not send cookies.
 */
function putToStorage(
  upload: PresignedUpload,
  file: File,
  onProgress?: (loaded: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', upload.url, true);
    xhr.setRequestHeader('Content-Type', upload.contentType);
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress?.(e.loaded); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload of ${file.name} failed (${xhr.status})`));
    };
    /* The browser gives no status here. R2's error responses (an expired
       signature, for instance) carry no Access-Control-Allow-Origin header, so
       the response is withheld from JavaScript and this fires instead. Do not
       name CORS as the cause — the preflight has already succeeded by this
       point, so CORS is the one thing that is demonstrably working. */
    xhr.onerror = () => reject(new Error(
      `Upload of ${file.name} failed — the connection dropped or the upload link expired.`
    ));
    xhr.onabort = () => reject(new Error(`Upload of ${file.name} was aborted`));
    xhr.send(file);
  });
}

/**
 * Full upload flow: ask the API to sign each file, PUT them all to R2, and
 * return the descriptors the commit endpoints need. Reports 0-100 overall.
 */
export async function uploadFiles(
  kind: 'gallery' | 'sermons',
  files: File[],
  opts: { category?: string; onProgress?: (percent: number) => void } = {}
): Promise<UploadedFile[]> {
  const { uploads } = await api.uploads.presign(kind, files, opts.category);
  if (uploads.length !== files.length) throw new Error('Storage did not sign every file');

  const total = files.reduce((sum, f) => sum + f.size, 0) || 1;
  const loaded = new Array(files.length).fill(0);
  const report = () => opts.onProgress?.(
    Math.min(100, Math.round((loaded.reduce((a, b) => a + b, 0) / total) * 100))
  );

  /* Signed URLs are issued for the whole batch at once, so the clock starts on
     every one of them before the first byte moves. Two things protect the tail
     of a long batch: uploading several at a time, and re-signing a file that
     fails rather than giving up on it. */
  const signed = [...uploads];

  async function send(i: number): Promise<void> {
    const file = files[i];
    try {
      await putToStorage(signed[i], file, n => { loaded[i] = n; report(); });
    } catch {
      /* Re-sign this one file and try once more. A failure here wrote nothing,
         so the discarded key leaves no orphan object behind. */
      loaded[i] = 0;
      report();
      const again = await api.uploads.presign(kind, [file], opts.category);
      const fresh = again.uploads[0];
      if (!fresh) throw new Error(`Could not get a new upload link for ${file.name}`);
      signed[i] = fresh;
      await putToStorage(fresh, file, n => { loaded[i] = n; report(); });
    }
    loaded[i] = file.size;
    report();
  }

  /* Four at a time. Sequential uploads of a large batch on a phone can take
     longer than the signature is valid; saturating the uplink with all of them
     at once is just as bad, because every transfer then crawls. */
  const CONCURRENCY = 4;
  let next = 0;
  const failures: string[] = [];

  /* Each worker swallows its own failure and keeps going. Letting one rejection
     escape would reject Promise.all while three transfers are still in flight,
     and their later rejections would surface as unhandled. */
  const workers = Array.from(
    { length: Math.min(CONCURRENCY, files.length) },
    async () => {
      for (let i = next++; i < files.length; i = next++) {
        try {
          await send(i);
        } catch (err) {
          failures.push(err instanceof Error ? err.message : `Upload of ${files[i].name} failed`);
        }
      }
    }
  );
  await Promise.all(workers);

  if (failures.length > 0) {
    throw new Error(
      failures.length === 1
        ? failures[0]
        : `${failures.length} of ${files.length} files failed to upload. ${failures[0]}`
    );
  }

  return signed.map(u => ({ key: u.key, filename: u.filename, type: u.type }));
}

export const SITE = {
  name: "God's Vessels International Ministry",
  short: 'GVIM',
  email: 'godvesselsinternational@gmail.com',
  phone: '+1 (825) 202-7450',
  address: '4511, 36 Ave NW, Edmonton, T6L 3R9, Alberta, Canada',
  facebook: 'https://facebook.com/GVIMM',
  youtube: 'https://youtube.com/@godsvesselsinternationalmi4365',
  zoom: '5723669101'
};
