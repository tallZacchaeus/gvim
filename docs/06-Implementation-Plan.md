# 06 — Implementation Plan & Status

**Last updated:** 2026-10-08

## Status at a glance

| Phase | Scope | Status |
|---|---|---|
| 1 | Database migration (D1 → Turso) | ✅ Done |
| 2 | API port (Cloudflare Pages Functions → Vercel Functions) | ✅ Done |
| 3 | Routing & security headers (`vercel.json`) | ✅ Done |
| 4 | Direct-to-R2 uploads | ✅ Done |
| 5 | Environment & deployment tooling | ✅ Done |
| 6 | Retire PHP and Cloudflare builds | ✅ Done |
| 7 | Design system restoration & public site redesign | ✅ Done |
| 8 | Admin overhaul & mobile responsiveness | ✅ Done & verified |
| 9 | Contact email notifications | ✅ Done — needs an API key to activate |
| 10 | Analytics | ✅ Done — enable in the Vercel dashboard |
| 11 | Accessibility audit | ✅ Done — 0 axe violations |
| 12 | Custom R2 domain | ⛔ Blocked — needs a nameserver move you must make |
| 13 | Publish sermon content | ⛔ Blocked — content only you can supply |

---

## Completed

### Phase 1 — Database migration ✅
D1 → Turso. `migrations/0001_init.sql` reused verbatim (libSQL is SQLite).
`lib/db.ts` mirrors D1's `prepare/bind/all/first/run` so handlers kept their SQL.
Migrated and verified: 6 categories, 91 gallery rows, 0 sermons, 0 contacts.
Verification went beyond row counts to field-level integrity, which surfaced the
`fellowship` / `community` path mismatch documented in `05-Backend-Schema.md` —
39 images that had been broken on the previous site, now fixed.

### Phase 2 — API port ✅
11 handlers from `functions/api/**` to `api/**`. `_middleware.ts` dropped: Vercel
middleware runs on the Edge runtime and cannot pass a decoded user to a Node
function, so protected handlers call `guard()` explicitly.
Three defects fixed in passing: `limit` was interpolated into SQL; JWT and password
comparison short-circuited (timing leak); a failed insert after a successful upload
left an orphaned object.

### Phase 3 — Routing ✅
`vercel.json`: SPA rewrite `/((?!api/).*)`, security headers carried over from the
PHP `.htaccess`, immutable asset caching, `no-store` on `/api/*`.

### Phase 4 — Direct-to-R2 uploads ✅
presign → browser PUT → commit. Keys server-generated and re-validated; object
existence confirmed before any row is written.
*Note:* originally justified by Vercel's 4.5 MB body limit. That limit is no longer
current (now 100 MB), and the rationale was corrected in commit `eb00753` — the
design stands on its own merits (one network hop, no function held open, real
upload progress).

### Phase 5 — Environment & tooling ✅
`.env.example` (12 vars), `check-env.mjs`, `hash-password.mjs`,
`push-env-to-vercel.mjs`, `smoke-api.mjs` (32 offline assertions).

### Phase 6 — Retirement ✅
PHP site and Cloudflare build removed; `app/` promoted to the repository root.
All 91 images verified present in R2 before deleting local copies.

### Phase 7 — Design ✅
Fraunces + Inter and the warm token system recovered from the PHP site's
stylesheet in git history. Photography-led hero, editorial gallery, timetable in
place of icon-cards, mobile polish. See `04-UI-UX-Design-Brief.md`.

### Phase 8 — Admin overhaul ✅
`admin.css` rewritten as one scoped system; off-canvas drawer below 900px; tables
become stacked cards; `GET /api/stats`; in-app confirm dialogs and toasts
replacing `window.confirm`/`alert`; search and filtering; formatted dates; loading
and empty states.

Fixed two genuine defects: `.admin-nav` was declared twice, leaking `height: 60px`
from a dead rule and wrapping nine links into overflowing columns; and
`.modal-content` had no CSS rule at all, so reading a message rendered unstyled
text on a near-black overlay.

**Verified in the browser** at 1280px and 375px (2026-10-08, via `npm run dev:admin`):
all seven pages render; the message reader and confirm dialog work; the drawer
opens with a scrim, scroll lock, `aria-expanded` and 47px targets, and closes on
Escape; tables become labelled cards with no horizontal overflow; gallery search
filters 91 items to 6.

