# Plan - Print Sathi Landing Page Redesign & Icon Migration

## Goal
Redesign the Print Sathi landing page to look premium, visually complete, and professional using sleek dark mode gradients, interactive glassmorphic panels, and bento grids. Generate and incorporate professional AI-generated assets, and replace all generic Boxicons with Lucide React icons in the primary files.

## Architecture & Scope
- **Target Files**:
  - Landing page: `apps/web/src/app/page.tsx`
  - Customer Upload page: `apps/web/src/app/s/[slug]/page.tsx`
  - Shopkeeper Dashboard page: `apps/web/src/app/dashboard/page.tsx`
  - Admin Panel: `apps/web/src/app/admin/AdminPanelClient.tsx`
- **Image Assets**:
  - Saved to `apps/web/public/images/`
- **Verification Commands**:
  - Build Check: `npm run build:web` or `cd apps/web && npm run build` (or `npx tsc --noEmit` under `apps/web`)

## Milestones

### Milestone 1: Exploration and Icon Inventory
- [ ] Explore target files to locate all generic Boxicons (`bx bx-...`).
- [ ] Audit the landing page (`page.tsx`) structure, hero section, and queue mockup placement.
- [ ] Determine design themes and generate suggestions for the abstract backdrop/image assets.
- [ ] **Gate**: Explorer handoff report with exact list of Boxicons to replace and page layout strategy.

### Milestone 2: AI Image Asset Generation
- [ ] Generate high-quality abstract glowing print network background or app mockup backdrop using image generation tools.
- [ ] Place generated assets in `apps/web/public/images/`.
- [ ] **Gate**: Image assets successfully generated, saved, and paths verified.

### Milestone 3: Implementation (Landing Page Redesign & Icon Migration)
- [ ] Redesign `apps/web/src/app/page.tsx` to include dark mode gradients, glassmorphic panels, ambient glow, bento grid, and the new generated background banner/backdrop.
- [ ] Migrated boxicons to Lucide React in `page.tsx`, `s/[slug]/page.tsx`, `dashboard/page.tsx`, and `AdminPanelClient.tsx`.
- [ ] Ensure proper imports, sizes, and colors match Print Sathi theme.
- [ ] **Gate**: Worker completes all code modifications and runs local build check.

### Milestone 4: Verification & Audit
- [ ] Verify that Next.js project compiles cleanly (`npm run build` or `npx tsc --noEmit`).
- [ ] Perform review and forensic audit to check for visual complete, premium layout, and authentic code logic.
- [ ] **Gate**: Forensic Auditor and Reviewer confirm CLEAN status and full compilation success.
