# Graph Report - Printo_  (2026-06-14)

## Corpus Check
- 75 files · ~141,391 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 470 nodes · 473 edges · 84 communities detected
- Extraction: 82% EXTRACTED · 17% INFERRED · 1% AMBIGUOUS · INFERRED: 81 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]

## God Nodes (most connected - your core abstractions)
1. `Postgres Best Practices Compiled Rules` - 20 edges
2. `Postgres Best Practices Skill` - 10 edges
3. `padImageBuffer()` - 9 edges
4. `process_passport_photo()` - 8 edges
5. `Planning with Files Skill Overview` - 8 edges
6. `Choose the Right Index Type for Your Data` - 8 edges
7. `Python/FastAPI Development Workflow Bundle` - 8 edges
8. `getCompressedBlob()` - 7 edges
9. `getCompressedBlob()` - 7 edges
10. `Schema Design Rule Category` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Sidebar()` --references--> `Smart QR Print Queue`  [INFERRED]
  apps/desktop/src/renderer/components/layout/Sidebar.tsx → CONTEXT.md
- `Sidebar()` --references--> `Print Bill Calculator`  [INFERRED]
  apps/desktop/src/renderer/components/layout/Sidebar.tsx → CONTEXT.md
- `Sidebar()` --references--> `Fix & Print Document`  [INFERRED]
  apps/desktop/src/renderer/components/layout/Sidebar.tsx → CONTEXT.md
- `ShopRequiredRoute()` --references--> `Rate Card System`  [INFERRED]
  apps/desktop/src/renderer/App.tsx → CONTEXT.md
- `Sidebar()` --references--> `Passport Photo Auto Generator`  [INFERRED]
  apps/desktop/src/renderer/components/layout/Sidebar.tsx → CONTEXT.md

## Hyperedges (group relationships)
- **Desktop App Views Navigation Flow** — queuedashboardview_queuedashboardview, passportphotoview_passportpage, billcalculatorview_billcalculatorview, fixprintview_fixprintview, settingsview_settingsview [INFERRED 0.90]
- **Shop Authentication & Onboarding Flow** — page_loginpage, page_loginform, page_onboardingpage, middleware_middleware [INFERRED 0.90]
- **Supabase Integration Layer** — client_createclient, server_createclient, middleware_updatesession [INFERRED 0.95]
- **Print Sathi Shared Domain Types** — job_job, job_jobitem, ratecard_ratecarditem, shop_shop [EXTRACTED 1.00]
- **Print Sathi Core Workflows** — context_passport_photo_generator, context_print_bill_calculator, context_fix_print_document, context_smart_qr_print_queue [EXTRACTED 1.00]
- **Passport Photo Product Decisions and Specs** — context_key_design_decisions, print_shop_automation_platform_passport_photo, printshop_prd_v1_passport_photo_spec [INFERRED 0.95]
- **Manus Context Engineering Principles & Templates** — skill_planning_with_files_core_pattern, skill_planning_with_files_two_action_rule, skill_planning_with_files_recitation, reference_planning_with_files_principles [EXTRACTED 1.00]
- **Postgres Connection Lifecycle and Management** — conn_idle_timeout_rule, conn_limits_rule, conn_pooling_rule, conn_prepared_statements_rule [INFERRED 0.95]
- **Postgres Locking and Concurrency Control Rules** — lock_advisory_rule, lock_deadlock_prevention_rule, lock_short_transactions_rule, lock_skip_locked_rule [INFERRED 0.95]
- **Postgres Query Optimization through Indexes** — query_composite_indexes_rule, query_covering_indexes_rule, advanced_jsonb_indexing_rule, advanced_full_text_search_rule [INFERRED 0.90]
- **Postgres Index Optimization Guidelines** — query_index_types_choose_index_type, query_missing_indexes_add_indexes, query_partial_indexes_use_partial_indexes, schema_foreign_key_indexes_index_fks [INFERRED 0.90]
- **Postgres Security and Tenant Isolation** — security_privileges_least_privilege, security_rls_basics_enable_rls, security_rls_performance_optimize_rls [INFERRED 0.90]
- **FastAPI Application Development Phases** — skill_fastapi_project_setup, skill_fastapi_database_setup, skill_fastapi_api_routes, skill_fastapi_auth, skill_fastapi_error_handling, skill_fastapi_testing, skill_fastapi_docs, skill_fastapi_deployment [EXTRACTED 1.00]
- **Passport Processing Pipeline** — api_passport_process, processing_rembg, processing_detect_face, processing_crop_to_passport [EXTRACTED 1.00]
- **Desktop Printing System** — desktop_main_index, desktop_printer_handlers, desktop_pdf_to_printer, ipc_printer_print [EXTRACTED 1.00]
- **Desktop Passport UI Components** — desktop_passport_photo_view, desktop_a4_sheet_preview, desktop_passport_config [EXTRACTED 0.95]
- **Passport Flow Panels** — ui_upload_panel, ui_processing_panel, ui_bg_review_panel, ui_manual_mask_editor, ui_crop_adjust_panel, ui_enhance_panel, ui_layout_print_panel, ui_step_nav [INFERRED 0.85]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (49): Use tsvector for Full-Text Search Rationale, Use tsvector for Full-Text Search, Index JSONB Columns for Efficient Querying Rationale, Index JSONB Columns for Efficient Querying, Postgres Best Practices Compiled Rules, Configure Idle Connection Timeouts Rationale, Configure Idle Connection Timeouts, Set Appropriate Connection Limits Rationale (+41 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (24): getCompressedBlob(), handleAcceptClick(), handleDownload(), copyImageToClipboard(), drawOutline(), getCompressedBlob(), handleAcceptClick(), handleDownload() (+16 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (35): BRIN Index Pattern for Large Time-Series, B-tree Index Pattern, Choose the Right Index Type for Your Data, GIN Index Pattern for JSONB/Arrays, Hash Index Pattern for Equality-Only, Rationale: Choosing Right Index Type for Query Patterns, Add Indexes on WHERE and JOIN Columns, Foreign Key Side Indexing (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (26): Bigint Generated Always As Identity Primary Key, Choose Appropriate Data Types, Numeric Type for Exact Precision (numeric), Text Type Preference, Timezone-aware Timestamps (timestamptz), Use Lowercase Identifiers for Compatibility, Quoted Mixed-Case Identifier Antipattern, ORM CamelCase-to-snake_case Mapping (+18 more)

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (10): copyImageToClipboard(), drawOutline(), getEditorCanvasPos(), handleEditorPointerDown(), handleEditorPointerMove(), handleReset(), renderForeground(), resetAdjustments() (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (18): analyze_for_retry(), _crop_to_passport(), _detect_face(), digital_export_passport_photo(), enhance_passport_photo(), get_rembg_session(), health_check(), _image_to_base64() (+10 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (14): ShopRequiredRoute(), AppShell, Fix & Print Document, Passport Photo Auto Generator, Print Bill Calculator, Python Processing Service, Rate Card System, Rationale for 3-Letter Word Tokens (+6 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (15): Phase 1A: Passport Photo Generator, Planned Clean Scan PDF Feature, Planned Fix & Print Document Automation, Planned Passport Photo Auto-Generator, Planned Print Bill Calculator, Product Mission & Counter Automation Goals, Planned Smart QR Print Queue Flow, smart_commit.sh Script Integration (+7 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (15): Planning with Files Implementation Examples, findings.md Markdown Template, progress.md Markdown Template, Design around KV-Cache Hit Rate, Prefix Stability and Determinist Serialization 10x Cost Savings Rationale, Manus Context Engineering Reference, Retention of Failed Actions Stack Traces Rationale, Filesystem as External Memory Core Pattern (+7 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (13): Pinokio Script APIs & Variable Templates, Separated app Folder Architecture Rationale, Gepeto Guide for Pinokio Launchers, Web UI URL Capture Pattern Lock, local.set Regex Capture for Open WebUI Tab Rationale, Dynamic port Template Variables Allocation Rationale, Standardized Pinokio Project Structure, Gepeto Pre/Post-execution Workflow Checklist (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.2
Nodes (11): useAuthStore auth store, LoginView desktop form, DEFAULT_RATE_ITEMS default rates, generateSlug helper function, OnboardingPage shop setup, DashboardPage queue panel, Landing/Home Page, LoginForm username password (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (3): setBg(), setCopies(), setSize()

### Community 12 - "Community 12"
Cohesion: 0.24
Nodes (4): canvasCoords(), getHandle(), onMouseDown(), onMouseMove()

### Community 13 - "Community 13"
Cohesion: 0.24
Nodes (4): applyBakedImage(), base64ToFile(), runAiEnhance(), showLocalToast()

### Community 14 - "Community 14"
Cohesion: 0.24
Nodes (3): getEventPos(), onPointerDown(), onPointerMove()

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (7): createClient, Admin Dashboard Page, Default Rate Card Items, Generate Unique Shop Slug, Shop Onboarding Page, Log Passport Printing Usage API, createClient

### Community 16 - "Community 16"
Cohesion: 0.38
Nodes (4): copyImageToClipboard(), handleReset(), showToast(), stopAnimation()

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (2): handleReset(), stopAnimation()

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (6): Desktop Main Index, pdf-to-printer Library, setupPrinterHandlers, printer:list IPC Channel, printer:print IPC Channel, printer:printPDF IPC Channel

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (6): Job Interface, JobItem Interface, JobStatus Type, JobType Type, RateCardItem Interface, Shop Interface

### Community 20 - "Community 20"
Cohesion: 0.33
Nodes (6): Concrete SQL Rewrite Guideline, Error-First Example Structure, Impact Level Reference Guide, Quantified Performance Impact Standard, Writing Guidelines for Postgres Rules, Postgres Rule Template Layout

### Community 21 - "Community 21"
Cohesion: 0.6
Nodes (3): get_local_ip(), kill_process_group(), main()

### Community 23 - "Community 23"
Cohesion: 0.4
Nodes (5): Desktop App Architecture, Rationale for Primary Desktop Interface, Rationale for 4-Hour File Auto-Delete, Supabase Backend, Phase D: Desktop App Migration

### Community 24 - "Community 24"
Cohesion: 0.4
Nodes (5): Semantic Cache Lookup & Update, Subagent Token and Computation Reduction Rationale, Graphify Knowledge Graph Construction Overview, Parallel AST & Semantic Subagents Flow, Concurrent Processing Speed Optimization Rationale

### Community 25 - "Community 25"
Cohesion: 0.5
Nodes (4): PrinterSettingsView configured printers, RateCardSettingsView pricing rates, SettingsView configuration panel, ShopSettingsView shopkeeper details

### Community 26 - "Community 26"
Cohesion: 0.67
Nodes (2): A4SheetPreview(), drawOutline()

### Community 28 - "Community 28"
Cohesion: 0.5
Nodes (4): Phase 0: Foundation Setup Complete, PG Constraints Rationale, RLS Policies Rationale, Supabase Backend and Migrations Setup

### Community 29 - "Community 29"
Cohesion: 0.5
Nodes (4): Batch Execution & Checkpoint Reporting, Checkpoint Architecture Review Rationale, Executing Plans Skill Overview, 5-Step Plan Execution Process

### Community 30 - "Community 30"
Cohesion: 0.67
Nodes (3): Next.js Request Middleware, updateSession, Shop Onboarding Flow

### Community 31 - "Community 31"
Cohesion: 0.67
Nodes (3): Next.js Best Practices Principles, Default to Server Components performance Rationale, React Server vs Client Components Decision Tree

### Community 32 - "Community 32"
Cohesion: 0.67
Nodes (3): Protected Routes Middleware Session Refresh, Middleware Token Validation & Cookie Guarding Rationale, Next.js Supabase Auth Integration Guidelines

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (2): electron-store Library, Desktop Supabase Client

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (2): Print Sathi Platform, Rationale for Human Approval before Printing

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (2): Passport Photo Auto Generator Feature, Passport Photo Spec

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (2): Smart QR Print Queue Feature, Smart QR Print Queue Spec

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (2): Fix & Print Document Feature, Fix & Print Document Spec

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (2): Clean Scan PDF Feature, Clean Scan PDF Spec

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (2): Design Rule: Shopkeeper Manual Control, Manual Shopkeeper Review Rationale

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (2): Design Rule: Privacy-First Storage Lifecycle, 4-Hour Automatic Upload Deletion Rationale

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (2): Design Rule: Zero Customer Friction, Instant QR Upload without Registrations Rationale

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (2): Design Rule: Memorable 3-Letter Noun Tokens, Easy Counter Word Tokens Communication Rationale

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (2): Planned PDF Layout Arrangement Mechanism, Browser-side PDF-Lib Execution Rationale

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (2): Passport Photo Auto Generator, PrintShop Platform

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (1): electron API contextBridge

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (1): JobCard Component

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (1): cn

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (1): BillCalculatorView placeholder

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (1): FixPrintView placeholder

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (1): Next.js Configuration

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (1): PostCSS Configuration

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (1): TailwindCSS Configuration

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (1): Middleware Route Matcher Configuration

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (1): RootLayout web skeleton

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (1): Next.js API Web Health Check

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (1): DownloadPage for Windows

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (1): CustomerPage

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (1): metadata

### Community 70 - "Community 70"
Cohesion: 1.0
Nodes (1): StepNav

### Community 72 - "Community 72"
Cohesion: 1.0
Nodes (1): Accept a portrait photo, remove its background, detect the face,     and return

### Community 73 - "Community 73"
Cohesion: 1.0
Nodes (1): Accept an image, apply advanced portrait enhancements (skin softening,     studi

### Community 74 - "Community 74"
Cohesion: 1.0
Nodes (1): Export a passport photo as a portal-ready JPEG.      Default output: Passport Se

### Community 75 - "Community 75"
Cohesion: 1.0
Nodes (1): Commit Rules

### Community 76 - "Community 76"
Cohesion: 1.0
Nodes (1): Commit Types

### Community 77 - "Community 77"
Cohesion: 1.0
Nodes (1): Planned Commits

### Community 78 - "Community 78"
Cohesion: 1.0
Nodes (1): Commit History

### Community 79 - "Community 79"
Cohesion: 1.0
Nodes (1): Project Vision

### Community 80 - "Community 80"
Cohesion: 1.0
Nodes (1): Product Thesis

### Community 81 - "Community 81"
Cohesion: 1.0
Nodes (1): Core Product Promise

### Community 82 - "Community 82"
Cohesion: 1.0
Nodes (1): Hardware Bridge

### Community 83 - "Community 83"
Cohesion: 1.0
Nodes (1): Monetization Strategy

### Community 84 - "Community 84"
Cohesion: 1.0
Nodes (1): Phased Roadmap

### Community 85 - "Community 85"
Cohesion: 1.0
Nodes (1): Print Bill Calculator Spec

### Community 86 - "Community 86"
Cohesion: 1.0
Nodes (1): Core UX Principles

### Community 87 - "Community 87"
Cohesion: 1.0
Nodes (1): Job Data Structure

### Community 88 - "Community 88"
Cohesion: 1.0
Nodes (1): Non-Functional Requirements

### Community 89 - "Community 89"
Cohesion: 1.0
Nodes (1): Pricing and Business Model

### Community 90 - "Community 90"
Cohesion: 1.0
Nodes (1): What It Does

### Community 91 - "Community 91"
Cohesion: 1.0
Nodes (1): Getting Started

### Community 92 - "Community 92"
Cohesion: 1.0
Nodes (1): Python Packages

### Community 93 - "Community 93"
Cohesion: 1.0
Nodes (1): Web App Getting Started

### Community 94 - "Community 94"
Cohesion: 1.0
Nodes (1): Print Sathi Project Status Overview

### Community 95 - "Community 95"
Cohesion: 1.0
Nodes (1): DTP Shop

### Community 96 - "Community 96"
Cohesion: 1.0
Nodes (1): 35x45 mm Size

### Community 97 - "Community 97"
Cohesion: 1.0
Nodes (1): A4 Photo Layout

## Ambiguous Edges - Review These
- `Todo: Phase 1A Remaining Work` → `Git Push Workflow`  [AMBIGUOUS]
  progress/todo.md · relation: conceptually_related_to
- `ORM CamelCase-to-snake_case Mapping` → `FastAPI Phase 2: Database Schema & SQLAlchemy ORM Setup`  [AMBIGUOUS]
  skills/postgres-best-practices/rules/schema-lowercase-identifiers.md · relation: shares_data_with
- `Security and RLS Rule Category` → `Zero Payment Wallet & Capability CLI Integration`  [AMBIGUOUS]
  skills/zero/SKILL.md · relation: conceptually_related_to

## Knowledge Gaps
- **201 isolated node(s):** `Desktop Main Index`, `pdf-to-printer Library`, `printer:list IPC Channel`, `printer:print IPC Channel`, `printer:printPDF IPC Channel` (+196 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 17`** (7 nodes): `CustomModeFlow.tsx`, `handlePrint()`, `handleReset()`, `handleStepClick()`, `showToast()`, `startAnimation()`, `stopAnimation()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (4 nodes): `A4SheetPreview()`, `drawOutline()`, `A4SheetPreview.tsx`, `A4SheetPreview.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `electron-store Library`, `Desktop Supabase Client`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `Print Sathi Platform`, `Rationale for Human Approval before Printing`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `Passport Photo Auto Generator Feature`, `Passport Photo Spec`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `Smart QR Print Queue Feature`, `Smart QR Print Queue Spec`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `Fix & Print Document Feature`, `Fix & Print Document Spec`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (2 nodes): `Clean Scan PDF Feature`, `Clean Scan PDF Spec`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (2 nodes): `Design Rule: Shopkeeper Manual Control`, `Manual Shopkeeper Review Rationale`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (2 nodes): `Design Rule: Privacy-First Storage Lifecycle`, `4-Hour Automatic Upload Deletion Rationale`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (2 nodes): `Design Rule: Zero Customer Friction`, `Instant QR Upload without Registrations Rationale`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (2 nodes): `Design Rule: Memorable 3-Letter Noun Tokens`, `Easy Counter Word Tokens Communication Rationale`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (2 nodes): `Planned PDF Layout Arrangement Mechanism`, `Browser-side PDF-Lib Execution Rationale`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (2 nodes): `Passport Photo Auto Generator`, `PrintShop Platform`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `electron API contextBridge`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `JobCard Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `cn`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `BillCalculatorView placeholder`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `FixPrintView placeholder`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `Next.js Configuration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `PostCSS Configuration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `TailwindCSS Configuration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (1 nodes): `Middleware Route Matcher Configuration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `RootLayout web skeleton`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `Next.js API Web Health Check`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `DownloadPage for Windows`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (1 nodes): `CustomerPage`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `metadata`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (1 nodes): `StepNav`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (1 nodes): `Accept a portrait photo, remove its background, detect the face,     and return`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (1 nodes): `Accept an image, apply advanced portrait enhancements (skin softening,     studi`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (1 nodes): `Export a passport photo as a portal-ready JPEG.      Default output: Passport Se`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (1 nodes): `Commit Rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (1 nodes): `Commit Types`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (1 nodes): `Planned Commits`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (1 nodes): `Commit History`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 79`** (1 nodes): `Project Vision`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (1 nodes): `Product Thesis`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 81`** (1 nodes): `Core Product Promise`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (1 nodes): `Hardware Bridge`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (1 nodes): `Monetization Strategy`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (1 nodes): `Phased Roadmap`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (1 nodes): `Print Bill Calculator Spec`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 86`** (1 nodes): `Core UX Principles`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 87`** (1 nodes): `Job Data Structure`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 88`** (1 nodes): `Non-Functional Requirements`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 89`** (1 nodes): `Pricing and Business Model`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 90`** (1 nodes): `What It Does`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 91`** (1 nodes): `Getting Started`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 92`** (1 nodes): `Python Packages`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 93`** (1 nodes): `Web App Getting Started`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 94`** (1 nodes): `Print Sathi Project Status Overview`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 95`** (1 nodes): `DTP Shop`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 96`** (1 nodes): `35x45 mm Size`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 97`** (1 nodes): `A4 Photo Layout`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Todo: Phase 1A Remaining Work` and `Git Push Workflow`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `ORM CamelCase-to-snake_case Mapping` and `FastAPI Phase 2: Database Schema & SQLAlchemy ORM Setup`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
- **What is the exact relationship between `Security and RLS Rule Category` and `Zero Payment Wallet & Capability CLI Integration`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Schema Design Rule Category` connect `Community 3` to `Community 2`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `padImageBuffer()` connect `Community 1` to `Community 4`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `Section Definitions for Postgres Best Practices` connect `Community 2` to `Community 3`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `padImageBuffer()` (e.g. with `set()` and `getCompressedBlob()`) actually correct?**
  _`padImageBuffer()` has 7 INFERRED edges - model-reasoned connections that need verification._