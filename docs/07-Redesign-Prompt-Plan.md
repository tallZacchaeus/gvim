# 07 — Redesign Prompt Plan

**Purpose:** a sequenced set of prompts to take GVIM from "clean and working" to
"professionally art-directed", using GSAP, shadcn/ui and (conditionally) Three.js.
**Created:** 2026-10-08
**Status:** plan only — nothing here is implemented

---

## 0. Read this before running any prompt

### Three recommendations, stated plainly

**1. Do not restart the public site's design.** It was rebuilt deliberately in
Phase 7 around the congregation's own photography, using a type and colour system
recovered from the original PHP build (Fraunces + Inter, warm paper, navy/gold).
That system is the opposite of generic. The goal here is to **art-direct and
animate what exists**, not to replace it. A from-scratch restart is the single
most likely way to end up back at "looks AI-generated".

**2. shadcn/ui belongs in the admin, not the public site.** shadcn is a set of
unstyled Radix primitives you copy in and style with Tailwind. Its value is
accessible behaviour you would otherwise hand-roll: dialogs, comboboxes, data
tables, form validation, focus management. The admin is full of exactly that. The
public site is five mostly-static pages where it would buy almost nothing and
would mean re-expressing a working design system in Tailwind utilities.

**3. Three.js is the one I would push back on.** Current payload is **71 kB
gzipped JS**. A minimal Three.js scene adds roughly **150 kB gzipped** — tripling
it — on a site whose audience is largely on phones, including congregants in West
Africa on slower connections. The site's strength is real photographs of real
people; a rotating 3D object competes with that rather than supporting it.
Phase D is therefore written as **conditional and reversible**, with explicit kill
criteria. Run it last, or not at all.

### Budgets — treat as acceptance criteria, not aspirations

| Metric | Today | Ceiling after redesign |
|---|---|---|
| JS, gzipped | 71.1 kB | **≤ 130 kB** (≤ 200 kB only if Phase D ships) |
| CSS, gzipped | 8.5 kB | ≤ 20 kB |
| axe violations | **0** across 13 pages | **0** — non-negotiable |
| Vercel functions | 10 | **≤ 12** (hard deploy failure above) |
| Largest Contentful Paint, mobile | measure first | no worse than baseline |

### Non-negotiable constraints

- `prefers-reduced-motion: reduce` must disable **every** animation added.
- No horizontal overflow at 375 px on any page.
- Tap targets ≥ 44 px; form inputs 16 px (prevents iOS zoom-on-focus).
- Relative imports in `api/` and `lib/` must end in `.js` (NodeNext).
- Zero-budget: free tiers only.

---

## 1. The constraints block

**Paste this verbatim at the top of every prompt below.** Without it an agent will
cheerfully install Tailwind over the existing design system, or add an eleventh
and twelfth API route.

```
PROJECT CONTEXT — GVIM (God's Vessels International Ministry)
Live: https://www.godsvesselinternationalministry.org
Stack: Vite + React 18 + TypeScript + react-router v6; Vercel Functions (Node 22);
Turso (libSQL); Cloudflare R2 over the S3 API.
Read docs/02-TRD.md, docs/04-UI-UX-Design-Brief.md and docs/05-Backend-Schema.md
before changing anything.

HARD CONSTRAINTS
- Do not break the existing design tokens in src/styles/style.css (~50 custom
  properties: Fraunces display, Inter body, warm paper background, navy + gold).
  They were recovered deliberately; treat them as the source of truth.
- Accessibility must stay at ZERO axe violations across all 13 pages.
  prefers-reduced-motion must disable every animation.
- JS budget: ≤130 kB gzipped total.
- Vercel Hobby allows 12 serverless functions; api/ currently has 10. One file =
  one function. Do not add more than two.
- Mobile first: no horizontal overflow at 375px, tap targets ≥44px, inputs 16px.
- Free tiers only. No paid services.

VERIFY BEFORE CLAIMING DONE
  npm run typecheck && npm run build && npm run test:api
  npm run dev           # public site
  npm run dev:admin     # admin with fixtures, no credentials needed
Then load the pages in a browser and run axe-core. A green build does not mean a
page renders — that has already produced two production bugs on this project.
```

