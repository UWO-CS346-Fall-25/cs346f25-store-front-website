-- Seed a couple of example messages between the system/admin and demo user.
-- Uses fixed UUIDs from auth seed so this is deterministic:
-- Admin user id: 11111111-1111-1111-1111-111111111111
-- Basic user id: 22222222-2222-2222-2222-222222222222



insert into public.messages (
  user_id, is_from_user, body, created_at
)
values
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    false, -- system→user message
    'Hello! Welcome to the demo store. If you have any questions, reply to this message and our team will get back to you.',
    TIMESTAMPTZ '2024-01-01 09:00:00+00'
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    true, -- reply from user
    'Thanks! I have a question about shipping times. How long does delivery usually take?',
    TIMESTAMPTZ '2024-01-01 09:05:00+00'
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    false,
    'Most orders ship within 1-2 business days. International orders may take longer depending on customs.',
    TIMESTAMPTZ '2024-01-01 09:10:00+00'
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    true,
    'Great — thanks for the quick reply! Also, can I change my shipping address after placing an order?',
    TIMESTAMPTZ '2024-01-01 10:00:00+00'
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    false,
    'We can update the shipping address within 2 hours of order placement. If it has already shipped we cannot change it.',
    TIMESTAMPTZ '2024-01-01 10:05:00+00'
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    true,
    'Understood — thank you! One last question: do you offer expedited shipping?',
    TIMESTAMPTZ '2024-01-01 10:15:00+00'
  )
on conflict (id) do nothing;



insert into public.unread_messages (user_id, body, name, created_at)
values
  ('22222222-2222-2222-2222-222222222222'::uuid,
  'Understood — thank you! One last question: do you offer expedited shipping?', 
  'Dev User',
  now())
on conflict (user_id) do nothing;


