# Original User Request

## 2026-06-15T16:59:41Z

# Teamwork Project Prompt

> Status: Launched
> Goal: Execute UI/UX enhancements

Enhance the UI/UX of the Print-Sathi Next.js application by adding loading transitions between shopkeeper dashboard tabs, displaying passport photo copy counts in the customer chat UI, and adding premium micro-interactions to make the app feel alive and responsive.

Working directory: /media/bhavya/backup and etc/Project/Printo_/apps/web
Integrity mode: development

## Requirements

### R1. Display Passport Photo Quantities
In the customer upload chat interface (`apps/web/src/app/s/[slug]/page.tsx`), when a file is designated as a passport photo, clearly display the quantity (e.g., "8 copies") in the print job summary and the file attachment bubbles.

### R2. Tab Transition Loading Screens
Implement smooth loading screens or skeleton states in the shopkeeper dashboard (`apps/web/src/app/dashboard/page.tsx`) when navigating between different tabs (Queue, Analytics, etc.) to prevent jarring UI jumps and indicate background rendering.

### R3. Premium UI/UX Polish
Add micro-interactions, hover states, scale effects on click (`active:scale-95`), and smooth transitions to interactive elements across the customer and shopkeeper dashboards to make the application feel more "alive". 

## Acceptance Criteria

### Customer Dashboard
- [ ] The file settings chip for a passport photo explicitly states the number of photos (e.g., "Passport (8 copies)").
- [ ] No TypeScript build errors are introduced.

### Shopkeeper Dashboard
- [ ] Clicking a tab (e.g., Queue to Analytics) triggers a visual transition (spinner, skeleton, or fade) rather than an instant hard snap.
- [ ] Interactive buttons have hover and active press scaling animations.
- [ ] No TypeScript build errors are introduced.

### Verification
- [ ] Programmatic: `cd "/media/bhavya/backup and etc/Project/Printo_/apps/web" && npx tsc --noEmit` must complete with 0 errors.

## 2026-06-17T21:51:38+05:30

Redesign the Print Sathi landing page to feel premium, visually complete, and professional. This involves creating custom background textures/images using AI image generation, designing modern landing page layouts, and replacing all generic boxicons across the application with Lucide React icons.

Working directory: /media/bhavya/backup and etc/Project/Printo_/apps/web
Integrity mode: development

## Requirements

### R1. Premium Landing Page Design
- Redesign the landing page (`apps/web/src/app/page.tsx`) using sleek dark mode gradients, interactive glassmorphic panels, ambient glow animations, and responsive bento-style grids.
- Ensure the right side of the hero section is visually rich by pairing the existing queue mockup with a professional abstract backdrop or layout decoration.

### R2. AI-Generated Image Assets
- Generate high-quality professional banners, backgrounds, or mockups using the image generation tool (e.g., an abstract glowing print network background or a sleek app mockup illustration).
- Save these assets into the `public/images` folder and render them on the landing page to fill any blank areas and make it look premium.

### R3. Global Icon Upgrade (Lucide React)
- Scan and replace generic Boxicons (`bx bx-...`) across the primary files with premium Lucide React icons for a modern, consistent aesthetic:
  - Landing page: `apps/web/src/app/page.tsx`
  - Customer Upload page: `apps/web/src/app/s/[slug]/page.tsx`
  - Shopkeeper Dashboard page: `apps/web/src/app/dashboard/page.tsx`
  - Admin Panel: `apps/web/src/app/admin/AdminPanelClient.tsx`
- Ensure all new Lucide icons are properly imported and styled with matching Tailwind/CSS colors and sizes.

## Acceptance Criteria

### Redesign & Background
- [ ] Landing page has a rich glassmorphic layout with animated ambient gradients or a custom generated background banner.
- [ ] The hero section features a professional generated graphic or illustration alongside the live queue glimpse.

### Icon Packs
- [ ] No generic `bx` icons remain on the landing page.
- [ ] Primary dashboard, customer page, and admin pages are migrated to use Lucide React icons.
- [ ] All icon sizes and colors are consistent with the Print Sathi dark/light theme systems.

### Build Verification
- [ ] Next.js project compiles cleanly (`npm run build:web` succeeds) without any broken imports or TypeScript compile errors.

