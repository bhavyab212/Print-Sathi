# Graph Report - .  (2026-06-09)

## Corpus Check
- Corpus is ~17,433 words - fits in a single context window. You may not need a graph.

## Summary
- 136 nodes · 96 edges · 47 communities detected
- Extraction: 78% EXTRACTED · 22% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Auth & Shop Onboarding Flow|Auth & Shop Onboarding Flow]]
- [[_COMMUNITY_Python Passport Image Processing|Python Passport Image Processing]]
- [[_COMMUNITY_Passport Photo Dashboard UI|Passport Photo Dashboard UI]]
- [[_COMMUNITY_File Dropzone Component|File Dropzone Component]]
- [[_COMMUNITY_Supabase Middleware & Security|Supabase Middleware & Security]]
- [[_COMMUNITY_Customer Queue & QR Flow|Customer Queue & QR Flow]]
- [[_COMMUNITY_Health Check & APIs|Health Check & APIs]]
- [[_COMMUNITY_Shopkeeper Onboarding Events|Shopkeeper Onboarding Events]]
- [[_COMMUNITY_Context Confirmed Tech|Context Confirmed Tech]]
- [[_COMMUNITY_Context Source Documents|Context Source Documents]]
- [[_COMMUNITY_Print Shop Automation|Print Shop Automation]]
- [[_COMMUNITY_Print Shop Automation|Print Shop Automation]]
- [[_COMMUNITY_Context Design Decisions|Context Design Decisions]]
- [[_COMMUNITY_Printshop Bill Calculator|Printshop Bill Calculator]]
- [[_COMMUNITY_Main|Main]]
- [[_COMMUNITY_Next Config Nextconfig|Next Config Nextconfig]]
- [[_COMMUNITY_Postcss Config|Postcss Config]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]
- [[_COMMUNITY_Middleware Config|Middleware Config]]
- [[_COMMUNITY_Layout Inter|Layout Inter]]
- [[_COMMUNITY_Layout Metadata|Layout Metadata]]
- [[_COMMUNITY_Layout Navitems|Layout Navitems]]
- [[_COMMUNITY_Page Processing|Page Processing]]
- [[_COMMUNITY_Page Metadata|Page Metadata]]
- [[_COMMUNITY_A4sheetpreview A4sheetpreviewprops|A4sheetpreview A4sheetpreviewprops]]
- [[_COMMUNITY_Filedropzone Filedropzoneprops|Filedropzone Filedropzoneprops]]
- [[_COMMUNITY_Passportconfig Passportsize|Passportconfig Passportsize]]
- [[_COMMUNITY_Passportconfig Colors|Passportconfig Colors]]
- [[_COMMUNITY_Passportconfig|Passportconfig]]
- [[_COMMUNITY_Commits Commit Rules|Commits Commit Rules]]
- [[_COMMUNITY_Commits Commit Types|Commits Commit Types]]
- [[_COMMUNITY_Commits Planned|Commits Planned]]
- [[_COMMUNITY_Commits Commit History|Commits Commit History]]
- [[_COMMUNITY_Context What This|Context What This]]
- [[_COMMUNITY_Context Three Portals|Context Three Portals]]
- [[_COMMUNITY_Context Core Features|Context Core Features]]
- [[_COMMUNITY_Print Shop Automation|Print Shop Automation]]
- [[_COMMUNITY_Print Shop Automation|Print Shop Automation]]
- [[_COMMUNITY_Print Shop Automation|Print Shop Automation]]
- [[_COMMUNITY_Printshop Principles|Printshop Principles]]
- [[_COMMUNITY_Printshop Functional Requirements|Printshop Functional Requirements]]
- [[_COMMUNITY_Printshop Pricing Model|Printshop Pricing Model]]
- [[_COMMUNITY_Progress Phase Checklist|Progress Phase Checklist]]
- [[_COMMUNITY_Progress Phase Checklist|Progress Phase Checklist]]
- [[_COMMUNITY_Readme What Does|Readme What Does]]
- [[_COMMUNITY_Readme Getting Started|Readme Getting Started]]
- [[_COMMUNITY_Readme Getting Started|Readme Getting Started]]

