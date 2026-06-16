---
version: "1.0"
name: PrintSathi Master Design System
description: >
  A premium, dark-first B2B print-shop management interface.
  Anchored on a near-black Linear-inspired canvas with a four-step surface ladder.
  Single chromatic brand accent is "Ink Indigo" (#5c6bc8). Typography is Inter
  with aggressive negative tracking on display (BMW/Linear) and weight-400 body
  (Cursor/Notion). Rounding follows Cursor/Linear 8px button / 12px card.
  Conversational chat layouts borrow WhatsApp Web two-panel discipline.

colors:
  primary:              "#5c6bc8"
  primary-hover:        "#7986d8"
  primary-active:       "#4a5ab0"
  on-primary:           "#ffffff"
  success:              "#27c45e"
  success-muted:        "#0f2a1a"
  warning:              "#f59e0b"
  warning-muted:        "#2a1e00"
  danger:               "#e5534b"
  danger-muted:         "#2a0f0f"
  info:                 "#3b96db"
  info-muted:           "#0a1e30"
  canvas:               "#0a0a0b"
  canvas-soft:          "#111113"
  surface-1:            "#161618"
  surface-2:            "#1e1e21"
  surface-3:            "#252528"
  surface-4:            "#2e2e32"
  hairline:             "#2a2a2f"
  hairline-strong:      "#3a3a42"
  hairline-soft:        "#1f1f23"
  ink:                  "#f0f0f3"
  ink-secondary:        "#c4c4cc"
  ink-muted:            "#8a8a96"
  ink-subtle:           "#55555f"
  bubble-bot:           "#1e1e21"
  bubble-customer:      "#2d3158"
  bubble-bot-text:      "#e0e0ea"
  bubble-customer-text: "#e8eaff"
  accent-emerald:       "#10b981"
  accent-amber:         "#f59e0b"
  accent-sky:           "#38bdf8"
  accent-rose:          "#fb7185"

typography:
  font-sans: "'Inter Variable', 'Inter', -apple-system, sans-serif"
  font-mono: "'JetBrains Mono', 'Fira Code', monospace"

  display-xl:
    fontSize: "56px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-2.0px"
  display-lg:
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-1.2px"
  display-md:
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.6px"
  heading-lg:
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.3px"
  heading-md:
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.2px"
  heading-sm:
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0"
  body-lg:
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  body-md:
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  body-sm:
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  label-uppercase:
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.8px"
  caption:
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0"
  button:
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: "0"

rounded:
  none: "0px"
  xs:   "4px"
  sm:   "6px"
  md:   "8px"
  lg:   "12px"
  xl:   "16px"
  xxl:  "20px"
  pill: "9999px"
  full: "9999px"

spacing:
  xxs:     "4px"
  xs:      "8px"
  sm:      "12px"
  md:      "16px"
  lg:      "24px"
  xl:      "32px"
  xxl:     "48px"
  section: "80px"

elevation:
  flat:   "none"
  soft:   "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)"
  raised: "0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)"
  float:  "0 8px 24px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.4)"
  modal:  "0 20px 48px rgba(0,0,0,0.7), 0 8px 16px rgba(0,0,0,0.5)"

motion:
  fast:    "120ms"
  base:    "200ms"
  slow:    "350ms"
  message: "250ms"
  spring:  "cubic-bezier(0.34, 1.56, 0.64, 1)"
  smooth:  "cubic-bezier(0.4, 0, 0.2, 1)"
  out:     "cubic-bezier(0, 0, 0.2, 1)"
---

## Overview

PrintSathi Master Design System — synthesized from BMW, Linear, Cursor, Notion, and WhatsApp design analyses.

**Canvas:** Near-black #0a0a0b (Linear inspired, deepest dark)
**Accent:** Ink Indigo #5c6bc8 — used scarcely: CTA, brand mark, focus ring only
**Typography:** Inter Variable — heavy negative-tracked display (BMW/Linear), weight-400 body (Cursor/Notion)
**Rounding:** 8px buttons, 12px cards (Cursor/Linear convention)
**Depth:** Surface ladder + hairlines. No heavy shadows. (Linear/Cursor)
**Layout:** WhatsApp Web two-panel for dashboard; chat bubbles for customer flow

## Application Pages

### 1. Customer Chat Flow — /s/[slug]
Phone-centered WhatsApp-style conversational bot. Left-aligned bot bubbles, right-aligned customer bubbles. Sticky header + sticky input bar. Typing indicator. Upload progress bars. Quick-reply chips.

### 2. Shopkeeper Dashboard — /dashboard
WhatsApp Web two-panel. Left 320px sidebar with job list (token avatar, name, file summary, status stripe). Right flex-1 conversation thread with chat-style file bubbles and bottom action tray.

### 3. Passport Studio — /dashboard/passport
BMW-precision interface. Full-height A4 preview on left. Config panel on right. Flat precision action tray at bottom.

### 4. Auth Pages — /login, /register, /onboarding
Single centered card on dark canvas. Brand stripe above card. Animated input focus states.

### 5. Landing Page — /
Hero band with display-xl headline. Feature alternating bands. Single primary CTA.

## Variation Matrix

**Variation A (Standard):** Baseline tokens, standard animations, default spacing.
**Variation B (Dense):** Tighter spacing, body-sm in secondary info, compact icon-only action tray.
**Variation C (Atmospheric):** backdrop-blur on all surfaces, deeper shadows, richer gradient stripe, full micro-animation suite.
**Variation D (Minimalist):** Max whitespace, borders only for depth, no shadow, always-visible icon labels.

## Do's
- Primary color ONLY for: CTA, brand mark, focus ring, active indicator
- Weight 700 display + weight 400 body — the signature contrast
- 8px buttons, 12px cards — consistent rounding
- Skeleton states during ALL loading — never blank areas
- scale(0.97) on active for all interactive elements
- Chat bubbles slide-in from origin side
- Backdrop-blur on sticky headers and action trays

## Don'ts
- No second chromatic color alongside primary
- No heavy drop shadows
- No bold body text
- No pill radius on cards or inputs (only badges and tokens)
- No blank loading states
- No pure white (#ffffff) — use ink colors on dark
- No primary as card fill or section background
