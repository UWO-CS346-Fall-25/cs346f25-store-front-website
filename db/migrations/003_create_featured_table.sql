-- One global featured list with explicit ordering
create table if not exists public.featured_products (
  product_id   uuid not null references public.products(id) on delete cascade,
  position     int  not null check (position >= 1),
  spotlight    boolean not null default false,  -- optional flag for big tile, etc.
  created_at   timestamptz not null default now(),

  primary key (product_id)
);

-- No two items share the same slot
create unique index if not exists featured_unique_position
  on public.featured_products (position);

-- Helpful read order
create index if not exists featured_order_idx
  on public.featured_products (position asc, spotlight desc);



-- RLS

alter table public.featured_products enable row level security;

-- Public can read featured products only if the product is active
create policy "Public read featured (active products only)"
on public.featured_products for select
to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and p.is_active = true
      and p.status = 'active'
  )
);

-- Admins manage featured list
create policy "Admins manage featured"
on public.featured_products for all
to authenticated
using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false))
with check (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false));


-- Helper View

create or replace view public.v_featured_products as
select
  fp.position,
  fp.spotlight,
  p.id                as product_id,
  p.name,
  p.slug,
  p.description,
  p.price_cents,
  p.currency,
  p.sku,
  pi.path             as image_path,
  pi.external_url     as image_external_url,
  pi.alt              as image_alt
from public.featured_products fp
join public.products p
  on p.id = fp.product_id
left join lateral (
  select path, external_url, alt
  from public.product_images i
  where i.product_id = p.id
  order by i.is_primary desc, i.position asc
  limit 1
) pi on true
where p.is_active = true and p.status = 'active'
order by fp.position asc, fp.spotlight desc;
