#!/usr/bin/env node
/**
 * Offline smoke test for the Vercel Function handlers in ../api.
 *
 *   npm run test:api
 *
 * Bundles the TypeScript handlers, points them at a throwaway local libSQL file
 * and fake credentials, then calls them as real Request/Response pairs. Touches
 * no live service, so it is safe to run anytime. Storage-write paths (R2) are
 * excluded here — they need real credentials and are covered in step 4.
 */
import { createClient } from '@libsql/client';
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(ROOT);

const work = mkdtempSync(join(tmpdir(), 'gvim-smoke-'));
// Bundle inside the project so externals (@libsql/client) still resolve.
const OUT = join(ROOT, '.smoke-build');

// Fake, deterministic environment. sha256('s3cret').
process.env.TURSO_DATABASE_URL = `file:${join(work, 'smoke.db')}`;
process.env.JWT_SECRET = 'test-secret-key';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD_HASH =
  '2c9341ca4cf3d87b9e4eb905d6a3ec45b55c86b7bbd8ad2d9ab0a3e2b2b9b9c1';
process.env.PUBLIC_GALLERY_BASE = 'https://cdn.example.com';
process.env.PUBLIC_SERMONS_BASE = 'https://sermons.example.com';
// Consumed by the stubbed S3 client; no network calls are made.
/* Media now lands on disk rather than in R2, so the suite needs a throwaway
   media root. It lives under the same temp dir and is removed with it. */
process.env.MEDIA_ROOT = join(work, 'media');

// Recompute the hash so the fixture can never drift from the password.
{
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('s3cret'));
  process.env.ADMIN_PASSWORD_HASH =
    Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
}

execFileSync('npx', [
  'esbuild',
  'api/auth/login.ts', 'api/auth/me.ts', 'api/categories/index.ts',
  'api/gallery/index.ts', 'api/contact.ts', 'api/contacts.ts',
  'api/uploads/index.ts', 'api/sermons/index.ts',
  '--bundle', '--platform=node', '--format=esm',
  `--outdir=${OUT}`, '--out-extension:.js=.mjs',
  '--external:@libsql/client',
  // R2 is replaced by an in-memory bucket so the upload path is testable offline.
], { cwd: ROOT, stdio: 'pipe' });

// ── fixtures ──
const c = createClient({ url: process.env.TURSO_DATABASE_URL });
const ddl = readFileSync(join(ROOT,'migrations','0001_init.sql'),'utf8').split(/;\s*$/m).map(s=>s.trim()).filter(Boolean);
for (const s of ddl) await c.execute(s);
await c.execute("INSERT OR REPLACE INTO gallery (id,title,description,category,file_path,filename,type,item_date) VALUES ('aa11','Sunday Worship','','worship','gallery/worship/ws_001.jpeg','ws_001.jpeg','image','2026-05-01')");

const { GET: catsGET }      = await import(`file://${OUT}/categories/index.mjs`);
const { GET: galleryGET }   = await import(`file://${OUT}/gallery/index.mjs`);
const { POST: loginPOST }   = await import(`file://${OUT}/auth/login.mjs`);
const { GET: meGET }        = await import(`file://${OUT}/auth/me.mjs`);
const { POST: contactPOST } = await import(`file://${OUT}/contact.mjs`);
const { GET: contactsGET }  = await import(`file://${OUT}/contacts.mjs`);
const { POST: uploadPOST } = await import(`file://${OUT}/uploads/index.mjs`);
const { POST: galleryPOST } = await import(`file://${OUT}/gallery/index.mjs`);
const { POST: sermonPOST }  = await import(`file://${OUT}/sermons/index.mjs`);

let pass = 0, fail = 0;
const check = (label, cond, extra='') => {
  if (cond) { console.log(`  ✓ ${label}`); pass++; }
  else { console.log(`  ✘ ${label} ${extra}`); fail++; }
};
const req = (url, init) => new Request(url, init);

console.log('\nPublic reads');
let r = await catsGET();
let body = await r.json();
check('GET /api/categories -> 200, 6 seeded categories', r.status===200 && body.length===6, JSON.stringify(body).slice(0,80));

