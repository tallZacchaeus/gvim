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
 * POST one file to our own API and resolve with the descriptor the commit
 * endpoints expect.
 *
 * XMLHttpRequest rather than fetch, because only XHR reports upload progress —
 * which matters when the connection is a phone on mobile data.
 *
 * This replaces a presigned cross-origin PUT to R2. Same-origin means no
 * preflight, no signature that can expire mid-batch, and — unlike R2's error
 * responses, which carry no CORS headers — a status the browser will actually
 * hand back when something fails.
 */
function postFile(
  kind: 'gallery' | 'sermons',
  file: File,
  category: string | undefined,
  onProgress?: (loaded: number) => void
): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append('kind', kind);
    if (category) body.append('category', category);
    body.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/uploads', true);
    xhr.withCredentials = true;
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress?.(e.loaded); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText) as { upload?: UploadedFile };
          if (!parsed.upload) throw new Error('missing upload descriptor');
          resolve(parsed.upload);
        } catch {
          reject(new Error(`Upload of ${file.name} returned an unreadable response`));
        }
        return;
      }
      /* Same origin, so the body is readable and can say what was wrong. */
      let detail = '';
      try { detail = (JSON.parse(xhr.responseText) as { error?: string }).error || ''; } catch { /* non-JSON */ }
      reject(new Error(detail || `Upload of ${file.name} failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error(
      `Upload of ${file.name} failed — the connection dropped.`
    ));
    xhr.onabort = () => reject(new Error(`Upload of ${file.name} was aborted`));
    xhr.send(body);
  });
}

/**
 * Upload every file, then hand back the descriptors the commit endpoints need.
 * Reports 0-100 across the whole batch.
 */
export async function uploadFiles(
  kind: 'gallery' | 'sermons',
  files: File[],
  opts: { category?: string; onProgress?: (percent: number) => void } = {}
): Promise<UploadedFile[]> {
  const total = files.reduce((sum, f) => sum + f.size, 0) || 1;
  const loaded = new Array(files.length).fill(0);
  const done = new Array<UploadedFile | null>(files.length).fill(null);
  const report = () => opts.onProgress?.(
    Math.min(100, Math.round((loaded.reduce((a, b) => a + b, 0) / total) * 100))
  );

  async function send(i: number): Promise<void> {
    const file = files[i];
    try {
      done[i] = await postFile(kind, file, opts.category, n => { loaded[i] = n; report(); });
    } catch (err) {
      /* One retry, for a dropped connection. There is no signature to refresh
         any more, so this is simply the same request again. A failed POST
         wrote nothing, so nothing is left behind to clean up. */
      if (err instanceof Error && /\(4\d\d\)|Unsupported|exceeds|Category|Unknown/.test(err.message)) {
        throw err;   /* the server rejected it on its merits; retrying cannot help */
      }
      loaded[i] = 0;
      report();
      done[i] = await postFile(kind, file, opts.category, n => { loaded[i] = n; report(); });
    }
    loaded[i] = file.size;
    report();
  }

  /* Four at a time: a phone uploading a large batch one file after another is
     needlessly slow, and starting all of them at once makes every transfer
     crawl on a single uplink. */
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

  return done.filter((u): u is UploadedFile => u !== null);
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
