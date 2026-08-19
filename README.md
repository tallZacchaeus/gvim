# GVIM — God's Vessels International Ministry

React + TypeScript site for God's Vessels International Ministry (Edmonton, Alberta),
deployed on Vercel with Turso for data and Cloudflare R2 for media.

## Stack

- **Frontend** — Vite + React 18 + TypeScript + React Router v6
- **API** — Vercel Functions (Web-standard `Request`/`Response`), `api/`
- **Database** — Turso (libSQL / SQLite)
- **Storage** — Cloudflare R2 via its S3-compatible API
- **Auth** — HS256 JWT in an HttpOnly cookie

## Layout

```
api/        Vercel Functions — the whole API surface
lib/        db (Turso), r2 (storage), util (auth, helpers)
src/        React SPA — pages, components, styles
migrations/ SQLite schema (shared by Turso)
scripts/    migration, smoke tests, env + password tooling
```

## Setup

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run check:env
npm run dev
```

Generate the two secrets you can't write by hand:

```bash
node scripts/hash-password.mjs 'a-long-admin-password'
```

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck (app + API) and build |
| `npm run typecheck` | Both tsconfigs, no build |
| `npm run test:api` | Offline smoke test of every API handler |
| `npm run check:env` | Validate environment variables |
| `npm run db:migrate` | Apply schema and import data into Turso |

`npm run test:api` needs no credentials and touches no live service — it runs the
handlers against a throwaway libSQL file and an in-memory R2 stub.

## Uploads

Media never passes through the API. The browser asks `/api/uploads/presign` for a
signed URL, PUTs the file straight to R2, then posts only the key back. The file
crosses the network once instead of twice, no function is held open for the duration
of a large upload, and the browser gets real progress. Both buckets therefore need a
CORS rule — see `R2_UPLOAD_SETUP.md`.

## Documentation

- `TURSO_SETUP.md` — database setup and the D1 → Turso migration
- `R2_UPLOAD_SETUP.md` — R2 API token, CORS, and the upload flow
- `VERCEL_SETUP.md` — routing, environment variables, deployment

## History

This replaces two earlier implementations, both retired in favour of this one and
recoverable from git history:

- a PHP + MySQL site (Hostinger) at the repo root
- a Cloudflare Pages build using D1 bindings and R2 bindings

The 91 gallery images live in R2 and were not deleted by that retirement.
