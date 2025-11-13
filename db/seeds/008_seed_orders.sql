-- ─────────────────────────────────────────────
-- Seed orders
-- ─────────────────────────────────────────────
-- Note: we let `number` and `status` use their defaults.
--       `number` will come from public.order_number_seq.

insert into public.orders (
  id,
  user_id,
  subtotal_cents,
  shipping_cents,
  tax_cents,
  total_cents,
  currency,
  placed_at,
  updated_at,
  carrier,
  tracking_code,
  shipping_eta,
  shipping_address_id,
  billing_address_id,
  notes
)
values
  -- Admin order #1
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc1'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    5000,                           -- subtotal
    500,                            -- shipping
    450,                            -- tax
    5950,                           -- total
    'USD',
    now() - interval '7 days',      -- placed a week ago
    now() - interval '6 days',
    'UPS',
    '1ZADMIN0000001',
    now() - interval '3 days',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid, -- admin home
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid,
    'First dev admin order'
  ),

  -- Admin order #2
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc2'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    4500,
    0,
    315,
    4815,
    'USD',
    now() - interval '3 days',
    now() - interval '2 days',
    'FedEx',
    'FEDEXADMIN0002',
    now() + interval '1 days',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid, -- ship to home
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid, -- bill to work
    'Second admin order, free shipping promo'
  ),

  -- Basic user order #1
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc3'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    2500,
    700,
    192,
    3392,
    'USD',
    now() - interval '1 days',
    now(),
    'USPS',
    'USPSUSER0003',
    now() + interval '2 days',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'::uuid, -- user home
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'::uuid,
    'User order with standard shipping'
  ),

  -- Basic user order #2
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc4'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    4000,
    500,
    296,
    4796,
    'USD',
    now() - interval '10 days',
    now() - interval '9 days',
    'UPS',
    '1ZUSER0004',
    now() - interval '5 days',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2'::uuid, -- shipped to parents
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'::uuid, -- billed to home
    'Gift order shipped to parents'
  )
on conflict (id) do nothing;
