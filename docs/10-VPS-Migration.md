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

---

## Status — 2026-10-20

The VPS is provisioned and running the full stack. Vercel is still live and
serving the real domain; nothing has been cut over and no DNS has changed.

### Done
- `gvim` service user, `/srv/gvim/app`, `/var/lib/gvim`, `/etc/gvim/env` (0600).
- systemd unit on port 3001, enabled and **active**.
- nginx vhost for `vps.godsvesselinternationalministry.org`, serving the SPA
  and `/media` directly and proxying `/api`.
- Database: all 91 gallery rows, 6 categories, 1 contact — row counts matched
  against Turso.
- Media: all 91 objects, 36 MB, fetched over public HTTPS.
- Secrets generated **on the box**; the temporary admin password exists only
  in `/root/gvim-temp-admin.txt` (0600) and has never left it.

### Verified on the VPS, through nginx, using a Host header so no DNS was needed

| Check | Result |
|---|---|
| `/`, `/gallery`, `/admin` | 200 |
| `/api/health` | 200 `{"ok":true}` |
| `/api/gallery` | 200, 91 items |
| `/api/stats` | 401 (auth intact) |
| `/api/nope` | 404 JSON, not swallowed by the SPA fallback |
| `/media/gallery/community/IMG_1215.jpg` | 200, 513883 bytes, image/jpeg |
| unknown page | SPA fallback renders |
| **cheersglobal.org** | **301 / 200 — unchanged from baseline** |

### One failure worth recording
The first start died with `MODULE_NOT_FOUND` on `libsql`. `node_modules` had
been built on macOS arm64 and rsynced to x64 Linux, so it resolved
`@libsql/darwin-arm64`. Native addons do not travel between platforms.

The deploy now installs dependencies **on the target** from the lock file, and
the workflow does the same, so this cannot recur.

## Remaining, and what needs you

| # | Item | Who |
|---|---|---|
| 1 | A record: `vps.godsvesselinternationalministry.org` → `72.62.237.128` | you |
| 2 | `certbot --nginx -d vps.godsvesselinternationalministry.org` | me, once DNS resolves |
| 3 | Replace the temporary admin password (instructions in `/root/gvim-temp-admin.txt`) | you |
| 4 | GitHub secrets `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` for Actions | you |
| 5 | Schedule `deploy/backup.sh` **and copy the output off the box** | you |
| 6 | Cutover: point the apex and www at the VPS, retire Vercel | you, when ready |

Until 5 is done there is no backup at all: Turso and R2 were replicated and
managed, a single disk is not.

---

## TLS and live verification — 2026-10-20

`vps.godsvesselinternationalministry.org` resolves to 72.62.237.128 (checked
against 1.1.1.1, 8.8.8.8 and the system resolver). Certificate issued with
certbot, reusing the ACME account already on the box from cheersglobal, so no
new registration was needed.

Cert: Let's Encrypt, CN=vps.godsvesselinternationalministry.org, valid to
2027-01-18, auto-renew scheduled by certbot. HTTP 301s to HTTPS.

### Verified over real HTTPS

| Check | Result |
|---|---|
| `/`, `/about`, `/gallery`, `/sermons`, `/contact`, `/admin` | 200 |
| `/api/health` | 200 |
| `/api/gallery` | 200, 91 items |
| `/api/stats` (signed in) | 200 — gallery 91, categories 6, contacts 1 |
| `/api/stats` (signed out) | 401 |
| `/api/nope` | 404 JSON |
| `/media/.../IMG_1215.jpg` | 200, 513883 bytes, image/jpeg |
| Home + gallery, axe | **0 violations** |
| Gallery tiles | 91 rendered |
| **Requests to R2 or Vercel** | **none** |
| **cheersglobal.org** | **200 — unchanged** |

Full admin cycle exercised over HTTPS, run on the box so the temporary
password never left it: login → upload → file on disk → commit → served back
at its public URL → delete → file removed → gallery back to 91.

### Still third-party
Google Fonts and cdnjs (Font Awesome) are still fetched from outside. They are
assets rather than data, so the migration goal holds, but they are now the only
part of a page load not under your control. Self-hosting both would make the
site self-contained and drop two DNS + TLS round trips from first paint.

### Before cutover
1. Replace the temporary admin password — see `/root/gvim-temp-admin.txt`.
2. GitHub secrets `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`.
3. Schedule `deploy/backup.sh` **and copy its output off the box**.
4. Point the apex and `www` at 72.62.237.128, add them to the nginx
   `server_name`, re-run certbot for all three names, then retire Vercel.

---

## Cutover complete — 2026-10-20

`godsvesselinternationalministry.org` and `www` both resolve to 72.62.237.128
and are served by the VPS. `vps/migration` merged to `main` (8854cfe).

### An incident found during cutover
Before changing anything, the live apex was checked. It was serving **Cheers
Global's website under Cheers Global's certificate**: the apex A record already
pointed at the VPS, but no `server_name` matched it, so nginx fell through to
the default server — the first block loaded, which `sites-enabled/*` globs
alphabetically as `cheersglobal`.

This fails silently and plausibly: visitors got a working site, just the wrong
organisation's. It was fixed by adding the apex to the gvim `server_name` and
expanding the certificate.

`www` was pre-registered in `server_name` **before** the DNS change, so it
could not land in the same trap during propagation.

### Certificate
One Let's Encrypt ECDSA cert, SANs:
`godsvesselinternationalministry.org`, `www.…`, `vps.…`, expiring 2027-01-18.
`certbot.timer` is enabled and `certbot renew --dry-run` passes for both this
and cheersglobal.

### Verified on the live domain
Every public route 200, `/api/gallery` 91 items, media served with real bytes,
`/api/stats` 401 signed out, `/api/nope` a JSON 404, HTTP 301s to HTTPS on
both names, strict TLS verification passes (no browser warning), **0 axe
violations**, and a request census showing **no calls to R2 or Vercel**.
cheersglobal.org measured throughout and unchanged.

### Backups — now running
`sqlite3` was missing, so `backup.sh` would have failed on its first run. It is
installed, and a real run produced a 6.9K database snapshot and a 36M media
archive, self-verified with `PRAGMA integrity_check` and a row count of 91.
`/etc/cron.d/gvim-backup` runs it nightly at 03:15 with 14 days retained.

**They are still on the same disk as the data.** Nothing yet copies
`/var/backups/gvim` off the host, so a disk failure still loses both the site
and every photograph.

### Remaining
| # | Item | Who |
|---|---|---|
| 1 | Replace the temporary admin password — see `/root/gvim-temp-admin.txt` | you |
| 2 | GitHub secrets `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`; the workflow fails without them | you |
| 3 | Copy `/var/backups/gvim` off the box | you |
| 4 | Retire the Vercel project (left running as a fallback; it no longer serves the domain) | you |
| 5 | Optional: self-host Google Fonts and Font Awesome — the last third-party requests | me |

