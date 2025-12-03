-- 011_drop_messages_subject.sql

BEGIN;

ALTER TABLE public.messages DROP COLUMN IF EXISTS subject;

COMMIT;
