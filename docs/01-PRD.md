# 01 — Product Requirements Document

**Product:** God's Vessels International Ministry (GVIM) website
**Live:** https://www.godsvesselinternationalministry.org
**Status:** In production
**Last updated:** 2026-10-08

> Scope note: this document is reconstructed from the shipped application. Items
> that could not be established from the code or from decisions recorded in git
> are marked **TBD** rather than invented.

## 1. Overview

A public website and self-service content system for God's Vessels International
Ministry, a family church in Edmonton, Alberta. The site tells visitors who the
church is, when it meets and where, shows the life of the congregation through
photography, publishes sermons, and receives enquiries. Church staff maintain all
of it themselves through a built-in admin area — no developer required for
day-to-day content.

## 2. Goals

1. **Be findable and legible to a newcomer.** Service times, location and contact
   details reachable without hunting.
2. **Show the church as it actually is**, using the congregation's own photographs
   rather than stock imagery.
3. **Let staff maintain content unaided** — upload photos, publish sermons, manage
   categories, read enquiries.
4. **Cost nothing to run.** The entire stack sits on free tiers (see `02-TRD.md`).

### Non-goals (current release)
- Online giving or payment processing. The "Give" action is a `mailto:` link.
  (Also a licensing constraint — see `02-TRD.md` §6.)
- Member accounts, logins or any personalisation for visitors.
- Event registration, rotas or small-group management.
- Multi-language content.

## 3. Target users

| User | Needs | Frequency |
|---|---|---|
| **Prospective visitor** | Service times, address, what the church is like, how to make contact | One or two visits before attending |
| **Existing member** | Sermons, photos of recent events, schedule changes | Occasional |
| **Church administrator** (single account) | Upload photos, add sermons, read enquiries, manage categories | Weekly |

The administrator is assumed to be non-technical and frequently working from a
phone — which is why the admin area is treated as a first-class responsive
surface, not a desktop-only tool.

## 4. Core features

### Public site — shipped
- **Home** — hero with the congregation's own photography, service schedule split
  weekly vs monthly, monthly theme, welcome section, gallery preview, testimonials.
- **About** — ministry story, vision and mission, pillars, leadership.
- **Gallery** — 91 photographs, filterable by category, with a lightbox.
- **Sermons** — listing with YouTube embeds or audio. *Currently empty: no sermons
  have been published yet.*
- **Contact** — enquiry form with validation, honeypot spam trap, and the church's
  address, phone and email.

### Admin — shipped
Single-account, cookie-authenticated. Dashboard with real counts; gallery upload
(direct-to-storage, multi-file, progress) and management with search and category
filter; sermon add/manage; category management; enquiry inbox with search and a
message reader.

### Known gaps
- **No sermons published.** The feature works; no content has been entered.
- **No email notification** when an enquiry arrives — staff must check the admin
  inbox. (Identified as the highest-value next feature; see `06-Implementation-Plan.md`.)
- **No analytics**, so none of the metrics in §6 can currently be measured.
- Instagram and X links in the footer are placeholders (`#`).

## 5. User stories

**Visitor**
- As someone considering visiting, I can see service times and the address without
  scrolling past a marketing banner, so I know whether I can attend this Sunday.
- As someone deciding whether this church suits me, I can look at real photographs
  of the congregation.
- As an enquirer, I can send a message and get clear feedback that it was received.

**Member**
- As a member, I can browse photographs from recent services and events.
- As a member, I can find a past sermon by title or speaker. *(Depends on sermons
  being published.)*

**Administrator**
- As an administrator on my phone, I can upload photographs from a service without
  needing a computer.
- As an administrator, I can read and delete enquiries, and reply by email in one tap.
- As an administrator, I am asked to confirm before anything is permanently deleted.
- As an administrator, I can add a category without understanding what a slug is.

## 6. Success metrics

Measurement landed in Phase 10. There are no targets yet — a baseline has to
accumulate first.

| Metric | Why it matters | Where to read it |
|---|---|---|
| Contact enquiries per month | Direct signal of newcomer interest | Admin dashboard, "Last 30 days" |
| Photos added per month | Whether staff can genuinely self-serve | Admin dashboard, "Last 30 days" |
| Share of sessions reaching /contact | Whether the site drives action | Vercel Web Analytics |
| Mobile share of sessions | Confirms the mobile-first emphasis | Vercel Web Analytics |
| Gallery engagement (photos opened) | Whether the photography earns its prominence | **Not measurable** |

Gallery engagement needs custom events, which Vercel Web Analytics offers on Pro
only. It remains unmeasured rather than approximated by something misleading.

Admin page views are excluded from analytics: staff traffic is not visitor
behaviour and would skew every ratio above.

## 7. Constraints

- **Budget: zero.** Every service must stay within a free tier.
- **Vercel's Hobby plan is non-commercial.** A `mailto:` giving link is defensible;
  real donation processing would require a paid plan.
- **Single administrator account.** No per-user accounts or audit trail.
- **Content is photograph-heavy** and supplied as candid phone photos in mixed
  orientations — the design must accommodate that rather than assume art direction.
