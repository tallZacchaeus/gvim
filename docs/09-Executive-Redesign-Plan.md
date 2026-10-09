# 09 — Executive Redesign Plan

Brief: turn the public site into a standard, executive, professional charity/ministry
site that still feels warm. Plain CSS, no gradients, no "AI slop" patterns.

Scope is the **public site only**. The admin (Tailwind v4 + shadcn/ui) is untouched;
"no new UI libraries" applies to the public pages, which are and stay plain CSS.

## 1. Findings that change the brief

Verified against the live site and the database before planning.

| Brief says | Actual | Consequence |
|---|---|---|
| "Google Map never loads" | **It loads.** Correct pin at 4511 36 Ave NW, iframe 1136×450. It is `loading="lazy"` and sits 1458px down the page, so it renders only on scroll. | Keep the iframe, restyle it. Do not rebuild. |
| Gallery categories: 7 | **4 exist**: `events` (11), `fellowship` (68), `worship` (9), `youth` (3). No "Outreach & Missions", no "Special Occasions". | Render only categories that exist (already dynamic from `/api/categories`). |
| Images under `/gallery/{community…}` | Category is `fellowship`, files live under `gallery/community/`. Known rename mismatch. | Treat the R2 path as opaque; use `item.url` from the API. |
| "Sermons currently empty" | Page exists with an empty state; the **database** has no sermons. | Needs real sermon data from you, not a new layout only. |
| "plain CSS (no Tailwind)" | True for public pages. Admin uses Tailwind + shadcn. | Must not leak public token changes into admin. |

Also confirmed accurate: "Give a Gift" is a `mailto:` (`Home.tsx:75`), gallery titles are
filename-derived (`IMG 1215`, `ws 010`), and the current h1 contains exactly the
accent-word-in-a-different-colour pattern the brief rules out.

### Work this brief reverts
Both shipped to production on 2026-10-09 and would be removed:
- **WebGL hero** (`HeroField.tsx`, raw WebGL2, 1.54 kB) — replaced by the photo hero.
- **GSAP scroll reveals** (6 `useReveal` calls). Note the brief's stated objection,
  "animations that leave content invisible until scrolled", does not apply to this
  implementation: `motion.ts` uses `fromTo` with `immediateRender: false` precisely so
  content is never stranded invisible. Removing them is still a legitimate taste call.

## 2. Data layer (new — `src/data/`)

TypeScript, not `.js` as the brief wrote, because the project is TS throughout and the
shared shapes are reused in four places; `.js` would silently lose that checking.

| File | Holds | Consumed by |
|---|---|---|
| `site.ts` | Re-exports and extends the existing `SITE` in `lib/api.ts` — address, phone, email, socials, giving links. **Does not duplicate it.** | Nav, Footer, Contact |
| `serviceTimes.ts` | Weekly + monthly schedule, Mountain Time. Single source of truth. | Home §3, About, Footer |
| `team.ts` | Lead pastor + 9 ministry leaders, with `photo?` and initials fallback | About |
| `sermons.json` | Sermon records; API stays primary, this seeds/falls back | Sermons |
| `gallery.ts` | Curated home-six picks, caption overrides, category display labels | Home §4, Gallery |

## 3. Component tree

```
Layout
├─ UtilityBar          service times summary · phone · email
├─ Navbar              logo + wordmark · links · solid "Give"
│   └─ MobilePanel     slide-in right, scroll lock, Esc, focus trap
├─ <page>
└─ Footer              4 cols; service times from shared data

Home
├─ Hero                photo + flat navy overlay 55-65%, left-aligned
├─ InfoStrip           3 cols, thin dividers, no cards/icons
├─ Welcome             2 cols + 3 plain pillars
├─ ServiceTimes        ← shared
├─ PhotoGrid           6 photos, real captions, "View full gallery"
├─ GiveBand            solid navy, giving URL + e-Transfer fallback
└─ Testimonies         3 quotes, no autoplay

Shared: SectionHeading · Breadcrumb · Skeleton · Lightbox · TeamGrid/TeamCard · Timeline · SermonCard
```

## 4. Files touched

- **Rewrite**: `src/styles/style.css` (tokens; remove all 7 gradients), `Navbar.tsx`,
  `Footer.tsx`, all 5 pages.
- **New**: `src/data/*` (5), `src/components/` (~14 above).
- **Remove from Home**: `HeroField` import + `Suspense` block. `HeroField.tsx` itself is
  kept in the repo (not deleted) so the decision is reversible.
- **Untouched**: everything under `src/pages/admin`, `src/components/ui`,
  `src/components/Admin*`, `tailwind.css`, `admin.css`, all of `api/` and `lib/`.

## 5. Build order

1. Design tokens + data layer
2. Nav (utility bar, main bar, mobile panel), Footer, Hero, InfoStrip
3. Home sections 2-6
4. About
5. Gallery — skeletons, single-grid layout, lightbox, filename-caption suppression
6. Sermons — featured embed, card grid, filters, empty state
7. Contact — keep map, neutral pastoral-care note
8. Verification: axe on all 5 pages, bundle budget, mobile at 375px

## 6. Design decisions (made, one line each)

- **Filename captions**: suppress titles matching `/^(IMG|DSC|PXL|ws)[\s_-]?\d+$/i` rather
  than displaying them — showing nothing beats showing `IMG 1215`, and real titles added
  later in admin appear automatically.
- **Gallery layout**: CSS Grid with a fixed 4:3 aspect-ratio box, not CSS columns —
  columns reorder items top-to-bottom per column, which breaks chronological reading.
- **Lightbox**: native `<dialog>` for free focus trapping and Esc, with a JS fallback.
- **Team photos**: square with initials fallback on a flat navy tile, so missing photos
  look deliberate rather than broken.
- **Sermons filters**: derived from the data, not hardcoded, so the filter bar cannot
  list a series with zero sermons.
