# Handoff Report: Design System Token Collision Fix

## 1. Observation
- **`tailwind.config.ts`**: The file currently contains duplicate object keys in `theme.extend.colors` and `theme.extend.borderRadius`.
  - Lines 49-52 define `"primary": "#5c6bc8"` and its variants.
  - Lines 87-90 define `primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" }`.
  - Lines 122-126 define `borderRadius` `"sm": "6px"`, `"md": "8px"`, `"lg": "12px"`.
  - Lines 130-132 define Shadcn's `lg: "var(--radius)"`, `md: "calc(var(--radius) - 2px)"`, `sm: "calc(var(--radius) - 4px)"`.
- **`src/app/globals.css`**: The HSL variables do not map correctly to the `MASTER_DESIGN.md` values.
  - Light mode (Line 94): `--primary: 243.3 75.4% 58.6%;` (Shadcn default indigo, instead of design system's `#5c6bc8`).
  - Dark mode (Line 164): `--background: 240 10% 3.9%;` (Shadcn default dark background, instead of design system's canvas `#0a0a0b`).
- **Reviewer Veto**: "Duplicate Object Keys in `tailwind.config.ts`... Shadcn properties silently overwrite the design system values (`#5c6bc8` and `12px`)." and "Dark Canvas Background Mismatch: `--background` under `.dark` is still `240 10% 3.9%` (`#09090b`) in `globals.css` rather than the required `#0a0a0b`."

## 2. Logic Chain
1. **Duplicate Keys Issue**: In JavaScript, setting a key twice in an object literal causes the latter to overwrite the former. Shadcn's default definitions placed at the bottom of the objects overwrite the preceding design system literal tokens.
2. **Solution for `tailwind.config.ts`**: To keep both Shadcn compatibility and design system colors, we must *merge* the properties into single definitions. 
   - For `colors.primary`, combine the flat string design tokens into Shadcn's object. 
   - For `borderRadius`, remove the Shadcn `calc()` variables for `sm`, `md`, `lg` entirely, letting the design system's absolute pixel values drive the UI, which fulfills Shadcn's class dependencies correctly.
3. **Globals.css Alignment**: Shadcn components rely on HSL CSS variables like `hsl(var(--primary))`. Because `#5c6bc8` translates exactly to `hsl(232, 50%, 57%)`, changing `--primary` in `:root` to `232 50% 57%` guarantees that Shadcn components match the design system out of the box in light mode. Similarly, translating the dark canvas `#0a0a0b` to HSL yields `240 4.8% 4.1%`, which must be set for `--background` in `.dark`.

## 3. Caveats
- I did not verify if other components rely specifically on the CSS variable `--radius`. The strategy removes `--radius` calculation bindings from Tailwind (`lg: "var(--radius)"` -> `"lg": "12px"`), which locks the radii at the exact design system definitions.
- The `canvas` and `surface-1` tokens are injected properly into Tailwind, but ensuring Shadcn components inherit these colors requires mapping Shadcn variables (`--background`, `--card`, etc.) to the exact HSL variants if the user uses Shadcn standard classes (`bg-background`).

## 4. Conclusion
The Worker must execute a targeted patch to both files.

### Step-by-Step Implementation Strategy for Worker:

**A. In `tailwind.config.ts`:**
Use the `multi_replace_file_content` tool to resolve the duplicate keys.
1. Remove the standalone string definitions for `primary`, `primary-hover`, `primary-active`.
2. Edit Shadcn's `primary` object to merge the values:
   ```javascript
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover: "var(--ps-primary-hover)",
          active: "var(--ps-primary-active)",
          foreground: "hsl(var(--primary-foreground))",
        },
   ```
3. Remove Shadcn's computed variables for `borderRadius` (`lg: "var(--radius)"`, `md: ...`, `sm: ...`). Leave the design system's `"sm": "6px"`, `"md": "8px"`, `"lg": "12px"` as the sole source of truth for these keys.

**B. In `src/app/globals.css`:**
Use the `multi_replace_file_content` tool to align the HSL CSS variables with the design system.
1. In `:root` block (around line 94):
   Change `--primary: 243.3 75.4% 58.6%;` to `--primary: 232 50% 57%;`
2. In `.dark` block (around line 164):
   Change `--background: 240 10% 3.9%;` to `--background: 240 4.8% 4.1%;`

## 5. Verification Method
- **Inspect Object Validity**: Run `npx tailwindcss -i ./src/app/globals.css -o ./dev-dist.css` to verify the configuration compiles correctly without dropping tokens.
- **Visual Inspection**: Open `tailwind.config.ts` to ensure `colors.primary` is an object containing `hover`, `active`, and `DEFAULT` and that `borderRadius` contains only one definition for `sm`, `md`, and `lg`.
- **CSS Review**: Open `globals.css` and verify `--primary` under `:root` and `--background` under `.dark` have been successfully updated.