r = await galleryGET(req('https://x/api/gallery?category=worship&limit=10'));
body = await r.json();
check('GET /api/gallery filters by category', body.length===1 && body[0].id==='aa11');
check('GET /api/gallery builds public url from PUBLIC_GALLERY_BASE',
  body[0].url === 'https://cdn.example.com/gallery/worship/ws_001.jpeg', body[0]?.url);

console.log('\nAuth');
r = await loginPOST(req('https://x/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:'admin',password:'wrong'})}));
check('login rejects bad password -> 401', r.status===401);

r = await loginPOST(req('https://x/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:'admin',password:'s3cret'})}));
check('login accepts good password -> 200', r.status===200);
const setCookie = r.headers.get('set-cookie') || '';
check('login sets HttpOnly Secure cookie', /HttpOnly/.test(setCookie) && /Secure/.test(setCookie));
const token = setCookie.match(/gvim_admin=([^;]+)/)?.[1];

r = await meGET(req('https://x/api/auth/me',{headers:{Cookie:`gvim_admin=${token}`}}));
body = await r.json();
check('GET /api/auth/me with cookie -> authenticated', body.authenticated===true && body.username==='admin');

r = await meGET(req('https://x/api/auth/me'));
check('GET /api/auth/me without cookie -> 401', r.status===401);

r = await meGET(req('https://x/api/auth/me',{headers:{Cookie:'gvim_admin=tampered.payload.sig'}}));
check('forged token rejected', r.status===401);

console.log('\nGuard on protected routes');
r = await contactsGET(req('https://x/api/contacts'));
check('GET /api/contacts unauthenticated -> 401', r.status===401);

r = await contactsGET(req('https://x/api/contacts',{headers:{Cookie:`gvim_admin=${token}`}}));
check('GET /api/contacts authenticated -> 200', r.status===200);

console.log('\nContact form (public)');
r = await contactPOST(req('https://x/api/contact',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'A',email:'bad',subject:'S',message:'long enough message'})}));
check('rejects invalid email -> 400', r.status===400);

r = await contactPOST(req('https://x/api/contact',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'A',email:'a@b.co',subject:'S',message:'short'})}));
check('rejects short message -> 400', r.status===400);

r = await contactPOST(req('https://x/api/contact',{
  method:'POST',
  headers:{'content-type':'application/json','x-forwarded-for':'203.0.113.9, 70.41.3.18'},
  body:JSON.stringify({name:'Jane','email':'jane@example.com',subject:'Prayer',message:'Please pray for our family'})}));
check('accepts valid submission -> 200', r.status===200);
const row = await c.execute('SELECT * FROM contact_submissions ORDER BY id DESC LIMIT 1');
check('captures client IP from x-forwarded-for', row.rows[0].ip_address==='203.0.113.9', row.rows[0].ip_address);

r = await contactPOST(req('https://x/api/contact',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({website:'bot',name:'B',email:'b@b.co',subject:'S',message:'spam message here'})}));
const after = await c.execute('SELECT COUNT(*) AS n FROM contact_submissions');
check('honeypot silently drops bots', r.status===200 && Number(after.rows[0].n)===1);

console.log('\nUpload flow');
const auth = { Cookie: `gvim_admin=${token}`, 'content-type': 'application/json' };
/* Multipart requests must NOT carry an explicit content-type: the runtime has
   to set it, because only it knows the boundary. Passing the JSON auth headers
   here made formData() throw, and every upload assertion then "passed" against
   a parse error instead of the rule it claimed to test. */
const authCookie = { Cookie: `gvim_admin=${token}` };
/* Uploads are multipart now, one file per request: presigning went away with
   Vercel's 4.5 MB body cap, and the bytes come to our own origin instead. */
const upload = (fields, headers = authCookie) => {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) body.append(k, v);
  }
  return uploadPOST(req('https://x/api/uploads', { method: 'POST', headers, body }));
};
const filePart = (name, type, size) =>
  new File([new Uint8Array(size)], name, { type });

