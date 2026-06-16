-- ============================================================
-- Fix Storage Bucket RLS Policies for Customer Uploads
-- ============================================================

-- Ensure the bucket exists
insert into storage.buckets (id, name, public)
values ('customer_uploads', 'customer_uploads', false)
on conflict (id) do nothing;

DO $$ 
DECLARE
  pol record;
BEGIN
  -- Drop all existing policies on storage.objects for customer_uploads
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- 1. Customers (public/anon) can upload files
create policy "Public Upload"
on storage.objects for insert
with check ( bucket_id = 'customer_uploads' );

-- 2. Allow customers (and anyone) to read the files (required for some storage operations)
-- Since file paths are random (UUIDs/timestamps), it's safe.
create policy "Public Select"
on storage.objects for select
using ( bucket_id = 'customer_uploads' );

-- 3. Only authenticated users (shopkeepers) can delete files
create policy "Shopkeeper Delete"
on storage.objects for delete
using ( bucket_id = 'customer_uploads' and auth.role() = 'authenticated' );

-- 4. Only authenticated users (shopkeepers) can update files
create policy "Shopkeeper Update"
on storage.objects for update
using ( bucket_id = 'customer_uploads' and auth.role() = 'authenticated' );
