-- Allow super admins full access to shops
create policy "super_admin_shops_all" on public.shops for all using (
  exists (select 1 from public.admin_users where user_id = auth.uid() and role = 'super_admin')
);

-- Allow super admins full access to jobs
create policy "super_admin_jobs_all" on public.jobs for all using (
  exists (select 1 from public.admin_users where user_id = auth.uid() and role = 'super_admin')
);

-- Allow super admins full access to job items
create policy "super_admin_job_items_all" on public.job_items for all using (
  exists (select 1 from public.admin_users where user_id = auth.uid() and role = 'super_admin')
);
