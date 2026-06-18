# Scope: Tier 1 E2E Tests (Feature Coverage)

## Architecture
- Framework: Playwright
- Focus: Opaque-box, requirement-driven Tier 1 E2E tests for Print-Sathi.
- Output: `apps/web/e2e/tier1_*.spec.ts` files.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 0 | Playwright Setup | Install and configure Playwright in `apps/web` | none | PLANNED |
| 1 | Feature 1 | Customer Bot Upload Flow (≥5 tests) | M0 | PLANNED |
| 2 | Feature 2 | Shopkeeper Chat Manager (≥5 tests) | M0 | PLANNED |
| 3 | Feature 3 | Drag & Drop Upload (≥5 tests) | M0 | PLANNED |
| 4 | Feature 4 | Supabase File Uploads (≥5 tests) | M0 | PLANNED |
| 5 | Feature 5 | HEIC to WebP/JPEG Conversion (≥5 tests) | M0 | PLANNED |
| 6 | Feature 6 | PDF Merging (combineSelected) (≥5 tests) | M0 | PLANNED |

## Interface Contracts
### Tests ↔ Implementation
- Tests will only depend on UI entry points, user flows, network requests mapping, and visible DOM changes. No internal module dependencies.
