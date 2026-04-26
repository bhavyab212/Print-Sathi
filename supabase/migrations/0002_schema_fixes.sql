-- ============================================================
-- Print Sathi — Schema Fixes (Gap Audit)
-- Run AFTER 0001_rls_policies.sql
-- ============================================================

-- #10: Add workflow_type to jobs
alter table public.jobs
  add column if not exists workflow_type text not null default 'direct_print';
-- Values: 'passport_photo' | 'document' | 'scan' | 'direct_print'

-- #11: Add calculated_bill for bill calculator integration
alter table public.jobs
  add column if not exists calculated_bill numeric(10,2);

-- #15: Add is_demo flag to shops
alter table public.shops
  add column if not exists is_demo boolean default false;

-- #9: Add file_hash to job_items for duplicate detection
alter table public.job_items
  add column if not exists file_hash text;

-- #7: Add archived_at to jobs for 7-day auto-archive
alter table public.jobs
  add column if not exists archived_at timestamptz;

-- #10: Add timestamps for status tracking on jobs
alter table public.jobs
  add column if not exists approved_at timestamptz,
  add column if not exists completed_at timestamptz;

-- #10: Add shopkeeper_note to jobs
alter table public.jobs
  add column if not exists shopkeeper_note text;

-- #10: Add preview_url to jobs
alter table public.jobs
  add column if not exists preview_url text;

-- #9: Duplicate prevention index — same phone + file hash within a shop
create index if not exists job_items_file_hash_idx
  on public.job_items (file_hash)
  where file_hash is not null;

-- #6: Document the rate card deviation
-- Architecture specified fixed columns (bw_per_page, color_per_page, etc.)
-- We use flexible rows (item_type, label, price) which is MORE extensible.
-- This is a DELIBERATE improvement, not a bug.
-- Default rate card items to seed for onboarding:
comment on table public.rate_cards is
  'Flexible row-based rate card. Each row = one billable item type.
   Deviation from architecture (which had fixed columns) — this is intentional
   for extensibility. Shopkeepers can add custom item types.';
