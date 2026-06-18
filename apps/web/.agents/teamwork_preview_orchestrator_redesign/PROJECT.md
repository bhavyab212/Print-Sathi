# Project: Print-Sathi UI Redesign

## Architecture
- **Tech Stack**: Next.js 14, Tailwind CSS, Supabase
- **Core Requirement**: WhatsApp-style conversational flow for Customer and Shopkeeper views.
- **Design System**: Stitch-compliant Master Design System derived from local design files.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Design System Integration | Process `/media/bhavya/backup and etc/Project/Printo_/design_files` using Stitch MCP tools, resolve token collisions, apply to Next.js global CSS & Tailwind | none | IN_PROGRESS (62ca9016-4bbf-441a-9909-77d7ae413c5a) |
| 2 | Customer UI Redesign | Redesign Customer QR Upload Page (`src/app/s/[slug]/page.tsx`) to WhatsApp-style bot flow, preserving file upload logic | M1 | PLANNED |
| 3 | Shopkeeper Dashboard Redesign | Redesign Shopkeeper view into a two-column chat manager view, preserving logic | M1 | PLANNED |
| 4 | Build Integrity & QA | Ensure `npm run build` succeeds, resolve TS errors, verify E2E features (HEIC, PDF merge, etc.) | M2, M3 | PLANNED |

## Interface Contracts
### Design ↔ UI
- Tailwind CSS will use standard variable conventions established by the Stitch Design System.
### Chat UI ↔ Supabase Logic
- UI components will map to existing handlers (e.g., `combineSelected`, upload handlers) without modifying core file parsing logic.
