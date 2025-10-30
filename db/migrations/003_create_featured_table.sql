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
