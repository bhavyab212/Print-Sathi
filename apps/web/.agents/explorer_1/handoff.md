# Handoff Report: Design System Integration Strategy

## 1. Observation
- The project's unified design tokens are stored locally in `/media/bhavya/backup and etc/Project/Printo_/design_files/MASTER_DESIGN.md`. This file contains the merged YAML tokens (colors, typography, rounded, etc.).
- The Stitch MCP server (`/home/bhavya/.gemini/antigravity/mcp/StitchMCP`) provides tools to create a Stitch project (`create_project`), upload design markdown (`upload_design_md`), create a design system (`create_design_system_from_design_md`), and apply it to screens within Stitch (`apply_design_system`).
- Stitch MCP does not provide a tool to automatically generate and apply these design tokens locally to `tailwind.config.ts` and `src/app/globals.css`.
- The target Tailwind configuration file exists at `/media/bhavya/backup and etc/Project/Printo_/apps/web/tailwind.config.ts` and relies on CSS variables for styling.

## 2. Logic Chain
- To fulfill the requirement of processing the design file using Stitch MCP:
  1. We must verify if a project exists (using `list_projects`) or create one (using `create_project`) to obtain a `projectId`.
  2. The `MASTER_DESIGN.md` needs to be read and encoded in base64.
  3. We must call `upload_design_md` with the base64 content and `projectId`, which returns a `selectedScreenInstance`.
  4. We must then call `create_design_system_from_design_md` passing the `projectId` and `selectedScreenInstance`.
  5. We use `list_design_systems` to verify its creation and retrieve the `assetId`.
- To fulfill the requirement of applying the design system to Next.js global CSS & Tailwind:
  1. Since Stitch MCP applies styles only to Stitch cloud screens, the local application must be done via direct file edits.
  2. The Worker must manually parse the YAML frontmatter in `MASTER_DESIGN.md` (e.g., color `primary: "#5c6bc8"`, `canvas: "#0a0a0b"`).
  3. The Worker must translate these tokens to CSS variables inside `src/app/globals.css` and map them into the `theme.extend` section of `tailwind.config.ts`.

## 3. Caveats
- `upload_design_md` expects valid UTF-8 base64 strings.
- Stitch MCP tools might have latency or connection issues; wait and do not retry blindly as described in the tool instructions.
- Applying tokens to Next.js is a manual file-edit task, as there is no tool in Stitch MCP for local CSS code generation.

## 4. Conclusion
The implementation strategy for the Worker involves two distinct phases:
**Phase 1: Stitch MCP Cloud Setup**
1. Read `/media/bhavya/backup and etc/Project/Printo_/design_files/MASTER_DESIGN.md`.
2. Check `list_projects` (or call `create_project` if empty) to get a `projectId`.
3. Base64-encode the markdown content and call `upload_design_md` -> get `selectedScreenInstance`.
4. Call `create_design_system_from_design_md` with `projectId` and `selectedScreenInstance`.
5. Call `list_design_systems` to get the `assetId` for the centralized system.

**Phase 2: Local Application**
1. Read the YAML block in `MASTER_DESIGN.md`.
2. Modify `src/app/globals.css` to include the specific color hexes, border-radii, and spacing as CSS root variables.
3. Modify `tailwind.config.ts` to extend the `colors`, `fontFamily`, and `borderRadius` based on the CSS variables.

## 5. Verification Method
- **Stitch MCP Verification**: Run `list_design_systems` using the MCP tool to ensure the new design system is returned with a valid `assetId`.
- **Local CSS Verification**: Run `npm run build` in `/media/bhavya/backup and etc/Project/Printo_/apps/web/` to ensure the Next.js build succeeds and Tailwind compiles without errors.
