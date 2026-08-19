# Step 1 — D1 → Turso migration

Everything here is on Turso's free tier. No card required.

## 1. Install the Turso CLI and sign up

```bash
brew install tursodatabase/tap/turso
turso auth signup
```

## 2. Create the database

```bash
turso db create gvim
turso db show gvim --url
turso db tokens create gvim
```

Keep the two values — the `libsql://…` URL and the token.

## 3. Put them in your shell

```bash
export TURSO_DATABASE_URL="libsql://gvim-<your-org>.turso.io"
export TURSO_AUTH_TOKEN="<token from step 2>"
```

These become Vercel environment variables later, in step 5 of the migration.

## 4. Export the live data out of D1

Wrangler must be logged in as the Cloudflare account that owns `gvim-db`:

```bash
npx wrangler login
npm run db:export
```

Writes `d1-export/*.json` — one file per table. Expect roughly 91 gallery rows and
6 categories, per `DEPLOYMENT_SUMMARY.txt`. The directory is gitignored: it contains
contact submissions with names, emails and IP addresses. Do not commit it.

## 5. Load it into Turso

```bash
npm run db:migrate
```

Applies the schema, imports every dump file, then prints a row-count comparison.
Safe to re-run — imports use `INSERT OR REPLACE`.

## Notes

- `migrations/0001_init.sql` is reused unchanged. libSQL is SQLite, so `AUTOINCREMENT`,
  `datetime('now')`, CHECK and FOREIGN KEY constraints all work as-is.
- The schema's six seeded default categories are **skipped** during migration: the D1
  dump is authoritative, and seeding would resurrect any category deleted in D1. For a
  fresh empty database with no dump, run `npm run db:schema -- --seed`.
- `lib/db.ts` mirrors D1's `prepare/bind/all/first/run` API, so the API handlers in
  step 2 only swap `ctx.env.DB` for `db()` — the SQL bodies stay untouched.

## Verify without touching Turso

libSQL accepts local file URLs, so the whole cycle can be rehearsed offline:

```bash
TURSO_DATABASE_URL="file:/tmp/gvim-test.db" npm run db:migrate
```
