# Pending Tasks Checklist

Below is the list of remaining tasks, features, and deployment requirements, organized by phase.

---

## Phase 1A: Passport Photo — Remaining Work
- [ ] Create a Supabase Storage bucket (`customer-uploads`) with a 4-hour automatic delete lifecycle policy to store uploaded images.
- [ ] Deploy the Next.js frontend to Vercel (free tier).
- [ ] Deploy the Python FastAPI processing service to Render (free tier).
- [ ] Set up UptimeRobot to ping the `/health` endpoint of the Render service every 15 minutes to prevent cold starts on the free tier.
- [ ] Perform end-to-end integration tests using 10+ real portraits (verifying HEIC files, dark/light hair cropping, and image sizes).
- [ ] Commit current local files: `feat(phase-1a): passport photo tool`.

---

## Phase 1B: Print Bill Calculator (Pending)
- [ ] Design Calculator UI panel on the dashboard (job type selector, copies, double-sided toggle).
- [ ] Load shopkeeper rate cards from Supabase via TanStack Query (cache locally).
- [ ] Program client-side bill calculation matching rate card rules.
- [ ] Set up `localStorage` backup to support calculations when offline.
- [ ] Add usage logging to track calculated bills (`bill_calc` event).

---

## Phase 2: Fix & Print Document (Pending)
- [ ] Expand file uploader to accept PDFs, Docx, PPTX, and standard image extensions.
- [ ] Set up headless LibreOffice conversion in the Python backend to convert Docx and PPTX files to PDF.
- [ ] Program preset layout cards (Notes, Assignment, Resume presets).
- [ ] Integrate browser-side PDF processing via `pdf-lib` (supporting N-up, landscape rotation, page range filtering, margins).
- [ ] Build interactive PDF previewer using `pdf.js`.
- [ ] Hook up document print flow using browser print dialogs.

---

## Phase 3: Smart QR Print Queue (Pending)
- [ ] Build the public walk-in customer submission landing page at `/s/[slug]`.
- [ ] Build walk-in job submission flow (upload file, specify copies/binding, type customer name + phone).
- [ ] Create word token generator pulling 3-letter nouns (e.g. FOX, SUN, OAK) from the `word_pool` table.
- [ ] Apply double-upload protection (checks file hash + phone number within 10-minute window).
- [ ] Set up client submission rate limits (3-5 jobs per hour per phone, resetting on job completion).
- [ ] Build customer live queue progress page using Supabase Realtime socket events.
- [ ] Build Shopkeeper live queue dashboard with list state badges.
- [ ] Implement drag-and-drop queue sorting using `@dnd-kit`.
- [ ] Coded Urgent status toggle (promotes job in database to top of the queue).
- [ ] Generate printable QR Code poster PDF for shop counters.

---

## Phase 4: Clean Scan PDF (Deferred)
- [ ] Revisit image enhancement filters (binarization, thresholding, contrast) post-MVP.

---

## Phase 5: Super Admin Panel & Polishing (Pending)
- [ ] Develop `/admin` dashboard restricted to administrative role users.
- [ ] Render multi-shop list with cumulative print logs and platform status metrics.
- [ ] Coded Demo Mode (`is_demo` flag) with seeded database rows and a dashboard reset button.
- [ ] Perform design overhaul (vibrant color styling, Lord Icons, LottieFiles micro-animations, glassmorphism overlays).
- [ ] Run full mobile responsiveness audit and review system-wide error handler fallbacks.
