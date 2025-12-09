-- Helpful extensions (Supabase lets you enable these in SQL)
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists citext;     -- case-insensitive text

-- Slugify helper (simple: letters/numbers -> hyphens; trims doubles)
create or replace function util_slugify(input text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(input), '[^a-z0-9]+', '-', 'g'))
$$;

-- Updated-at trigger
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  name             text not null,
  slug             citext not null unique, -- case-insensitive unique
  description      text,
  big_description  text,

  -- Price
  price_cents      integer not null check (price_cents >= 0),
  currency         char(3) not null default 'USD', -- ISO 4217

  -- Product state
  status           text not null default 'draft' check (status in ('draft','active','archived')),
  stripe_price_id  text unique,

  -- SEO niceties (optional, but handy)
  seo_title        text,
  seo_description  text,

  -- SKU or other unique product code
  sku              text unique,

  -- Inventory tracking
  stock_quantity   integer not null default 0 check (stock_quantity >= 0),
  track_inventory  boolean not null default true,
  low_stock_threshold integer default 5 check (low_stock_threshold >= 0),

  -- Quick search (generated tsvector)
  search           tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(name,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description,'')), 'B')
  ) stored
);



-- Keep updated_at fresh
create trigger products_set_updated_at
before update on public.products
for each row execute function set_updated_at();



-- Auto-generate slug if omitted
create or replace function products_default_slug()
returns trigger language plpgsql as $$
begin
  if new.slug is null or length(new.slug)=0 then
    new.slug := util_slugify(new.name);
  end if;
  return new;
end $$;

create trigger products_default_slug_tg
before insert on public.products
for each row execute function products_default_slug();

-- Index for search
create index if not exists products_search_idx on public.products using gin (search);

-- Public read of only active products; authenticated can manage (adjust to your needs)
alter table public.products enable row level security;

create policy "Public can read active products"
on public.products for select
to anon, authenticated
using (status = 'active');

-- only users with an 'admin' role claim may write
create policy "Admins can write products"
on public.products for all
to authenticated
using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin','staff'), false))
with check (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin','staff'), false));



