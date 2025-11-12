-- ─────────────────────────────────────────────────────────────────────────────
-- Order status enum
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum (
      'processing',
      'packed',
      'awaiting_shipment',
      'shipped',
      'in_transit',
      'delivered',
      'cancelled',
      'refunded'
    );
  end if;
end$$;

-- human-friendly order numbers
create sequence if not exists public.order_number_seq;

-- orders table
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null,
  number           text not null unique default lpad(nextval('public.order_number_seq')::text, 8, '0'),

  -- money (in cents)
  subtotal_cents   integer not null default 0 check (subtotal_cents >= 0),
  shipping_cents   integer not null default 0 check (shipping_cents >= 0),
  tax_cents        integer not null default 0 check (tax_cents >= 0),
  total_cents      integer not null default 0 check (total_cents >= 0),
  currency         text not null default 'USD',

  status           public.order_status not null default 'processing',

  placed_at        timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- shipping/tracking
  carrier          text,
  tracking_code    text,
  shipping_eta     timestamptz,

  -- addresses
  shipping_address jsonb,
  billing_address  jsonb,

  -- misc
  notes            text
);

-- helpful indexes
create index if not exists orders_user_id_placed_idx on public.orders (user_id, placed_at desc);
create index if not exists orders_status_idx        on public.orders (status);
create index if not exists orders_tracking_idx      on public.orders (tracking_code);


-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at trigger
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute procedure public.tg_set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- Users can only see their own orders.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.orders enable row level security;

-- Read own orders
drop policy if exists "Users can read their orders" on public.orders;
create policy "Users can read their orders"
on public.orders
for select
to authenticated
using (user_id = auth.uid());

-- Allow limited user updates while still processing (e.g., cancel or add note)
-- Adjust fields via a view or with column privileges if you want stricter control.
drop policy if exists "Users can update their orders while processing" on public.orders;
create policy "Users can update their orders while processing"
on public.orders
for update
to authenticated
using (
  user_id = auth.uid()
  and status in ('processing','awaiting_shipment')
)
with check (
  user_id = auth.uid()
);

-- Admins manage all orders 
drop policy if exists "Admins manage all orders" on public.orders;
create policy "Admins manage all orders"
on public.orders
for all
to authenticated
using (coalesce((auth.jwt() ->> 'role') = 'admin', false))
with check (coalesce((auth.jwt() ->> 'role') = 'admin', false));

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: order_summary_counts(user_id) → open/shipped/delivered counts
-- Open = processing/packed/awaiting_shipment
-- Shipped = shipped/in_transit
-- Delivered = delivered
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.order_summary_counts(p_user_id uuid)
returns table(
  open int,
  shipped int,
  delivered int
)
language sql
security definer
set search_path = public
as $$
  select
    (select count(*) from public.orders
      where user_id = p_user_id
        and status in ('processing','packed','awaiting_shipment')) as open,
    (select count(*) from public.orders
      where user_id = p_user_id
        and status in ('shipped','in_transit')) as shipped,
    (select count(*) from public.orders
      where user_id = p_user_id
        and status in ('delivered')) as delivered
$$;

-- Allow authenticated users to execute the function
revoke all on function public.order_summary_counts(uuid) from public;
grant execute on function public.order_summary_counts(uuid) to authenticated;
