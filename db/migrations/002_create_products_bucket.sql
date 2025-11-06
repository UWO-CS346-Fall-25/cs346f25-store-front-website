create table if not exists public.product_images (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  product_id       uuid not null references public.products(id) on delete cascade,
  path             text,                 -- storage path (e.g., 'test_items/2.png')
  external_url     text,                 -- full URL path (e.g., 'https://xyz.supabase.co/storage/v1/object/public/test_items/2.png')
  alt              text,
  position         int not null default 1,
  is_primary       boolean not null default false
);

create index if not exists product_images_product_id_idx on public.product_images(product_id, position);

alter table public.product_images enable row level security;

create policy "Public can read images of active products"
on public.product_images for select
to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_id and p.is_active = true and p.status='active'
  )
);

create policy "Admins can write product images"
on public.product_images for all
to authenticated
using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false))
with check (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false));
