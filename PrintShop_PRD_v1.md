# PrintShop Platform — Product Requirements Document

**Version:** 1.0 | **Status:** Draft | **Audience:** Engineering / Design
**Platform:** Web (mobile-first PWA) | **Scope:** MVP v1

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Build Order and Phased Roadmap](#2-build-order-and-phased-roadmap)
3. [Shop Onboarding Flow](#3-shop-onboarding-flow)
4. [Feature Specifications](#4-feature-specifications)
5. [UX and Interaction Rules](#5-ux-and-interaction-rules)
6. [System Architecture](#6-system-architecture)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Operational Scenarios](#8-operational-scenarios)
9. [Out of Scope for v1](#9-out-of-scope-for-v1)
10. [Success Criteria](#10-success-criteria)
11. [Pricing and Business Model](#11-pricing-and-business-model)

---

## 1. Product Overview

### 1.1 Vision

PrintShop Platform is a lightweight, web-based workflow tool for local print and xerox shops. It converts the 5–10 repetitive manual tasks that happen dozens of times a day into structured, semi-automated flows that a customer can initiate from their phone and a shopkeeper can approve in seconds.

The product is not a general-purpose office suite. It is a focused shop helper — fast to learn, fast to use, and built around the rhythms of a busy counter.

### 1.2 Problem Statement

Local print shops repeat the same small tasks all day: editing passport photos, fixing badly formatted documents, cleaning low-quality scans, and managing an informal queue of walk-in customers. Almost all of it is done manually, leading to:

- Customers waiting while the shopkeeper edits files one by one
- Mistakes occurring because settings are communicated verbally
- Rush hours creating chaos with no queue visibility
- Repeated explanation of print settings to every customer
- No record of jobs, making disputes hard to resolve

### 1.3 Target Users

| User | Where they interact | Primary goal |
|---|---|---|
| Shopkeeper | Dashboard (desktop / tablet) | Process more jobs faster with less manual work |
| Customer | QR landing page (phone) | Submit print job from phone without waiting at counter |
| Student / walk-in | QR landing page (phone) | Use advanced settings for notes, assignments, forms |

### 1.4 Product Goals

1. Save significant time for the shopkeeper on every shift
2. Reduce manual file editing to near zero for common job types
3. Organise customer requests into a visible, ordered queue
4. Make the shop feel modern and trustworthy to customers
5. Support both beginner and advanced users without separate flows
6. Increase the number of jobs a shop can process per hour

---

## 2. Build Order and Phased Roadmap

Phases are ordered by increasing technical complexity. Each phase must be validated in a real shop before the next begins. Do not start Phase 2 until Phase 1 is in daily use by at least one shop.

| Phase | What to build | Why first | Done when |
|---|---|---|---|
| **1A** | Passport Photo Tool | Simplest to build. Best live demo. Sells the product. | Upload → auto-process → print-ready PDF in under 30 seconds |
| **1B** | Print Bill Calculator | Used on every transaction. Builds daily habit fastest. | Shopkeeper logs job type and quantity, gets itemised total |
| **2** | Fix & Print Document | High student demand. Medium build complexity. | Upload PDF → layout correction → approval → print |
| **3** | QR Print Queue | Highest complexity. Needs real feedback to design correctly. | Customers submit via QR, shopkeeper approves from dashboard, live status visible |
| **4** | Clean Scan PDF | Hardest feature technically. Needs dedicated pipeline. | Upload phone photo → auto-enhance → clean PDF output |

> **Note:** Phase 1A and 1B can be built in parallel. They share no backend dependencies and should both be live before Phase 2 begins.

---

## 3. Shop Onboarding Flow

Onboarding determines whether a shop activates after purchase. It must be completable in under five minutes on first visit. There is no separate admin panel in v1.

### 3.1 Required Setup Steps (Day 1)

1. Shop owner opens platform URL on desktop or tablet
2. Enters shop name, area/locality, and phone number
3. Sets rate card: per-page prices for B&W, colour, A3, photo print, lamination, spiral binding
4. Prints the QR code poster (auto-generated with shop name on it)
5. Sticks QR code on the counter or near the printer

### 3.2 What Activates Automatically

- Unique shop ID assigned and linked to the QR code
- Bill calculator pre-loaded with the entered rate card
- Queue dashboard ready at the shopkeeper's URL
- Passport photo tool live immediately — no configuration needed

> The rate card set during onboarding feeds directly into the bill calculator. If the shopkeeper changes prices later, they update it in one place and all calculations update instantly.

---

## 4. Feature Specifications

---

### 4.1 Feature 1 — Passport Photo Auto Generator

**Phase:** 1A | **Priority:** Critical | **Build effort:** Low

#### What it does

Accepts a portrait photo and returns a print-ready A4 sheet with multiple passport-sized copies, correct background, face crop, and margins — with zero manual editing by the shopkeeper.

#### User flow

1. Customer uploads portrait photo (phone camera or file)
2. Selects background colour (white by default, custom on request)
3. Selects copy count or sheet layout (2, 4, 6, or 8 copies)
4. System removes background, detects and centres face, sizes photo to passport dimensions
5. Print-ready A4 PDF preview shown
6. Shopkeeper reviews and approves
7. Job sent to printer

#### Required capabilities (v1)

- Automatic background removal
- Face detection and centring
- Standard passport photo dimensions (35mm × 45mm default)
- White background as default; selectable common colours
- Multiple copies arranged on A4 with even spacing
- Print preview before shopkeeper approval

#### Optional capabilities (v2+)

- Country-specific passport and visa size presets
- Brightness and contrast auto-correction
- Batch processing for multiple customers
- Save customer photo template for reuse

#### Acceptance criteria

- Background removed cleanly on a standard portrait photo in under 5 seconds
- Output PDF fits correctly on A4 with no clipping or overflow
- Process requires zero manual editing by shopkeeper for a standard photo

---

### 4.2 Feature 2 — Print Bill Calculator

**Phase:** 1B | **Priority:** Critical | **Build effort:** Very Low

#### What it does

Calculates the correct bill for any mix of print job types in seconds, using the shop's own rate card. Eliminates mental arithmetic, underbilling, and pricing inconsistency.

#### User flow

1. Shopkeeper opens calculator on dashboard
2. Taps job type: B&W / colour / A3 / photo print / lamination / spiral binding
3. Enters quantity for each type
4. System calculates total using the shop's saved rate card
5. Itemised bill shown on screen — optionally printed or shared via WhatsApp

#### Required capabilities (v1)

- Support for at least 6 job types: B&W print, colour print, A3 print, photo print, lamination, spiral binding
- Rates pulled from the shop's rate card set during onboarding
- Itemised total with per-line breakdown visible
- One-tap reset for the next customer

#### Optional capabilities (v2+)

- GST toggle (add 18% automatically)
- WhatsApp bill sharing with customer
- Daily earnings summary from bill log

#### Acceptance criteria

- Bill calculated in under 2 taps from opening the calculator
- Rate card changes reflect immediately without page reload
- No calculation errors when mixing multiple job types in one bill

---

### 4.3 Feature 3 — Fix & Print Document

**Phase:** 2 | **Priority:** High | **Build effort:** Medium

#### What it does

Accepts a poorly formatted PDF or document and prepares it for clean printing — adjusting margins, scaling to fit, arranging multiple pages per sheet, and generating a print-ready output.

#### User flow

1. Customer uploads PDF or document via QR page or at counter
2. System detects file type and suggests the appropriate preset
3. Customer selects a preset or opens advanced settings
4. Preview of corrected output shown
5. Shopkeeper approves and sends to printer

#### Quick presets (visible by default)

| Preset name | What it configures |
|---|---|
| Notes / compact | 2 pages per sheet, B&W, fit to page |
| Assignment | Single page, B&W, standard margins, fit to page |
| Resume | Single page, colour, normal margins |
| Booklet | Page order rearranged for saddle-stitch binding |

#### Advanced settings (collapsed by default)

- Pages per sheet: 1 / 2 / 4
- Orientation: portrait / landscape
- Sides: single / double-sided
- Scaling: fit to page / actual size / custom %
- Page range selection
- Colour mode: colour / B&W

#### Acceptance criteria

- Preset applies all settings in one tap — no manual adjustment needed
- Advanced settings are not visible on screen unless user expands them
- Preview accurately reflects the printed output before approval

---

### 4.4 Feature 4 — Smart QR Print Queue

**Phase:** 3 | **Priority:** High | **Build effort:** High

#### What it does

Lets customers submit print jobs from their own phone by scanning a QR code at the shop, reducing counter crowding and manual file transfer while giving the shopkeeper a real-time queue dashboard.

#### Customer flow

1. Customer scans QR code displayed at shop counter
2. Lightweight web page opens on phone — no app install required
3. Customer enters name and phone number
4. Uploads file (photo, PDF, document)
5. Selects basic options: B&W or colour, number of copies, paper size
6. Optionally expands advanced settings
7. Submits job — sees confirmation screen with queue position number

#### Shopkeeper flow

1. New job appears in live queue on dashboard
2. Shopkeeper sees file preview and settings summary
3. Taps Approve, Edit, or Reject
4. Approved job moves to Printing status
5. Completed job moves to the completed section

#### Job status lifecycle

| Status | Meaning |
|---|---|
| **Submitted** | Job received, waiting for shopkeeper review |
| **Approved** | Shopkeeper has verified and approved the job |
| **Printing** | Job sent to printer |
| **Completed** | Print successful, moved out of active queue |
| **Rejected** | Shopkeeper rejected — logged separately, customer notified |

#### Queue integrity rules

- Every job has a unique identifier assigned at submission
- Jobs maintain submission order unless shopkeeper manually reprioritises
- All status transitions are timestamped and logged
- Completed and rejected jobs move out of the active view automatically
- Shopkeeper dashboard supports filtering by status

#### Critical design rule

> Print must not be automatic in v1. The shopkeeper must approve every job before it reaches the printer. This is non-negotiable in the first version.

#### Acceptance criteria

- Customer completes submission in under 60 seconds from QR scan
- New job appears on shopkeeper dashboard within 2 seconds of submission
- Queue remains stable and ordered with 5 or more simultaneous jobs
- Status visible to customer on their phone without manual refresh

---

### 4.5 Feature 5 — Clean Scan PDF

**Phase:** 4 | **Priority:** Medium | **Build effort:** High

#### What it does

Takes a photo or scan of a document — often captured on a phone camera — and produces a clean, straight, readable PDF by correcting tilt, removing shadows, improving contrast, and compressing the file.

#### User flow

1. Customer uploads scanned image or phone photo of a document
2. System processes automatically: straighten, crop edges, enhance
3. Cleaned preview shown alongside the original for comparison
4. User or shopkeeper approves
5. Output exported as a compressed PDF

#### Required processing steps

- **Deskewing** — detect and correct document tilt
- **Edge crop** — remove surrounding surface or background
- **Contrast enhancement** — improve readability of text
- **Shadow reduction** — correct uneven phone camera lighting
- **Background cleaning** — whiten paper background
- **PDF compression** — output under 2MB for a standard A4 page

#### Quality constraint

The system must not alter, redact, or visually modify the actual content of the document. Only presentation quality (clarity, alignment, brightness) should change. This is both a product principle and a trust requirement.

#### Technical note

> This feature requires a dedicated image processing pipeline (OpenCV or equivalent) and is the most technically complex feature in the platform. Allocate at least twice the build time of any other feature. Validate output quality on a representative set of 20+ real scanned documents before shipping.

#### Acceptance criteria

- Deskewing corrects tilts up to 15 degrees accurately
- Output PDF is readable and professional-looking for a standard phone-camera scan
- Original content is never altered or partially obscured

---

## 5. UX and Interaction Rules

### 5.1 Core UX Principles

| Principle | What it means in practice |
|---|---|
| Simple first, advanced second | All features work with zero configuration. Advanced settings exist but are collapsed by default. |
| Fast workflow | Customer uploads and submits in under 60 seconds. Shopkeeper approves in under 5 seconds. |
| Human approval before print | No job reaches the printer without shopkeeper confirmation. Non-negotiable in v1. |
| Mobile-first customer side | QR landing page optimised for phones. All tap targets minimum 44px. No horizontal scroll. |
| Shopkeeper-first dashboard | Every screen reduces the shopkeeper's work, not adds to it. One visible action per job. |

### 5.2 Interaction Rules

- After submission, user must always see a confirmation screen with a job reference number
- Job status must be continuously visible — do not require the user to manually refresh
- Prevent duplicate submissions from repeated taps on the submit button
- Always show a preview before final submission or shopkeeper approval
- Auto-detect uploaded file type and suggest the correct workflow
- All loading or processing states must show a visible indicator
- Error messages must be in plain language — never show raw technical errors to end users
- Navigation flow must be consistent across all features

### 5.3 Quick Presets System

Presets are the primary entry point for most customers. They must appear before advanced settings on every feature screen.

- Each preset auto-configures all relevant settings in one tap
- Preset names must describe the use case, not the technical setting (e.g. **Notes** not *2-up landscape B&W*)
- User can override any preset setting by expanding advanced options below it
- Presets should cover at least 80% of real-world job types without any advanced configuration needed

---

## 6. System Architecture

### 6.1 Interface Layers

| Layer | Components |
|---|---|
| Customer-facing | QR scan landing page — file upload — basic settings — optional advanced settings — submit — confirmation screen |
| Shopkeeper dashboard | Live queue — job preview pane — approve / edit / reject — completed jobs — bill calculator — rate card settings |
| Admin / config | Shop profile — rate card — QR poster generator — printer settings (v2) — usage logs (v2) |

### 6.2 Job Data Structure

Every job in the queue must contain at minimum:

- Unique job ID (system-generated)
- Customer name and contact number
- File reference (secure URL, time-limited)
- Workflow type: `photo` / `document` / `scan`
- Selected print settings as a structured object
- Submission timestamp
- Current status with a full status change log
- Preview image reference

### 6.3 Extensibility Requirements

The system must be built modularly so new shop types and workflows can be added later without rebuilding core infrastructure.

- Each feature is an independent module — passport photo, bill calculator, document fixer, queue, scan cleaner
- New workflows can be added without modifying existing ones
- UI components (file uploader, preview pane, settings panel) are reusable across all features
- Backend processing services are separable and independently deployable

---

## 7. Non-Functional Requirements

### 7.1 Performance

- File upload completes without noticeable delay on a 4G mobile connection
- Image processing (passport photo, scan clean) completes in under 8 seconds
- Queue updates appear on shopkeeper dashboard within 2 seconds of customer submission
- Dashboard remains responsive with up to 20 simultaneous jobs in the queue

### 7.2 Security and Privacy

- All uploaded files are stored under authenticated, time-limited access URLs — never public
- Files are deleted automatically after job completion or within 24 hours, whichever comes first
- Only the minimum required customer data is collected (name, phone for queue contact)
- All file transfers use HTTPS
- No customer file is ever accessible to another customer

### 7.3 Failure Handling

| Failure type | Required behaviour |
|---|---|
| Upload failure | Show retry option — do not lose settings already entered |
| Processing failure | Notify user in plain language, allow retry without re-uploading the file |
| Print failure | Keep job in queue with failed status — do not remove it |
| Dashboard disconnection | Show warning banner, attempt auto-reconnect silently |
| Fallback | Allow shopkeeper to manually download the job file and print locally |

All failures must be logged with timestamp and error type for debugging.

### 7.4 Logging and Monitoring

- Log every job creation, status change, and completion with timestamps
- Log all processing errors with file type, feature name, and error code
- Maintain rolling 30-day job history viewable by shopkeeper
- Track system performance events: upload times, processing durations, queue depth

---

## 8. Operational Scenarios

These scenarios must guide development, QA testing, and UAT in a real shop environment.

### Scenario A — Student printing notes

- Student scans QR at shop, uploads multi-page PDF
- Selects **Notes / compact** preset — 2 pages per sheet, B&W
- Submits — receives confirmation with queue number
- Shopkeeper sees job, reviews 2-up preview, approves
- Pages print correctly without any manual file editing by shopkeeper

### Scenario B — Passport photo customer

- Customer uploads portrait photo on their own phone or on the counter device
- Selects white background, 6 copies on A4
- System removes background, centres face, generates sheet
- Shopkeeper reviews — approves — sheet prints
- Total elapsed time under 90 seconds

### Scenario C — Rush hour queue

- Four customers submit jobs within 2 minutes via QR
- All four appear in shopkeeper queue in submission order
- Shopkeeper processes sequentially — taps Approve on each
- Each customer's status updates on their own phone automatically
- No customer needs to approach the counter unless called

### Scenario D — Low-quality scan

- Customer uploads phone photo of a document taken at an angle under dim light
- System deskews, crops edges, enhances contrast
- Before/after preview shown — customer approves
- Shopkeeper approves — clean PDF printed

### Scenario E — Mixed document job

- Customer uploads multiple files needing different layouts
- System allows merge, reorder, and per-section layout selection
- Final combined preview generated
- Shopkeeper approves single combined job — one print run

---

## 9. Out of Scope for v1

The following must not be built in the first version. They may be considered for v2 after the core workflow is validated in real shops.

| Feature | Reason deferred |
|---|---|
| Full inventory management | Out of scope for workflow automation — separate product category |
| Business analytics dashboard | Needs 30+ days of real data before it is meaningful |
| Multi-staff accounts | Single-owner shops in v1 — complexity not justified yet |
| Automated payment collection | Cash remains dominant — adds friction and compliance complexity |
| Custom template library | Low frequency. Distraction from core workflow. |
| Mobile app (iOS / Android) | PWA covers the use case. Native app is post-validation. |
| Government form auto-fill | High-value but requires per-form template research — Phase 5 candidate |

---

## 10. Success Criteria

### 10.1 Quantitative targets (measured at 30 days post-launch)

| Metric | Target |
|---|---|
| Passport photo jobs completed without shopkeeper editing | 95% or more |
| Time from photo upload to print-ready PDF | Under 30 seconds |
| Customer QR submission to confirmation received | Under 60 seconds |
| Bill calculation errors reported by shopkeeper | Zero |
| Daily active use of bill calculator by subscribed shops | 80% of shifts |
| Shop retention after 30-day trial | 60% or more |

### 10.2 Qualitative targets

- Shopkeeper can demonstrate any feature to a new customer without opening documentation
- A student with no prior training can submit a print job in under 60 seconds
- No customer complaint about file privacy or data handling
- Queue dashboard is used on every shift, not just occasionally

---

## 11. Pricing and Business Model

Two pricing models are viable and can be offered simultaneously to let shops self-select based on confidence level.

| Model | How it works | Best for |
|---|---|---|
| Monthly subscription | ₹99–299/month for unlimited tool access per shop | Established shops using the platform daily |
| Per-use credits | Buy a pack (e.g. ₹99 = 50 credits). Each tool use costs 1 credit. | New shops testing the platform or low-volume shops |

**Recommendation:** Launch with per-use credits only. Once shops are using the platform daily, offer a subscription upgrade that is cheaper per-use at high volume. This creates a natural conversion path with no hard sell required.

---

*PrintShop Platform PRD v1.0 — for internal use only*
