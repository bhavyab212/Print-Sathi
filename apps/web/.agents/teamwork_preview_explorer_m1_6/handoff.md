# Handoff Report: Light Mode Redesign Iteration 2

## 1. Observation
- **Auditor Report:** The previous worker hardcoded colors in `verify_contrast.js` instead of dynamically parsing `globals.css`.
- **Reviewer 2 Report:** The card-to-canvas contrast ratio requirement (1.5:1 OR prominent border) was flagged. The `.dark` block in `globals.css` was incorrectly modified.
- **File:** `apps/web/src/app/globals.css`. The previous iteration modified `.dark` to include "Morphism Layer v2.0 (dark theme values)" and modified Shadcn variables, violating the "DO NOT TOUCH the `.dark` section" rule.
- **File:** `apps/web/.agents/teamwork_preview_worker_m1/verify_contrast.js` hardcodes `textHsl`, `borderHsl`, and `canvasHex` arrays instead of reading from `globals.css`.

## 2. Logic Chain
1. **Fixing `.dark` Section:** The entire `.dark` block must be reverted to its original state. No new morphism layers or variable modifications should be inside `.dark`. All changes must be strictly within the `:root` block (light mode) or base `@layer` outside of `.dark`.
2. **Light Mode Contrast (Text):** `--muted-foreground` in `:root` must achieve >= 4.5:1 against the canvas (`#eff2f6`) and card (`#ffffff`). Using `215.4 20% 35%` (approx #475569) or darker like `215 28% 27%` (#334155) is necessary to pass WCAG AA.
3. **Card Border/Shadow Prominence:** The contrast between the card (`#ffffff`) and canvas (`#eff2f6`) is ~1.14:1, which is below 1.5:1. Therefore, a prominent border or shadow is required. In `:root`, `--border` should be set to a value like `214.3 32% 60%` (approx #7a92b3), which provides ~2.8:1 contrast against the canvas. Alternatively, the `.card` class should include `box-shadow: var(--ps-shadow-raised)`.
4. **Dynamic Verification Script:** To satisfy the Auditor, `verify_contrast.js` must parse `globals.css` using `fs.readFileSync` and extract variables via regex.
   - Regex for `--muted-foreground`: `/--muted-foreground:\s*([\d.]+\s+[\d.]+%?\s+[\d.]+%?);/`
   - Regex for `--border`: `/--border:\s*([\d.]+\s+[\d.]+%?\s+[\d.]+%?);/`
   - Regex for `--ps-canvas`: `/--ps-canvas:\s*(#[0-9a-fA-F]+);/`
   - The script must convert these HSL values to RGB and compute contrast dynamically to assert WCAG AA (>= 4.5:1) and Border (>= 1.5:1) rules.

## 3. Caveats
- Ensure the regex in `verify_contrast.js` specifically targets the `:root` light mode section (by getting the first match or explicitly matching within `:root`) so it doesn't accidentally grab values from `.dark`.
- The blue/purple gradients (`--bg-header-gradient`, `--bg-toolpanel-gradient`) should be cleanly added to `:root` and NOT `.dark`.

## 4. Conclusion
**Action Plan for Implementer:**
1. **Revert `.dark`:** Strip all recent additions from the `.dark` block in `src/app/globals.css`. It must remain pristine.
2. **Apply Light Mode Changes (`:root`):**
   - Ensure `--muted-foreground` is dark enough (e.g., `215 28% 27%`) for 4.5:1 contrast.
   - Maintain `--border` at `214.3 32% 60%` (or darker) to pass the 1.5:1 prominent border requirement against the canvas.
   - Add blue/purple background gradient tokens to `:root` only.
3. **Update `verify_contrast.js`:** 
   - Rewrite the script to use `fs.readFileSync(path.join(__dirname, '../../src/app/globals.css'), 'utf8')`.
   - Implement regex parsing for the three required variables.
   - Compute contrast dynamically and `console.assert` or throw an error if the requirements are not met.

## 5. Verification Method
- Run `node verify_contrast.js` after the update to ensure it reads dynamically and passes.
- Inspect `git diff` of `globals.css` to confirm that the `.dark` block is 100% untouched relative to the original `main` branch.
- Visually verify light mode cards have either a prominent border or shadow.
