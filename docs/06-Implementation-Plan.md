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
| 9 | Contact email notifications | ⬜ Pending |
| 10 | Analytics | ⬜ Pending |
| 11 | Accessibility audit | ⬜ Pending |
| 12 | Custom R2 domain | ⬜ Pending |
| 13 | Publish sermon content | ⬜ Pending (content, not code) |

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

### Phase 9 — Contact email notifications ⬜ *(highest value)*
Enquiries land in the database with no notification, so someone must remember to
check the admin inbox. A missed enquiry from a prospective visitor is the most
costly failure this site can have.

- Add an email provider (Resend free tier ≈ 3,000/month)
- Send to `godvesselsinternational@gmail.com` on successful `POST /api/contact`
- Send after the row is written, and never fail the request if the email fails
- **Depends on:** nothing. **Estimate:** small.

### Phase 10 — Analytics ⬜
No measurement exists, so none of the PRD metrics can be evaluated.
Vercel Analytics (free tier) or Plausible. Privacy-respecting, no cookie banner.
**Depends on:** nothing. **Estimate:** small.

### Phase 11 — Accessibility audit ⬜
Practices in `04-UI-UX-Design-Brief.md` §7 were applied but never audited.
Run axe/Lighthouse, measure colour contrast (particularly gold on white), and do a
keyboard and screen-reader pass over the admin drawer and dialogs.
**Depends on:** nothing (Phase 8 QA complete). **Estimate:** small–medium.

### Phase 12 — Custom R2 domain ⬜
`pub-*.r2.dev` is a development endpoint that Cloudflare rate-limits. Attach a
custom bucket domain (e.g. `media.godsvesselinternationalministry.org`) and update
`PUBLIC_GALLERY_BASE` / `PUBLIC_SERMONS_BASE`. No data migration — `file_path`
stores keys, not URLs.
**Depends on:** DNS access. **Estimate:** small.

### Phase 13 — Publish sermons ⬜
Content, not code. The sermons feature is built and unused.

---

## Backlog (unscheduled)

| Item | Note |
|---|---|
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
