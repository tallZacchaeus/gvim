# Steps 3 & 5 — Routing and deployment

## Routing (`vercel.json`)

Vercel needs three things the Cloudflare setup handled differently:

| Concern | Cloudflare | Vercel |
|---|---|---|
| SPA fallback | `public/_redirects` | `rewrites` in `vercel.json` |
| API routes | `functions/` + `_redirects` | `api/` directory (automatic) |
| Security headers | `.htaccess` (PHP site) | `headers` in `vercel.json` |

The SPA rewrite is `/((?!api/).*)` — everything except `/api/*` falls through to
`index.html` so React Router can handle it. Static files under `dist/` are served
from the filesystem before rewrites apply, so hashed assets are unaffected.

`public/_redirects` was the Cloudflare Pages equivalent and has been removed along
with the rest of the Cloudflare deployment (step 6).

The security headers replicate what `.htaccess` gave the PHP site (nosniff,
SAMEORIGIN, referrer policy), plus a `Permissions-Policy` and `no-store` on `/api/*`.

## Environment variables

Twelve variables, all listed in `.env.example`. In the Vercel dashboard:
**Settings → Environment Variables**, applied to Production *and* Preview.

### Generate the secrets

```bash
node scripts/hash-password.mjs 'a-long-admin-password'
```

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The first prints `ADMIN_PASSWORD_HASH`; the second is `JWT_SECRET`. The admin
password itself is never stored — keep it in a password manager. Rotating
`JWT_SECRET` immediately logs out every admin session.

Turso values come from `TURSO_SETUP.md`, R2 values from `R2_UPLOAD_SETUP.md`.

### Check before deploying

```bash
npm run check:env
```

Locally, load `.env.local` first:

```bash
node --env-file=.env.local scripts/check-env.mjs
```

## Deploy

```bash
npx vercel --prod
```

The first run links the project. Set the environment variables before deploying,
or the first production build will come up with failing API routes.

## After the first deploy

1. Add the deployed origin to the R2 CORS policy on **both** buckets
   (`R2_UPLOAD_SETUP.md`) — uploads fail with an opaque error until you do.
2. Visit `/api/gallery` — it should return JSON with 91 items.
3. Log in at `/admin` and upload a photo larger than 4.5 MB. That single test
   exercises presign, direct-to-R2 upload, CORS, and the commit path at once.
4. Submit the contact form and confirm the row appears under `/admin/contacts`.

Only after all four pass should you retire the PHP site and the Cloudflare
deployment (step 6).

## Known limitations

- **Vercel's Hobby plan is non-commercial.** A `mailto:` Give button is defensible;
  real donation processing would require Pro.
- **`pub-*.r2.dev` is a development endpoint** that Cloudflare rate-limits. Fine at
  a small church site's traffic, but attach a custom bucket domain before relying on it.
- The public gallery and sermons endpoints are uncached (`no-store`). If traffic ever
  justifies it, they are safe to cache for a short period.
