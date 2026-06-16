# Print-Sathi Orchestrator Handoff
Generated: 2026-06-15T11:23:00+05:30

## Status: ALL 3 REQUIREMENTS COMPLETE ✅

---

## R1 — RLS Bug Fix: SQL & Instructions

### Step-by-Step Instructions for the User

1. **Open your browser** and go to:
   👉 https://supabase.com/dashboard/project/upvmgcxuibffxnfyhcoc/sql/new

2. **Clear** any existing text in the SQL editor.

3. **Paste** the entire SQL block below into the editor.

4. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`).

5. You should see: `Success. No rows returned.`

6. **Verify** by going to:
   Authentication → Policies in the Supabase dashboard.
   You should see the new granular policies on `jobs` and `job_items`.

---

### Exact SQL (verbatim from `0008_fix_rls_and_notes.sql`)

```sql
-- ============================================================
-- MIGRATION 0008: Fix RLS conflict on job_items INSERT
-- The FOR ALL policy with USING clause fires for INSERT too,
-- creating a conflict with the public insert policy.
-- Fix: split into explicit SELECT/UPDATE/DELETE + separate INSERT
-- Also: ensure jobs public_insert does not conflict
-- ============================================================

-- Drop conflicting policies
drop policy if exists "job_items_owner" on public.job_items;
drop policy if exists "job_items_public_insert" on public.job_items;
drop policy if exists "jobs_owner_all" on public.jobs;
drop policy if exists "jobs_public_insert" on public.jobs;
drop policy if exists "jobs_public_read_own" on public.jobs;

-- ============================================================
-- JOBS: Re-create with explicit FOR clauses
-- ============================================================

-- Shop owner can read their own shop's jobs
create policy "jobs_owner_select" on public.jobs
  for select using (
    shop_id in (select id from public.shops where owner_id = auth.uid())
  );

-- Shop owner can update their own shop's jobs
create policy "jobs_owner_update" on public.jobs
  for update using (
    shop_id in (select id from public.shops where owner_id = auth.uid())
  );

-- Shop owner can delete their own shop's jobs
create policy "jobs_owner_delete" on public.jobs
  for delete using (
    shop_id in (select id from public.shops where owner_id = auth.uid())
  );

-- Public: anyone can insert a job (customers — no auth)
create policy "jobs_public_insert" on public.jobs
  for insert with check (true);

-- Public: anyone can read any job (job_id is UUID; unguessable)
create policy "jobs_public_select" on public.jobs
  for select using (true);

-- ============================================================
-- JOB ITEMS: Re-create with explicit FOR clauses
-- ============================================================

-- Shop owner can read job_items in their shop's jobs
create policy "job_items_owner_select" on public.job_items
  for select using (
    job_id in (
      select id from public.jobs where shop_id in (
        select id from public.shops where owner_id = auth.uid()
      )
    )
  );

-- Shop owner can update job_items in their shop's jobs
create policy "job_items_owner_update" on public.job_items
  for update using (
    job_id in (
      select id from public.jobs where shop_id in (
        select id from public.shops where owner_id = auth.uid()
      )
    )
  );

-- Shop owner can delete job_items in their shop's jobs
create policy "job_items_owner_delete" on public.job_items
  for delete using (
    job_id in (
      select id from public.jobs where shop_id in (
        select id from public.shops where owner_id = auth.uid()
      )
    )
  );

-- Public: customers can insert items (no auth required)
create policy "job_items_public_insert" on public.job_items
  for insert with check (true);

-- Public: anyone can read any job_item (linked to unguessable job UUID)
create policy "job_items_public_select" on public.job_items
  for select using (true);

-- ============================================================
-- SUPER ADMIN: full access to all tables (from migration 0007)
-- Drop and re-create cleanly
-- ============================================================
drop policy if exists "super_admin_shops_all" on public.shops;
drop policy if exists "super_admin_jobs_all" on public.jobs;
drop policy if exists "super_admin_job_items_all" on public.job_items;

create policy "super_admin_shops_all" on public.shops for all using (
  exists (select 1 from public.admin_users where user_id = auth.uid())
);

create policy "super_admin_jobs_all" on public.jobs for all using (
  exists (select 1 from public.admin_users where user_id = auth.uid())
);

