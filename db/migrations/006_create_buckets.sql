insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update
set
  name   = excluded.name,
  public = excluded.public;


-- Allow public and authenticated users to read images for this bucket
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
create policy "Public read product images"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'product-images'
);


-- Allow admins (JWT role = 'admin') to create/update/delete images
DROP POLICY IF EXISTS "Admins manage product images" ON storage.objects;
create policy "Admins manage product images"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'product-images'
  and (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false))
)
with check (
  bucket_id = 'product-images'
  and coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
);
