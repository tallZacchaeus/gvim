# 10 — VPS migration

Move the whole stack off Vercel + Turso + R2 onto the VPS that already hosts
Cheers Global. Decision taken 2026-10-20: **the VPS handles everything** —
app, database and photographs.

## Target host

`72.62.237.128` (`clint`), Ubuntu 24.04, 2 cores, 7.8 GB RAM, 90 GB free.
Reached with `~/.ssh/gmc_vps_admin`. Node v22.23.3 is installed and matches
this project's `engines: "22.x"`.

Only `cheersglobal` is configured there today — there is no gmc site and no
running containers, so gmc appears to live elsewhere.

### Pattern to copy
Cheers Global establishes the house style and this follows it:

| Concern | Convention |
|---|---|
| App code | `/srv/<name>/app`, owned by a dedicated unprivileged user |
| Secrets | `/etc/<name>/env`, root-owned, loaded via systemd `EnvironmentFile` |
| Mutable data | `/var/lib/<name>/` |
| Process | one systemd unit per app, `Restart=always`, hardened |
| Edge | nginx reverse proxy to `127.0.0.1:<port>`, TLS via Certbot |

Cheers Global holds port 3000. GVIM takes **3001**.

## What changes, and what does not

### Unchanged
- Every API handler. They are `(Request) => Promise<Response>` with no
  `@vercel/*` imports, so they mount on a Node server as they are.
- Every SQL query and the schema. libSQL accepts a local `file:` URL exactly
  as it accepts a Turso one, so this is a connection-string change.
- Every stored `file_path`, and therefore every existing image URL. The API
  composes `url` as `${publicBase}/${file_path}`; repointing `publicBase` at
  an nginx-served directory keeps all 91 items resolving.

### Changes
| Piece | From | To |
|---|---|---|
| Hosting | Vercel Functions + CDN | nginx + systemd + Node on the VPS |
| Database | Turso (remote libSQL) | local SQLite file, `/var/lib/gvim/gvim.db` |
| Media | Cloudflare R2 | local disk, `/var/lib/gvim/media/`, served by nginx |
| Upload path | presign → browser PUTs to R2 → commit | direct multipart POST to our API |
| Analytics | `@vercel/analytics` | removed — it only reports on Vercel |

### Why the upload path changes
Presigned URLs existed to dodge Vercel's 4.5 MB request-body cap: the bytes
had to go straight to R2 because they could not fit through a function. A VPS
has no such cap, so the browser can post the file to our own origin.

That deletes an entire class of failure. The "check the R2 bucket's CORS
rules" error of 2026-10-11 was a cross-origin PUT whose 403 carried no CORS
headers, so the browser could not report the real status. Same-origin uploads
have no preflight, no signature to expire, and a readable status on failure.

## Order of work

1. **Storage abstraction** — `lib/storage.ts` with the filesystem behind the
   same four functions `lib/r2.ts` exposed. `presignPut` disappears.
2. **Server** — Hono + `@hono/node-server` mounting the ten existing handlers,
   plus the new multipart upload route. A separate tsconfig emits `api/` and
   `lib/` to `dist-server/`, so the VPS runs plain JS and needs no TypeScript.
3. **Deploy assets** — systemd unit, nginx site, idempotent `setup-vps.sh`.
4. **Data migration** — Turso rows to the local file; R2 objects to disk. The
   media is fetchable over plain HTTPS from the public bucket URL, so this
   needs no R2 credentials (the local key is dead anyway).
5. **Provision and deploy** to a test subdomain, Vercel still live.
6. **GitHub Actions** — build on CI, rsync, restart over SSH.
7. **Cutover** — DNS, once verified.

## What this hands you

Backups stop being someone else's problem. Turso and R2 were replicated and
managed; a file on one disk is not. `scripts/backup.sh` covers the database
and the media, but **something has to run it and move the result off the
box** — otherwise a disk failure loses both the site and every photograph.

## Open items

- A test subdomain A record, so the VPS can be verified while Vercel serves
  the live domain.
- An SSH deploy key in GitHub secrets for Actions.
- Contact-form email still needs Resend keys; unchanged by this move.
