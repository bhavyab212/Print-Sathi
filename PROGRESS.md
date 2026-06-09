# Progress & Planning Checklist

### Phase A: Architecture & Foundation (DONE ✅)
- [x] Initial scaffolding
- [x] Supabase project setup
- [x] RLS configuration
- [x] Python image service initialized

### Phase B: Auth & Settings (DONE ✅)
- [x] Email/Password login
- [x] 2-step onboarding
- [x] Dynamic rate cards

### Phase C: Job Storage & Processing (DONE ✅)
- [x] Job schema
- [x] Passport processing logic
- [x] Canvas preview component

### Phase D: Desktop App Migration (IN PROGRESS ⏳)
- [x] Monorepo conversion (Turborepo)
- [x] Shared TypeScript types
- [x] Desktop app scaffolding (Electron + Vite)
- [x] Main process and IPC handlers
- [x] Renderer setup (Zustand, React Router)
- [x] UI Components (Sidebar, AppShell, JobCard)
- [x] Views ported (Login, Queue, Passport Tool)
- [x] Stub views for future features
- [x] Supabase Realtime schema updates
- [x] Web app updates (/download page, CTA)
- [ ] Final testing and packaging

### Phase 1B: Billing Integration (NEXT 🔴)
- [ ] Connect calculator view to real rates
- [ ] Integrate thermal receipt printing
- [ ] Log revenue to DB

### Phase 2: Fix & Print (PLANNED)
- [ ] Document resizing tool
- [ ] Simple image editor
- [ ] Margins and layout controls

### Phase 3: Customer QR Queue (PLANNED)
- [ ] Public submit page (`/s/[slug]`)
- [ ] Drag-and-drop upload
- [ ] Auto-assign 3-letter word tokens
- [ ] Rate limits via phone number
