# Print Sathi — Progress Tracker

> Auto-updated as phases complete. Each item links to its commit.

---

## Current Phase: Phase 0 — Foundation

**Started:** 2026-04-26
**Target:** Running app skeleton with auth, DB, and deployment

### Phase 0 Checklist

#### Project Setup
- [ ] Initialize Next.js 14 project (TypeScript + Tailwind + shadcn/ui)
- [ ] Create monorepo structure (`apps/web`, `apps/processing`)
- [ ] Set up `.env.local` and `.env.production` templates
- [ ] Configure Prettier + ESLint
- [ ] Initial commit + push to GitHub

#### Supabase
- [ ] Create Supabase project (dev)
- [ ] Run all DB migrations (shops, rate_cards, jobs, job_settings, job_status_log, rate_limits, usage_logs, word_pool, admin_users)
- [ ] Enable Row Level Security on all tables
- [ ] Configure Supabase Auth (email + password, email reset via Resend)
- [ ] Set up Supabase Storage bucket with 4-hour lifecycle policy

#### Auth & Routing
- [ ] Shopkeeper login page (`/login`)
- [ ] Session management (Supabase middleware)
- [ ] Protected routes (`/dashboard/*`)
- [ ] Admin-only routes (`/admin/*`)
- [ ] Public routes (`/s/[slug]`)

#### Dashboard Shell
- [ ] Sidebar layout with navigation
- [ ] Onboarding wizard (shop name, area, phone, rate card)
- [ ] Empty queue view

#### Python Processing Service
- [ ] Initialize FastAPI project (`apps/processing`)
- [ ] Health check endpoint
- [ ] Deploy to Koyeb (free tier)
- [ ] Test connectivity from Next.js

#### Commit
- [ ] Commit: `feat(phase-0): foundation — auth, DB schema, dashboard shell, Python service`

---

## Phase 1A — Passport Photo (Pending)

- [ ] File uploader component
- [ ] Passport size configurator
- [ ] Copies selector + minimum enforcement
- [ ] Background color picker
- [ ] Rembg API integration (Next.js → Python)
- [ ] Face crop preview
- [ ] A4 sheet preview
- [ ] Browser print flow
- [ ] Usage logging
- [ ] Commit: `feat(phase-1a): passport photo tool`

---

## Phase 1B — Bill Calculator (Pending)

- [ ] Calculator UI (job type buttons + quantities + total)
- [ ] Rate card loaded from Supabase
- [ ] Client-side calculation
- [ ] localStorage offline fallback
- [ ] One-tap reset
- [ ] Usage logging
- [ ] Commit: `feat(phase-1b): bill calculator`

---

## Phase 2 — Fix & Print Document (Pending)

- [ ] File uploader (PDF + JPG + PNG + DOCX + PPTX)
- [ ] DOCX/PPTX → PDF conversion (LibreOffice in Python service)
- [ ] Preset cards (Notes, Assignment, Resume)
- [ ] Advanced settings panel (collapsed)
- [ ] pdf-lib browser processing (2-up, 4-up, rotate, page range, fit)
- [ ] PDF preview (pdf.js)
- [ ] A4/A3 selector
- [ ] Duplex flag
- [ ] Browser print flow
- [ ] Commit: `feat(phase-2): fix and print document`

---

## Phase 3 — Smart QR Print Queue (Pending)

- [ ] Customer QR landing page (`/s/[slug]`)
- [ ] Job submission flow (upload → settings → name+phone → submit)
- [ ] Word token generation + uniqueness check
- [ ] Rate limiting (3–5/hour per phone, reset on completion)
- [ ] Customer status page with Supabase Realtime
- [ ] Queue dashboard (live list, status badges)
- [ ] Job detail slide-over (preview + approve/reject/edit)
- [ ] Drag-to-reorder (`@dnd-kit`)
- [ ] Urgent flag (manual + auto on print failure)
- [ ] QR code poster generator
- [ ] Job history with search
- [ ] Commit: `feat(phase-3): smart qr print queue`

---

## Phase 4 — Clean Scan PDF (Deferred)

> Not in MVP. Revisit after Phase 3 is in daily use.

---

## Phase 5 — Super Admin Panel (Pending)

- [ ] Admin login
- [ ] Shops list with usage stats
- [ ] Shop detail (usage, rate card, suspend/activate)
- [ ] Platform analytics
- [ ] Usage log view
- [ ] Commit: `feat(phase-5): super admin panel`

---

## Completed Commits Log

| Date | Commit | Description |
|------|--------|-------------|
| 2026-04-26 | `chore: init repo — context, progress, architecture docs` | Project setup |

---

## Known Issues / Blockers

_None yet — Phase 0 starting_

---

## Decisions Made After Build Started

_Any mid-build decisions go here to keep CONTEXT.md clean_