---

## Phase A — Design foundation

**Goal:** make Tailwind available for the admin without disturbing the public
site's hand-written system. Everything downstream depends on getting this right.

**Risk:** this is where a redesign usually goes wrong, by converting the whole app
to utilities and losing the token system.

### Prompt A1 — Tailwind, scoped and token-bound

```
[CONSTRAINTS BLOCK]

TASK
Add Tailwind CSS v4 and configure shadcn/ui, WITHOUT restyling the public site.

1. Install Tailwind and configure it to scan only:
     src/pages/admin/**, src/components/admin/**, src/components/ui/**
   The public pages and src/styles/style.css must be untouched and unaffected.
2. Map Tailwind's theme onto the EXISTING CSS custom properties rather than
   inventing a palette. --background, --surface, --foreground, --border,
   --brand-*, --gold-*, --radius-*, --font-display, --font-sans already exist in
   src/styles/style.css. Tailwind colours must reference those variables so the
   admin and the public site can never drift apart.
3. Initialise shadcn/ui with components living in src/components/ui/.
4. Add no components yet.

ACCEPTANCE
- npm run build succeeds; CSS gzipped grows by ≤6 kB.
- Public pages render byte-identically: screenshot /, /about, /gallery, /sermons,
  /contact before and after and confirm no visual change.
- A throwaway <Button> from shadcn renders with the project's navy, Inter and
  radius — proving the token bridge works. Delete it after checking.
```

### Prompt A2 — Motion primitives

```
[CONSTRAINTS BLOCK]

TASK
Install GSAP and establish the motion layer. No visual changes yet.

1. Install gsap (core + ScrollTrigger only; do not import the full bundle).
2. Create src/lib/motion.ts exporting:
   - a registerGsap() that registers ScrollTrigger once
   - useReveal(ref, opts) — a hook for scroll-triggered reveals
   - A SINGLE global guard: if window.matchMedia('(prefers-reduced-motion:
     reduce)').matches, every helper must no-op and leave elements at their final
     visible state. Never leave content stuck at opacity 0.
3. Use gsap.context() with cleanup in useEffect so React StrictMode double-mounting
   does not duplicate ScrollTriggers.

ACCEPTANCE
- JS gzipped grows by ≤35 kB.
- With reduced-motion forced on, every element is visible and no GSAP timeline runs.
- Navigating between routes twice leaves no orphaned ScrollTrigger instances
  (check ScrollTrigger.getAll().length).
```

---

## Phase B — Admin rebuilt on shadcn

**Goal:** replace hand-rolled admin UI with accessible primitives. This is where a
component library genuinely pays for itself.

**Why it is safe:** the admin is behind login, so mistakes are invisible to
visitors, and it is covered by `npm run dev:admin` fixtures.

### Prompt B1 — Shell and navigation

```
[CONSTRAINTS BLOCK]

TASK
Rebuild the admin shell with shadcn primitives.

1. Replace the hand-rolled off-canvas drawer in src/components/AdminLayout.tsx
   with shadcn Sheet for <900px, keeping the persistent sidebar above it.
2. Add a command palette (shadcn Command + Dialog) on Cmd/Ctrl-K for jumping
   between the seven admin sections.
3. Add breadcrumbs and keep the page title in the sticky header.

PRESERVE
- The drawer's current behaviour is already correct and verified: scrim, Escape to
  close, body scroll lock, aria-expanded/aria-controls, 44px+ targets, closes on
  navigation. Sheet must match or beat all of it.

ACCEPTANCE
- 0 axe violations on all 8 admin routes.
- Keyboard: Tab reaches every nav item, Escape closes, focus returns to the
  trigger on close.
- Verified at 375px and 1280px.
```

### Prompt B2 — Data tables

