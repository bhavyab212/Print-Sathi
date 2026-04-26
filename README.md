# Print Sathi

A multi-tenant SaaS workflow automation platform for local Indian print and xerox shops.

## What It Does

Converts the 5 most repeated daily counter tasks into guided digital flows:
- **Passport Photo Auto Generator** — background removal, face crop, A4 sheet
- **Print Bill Calculator** — itemised billing from the shop's rate card
- **Fix & Print Document** — PDF/DOCX/PPTX formatting, presets, 2-up/4-up layouts
- **Smart QR Print Queue** — customers submit jobs via phone, shopkeeper approves from dashboard
- **Clean Scan PDF** — deskew, enhance, export _(Phase 4, post-MVP)_

## Three Portals

| Portal | URL | Who uses it |
|--------|-----|------------|
| Customer | `/s/[shopSlug]` | Walk-in customers, students (phone) |
| Shopkeeper | `/dashboard` | Shop owner (desktop/tablet) |
| Admin | `/admin` | Platform operator |

## Tech Stack

- **Frontend:** Next.js 14 + Tailwind CSS + shadcn/ui
- **Backend:** Next.js API Routes + Python FastAPI (image processing)
- **Database:** Supabase (PostgreSQL + Realtime + Auth + Storage)
- **Deployment:** Vercel + Render + Supabase (all free tier for pilot)

## Getting Started

```bash
# Install dependencies
cd apps/web && npm install

# Set up environment
cp .env.example .env.local
# Fill in Supabase credentials

# Run development server
npm run dev

# Python processing service
cd apps/processing
pip install -r requirements.txt
uvicorn main:app --reload
```

## Project Files

| File | Purpose |
|------|---------|
| `CONTEXT.md` | Product vision, decisions, constraints — read before coding |
| `PROGRESS.md` | Phase-by-phase task checklist |
| `COMMITS.md` | Git commit plan and history |
| `PrintShop_PRD_v1.md` | Product Requirements Document (source of truth) |
| `print-shop-automation-platform.md` | Product Brief (source of truth) |

## Links

- **GitHub:** https://github.com/bhavyab212/Print-Sathi
- **Supabase Dashboard:** _(add after creating project)_
- **Vercel Dashboard:** _(add after deploying)_
- **Render Dashboard:** _(add after deploying)_

---

_Read `CONTEXT.md` before making any architectural decisions._