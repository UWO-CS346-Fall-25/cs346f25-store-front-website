-- Reuse helper
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- A logical container for each featured list/carousel
create table if not exists public.feature_groups (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  key          citext not null unique,     -- e.g. 'homepage', 'holiday-2025'
  title        text not null,              -- display label
  description  text,
  is_active    boolean not null default true,
  start_at     timestamptz,                -- optional scheduling window
  end_at       timestamptz                 -- optional scheduling window
);

create trigger feature_groups_updated_at
before update on public.feature_groups
for each row execute function set_updated_at();

-- Items within a group with explicit ordering
create table if not exists public.featured_products (
  group_id     uuid not null references public.feature_groups(id) on delete cascade,
  product_id   uuid not null references public.products(id) on delete cascade,
  position     int not null default 1 check (position >= 1),
  spotlight    boolean not null default false,  -- optional flag for larger tiles (unused so far)
  created_at   timestamptz not null default now(),

  primary key (group_id, product_id)
);

-- One product per position within a group
create unique index if not exists featured_products_unique_pos
  on public.featured_products (group_id, position);

-- Helpful read ordering
create index if not exists featured_products_order_idx
  on public.featured_products (group_id, position asc, spotlight desc);






-- RLS --
alter table public.feature_groups enable row level security;
alter table public.featured_products enable row level security;

-- Public can read only active groups in window
create policy "Public read active groups in-window"
on public.feature_groups for select
to anon, authenticated
using (
  is_active = true
  and (start_at is null or now() >= start_at)
  and (end_at   is null or now() <  end_at)
);

-- Public can read featured items for active + in-window groups AND active products
create policy "Public read featured items for active groups & products"
on public.featured_products for select
to anon, authenticated
using (
  exists (
    select 1 from public.feature_groups g
    where g.id = group_id
      and g.is_active = true
      and (g.start_at is null or now() >= g.start_at)
      and (g.end_at   is null or now() <  g.end_at)
  )
  and exists (
    select 1 from public.products p
    where p.id = product_id
      and p.is_active = true
      and p.status = 'active'
  )
);

-- Admins can manage groups/items
create policy "Admins manage feature_groups"
on public.feature_groups for all
to authenticated
using (coalesce((auth.jwt() ->> 'role') = 'admin', false))
with check (coalesce((auth.jwt() ->> 'role') = 'admin', false));

create policy "Admins manage featured_products"
on public.featured_products for all
to authenticated
using (coalesce((auth.jwt() ->> 'role') = 'admin', false))
with check (coalesce((auth.jwt() ->> 'role') = 'admin', false));
