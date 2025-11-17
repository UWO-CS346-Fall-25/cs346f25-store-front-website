-- ─────────────────────────────────────────────
-- Seed addresses
-- ─────────────────────────────────────────────

insert into public.addresses (
  id,
  user_id,
  label,
  full_name,
  line1,
  line2,
  city,
  region,
  postal_code,
  country_code,
  phone,
  is_default_shipping,
  is_default_billing,
  created_at,
  updated_at
)
values
  -- Admin: Home
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Home',
    'Dev Admin',
    '123 Admin St',
    'Apt 1',
    'Adminville',
    'CA',
    '90001',
    'US',
    '+1 555-000-0001',
    true,
    true,
    now(),
    now()
  ),

  -- Admin: Work
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Work',
    'Dev Admin',
    '456 Office Blvd',
    'Suite 500',
    'Admin City',
    'CA',
    '90002',
    'US',
    '+1 555-000-0002',
    false,
    false,
    now(),
    now()
  ),

  -- Basic user: Home
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Home',
    'Dev User',
    '789 User Rd',
    null,
    'Usertown',
    'TX',
    '73301',
    'US',
    '+1 555-000-0003',
    true,
    true,
    now(),
    now()
  ),

  -- Basic user: Other
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Parents',
    'Dev User',
    '101 Family Ln',
    null,
    'Hometown',
    'TX',
    '75001',
    'US',
    '+1 555-000-0004',
    false,
    false,
    now(),
    now()
  )
on conflict (id) do nothing;
