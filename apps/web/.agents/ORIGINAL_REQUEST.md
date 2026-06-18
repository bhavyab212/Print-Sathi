# Original User Request

## Initial Request — 2026-06-18T03:41:13Z

A comprehensive UI redesign of the Print-Sathi application (Next.js 14 + Supabase). The team will merge multiple high-end design languages (WhatsApp, Notion, Cursor, Linear, BMW) from local design files into a unified Google Stitch-compliant Master Design System, and recursively generate production-ready UI pages.

Working directory: /media/bhavya/backup and etc/Project/Printo_/apps/web
Integrity mode: development

## Requirements

### R1. Stitch Design System Alignment
Analyze the design reference files in `/media/bhavya/backup and etc/Project/Printo_/design_files`. Resolve any token collisions (colors, typography, spacing) and formulate a unified Master Design System. Use the Stitch MCP server tools (`create_design_system`, `apply_design_system`) to inject these design tokens directly into the Next.js project's global CSS and Tailwind config.

### R2. WhatsApp-style Chat UI Redesign
Completely redesign the Customer QR Upload Page (`src/app/s/[slug]/page.tsx`) and Shopkeeper Dashboard into a conversational, WhatsApp-style flow. The Customer page must act as a chat bot for uploading print files, and the Shopkeeper page must be a two-column chat manager view. Ensure the newly applied design tokens (colors, radii, spacing) are strictly adhered to.

### R3. Strict Execution & Build Integrity
The team must ensure all existing application logic (file parsing, drag & drop, Supabase database logic, PDF combining) is fully preserved. The agents must act autonomously to fix any TypeScript errors introduced during the redesign.

## Acceptance Criteria

### Design System Integration
- [ ] A unified design system is successfully generated and applied to the codebase using Stitch MCP tools.
- [ ] Global CSS and Tailwind configs reflect the new design tokens.

### Functionality & Build
- [ ] The command `npm run build` completes successfully with 0 compilation errors in the `/apps/web` workspace.
- [ ] Existing logic (e.g., Supabase file uploads, HEIC conversion, and `combineSelected` PDF merging) remains fully functional.
