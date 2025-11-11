-- Enable pgcrypto for password hashing (usually already enabled on Supabase)
create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Seed auth.users
-- ─────────────────────────────────────────────────────────────

-- Fixed UUIDs so this migration is idempotent-ish and predictable
-- You can generate your own UUIDs if you prefer.
-- Admin user id:    11111111-1111-1111-1111-111111111111
-- Basic user id:    22222222-2222-2222-2222-222222222222

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  -- Admin user
  (
    '00000000-0000-0000-0000-000000000000'::uuid, -- instance_id (standard seed value)
    '11111111-1111-1111-1111-111111111111'::uuid, -- id
    'authenticated',                              -- aud
    'authenticated',                              -- role in Supabase sense, NOT your app role
    'admin@example.com',                         -- email
    crypt('123456', gen_salt('bf')),             -- password = 123456 (bcrypt)
    now(),                                       -- email_confirmed_at
    now(),                                       -- last_sign_in_at
    -- app metadata: includes provider + your app role
    jsonb_build_object(
      'provider', 'email',
      'providers', jsonb_build_array('email'),
      'role', 'admin'
    ),
    -- user metadata: any profile-ish stuff you want
    jsonb_build_object(
      'display_name', 'Dev Admin'
    ),
    false,                                       -- is_super_admin
    now(),                                       -- created_at
    now(),                                       -- updated_at
    null,                                        -- phone
    null,                                        -- phone_confirmed_at
    '', '', '', ''                               -- tokens (unused here)
  ),

  -- Basic user
  (
    '00000000-0000-0000-0000-000000000000'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'authenticated',
    'authenticated',
    'user@example.com',
    crypt('123456', gen_salt('bf')),             -- password = 123456
    now(),
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', jsonb_build_array('email'),
      'role', 'user'
    ),
    jsonb_build_object(
      'display_name', 'Dev User'
    ),
    false,
    now(),
    now(),
    null,
    null,
    '', '', '', ''
  )
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────
-- Seed auth.identities (so email login actually works)
-- ─────────────────────────────────────────────────────


insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  -- Admin identity
  (
    '11111111-1111-1111-1111-111111111111',      -- id (can match user id)
    '11111111-1111-1111-1111-111111111111'::uuid,
    jsonb_build_object(
      'sub',   '11111111-1111-1111-1111-111111111111',
      'email', 'admin@example.com'
    ),
    'email',                                     -- provider
    'admin@example.com',                         -- provider_id (NOT NULL)
    now(),
    now(),
    now()
  ),
  -- Basic user identity
  (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222'::uuid,
    jsonb_build_object(
      'sub',   '22222222-2222-2222-2222-222222222222',
      'email', 'user@example.com'
    ),
    'email',
    'user@example.com',
    now(),
    now(),
    now()
  )
-- use id here; it's the PK on most Supabase projects
on conflict (id) do nothing;
