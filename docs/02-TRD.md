# 02 — Technical Requirements Document

**Last updated:** 2026-10-08

## 1. Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Vite 5 + React 18 + TypeScript | SPA, `react-router-dom` v6 |
| API | Vercel Functions (Node 22) | Web-standard `Request`/`Response`, in `api/` |
| Database | **Turso** (libSQL / SQLite) | `@libsql/client` |
| Object storage | **Cloudflare R2** | Reached over its S3-compatible API |
| Auth | HS256 JWT in an HttpOnly cookie | Web Crypto, no auth library |
| Fonts | Fraunces + Inter | Google Fonts |
| Icons | Font Awesome 6.4 | CDN |

Runtime pinned to Node `22.x` via `engines` in `package.json`.

### Dependencies (deliberately few)
`react`, `react-dom`, `react-router-dom`, `@libsql/client`, `@aws-sdk/client-s3`,
`@aws-sdk/s3-request-presigner`. No UI framework, no CSS framework, no ORM, no
state library — the app is small enough that each would cost more than it saves.

## 2. Hosting and deployment

- **Host:** Vercel (Hobby). Project `gvim`.
- **Domains:** `www.godsvesselinternationalministry.org` (canonical);
  the apex 308-redirects to `www`; `gvim.vercel.app` also resolves.
- **DNS:** stays with the registrar (Hostinger nameservers) using A records to
  Vercel's edge. Vercel-managed nameservers are *not* used and are not needed.
- **Deploy:** `vercel --prod` from the CLI. Not currently wired to git pushes.

### Build
```
tsc -b && tsc -p tsconfig.api.json && vite build
```
Two TypeScript projects, deliberately:

| Config | Covers | Module resolution | Why |
|---|---|---|---|
| `tsconfig.json` | `src/` (browser) | `Bundler` | Vite resolves imports |
| `tsconfig.api.json` | `api/`, `lib/` (Node) | **`NodeNext`** | Mirrors how Vercel runs the functions |

`NodeNext` is not cosmetic. `package.json` declares `"type": "module"`, so Node
uses strict ESM resolution and **relative imports must carry a `.js` extension**.
Bundler resolution hid that, and the first production deploy returned 500 on every
route with `ERR_MODULE_NOT_FOUND`. Under `NodeNext` a missing extension is a
compile error (TS2835) instead of a production outage.

## 3. Integrations

| Service | Used for | Credentials |
|---|---|---|
| Turso | All relational data | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` |
| Cloudflare R2 | Gallery and sermon media | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` |
| **Resend** | Emails the church when an enquiry arrives (optional) | `RESEND_API_KEY` |
| **Vercel Web Analytics** | Page views, devices, referrers | none (enabled per project in the dashboard) |
| Google Fonts / Font Awesome | Typography and icons | none |

### Environment variables (12 required, 3 optional)
```
# required
TURSO_DATABASE_URL      TURSO_AUTH_TOKEN
ADMIN_USERNAME          ADMIN_PASSWORD_HASH      JWT_SECRET
R2_ACCOUNT_ID           R2_ACCESS_KEY_ID         R2_SECRET_ACCESS_KEY
R2_GALLERY_BUCKET       R2_SERMONS_BUCKET
PUBLIC_GALLERY_BASE     PUBLIC_SERMONS_BASE

# optional — contact notifications
RESEND_API_KEY          CONTACT_NOTIFY_TO        CONTACT_NOTIFY_FROM
```
Without the optional three the contact form still works: the enquiry is saved and
readable in the admin inbox, only the email alert is skipped. `check:env` reports
their absence as a warning, never a failure.

`CONTACT_NOTIFY_FROM` defaults to Resend's `onboarding@resend.dev`, which can only
deliver to the address owning the Resend account. Verify the domain in Resend and
set a real sender to reach any other inbox.
`.env.example` documents each. `npm run check:env` validates presence and shape
before a deploy. `scripts/push-env-to-vercel.mjs` syncs them to all three Vercel
environments over stdin, so values never enter shell history.

### R2 CORS — required
The browser uploads directly to R2, so both buckets need a CORS rule allowing
`PUT` from the site origin. Without it uploads fail with an opaque network error.
Wrangler expects the **R2 API** shape (`rules` / `allowed`), not the S3-style JSON
the Cloudflare dashboard displays. See `R2_UPLOAD_SETUP.md`.

