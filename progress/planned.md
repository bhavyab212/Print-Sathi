# Planned Goals & Architecture

This document tracks the original planned parameters, design rules, and architectural choices that guide the Print Sathi platform.

---

## 🎯 Product Mission & Goals

**Print Sathi** was planned to solve the operational friction of local Indian copy and print counters. Instead of forcing shopkeepers to adopt full-blown POS or inventory software, it targets the **5 most common counter tasks** and moves the data-entry and configuration onto the customer's phone via walk-in QR scans.

### Planned Core Task Automations:
1. **Passport Photo Generator:** Drag-and-drop crop to size with background removal.
2. **Print Bill Calculator:** Quick tally matching specific xerox rates.
3. **Fix & Print Document:** Clean formatting presets (Resumes, assignments) without manual scaling.
4. **Smart QR Print Queue:** Customers submit files to a live dashboard, eliminating WhatsApp/Email exchanges.
5. **Clean Scan PDF:** Multi-page camera scans adjusted to high-contrast document PDFs.

---

## 🏛️ Planned Design Rules (Non-Negotiable)

* **Shopkeeper Control:** Jobs are never printed automatically. The shopkeeper must review, approve, and initiate printing via the browser print dialog.
* **FIFO Queue Default:** The dashboard maintains a first-in, first-out sequence. Shopkeepers can drag-and-drop jobs to sort or mark them urgent.
* **Privacy-First Storage:** User uploads are deleted after 4 hours to keep database storage footprint within free limits and preserve client privacy.
* **Zero Customer Friction:** Walk-in customers scan a QR and submit documents instantly. No passwords, app downloads, or email registrations are required.
* **Memorable tokens:** Submitted jobs are identified using short 3-letter word tokens (e.g. FOX, OAK) instead of complex IDs for easy counter communication.
* **Multi-Tenancy:** The database schema is fully segregated. Every entity is bound to a `shop_id` with Row Level Security (RLS) policies blocking cross-shop leaks.

---

## 🌐 Planned Infrastructure & Stack

| Layer | Planned Service | Rationale |
|---|---|---|
| **Frontend Web** | Next.js 14 App Router | Fast Server-Side Rendering (SSR) for customer QR portals, API endpoint handlers, and unified codebase. |
| **Authentication** | Supabase Auth | Out-of-the-box shopkeeper credentials and secure passwords management. |
| **Database** | Supabase PostgreSQL | Relational storage + Realtime replication for instant counter updates. |
| **Image processing** | Python FastAPI (Render) | Direct binding to `opencv` and `rembg` (u2net model) for clean background cuts. |
| **PDF arrangement** | browser-side `pdf-lib` | Moves CPU layout rendering onto client machines, keeping server costs at zero. |
| **Deployments** | Vercel + Render | Free-tier hosting kept active using UptimeRobot pings on FastAPI routes. |