r = await upload({ kind:'gallery', category:'worship', file: filePart('a.jpg','image/jpeg',1024) }, {});
check('upload requires auth -> 401', r.status===401);

r = await upload({ kind:'gallery', category:'worship', file: filePart('big.jpg','image/jpeg',51*1024*1024) });
body = await r.json();
check('upload rejects >50MB -> 400', r.status===400 && /exceeds 50MB/.test(body.error||''), body.error);

r = await upload({ kind:'gallery', category:'nope', file: filePart('a.jpg','image/jpeg',100) });
body = await r.json();
check('upload rejects unknown category -> 400', r.status===400 && /Unknown category/.test(body.error||''), body.error);

r = await upload({ kind:'gallery', category:'worship', file: filePart('x.exe','application/x-msdownload',100) });
body = await r.json();
check('upload rejects non-media type -> 400', r.status===400 && /Unsupported type/.test(body.error||''), body.error);

// A 2 MB photo. The 4.5 MB ceiling that forced presigning is gone; nginx
// allows 56 MB and the API enforces the 50 MB per-file cap itself.
r = await upload({ kind:'gallery', category:'worship', file: filePart('big-photo.jpg','image/jpeg',2_000_000) });
body = await r.json();
const up = body.upload;
check('upload accepts a 2MB photo', r.status===200 && !!up);
check('upload generates a server-side key under the category',
  /^gallery\/worship\/[a-f0-9]{16}\.jpg$/.test(up?.key || ''), up?.key);

console.log('\nCommit');
const commit = (payload, headers = auth) =>
  galleryPOST(req('https://x/api/gallery', { method:'POST', headers, body: JSON.stringify(payload) }));

/* A well-formed key for a file that was never uploaded. Objects really land
   on disk now, so this can no longer reuse the uploaded key. */
r = await commit({ title:'T', category:'worship',
                   files:[{ key:'gallery/worship/0123456789abcdef.jpg', filename:'ghost.jpg', type:'image' }] });
check('commit without the file on disk -> 409 (no phantom rows)', r.status===409);

r = await commit({ title:'T', category:'worship', files:[{ key:'gallery/worship/../../etc/passwd', filename:'x', type:'image' }] });
check('commit rejects traversal-style key -> 400', r.status===400);

r = await commit({ title:'T', category:'worship', files:[{ key:'gallery/events/aaaaaaaaaaaaaaaa.jpg', filename:'x', type:'image' }] });
check('commit rejects key from a different category -> 400', r.status===400);

r = await commit({ title:'Big Photo', description:'d', category:'worship', item_date:'2026-06-01',
                   files:[{ key: up.key, filename:'big-photo.jpg', type:'image' }] });
body = await r.json();
check('commit after upload -> 200, row written', r.status===200 && body.count===1);

const saved = await c.execute('SELECT * FROM gallery WHERE title = ?', ['Big Photo']);
check('row stores the R2 key as file_path', saved.rows[0]?.file_path === up.key, saved.rows[0]?.file_path);

r = await galleryGET(req('https://x/api/gallery?category=worship'));
body = await r.json();
const fresh = body.find(i => i.title === 'Big Photo');
check('gallery GET returns a usable public url',
  fresh?.url === `https://cdn.example.com/${up.key}`, fresh?.url);

console.log('\nSermon upload');
r = await upload({ kind:'sermons', file: filePart('sermon.mp3','audio/mpeg',1_000_000) });
body = await r.json();
const sup = body.upload;
check('upload accepts sermon audio', r.status===200 && /^sermons\/[a-f0-9]{16}\.mp3$/.test(sup?.key||''), sup?.key);

/* Never-uploaded key: the real file is on disk now, so this cannot reuse it. */
r = await sermonPOST(req('https://x/api/sermons',{method:'POST',headers:auth,body:JSON.stringify({title:'S', file:{ key:'sermons/0123456789abcdef.mp3', filename:'ghost.mp3' }})}));
check('sermon commit without the file on disk -> 409', r.status===409);

