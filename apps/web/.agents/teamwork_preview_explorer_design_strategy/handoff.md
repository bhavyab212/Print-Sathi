# Handoff Report: Design System Integration Strategy

## 1. Observation
- The project scope mandates processing `/media/bhavya/backup and etc/Project/Printo_/design_files/MASTER_DESIGN.md` using Stitch MCP tools and applying it to Next.js global CSS/Tailwind.
- `MASTER_DESIGN.md` contains unified design tokens (e.g., primary color `#5c6bc8`, `Inter` font, `dark-first` theme, `8px` buttons).
- Stitch MCP tool schemas in `/home/bhavya/.gemini/antigravity/mcp/StitchMCP` reveal a specific dependency chain:
  - `upload_design_md` accepts base64 content and requires `create_design_system_from_design_md` to be called afterward.
  - `create_design_system_from_design_md` strictly requires a `selectedScreenInstance` as input.
  - `generate_screen_from_text` creates a screen but might take time. Instructions say to poll `get_screen` if there is a timeout.
  - `apply_design_system` requires `assetId` (the design system) and `selectedScreenInstances`.
- No direct Stitch MCP tool exists for exporting the design system into a local `globals.css`.
- The local `src/app/globals.css` and `tailwind.config.ts` are heavily populated but exhibit drift from `MASTER_DESIGN.md` (e.g., `globals.css` light mode uses `#4f46e5` for primary, whereas the master design dictates a strict `#5c6bc8` "Ink Indigo" brand color).

## 2. Logic Chain
1. **MCP Sequence Constraint**: Because `create_design_system_from_design_md` mandates a `selectedScreenInstance`, the Worker cannot simply upload the design system to an empty project. A screen must be generated first using `generate_screen_from_text`.
2. **Uploading the Design**: `MASTER_DESIGN.md` must be base64-encoded (`base64 -w 0`) and pushed via `upload_design_md`.
3. **Application within Stitch**: Once the design system asset is created, it must be bound to the generated screen using `apply_design_system` to fulfill the "process using Stitch MCP" requirement.
4. **Application to Next.js**: Since Stitch MCP lacks an automated code-export tool for the codebase CSS, the Worker must manually align the Next.js UI layer. The Worker needs to patch `globals.css` and `tailwind.config.ts` so they identically match `MASTER_DESIGN.md` (converting the master hex values like `#5c6bc8` to HSL for `shadcn` compatibility).

## 3. Caveats
- `generate_screen_from_text` can timeout. The Worker must gracefully handle this by polling via `get_screen` / `get_project` before proceeding.
- The Worker will need to calculate HSL equivalents for the `MASTER_DESIGN.md` hex colors manually when updating the Shadcn variables in `globals.css`.

## 4. Conclusion
**Recommended Step-by-Step Strategy for Worker:**
1. **Initialize Project:** Call `create_project(title: "Print-Sathi")` to get a `projectId`.
2. **Bootstrap Screen:** Call `generate_screen_from_text(projectId, prompt: "Customer Chat Flow")`. Wait for completion or poll `get_screen` until a screen is available. Retrieve the `selectedScreenInstance` ID from `get_project`.
3. **Upload Master Design:** Read `MASTER_DESIGN.md`, base64-encode it, and call `upload_design_md(projectId, designMdBase64)`.
4. **Create Design System:** Call `create_design_system_from_design_md(projectId, selectedScreenInstance)` to generate the global design system asset.
5. **Apply in Stitch:** Call `apply_design_system(projectId, assetId, [selectedScreenInstance])`.
6. **Sync Local Codebase:** Manually edit `src/app/globals.css`. Resolve the token drift by overriding the default Shadcn variables with the HSL values derived from `MASTER_DESIGN.md` (e.g., setting `--primary` to match `#5c6bc8`).

## 5. Verification Method
- Ensure all MCP calls succeed without error.
- Call `get_project` to verify the design system is successfully attached to the project.
- Run `npm run build` to ensure Tailwind/CSS changes compile correctly.
- Review `globals.css` to confirm the primary color `#5c6bc8` is correctly configured across all themes.
