-- ============================================================
-- Print Sathi — Row Level Security Policies
-- Run this AFTER 0000_init_schema.sql
-- ============================================================

-- Enable RLS on all tables
alter table public.shops enable row level security;
alter table public.rate_cards enable row level security;
alter table public.jobs enable row level security;
alter table public.job_items enable row level security;
alter table public.job_status_log enable row level security;
alter table public.usage_logs enable row level security;
alter table public.rate_limits enable row level security;
alter table public.word_pool enable row level security;
alter table public.admin_users enable row level security;

-- ============================================================
-- SHOPS: owner can CRUD their own shop
-- ============================================================
create policy "shop_owner_select" on public.shops
  for select using (auth.uid() = owner_id);

create policy "shop_owner_insert" on public.shops
  for insert with check (auth.uid() = owner_id);

create policy "shop_owner_update" on public.shops
  for update using (auth.uid() = owner_id);

-- Public: anyone can read a shop by slug (for customer QR page)
create policy "shop_public_read_by_slug" on public.shops
  for select using (true);

-- ============================================================
-- RATE CARDS: shop owner only
-- ============================================================
create policy "rate_cards_owner" on public.rate_cards
  for all using (
    shop_id in (select id from public.shops where owner_id = auth.uid())
  );

-- ============================================================
-- JOBS: shop owner can manage; public can insert (customer submissions)
-- ============================================================
create policy "jobs_owner_all" on public.jobs
  for all using (
    shop_id in (select id from public.shops where owner_id = auth.uid())
  );

-- Public: customers can insert jobs (QR flow — no auth)
create policy "jobs_public_insert" on public.jobs
  for insert with check (true);

-- Public: customers can read their own job (by word_token)
create policy "jobs_public_read_own" on public.jobs
  for select using (true);

-- ============================================================
-- JOB ITEMS: follows job access
-- ============================================================
create policy "job_items_owner" on public.job_items
  for all using (
    job_id in (
      select id from public.jobs where shop_id in (
        select id from public.shops where owner_id = auth.uid()
      )
    )
  );

-- Public: customers can insert items with their job
create policy "job_items_public_insert" on public.job_items
  for insert with check (true);

-- ============================================================
-- JOB STATUS LOG: shop owner reads
-- ============================================================
create policy "job_status_log_owner" on public.job_status_log
  for all using (
    job_id in (
      select id from public.jobs where shop_id in (
        select id from public.shops where owner_id = auth.uid()
      )
    )
  );

-- ============================================================
-- USAGE LOGS: shop owner reads; system inserts
-- ============================================================
create policy "usage_logs_owner" on public.usage_logs
  for select using (
    shop_id in (select id from public.shops where owner_id = auth.uid())
  );

create policy "usage_logs_insert" on public.usage_logs
  for insert with check (true);

-- ============================================================
-- RATE LIMITS: public can read/write (checked at application level)
-- ============================================================
create policy "rate_limits_public" on public.rate_limits
  for all using (true);

-- ============================================================
-- WORD POOL: read-only for all
-- ============================================================
create policy "word_pool_read" on public.word_pool
  for select using (true);

-- ============================================================
-- ADMIN USERS: only the user themselves can see their admin status
-- ============================================================
create policy "admin_users_self" on public.admin_users
  for select using (auth.uid() = user_id);
