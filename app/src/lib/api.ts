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
    upload: (form: FormData) => http<{ ok: boolean; count: number }>('/api/gallery', { method: 'POST', body: form }),
    remove: (id: string) => http<{ ok: boolean }>(`/api/gallery/${id}`, { method: 'DELETE' })
  },
  sermons: {
    list: (limit?: number) => {
      const q = limit ? `?limit=${limit}` : '';
      return http<Sermon[]>(`/api/sermons${q}`);
    },
    add: (form: FormData) => http<{ ok: boolean; id: string }>('/api/sermons', { method: 'POST', body: form }),
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
  auth: {
    login: (username: string, password: string) => http<{ ok: boolean }>('/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password })
    }),
    logout: () => http<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
    me: () => http<{ authenticated: boolean; username?: string }>('/api/auth/me')
  }
};

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
