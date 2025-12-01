
-- ─────────────────────────────────────────────────────────────────────────────
-- Addresses 
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.addresses (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null,
  label                text,                      -- "Home", "Work", etc.
  full_name            text not null,
  line1                text not null,
  line2                text,
  city                 text not null,
  region               text,                      -- state/province
  postal_code          text not null,
  country_code         text not null,             -- ISO 3166-1 alpha-2 (e.g. "US")
  phone                text,
  is_default_shipping  boolean not null default false,
  is_default_billing   boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists addresses_user_idx on public.addresses(user_id);
create index if not exists addresses_defaults_idx on public.addresses(user_id, is_default_shipping, is_default_billing);

-- updated_at trigger
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

drop trigger if exists set_addresses_updated_at on public.addresses;
create trigger set_addresses_updated_at
before update on public.addresses
for each row execute procedure public.tg_set_updated_at();

-- RLS for addresses
alter table public.addresses enable row level security;

drop policy if exists "Users read own addresses" on public.addresses;
create policy "Users read own addresses"
on public.addresses for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users manage own addresses" on public.addresses;
create policy "Users manage own addresses"
on public.addresses for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Admins
drop policy if exists "Admins manage all addresses" on public.addresses;
create policy "Admins manage all addresses"
on public.addresses for all
to authenticated
using (coalesce((auth.jwt() ->> 'role') in ('admin','staff'), false))
with check (coalesce((auth.jwt() ->> 'role') in ('admin','staff'), false));