```
[CONSTRAINTS BLOCK]

TASK
Replace the admin tables with shadcn DataTable (TanStack Table) on
/admin/contacts, /admin/sermon-manage and /admin/categories.

Add per table: column sorting, a filter input, pagination (25/page), and
column visibility. /admin/contacts should also support selecting rows and
deleting the selection in one confirm.

CRITICAL — mobile
The current tables collapse into stacked cards below 900px, where each <td>
carries data-label and CSS renders it via ::before. That is why there is no
horizontal scroll on a phone. TanStack renders differently, so either preserve
that technique or render a dedicated card list below 900px. A horizontally
scrolling table on a phone is a regression and is not acceptable.

ACCEPTANCE
- No horizontal overflow at 375px on any of the three routes.
- 0 axe violations.
- Sorting and filtering work by keyboard alone.
```

### Prompt B3 — Forms

```
[CONSTRAINTS BLOCK]

TASK
Rebuild the admin forms on react-hook-form + zod + shadcn Form.
Targets: /admin/gallery-upload, /admin/sermon-add, /admin/categories.

1. One zod schema per form, shared with the API handler's validation where
   practical so client and server cannot disagree.
2. Inline field errors tied to inputs via aria-describedby.
3. Keep the existing upload flow EXACTLY as-is: presign -> direct PUT to R2 ->
   commit metadata. Do not route file bytes through the API. Keep the progress
   bar and the per-file progress reporting.
4. Keep the slug auto-derivation on the Categories form.

ACCEPTANCE
- Every field keeps its label association (this was an axe violation that was
  fixed; do not reintroduce it).
- Inputs remain 16px.
- Uploading a 10 MB photo still works end to end against a preview deployment.
- 0 axe violations.
```

### Prompt B4 — Feedback and empty states

```
[CONSTRAINTS BLOCK]

TASK
Replace src/components/AdminFeedback.tsx with shadcn AlertDialog + Sonner toasts.

Keep the current API shape so pages do not change:
  const { confirm, notify } = useFeedback();
  if (!(await confirm({...}))) return;

NOTE ON PLACEMENT
The provider must stay ABOVE the page components. It currently lives in
ProtectedRoute for exactly this reason — when it was inside AdminLayout, pages
called useFeedback() before AdminLayout rendered, so the provider was a child of
its own consumer and four pages crashed to a blank screen. Do not move it.

Also: upgrade the loading skeletons to shadcn Skeleton, keep every empty state.

ACCEPTANCE
- All 8 admin routes render (load each one — a passing build proved nothing here
  last time).
- Escape cancels; focus moves into the dialog and returns on close.
```

---

## Phase C — Public site art direction (GSAP)

**Goal:** make the public site feel crafted. Evolution, not replacement.

### Prompt C1 — Scroll choreography

```
[CONSTRAINTS BLOCK]

TASK
Add scroll-driven motion to the public pages using the Phase A2 helpers.

1. Home: stagger the hero mosaic tiles in on load (respecting LCP — do not delay
   the largest image). Reveal section headings and the schedule rows on scroll.
   Add a subtle parallax to the mosaic, no more than 20px of travel.
2. Gallery: stagger tiles as they enter; animate the lightbox open/close from the
   clicked tile's position (FLIP).
3. About: reveal the leadership grid progressively.
4. Shared: a short cross-fade on route change.

RULES
- Reveals must animate from a VISIBLE state if JS fails or motion is reduced.
  Never ship content that is invisible without JS.
- No animation may move layout (no CLS). Transform and opacity only.
- Nothing may delay the hero image.

ACCEPTANCE
- Lighthouse mobile: LCP and CLS no worse than the pre-change baseline. Capture
  the baseline first.
- With reduced-motion on: all content visible, no motion.
- 0 axe violations.
```

### Prompt C2 — Editorial polish

```
[CONSTRAINTS BLOCK]

TASK
Raise the typographic and layout craft of the public pages, within the existing
token system. Do not introduce new fonts or a new palette.

1. Tighten the vertical rhythm to one scale; align everything to a baseline grid.
2. Gallery: refine the editorial grid so promoted tiles feel intentional at every
   breakpoint; add a lightweight blur-up placeholder while images decode.
3. Sermons: design the populated state properly — it has never had real content.
   Featured sermon, then a scannable list. Keep the existing empty state.
4. Contact: make the form feel considered — better focus states, inline
   validation, a clear success state.
5. Footer: give it a real structure rather than four equal columns.

ACCEPTANCE
- No new font families or colours; diff of style.css :root must show no new tokens
  except where explicitly justified in the PR description.
- Contrast: every new text/background pair ≥4.5:1, checked against --background,
  --surface-2 AND --surface (all three occur behind body text).
- 0 axe violations; no horizontal overflow at 375px.
```

