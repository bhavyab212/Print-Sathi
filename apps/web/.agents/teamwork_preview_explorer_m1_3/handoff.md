# Handoff Report: Light Mode Redesign

## Observation
- Investigated `globals.css`, `tailwind.config.ts`, and components like `BgRemoveFlow.tsx` and `UploadPanel.tsx`.
- The primary text color `var(--ps-ink)` (`#0f172a`) against the primary background (`#ffffff` or `#eff2f6`) has a contrast ratio of >15:1. `var(--ps-primary)` against white is `6.29:1`. Both comfortably exceed the 4.5:1 WCAG AA requirement.
- The contrast ratio between tool card backgrounds (`#ffffff`) and the light mode canvas (`var(--ps-canvas)`: `#eff2f6`) is currently `1.12:1`.
- The existing border for cards, `var(--ps-hairline)` (`rgba(0, 0, 0, 0.22)`), yields a contrast of `1.71:1` against white.
- The gradients `--bg-header-gradient` and `--bg-toolpanel-gradient` exist in `globals.css` but are very faint and not applied to the main workspace in `BgRemoveFlow.tsx` (which explicitly uses `bg-background` which resolves to `#ffffff`).

## Logic Chain
1. To meet the text contrast requirement of 4.5:1, the current typography colors (`--ps-ink`, `--ps-primary`) are sufficient and do not require changes.
2. To address the 1.5:1 card-to-background contrast requirement, the canvas (`#eff2f6`) and card (`#ffffff`) currently fail the check (1.12:1). We have two paths: darken the canvas or rely on a "prominent border/shadow".
3. To rely on a prominent border (as allowed by the criteria), we must increase `--ps-hairline` (card borders) and `--neu-dark` (neumorphic shadows) to offer clearer distinction.
4. To meet the "modern, pleasing gradients" requirement, we need to adjust `--bg-toolpanel-gradient` in `globals.css` to feature richer brand-appropriate blues/purples, and apply the `bg-toolpanel-gradient` utility class to the main workspace container in the UI components (replacing flat classes like `bg-background`).

## Caveats
- No code was implemented. This investigation outlines the planned CSS token and component class changes.
- Ensure the updated shadows/borders only apply to the light mode by utilizing the `.dark` selector correctly in `globals.css` (the dark mode section is well-separated at the bottom).

## Conclusion
**Strategy to Implement:**
1. **In `globals.css`**:
   - Update `--ps-hairline` from `rgba(0, 0, 0, 0.22)` to `rgba(0, 0, 0, 0.35)` to increase the border contrast ratio to >2.4:1 for prominent card distinction.
   - Update `--bg-toolpanel-gradient` to a more visible subtle blue/purple gradient: e.g., `linear-gradient(180deg, #f8fafc 0%, #e0e7ff 100%)`.
   - Update `--neu-dark` shadow opacity to `rgba(15, 23, 42, 0.15)` for stronger neumorphic depth.
2. **In UI Components** (e.g., `BgRemoveFlow.tsx`):
   - Change main wrapper div classes from `bg-background` to `bg-toolpanel-gradient`.

## Verification Method
1. Run the contrast checker script (`check_contrast.py`) provided in this directory to mathematically verify contrast ratios.
2. Build the project using `npm run build` to confirm no tailwind class errors occur.
3. Visually inspect the local UI in light mode to ensure the new `bg-toolpanel-gradient` properly renders.
