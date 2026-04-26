# Print Sathi — Progress Tracker

> Auto-updated as phases complete. Each item links to its commit.

---

## Current Phase: Phase 1A — Passport Photo

**Started:** 2026-04-26
**Target:** Upload portrait → auto background removal → A4 sheet → print

### Phase 0 Checklist ✅ COMPLETE

#### Project Setup
- [x] Initialize Next.js 14 project (TypeScript + Tailwind + shadcn/ui)
- [x] Create monorepo structure (`apps/web`, `apps/processing`)
- [x] Set up `.env.local` and `.env.example` templates
- [x] Configure Tailwind + shadcn design tokens

#### Supabase
- [x] Create Supabase project (dev) — Mumbai region
- [x] Run all DB migrations (shops, rate_cards, jobs, job_items, job_status_log, rate_limits, usage_logs, word_pool, admin_users)
- [x] Enable Row Level Security on all tables
- [x] Schema fixes migration (workflow_type, calculated_bill, is_demo, file_hash, archived_at)
- [ ] Set up Supabase Storage bucket with 4-hour lifecycle policy

#### Auth & Routing
- [x] Shopkeeper login page (`/login`) with password reset
- [x] Session management (Supabase middleware)
- [x] Protected routes (`/dashboard/*`)
- [x] Admin-only routes (`/admin/*`)
- [x] Public routes (`/s/[slug]`)
- [x] Onboarding wizard (shop name, area, phone, rate card)
- [x] Auto-redirect to onboarding if no shop exists

#### Dashboard Shell
- [x] Sidebar layout with navigation
- [x] Empty queue view
- [x] Responsive sidebar (hamburger + backdrop on mobile)
- [x] Landing page (dark gradient hero + feature cards)

#### Python Processing Service
- [x] Initialize FastAPI project (`apps/processing`)
- [x] Health check endpoint
- [ ] Deploy to Render (free tier + UptimeRobot)
- [ ] Test connectivity from Next.js

#### Deployment
- [ ] Deploy Next.js to Vercel
- [ ] Deploy Python to Render + configure UptimeRobot ping

#### Commits
- [x] `chore: init repo — context, progress, architecture docs`
- [x] `feat(phase-0): foundation — Next.js app, Supabase auth, dashboard shell, Python service`
- [ ] `fix(phase-0): architecture audit — schema fixes, onboarding, missing docs`

---

## Phase 1A — Passport Photo (Pending)

- [ ] File uploader component (drag+drop, JPG/PNG/HEIC, max 10MB)
- [ ] Passport size configurator (Indian, US, UK presets + custom mm)
- [ ] Copies selector + minimum enforcement from rate card
- [ ] Background color picker (white default + custom hex)
- [ ] Rembg API integration (Next.js → Python service)
- [ ] Face detection + auto-crop (Python side)
- [ ] Face crop preview screen
- [ ] A4 sheet layout generator (Canvas API or pdf-lib)
- [ ] Browser print flow (`window.print()`)
- [ ] Usage logging (`passport_photo` event)
- [ ] Test with 10+ real portrait photos
- [ ] Commit: `feat(phase-1a): passport photo tool`

---

## Phase 1B — Bill Calculator (Pending)

- [ ] Calculator UI (job type buttons + quantities + total)
- [ ] Rate card loaded from Supabase (TanStack Query, cached)
- [ ] Client-side calculation
- [ ] localStorage offline fallback
- [ ] One-tap reset
- [ ] Usage logging (`bill_calc` event)
- [ ] Commit: `feat(phase-1b): bill calculator`

---

## Phase 2 — Fix & Print Document (Pending)

- [ ] File uploader (PDF + JPG + PNG + DOCX + PPTX + HEIC)
- [ ] DOCX/PPTX → PDF conversion (LibreOffice in Python service)
- [ ] Preset cards (Notes, Assignment, Resume)
- [ ] Advanced settings panel (collapsed by default)
- [ ] pdf-lib browser processing (2-up, 4-up, rotate, page range, fit)
- [ ] PDF preview (pdf.js)
- [ ] A4/A3 selector + duplex flag
- [ ] Browser print flow
- [ ] Commit: `feat(phase-2): fix and print document`

---

## Phase 3 — Smart QR Print Queue (Pending)

- [ ] Customer QR landing page (`/s/[slug]`)
- [ ] Job submission flow (upload → settings → name+phone → submit)
- [ ] Word token generation + uniqueness check
- [ ] Duplicate file prevention (phone + file hash within 10 min)
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

## Phase 5 — Super Admin Panel + Polish (Pending)

- [ ] Admin login (separate role check)
- [ ] Shops list with usage stats
- [ ] Shop detail (usage, rate card, suspend/activate)
- [ ] Platform analytics (daily jobs, feature breakdown)
- [ ] Usage log view
- [ ] Demo mode (`is_demo` flag, seed data, reset button)
- [ ] Full UI overhaul (premium design, Lottie animations, polished layouts)
- [ ] Mobile responsiveness audit
- [ ] Error handling polish (plain language, retry buttons)
- [ ] Commit: `feat(phase-5): super admin panel + polish`

---

## Completed Commits Log

| Date | Commit | Description |
|------|--------|-------------|
| 2026-04-26 | `chore: init repo` | Project setup, CONTEXT.md, PROGRESS.md, COMMITS.md |
| 2026-04-26 | `feat(phase-0): foundation` | Next.js app, Supabase auth, dashboard shell, Python service, DB schema + RLS |

---

## Known Issues / Blockers

- Node.js 18 deprecation warning from Supabase (upgrade to 20+ eventually)
- Vercel + Render deployments not done yet (local dev only for now)
- Supabase Storage bucket not yet created (needed for file uploads in Phase 1A)

---

## Decisions Made After Build Started

1. **Rate card structure:** Changed from fixed columns to flexible rows (`item_type`, `label`, `price`) for extensibility. Shopkeepers can add custom item types.
2. **job_settings merged into job_items:** Architecture had separate `job_settings` table; we use `settings` JSONB column on `job_items` for simpler queries.
3. **Timezone-safe word token index:** User added `to_date_utc()` immutable function for the unique word token constraint.
4. **UI polish deferred:** Functional first, full visual overhaul after all features work.
5. **Python hosting:** Changed from Fly.io to Render + UptimeRobot (user's choice — uptime bot keeps free tier awake).
