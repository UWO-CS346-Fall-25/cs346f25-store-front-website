-- ─────────────────────────────────────────────────────────────────────────────
-- Helpers (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;
create extension if not exists citext;

-- validate '#RRGGBB'
create or replace function util_is_hex_color(v text)
returns boolean
language sql immutable as $$
  select v ~* '^#([0-9A-F]{6})$'
$$;

-- updated_at trigger
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: site_themes
--   - light/dark tokens
--   - one-off scheduling (start_at/end_at)
--   - yearly recurrence via month-day anchors + timezone
--   - exactly one default allowed
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.site_themes (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  key                citext not null unique,         -- e.g., 'default', 'halloween'
  name               text   not null,
  description        text,

  -- Activation & scheduling
  is_active          boolean not null default true,
  is_default         boolean not null default false,
  start_at           timestamptz,                    -- optional one-off window
  end_at             timestamptz,

  -- Recurrence
  recurrence         text not null default 'none'     -- 'none' | 'yearly'
    check (recurrence in ('none','yearly')),
  yearly_start_md    char(5)                          -- 'MM-DD' e.g. '10-01'
    check (yearly_start_md is null or yearly_start_md ~ '^\d{2}-\d{2}$'),
  yearly_end_md      char(5)                          -- 'MM-DD' e.g. '11-02'
    check (yearly_end_md is null or yearly_end_md   ~ '^\d{2}-\d{2}$'),
  timezone           text not null default 'UTC',

  -- LIGHT tokens
  light_primary_1    text not null,
  light_primary_2    text not null,
  light_primary_3    text not null,
  light_tint_1       text not null,
  light_tint_2       text not null,
  light_tint_3       text not null,

  -- DARK tokens
  dark_primary_1     text not null,
  dark_primary_2     text not null,
  dark_primary_3     text not null,
  dark_tint_1        text not null,
  dark_tint_2        text not null,
  dark_tint_3        text not null,

  -- Hex color format enforcement
  constraint site_themes_hex_ck check (
    util_is_hex_color(light_primary_1) and util_is_hex_color(light_primary_2) and util_is_hex_color(light_primary_3) and
    util_is_hex_color(light_tint_1)    and util_is_hex_color(light_tint_2)    and util_is_hex_color(light_tint_3)    and
    util_is_hex_color(dark_primary_1)  and util_is_hex_color(dark_primary_2)  and util_is_hex_color(dark_primary_3)  and
    util_is_hex_color(dark_tint_1)     and util_is_hex_color(dark_tint_2)     and util_is_hex_color(dark_tint_3)
  )
);

create trigger site_themes_updated_at
before update on public.site_themes
for each row execute function set_updated_at();

-- Exactly one default theme at most
create unique index if not exists site_themes_one_default
  on public.site_themes ((true))
  where is_default = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.site_themes enable row level security;

-- Public read policy (idempotent)
do $$
begin
  create policy "Public read active themes"
  on public.site_themes for select
  to anon, authenticated
  using (is_active = true);
exception
  when duplicate_object then null;
end $$;

-- Admin manage policy (idempotent)
do $$
begin
  create policy "Admins manage themes"
  on public.site_themes for all
  to authenticated
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin','staff'), false))
  with check (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin','staff'), false));
exception
  when duplicate_object then null;
end $$;


-- Note: The "current theme" logic is handled in the view below; this policy simply
-- allows selecting rows. If you want to hide non-in-window rows from anon entirely,
-- you can tighten the SELECT policy to replicate the in-window predicate.

-- ─────────────────────────────────────────────────────────────────────────────
-- View: v_site_theme_current
--   Picks one "current" theme based on:
--     1) In-window yearly recurrence (if recurrence='yearly')
--     2) In-window one-off window (start_at/end_at)
--     3) Fallback to default theme
--   Handles wrap-around yearly windows (e.g., 12-20 .. 01-05)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace view public.v_site_theme_current as
with eligible as (
  select
    t.*,
    -- Is this theme "in-window" right now?
    case
      when t.is_active is not true then false
      when t.recurrence = 'yearly' then (
        -- Compare month-day in the theme's timezone
        with current_md as (
          select to_char((now() at time zone t.timezone)::date, 'MM-DD') as md
        )
        select case
          -- Same-year window (e.g., 06-01..08-31)
          when t.yearly_start_md <= t.yearly_end_md then
            (md >= t.yearly_start_md and md <= t.yearly_end_md)
          -- Wrap across New Year (e.g., 12-20..01-05)
          else
            (md >= t.yearly_start_md or  md <= t.yearly_end_md)
        end
        from current_md
      )
      else (
        -- one-off window (or always if both null)
        (t.start_at is null or now() >= t.start_at)
        and (t.end_at   is null or now() <  t.end_at)
      )
    end as in_window
  from public.site_themes t
),
pick as (
  select *
  from eligible
  order by
    in_window desc,              -- prefer in-window themes
    (recurrence = 'yearly') desc,-- prefer recurring windows over one-off if both match
    start_at desc nulls last,    -- then the most recently-started one-off
    is_default desc,             -- else default
    created_at desc
  limit 1
)
select * from pick;
