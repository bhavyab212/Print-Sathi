-- ============================================================
-- Print Sathi — Database Schema
-- Run this in the Supabase SQL Editor after creating your project
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. SHOPS — one row per print shop tenant
-- ============================================================
create table public.shops (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text not null unique,
  phone text,
  address text,
  area text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for slug lookups (customer QR pages)
create unique index shops_slug_idx on public.shops (slug);
create index shops_owner_idx on public.shops (owner_id);

-- ============================================================
-- 2. RATE CARDS — per-shop pricing
-- ============================================================
create table public.rate_cards (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references public.shops(id) on delete cascade not null,
  item_type text not null,        -- e.g. 'bw_single', 'color_single', 'passport_set'
  label text not null,            -- e.g. 'B&W Single Side'
  price numeric(10,2) not null,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index rate_cards_shop_idx on public.rate_cards (shop_id);

-- ============================================================
-- 3. JOBS — print jobs submitted by customers or shopkeeper
-- ============================================================
create table public.jobs (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references public.shops(id) on delete cascade not null,
  word_token text not null,           -- unique per shop per day (e.g. 'FOX')
  customer_name text,
  customer_phone text,
  status text not null default 'pending',  -- pending | approved | printing | done | rejected
  source text not null default 'counter',  -- counter | qr
  is_urgent boolean default false,
  queue_position int,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index jobs_shop_status_idx on public.jobs (shop_id, status);
create index jobs_shop_date_idx on public.jobs (shop_id, created_at);
-- Helper: immutable date extraction (timezone-safe)
create or replace function public.to_date_utc(ts timestamptz)
returns date as $$
  select (ts at time zone 'UTC')::date;
$$ language sql immutable;

-- Unique word token per shop per day
create unique index jobs_word_token_unique on public.jobs (
  shop_id, word_token, public.to_date_utc(created_at)
);

-- ============================================================
-- 4. JOB ITEMS — files attached to a job
-- ============================================================
create table public.job_items (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.jobs(id) on delete cascade not null,
  file_url text not null,
  file_name text,
  file_type text,               -- pdf, jpg, png, docx, pptx
  file_size_bytes bigint,
  settings jsonb default '{}',  -- copies, color, duplex, pages, layout, etc.
  created_at timestamptz default now()
);

create index job_items_job_idx on public.job_items (job_id);

-- ============================================================
-- 5. JOB STATUS LOG — audit trail for status changes
-- ============================================================
create table public.job_status_log (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.jobs(id) on delete cascade not null,
  old_status text,
  new_status text not null,
  changed_by text,    -- 'shopkeeper' | 'system' | 'customer'
  note text,
  created_at timestamptz default now()
);

create index job_status_log_job_idx on public.job_status_log (job_id);

-- ============================================================
-- 6. USAGE LOGS — track feature usage from day one
-- ============================================================
create table public.usage_logs (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references public.shops(id) on delete cascade not null,
  feature text not null,     -- 'passport_photo' | 'bill_calc' | 'fix_print' | 'qr_queue'
  action text not null,      -- 'created' | 'printed' | 'completed'
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index usage_logs_shop_feature_idx on public.usage_logs (shop_id, feature);
create index usage_logs_created_idx on public.usage_logs (created_at);

-- ============================================================
-- 7. RATE LIMITS — per phone, per shop, per hour
-- ============================================================
create table public.rate_limits (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references public.shops(id) on delete cascade not null,
  phone text not null,
  submission_count int default 1,
  window_start timestamptz default now(),
  created_at timestamptz default now()
);

create index rate_limits_lookup_idx on public.rate_limits (shop_id, phone, window_start);

-- ============================================================
-- 8. WORD POOL — available tokens for job identification
-- ============================================================
create table public.word_pool (
  id serial primary key,
  word text not null unique,
  is_used boolean default false
);

-- Seed with some 3-letter words
insert into public.word_pool (word) values
  ('FOX'),('SUN'),('OAK'),('BEE'),('CAT'),('DOG'),('ELF'),('GEM'),
  ('HAT'),('INK'),('JAM'),('KEY'),('LOG'),('MAP'),('NET'),('OWL'),
  ('PEN'),('RED'),('SKY'),('TOP'),('URN'),('VAN'),('WAX'),('YAK'),
  ('ZAP'),('ACE'),('BAT'),('CUP'),('DAM'),('EGG'),('FAN'),('GOD'),
  ('HUB'),('ICE'),('JOY'),('KIT'),('LIP'),('MUD'),('NUT'),('ORE'),
  ('PIE'),('RAG'),('SAW'),('TIN'),('UMP'),('VET'),('WIG'),('YEW');

-- ============================================================
-- 9. ADMIN USERS — super admin role marker
-- ============================================================
create table public.admin_users (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  role text not null default 'super_admin',
  created_at timestamptz default now()
);

-- ============================================================
-- Auto-update updated_at timestamps
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger shops_updated_at
  before update on public.shops
  for each row execute function public.handle_updated_at();

create trigger jobs_updated_at
  before update on public.jobs
  for each row execute function public.handle_updated_at();
