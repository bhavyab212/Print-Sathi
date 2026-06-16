-- ============================================================
-- Create storage bucket for customer uploads
-- ============================================================

insert into storage.buckets (id, name, public)
values ('customer_uploads', 'customer_uploads', false)
on conflict (id) do nothing;

-- ============================================================
-- Storage RLS Policies
-- ============================================================

-- Customers can upload files (public insert)
create policy "Public Upload"
on storage.objects for insert
with check ( bucket_id = 'customer_uploads' );

-- Customers cannot select or delete.
-- Only the shopkeeper can select/download files
create policy "Shopkeeper Select"
on storage.objects for select
using ( bucket_id = 'customer_uploads' and auth.role() = 'authenticated' );

create policy "Shopkeeper Delete"
on storage.objects for delete
using ( bucket_id = 'customer_uploads' and auth.role() = 'authenticated' );
