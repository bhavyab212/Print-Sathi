# E2E Test Infra: Print-Sathi UI Redesign

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.
- Framework: Playwright (`@playwright/test`).

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Customer Bot Upload Flow | ORIGINAL_REQUEST §R2 | 5      | 5      | ✓      |
| 2 | Shopkeeper Chat Manager | ORIGINAL_REQUEST §R2 | 5      | 5      | ✓      |
| 3 | Drag & Drop Upload | ORIGINAL_REQUEST §R3 | 5      | 5      | ✓      |
| 4 | Supabase File Uploads | ORIGINAL_REQUEST §R3 | 5      | 5      | ✓      |
| 5 | HEIC to WebP/JPEG Conversion | ORIGINAL_REQUEST §R3 | 5      | 5      | ✓      |
| 6 | PDF Merging (combineSelected) | ORIGINAL_REQUEST §R3 | 5      | 5      | ✓      |

## Test Architecture
- Test runner: Playwright
- Invocation: `npx playwright test`
- Expected: all tests pass with exit code 0
- Directory layout: `apps/web/e2e/`

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Customer opens link, uploads a HEIC photo via drag & drop, checks if converted, and Shopkeeper views it | F1, F2, F3, F4, F5 | High     |
| 2 | Customer uploads multiple PDFs via chat bot, Shopkeeper merges them into one | F1, F2, F4, F6 | High     |
| 3 | Customer bot chat flow invalid inputs and edge cases | F1, F4 | Medium |

## Coverage Thresholds
- Tier 1: ≥5 per feature
- Tier 2: ≥5 per feature (where boundaries exist)
- Tier 3: pairwise coverage of major feature interactions
- Tier 4: ≥3 realistic application scenarios (since N=6, max(5, 3)=5. Wait, max(5, N/2) = max(5, 3) = 5. Let me update to 5 scenarios).

## Real-World Application Scenarios (Tier 4) - Revised
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Customer opens link, uploads a HEIC photo via drag & drop, Shopkeeper views it | F1, F2, F3, F4, F5 | High |
| 2 | Customer uploads multiple PDFs via bot, Shopkeeper merges them | F1, F2, F4, F6 | High |
| 3 | Customer uploads mixed file types (PDF, JPEG, HEIC) via D&D, Shopkeeper sees correct formats | F1, F2, F3, F4, F5 | High |
| 4 | Shopkeeper navigates multiple customer chats simultaneously | F2 | Medium |
| 5 | Network interruptions during large PDF merge and Supabase upload | F4, F6 | High |
