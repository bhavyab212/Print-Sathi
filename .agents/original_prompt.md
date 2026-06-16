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