r = await sermonPOST(req('https://x/api/sermons',{method:'POST',headers:auth,body:JSON.stringify({title:'Sunday Word', speaker:'Rev', youtube_url:'https://youtu.be/dQw4w9WgXcQ', file:{ key: sup.key, filename:'sermon.mp3' }})}));
check('sermon commit after upload -> 200', r.status===200);
const srow = await c.execute('SELECT * FROM sermons WHERE title = ?', ['Sunday Word']);
check('sermon stores youtube id and file path',
  srow.rows[0]?.youtube_id === 'dQw4w9WgXcQ' && srow.rows[0]?.file_path === sup.key);

console.log('\nContact notifications');
globalThis.__SENT = [];
const realFetch = globalThis.fetch;
let fetchMode = 'ok';
globalThis.fetch = async (url, init) => {
  if (String(url).includes('api.resend.com')) {
    globalThis.__SENT.push(JSON.parse(init.body));
    if (fetchMode === 'fail')    return new Response('rate limited', { status: 429 });
    if (fetchMode === 'timeout') { const e = new Error('timed out'); e.name = 'TimeoutError'; throw e; }
    if (fetchMode === 'throw')   throw new Error('network down');
    return new Response(JSON.stringify({ id: 'eml_1' }), { status: 200 });
  }
  return realFetch(url, init);
};

const submit = (over = {}) => contactPOST(req('https://x/api/contact', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ name: 'Ada', email: 'ada@example.com', subject: 'Visiting',
                         message: 'What time is the Sunday service?', ...over })
}));

// Unconfigured: the form must work and send nothing.
delete process.env.RESEND_API_KEY; delete process.env.CONTACT_NOTIFY_TO;
r = await submit();
check('unconfigured → submission still succeeds', r.status===200);
check('unconfigured → no email attempted', globalThis.__SENT.length===0);

// Configured and healthy.
process.env.RESEND_API_KEY='re_test_key'; process.env.CONTACT_NOTIFY_TO='church@example.com';
globalThis.__SENT.length=0; fetchMode='ok';
r = await submit({ subject:'Prayer', message:'Please pray for my family.' });
check('configured → submission succeeds', r.status===200);
check('configured → one email sent', globalThis.__SENT.length===1);
const sent = globalThis.__SENT[0] || {};
check('email goes to the configured recipient', JSON.stringify(sent.to)==='["church@example.com"]', JSON.stringify(sent.to));
check('reply_to is the enquirer, so Reply reaches them', sent.reply_to==='ada@example.com', sent.reply_to);
check('subject carries the enquiry subject', (sent.subject||'').includes('Prayer'), sent.subject);
check('body contains the message', (sent.text||'').includes('Please pray for my family.'));

// HTML injection in the message must not become live markup.
globalThis.__SENT.length=0;
r = await submit({ message: 'Hello <img src=x onerror=alert(1)> world, please reply.' });
const esc = globalThis.__SENT[0] || {};
check('message HTML is escaped in the email body',
  !(esc.html||'').includes('<img src=x') && (esc.html||'').includes('&lt;img'), 'unescaped markup in html');

// Provider failures must never fail the submission.
for (const [mode,label] of [['fail','provider 4xx'],['timeout','provider timeout'],['throw','network error']]) {
  fetchMode = mode; globalThis.__SENT.length = 0;
  r = await submit();
  check(label+' → submission still returns 200', r.status===200);
}

// And the row is still written in every one of those cases.
const rows = await c.execute('SELECT COUNT(*) AS n FROM contact_submissions');
check('every submission persisted regardless of email outcome', Number(rows.rows[0].n) >= 7, 'rows='+rows.rows[0].n);

globalThis.fetch = realFetch;

console.log(`\n${fail===0 ? '✓ ALL PASS' : '✘ FAILURES'} — ${pass} passed, ${fail} failed`);
rmSync(work, { recursive: true, force: true });
rmSync(OUT, { recursive: true, force: true });
process.exit(fail===0?0:1);