## God Nodes (most connected - your core abstractions)
1. `process_passport_photo()` - 11 edges
2. `Passport Photo Generator UI Page` - 9 edges
3. `createClient()` - 5 edges
4. `createClient()` - 5 edges
5. `POST()` - 4 edges
6. `handleFile()` - 4 edges
7. `Shop Onboarding Page` - 4 edges
8. `Passport Photo Spec` - 4 edges
9. `_pil_to_cv2()` - 3 edges
10. `_detect_face()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `A4SheetPreview()` --implements--> `Passport Photo Spec`  [INFERRED]
  /media/bhavya/backup and etc/Project/Printo_/apps/web/src/components/passport/A4SheetPreview.tsx → PrintShop_PRD_v1.md
- `updateSession()` --implements--> `Shop Onboarding Flow`  [INFERRED]
  /media/bhavya/backup and etc/Project/Printo_/apps/web/src/lib/supabase/middleware.ts → PrintShop_PRD_v1.md
- `FileDropzone` --implements--> `Phase 1A - Passport Photo Checklist`  [INFERRED]
  apps/web/src/components/passport/FileDropzone.tsx → PROGRESS.md
- `PassportConfigPanel` --implements--> `Passport Photo Spec`  [INFERRED]
  apps/web/src/components/passport/PassportConfig.tsx → PrintShop_PRD_v1.md
- `Passport Photo Generator UI Page` --shares_data_with--> `POST()`  [INFERRED]
  apps/web/src/app/dashboard/passport/page.tsx → /media/bhavya/backup and etc/Project/Printo_/apps/web/src/app/api/usage/passport/route.ts

## Hyperedges (group relationships)
- **Passport Photo Generation & Usage Tracking Flow** — main_process_passport_photo, page_passportpage, route_post [INFERRED 0.95]
- **Shop Authentication & Onboarding Flow** — page_loginpage, page_loginform, page_onboardingpage, middleware_middleware [INFERRED 0.90]
- **Passport Photo Frontend Flow** — a4sheetpreview_a4sheetpreview, filedropzone_filedropzone, passportconfig_passportconfigpanel [INFERRED 0.90]
- **Supabase Integration Layer** — client_createclient, server_createclient, middleware_updatesession [INFERRED 0.95]
- **Passport Photo Product Decisions and Specs** — context_key_design_decisions, print_shop_automation_platform_passport_photo, printshop_prd_v1_passport_photo_spec [INFERRED 0.95]

## Communities

### Community 0 - "Auth & Shop Onboarding Flow"
Cohesion: 0.12
Nodes (11): createClient(), handleLogout(), AdminPage(), Default Rate Card Items, Generate Unique Shop Slug, HomePage(), Login and Password Reset Form, Login Wrapper Page (+3 more)

### Community 1 - "Python Passport Image Processing"
Cohesion: 0.17
Nodes (13): Crop to Passport Proportions, Detect Largest Face, Convert PIL Image to Base64, Convert PIL to OpenCV BGR, _crop_to_passport(), _detect_face(), _image_to_base64(), _pil_to_cv2() (+5 more)

### Community 2 - "Passport Photo Dashboard UI"
Cohesion: 0.19
Nodes (11): A4SheetPreview(), FileDropzone, Dashboard Layout Frame, DashboardPage(), Default Passport Photo Configuration, Passport Photo Generator UI Page, PASSPORT_SIZES, PassportConfigPanel (+3 more)

### Community 3 - "File Dropzone Component"
Cohesion: 0.7
Nodes (4): handleFile(), onDrop(), onInputChange(), validate()

### Community 4 - "Supabase Middleware & Security"
Cohesion: 0.4
Nodes (3): middleware(), updateSession(), Shop Onboarding Flow

### Community 5 - "Customer Queue & QR Flow"
Cohesion: 0.4
Nodes (4): CustomerPage(), Smart QR Print Queue Feature, Smart QR Print Queue Spec, Phase 3 - Smart QR Print Queue Checklist

### Community 6 - "Health Check & APIs"
Cohesion: 0.5
Nodes (3): health_check(), Health check endpoint — used by UptimeRobot to keep Render awake., GET()

### Community 8 - "Shopkeeper Onboarding Events"
Cohesion: 0.67
Nodes (2): generateSlug(), handleSubmit()

### Community 11 - "Context Confirmed Tech"
Cohesion: 0.67
Nodes (3): Confirmed Tech Stack, Hardware Bridge, Python Packages

### Community 12 - "Context Source Documents"
Cohesion: 0.67
Nodes (3): Source Documents, Project Vision, Phased Roadmap

### Community 13 - "Print Shop Automation"
Cohesion: 0.67
Nodes (3): Fix & Print Document Feature, Fix & Print Document Spec, Phase 2 - Fix & Print Document Checklist

### Community 14 - "Print Shop Automation"
Cohesion: 0.67
Nodes (3): Clean Scan PDF Feature, Clean Scan PDF Spec, Phase 4 - Clean Scan PDF Checklist

### Community 17 - "Context Design Decisions"
Cohesion: 1.0
Nodes (2): Key Design Decisions, Job Data Structure

### Community 18 - "Printshop Bill Calculator"
Cohesion: 1.0
Nodes (2): Print Bill Calculator Spec, Phase 1B - Bill Calculator Checklist

### Community 23 - "Main"
Cohesion: 1.0
Nodes (1): Print Sathi Processing FastAPI Application

### Community 24 - "Next Config Nextconfig"
Cohesion: 1.0
Nodes (1): Next.js Configuration

### Community 25 - "Postcss Config"
Cohesion: 1.0
Nodes (1): PostCSS Configuration

### Community 26 - "Tailwind Config"
Cohesion: 1.0
Nodes (1): TailwindCSS Configuration

### Community 27 - "Middleware Config"
Cohesion: 1.0
Nodes (1): Middleware Route Matcher Configuration

### Community 28 - "Layout Inter"
Cohesion: 1.0
Nodes (1): Inter Font Configuration

### Community 29 - "Layout Metadata"
Cohesion: 1.0
Nodes (1): Global Metadata Configuration

### Community 30 - "Layout Navitems"
Cohesion: 1.0
Nodes (1): Dashboard Navigation Items

### Community 31 - "Page Processing"
Cohesion: 1.0
Nodes (1): Python Processing Service URL

### Community 32 - "Page Metadata"
Cohesion: 1.0
Nodes (1): metadata

### Community 33 - "A4sheetpreview A4sheetpreviewprops"
Cohesion: 1.0
Nodes (1): A4SheetPreviewProps

### Community 34 - "Filedropzone Filedropzoneprops"
Cohesion: 1.0
Nodes (1): FileDropzoneProps

### Community 35 - "Passportconfig Passportsize"
Cohesion: 1.0
Nodes (1): PassportSize

### Community 36 - "Passportconfig Colors"
Cohesion: 1.0
Nodes (1): BG_COLORS

### Community 37 - "Passportconfig"
Cohesion: 1.0
Nodes (1): PassportConfig

### Community 38 - "Commits Commit Rules"
Cohesion: 1.0
Nodes (1): Commit Rules

### Community 39 - "Commits Commit Types"
Cohesion: 1.0
Nodes (1): Commit Types

### Community 40 - "Commits Planned"
Cohesion: 1.0
Nodes (1): Planned Commits

### Community 41 - "Commits Commit History"
Cohesion: 1.0
Nodes (1): Commit History

### Community 42 - "Context What This"
Cohesion: 1.0
Nodes (1): What This Product Is

### Community 43 - "Context Three Portals"
Cohesion: 1.0
Nodes (1): The Three Portals

### Community 44 - "Context Core Features"
Cohesion: 1.0
Nodes (1): Core Features

### Community 45 - "Print Shop Automation"
Cohesion: 1.0
Nodes (1): Product Thesis

### Community 46 - "Print Shop Automation"
Cohesion: 1.0
Nodes (1): Core Product Promise

### Community 47 - "Print Shop Automation"
Cohesion: 1.0
Nodes (1): Monetization Strategy

### Community 48 - "Printshop Principles"
Cohesion: 1.0
Nodes (1): Core UX Principles

### Community 49 - "Printshop Functional Requirements"
Cohesion: 1.0
Nodes (1): Non-Functional Requirements

### Community 50 - "Printshop Pricing Model"
Cohesion: 1.0
Nodes (1): Pricing and Business Model

### Community 51 - "Progress Phase Checklist"
Cohesion: 1.0
Nodes (1): Phase 0 Checklist

### Community 52 - "Progress Phase Checklist"
Cohesion: 1.0
Nodes (1): Phase 5 - Super Admin Panel + Polish Checklist

### Community 53 - "Readme What Does"
Cohesion: 1.0
Nodes (1): What It Does

### Community 54 - "Readme Getting Started"
Cohesion: 1.0
Nodes (1): Getting Started

### Community 55 - "Readme Getting Started"
Cohesion: 1.0
Nodes (1): Web App Getting Started

## Knowledge Gaps
- **61 isolated node(s):** `Convert PIL image (RGBA or RGB) to OpenCV BGR.`, `Return the (x, y, w, h) of the largest detected face, or None.`, `Crop the image to passport proportions (35×45 mm → 7:9 ratio) centred     on the`, `Health check endpoint — used by UptimeRobot to keep Render awake.`, `Accept a portrait photo, remove its background, detect the face,     and return` (+56 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Shopkeeper Onboarding Events`** (4 nodes): `generateSlug()`, `handleSubmit()`, `updateRate()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Context Design Decisions`** (2 nodes): `Key Design Decisions`, `Job Data Structure`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Printshop Bill Calculator`** (2 nodes): `Print Bill Calculator Spec`, `Phase 1B - Bill Calculator Checklist`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main`** (1 nodes): `Print Sathi Processing FastAPI Application`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next Config Nextconfig`** (1 nodes): `Next.js Configuration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Postcss Config`** (1 nodes): `PostCSS Configuration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind Config`** (1 nodes): `TailwindCSS Configuration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Middleware Config`** (1 nodes): `Middleware Route Matcher Configuration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Layout Inter`** (1 nodes): `Inter Font Configuration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Layout Metadata`** (1 nodes): `Global Metadata Configuration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Layout Navitems`** (1 nodes): `Dashboard Navigation Items`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page Processing`** (1 nodes): `Python Processing Service URL`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page Metadata`** (1 nodes): `metadata`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `A4sheetpreview A4sheetpreviewprops`** (1 nodes): `A4SheetPreviewProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Filedropzone Filedropzoneprops`** (1 nodes): `FileDropzoneProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Passportconfig Passportsize`** (1 nodes): `PassportSize`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Passportconfig Colors`** (1 nodes): `BG_COLORS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Passportconfig`** (1 nodes): `PassportConfig`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Commits Commit Rules`** (1 nodes): `Commit Rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Commits Commit Types`** (1 nodes): `Commit Types`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Commits Planned`** (1 nodes): `Planned Commits`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Commits Commit History`** (1 nodes): `Commit History`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Context What This`** (1 nodes): `What This Product Is`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Context Three Portals`** (1 nodes): `The Three Portals`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Context Core Features`** (1 nodes): `Core Features`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Print Shop Automation`** (1 nodes): `Product Thesis`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Print Shop Automation`** (1 nodes): `Core Product Promise`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Print Shop Automation`** (1 nodes): `Monetization Strategy`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Printshop Principles`** (1 nodes): `Core UX Principles`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Printshop Functional Requirements`** (1 nodes): `Non-Functional Requirements`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Printshop Pricing Model`** (1 nodes): `Pricing and Business Model`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Progress Phase Checklist`** (1 nodes): `Phase 0 Checklist`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Progress Phase Checklist`** (1 nodes): `Phase 5 - Super Admin Panel + Polish Checklist`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Readme What Does`** (1 nodes): `What It Does`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Readme Getting Started`** (1 nodes): `Getting Started`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Readme Getting Started`** (1 nodes): `Web App Getting Started`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Passport Photo Generator UI Page` connect `Passport Photo Dashboard UI` to `Auth & Shop Onboarding Flow`, `Python Passport Image Processing`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `process_passport_photo()` connect `Python Passport Image Processing` to `Passport Photo Dashboard UI`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `POST()` connect `Auth & Shop Onboarding Flow` to `Passport Photo Dashboard UI`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `createClient()` (e.g. with `handleLogout()` and `createClient()`) actually correct?**
  _`createClient()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `POST()` (e.g. with `Passport Photo Generator UI Page` and `Shop Onboarding Page`) actually correct?**
  _`POST()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Convert PIL image (RGBA or RGB) to OpenCV BGR.`, `Return the (x, y, w, h) of the largest detected face, or None.`, `Crop the image to passport proportions (35×45 mm → 7:9 ratio) centred     on the` to the rest of the system?**
  _61 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth & Shop Onboarding Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._