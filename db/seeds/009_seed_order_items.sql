
-- ─────────────────────────────────────────────
-- Seed order_items
-- ─────────────────────────────────────────────

insert into public.order_items (
  id,
  order_id,
  product_id,
  sku,
  name,
  quantity,
  unit_price_cents
  -- total_cents is generated
)
values
  -- Admin order #1 items (subtotal 5000)
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd1'::uuid,
    'cccccccc-cccc-cccc-cccc-ccccccccccc1'::uuid,
    null,
    'TSHIRT-BLK-M',
    'T-Shirt - Black / M',
    2,
    1500
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd2'::uuid,
    'cccccccc-cccc-cccc-cccc-ccccccccccc1'::uuid,
    null,
    'MUG-WHT-12OZ',
    'Coffee Mug 12oz - White',
    1,
    2000
  ),

  -- Admin order #2 items (subtotal 4500)
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd3'::uuid,
    'cccccccc-cccc-cccc-cccc-ccccccccccc2'::uuid,
    null,
    'HOODIE-GRY-L',
    'Hoodie - Gray / L',
    1,
    3000
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd4'::uuid,
    'cccccccc-cccc-cccc-cccc-ccccccccccc2'::uuid,
    null,
    'STICKER-PACK',
    'Sticker Pack',
    3,
    500
  ),

  -- User order #1 items (subtotal 2500)
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd5'::uuid,
    'cccccccc-cccc-cccc-cccc-ccccccccccc3'::uuid,
    null,
    'TSHIRT-WHT-S',
    'T-Shirt - White / S',
    1,
    2500
  ),

  -- User order #2 items (subtotal 4000)
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd6'::uuid,
    'cccccccc-cccc-cccc-cccc-ccccccccccc4'::uuid,
    null,
    'CAP-BLK-ONE',
    'Cap - Black / One Size',
    2,
    1200
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd7'::uuid,
    'cccccccc-cccc-cccc-cccc-ccccccccccc4'::uuid,
    null,
    'POSTER-A3',
    'Poster A3 - Limited Edition',
    2,
    800
  )
on conflict (id) do nothing;