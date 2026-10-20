import { serve } from '@hono/node-server';
import { Hono } from 'hono';

import * as authLogin from '../api/auth/login.js';
import * as authLogout from '../api/auth/logout.js';
import * as authMe from '../api/auth/me.js';
import * as categories from '../api/categories/index.js';
import * as contact from '../api/contact.js';
import * as contacts from '../api/contacts.js';
import * as gallery from '../api/gallery/index.js';
import * as sermons from '../api/sermons/index.js';
import * as stats from '../api/stats.js';
import * as uploads from '../api/uploads/index.js';

/**
 * The API, served by Node instead of Vercel Functions.
 *
 * Every handler is `(Request) => Promise<Response>` — the Web-standard shape
 * Vercel used — so they mount unchanged. Hono hands us the same objects, which
 * is the whole reason this port is a routing table rather than a rewrite.
 *
 * nginx serves the built SPA and the media directly; this process only ever
 * sees /api. A crash therefore takes out the admin and the forms, not the
 * public site.
 */

type Handler = (request: Request) => Promise<Response>;
interface RouteModule {
  GET?: Handler | (() => Promise<Response>);
  POST?: Handler | (() => Promise<Response>);
  DELETE?: Handler | (() => Promise<Response>);
}

const app = new Hono();

/** Mount whichever verbs a module exports, and nothing else. */
function mount(path: string, mod: RouteModule): void {
  if (mod.GET)    app.get(path,    c => (mod.GET    as Handler)(c.req.raw));
  if (mod.POST)   app.post(path,   c => (mod.POST   as Handler)(c.req.raw));
  if (mod.DELETE) app.delete(path, c => (mod.DELETE as Handler)(c.req.raw));
}

mount('/api/auth/login',  authLogin);
mount('/api/auth/logout', authLogout);
mount('/api/auth/me',     authMe);
mount('/api/categories',  categories);
mount('/api/contact',     contact);
mount('/api/contacts',    contacts);
mount('/api/gallery',     gallery);
mount('/api/sermons',     sermons);
mount('/api/stats',       stats);
mount('/api/uploads',     uploads);

/* Readiness probe for the deploy script: it must not restart nginx onto a
   process that cannot reach its database. */
app.get('/api/health', async c => {
  try {
    const { db } = await import('../lib/db.js');
    await db().prepare('SELECT 1 AS ok').first();
    return c.json({ ok: true });
  } catch (err) {
    return c.json({ ok: false, error: (err as Error).message }, 503);
  }
});

/* Anything else under /api is a real 404 with a JSON body — the SPA fallback
   is nginx's job and must never swallow an unknown API route. */
app.all('/api/*', c => c.json({ error: 'Not found' }, 404));

const port = Number(process.env.PORT) || 3001;
const hostname = process.env.HOSTNAME || '127.0.0.1';

serve({ fetch: app.fetch, port, hostname }, info => {
  console.log(`[gvim] api listening on ${hostname}:${info.port}`);
});
