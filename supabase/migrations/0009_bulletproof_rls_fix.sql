DO $$ 
DECLARE
  pol record;
BEGIN
  -- Drop all existing policies on jobs and job_items
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename IN ('jobs', 'job_items')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 1. JOBS Policies
create policy "jobs_owner_select" on public.jobs for select using (
  shop_id in (select id from public.shops where owner_id = auth.uid())
);
create policy "jobs_owner_update" on public.jobs for update using (
  shop_id in (select id from public.shops where owner_id = auth.uid())
);
create policy "jobs_owner_delete" on public.jobs for delete using (
  shop_id in (select id from public.shops where owner_id = auth.uid())
);
create policy "jobs_public_insert" on public.jobs for insert with check (true);
create policy "jobs_public_select" on public.jobs for select using (true);

-- 2. JOB_ITEMS Policies
create policy "job_items_owner_select" on public.job_items for select using (
  job_id in (select id from public.jobs where shop_id in (select id from public.shops where owner_id = auth.uid()))
);
create policy "job_items_owner_update" on public.job_items for update using (
  job_id in (select id from public.jobs where shop_id in (select id from public.shops where owner_id = auth.uid()))
);
create policy "job_items_owner_delete" on public.job_items for delete using (
  job_id in (select id from public.jobs where shop_id in (select id from public.shops where owner_id = auth.uid()))
);
create policy "job_items_public_insert" on public.job_items for insert with check (true);
create policy "job_items_public_select" on public.job_items for select using (true);

-- 3. Super Admin Policies
drop policy if exists "super_admin_shops_all" on public.shops;
create policy "super_admin_shops_all" on public.shops for all using (
  exists (select 1 from public.admin_users where user_id = auth.uid())
);
