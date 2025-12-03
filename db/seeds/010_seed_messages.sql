-- Seed a couple of example messages between the system/admin and demo user.
-- Uses fixed UUIDs from auth seed so this is deterministic:
-- Admin user id: 11111111-1111-1111-1111-111111111111
-- Basic user id: 22222222-2222-2222-2222-222222222222

insert into public.messages (
  id, user_id, is_from_user, body, parent_id, is_read, created_at, updated_at
)
values
  (
    100,
    '22222222-2222-2222-2222-222222222222'::uuid,
    false, -- system→user message
    'Hello! Welcome to the demo store. If you have any questions, reply to this message and our team will get back to you.',
    null,
    false,
    TIMESTAMPTZ '2024-01-01 09:00:00+00',
    TIMESTAMPTZ '2024-01-01 09:00:00+00'
  ),
  (
    101,
    '22222222-2222-2222-2222-222222222222'::uuid,
    true, -- reply from user
    'Thanks! I have a question about shipping times. How long does delivery usually take?',
    100,
    false,
    TIMESTAMPTZ '2024-01-01 09:05:00+00',
    TIMESTAMPTZ '2024-01-01 09:05:00+00'
  ),
  (
    102,
    '22222222-2222-2222-2222-222222222222'::uuid,
    false,
    'Most orders ship within 1-2 business days. International orders may take longer depending on customs.',
    101,
    false,
    TIMESTAMPTZ '2024-01-01 09:10:00+00',
    TIMESTAMPTZ '2024-01-01 09:10:00+00'
  ),
  (
    103,
    '22222222-2222-2222-2222-222222222222'::uuid,
    true,
    'Great — thanks for the quick reply! Also, can I change my shipping address after placing an order?',
    null,
    false,
    TIMESTAMPTZ '2024-01-01 10:00:00+00',
    TIMESTAMPTZ '2024-01-01 10:00:00+00'
  ),
  (
    104,
    '22222222-2222-2222-2222-222222222222'::uuid,
    false,
    'We can update the shipping address within 2 hours of order placement. If it has already shipped we cannot change it.',
    103,
    false,
    TIMESTAMPTZ '2024-01-01 10:05:00+00',
    TIMESTAMPTZ '2024-01-01 10:05:00+00'
  ),
  (
    105,
    '22222222-2222-2222-2222-222222222222'::uuid,
    true,
    'Understood — thank you! One last question: do you offer expedited shipping?',
    null,
    false,
    TIMESTAMPTZ '2024-01-01 10:15:00+00',
    TIMESTAMPTZ '2024-01-01 10:15:00+00'
  )
on conflict (id) do nothing;
