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

| Component | Technology | Notes |
| :--- | :--- | :--- |
| **Frontend Web** | Next.js 14 (App Router), React, Tailwind, shadcn/ui | Customer-facing QR pages + shopkeeper backup portal |
| **Desktop App** | Electron, React, Vite, Tailwind | Primary shopkeeper OS (Windows), auto-updater |
| **Backend API** | Supabase (PostgreSQL + PostgREST) | Direct DB access with RLS from both Web and Desktop |
| **Processing Service** | Python 3.12, FastAPI, rembg (u2net), OpenCV | Background removal and face cropping for passports |
| **Database** | PostgreSQL (Supabase) | Multi-tenant schema with Realtime |
| **Authentication** | Supabase Auth (Email/Password) | Shopkeepers only |
| **File Storage** | Supabase Storage | 4-hour auto-delete policy |
| **Hosting** | Vercel (Web), Render (Processing), GitHub Releases (Desktop) | Processing service kept alive via UptimeRobot |

---

## Desktop App Architecture

The **Print Sathi Desktop App** is the heart of the operation:
1. **Local Printing Engine:** Direct communication with connected thermal/laser printers (bypass browser dialogs).
2. **Auto-Updater:** Silent background updates via `electron-updater` to ensure feature parity without shopkeeper intervention.
3. **Queue Polling:** WebSocket connection to Supabase Realtime to push pending jobs to the UI immediately.
4. **Local Cache:** Temporary storage of current job files to ensure print success even if internet connectivity fluctuates during the print command.

---

## Key Design Decisions (Non-Negotiable)

1. **Shopkeeper Primary Interface is Desktop:** The Windows app is the main tool. The web dashboard is a backup.
2. **Shopkeeper Approves Everything:** Jobs submitted by customers via QR do not print automatically. They go to a pending queue for approval.
3. **Multi-tenant by Design:** Everything in the database must filter by `shop_id`.
4. **No Persisted Files:** Files must auto-delete after 4 hours. No exceptions.
5. **Word Tokens over IDs:** Jobs are identified by 3-letter words (e.g., FOX, SUN, OAK) that reset daily per shop, never UUIDs or long numbers.
6. **Rate limiting** — 3–5 submissions per phone/hour, resets on job completion
7. **FIFO queue default** — shopkeeper can drag-reorder; urgent jobs float to top
8. **Usage tracked from day one** — billing added separately later
9. **Job retention:** completed jobs auto-archive after 7 days OR manual clear
10. **Duplicate file prevention:** same phone + file hash within 10 min → warn customer
11. **File storage path convention:** `/{shop_id}/{job_id}/original.{ext}` and `preview.jpg`
12. **Rate card:** flexible rows (item_type, label, price) — deliberate improvement over fixed columns for extensibility

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
