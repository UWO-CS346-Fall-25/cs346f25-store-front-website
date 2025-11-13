-- ─────────────────────────────────────────────
-- Seed order_items for existing orders
-- ─────────────────────────────────────────────
-- This:
--   - Picks random active products
--   - Creates 2 line items per order
--   - Uses a random quantity (1–3)
--   - Then recalculates order totals based on order_items

-- Make a pool of active products to choose from
with product_pool as (
  select
    id,
    sku,
    name,
    price_cents
  from public.products
  where status = 'active'
),

order_pool as (
  select id
  from public.orders
),

-- Insert order items: 2 random products per order
inserted_items as (
  insert into public.order_items (
    order_id,
    product_id,
    sku,
    name,
    quantity,
    unit_price_cents
  )
  select
    o.id as order_id,
    p.id as product_id,
    coalesce(p.sku, 'SKU-' || left(p.id::text, 8)) as sku,
    p.name,
    (1 + floor(random() * 3))::int as quantity,  -- 1–3 of each product
    p.price_cents as unit_price_cents
  from order_pool o
  cross join lateral (
    select *
    from product_pool
    order by random()
    limit 2                      -- 2 distinct products per order
  ) p
  returning order_id
),

-- Compute subtotal from inserted items
subtotals as (
  select
    oi.order_id,
    sum(oi.total_cents) as subtotal
  from public.order_items oi
  group by oi.order_id
)

-- Update orders to reflect the seeded order_items
update public.orders o
set
  subtotal_cents = s.subtotal,
  shipping_cents = case
                     when s.subtotal = 0 then 0
                     else 799            -- flat $7.99 shipping when there is something to ship
                   end,
  tax_cents = round(s.subtotal * 0.055)::int,  -- ~5.5% tax
  total_cents = s.subtotal
                + case
                    when s.subtotal = 0 then 0
                    else 799
                  end
                + round(s.subtotal * 0.055)::int
from subtotals s
where o.id = s.order_id;
