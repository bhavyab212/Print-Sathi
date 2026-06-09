-- Enable Realtime replica identity for live queue updates
alter table public.jobs replica identity full;

-- Ensure is_urgent index exists for queue sorting
create index if not exists jobs_urgent_idx on public.jobs (shop_id, is_urgent, created_at);