Rendering the pages found two defects that typecheck, build and the API tests all
missed, because both were runtime tree/cascade problems rather than type errors:

- `AdminFeedbackProvider` sat inside `AdminLayout`, but pages call `useFeedback()`
  and *then* return `<AdminLayout>` — the provider was a child of its own consumer,
  so four pages crashed to a blank screen. It now lives in `ProtectedRoute`.
- A global `main { margin-top: 80px }` in `style.css` (for the public site's fixed
  header) leaked onto `.admin-main`, leaving an 80px dead band and breaking the
  admin header's `position: sticky`.

**Lesson for future phases:** a green typecheck and a passing API suite say nothing
about whether a page renders. Load the pages.

---

## Pending

### Phase 9 — Contact email notifications ✅ *(inactive until a key is set)*
Enquiries now email the church on arrival, via Resend's REST API over `fetch`
(no SDK, no new dependency). Implemented inside the existing `/api/contact`
handler rather than a new file, because Hobby caps a deployment at 12 functions
and the project is at 10.

Design: the row is committed first and the notification is strictly best-effort —
awaited (an un-awaited promise can be killed when the function returns) but
bounded by a 6s timeout, with every failure logged and swallowed. `reply_to` is
the enquirer, so staff can simply hit Reply. Message content is HTML-escaped.

Covered by 13 new assertions in `npm run test:api`: unconfigured, healthy,
provider 4xx, timeout, network error, and HTML injection — in every case the
submission returns 200 and the row is persisted.

**To activate:** create a Resend account, then set `RESEND_API_KEY` and
`CONTACT_NOTIFY_TO` in Vercel. Until then the form works exactly as before.
Verify the domain in Resend and set `CONTACT_NOTIFY_FROM` to send from a real
church address.

### Phase 10 — Analytics ✅ *(needs enabling in the dashboard)*
Vercel Web Analytics via `@vercel/analytics/react`, page views only.

Checked against the docs before building, which changed the design: **custom
events are Pro-only on Hobby**, so `track()` calls would have been dead code. Two
PRD metrics that needed them — enquiries and uploads per month — are instead
computed with SQL in `/api/stats` and shown on the dashboard under "Last 30 days".
Gallery engagement stays unmeasured rather than faked.

`beforeSend` drops `/admin` URLs: staff traffic is not visitor behaviour and would
skew every ratio while consuming the 50,000/month allowance.

`<Analytics />` sits inside `SafeBoundary`, a small error boundary, so a failure in
observational code can never blank the site.

Verified in the browser: `/gallery` sends a view, `/admin/dashboard` logs "Page
view would be ignored by `beforeSend`", and no cookies are set.

**To activate:** Vercel dashboard → the `gvim` project → **Analytics** → Enable.
The script is already deployed; until it is enabled nothing is collected.

### Phase 11 — Accessibility audit ✅
axe-core 4.10.2 run against all 13 pages (5 public, 8 admin). **13 pages, 0
violations.** The practices claimed in `04-UI-UX-Design-Brief.md` had never been
verified, and the audit found real defects:

| Issue | Impact | Detail |
|---|---|---|
| `nested-interactive` | serious, ×91 | Every gallery tile was a `role="button"` div wrapping a real `<button>` |
| `color-contrast` | serious | `.eyebrow` gold measured **2.69:1** against a 4.5:1 requirement; `--subtle-foreground` 3.45:1; YouTube/Facebook/Zoom buttons 3.32–4.23:1 |
| `label` | serious, ×10 | Upload and sermon form labels were not associated with their inputs |
| `heading-order` | moderate | The footer sat at `h3` directly under each page's `h1`; stat values and card titles were marked up as headings |
| `landmark-one-main` | moderate | The admin login page had no `<main>` |

Fixes, with values solved rather than guessed:
- `--gold-600` 44% → **32.5%** lightness (4.57–5.06:1 across paper, surface-2 and
  white); `--subtle-foreground` → **46%**. Brand buttons darkened the minimum
  needed to clear 4.5:1 while staying recognisable.
- Gallery tiles are no longer controls; the inner button is the single control and
  carries an accessible name. It sits in an overlay translated out of view, so
  `:focus-within` now reveals it — otherwise keyboard users would focus something
  invisible.
- Footer `h3/h4` → `h2/h3`; stat values and card titles became spans, since a
  number is not a section heading.
- All 18 form fields given `htmlFor`/`id` pairs.

