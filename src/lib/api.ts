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
    remove: (id: string) => http<{ ok: boolean }>(`/api/gallery/${id}`, { method: 'DELETE' })
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
    remove: (id: string) => http<{ ok: boolean }>(`/api/sermons/${id}`, { method: 'DELETE' })
  },
  categories: {
    list: () => http<Category[]>('/api/categories'),
    add: (slug: string, label: string) => http<{ ok: boolean }>('/api/categories', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, label })
    }),
    remove: (slug: string) => http<{ ok: boolean }>(`/api/categories/${slug}`, { method: 'DELETE' })
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
    xhr.onerror = () => reject(new Error(
      `Upload of ${file.name} failed — check the R2 bucket's CORS rules allow PUT from this site.`
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

  for (let i = 0; i < uploads.length; i++) {
    await putToStorage(uploads[i], files[i], n => { loaded[i] = n; report(); });
    loaded[i] = files[i].size;
    report();
  }

  return uploads.map(u => ({ key: u.key, filename: u.filename, type: u.type }));
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
