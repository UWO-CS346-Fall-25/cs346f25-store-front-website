
-- ─────────────────────────────────────────────────────────────────────────────
-- Order Items (captured price/sku at purchase time)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.order_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders(id) on delete cascade,
  product_id         uuid,                      -- optional FK to products(id) if UUID
  sku                text,
  name               text not null,             -- snapshot name
  quantity           integer not null check (quantity > 0),
  unit_price_cents   integer not null check (unit_price_cents >= 0),
  total_cents        integer not null generated always as (quantity * unit_price_cents) stored
);

create index if not exists order_items_order_idx on public.order_items(order_id);

-- RLS for order_items (inherit ownership from orders)
alter table public.order_items enable row level security;

drop policy if exists "Users read own order_items" on public.order_items;
create policy "Users read own order_items"
on public.order_items for select
to authenticated
using (exists (
  select 1 from public.orders o
  where o.id = order_items.order_id
    and o.user_id = auth.uid()
));

drop policy if exists "Users write own order_items while processing" on public.order_items;
create policy "Users write own order_items while processing"
on public.order_items for all
to authenticated
using (exists (
  select 1 from public.orders o
  where o.id = order_items.order_id
    and o.user_id = auth.uid()
    and o.status in ('processing','awaiting_shipment')
))
with check (exists (
  select 1 from public.orders o
  where o.id = order_items.order_id
    and o.user_id = auth.uid()
    and o.status in ('processing','awaiting_shipment')
));

drop policy if exists "Admins manage all order_items" on public.order_items;
create policy "Admins manage all order_items"
on public.order_items for all
to authenticated
using (coalesce((auth.jwt() ->> 'role') = 'admin', false))
with check (coalesce((auth.jwt() ->> 'role') = 'admin', false));

-- ─────────────────────────────────────────────────────────────────────────────
-- Keep orders.subtotal_cents and total_cents in sync with order_items
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.recalc_order_totals(p_order_id uuid)
returns void
language sql
as $$
  update public.orders o
  set subtotal_cents = coalesce((
        select sum(oi.total_cents)::int
        from public.order_items oi
        where oi.order_id = o.id
      ), 0),
      total_cents = coalesce((
        select sum(oi.total_cents)::int
        from public.order_items oi
        where oi.order_id = o.id
      ), 0) + o.shipping_cents + o.tax_cents
  where o.id = p_order_id;
$$;

create or replace function public.tg_recalc_order_totals()
returns trigger
language plpgsql
as $$
begin
  perform public.recalc_order_totals(coalesce(new.order_id, old.order_id));
  return null;
end$$;

drop trigger if exists order_items_after_change on public.order_items;
create trigger order_items_after_change
after insert or update or delete on public.order_items
for each row execute procedure public.tg_recalc_order_totals();

-- Also recalc when shipping/tax change on the order itself
create or replace function public.tg_recalc_order_totals_on_order()
returns trigger
language plpgsql
as $$
begin
  if (new.shipping_cents is distinct from old.shipping_cents)
     or (new.tax_cents is distinct from old.tax_cents) then
    perform public.recalc_order_totals(new.id);
  end if;
  return new;
end$$;

drop trigger if exists orders_after_update_recalc on public.orders;
create trigger orders_after_update_recalc
after update on public.orders
for each row execute procedure public.tg_recalc_order_totals_on_order();

-- ─────────────────────────────────────────────────────────────────────────────
-- Convenience View: orders + addresses + aggregated items
-- ─────────────────────────────────────────────────────────────────────────────
create or replace view public.orders_view as
select
  o.*,
  to_jsonb(sa) - 'user_id' - 'created_at' - 'updated_at' as shipping_address,
  to_jsonb(ba) - 'user_id' - 'created_at' - 'updated_at' as billing_address,
  coalesce((
    select jsonb_agg(to_jsonb(oi) - 'order_id')
    from public.order_items oi
    where oi.order_id = o.id
  ), '[]'::jsonb) as items
from public.orders o
join public.addresses sa on sa.id = o.shipping_address_id
join public.addresses ba on ba.id = o.billing_address_id;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: order_summary_counts(user_id) → {open, shipped, delivered}
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

revoke all on function public.order_summary_counts(uuid) from public;
grant execute on function public.order_summary_counts(uuid) to authenticated;
