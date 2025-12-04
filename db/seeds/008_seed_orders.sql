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

    -- generate new UUIDs for shipping/billing address references (addresses table may not exist in some setups)
    gen_random_uuid() as shipping_address_id,
    gen_random_uuid() as billing_address_id,

    -- generate fake address snapshot fields
    (case when b.user_id = '11111111-1111-1111-1111-111111111111'::uuid then ('Admin User '||b.i) else ('Customer '||b.i) end) as address_full_name,
    ( (trunc(random()*999)::int + 1)::text || ' ' || (array['Maple St','Oak Ave','Main St','Market St','Broadway'])[(trunc(random()*5)::int + 1)] ) as address_line1,
    null as address_line2,
    (array['Springfield','Ravenwood','Lakeside','Brookfield','Fairview'])[(trunc(random()*5)::int + 1)] as address_city,
    (array['CA','NY','WA','OR','TX'])[(trunc(random()*5)::int + 1)] as address_region,
    lpad((10000 + (random() * 89999)::int)::text,5,'0') as address_postal_code,
    'US' as address_country_code,
    ('+1' || lpad((1000000000 + (random() * 899999999)::int)::text,10,'0')) as address_phone
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
  address_full_name,
  address_line1,
  address_line2,
  address_city,
  address_region,
  address_postal_code,
  address_country_code,
  address_phone,
  placed_at,
  updated_at,
  carrier,
  tracking_code,
  shipping_eta,
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
  -- use generated snapshot address fields
  o.address_full_name,
  o.address_line1,
  o.address_line2,
  o.address_city,
  o.address_region,
  o.address_postal_code,
  o.address_country_code,
  o.address_phone,
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
  'Seeded test order #' || o.i as notes
from orders_with_addresses o;