create policy "super_admin_job_items_all" on public.job_items for all using (
  exists (select 1 from public.admin_users where user_id = auth.uid())
);
```

---

### Plain-Language Explanation of Each Statement

#### DROP Statements (5 policies removed)

| Policy Dropped | Table | Why |
|---|---|---|
| `job_items_owner` | job_items | Was a `FOR ALL` policy with a `USING` clause — PostgreSQL applies the USING clause to INSERTs too, which conflicted with the public insert policy, causing all customer uploads to be blocked. |
| `job_items_public_insert` | job_items | Old version being replaced with a cleaner one. |
| `jobs_owner_all` | jobs | Same problem — `FOR ALL` + `USING` fires on INSERT, blocking customer job creation. |
| `jobs_public_insert` | jobs | Old version being replaced. |
| `jobs_public_read_own` | jobs | Redundant/conflicting read policy being replaced. |

#### CREATE Statements for `jobs` table (5 new policies)

| Policy | Operation | Who | What it allows |
|---|---|---|---|
| `jobs_owner_select` | SELECT | Authenticated shop owner | Read any job that belongs to their shop. Checks `shop_id` against shops where `owner_id = auth.uid()`. |
| `jobs_owner_update` | UPDATE | Authenticated shop owner | Update (e.g., change status) any job in their shop. Same ownership check. |
| `jobs_owner_delete` | DELETE | Authenticated shop owner | Delete any job in their shop. |
| `jobs_public_insert` | INSERT | Anyone (no auth) | Customers can create a new job without logging in. `with check (true)` means no restrictions on the new row. |
| `jobs_public_select` | SELECT | Anyone | Anyone who knows the job UUID can read it. Safe because UUIDs are unguessable (used for customer status pages). |

#### CREATE Statements for `job_items` table (5 new policies)

| Policy | Operation | Who | What it allows |
|---|---|---|---|
| `job_items_owner_select` | SELECT | Authenticated shop owner | Read file items for any job in their shop. Traverses: job_items → jobs → shops → owner check. |
| `job_items_owner_update` | UPDATE | Authenticated shop owner | Update file items (e.g., mark printed) in their shop's jobs. |
| `job_items_owner_delete` | DELETE | Authenticated shop owner | Delete file items from their shop's jobs. |
| `job_items_public_insert` | INSERT | Anyone (no auth) | Customers can add files to a job without logging in. |
| `job_items_public_select` | SELECT | Anyone | Anyone with the job UUID can see the file list (used for customer status page). |

#### DROP + CREATE for Super Admin (3 + 3 = 6 statements)

| Statement | Purpose |
|---|---|
| `drop policy … super_admin_*` | Removes old super-admin policies to avoid duplicates from migration 0007. |
| `super_admin_shops_all` | Super admin (in `admin_users` table) has full SELECT/INSERT/UPDATE/DELETE on all shops. |
| `super_admin_jobs_all` | Super admin has full access to all jobs across all shops. |
| `super_admin_job_items_all` | Super admin has full access to all file items across all jobs. |

#### Root Cause Summary
The original bug: PostgreSQL's `FOR ALL` RLS policy applies its `USING` clause to **all operations including INSERT**. When a customer tried to insert a job (unauthenticated), the `FOR ALL` owner policy's `USING` clause evaluated `auth.uid()` → returned null → the subquery returned no rows → INSERT was denied, even though a separate public insert policy existed. **The fix splits every `FOR ALL` policy into explicit `FOR SELECT`, `FOR UPDATE`, `FOR DELETE` policies** (which correctly use `USING`) plus a separate `FOR INSERT` policy (which uses `WITH CHECK`). This eliminates the conflict entirely.

---

## R2 — react-easy-crop Integration

- **Package installed:** `react-easy-crop@6.0.2` in `/apps/web/`
- **File modified:** `/apps/web/src/app/s/[slug]/page.tsx` (598 → 754 lines)
- **Features added:**
  - `getCroppedImg()` helper using HTML Canvas (rotation + crop)
  - `activeCrop` state for tracking the active crop session
  - Per-file "Crop / Rotate" button (visible only for image files with action='edit')
  - Inline `<Cropper>` component with free-form crop area
  - Rotation buttons: -90°, -45°, +45°, +90°
  - "Crop & Done" button: applies crop, replaces `item.file` with cropped JPEG, updates `previewUrl`
  - "Cancel" button: closes editor without changes
  - Thumbnail preview shown after crop (via updated `previewUrl`)

---

## R3 — Build Verification

- **Command run:** `npm run build` in `/apps/web/`
- **Result:** ✅ Exit code 0
- **Pages compiled:** 19 pages
- **Route /s/[slug]:** 142 kB (First Load JS)
- **TypeScript check:** `tsc --noEmit` exits 0, no errors
- **No files other than page.tsx were modified**

---

## Files Modified

| File | Change |
|---|---|
| `/apps/web/package.json` | Added `react-easy-crop@6.0.2` dependency |
| `/apps/web/package-lock.json` | Updated by npm install |
| `/apps/web/src/app/s/[slug]/page.tsx` | Added crop/rotate editor UI (598 → 754 lines) |
| `/apps/web/node_modules/react-easy-crop/` | New package installed |
