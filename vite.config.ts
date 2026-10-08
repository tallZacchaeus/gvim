import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

/**
 * `npm run dev` serves only the React app — the API lives in Vercel Functions and
 * has no local equivalent. Proxying /api to the deployed site lets the UI render
 * real content while working on design.
 *
 * NOTE: this points at PRODUCTION. Reads are harmless, but an admin write performed
 * against the dev server will hit the live database. Set VITE_API_PROXY to a preview
 * deployment when working on anything that writes.
 */
const API_TARGET = process.env.VITE_API_PROXY || 'https://www.godsvesselinternationalministry.org';

/**
 * Opt-in fixtures for the admin-only endpoints, so the admin UI can be worked on
 * without real credentials. Enabled ONLY with ADMIN_MOCK=1 and ONLY under
 * `vite dev` (apply: 'serve'), so it can never reach a build or production.
 *
 *   ADMIN_MOCK=1 npm run dev
 */
function adminMock(): Plugin {
  const fixtures: Record<string, unknown> = {
    '/api/auth/me': { authenticated: true, username: 'preview' },
    '/api/stats': {
      gallery: 91, sermons: 2, contacts: 3, categories: 6,
      newsletter: 2, contactsLast7Days: 1, contactsLast30Days: 4, uploadsLast30Days: 12,
      byCategory: [
        { slug: 'fellowship', label: 'Fellowship', total: 68 },
        { slug: 'events', label: 'Events & Programs', total: 11 },
        { slug: 'worship', label: 'Worship Services', total: 9 },
        { slug: 'youth', label: 'Youth & Children', total: 3 },
        { slug: 'outreach', label: 'Outreach & Missions', total: 0 },
        { slug: 'special', label: 'Special Occasions', total: 0 }
      ]
    },
    '/api/contacts': [
      { id: 1, name: 'Grace Adeyemi', email: 'grace@example.com', phone: '+1 780 555 0101',
        subject: 'Prayer request', message: 'Please keep my family in your prayers this week.\n\nThank you.',
        newsletter: 1, ip_address: '', submitted_at: '2026-10-07 09:15:00' },
      { id: 2, name: 'Samuel Okoro', email: 'samuel@example.com', phone: '',
        subject: 'Volunteering for the youth service',
        message: 'I would love to help with the fifth Sunday youth service.',
        newsletter: 0, ip_address: '', submitted_at: '2026-10-02 18:40:00' },
      { id: 3, name: 'Ruth Mensah', email: 'ruth@example.com', phone: '',
        subject: 'Service times', message: 'Could you confirm the Bible study time?',
        newsletter: 1, ip_address: '', submitted_at: '2026-09-21 11:05:00' }
    ],
    '/api/sermons': [
      { id: 'a1', title: 'Walking in Divine Purpose', speaker: 'Rev. Godwin BB. Olutimi',
        sermon_date: '2026-09-28', scripture: 'Jeremiah 29:11', description: '',
        youtube_id: 'dQw4w9WgXcQ', file_path: '', duration: '42:10',
        created_at: '2026-09-28 12:00:00', url: '' },
      { id: 'a2', title: 'Vessels of Honour', speaker: 'Rev. Godwin BB. Olutimi',
        sermon_date: '2026-09-14', scripture: '2 Timothy 2:20', description: '',
        youtube_id: '', file_path: '', duration: '38:02',
        created_at: '2026-09-14 12:00:00', url: '' }
    ]
  };

  return {
    name: 'gvim-admin-mock',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url || '').split('?')[0];
        if (req.method === 'GET' && path in fixtures) {
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(fixtures[path]));
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(process.env.ADMIN_MOCK === '1' ? [adminMock()] : [])],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    /* Honour an assigned PORT so the dev server can start when 5173 is taken.
       5173 stays the default, because the R2 CORS allowlist contains
       http://localhost:5173 — uploads only work from that exact origin. */
    port: Number(process.env.PORT) || 5173,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true, secure: true }
    }
  },
  build: { outDir: 'dist', sourcemap: false }
});
