# 04 — UI/UX Design Brief

**Last updated:** 2026-10-08

## 1. Direction

Warm, editorial, photography-led. The congregation's own photographs carry the
site; typography and layout stay out of their way.

The guiding constraint is the source material: candid phone photographs in mixed
orientations, taken in a community hall. There is no art-directed hero shot. A
design that assumes one would look worse, not better — which is why the home hero
is a **four-photo mosaic** rather than a single full-bleed image. Each tile crops
to its own frame, portrait and landscape both work, and more of the ministry's
work is visible at once.

### What this design deliberately avoids
These are the patterns that made the earlier build read as generic, all since removed:
- A flat colour-gradient hero with no imagery
- "Welcome to [Organisation Name]" as a headline
- Everything centred
- Rows of identical icon-cards used as filler
- An oversized icon standing in for a photograph

## 2. Colour

Tokens live in `src/styles/style.css` (~50 custom properties). Defined in HSL so
related shades stay harmonious.

| Role | Token | Value |
|---|---|---|
| Brand, deepest | `--brand-900` | `hsl(226 62% 17%)` |
| Brand, primary | `--brand-500` | `hsl(222 70% 50%)` |
| Accent (warm gold) | `--gold` | `hsl(40 96% 53%)` |
| Page background | `--background` | `hsl(38 36% 97%)` — warm paper, not white |
| Surface | `--surface` | `hsl(0 0% 100%)` |
| Text | `--foreground` | `hsl(224 32% 12%)` |
| Muted text | `--muted-foreground` | `hsl(224 12% 42%)` |
| Border | `--border` | `hsl(36 22% 88%)` |

The warm paper background and the gold accent are what keep the navy from reading
as cold corporate blue. The earlier build used pure white with blue-on-blue.

**Legacy aliases:** older cool-blue variable names (`--blue`, `--gray-700`, …) are
mapped onto the new tokens rather than being removed, so roughly 300 existing
declarations re-toned without being rewritten individually. New work should use
the semantic tokens directly.

## 3. Typography

| Role | Family | Usage |
|---|---|---|
| Display | **Fraunces** (variable serif) | All headings, numerals in stat cards |
| Body | **Inter** | Body copy, UI, labels |

Headings use `font-optical-sizing: auto` and `letter-spacing: -0.02em`. Sizes are
fluid: `h1: clamp(2.25rem, 5vw, 3.25rem)`, `h2: clamp(1.75rem, 3.4vw, 2.5rem)`.

> Historical note: `index.html` once loaded Playfair Display while the CSS rendered
> `Georgia`. The font was downloaded on every visit and never used. Verify any new
> font link is actually referenced by a `font-family`.

### Eyebrow labels
Small uppercase gold labels above headings (`.eyebrow`), used instead of centring
to establish hierarchy. 0.78rem, 600 weight, `0.12em` tracking.

## 4. Components

| Component | Convention |
|---|---|
| Buttons | `.btn` + `.btn-primary` / `.btn-secondary` / `.btn-outline` / `.btn-danger`; pressed state; hover lift suppressed on touch |
| Cards | `--radius-lg`, 1px border, soft layered shadow; lift on hover (pointer devices only) |
| Gallery tiles | Photo zooms **inside** a fixed frame; the tile itself never moves |
| Forms | Label above input, 16px text, ≥44px targets, hint text below |
| Dialogs | `role="alertdialog"`, focus moved to the confirm button, Escape cancels, body scroll locked |
| Toasts | Bottom-centre pill, `role="status"`, auto-dismiss (3s success / 5s error) |
| Empty states | Icon, heading, one sentence, and a button to the action that resolves it |
| Skeletons | Shimmer blocks matching the final layout, not spinners |

## 5. Layout

- Container max-width **1200px**, gutters `clamp(1rem, 3vw, 2rem)` (1.25rem on phones).
- Section rhythm: one scale everywhere — `clamp(3.5rem, 7vw, 6rem)` vertical padding.
- Headings are **left-aligned by default**; `.section-head.center` opts back in.
- Gallery grid promotes some tiles to larger frames so it reads as an edited page
  rather than a contact sheet — disabled below 640px, where a promoted tile would
  dominate the screen.

## 6. Admin design

The admin uses the same tokens so it reads as the same product. Differences are
functional, not stylistic: a denser scale, a dark `--brand-900` sidebar, and a
cooler page background (`hsl(224 24% 97%)`) to separate tool from content.

All admin rules are **scoped under `.admin-wrap` / `.admin-login`**, because
`admin.css` is imported globally and unscoped rules previously collided with
`style.css` over `.alert` and `.admin-table`.

### Responsive admin
- **<900px:** sidebar → off-canvas drawer with scrim, Escape, scroll lock.
- **<900px:** tables → stacked cards; each `<td>` carries `data-label` and CSS
  renders it via `::before`, so data stays readable without horizontal scroll and
  without a separate mobile component.
- **<560px:** stat cards 2-up; quick actions stack full-width; dialog buttons stack.

## 7. Accessibility

Target: **WCAG 2.1 AA**.

- Semantic landmarks; skip link on public pages.
- Visible focus via `:focus-visible` with a 3px brand ring.
- `aria-expanded` / `aria-controls` on both the public and admin menu toggles.
- Dialogs: `aria-modal`, labelled, focus moved in, Escape to dismiss.
- Toasts use `role="status"` + `aria-live="polite"`.
- Decorative images use `alt=""`; icons are `aria-hidden`.
- `prefers-reduced-motion` disables fade-ins, shimmer and smooth scrolling.
- Tap targets ≥44px; inputs 16px to prevent iOS zoom-on-focus.

**Not yet verified:** no automated audit (axe/Lighthouse) or screen-reader pass has
been run. Colour-contrast ratios have not been formally measured. Tracked in
`06-Implementation-Plan.md`.

## 8. Motion

Easing `cubic-bezier(0.22, 1, 0.36, 1)`; durations 160ms (micro) / 280ms (standard)
/ 600ms (image zoom). Images fade in as they decode — deliberately with **no**
`fill-mode`, so if animations are ever suppressed the worst case is an image that
appears without fading, never one stuck invisible.
