-- ─────────────────────────────────────────────
-- Seed orders
-- ─────────────────────────────────────────────
-- This seed creates a batch of random-ish orders for the two demo users:
--   Admin user: 11111111-1111-1111-1111-111111111111
--   Basic user: 22222222-2222-2222-2222-222222222222

with cfg as (
  -- total number of seed orders
  select 40 as n
),
series as (
  select generate_series(1, (select n from cfg)) as i
),
base_orders as (
  select
    i,

    -- randomly assign orders to admin vs basic user
    case when random() < 0.5
      then '11111111-1111-1111-1111-111111111111'::uuid
      else '22222222-2222-2222-2222-222222222222'::uuid
    end as user_id,

    -- random placed_at within the last ~45 days
    (
      now()
      - ((trunc(random() * 45))::int || ' days')::interval
      - ((trunc(random() * 24))::int || ' hours')::interval
    ) as placed_at_raw,

    -- pick a status with a decent distribution
    case
      when random() < 0.10 then 'processing'
      when random() < 0.20 then 'awaiting_shipment'
      when random() < 0.40 then 'packed'
      when random() < 0.65 then 'shipped'
      when random() < 0.85 then 'in_transit'
      when random() < 0.95 then 'delivered'
      when random() < 0.975 then 'cancelled'
      else 'refunded'
    end::public.order_status as status
  from series
),
orders_with_addresses as (
  select
    b.i,
    b.user_id,
    b.status,
    b.placed_at_raw as placed_at,
    b.placed_at_raw as updated_at,

    -- choose random shipping/billing addresses for that user
    case
      when b.user_id = '11111111-1111-1111-1111-111111111111'::uuid
      then (
        select id
        from public.addresses a
        where a.user_id = '11111111-1111-1111-1111-111111111111'::uuid
        order by random()
        limit 1
      )
      else (
        select id
        from public.addresses a
        where a.user_id = '22222222-2222-2222-2222-222222222222'::uuid
        order by random()
        limit 1
      )
    end as shipping_address_id,

    case
      when b.user_id = '11111111-1111-1111-1111-111111111111'::uuid
      then (
        select id
        from public.addresses a
        where a.user_id = '11111111-1111-1111-1111-111111111111'::uuid
        order by random()
        limit 1
      )
      else (
        select id
        from public.addresses a
        where a.user_id = '22222222-2222-2222-2222-222222222222'::uuid
        order by random()
        limit 1
      )
    end as billing_address_id
  from base_orders b
)
insert into public.orders (
  user_id,
  subtotal_cents,
  shipping_cents,
  tax_cents,
  total_cents,
  currency,
  status,
  placed_at,
  updated_at,
  carrier,
  tracking_code,
  shipping_eta,
  shipping_address_id,
  billing_address_id,
  notes
)
select
  o.user_id,
  0,                 -- will be recalculated after order_items are seeded
  0,
  0,
  0,
  'USD',
  o.status,
  o.placed_at,
  o.updated_at,

  -- basic fake carrier/tracking for shipped-ish orders
  case
    when o.status in ('shipped','in_transit','delivered') then 'UPS'
    else null
  end as carrier,
  case
    when o.status in ('shipped','in_transit','delivered')
    then '1Z' || lpad((100000 + (random() * 899999)::int)::text, 8, '0')
    else null
  end as tracking_code,

  case
    when o.status in ('shipped','in_transit')
    then o.placed_at + interval '5 days'
    when o.status = 'delivered'
    then o.placed_at + interval '3 days'
    else null
  end as shipping_eta,

  o.shipping_address_id,
  o.billing_address_id,

  'Seeded test order #' || o.i as notes
from orders_with_addresses o;
