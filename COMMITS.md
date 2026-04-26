# Print Sathi — Commit Log & Git Workflow

## Commit Rules

1. **Every phase completion** → one commit minimum
2. **Every significant sub-task** → atomic commit
3. **Format:** `type(scope): description`
4. **Before each commit** → I will ask: *"Ready to commit [description] — continue?"*
5. **After each commit** → push to `main` on https://github.com/bhavyab212/Print-Sathi

---

## Commit Types

| Type | When to use |
|------|------------|
| `feat` | New feature or module |
| `fix` | Bug fix |
| `chore` | Setup, config, tooling |
| `docs` | Documentation only |
| `refactor` | Code restructure, no new feature |
| `style` | UI/CSS changes |
| `test` | Tests only |
| `db` | Database migrations or schema changes |

---

## Planned Commits (in order)

```
chore: init repo — context, progress, architecture docs
feat(phase-0): init Next.js 14 monorepo with Tailwind + shadcn
feat(phase-0): supabase schema — all tables + RLS policies
feat(phase-0): auth — shopkeeper login + session + protected routes
feat(phase-0): dashboard shell — layout, sidebar, onboarding wizard
feat(phase-0): python service — FastAPI health check on Koyeb
feat(phase-1a): passport photo — file upload + size config + copies
feat(phase-1a): passport photo — rembg integration + face crop preview
feat(phase-1a): passport photo — A4 sheet generation + browser print
feat(phase-1b): bill calculator — UI + rate card + client-side calc
feat(phase-2): fix-print — file upload + docx/pptx → pdf conversion
feat(phase-2): fix-print — preset cards + advanced settings panel
feat(phase-2): fix-print — pdf-lib processing + preview + print
feat(phase-3): qr-queue — customer landing page + job submission
feat(phase-3): qr-queue — word token + rate limiting
feat(phase-3): qr-queue — realtime status page for customer
feat(phase-3): qr-queue — shopkeeper queue dashboard + job approval
feat(phase-3): qr-queue — drag reorder + urgent flag + qr poster
feat(phase-5): admin panel — shops list + analytics + usage logs
```

---

## Commit History

| # | Hash | Message | Date |
|---|------|---------|------|
| 1 | _pending_ | `chore: init repo — context, progress, architecture docs` | 2026-04-26 |