## 4. Security

- Passwords stored as `sha256:<salt>:<hash>`; `scripts/hash-password.mjs` generates
  them. The plaintext is never stored or transmitted beyond the login request.
- Session is an HS256 JWT in an `HttpOnly; Secure; SameSite=Lax` cookie, 8-hour TTL.
- JWT signature and password comparison are **constant-time**; the original port
  used `===`, which short-circuits on the first differing byte.
- Every mutating endpoint calls `guard(request)` explicitly. Vercel middleware runs
  on the Edge runtime and cannot hand a decoded user to a Node function, so the
  check lives in the handler where it is enforced.
- SQL is always parameterised. `limit` was once interpolated directly into the
  gallery and sermon queries; it is now bound and clamped to 500.
- Upload keys are generated server-side and re-validated on commit against
  `gallery/<known-category>/<id>.<ext>` or `sermons/<id>.<ext>`, so an authenticated
  admin cannot write to an arbitrary bucket path.
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`) are set in `vercel.json`; `/api/*` is `no-store`.

### Known security debt
- The retired PHP site's **MySQL password remains in git history**
  (`git show b74c465:includes/db.php`). Nothing connects to that database any more,
  but the credential should be rotated at the provider.
- A single shared admin account: no per-user attribution or audit trail.

## 5. Non-functional requirements

- **Mobile first.** Most visitors and the administrator use phones. No horizontal
  overflow at 375px on any page, public or admin; tap targets ≥44px; form inputs
  16px so iOS does not zoom on focus.
- **Accessibility.** Semantic landmarks, visible focus rings, `aria-expanded` /
  `aria-controls` on the admin drawer, `role="alertdialog"` with focus management
  on confirmations, and `prefers-reduced-motion` honoured throughout.
- **Performance.** Static assets are immutable-cached for a year; images are lazy
  loaded below the fold; the JS bundle is ~220 kB (~68 kB gzipped).
- **Resilience.** Every list view has an explicit loading and empty state. A failed
  upload cannot leave an orphaned object or a row pointing at a missing file.

## 6. Constraints

- **Free tiers only.** Turso and R2 (10 GB storage, no egress fees) are permanently
  free at this scale; Vercel Hobby is free.
- **Vercel Hobby is non-commercial.** Adding real donation processing would require
  Pro (~$20/month).
- **Hobby caps a deployment at 12 serverless functions**, and Vercel creates one per
  file in `api/`. The project currently uses **10**. This is a hard deploy-time
  failure, not a warning — adding three files would break the next deploy. Deletes
  therefore use `?id=` query parameters rather than `[id].ts` route files.
- **`pub-*.r2.dev` is a development endpoint** that Cloudflare rate-limits and that
  excludes WAF rules, caching and access controls. A custom bucket domain is the
  fix, but it requires the zone to be in the same Cloudflare account: partial
  (CNAME) setup is **Business-plan only**, so the free route is moving nameservers
  to Cloudflare. Runbook and trade-offs in `06-Implementation-Plan.md`, Phase 12.
- No CI. Checks are run locally: `npm run typecheck`, `npm run test:api`, `npm run build`.

### Analytics
Vercel Web Analytics, page views only. **Hobby includes 50,000 events/month with a
one-month reporting window; custom events (`track()`) are Pro-only**, so none are
used — on Hobby they would silently do nothing.

No cookie banner is required: visitors are identified by a hash of the request, no
IP or personal identifier is stored, and the session hash is discarded after 24
hours. Verified empirically — the page sets no cookies.

`<Analytics />` is wrapped in `SafeBoundary` so an exception in observational code
can never blank the site, and `beforeSend` drops `/admin` URLs.

## 7. Testing

`npm run test:api` — 32 assertions covering auth, the authorisation guard, input
validation, the honeypot, client-IP capture, and the full presign → upload → commit
path. It runs fully offline against a throwaway libSQL file and an in-memory R2
stub, so it needs no credentials and touches no live service.

`npm run dev:admin` serves the admin area against fixtures (`ADMIN_MOCK=1`), so the
admin UI can be worked on without real credentials. The plugin is `apply: 'serve'`
and cannot reach a build.
