-- 010_create_messages_table.sql

BEGIN;

-- Messages table for user→server messaging. Messages are always addressed to the server.
CREATE TABLE IF NOT EXISTS public.messages (
  id BIGSERIAL PRIMARY KEY,
  -- the user this message is about / belongs to (who sent it if from user)
  user_id UUID NOT NULL,
  -- true if message originated from the user; false if message originated from the server/admin
  is_from_user BOOLEAN DEFAULT TRUE,
  -- message subject removed: plain messages only
  -- subject TEXT NULL,
  body TEXT NOT NULL,
  parent_id BIGINT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_messages_user ON public.messages(user_id);

COMMIT;

-- Enable Row Level Security and add policies so users can only access their own messages
BEGIN;

-- helper "am I admin?" predicate
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT auth.jwt()->>'role' = 'admin';
$$;


ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY messages_select_policy ON public.messages
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_admin()
);

-- INSERT
CREATE POLICY messages_insert_policy ON public.messages
FOR INSERT
WITH CHECK (
  (user_id = auth.uid() AND is_from_user = TRUE)
  OR public.is_admin()
);

-- UPDATE
CREATE POLICY messages_update_policy ON public.messages
FOR UPDATE
USING (
  user_id = auth.uid()
  OR public.is_admin()
)
WITH CHECK (
  user_id = auth.uid()
  OR public.is_admin()
);

-- DELETE
CREATE POLICY messages_delete_policy ON public.messages
FOR DELETE
USING (
  user_id = auth.uid()
  OR public.is_admin()
);



-- Get latest message per user (where user has sent at least one message),
-- along with their display name and timestamp of last message.
DROP FUNCTION IF EXISTS public.get_message_threads();
create or replace function public.get_message_threads()
returns table (
  user_id uuid,
  display_name text,
  last_body text,
  last_is_read boolean,
  last_at timestamptz
)
language sql
security definer
set search_path = public, auth
as $$
  select
    s.user_id,
    coalesce(u.raw_user_meta_data->>'display_name', u.email) as display_name,
    lm.body as last_body,
    lm.is_read as last_is_read,
    lm.created_at as last_at
  from (
    select distinct user_id
    from public.messages
    where is_from_user = true
  ) s
  join lateral (
    select body, created_at, is_read
    from public.messages m2
    where m2.user_id = s.user_id
    order by created_at desc
    limit 1
  ) lm on true
  left join auth.users u on u.id = s.user_id
  order by lm.created_at desc;
$$;



COMMIT;
