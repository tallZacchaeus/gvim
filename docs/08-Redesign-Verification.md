# 08 — Redesign Verification Report (Phases A–E)

**Date:** 2026-10-08
**Branches:** `redesign/a-foundation` → `b-admin` → `c-public` → `d-webgl`
**Status:** none merged to `main`; production is unchanged

---

## 1. Budgets

| Metric | Before | After | Ceiling | |
|---|---|---|---|---|
| Public JS, gzipped | 71.23 kB | **67.26 kB** | 130 kB | ✅ **lower than before** |
| CSS, gzipped | 8.43 kB | 14.20 kB | 20 kB | ✅ |
| Deployed assets | ~2.9 MB | **744 kB** | — | ✅ |
| axe violations, 13 routes | 0 | **0** | 0 | ✅ |
| Horizontal overflow @375px | none | none | none | ✅ |
| Vercel functions | 10 | 10 | 12 | ✅ |
| API tests | 45/45 | 45/45 | all | ✅ |

The public bundle **shrank** while the admin gained Tailwind, shadcn, TanStack
Table, react-hook-form, zod and Sonner — because all of it is code-split behind
the login.

## 2. The finding that mattered most

Measuring before animating changed the phase. Production LCP was **10,968 ms**
with 2,241 kB transferred, and the cause was not JavaScript:

`gvim-logo.jpg` was **4000×4000 px, 2,154 kB**, displayed at 44–72 px, used as
the favicon and header logo on every page. It was **96% of the page's transfer**
and took 3.7 s to download.

Resized to 128 px: **6.8 kB, a 99.7% reduction.**

No amount of scroll choreography would have mattered next to that. The lesson is
in the ordering: measure, then decorate.

## 3. Budgets that were enforced, not widened

Two pre-committed budgets failed and were honoured rather than adjusted:

| Phase | Budget | Measured | Resolution |
|---|---|---|---|
| A2 | GSAP ≤35 kB | 45.25 kB | Loaded dynamically; main entry unchanged, nothing fetched under reduced motion |
| D1 | Three.js chunk ≤60 kB | **127.07 kB** | Dependency dropped; rewritten on raw WebGL2 → **1.54 kB** |

Three.js could not be tree-shaken below 127 kB because its renderer, program
cache and material system are not separable. The effect is one full-screen
fragment shader — no scene graph, no camera, no geometry — so the library was
carrying no weight it needed to carry.

## 4. Defects found by verifying

Each was invisible to typecheck and the build:

| Defect | How it was found |
|---|---|
| `gsap.from()` stranded content at `opacity: 0` after route changes | Navigating repeatedly and reading computed opacity |
| Admin libraries (sonner, Radix) leaked into the public entry via a statically-imported `ProtectedRoute` | Grepping the **built** bundle for library names |
| shadcn's `CommandDialog` renders its `sr-only` header outside `DialogContent`, so it is in the document root even when closed | axe reported `region` on all 7 admin pages |
| Duplicate `AdminFeedbackProvider` reintroduced in `AdminLayout` | Grepping for the provider after writing it |
| Tailwind self-referencing tokens (`--radius-sm: var(--radius-sm)`) silently falling back to defaults | A shadcn button rendering at 6px instead of 12px |

## 5. Not verified

- **LCP after the fix.** Preview deployments require a Vercel login the test
  browser does not have, so the improvement is established by asset arithmetic
  (2,154 kB → 6.8 kB) rather than an end-to-end measurement. Measure on
  production after merging.
- **A real upload against live R2** — needs credentials and writes to the
  production bucket.
- **Screen readers.** axe is a floor, not a guarantee.

## 6. Follow-ups

- The 128 px logo also backs the sermon video placeholders, which render it much
  larger. Generate a bigger variant before publishing sermons.
- The WebGL hero field is cheap (1.54 kB) but its contribution over the existing
  CSS radial gradients is marginal. Keep or drop on taste, not cost.
- Phase C2 (editorial polish) and the route-transition work were not done.