---

## Phase D — Three.js (conditional)

**Run this last, and only if Phases A–C have landed and the budget allows.**

Kill criteria, decided in advance: if mobile LCP regresses by more than 300 ms, or
JS exceeds 200 kB gzipped, revert the phase. Write that into the prompt so the
agent cannot quietly accept the regression.

### Prompt D1 — One signature moment

```
[CONSTRAINTS BLOCK]

TASK
Add exactly ONE WebGL moment. Not a 3D site — one moment.

Scope: a slow, subtle animated gradient/light field behind the home hero that
picks up the navy and gold tokens. It sits BEHIND the existing photo mosaic,
which remains the focus. No 3D models, no orbit controls, no scroll-driven camera.

MANDATORY
1. Lazy-load: dynamic import, never in the main bundle. The page must be fully
   interactive before any WebGL code is fetched.
2. Import only the Three.js modules used, so tree-shaking works. Target ≤60 kB
   gzipped for the lazy chunk.
3. Gate on ALL of: prefers-reduced-motion is not reduce; WebGL2 is available;
   navigator.hardwareConcurrency >= 4; the hero is in the viewport.
   If any check fails, render the current static hero. The static hero is the
   default, not the fallback.
4. Pause the render loop when the tab is hidden or the hero scrolls out of view.
5. Cap the pixel ratio at 1.5 and the frame rate at 30fps.

ACCEPTANCE
- Main bundle gzipped unchanged (±2 kB) — the WebGL chunk must be separate.
- Mobile LCP within 300 ms of baseline. If not, REVERT and report.
- With reduced-motion on, no WebGL context is created at all.
- 0 axe violations.

If you cannot meet the budget, say so and stop rather than shipping it.
```

---

## Phase E — Verification

### Prompt E1 — Prove it

```
[CONSTRAINTS BLOCK]

TASK
Verify the whole redesign and report honestly.

1. axe-core over all 13 routes (5 public, 8 admin) at 375px and 1280px.
2. Lighthouse mobile on /, /gallery, /contact. Report LCP, CLS, TBT against the
   pre-redesign baseline.
3. Bundle report: total gzipped JS and CSS, plus the largest chunks.
4. Keyboard-only pass over the admin: drawer, command palette, data tables,
   forms, dialogs.
5. Confirm the upload flow still works end to end on a preview deployment.
6. Re-run npm run test:api.

Report what REGRESSED as prominently as what improved. If any budget in
docs/07-Redesign-Prompt-Plan.md is exceeded, say so plainly and recommend what to
cut. Do not quietly widen a budget.
```

---

## Sequencing and rollback

Each phase is a branch, merged only when its acceptance criteria pass:

```
redesign/a-foundation   -> Tailwind + GSAP available, nothing visibly changed
redesign/b-admin        -> admin on shadcn
redesign/c-public       -> public motion + polish
redesign/d-webgl        -> conditional
```

Deploy each to a Vercel **preview** before production. The public site is live and
serving a real congregation; the admin is behind a login and far safer to iterate
on — which is why Phase B comes before Phase C.

Rollback is `git revert` of the phase merge. Keep phases small enough that this is
genuinely an option.

## What NOT to do

- Do not convert the public pages to Tailwind utilities. The token system in
  `src/styles/style.css` is the design.
- Do not add a third font or a second palette.
- Do not animate anything into view that cannot be seen without JS.
- Do not add more than two files under `api/` — 10 of 12 function slots are used,
  and exceeding the limit is a hard deploy failure, not a warning.
- Do not let an automated pass regress the accessibility work: 0 violations is the
  floor, verified on production.
