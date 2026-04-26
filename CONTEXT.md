# Print Sathi — Project Context

> **Last updated:** 2026-04-26
> **Status:** Phase 0 — Foundation Setup
> **Version:** 0.1.0

---

## What This Product Is

**Print Sathi** is a multi-tenant SaaS workflow automation platform for local Indian print and xerox shops. It converts the 4–5 most repeated daily counter tasks into guided digital flows that run from the customer's phone and are controlled by the shopkeeper's dashboard.

This is NOT a general-purpose print management suite. It is a focused shop helper built for the rhythms of a busy Indian print counter.

---

## The Three Portals

| Portal | Route | Users | Auth |
|--------|-------|-------|------|
| Customer QR Page | `/s/[shopSlug]` | Walk-in customers, students | Public — no login |
| Shopkeeper Dashboard | `/dashboard/*` | Shop owner | Email + password |
| Super Admin Panel | `/admin/*` | You (platform operator) | Email + password (admin role) |

---

## Core Features (Build Order)

| Phase | Feature | Status |
|-------|---------|--------|
| 0 | Foundation (auth, DB, shell, file upload pipeline) | 🔄 In Progress |
| 1A | Passport Photo Auto Generator | ⏳ Pending |
| 1B | Print Bill Calculator | ⏳ Pending |
| 2 | Fix & Print Document | ⏳ Pending |
| 3 | Smart QR Print Queue | ⏳ Pending |
| 4 | Clean Scan PDF | ⏳ Pending |
| 5 | Super Admin Panel | ⏳ Pending |

---

## Confirmed Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Next.js 14 (App Router) | SSR for QR page, API routes, single framework |
| Styling | Tailwind CSS + shadcn/ui | Fast, professional, solo-builder friendly |
| State | React Context + TanStack Query | Right-sized — Context for UI, Query for server state |
| Backend logic | Next.js API Routes | Keeps it simple for CRUD + queue |
| Image processing | Python FastAPI (Render + uptime bot) | OpenCV + Pillow + Rembg; uptime bot prevents sleep |
| PDF processing | pdf-lib in browser | No server cost, fast for layout tasks |
| Database | Supabase (PostgreSQL + Realtime) | Auth + DB + Storage + Live queue in one |
| File storage | Supabase Storage → Cloudflare R2 | 4-hour auto-delete; signed URLs |
| Auth | Supabase Auth (email+password + email reset) | Shopkeeper + admin only |
| Printing (Phase 1–2) | Browser print dialog | Zero setup, acceptable for MVP |
| Printing (Phase 3+) | System-controlled agent (TBD) | Windows-compatible, silent |
| Deployment | Vercel + Supabase + Render | All free tier for pilot |

---

## Key Design Decisions (Non-Negotiable)

1. **Shopkeeper always approves before printing** — no auto-print in v1
2. **Multi-tenant from day one** — every DB row has `shop_id`; RLS enforced
3. **4-hour file auto-delete** — privacy-first, no long-term document storage
4. **Unique word job tokens** — short memorable words (FOX, SUN, OAK) per job
5. **Customer QR page is fully public** — name + phone only, no login
6. **Rate limiting** — 3–5 submissions per phone/hour, resets on job completion
7. **FIFO queue default** — shopkeeper can drag-reorder; urgent jobs float to top
8. **Usage tracked from day one** — billing added separately later

---

## Icon & Asset Libraries (Preferred)

Use across all UI — no hard restriction, but prefer these:

| Library | Use for |
|---------|--------|
| **Boxicons** | General UI icons (sidebar, buttons, actions) |
| **LottieFiles** | Animated illustrations (loading, empty states, success) |
| **LottieFlow** | Micro-interaction animations (transitions, hover) |
| **Lord Icons** | Animated icons (feature cards, onboarding) |
| **Iconsax** | Alternate icon set (where Boxicons lacks coverage) |

---

## File Types Supported

| Type | Extensions | Processing |
|------|-----------|-----------|
| Images | JPG, PNG, JPEG, HEIC | Browser or Python |
| PDF | PDF | pdf-lib (browser) |
| Word | DOC, DOCX | LibreOffice headless (Python) → PDF |
| PowerPoint | PPT, PPTX | LibreOffice headless (Python) → PDF |
| Max size | 50MB | Validated client + server side |

---

## Hosting & Free Tiers

| Service | What for | Free limit |
|---------|---------|-----------|
| Vercel | Next.js frontend + API routes | 100GB bandwidth/month |
| Supabase | DB + Auth + Storage + Realtime | 500MB DB, 1GB storage, 2 projects |
| Render | Python FastAPI (kept alive via UptimeRobot) | 512MB RAM, 0.1 vCPU, free tier + uptime bot |
| Cloudflare R2 | File storage (future) | 10GB free, zero egress |

---

## Repository

- **GitHub:** https://github.com/bhavyab212/Print-Sathi
- **Local:** `/media/bhavya/backup and etc/Project/Printo_`

---

## Source Documents

- `PrintShop_PRD_v1.md` — Product Requirements Document
- `print-shop-automation-platform.md` — Product Brief

---

## Do Not Drift Into

- Inventory management
- Deep GST/accounting
- Multi-staff accounts (v1)
- Online payment collection (v1)
- Native mobile app
- Multi-branch enterprise features
- Complex template libraries
- Auto-print without shopkeeper approval (ever in v1)
