# Project: Printo Light Mode Redesign

## Architecture
- Globals CSS (`globals.css`) containing theme variables.
- Tailwind Configuration (`tailwind.config.ts`).
- React Components using these theme classes.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Light Mode CSS Variables & Tailwind | `globals.css`, `tailwind.config.ts`, testing script | none | PLANNED |

## Interface Contracts
- CSS Custom properties must maintain WCAG AA contrast (4.5:1) for primary text against primary background.
- CSS Custom properties for card backgrounds must maintain 1.5:1 against canvas, or use prominent borders/shadows.
- Existing dark mode must not be degraded.
