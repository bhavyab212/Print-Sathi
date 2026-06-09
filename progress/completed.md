# Completed Tasks Checklist

Below is the exhaustive catalog of all tasks that have been fully developed and are operational in the local codebase.

---

## Phase 0: Foundation Setup (Fully Completed & Committed)

### Monorepo Setup & Frontend Base
- [x] Initialized Next.js 14 App Router project with TypeScript, Tailwind CSS, and shadcn/ui.
- [x] Organized monorepo structure with frontend web folder (`apps/web`) and backend service folder (`apps/processing`).
- [x] Designed responsive dashboard shell with sidebar menu, mobile-friendly overlay drawer, and landing page.
- [x] Implemented global design tokens for borders, typography, and accent colors in Tailwind config.
- [x] Added script configurations for workspace-wide task execution.

### Supabase Backend & Database
- [x] Created Supabase database schemas and ran initial migrations for:
  - `shops` (multi-tenant shop configuration)
  - `rate_cards` (pricing list for xerox/print services)
  - `jobs`, `job_items`, `job_status_log` (print queue entities)
  - `usage_logs` (analytics of features used by shops)
  - `rate_limits` (submission thresholds)
  - `word_pool` (queue tokens)
  - `admin_users` (super-admin table)
- [x] Applied Row Level Security (RLS) policies to all tables to guarantee multi-tenant boundary isolation.
- [x] Resolved PostgreSQL constraints by deploying timezone-safe immutable date functions for word tokens and flexible JSONB schemas.

### Authentication & Portal Routing
- [x] Formulated server/client/middleware supabase modules.
- [x] Developed login dashboard page (`/login`) with email validation and credentials auth.
- [x] Programmed protected route redirecting middleware guarding `/dashboard` and `/admin` portals.
- [x] Coded Shop Onboarding Wizard (`/onboarding`) ensuring that new shopkeepers must initialize their shop details and custom rate cards before entering the dashboard.

### Processing Microservice Setup
- [x] Initialized Python FastAPI application in `apps/processing`.
- [x] Created a CORS middleware security layer to allow request access from Next.js.
- [x] Configured endpoint `/health` for service heartbeat monitoring.

---

## Phase 1A: Passport Photo Generator (Local Implementation Complete)

### Backend Image Processing (`apps/processing/main.py`)
- [x] Configured background removal middleware using `rembg` (u2net model) with automatic fallback.
- [x] Built Haar Cascade classifier utility for face bounding detection (`_detect_face`).
- [x] Programmed ISO/Indian standard passport framing auto-cropper centering and adding appropriate headroom relative to the face box (`_crop_to_passport`).
- [x] Added `pillow-heif` opener to process HEIC/HEIF files natively.
- [x] Implemented `/passport/process` endpoint accepting file streams and returning base64 PNG data URIs.

### Frontend Passport Flow (`apps/web/src/app/dashboard/passport/`)
- [x] Developed drag-and-drop `FileDropzone` validating sizes (max 10MB) and formats (JPG, PNG, HEIC).
- [x] Created `PassportConfigPanel` offering preset dimensions (Indian, US, UK sizes), custom size controls, background picker, and copies selector.
- [x] Built `A4SheetPreview` which computes column/row spacing constraints and draws actual-scale passport photos onto a 96dpi Canvas grid.
- [x] Configured page print style overrides targeting the preview canvas so that browser `window.print()` outputs exactly A4 dimensions.
- [x] Designed custom endpoint `/api/usage/passport` integrating with Supabase to log shopkeeper prints for billing history.
