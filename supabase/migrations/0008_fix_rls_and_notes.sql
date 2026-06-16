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
