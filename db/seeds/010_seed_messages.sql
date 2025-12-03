-- 010_seed_messages.sql

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
    now(),
    now()
  ),
  (
    101,
    '22222222-2222-2222-2222-222222222222'::uuid,
    true, -- reply from user
    'Thanks! I have a question about shipping times. How long does delivery usually take?',
    100,
    false,
    now(),
    now()
  )
  ,
  (
    102,
    '22222222-2222-2222-2222-222222222222'::uuid,
    false,
    'Most orders ship within 1-2 business days. International orders may take longer depending on customs.',
    101,
    false,
    now(),
    now()
  ),
  (
    103,
    '22222222-2222-2222-2222-222222222222'::uuid,
    true,
    'Great — thanks for the quick reply! Also, can I change my shipping address after placing an order?',
    null,
    false,
    now(),
    now()
  ),
  (
    104,
    '22222222-2222-2222-2222-222222222222'::uuid,
    false,
    'We can update the shipping address within 2 hours of order placement. If it has already shipped we cannot change it.',
    103,
    false,
    now(),
    now()
  ),
  (
    105,
    '22222222-2222-2222-2222-222222222222'::uuid,
    true,
    'Understood — thank you! One last question: do you offer expedited shipping?',
    null,
    false,
    now(),
    now()
  )
on conflict (id) do nothing;
