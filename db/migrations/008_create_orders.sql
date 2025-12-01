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



-- ─────────────────────────────────────────────────────────────────────────────
-- Orders (references normalized addresses)
-- ─────────────────────────────────────────────────────────────────────────────
create sequence if not exists public.order_number_seq;

create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null,
  number             text not null unique default lpad(nextval('public.order_number_seq')::text, 8, '0'),

  subtotal_cents     integer not null default 0 check (subtotal_cents >= 0),
  shipping_cents     integer not null default 0 check (shipping_cents >= 0),
  tax_cents          integer not null default 0 check (tax_cents >= 0),
  total_cents        integer not null default 0 check (total_cents >= 0),
  currency           text not null default 'USD',

  status             public.order_status not null default 'processing',

  placed_at          timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- shipping/tracking
  carrier            text,
  tracking_code      text,
  shipping_eta       timestamptz,

  -- normalized addresses (snapshot by reference)
  shipping_address_id uuid not null references public.addresses(id) on delete restrict,
  billing_address_id  uuid not null references public.addresses(id) on delete restrict,

  notes              text
);

create index if not exists orders_user_id_placed_idx on public.orders (user_id, placed_at desc);
create index if not exists orders_status_idx        on public.orders (status);
create index if not exists orders_shipping_addr_idx on public.orders (shipping_address_id);
create index if not exists orders_billing_addr_idx  on public.orders (billing_address_id);

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute procedure public.tg_set_updated_at();

-- RLS for orders
alter table public.orders enable row level security;

drop policy if exists "Users read own orders" on public.orders;
create policy "Users read own orders"
on public.orders for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can update own orders while processing" on public.orders;
create policy "Users can update own orders while processing"
on public.orders for update
to authenticated
using (user_id = auth.uid() and status in ('processing','awaiting_shipment'))
with check (user_id = auth.uid());

drop policy if exists "Admins manage all orders" on public.orders;
create policy "Admins manage all orders"
on public.orders for all
to authenticated
using (coalesce((auth.jwt() ->> 'role') in ('admin','staff'), false))
with check (coalesce((auth.jwt() ->> 'role') in ('admin','staff'), false));