**Not covered:** no screen-reader pass (VoiceOver/NVDA) and no manual tab-order
review beyond the gallery. Automated tooling catches perhaps half of WCAG issues;
this is a floor, not a guarantee.

### Phase 12 — Custom R2 domain ⛔ *blocked on a decision only you can make*
Investigated and **not** done, because every route requires an action at your
registrar or money.

`pub-*.r2.dev` is documented as rate-limited and "meant only for development, not
production". It also rules out WAF rules, caching and access controls.

Attaching a custom domain needs the zone to exist in the same Cloudflare account.
Two ways to get there:

| Route | Cost | Blocker |
|---|---|---|
| Partial (CNAME) zone, DNS stays at Hostinger | **Business plan** | Confirmed Business/Enterprise only — not Free or Pro |
| Full zone — move nameservers to Cloudflare | Free | You must change nameservers at Hostinger |

So the free route is a nameserver move. The good news is that it is unusually
low-risk here — the whole zone is two records, and **there are no MX or TXT
records**, so no email or domain verification can break:

```
apex A  godsvesselinternationalministry.org  ->  216.198.79.1
CNAME   www                                  ->  8adda17e70e6f03b.vercel-dns-017.com
```

**Runbook, when you want it:**
1. Add `godsvesselinternationalministry.org` to Cloudflare (Free plan).
2. Recreate exactly the two records above. Set both to **DNS only** (grey cloud) —
   proxying them would put Cloudflare in front of Vercel, which you do not want.
3. Change the nameservers at Hostinger to the two Cloudflare gives you. Allow a
   propagation window; the site keeps resolving via the old nameservers until it
   completes.
4. Confirm the site still loads, then R2 → each bucket → Settings → Custom Domain,
   e.g. `media.godsvesselinternationalministry.org`.
5. Update `PUBLIC_GALLERY_BASE` / `PUBLIC_SERMONS_BASE` in Vercel and redeploy.
   **No data migration** — `file_path` stores keys, not URLs (see `05-Backend-Schema.md`).
6. Add the new origin to the R2 CORS rules (`R2_UPLOAD_SETUP.md`).

**Is it worth doing now?** Probably not urgently. The rate limit is undocumented in
magnitude and a single congregation's traffic is unlikely to reach it. Do it before
any campaign that might drive real traffic, or if images ever start failing to load.

### Phase 13 — Publish sermons ⛔ *content, not code*
The feature is built and verified; there is simply nothing to publish. I have not
created placeholder sermons: they would be attributed to a named real person
(Rev. Godwin BB. Olutimi) and would appear to a visitor as genuine teaching.

Verified that the path is ready:
- `/sermons` with zero sermons renders a proper "Sermons Coming Soon" empty state
  with a route to the YouTube channel — visitors do not meet a blank page.
- The admin form at `/admin/sermon-add` renders, and its fields now carry proper
  label associations (Phase 11).
- A sermon needs only a title; a YouTube URL or an audio file is optional.

**To publish one:** `/admin` → Add Sermon → title, speaker, date, and a YouTube
URL. It appears on `/sermons` immediately.

---

## Backlog (unscheduled)

| Item | Note |
|---|---|
| Gallery engagement tracking | Needs Vercel Pro (custom events) or a different analytics provider |
| Rotate the MySQL password in git history | `git show b74c465:includes/db.php`. Nothing uses that database, but the credential is exposed. **Do this regardless of priority.** |
| Delete 29 orphaned R2 objects | Unused duplicates under `gallery/fellowship/` |
| Fix footer social links | Instagram and X are `#` placeholders |
| Bulk delete in gallery manager | Removing several photos means one dialog each |
| Edit existing gallery items / sermons | Currently delete-and-re-upload only |
| Pagination on contacts | Fine at current volume; `?limit=100` today |
| Per-user admin accounts | Single shared account, no audit trail |
| Connect Vercel to git pushes | Deploys are manual CLI today |
| Image optimisation | Full-size photos served; ~500 kB each |

## Conventions for future work

1. `npm run typecheck && npm run test:api && npm run build` before every deploy.
2. Relative imports in `api/` and `lib/` **must** end in `.js` (`NodeNext`); a
   missing extension is a compile error, and used to be a production outage.
3. New admin CSS belongs scoped under `.admin-wrap` / `.admin-login`.
4. Update `05-Backend-Schema.md` in the same change as any schema or API change,
   and tick the phase here when it lands.
