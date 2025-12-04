-- 010_create_messages_table.sql

BEGIN;

-- Messages table for user→server messaging. Messages are always addressed to the server.
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- the user this message is about / belongs to (who sent it if from user)
  user_id UUID NOT NULL,
  -- true if message originated from the user; false if message originated from the server/admin
  is_from_user BOOLEAN DEFAULT TRUE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_user ON public.messages(user_id);


-- Table to track which users have unread messages
CREATE TABLE IF NOT EXISTS public.unread_messages (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Unknown User',
  body TEXT NOT NULL DEFAULT '...',
  created_at TIMESTAMPTZ DEFAULT now()
);



COMMIT;

-- Enable Row Level Security and add policies so users can only access their own messages
BEGIN;

-- helper "am I admin?" predicate
DROP FUNCTION IF EXISTS public.is_admin();
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'staff');
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




COMMIT;
