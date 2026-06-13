# GVIM — Cloudflare Pages + D1 + R2

React + TypeScript SPA for God's Vessels International Ministry, hosted on Cloudflare Pages with D1 (SQLite) and R2 (object storage). All Pages Functions provide the API.

## Stack

- Frontend: Vite + React 18 + TypeScript + React Router v6
- API: Cloudflare Pages Functions (TypeScript, Web Crypto)
- DB: Cloudflare D1 (SQLite)
- Storage: Cloudflare R2 (gallery + sermons buckets)
- Auth: Signed HS256 JWT in HttpOnly cookie

## Prerequisites

- Node.js 18+
- A Cloudflare account
- `npx wrangler login` (one-time)

## Setup

```bash
cd app
npm install
```

### Create D1 database

```bash
npx wrangler d1 create gvim-db
```

Copy the `database_id` it prints into `wrangler.toml` (replace `REPLACE_WITH_YOUR_D1_ID`).

Initialize schema:

```bash
npm run db:init:local    # for local dev
npm run db:init          # for production
```

### Create R2 buckets

```bash
npx wrangler r2 bucket create gvim-gallery
npx wrangler r2 bucket create gvim-sermons
```

Make each bucket publicly readable via a custom domain or public R2.dev URL, and put those base URLs into `wrangler.toml` under `[vars]`:

```toml
PUBLIC_GALLERY_BASE = "https://gallery.your-domain.com"
PUBLIC_SERMONS_BASE = "https://sermons.your-domain.com"
```

### Configure secrets

Generate an admin password hash (run once):

```bash
node -e "const crypto=require('crypto');const salt=crypto.randomBytes(8).toString('hex');const pwd='CHANGE_ME';const h=crypto.createHash('sha256').update(salt+pwd).digest('hex');console.log('sha256:'+salt+':'+h);"
```

Then set secrets (production):

```bash
npx wrangler pages secret put JWT_SECRET            # long random string
npx wrangler pages secret put ADMIN_USERNAME        # e.g. gvim-admin
npx wrangler pages secret put ADMIN_PASSWORD_HASH   # the sha256:salt:hash from above
```

For local dev, create `app/.dev.vars`:

```
JWT_SECRET=local-dev-secret-change-me
ADMIN_USERNAME=gvim-admin
ADMIN_PASSWORD_HASH=sha256:abcd1234:...
```

## Local development

```bash
npm run dev          # vite only (no API)
# in another terminal, or instead:
npx wrangler pages dev --d1=DB=gvim-db --r2=GALLERY_BUCKET=gvim-gallery --r2=SERMONS_BUCKET=gvim-sermons -- npm run dev
```

## Deploy

```bash
npm run pages:deploy
```

Or connect the GitHub repo to Cloudflare Pages and set the build command to `npm run build` and output dir to `dist`.

In the Pages project settings, bind:
- D1 binding `DB` → `gvim-db`
- R2 binding `GALLERY_BUCKET` → `gvim-gallery`
- R2 binding `SERMONS_BUCKET` → `gvim-sermons`
- Variables: `PUBLIC_GALLERY_BASE`, `PUBLIC_SERMONS_BASE`
- Secrets: `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`

## Routes

Public: `/`, `/about`, `/sermons`, `/gallery`, `/contact`
Admin: `/admin` (login), `/admin/dashboard`, `/admin/gallery-upload`, `/admin/gallery-manage`, `/admin/sermon-add`, `/admin/sermon-manage`, `/admin/categories`, `/admin/contacts`

API: `/api/auth/{login,logout,me}`, `/api/gallery`, `/api/gallery/:id`, `/api/sermons`, `/api/sermons/:id`, `/api/categories`, `/api/categories/:slug`, `/api/contact`, `/api/contacts`

## Notes

- Uploads max 50MB per file (Cloudflare Pages Functions request limit). For larger files use the R2 direct upload pattern.
- Sermon files (audio/video) and gallery files go to R2 and are served from the public bases configured above.
- Contact form: emails are not sent automatically. Submissions go to D1; you can wire MailChannels in `functions/api/contact.ts` if desired (free for Cloudflare).
